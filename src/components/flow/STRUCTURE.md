# Flow Components Structure

```
src/components/flow/
├── index.ts                    # Main export point
├── FlowCanvas.tsx              # Main React Flow canvas
├── FlowControls.tsx            # Zoom/grid/minimap controls
├── FlowMinimap.tsx             # Styled minimap component
├── FlowExample.tsx             # Complete integration example
├── README.md                   # Usage documentation
├── IMPLEMENTATION.md           # Implementation summary
├── STRUCTURE.md                # This file
└── nodes/
    ├── index.ts                # Node types export
    ├── RequestNode.tsx         # HTTP request visualization
    ├── ConditionNode.tsx       # Conditional branch visualization
    ├── LoopNode.tsx            # Loop iteration visualization
    └── GroupNode.tsx           # Organizational container
```

## Component Hierarchy

```
FlowExample (Redux-connected)
  └─ ReactFlowProvider
      └─ FlowCanvas
          ├─ ReactFlow
          │   ├─ Background (grid)
          │   ├─ Controls (built-in)
          │   ├─ MiniMap (custom styled)
          │   └─ Nodes (custom types)
          │       ├─ RequestNode
          │       ├─ ConditionNode
          │       ├─ LoopNode
          │       └─ GroupNode
          └─ FlowControls (custom overlay)
```

## Data Flow

```
Redux Store
  ├─ scenariosSlice
  │   ├─ scenarios[]
  │   │   ├─ steps[]        → FlowCanvas (converted to nodes)
  │   │   └─ edges[]        → FlowCanvas (converted to edges)
  │   └─ currentScenarioId  → FlowExample (selects scenario)
  │
  ├─ executionSlice
  │   └─ context
  │       └─ stepResults{}  → Custom Nodes (for status display)
  │
  └─ uiSlice
      ├─ selectedStepId     → FlowCanvas (node selection)
      └─ showGrid           → FlowCanvas (grid visibility)

User Interactions
  ├─ Node Click            → dispatch(setSelectedStep(stepId))
  ├─ Node Drag             → dispatch(updateStep({ position }))
  ├─ Edge Create           → dispatch(addEdge({ edge }))
  ├─ Edge Delete           → dispatch(deleteEdge({ edgeId }))
  ├─ Toggle Grid           → dispatch(setShowGrid(!showGrid))
  ├─ Zoom In/Out           → ReactFlow.zoomIn/zoomOut()
  └─ Fit View              → ReactFlow.fitView()
```

## Node Component Structure

Each custom node (RequestNode, ConditionNode, LoopNode, GroupNode) follows this pattern:

```tsx
interface NodeData {
  step: Step;                    // Step data from scenario
  status?: StepExecutionStatus;  // Execution status
  currentIteration?: number;     // For loops
  totalIterations?: number;      // For loops
  selected?: boolean;            // Selection state
}

function CustomNode({ data, selected }: NodeProps<NodeData>) {
  return (
    <Box>
      <Handle type="target" position={Position.Top} />
      
      {/* Status Indicator */}
      {/* Node Content */}
      {/* Type Badge */}
      {/* Step Name */}
      {/* Additional Info */}
      
      <Handle type="source" position={Position.Bottom} />
      {/* Branch Handles (if applicable) */}
    </Box>
  );
}

export default memo(CustomNode);
```

## File Sizes

- FlowCanvas.tsx: ~6.5KB (main logic)
- RequestNode.tsx: ~5.5KB (most detailed node)
- ConditionNode.tsx: ~4.5KB
- LoopNode.tsx: ~5KB
- GroupNode.tsx: ~4KB
- FlowControls.tsx: ~3KB
- FlowMinimap.tsx: ~1.5KB
- FlowExample.tsx: ~5KB (complete example)

Total: ~35KB of component code

## Key Design Decisions

1. **Separation of Concerns**
   - FlowCanvas: Pure visualization logic
   - FlowExample: Redux integration
   - Custom Nodes: Individual step type rendering

2. **Memoization**
   - All custom nodes are memoized
   - Prevents unnecessary re-renders
   - Performance optimized for large flows

3. **Type Safety**
   - All components fully typed
   - Leverages ReactFlow's NodeProps generic
   - Type-safe Redux selectors/dispatchers

4. **Accessibility**
   - MUI components for built-in a11y
   - Tooltips on all controls
   - Keyboard navigation via ReactFlow
   - High contrast status colors

5. **Flexibility**
   - Readonly mode for execution view
   - Toggleable grid/minimap
   - Customizable node positions
   - Branch handle support

## Color Palette

### Status Colors
| Status    | Color   | Hex     | Notes              |
|-----------|---------|---------|--------------------| 
| Pending   | Gray    | #9E9E9E |                    |
| Running   | Blue    | #2196F3 | With pulse effect  |
| Waiting   | Orange  | #FF9800 |                    |
| Success   | Green   | #4CAF50 |                    |
| Failed    | Red     | #F44336 |                    |
| Skipped   | Gray    | #9E9E9E |                    |
| Cancelled | Gray    | #757575 |                    |

### HTTP Method Colors
| Method  | Color  | Hex     |
|---------|--------|---------|
| GET     | Blue   | #61AFFE |
| POST    | Green  | #49CC90 |
| PUT     | Orange | #FCA130 |
| PATCH   | Teal   | #50E3C2 |
| DELETE  | Red    | #F93E3E |

### Node Type Colors (Minimap)
| Type      | Color  | Hex     |
|-----------|--------|---------|
| Request   | Blue   | #61AFFE |
| Condition | Orange | #FFA726 |
| Loop      | Blue   | #42A5F5 |
| Group     | Gray   | #BDBDBD |
