# Loop Visualization Guide

Real-time visualization and monitoring of loop execution in the Scenario Tool.

## Overview

The Loop Visualization feature provides comprehensive real-time feedback when executing scenarios with loops. Users can now see exactly which loop iteration is currently running, how nested loops interact, and trace execution through complex loop hierarchies.

### Why Loop Visualization Matters

Without loop visualization, executing a scenario with multiple loops creates a "black box" effect where users cannot easily tell:
- Which loop iteration is currently running
- How many iterations have completed
- Which nested loop level is executing
- Where in a loop-based sequence execution currently is

The Loop Visualization feature solves these problems by making loop execution transparent and easy to understand at a glance.

## Features

### 1. Loop Iteration Indicator

**Where you see it**: Inside each Loop node during execution

A compact indicator showing the current iteration counter and progress bar.

```
[⟳ 3/10] with progress bar at 30%
```

**What it shows**:
- Loop icon for visual recognition
- Current iteration number
- Total number of iterations
- Visual progress bar showing completion percentage

**Visual cues**:
- Different colors for different nesting depths (primary, secondary, info, success)
- Smooth animation when iteration changes
- Size variants (small for compact views, medium for detailed views)

**Example scenarios**:
- Single loop: Shows "1/5" when iterating through 5 items
- Nested loop: Each level shows its own iteration, indented for clarity
- Count loop: Shows "7/20" for 20-iteration count loop

---

### 2. Nested Loop Breadcrumb Trail

**Where you see it**: In the Flow Canvas and execution panels during loop execution

A breadcrumb trail showing the complete hierarchy of active loops.

```
Loop A [2/5] > Loop B [1/3] > Loop C [7/10]
```

**What it shows**:
- Name of each active loop
- Current iteration for each loop level
- Total iterations for each loop level
- Visual separation with chevron (>) symbols

**Features**:
- Auto-collapse if more than 3 nested levels (shows "... 2 more")
- Clickable breadcrumb items for navigation (where supported)
- Color-coded by nesting depth for visual distinction
- Real-time updates as loops execute

**Example scenarios**:
- Two-level loop: "Users Loop [2/3] > Orders Loop [5/10]"
- Deeply nested: Shows first level, last 2 levels, with middle levels collapsed
- Single loop: Just shows "Loop Name [iteration/total]"

---

### 3. Loop Context Column in Progress Table

**Where you see it**: ExecutionProgressTable during and after execution

A dedicated column showing loop context for each executed step.

**What it shows**:
- Which loops a step executed within
- Iteration information at each nesting level
- Visual indentation for nested steps
- Loop badges with color coding

**Features**:
- Shows full breadcrumb for steps inside loops
- Empty/hidden for steps not in loops
- Helps identify which iteration of which loop produced each result
- Useful for post-execution analysis and debugging

**Example**:
```
Step Name                Status    Loop Context
getUser                  Success   -
processUserOrder         Success   Users Loop [1/3] > Items Loop [2/5]
updateInventory          Success   Users Loop [1/3] > Items Loop [2/5]
processUserOrder         Success   Users Loop [1/3] > Items Loop [3/5]
```

---

### 4. Loop Context in Step Details

**Where you see it**: StepDetailPanel when examining individual step results

A "Loop Context" tab appears for steps executed inside loops.

**What it shows**:
- Complete loop hierarchy at the time the step executed
- Iteration information for each nesting level
- Depth of each loop in the hierarchy
- Easy-to-read tree structure

**Features**:
- Only appears for steps within loops
- Shows full context even for deeply nested scenarios
- Helps understand multi-level execution paths
- Reference material for complex scenario debugging

**Example**:
```
Loop Context for: getProfile (iteration 3 in the nested path)

Loop Hierarchy:
  ├─ Users Loop [2/5] (depth 0)
  │  └─ Orders Loop [3/8] (depth 1)
  │     └─ Items Loop [1/3] (depth 2)
```

---

### 5. Loop Badges in Execution Logs

**Where you see it**: ExecutionLogs component during and after execution

Log messages are prefixed with loop iteration information.

```
[2/5] [1/3] INFO: Processing item
[2/5] [1/3] DEBUG: Item ID = 42
[2/5] [1/3] ERROR: Request failed
```

**What it shows**:
- Loop iteration context for each log line
- Multiple levels shown for nested loops
- Clear identification of which execution path produced the log

**Features**:
- Color-coded log entries by loop depth
- Filter by loop iteration (view logs from specific iterations)
- Prefix format: [iteration/total] for each active loop level
- Helps trace execution flow through complex scenarios

**Example with nested loops**:
```
[00:01.234] [INFO] Starting scenario execution
[00:01.345] [INFO] Users Loop started, 3 iterations
[00:01.456] [1/3] [INFO] Processing user 101
[00:01.567] [1/3] [1/5] [DEBUG] Orders Loop started, 5 iterations
[00:01.678] [1/3] [1/5] [INFO] Order 1001 received
[00:01.789] [1/3] [1/5] [SUCCESS] Order processed in 111ms
[00:01.890] [1/3] [2/5] [INFO] Order 1002 received
```

---

### 6. Iteration Change Animations

**Where you see it**: Loop nodes and breadcrumb updates during execution

Visual feedback when iteration changes.

**What you see**:
- Loop iteration indicator briefly highlights when iteration changes
- Smooth progress bar animation
- Color pulse effect on the iteration chip
- Glow animation on loop node completion

**Purpose**:
- Provides reassurance that execution is progressing
- Makes it obvious when a loop is stuck (no animation)
- Visual feedback without requiring active monitoring
- Creates a professional, polished execution experience

**Example**: When iteration changes from 3 to 4:
1. Chip animates with a brief scale-up effect
2. Progress bar smoothly transitions to new percentage
3. Color briefly highlights to draw attention

---

## Usage Guide

### Finding Loop Information During Execution

**Real-time loop state**:
1. Watch the Flow Canvas - loop nodes update in real-time
2. Check the breadcrumb trail at the top for nested loop hierarchy
3. Monitor the execution table for which iteration each step ran in
4. Watch animations to confirm execution is progressing

**After execution completes**:
1. Check the ExecutionProgressTable Loop Context column
2. Click a step in the table to see full loop context in details panel
3. Review execution logs to see iteration sequence
4. Analyze which loop iterations produced which results

---

### Navigating Nested Loops

**Understanding the hierarchy**:
- Leftmost breadcrumb item = outermost loop
- Rightmost breadcrumb item = innermost loop
- Each level shows its own iteration counter
- Indentation in progress table shows nesting depth

**Example with 3-level nesting**:
```
Flow execution: Users [2/5] > Orders [1/8] > Items [3/10]

This means:
- Currently processing user #2 out of 5
- Within that user, processing order #1 out of 8
- Within that order, processing item #3 out of 10
```

**Common patterns**:
- For `forEach` loops: Breadcrumb shows item count
- For `count` loops: Breadcrumb shows iteration number
- For `while` loops: Breadcrumb shows current iteration (total unknown)

---

### Interpreting Loop Context in Logs

**Reading log context**:
- Log format: `[loop1_iter/total] [loop2_iter/total] message`
- Multiple brackets = multiple nested loops
- Left to right = outer to inner nesting
- No brackets = execution outside all loops

**Finding specific iterations**:
1. Open ExecutionLogs
2. Use the log filter to narrow down iterations
3. Look for specific iteration patterns in brackets
4. Compare multiple iterations to find differences

**Debugging loop issues**:
- If logs from a specific iteration are missing, that iteration may have failed silently
- If iteration doesn't advance, the loop may be stuck
- If logs don't show expected context, the step may not be inside the loop

**Example log sequence**:
```
[INFO] Starting iteration loop
[1/5] [INFO] Processing user 1
[1/5] [1/3] [INFO] Order loop started
[1/5] [1/3] [INFO] Processing order 1
[1/5] [1/3] [SUCCESS] Order saved
[1/5] [2/3] [INFO] Processing order 2
[1/5] [2/3] [SUCCESS] Order saved
[2/5] [INFO] Processing user 2
[2/5] [1/3] [INFO] Processing order 1
```

---

## Visual Examples

### Single Loop Example

```
Flow Canvas visualization:

┌─────────────────────┐
│   Loop: Users       │
│   [3/5]  ███░░░░░░░ │
└─────────────────────┘
         │
┌─────────────────────┐
│  Get User Profile   │
│   (executing)       │
└─────────────────────┘

Breadcrumb: Users [3/5]

Progress Table:
┌─────────────┬──────────┬────────────┐
│ Step        │ Status   │ Loop Ctx   │
├─────────────┼──────────┼────────────┤
│ getUser     │ Success  │            │
│ getProfile  │ Running  │ Users[3/5] │
└─────────────┴──────────┴────────────┘
```

---

### Nested Loop Example

```
Flow Canvas visualization:

┌──────────────────┐
│ Loop: Users      │
│ [2/3] ██░░░░░░░░ │
└──────────────────┘
         │
┌──────────────────┐
│ Loop: Orders     │
│ [1/5] █░░░░░░░░░ │
└──────────────────┘
         │
┌──────────────────┐
│  Process Order   │
│   (executing)    │
└──────────────────┘

Breadcrumb: Users [2/3] > Orders [1/5]

Progress Table:
┌─────────────┬────────────┬──────────────────────┐
│ Step        │ Status     │ Loop Context         │
├─────────────┼────────────┼──────────────────────┤
│ getOrders   │ Success    │                      │
│ process     │ Running    │ Users[2/3] > Ord[1/5]│
└─────────────┴────────────┴──────────────────────┘
```

---

### Deep Nesting with Collapse

```
Flow Canvas showing 5 nested loops:

Breadcrumb: Users [1/3] > ... 2 more > Type [2/4]

When expanded/hovered:
Breadcrumb: Users [1/3] > Region [2/2] > Orders [1/5] > Items [3/8] > Type [2/4]

Progress Table shows full indentation:
┌─────────────────────────────────────┐
│ Item (Users[1/3] > Regions[2/2])    │
│   ├─ Order (Orders[1/5])            │
│   │   ├─ Item (Items[3/8] > Type[2/4])│
└─────────────────────────────────────┘
```

---

## Technical Details

### How Loop State is Tracked

**activeLoopStack**: Core data structure tracking loop execution
- Type: `LoopIterationSnapshot[]`
- Location: Redux execution context
- Content: Array of active loop levels, from outermost to innermost

**LoopIterationSnapshot structure**:
```typescript
interface LoopIterationSnapshot {
  stepId: string;              // ID of the loop step
  currentIteration: number;    // Current iteration (1-indexed for display)
  totalIterations: number;     // Total iterations
  depth: number;               // Nesting level (0 = outermost)
}
```

**Example with nested loops**:
```typescript
activeLoopStack = [
  {
    stepId: "loop_users",
    currentIteration: 2,
    totalIterations: 5,
    depth: 0
  },
  {
    stepId: "loop_orders",
    currentIteration: 1,
    totalIterations: 3,
    depth: 1
  }
]
```

---

### Real-Time Updates via Redux

**Update mechanism**:
1. Executor encounters loop entry → dispatches `updateActiveLoopStack`
2. Each iteration starts → dispatches `updateLoopIterationProgress`
3. Loop exits → removes from activeLoopStack
4. Components subscribe via `useExecutionContext()` hook

**Data flow**:
```
Executor         Redux              UI Components
   │             Slice
   ├─> updateActiveLoopStack ────→ state.execution.context.activeLoopStack
   │                                          │
   │                                          ├─> LoopIterationIndicator
   │                                          ├─> NestedLoopBreadcrumb
   │                                          ├─> ExecutionProgressTable
   │                                          └─> ExecutionLogs
   │
   └─> updateLoopIterationProgress ──→ Updates specific loop in stack
```

**Performance**: Updates throttled to prevent excessive re-renders on rapid iterations

---

### Components Involved

**Core components**:

| Component | Purpose | Location |
|-----------|---------|----------|
| LoopIterationIndicator | Shows single loop iteration | `/src/components/execution/LoopIterationIndicator.tsx` |
| NestedLoopBreadcrumb | Displays loop hierarchy | `/src/components/execution/NestedLoopBreadcrumb.tsx` |
| ExecutionProgressTable | Shows loop context per step | `/src/components/execution/ExecutionProgressTable.tsx` |
| StepDetailPanel | Details for steps in loops | `/src/components/execution/StepDetailPanel.tsx` |
| ExecutionLogs | Logs with loop badges | `/src/components/execution/ExecutionLogs.tsx` |
| LoopNode | Flow node with iteration display | `/src/components/flow/nodes/LoopNode.tsx` |
| FlowCanvas | Shows loop hierarchy breadcrumb | `/src/components/flow/FlowCanvas.tsx` |

**State management**:
- Redux slice: `/src/store/executionSlice.ts`
- Type definitions: `/src/types/execution.ts`
- Executor: `/src/engine/scenarioExecutor.ts`

---

### How Loop Iterations are Updated

**During execution**:

1. **Loop initialization**:
   - Executor starts loop processing
   - Creates LoopIterationSnapshot for the loop
   - Dispatches to Redux state

2. **Each iteration**:
   - Executor increments iteration counter
   - Dispatches `updateLoopIterationProgress` action
   - All subscribed UI components re-render with new counter

3. **Loop completion**:
   - Final iteration completes
   - Executor removes loop from activeLoopStack
   - UI updates to remove loop indicators

**Example update sequence for 3-iteration loop**:
```
Executor                        Redux State
──────────────────              ───────────
Loop start                       activeLoopStack = [{loop_a, iter: 1, total: 3}]
Iteration 1 complete             activeLoopStack = [{loop_a, iter: 2, total: 3}]
Iteration 2 complete             activeLoopStack = [{loop_a, iter: 3, total: 3}]
Iteration 3 complete             activeLoopStack = []
```

---

### Edge Cases Handled

**While loops with unknown total**:
- Shows "Iteration N / ?" until loop ends
- Total updated when loop exits

**Loop errors mid-iteration**:
- Current iteration state preserved in logs
- Partial iteration visible in UI
- Helps identify where loop failed

**Deeply nested loops (5+ levels)**:
- Breadcrumb automatically collapses
- Shows first level + last 2 levels
- Middle levels shown as "... N more"
- Full path available on hover/click

**Loop iteration 0**:
- Internal counter starts at 0
- Display shows as iteration 1 (1-indexed)
- Loop index variable still 0 (0-indexed)

---

## Troubleshooting

### Loop iteration indicator not appearing

**Problem**: No iteration indicator visible in loop nodes

**Causes and solutions**:
1. Loop not executing - verify loop source has items
2. Execution stopped - check logs for errors
3. Loop not entered - verify loop step has children

**Debug steps**:
- Check ExecutionLogs for loop entry messages
- Verify ExecutionProgressTable shows steps inside loop
- Confirm loop parameters/conditions are correct

---

### Breadcrumb not updating

**Problem**: Breadcrumb shows old iterations or not updating

**Causes and solutions**:
1. Execution paused - look for manual step dialogs
2. Performance issue - check console for errors
3. Loop stuck - may need to interrupt execution

**Debug steps**:
- Check if execution is paused (wait for manual step?)
- Watch logs for progression
- Try pausing/resuming execution

---

### Loop context missing from logs

**Problem**: Logs don't show loop context brackets [N/Total]

**Causes and solutions**:
1. Step not inside loop - verify loop structure
2. Step ran outside loop context - check step placement
3. Log created before loop - check timing

**Debug steps**:
- Verify step is child of loop node
- Check ExecutionProgressTable loop context column
- Review scenario structure

---

### Nested loop breadcrumb collapsed

**Problem**: Can't see all nested loop levels

**Solutions**:
1. Hover over breadcrumb for tooltip (if available)
2. Click on individual loop chips to navigate
3. Check ExecutionProgressTable for full hierarchy
4. Review step details panel for complete context

---

## Best Practices

### For Single Loops

- Use Loop Iteration Indicator size="small" for compact views
- Monitor the progress bar for visual completion feedback
- Check ExecutionLogs for any errors at specific iterations

### For Nested Loops

- Reference the breadcrumb to understand current execution depth
- Use the progress table to correlate results with iterations
- Leverage loop badges in logs for detailed trace-back

### For Loop Debugging

1. Start with ExecutionLogs - see which iterations ran
2. Check ExecutionProgressTable - confirm step sequence
3. Click steps for StepDetailPanel - examine loop context
4. Compare results across iterations to find divergence

### For Complex Scenarios

- Pause execution at interesting points
- Inspect loop context in detail panel
- Use log filtering to isolate specific iterations
- Export logs for external analysis if needed

---

## Limitations and Known Issues

### Current Limitations

- No visualization of loop iteration history (scrubbing through past iterations)
- Cannot view stats on loop iteration performance
- No pause/breakpoint at specific iteration
- While loops cannot be rewound to earlier iteration

### Future Enhancements

- Loop iteration timeline for replaying past iterations
- Performance analytics (iteration timing, bottlenecks)
- Skip conditions for conditional iterations
- Parallel loop visualization
- Iteration breakpoints for targeted debugging

---

## Related Documentation

- [Task Breakdown: Loop Visualization](../task-breakdown-loop-visualization.md) - Technical implementation details
- [Loop Variables Feature](../loop-variables-feature.md) - Using loop variables in scenarios
- [Architecture Overview](../architecture.md) - System design and components

