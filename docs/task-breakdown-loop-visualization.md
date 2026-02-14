# Loop Execution Visualization - Task Breakdown

## Problem Statement

Users report that execution visualization works well initially, but when loops are added, it's impossible to tell:
1. Which loop iteration is currently executing
2. Which loop is executing (in nested loop scenarios)
3. Visual progress within the loop

## Current State Analysis

### Existing Infrastructure
- **LoopContext** (`/src/types/execution.ts`): Already tracks `currentIndex`, `totalIterations`, `loopId`, `loopName`
- **loopContextStack** in ExecutionContext: Supports nested loop tracking
- **StepExecutionResult**: Has `iterations` and `currentIteration` fields (lines 83-86)
- **scenarioExecutor.ts**: Updates loop iteration in stepResults (lines 588-596)
- **LoopNode.tsx**: Displays iteration progress (lines 248-268) and has progress bar (lines 210-223)

### Identified Gaps
1. **No real-time iteration updates**: Loop iteration is only shown in final result
2. **Nested loop context not visible**: loopContextStack not exposed to UI components
3. **No loop hierarchy breadcrumb**: Users can't see which nested loop they're in
4. **Progress table missing loop context**: ExecutionProgressTable doesn't show iteration info for child steps
5. **No visual differentiation**: Steps inside loops don't show which iteration is executing

---

## Task Breakdown

### Phase 1: Data Layer Enhancement (P0 - Foundation)

#### Task 1.1: Enhance Execution Types
**Agent**: Backend/Types Agent
**Priority**: P0
**File**: `/src/types/execution.ts`
**Dependencies**: None
**Acceptance Criteria**:
- Add `loopIterationState` to StepExecutionResult for tracking current loop context
- Add `activeLoopStack` to ExecutionContext for real-time loop hierarchy
- Define `LoopIterationSnapshot` type with `loopId`, `loopName`, `iteration`, `total`, `depth`

**Technical Details**:
```typescript
export interface LoopIterationSnapshot {
  loopId: string;
  loopName: string;
  currentIteration: number;
  totalIterations: number;
  depth: number; // 0 = outermost, 1 = first nested, etc.
}

export interface StepExecutionResult {
  // ... existing fields
  loopIterationState?: LoopIterationSnapshot[]; // Stack of active loops when this step executed
}

export interface ExecutionContext {
  // ... existing fields
  activeLoopStack: LoopIterationSnapshot[]; // Real-time loop state
}
```

**Estimated Effort**: 2 hours

---

#### Task 1.2: Update executionSlice Actions
**Agent**: State Management Agent
**Priority**: P0
**File**: `/src/store/executionSlice.ts`
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- Add `updateActiveLoopStack` action to set current loop hierarchy
- Add `updateLoopIterationProgress` action for real-time iteration updates
- Ensure actions properly update `activeLoopStack` in ExecutionContext

**Technical Details**:
```typescript
updateActiveLoopStack: (state, action: PayloadAction<LoopIterationSnapshot[]>) => {
  if (state.context) {
    state.context.activeLoopStack = action.payload;
  }
},

updateLoopIterationProgress: (
  state,
  action: PayloadAction<{ loopId: string; currentIteration: number }>
) => {
  if (state.context) {
    const idx = state.context.activeLoopStack.findIndex(
      l => l.loopId === action.payload.loopId
    );
    if (idx !== -1) {
      state.context.activeLoopStack[idx].currentIteration =
        action.payload.currentIteration;
    }
  }
}
```

**Estimated Effort**: 3 hours

---

#### Task 1.3: Enhance scenarioExecutor Loop Tracking
**Agent**: Execution Engine Agent
**Priority**: P0
**File**: `/src/engine/scenarioExecutor.ts`
**Dependencies**: Task 1.1, Task 1.2
**Acceptance Criteria**:
- Convert loopContextStack to LoopIterationSnapshot[] before dispatching
- Dispatch `updateActiveLoopStack` when entering/exiting loops
- Dispatch `updateLoopIterationProgress` on each iteration
- Attach loop state snapshot to each step result executed within loops

**Technical Details**:
```typescript
// In executeLoopStep method (around line 581)
const loopSnapshot: LoopIterationSnapshot = {
  loopId: step.id,
  loopName: step.variableName || step.name,
  currentIteration: iteration,
  totalIterations: iterator.totalIterations,
  depth: this.loopContextStack.length
};

// Push to internal stack and dispatch
this.loopContextStack.push(loopContext);
this.dispatchActiveLoopStack(); // New helper method

// On each iteration
this.callbacks.onLoopIterationUpdate?.({
  loopId: step.id,
  currentIteration: iteration,
  totalIterations: iterator.totalIterations
});
```

**Estimated Effort**: 4 hours

---

### Phase 2: UI Component Development (P0 - Core Visualization)

#### Task 2.1: Create LoopIterationIndicator Component
**Agent**: UI Component Agent
**Priority**: P0
**File**: `/src/components/execution/LoopIterationIndicator.tsx` (new)
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- Display single loop iteration info (e.g., "Iteration 3/10")
- Show progress bar for current loop
- Compact design suitable for inline embedding
- Support different sizes (small, medium, large)

**Component API**:
```typescript
interface LoopIterationIndicatorProps {
  loopName: string;
  currentIteration: number;
  totalIterations: number;
  size?: 'small' | 'medium' | 'large';
  showProgressBar?: boolean;
}
```

**Visual Design**:
- Chip with loop icon + "3/10" text
- Optional progress bar below
- Color-coded by status (running = blue, completed = green)

**Estimated Effort**: 3 hours

---

#### Task 2.2: Create NestedLoopBreadcrumb Component
**Agent**: UI Component Agent
**Priority**: P0
**File**: `/src/components/execution/NestedLoopBreadcrumb.tsx` (new)
**Dependencies**: Task 1.1, Task 2.1
**Acceptance Criteria**:
- Display breadcrumb trail of nested loops (e.g., "Loop A [2/5] > Loop B [1/3]")
- Clickable breadcrumb items to inspect each loop level
- Compact horizontal layout
- Auto-collapse if more than 3 levels deep

**Component API**:
```typescript
interface NestedLoopBreadcrumbProps {
  loopStack: LoopIterationSnapshot[];
  onLoopClick?: (loopId: string) => void;
  maxDisplayDepth?: number;
}
```

**Visual Design**:
- Breadcrumb with chevron separators
- Each level shows: `LoopName [iteration/total]`
- Overflow handling for deep nesting

**Estimated Effort**: 4 hours

---

#### Task 2.3: Enhance LoopNode with Real-Time Iteration Display
**Agent**: UI Component Agent
**Priority**: P1
**File**: `/src/components/flow/nodes/LoopNode.tsx`
**Dependencies**: Task 1.3, Task 2.1
**Acceptance Criteria**:
- Subscribe to activeLoopStack changes
- Update iteration display in real-time during execution
- Show nested loop indicator if this loop is inside another loop
- Highlight currently executing iteration

**Technical Details**:
```typescript
// Use selector to get loop state
const loopState = useSelector((state) =>
  state.execution.context?.activeLoopStack.find(l => l.loopId === step.id)
);

// Display in header section
{loopState && (
  <LoopIterationIndicator
    loopName={loopState.loopName}
    currentIteration={loopState.currentIteration}
    totalIterations={loopState.totalIterations}
    size="small"
    showProgressBar={true}
  />
)}
```

**Estimated Effort**: 3 hours

---

#### Task 2.4: Update ExecutionProgressTable with Loop Context
**Agent**: UI Component Agent
**Priority**: P1
**File**: `/src/components/execution/ExecutionProgressTable.tsx`
**Dependencies**: Task 1.3, Task 2.1
**Acceptance Criteria**:
- Add "Loop Context" column showing which loop(s) a step is executing in
- Display iteration info for steps inside loops
- Visual indentation for nested loop steps
- Show loop breadcrumb for nested scenarios

**Technical Details**:
```typescript
// Add column in TableHead
<TableCell sx={{ fontWeight: 'bold' }}>Loop Context</TableCell>

// In TableBody row
<TableCell>
  {result.loopIterationState && result.loopIterationState.length > 0 && (
    <NestedLoopBreadcrumb
      loopStack={result.loopIterationState}
      maxDisplayDepth={2}
    />
  )}
</TableCell>
```

**Changes**:
- Update column widths to accommodate new column
- Add visual indicators (icons) for loop nesting depth
- Color-code by loop depth (subtle background colors)

**Estimated Effort**: 4 hours

---

#### Task 2.5: Enhance StepDetailPanel with Loop Context Tab
**Agent**: UI Component Agent
**Priority**: P2
**File**: `/src/components/execution/StepDetailPanel.tsx`
**Dependencies**: Task 1.3, Task 2.2
**Acceptance Criteria**:
- Add "Loop Context" tab for steps executed inside loops
- Display complete loop hierarchy with iteration details
- Show loop variable values (item, index) at each level
- Format loop context in readable tree structure

**Technical Details**:
```typescript
// Add tab if step has loop context
{stepResult?.loopIterationState && stepResult.loopIterationState.length > 0 && (
  <Tab label="Loop Context" value={tabs.length} />
)}

// Tab content
<TabPanel value={activeTab} index={loopContextTabIndex}>
  <LoopContextDisplay loopStack={stepResult.loopIterationState} />
</TabPanel>
```

**Estimated Effort**: 3 hours

---

### Phase 3: Enhanced Visualization Features (P1 - Polish)

#### Task 3.1: Add Loop Progress Overlay to FlowCanvas
**Agent**: UI Component Agent
**Priority**: P1
**File**: `/src/components/flow/FlowCanvas.tsx`
**Dependencies**: Task 2.2
**Acceptance Criteria**:
- Overlay panel showing active loop stack during execution
- Positioned in top-right corner
- Auto-hide when no loops are active
- Click to expand/collapse details

**Visual Design**:
- Floating panel with semi-transparent background
- Compact mode: Just show "Loop A: 3/10"
- Expanded mode: Full breadcrumb with all levels

**Estimated Effort**: 4 hours

---

#### Task 3.2: Add Loop Iteration Animation to LoopNode
**Agent**: UI Component Agent
**Priority**: P2
**File**: `/src/components/flow/nodes/LoopNode.tsx`
**Dependencies**: Task 2.3
**Acceptance Criteria**:
- Pulse/glow animation when iteration changes
- Smooth progress bar animation
- Visual feedback for loop completion
- Configurable animation speed

**Technical Details**:
- Use CSS transitions for progress bar
- Add keyframe animation for iteration change
- Trigger animation on `currentIteration` change

**Estimated Effort**: 2 hours

---

#### Task 3.3: Enhance ExecutionLogs with Loop Iteration Context
**Agent**: UI Component Agent
**Priority**: P2
**File**: `/src/components/execution/ExecutionLogs.tsx`
**Dependencies**: Task 1.3
**Acceptance Criteria**:
- Prefix log messages with loop context if inside loop
- Format: `[Loop A: 3/10] [Loop B: 1/2] Log message`
- Color-code log entries by loop depth
- Add filter to show logs from specific loop iteration

**Technical Details**:
```typescript
// In log display
{log.loopContext && (
  <Typography variant="caption" sx={{ color: 'primary.main', mr: 1 }}>
    {log.loopContext.map(l => `[${l.loopName}: ${l.currentIteration}/${l.totalIterations}]`).join(' ')}
  </Typography>
)}
```

**Estimated Effort**: 3 hours

---

### Phase 4: Testing & Documentation (P1)

#### Task 4.1: Create Test Scenario - Single Loop
**Agent**: QA/Testing Agent
**Priority**: P1
**File**: `/src/data/testScenarios/singleLoopScenario.ts` (new)
**Dependencies**: Phase 1, Phase 2 complete
**Acceptance Criteria**:
- Create scenario with forEach loop (5 iterations)
- Include request steps inside loop
- Verify iteration display updates in real-time
- Verify progress bar shows accurate progress

**Test Cases**:
1. Loop starts: activeLoopStack has 1 entry
2. Iteration 1 executes: UI shows "1/5"
3. Iteration 5 completes: Loop marked as success
4. Loop exits: activeLoopStack is empty

**Estimated Effort**: 2 hours

---

#### Task 4.2: Create Test Scenario - Nested Loops
**Agent**: QA/Testing Agent
**Priority**: P1
**File**: `/src/data/testScenarios/nestedLoopScenario.ts` (new)
**Dependencies**: Phase 1, Phase 2 complete
**Acceptance Criteria**:
- Create scenario with loop containing another loop (3x2 = 6 total inner iterations)
- Verify breadcrumb shows both loops
- Verify depth tracking is correct
- Test navigation through nested loop contexts

**Test Cases**:
1. Outer loop iteration 1, inner loop iteration 1: Breadcrumb shows "Outer [1/3] > Inner [1/2]"
2. Inner loop completes: Breadcrumb returns to "Outer [1/3]"
3. Outer loop iteration 2: Process repeats
4. All loops complete: activeLoopStack is empty

**Estimated Effort**: 3 hours

---

#### Task 4.3: Update User Documentation
**Agent**: Documentation Agent
**Priority**: P2
**File**: `/docs/execution-visualization.md` (new)
**Dependencies**: Phase 2, Phase 3 complete
**Acceptance Criteria**:
- Document loop visualization features
- Add screenshots of LoopNode, breadcrumb, progress table
- Explain nested loop navigation
- Provide troubleshooting guide

**Content Sections**:
1. Overview of loop execution visualization
2. Reading loop iteration indicators
3. Understanding nested loop breadcrumbs
4. Interpreting loop context in logs
5. Common issues and solutions

**Estimated Effort**: 3 hours

---

## Task Dependencies Graph

```
Phase 1 (Foundation)
├─ 1.1 (Types) ─┐
├─ 1.2 (Slice)  ├─> 1.3 (Executor)
└─ 1.1 (Types) ─┘

Phase 2 (UI Components)
├─ 2.1 (Indicator) ──┬─> 2.2 (Breadcrumb) ──┬─> 2.4 (Progress Table)
│                    │                       └─> 2.5 (Detail Panel)
└─ 2.1 + 1.3 ────────┴─> 2.3 (LoopNode)

Phase 3 (Polish)
├─ 3.1 (Canvas Overlay) ── depends on 2.2
├─ 3.2 (Animation) ──────── depends on 2.3
└─ 3.3 (Logs) ──────────── depends on 1.3

Phase 4 (Testing)
├─ 4.1 (Single Loop) ─┬─> depends on Phase 1 + Phase 2
├─ 4.2 (Nested Loop) ─┘
└─ 4.3 (Docs) ─────────> depends on all above
```

---

## Priority Matrix

| Priority | Tasks | Rationale |
|----------|-------|-----------|
| **P0** | 1.1, 1.2, 1.3, 2.1, 2.2 | Core functionality - users can't see loop progress without this |
| **P1** | 2.3, 2.4, 3.1, 4.1, 4.2 | Important enhancements for usability |
| **P2** | 2.5, 3.2, 3.3, 4.3 | Nice-to-have polish and documentation |

---

## Execution Order (Recommended)

### Sprint 1 (Foundation + Core UI) - 18 hours
1. Task 1.1: Types (2h)
2. Task 1.2: Slice (3h)
3. Task 1.3: Executor (4h)
4. Task 2.1: Indicator (3h)
5. Task 2.2: Breadcrumb (4h)
6. Task 4.1: Single Loop Test (2h)

### Sprint 2 (Enhanced UI + Testing) - 17 hours
7. Task 2.3: LoopNode (3h)
8. Task 2.4: Progress Table (4h)
9. Task 3.1: Canvas Overlay (4h)
10. Task 4.2: Nested Loop Test (3h)
11. Task 2.5: Detail Panel (3h)

### Sprint 3 (Polish + Docs) - 8 hours
12. Task 3.2: Animation (2h)
13. Task 3.3: Logs (3h)
14. Task 4.3: Documentation (3h)

**Total Estimated Effort**: 43 hours (5-6 days)

---

## Technical Considerations

### Performance
- **Real-time updates**: Use throttling for rapid iteration loops (e.g., 1000 iterations)
- **Memory**: Limit loopIterationState storage to last 100 step results
- **Rendering**: Memoize LoopNode and breadcrumb components

### Edge Cases
- **While loops with unknown total**: Show "Iteration N / ?" until maxIterations
- **Loop errors mid-iteration**: Display partial iteration state
- **Deeply nested loops (5+ levels)**: Auto-collapse breadcrumb, show tooltip
- **Concurrent loops**: Not currently supported, but plan data structure for future

### Accessibility
- **Screen readers**: ARIA labels for iteration progress
- **Keyboard navigation**: Tab through breadcrumb levels
- **Color contrast**: Ensure loop indicators meet WCAG AA standards

---

## Success Metrics

### User Experience
- Users can identify current loop iteration within 2 seconds
- Nested loop depth is clear from breadcrumb
- Loop progress is visually obvious during execution

### Technical
- Loop iteration updates dispatch within 50ms
- UI re-renders complete within 100ms per iteration
- No memory leaks with 100+ iteration loops

---

## Future Enhancements (Out of Scope)

1. **Loop iteration history timeline**: Scrub through past iterations
2. **Loop performance analytics**: Average iteration time, bottlenecks
3. **Conditional loop visualization**: Show which iterations were skipped
4. **Parallel loop execution**: Multiple loops running simultaneously
5. **Loop iteration breakpoints**: Pause execution at specific iteration

---

## Files Modified Summary

### New Files (7)
- `/src/components/execution/LoopIterationIndicator.tsx`
- `/src/components/execution/NestedLoopBreadcrumb.tsx`
- `/src/data/testScenarios/singleLoopScenario.ts`
- `/src/data/testScenarios/nestedLoopScenario.ts`
- `/docs/execution-visualization.md`

### Modified Files (6)
- `/src/types/execution.ts`
- `/src/store/executionSlice.ts`
- `/src/engine/scenarioExecutor.ts`
- `/src/components/flow/nodes/LoopNode.tsx`
- `/src/components/execution/ExecutionProgressTable.tsx`
- `/src/components/execution/StepDetailPanel.tsx`
- `/src/components/flow/FlowCanvas.tsx` (optional, Phase 3)
- `/src/components/execution/ExecutionLogs.tsx` (optional, Phase 3)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation with high iteration counts | High | Implement throttling, limit state storage |
| Complex UI overwhelming users | Medium | Progressive disclosure, collapsible sections |
| Breaking changes to existing execution flow | High | Thorough testing, backward compatibility checks |
| Nested loop edge cases not handled | Medium | Comprehensive test scenarios, error boundaries |

---

## Approval Checklist

- [ ] Architecture reviewed by Tech Lead
- [ ] UI/UX designs approved by Product
- [ ] Accessibility requirements validated
- [ ] Performance benchmarks defined
- [ ] Test coverage plan approved
- [ ] Documentation scope agreed

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: PM Agent (Claude)
**Status**: Ready for Review
