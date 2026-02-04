# Flow Components

React Flow visualization components for scenario flow diagrams.

## Components

### FlowCanvas

Main React Flow canvas that visualizes scenario steps and edges.

**Props:**
- `scenario: Scenario` - The scenario to visualize
- `stepResults?: Record<string, StepExecutionResult>` - Execution results for status visualization
- `selectedStepId?: string | null` - ID of currently selected step
- `onNodeClick?: (stepId: string) => void` - Callback when node is clicked
- `onNodesChange?: (changes: NodeChange[]) => void` - Callback for node changes
- `onEdgesChange?: (changes: EdgeChange[]) => void` - Callback for edge changes
- `onConnect?: (connection: Connection) => void` - Callback for new connections
- `readonly?: boolean` - If true, disables editing (default: false)
- `showMinimap?: boolean` - Show/hide minimap (default: true)
- `showGrid?: boolean` - Show/hide grid background (default: true)

**Example:**
```tsx
import { FlowCanvas } from '@/components/flow';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { ReactFlowProvider } from 'reactflow';

function ScenarioFlowView() {
  const dispatch = useAppDispatch();
  const scenario = useAppSelector(state =>
    state.scenarios.scenarios.find(s => s.id === state.scenarios.currentScenarioId)
  );
  const executionContext = useAppSelector(state => state.execution.context);
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);

  if (!scenario) return null;

  return (
    <ReactFlowProvider>
      <FlowCanvas
        scenario={scenario}
        stepResults={executionContext?.stepResults}
        selectedStepId={selectedStepId}
        onNodeClick={(stepId) => dispatch(setSelectedStep(stepId))}
        readonly={false}
        showMinimap={true}
        showGrid={true}
      />
    </ReactFlowProvider>
  );
}
```

### FlowControls

Custom control panel with zoom, fit view, and toggle controls.

**Props:**
- `showGrid: boolean` - Current grid visibility state
- `showMinimap: boolean` - Current minimap visibility state
- `onToggleGrid: () => void` - Toggle grid callback
- `onToggleMinimap: () => void` - Toggle minimap callback
- `onLayoutReset?: () => void` - Optional layout reset callback

**Example:**
```tsx
import { FlowCanvas, FlowControls } from '@/components/flow';
import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

function ScenarioFlowEditor() {
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  return (
    <ReactFlowProvider>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <FlowCanvas
          scenario={scenario}
          showGrid={showGrid}
          showMinimap={showMinimap}
        />
        <FlowControls
          showGrid={showGrid}
          showMinimap={showMinimap}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
        />
      </div>
    </ReactFlowProvider>
  );
}
```

### Custom Nodes

#### RequestNode
Displays HTTP request steps with method badge, endpoint, and status.

**Features:**
- Color-coded HTTP method badges
- Execution status indicator
- Branch handles for conditional flows
- Target and source handles for connections

#### ConditionNode
Diamond-style node for conditional branching logic.

**Features:**
- Branch icon and label
- Multiple output handles for branches
- Status indicator
- Branch count display

#### LoopNode
Container node for loop iterations.

**Features:**
- Loop type badge (FOR EACH, COUNT, WHILE)
- Iteration progress display
- Child step count
- Loop configuration summary

#### GroupNode
Organizational container for grouping related steps.

**Features:**
- Dashed border styling
- Collapsible state indicator
- Step count display
- Folder icon (open/closed)

## Integration with Redux

The components are designed to work with the Redux store:

```tsx
import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { updateStep } from '@/store/scenariosSlice';
import { FlowCanvas } from '@/components/flow';
import { ReactFlowProvider } from 'reactflow';
import type { NodeChange } from 'reactflow';

function ScenarioEditor() {
  const dispatch = useAppDispatch();

  const currentScenarioId = useAppSelector(state => state.scenarios.currentScenarioId);
  const scenario = useAppSelector(state =>
    state.scenarios.scenarios.find(s => s.id === currentScenarioId)
  );
  const executionContext = useAppSelector(state => state.execution.context);
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);

  const handleNodeClick = useCallback((stepId: string) => {
    dispatch(setSelectedStep(stepId));
  }, [dispatch]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (!currentScenarioId) return;

    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        dispatch(updateStep({
          scenarioId: currentScenarioId,
          stepId: change.id,
          changes: { position: change.position },
        }));
      }
    });
  }, [dispatch, currentScenarioId]);

  if (!scenario) return <div>No scenario selected</div>;

  return (
    <ReactFlowProvider>
      <FlowCanvas
        scenario={scenario}
        stepResults={executionContext?.stepResults}
        selectedStepId={selectedStepId}
        onNodeClick={handleNodeClick}
        onNodesChange={handleNodesChange}
      />
    </ReactFlowProvider>
  );
}
```

## Execution Mode Visualization

The flow canvas automatically visualizes execution status:

```tsx
import { FlowCanvas } from '@/components/flow';
import { useAppSelector } from '@/store/hooks';
import { ReactFlowProvider } from 'reactflow';

function ExecutionView() {
  const scenario = useAppSelector(state =>
    state.scenarios.scenarios.find(s => s.id === state.scenarios.currentScenarioId)
  );
  const executionContext = useAppSelector(state => state.execution.context);
  const currentStepId = executionContext?.currentStepId;

  if (!scenario) return null;

  return (
    <ReactFlowProvider>
      <FlowCanvas
        scenario={scenario}
        stepResults={executionContext?.stepResults}
        selectedStepId={currentStepId}
        readonly={true}
        showMinimap={true}
        showGrid={false}
      />
    </ReactFlowProvider>
  );
}
```

## Status Colors

Nodes change color based on execution status:

- **Pending** - Gray (#9E9E9E)
- **Running** - Blue (#2196F3) with pulse animation
- **Waiting** - Orange (#FF9800)
- **Success** - Green (#4CAF50)
- **Failed** - Red (#F44336)
- **Skipped** - Gray (#9E9E9E)
- **Cancelled** - Dark Gray (#757575)

## HTTP Method Colors

Request nodes use color-coded method badges:

- **GET** - Blue (#61AFFE)
- **POST** - Green (#49CC90)
- **PUT** - Orange (#FCA130)
- **PATCH** - Teal (#50E3C2)
- **DELETE** - Red (#F93E3E)

## Notes

- Always wrap FlowCanvas in `<ReactFlowProvider>` from 'reactflow'
- The canvas is fully responsive and fits to its container
- Grid and minimap can be toggled via props
- Readonly mode disables all editing interactions
- Node positions are automatically saved when changed
- Status indicators pulse when step is running
