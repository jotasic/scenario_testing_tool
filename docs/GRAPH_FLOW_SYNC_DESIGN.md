# Graph-Flow Synchronization Design Document

## 1. Context

### 1.1 Current State

The scenario tool has a visual graph editor (React Flow) and a sidebar StepList, both representing the same data. The goal is to provide a TRUE NO-CODE experience where users can edit the flow visually and have everything stay synchronized.

### 1.2 Problem Statement

Users need bidirectional synchronization between:
- **Graph Editor** (visual canvas with nodes and edges)
- **Redux Store** (single source of truth)
- **Step List** (sidebar list of steps)

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interactions                              │
└─────────────────────────┬────────────────────────────┬──────────────────┘
                          │                            │
              ┌───────────▼────────────┐    ┌─────────▼────────────┐
              │      GraphEditor       │    │       StepList       │
              │  (FlowCanvas wrapper)  │    │   (Sidebar list)     │
              └───────────┬────────────┘    └─────────┬────────────┘
                          │                           │
                          │  dispatch actions         │  dispatch actions
                          │                           │
              ┌───────────▼───────────────────────────▼────────────┐
              │                   Redux Store                       │
              │              (scenariosSlice.ts)                    │
              │                                                     │
              │  scenarios[].steps[]  ←→  scenarios[].edges[]      │
              └───────────────────────────────────────────────────┬─┘
                                                                  │
                          ┌───────────────────────────────────────┘
                          │  selector hooks (useCurrentSteps, etc.)
                          ▼
              ┌───────────────────────────────────────────────────┐
              │              UI Components Re-render              │
              │   (Both GraphEditor and StepList see new data)    │
              └───────────────────────────────────────────────────┘
```

---

## 2. Current Sync Status Analysis

### 2.1 Graph to Redux Sync (CURRENTLY IMPLEMENTED)

| Action | Implemented | Location | Notes |
|--------|-------------|----------|-------|
| Add node via toolbar | YES | `GraphEditor.tsx:127-141` | Creates step via `addStep` action |
| Delete node (Delete key) | YES | `GraphEditor.tsx:160-163` | Uses `deleteStep` action |
| Move node (drag) | YES | `GraphEditor.tsx:149-157` | Updates `step.position` |
| Create edge (connect handles) | YES | `GraphEditor.tsx:187-206` | Uses `addEdge` action |
| Delete edge (Delete key) | YES | `GraphEditor.tsx:172-180` | Uses `deleteEdge` action |

### 2.2 StepList to Redux Sync (CURRENTLY IMPLEMENTED)

| Action | Implemented | Location | Notes |
|--------|-------------|----------|-------|
| Add step from menu | YES | `StepList.tsx:64-122` | Creates step with default position |
| Delete step (trash icon) | YES | `StepList.tsx:128-137` | Uses `deleteStep` action |
| Select step | YES | `StepList.tsx:124-126` | Uses `setSelectedStep` |
| Reorder steps | NO | N/A | Missing drag-and-drop reorder |

### 2.3 Redux to UI Sync (CURRENTLY IMPLEMENTED)

| Direction | Implemented | Mechanism |
|-----------|-------------|-----------|
| Redux → Graph | YES | `FlowCanvas.tsx:117-124` uses `useMemo` to rebuild nodes/edges |
| Redux → StepList | YES | `StepList.tsx:52` uses `useCurrentSteps()` selector |

### 2.4 Key Observations

1. **Basic sync is working**: Both GraphEditor and StepList dispatch Redux actions, and both subscribe to Redux state via selectors.

2. **Redux is the single source of truth**: All UI components read from Redux and dispatch actions to modify state.

3. **FlowCanvas properly converts Redux state to React Flow format** (lines 44-85).

---

## 3. Gaps Identified

### 3.1 CRITICAL: Edge Semantics Not Reflected in Steps

**Current Problem**: Edges are stored separately in `scenario.edges[]` but have NO semantic connection to step logic.

**Impact**: 
- Creating an edge in the graph does NOT update the source step's `nextStepId` or `branches`
- Condition and Request branches are defined in the step, but graph edges may not match
- Execution engine cannot determine flow from edges alone

**Evidence**:
- `ScenarioEdge` type (scenario.ts:13-26) only stores visual connection data
- `Branch` type (branch.ts:10-21) has `nextStepId` which should be synced with edges
- No reducer syncs edge changes to step branches

### 3.2 CRITICAL: Branch Handles Not Connected to Edge Logic

**Current Problem**: Condition and Request nodes have branch handles, but:
- Creating a branch does not auto-create an edge
- Connecting an edge to a branch handle does not update the branch's `nextStepId`

**Evidence**:
- `ConditionNode.tsx:157-170` renders handles for each branch
- `handleConnect` in `GraphEditor.tsx:187-206` creates edge but doesn't update step branches

### 3.3 MODERATE: Loop Child Steps Not Visualized

**Current Problem**: Loop steps have `stepIds[]` for child steps, but:
- No visual representation of parent-child relationship in graph
- No way to assign steps to a loop from the graph

**Evidence**:
- `LoopStep.stepIds` (step.ts:120-122) stores child step IDs
- `LoopNode.tsx` shows count but no visual grouping

### 3.4 MODERATE: Start Step Not Enforced

**Current Problem**: `scenario.startStepId` exists but:
- No visual indicator of which node is the start
- No way to set start step from graph

### 3.5 MINOR: Missing Step Reorder in StepList

**Current Problem**: Cannot drag-and-drop to reorder steps in the list.

### 3.6 MINOR: Duplicate Edge Prevention

**Current Problem**: No validation to prevent duplicate edges between same nodes.

---

## 4. Design for Proper Bidirectional Sync

### 4.1 Edge Semantics Definition

Edges should have meaning based on the source step type:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Edge Semantic Model                              │
├─────────────────┬──────────────────────────────────────────────────────┬─┤
│ Source Step     │ Edge Type                                            │ │
│ Type            │                                                      │ │
├─────────────────┼──────────────────────────────────────────────────────┤ │
│ request         │ Default flow (bottom handle) → nextStepId           │ │
│                 │ Branch handle → branch.nextStepId                   │ │
├─────────────────┼──────────────────────────────────────────────────────┤ │
│ condition       │ Branch handle → branch.nextStepId                   │ │
│                 │ (no default handle if branches exist)               │ │
├─────────────────┼──────────────────────────────────────────────────────┤ │
│ loop            │ Default flow → nextStepId (after loop completes)    │ │
│                 │ Child connection (special) → adds to stepIds[]      │ │
├─────────────────┼──────────────────────────────────────────────────────┤ │
│ group           │ Same as loop for children                           │ │
└─────────────────┴──────────────────────────────────────────────────────┴─┘
```

### 4.2 Proposed Data Flow

```
                    ┌────────────────────────────────┐
                    │         User Action            │
                    └───────────────┬────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Graph: Connect  │     │ Graph: Delete   │     │ StepEditor:     │
│ Edge            │     │ Edge            │     │ Add Branch      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Enhanced Redux Actions                        │
│                                                                 │
│  addEdgeWithSync({scenarioId, edge, updateStepBranch: true})   │
│  deleteEdgeWithSync({scenarioId, edgeId})                       │
│  addBranchWithEdge({scenarioId, stepId, branch})               │
│  updateBranchNextStep({scenarioId, stepId, branchId, nextId})  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Redux Reducers                               │
│                                                                 │
│  1. Update scenario.edges[]                                     │
│  2. Update corresponding step.branches[].nextStepId             │
│  3. OR update step.nextStepId for default flow                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UI Auto-Updates                             │
│                                                                 │
│  - FlowCanvas re-renders with new edges                         │
│  - StepList shows updated step configuration                    │
│  - StepEditor shows branch connections                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Enhanced Type Definitions

```typescript
// Enhanced ScenarioEdge - add semantic type
export interface ScenarioEdge {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  sourceHandle?: string;      // Branch ID or 'default'
  label?: string;
  animated?: boolean;
  
  // NEW: Semantic type for execution engine
  edgeType: 'default' | 'branch' | 'loop-child';
}

// Enhanced BaseStep - add optional nextStepId for linear flow
export interface BaseStep {
  // ... existing fields ...
  
  // NEW: Default next step for non-branching flow
  nextStepId?: string;
}
```

### 4.4 New Redux Actions

```typescript
// scenariosSlice.ts - New actions needed

/**
 * Creates edge AND updates source step's branch/nextStepId
 */
connectSteps: (state, action: PayloadAction<{
  scenarioId: string;
  sourceStepId: string;
  targetStepId: string;
  sourceHandle?: string;  // Branch ID or undefined for default
}>) => {
  // 1. Create edge
  // 2. If sourceHandle is a branch ID, update that branch's nextStepId
  // 3. If sourceHandle is undefined, update step's nextStepId
}

/**
 * Removes edge AND clears the corresponding branch/nextStepId
 */
disconnectSteps: (state, action: PayloadAction<{
  scenarioId: string;
  edgeId: string;
}>) => {
  // 1. Find the edge
  // 2. Clear the source step's branch.nextStepId or step.nextStepId
  // 3. Remove the edge
}

/**
 * Adds branch to step AND creates corresponding edge if nextStepId provided
 */
addBranchWithSync: (state, action: PayloadAction<{
  scenarioId: string;
  stepId: string;
  branch: Branch;
}>) => {
  // 1. Add branch to step
  // 2. If branch.nextStepId exists, create edge
}

/**
 * Sets which child steps belong to a loop/group
 */
setLoopChildren: (state, action: PayloadAction<{
  scenarioId: string;
  loopStepId: string;
  childStepIds: string[];
}>) => {
  // 1. Update loopStep.stepIds
  // 2. Create/remove edges as needed
}
```

---

## 5. Files Requiring Modification

### 5.1 Redux Store

| File | Changes | Priority |
|------|---------|----------|
| `src/store/scenariosSlice.ts` | Add new sync actions: `connectSteps`, `disconnectSteps`, `addBranchWithSync`, `setLoopChildren` | HIGH |
| `src/types/step.ts` | Add `nextStepId?: string` to `BaseStep` | HIGH |
| `src/types/scenario.ts` | Add `edgeType` to `ScenarioEdge` | MEDIUM |

### 5.2 Graph Components

| File | Changes | Priority |
|------|---------|----------|
| `src/components/flow/GraphEditor.tsx` | Use new `connectSteps`/`disconnectSteps` actions instead of raw edge actions | HIGH |
| `src/components/flow/FlowCanvas.tsx` | No changes needed (already rebuilds from Redux) | NONE |
| `src/components/flow/nodes/RequestNode.tsx` | Add default `nextStepId` source handle | LOW |
| `src/components/flow/nodes/ConditionNode.tsx` | Ensure branch handles match Branch IDs | LOW |
| `src/components/flow/nodes/LoopNode.tsx` | Add visual grouping for child steps | MEDIUM |

### 5.3 Step Components

| File | Changes | Priority |
|------|---------|----------|
| `src/components/steps/StepList.tsx` | Add drag-and-drop reorder | LOW |
| `src/components/steps/StepEditor.tsx` | Show connection status for branches | MEDIUM |

### 5.4 Pages

| File | Changes | Priority |
|------|---------|----------|
| `src/pages/ConfigPage.tsx` | Use new sync actions in handlers | HIGH |

---

## 6. Implementation Priority

### Phase 1: Core Edge-Step Sync (HIGH PRIORITY)

1. **Add `nextStepId` to BaseStep type** - Simple type change
2. **Create `connectSteps` action** - Core sync logic
3. **Create `disconnectSteps` action** - Core sync logic  
4. **Update GraphEditor to use sync actions** - Wire up new actions
5. **Update ConfigPage handlers** - Wire up new actions

### Phase 2: Branch Management (MEDIUM PRIORITY)

6. **Create `addBranchWithSync` action** - Branch management
7. **Update StepEditor for branch connections** - Show which step each branch connects to
8. **Add branch connection UI** - Dropdown to select target step

### Phase 3: Loop/Group Children (MEDIUM PRIORITY)

9. **Create `setLoopChildren` action** - Loop management
10. **Add visual grouping in LoopNode** - Show children
11. **Add child assignment UI** - Drag steps into loop

### Phase 4: Polish (LOW PRIORITY)

12. **Add start step indicator** - Visual cue for start
13. **Add drag-and-drop in StepList** - Reorder steps
14. **Add duplicate edge prevention** - Validation
15. **Add edge labels** - Show branch conditions on edges

---

## 7. Detailed Implementation: connectSteps Action

```typescript
connectSteps: (
  state,
  action: PayloadAction<{
    scenarioId: string;
    sourceStepId: string;
    targetStepId: string;
    sourceHandle?: string;
  }>
) => {
  const { scenarioId, sourceStepId, targetStepId, sourceHandle } = action.payload;
  const scenario = state.scenarios.find(s => s.id === scenarioId);
  if (!scenario) return;

  const sourceStep = scenario.steps.find(s => s.id === sourceStepId);
  if (!sourceStep) return;

  // Prevent duplicate edges
  const existingEdge = scenario.edges.find(
    e => e.sourceStepId === sourceStepId && 
         e.targetStepId === targetStepId &&
         e.sourceHandle === sourceHandle
  );
  if (existingEdge) return;

  // Create edge
  const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newEdge: ScenarioEdge = {
    id: edgeId,
    sourceStepId,
    targetStepId,
    sourceHandle,
    edgeType: sourceHandle ? 'branch' : 'default',
  };
  scenario.edges.push(newEdge);

  // Update step based on handle type
  if (sourceHandle) {
    // Branch connection - find and update the branch
    if (sourceStep.type === 'condition' || sourceStep.type === 'request') {
      const stepWithBranches = sourceStep as ConditionStep | RequestStep;
      if (stepWithBranches.branches) {
        const branch = stepWithBranches.branches.find(b => b.id === sourceHandle);
        if (branch) {
          branch.nextStepId = targetStepId;
        }
      }
    }
  } else {
    // Default connection - update nextStepId
    (sourceStep as BaseStep).nextStepId = targetStepId;
  }

  scenario.updatedAt = new Date().toISOString();
}
```

---

## 8. Risk Mitigation

### 8.1 Migration Risk

**Risk**: Existing scenarios may have edges that don't match step branches.

**Mitigation**: 
- Add migration function to sync existing edges with step branches on load
- Make sync tolerant of mismatches during transition

### 8.2 Circular Reference Risk

**Risk**: User creates circular flow (A → B → A).

**Mitigation**:
- Allow circular flows (they are valid for some scenarios)
- Add visual warning for potential infinite loops
- Execution engine already needs loop detection

### 8.3 Performance Risk

**Risk**: Large scenarios with many edges could slow down sync.

**Mitigation**:
- Current implementation already efficient (single reducer update)
- Consider batching for bulk operations

---

## 9. Summary

### Current Status
- **Graph → Redux**: WORKING (add/delete nodes, edges, positions)
- **StepList → Redux**: WORKING (add/delete steps, select)
- **Redux → UI**: WORKING (selectors trigger re-renders)

### Key Gap
- **Edge semantics not synced to step data**: Creating visual edges does not update step branches or nextStepId

### Solution
- Introduce `connectSteps`/`disconnectSteps` actions that update BOTH edges AND step data
- Add `nextStepId` to BaseStep for linear flow
- Optionally add `edgeType` to ScenarioEdge for execution engine

### Implementation Order
1. Type changes (add nextStepId)
2. New Redux actions (connectSteps, disconnectSteps)
3. Wire up GraphEditor and ConfigPage
4. Branch and loop enhancements
5. UI polish

This design ensures a TRUE NO-CODE experience where visual edits in the graph are fully reflected in the execution model, and vice versa.
