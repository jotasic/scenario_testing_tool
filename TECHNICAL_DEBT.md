# Technical Debt Documentation

## 1. Dual Source of Truth: Flow Edges vs Branch NextStepId

### Problem Description

The scenario flow topology is stored in TWO different data structures that must stay synchronized bidirectionally:

**Location 1: `scenario.edges[]` Array**
```typescript
// In Scenario type (src/types/scenario.ts:13-26)
interface ScenarioEdge {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  sourceHandle?: string;  // e.g., "branch_xyz" for condition branches
}

// Example edge for branching
{
  id: 'edge_123',
  sourceStepId: 'step_condition_1',
  targetStepId: 'step_success',
  sourceHandle: 'branch_abc'
}
```

**Location 2: Step Properties**
```typescript
// For ConditionStep/RequestStep with branches (src/types/step.ts:107-111)
interface ConditionStep {
  type: "condition";
  branches: Branch[];  // Each branch has:
                       //   id: 'branch_abc'
                       //   nextStepId: 'step_success'  // DUPLICATE!
}

// For LoopStep/GroupStep (src/types/step.ts:116-135)
interface LoopStep {
  type: "loop";
  stepIds: string[];  // Contains 'step_success'
}
```

### The Synchronization Problem

When a user adds an edge in React Flow, BOTH must be updated:
1. The edge is added to `scenario.edges`
2. The corresponding step property is updated (`branch.nextStepId` or `step.stepIds`)

When an edge is deleted, BOTH must be cleaned up:
1. The edge is removed from `scenario.edges`
2. The corresponding step property is cleared

**This is currently handled in `src/store/scenariosSlice.ts:171-271`**

### Why It Exists (Trade-offs)

**React Flow Requirement (Edges Array)**
- React Flow's internal data model requires edges to be in a separate array
- It's the standard way to represent graph connections in graph visualization libraries
- Enables easy edge manipulation, styling, and rendering

**Execution Engine Requirement (Branch NextStepId)**
- The execution engine in `src/engine/scenarioExecutor.ts` uses `branch.nextStepId` to determine control flow
- During execution (lines 783, 787, 794, 798):
  ```typescript
  // Engine directly reads branch.nextStepId
  const nextStepId = this.evaluateBranches(step.branches);
  // Returns: defaultBranch.nextStepId || null
  ```
- Using this property is more convenient than querying edges by sourceHandle
- Would require significant refactoring of execution logic to use edges instead

### Current Synchronization Mechanism

**Adding an Edge** (`scenariosSlice.ts:216-240`)
```typescript
addEdge: (state, action) => {
  // 1. Push edge to scenario.edges
  scenario.edges.push(edge);

  // 2. Find source step
  const sourceStep = scenario.steps.find(s => s.id === edge.sourceStepId);

  // 3. Update step property based on handle type
  if (edge.sourceHandle?.startsWith('branch_')) {
    // For branches: set branch.nextStepId = targetStepId
    const branch = sourceStep.branches?.find(b => b.id === edge.sourceHandle);
    if (branch) {
      branch.nextStepId = edge.targetStepId;
    }
  } else if (edge.sourceHandle === 'loop-body') {
    // For loops: add to stepIds
    sourceStep.stepIds.push(edge.targetStepId);
  }
}
```

**Deleting an Edge** (`scenariosSlice.ts:280-321`)
```typescript
deleteEdge: (state, action) => {
  // 1. Find the edge BEFORE deleting (need its data for cleanup)
  const edge = scenario.edges.find(e => e.id === edgeId);

  // 2. Clear step property
  if (edge.sourceHandle?.startsWith('branch_')) {
    const branch = sourceStep.branches?.find(b => b.id === edge.sourceHandle);
    if (branch) {
      branch.nextStepId = '';  // Important: empty string, not undefined
    }
  } else if (edge.sourceHandle === 'loop-body') {
    sourceStep.stepIds = sourceStep.stepIds.filter(id => id !== edge.targetStepId);
  }

  // 3. Remove from edges array
  scenario.edges = scenario.edges.filter(e => e.id !== edgeId);
}
```

**Related Cleanup** (`scenariosSlice.ts:117-127`)

When a step is deleted, we must also clear its references from other steps:
```typescript
deleteStep: (state, action) => {
  // Clear branch references
  scenario.steps.forEach(step => {
    if ((step.type === 'condition' || step.type === 'request') && step.branches) {
      step.branches.forEach(branch => {
        if (branch.nextStepId === deletedStepId) {
          branch.nextStepId = '';  // Clear reference
        }
      });
    }
  });
}
```

### Known Issues and Risks

**1. Sync Gaps (HIGH RISK)**

If synchronization is incomplete, edge and step can diverge:

```typescript
// Scenario: Edge deleted but branch.nextStepId NOT cleared
{
  edges: [],  // Edge removed
  steps: [{
    type: "condition",
    branches: [{
      id: 'branch_abc',
      nextStepId: 'step_success'  // DANGLING REFERENCE!
    }]
  }]
}
```

**Impact during execution:**
- `evaluateBranches()` reads `branch.nextStepId = 'step_success'`
- Tries to jump to 'step_success'
- Step exists, but edge isn't rendered in UI
- Confusing state for users

**2. No Runtime Validation**

There's no validation that ensures consistency:
- No check that every edge has a corresponding step property
- No check that every step property has a corresponding edge
- Divergence only discovered through runtime errors or UI inconsistencies

**3. Undo/Redo Complexity**

Redux Undo wraps all changes. If sync logic fails mid-action:
- Undo may restore one representation but not the other
- Redo may create inconsistencies

**4. Hard to Debug**

When inconsistencies occur:
- No clear error message showing which representation is wrong
- Must manually inspect both edges and steps to find divergence
- Difficult to trace which reducer caused the problem

**5. Future Modifications at Risk**

New features that manipulate edges or steps must remember to sync both:
```typescript
// If someone adds a new reducer without proper sync:
updateBranch: (state, action) => {
  const branch = findBranch(state, action.payload.branchId);
  branch.nextStepId = action.payload.newNextStepId;
  // OOPS! Forgot to update corresponding edge
  // Now edge and branch are out of sync
}
```

### Example Problematic Scenarios

**Scenario 1: Incomplete Edge Deletion**
```
User deletes edge in React Flow
→ addEdge/deleteEdge reducer called
→ Sync logic has a bug and only removes from edges array
→ branch.nextStepId still points to target step
→ UI shows no connection, but execution engine still uses it
→ User confusion: "Why does execution work if I deleted the edge?"
```

**Scenario 2: Multiple Mutations**
```
User reorders branches (changes branch IDs)
→ Edges still reference old branch IDs
→ Sync logic can't find the branch to update
→ Edge targetStepId doesn't match any branch.nextStepId
→ Execution follows wrong branch
```

**Scenario 3: Undo/Redo Edge Case**
```
Undoable action: Add edge
→ Both edge and branch.nextStepId are set
Later: Undo that action
→ Edge is removed from history
→ But branch.nextStepId might not be restored
→ Inconsistency in undone state
```

## Future Migration Path

### Phase 1: Validation (Low Risk)

Add runtime checks to detect divergence:

```typescript
// New utility function
function validateEdgeSync(scenario: Scenario): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check every edge has corresponding step property
  scenario.edges.forEach(edge => {
    const step = scenario.steps.find(s => s.id === edge.sourceStepId);
    if (!step) {
      errors.push(`Edge ${edge.id} references non-existent step ${edge.sourceStepId}`);
      return;
    }

    if (edge.sourceHandle?.startsWith('branch_')) {
      const branch = step.branches?.find(b => b.id === edge.sourceHandle);
      if (!branch) {
        errors.push(`Edge ${edge.id} references non-existent branch ${edge.sourceHandle}`);
      } else if (branch.nextStepId !== edge.targetStepId) {
        errors.push(`Edge ${edge.id} and branch.nextStepId are out of sync`);
      }
    }
  });

  return { isValid: errors.length === 0, errors };
}
```

Add to scenario loading to detect corruption:
```typescript
function loadScenarios(state, action) {
  state.scenarios = action.payload.map(scenario => {
    const validation = validateEdgeSync(scenario);
    if (!validation.isValid) {
      console.error(`Scenario ${scenario.id} failed validation:`, validation.errors);
      // Could auto-repair or alert user
    }
    return scenario;
  });
}
```

### Phase 2: Single Source (Medium Complexity)

Option A: Edges-first approach
- Keep scenario.edges as the single source of truth
- Derive step properties at runtime (when needed for execution)
- Requires caching for performance

```typescript
// In execution engine
function getNextStepFromEdge(scenario: Scenario, step: Step, handleId: string): string {
  const edge = scenario.edges.find(e =>
    e.sourceStepId === step.id &&
    e.sourceHandle === handleId
  );
  return edge?.targetStepId || '';
}
```

Option B: Step properties as source
- Keep branch.nextStepId and step.stepIds as single source
- Remove scenario.edges, generate them on-demand for React Flow
- Requires conversion layer for React Flow

```typescript
// Generate edges from step properties
function generateEdgesFromSteps(steps: Step[]): ScenarioEdge[] {
  const edges: ScenarioEdge[] = [];

  steps.forEach(step => {
    if ((step.type === 'condition' || step.type === 'request') && step.branches) {
      step.branches.forEach(branch => {
        if (branch.nextStepId) {
          edges.push({
            id: `edge_${step.id}_${branch.id}`,
            sourceStepId: step.id,
            targetStepId: branch.nextStepId,
            sourceHandle: branch.id
          });
        }
      });
    }
  });

  return edges;
}
```

### Phase 3: Unit Tests

Add comprehensive tests for edge sync:

```typescript
describe('Edge Synchronization', () => {
  test('addEdge syncs to branch.nextStepId', () => {
    // Add edge with sourceHandle = 'branch_123'
    // Assert branch with id='branch_123' has nextStepId = targetStepId
  });

  test('deleteEdge clears branch.nextStepId', () => {
    // Add edge, then delete it
    // Assert branch.nextStepId is cleared
  });

  test('undo restores both edge and branch', () => {
    // Add edge, undo
    // Assert both edge and branch are restored consistently
  });
});
```

### When to Address This

**High Priority If:**
- Bugs appear related to edge/branch sync
- New features require frequent edge mutations
- Team grows and sync logic becomes maintenance burden
- Plan to support edge editing UI (reordering, reconnecting)

**Can Wait If:**
- Current sync logic is stable (no bug reports)
- Execution engine rarely changes
- No planned UI enhancements to flow editing

**Estimated Effort:**
- Phase 1 (Validation): 2-4 hours
- Phase 2 (Single Source): 8-16 hours (depends on option chosen)
- Phase 3 (Tests): 4-8 hours
- Integration & Cleanup: 2-4 hours
- **Total: 16-32 hours for full refactor**

## 2. Other Known Technical Debt

(Placeholder for future items)

Document other technical debt items as they are identified:
- Complex nested step visualization
- Performance optimization for large scenarios
- Storage synchronization edge cases
- etc.
