# Redux Store Documentation

This directory contains the Redux Toolkit store configuration and slices for the Scenario Testing Tool.

## Structure

```
store/
├── index.ts              # Store configuration and exports
├── hooks.ts              # Typed Redux hooks and custom selectors
├── serversSlice.ts       # Server management state
├── scenariosSlice.ts     # Scenario and step management state
├── executionSlice.ts     # Execution runtime state
└── uiSlice.ts           # UI state and preferences
```

## Slices

### 1. Servers Slice (`serversSlice.ts`)

Manages server configurations and connections.

**State:**
- `servers: Server[]` - List of configured servers
- `selectedServerId: string | null` - Currently selected server ID

**Actions:**
- `addServer(server)` - Add a new server
- `updateServer({ id, changes })` - Update server properties
- `deleteServer(id)` - Remove a server
- `setSelectedServer(id)` - Select a server
- `duplicateServer(id)` - Duplicate an existing server

**Selectors:**
- `useServers()` - Get all servers
- `useSelectedServer()` - Get the currently selected server
- `useServerById(id)` - Get a specific server by ID

### 2. Scenarios Slice (`scenariosSlice.ts`)

Manages scenario definitions, steps, edges, and parameter schemas.

**State:**
- `scenarios: Scenario[]` - List of scenarios
- `currentScenarioId: string | null` - Currently active scenario ID

**Actions:**
- `addScenario(scenario)` - Add a new scenario
- `updateScenario({ id, changes })` - Update scenario properties
- `deleteScenario(id)` - Remove a scenario
- `setCurrentScenario(id)` - Set the active scenario
- `duplicateScenario(id)` - Duplicate an existing scenario
- `addStep({ scenarioId, step })` - Add a step to a scenario
- `updateStep({ scenarioId, stepId, changes })` - Update a step
- `deleteStep({ scenarioId, stepId })` - Remove a step
- `reorderSteps({ scenarioId, stepIds })` - Reorder steps
- `addEdge({ scenarioId, edge })` - Add an edge
- `updateEdge({ scenarioId, edgeId, changes })` - Update an edge
- `deleteEdge({ scenarioId, edgeId })` - Remove an edge
- `setParameterSchema({ scenarioId, schema })` - Set parameter schema
- `addParameterSchema({ scenarioId, schema })` - Add a parameter
- `updateParameterSchema({ scenarioId, schemaId, changes })` - Update a parameter
- `deleteParameterSchema({ scenarioId, schemaId })` - Remove a parameter

**Selectors:**
- `useScenarios()` - Get all scenarios
- `useCurrentScenario()` - Get the current scenario
- `useScenarioById(id)` - Get a specific scenario by ID
- `useCurrentSteps()` - Get steps of the current scenario
- `useStepById(id)` - Get a specific step by ID

### 3. Execution Slice (`executionSlice.ts`)

Manages execution runtime state, results, logs, and lifecycle.

**State:**
- `context: ExecutionContext | null` - Current execution context
- `history: ExecutionContext[]` - Past execution history
- `maxHistorySize: number` - Maximum history entries to keep

**Actions:**
- `startExecution({ scenarioId, params, stepModeOverrides })` - Start execution
- `pauseExecution()` - Pause the current execution
- `resumeExecution()` - Resume a paused execution
- `stopExecution(status)` - Stop execution (completed/failed/cancelled)
- `resetExecution()` - Clear current execution
- `setExecutor(executor)` - Set the ScenarioExecutor instance
- `clearExecutor()` - Clear the executor
- `setCurrentStep(stepId)` - Set the currently executing step
- `updateStepResult(result)` - Update a step's execution result
- `saveResponse({ key, data })` - Save a response for variable resolution
- `setParameterValues(params)` - Set parameter values
- `updateParameterValue({ key, value })` - Update a single parameter
- `setStepModeOverride({ stepId, mode })` - Override a step's execution mode
- `clearStepModeOverride(stepId)` - Clear mode override
- `pushLoopContext(context)` - Push a loop context onto the stack
- `popLoopContext()` - Pop a loop context from the stack
- `updateLoopContext({ index, changes })` - Update a loop context
- `addLog(log)` - Add a log entry
- `clearLogs()` - Clear all logs
- `clearHistory()` - Clear execution history
- `removeFromHistory(id)` - Remove a specific execution from history
- `setMaxHistorySize(size)` - Set maximum history size

**Note:** HTTP requests are handled by the ScenarioExecutor engine, not Redux thunks. See the execution engine documentation for details.

**Selectors:**
- `useExecutionContext()` - Get the current execution context
- `useExecutionStatus()` - Get the execution status
- `useIsExecutionRunning()` - Check if execution is running
- `useCurrentExecutionStep()` - Get the currently executing step
- `useStepResult(stepId)` - Get a step's execution result
- `useExecutionLogs()` - Get filtered execution logs
- `useExecutionResponses()` - Get saved responses
- `useExecutionParams()` - Get execution parameters
- `useLoopContextStack()` - Get the loop context stack
- `useCurrentLoopContext()` - Get the current loop context
- `useExecutionHistory()` - Get execution history
- `useExecutionStatistics()` - Get execution statistics

### 4. UI Slice (`uiSlice.ts`)

Manages UI state, view modes, panel visibility, and user preferences.

**State:**
- `mode: 'config' | 'execution'` - Current view mode
- `selectedStepId: string | null` - Currently selected step ID
- `expandedPanels: { ... }` - Panel visibility state
- `sidebarOpen: boolean` - Left sidebar visibility
- `rightPanelOpen: boolean` - Right panel visibility
- `autoScrollLogs: boolean` - Auto-scroll logs preference
- `logFilterLevel: 'all' | 'info' | 'warn' | 'error' | 'debug'` - Log filter
- `showStepDetails: boolean` - Show step details preference
- `expandedStepResults: string[]` - Expanded step result IDs
- `showGrid: boolean` - Show grid in flow editor
- `snapToGrid: boolean` - Snap to grid in flow editor
- `gridSize: number` - Grid size in pixels
- `zoom: number` - Zoom level
- `notifications: Array<{ ... }>` - UI notifications

**Actions:**
- `setMode(mode)` - Set the view mode
- `toggleMode()` - Toggle between config and execution modes
- `setSelectedStep(stepId)` - Select a step
- `togglePanel(panel)` - Toggle a panel's visibility
- `setPanel({ panel, expanded })` - Set panel visibility
- `expandAllPanels()` - Expand all panels
- `collapseAllPanels()` - Collapse all panels
- `toggleSidebar()` - Toggle sidebar visibility
- `setSidebar(open)` - Set sidebar visibility
- `toggleRightPanel()` - Toggle right panel visibility
- `setRightPanel(open)` - Set right panel visibility
- `setAutoScrollLogs(enabled)` - Set auto-scroll preference
- `setLogFilterLevel(level)` - Set log filter level
- `setShowStepDetails(show)` - Set step details visibility
- `toggleStepResult(stepId)` - Toggle step result expansion
- `expandAllStepResults(stepIds)` - Expand all step results
- `collapseAllStepResults()` - Collapse all step results
- `setShowGrid(show)` - Set grid visibility
- `setSnapToGrid(snap)` - Set snap to grid
- `setGridSize(size)` - Set grid size
- `setZoom(zoom)` - Set zoom level
- `zoomIn()` - Zoom in
- `zoomOut()` - Zoom out
- `resetZoom()` - Reset zoom to 100%
- `addNotification({ type, message })` - Add a notification
- `removeNotification(id)` - Remove a notification
- `clearNotifications()` - Clear all notifications
- `resetUI()` - Reset UI state to defaults

**Selectors:**
- `useUIMode()` - Get the current view mode
- `useSelectedStep()` - Get the selected step
- `useSelectedStepId()` - Get the selected step ID
- `useExpandedPanels()` - Get all panel states
- `useIsPanelExpanded(panel)` - Check if a panel is expanded
- `useSidebarOpen()` - Get sidebar visibility
- `useRightPanelOpen()` - Get right panel visibility
- `useFlowEditorPreferences()` - Get flow editor preferences
- `useNotifications()` - Get UI notifications

## Usage Examples

### Basic Usage

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addServer, updateServer } from '@/store/serversSlice';

function ServerManager() {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(state => state.servers.servers);

  const handleAddServer = () => {
    dispatch(addServer({
      id: `srv_${Date.now()}`,
      name: 'new_server',
      baseUrl: 'https://api.example.com',
      headers: [],
      timeout: 30000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div>
      {servers.map(server => (
        <div key={server.id}>{server.name}</div>
      ))}
      <button onClick={handleAddServer}>Add Server</button>
    </div>
  );
}
```

### Using Custom Hooks

```tsx
import { useCurrentScenario, useExecutionStatus } from '@/store/hooks';

function ScenarioViewer() {
  const scenario = useCurrentScenario();
  const status = useExecutionStatus();

  if (!scenario) {
    return <div>No scenario selected</div>;
  }

  return (
    <div>
      <h1>{scenario.name}</h1>
      <p>Status: {status}</p>
      <p>Steps: {scenario.steps.length}</p>
    </div>
  );
}
```

### Executing a Scenario

```tsx
import { useScenarioExecution } from '@/hooks/useScenarioExecution';
import { useCurrentScenario } from '@/store/hooks';

function ExecutionController() {
  const scenario = useCurrentScenario();
  const { execute, isExecuting, executionContext } = useScenarioExecution();

  const handleExecute = async () => {
    if (!scenario) return;

    // Execute scenario through the engine
    // HTTP requests are handled automatically by ScenarioExecutor
    await execute(scenario, { userId: '456' });
  };

  return (
    <div>
      <button onClick={handleExecute} disabled={isExecuting}>
        {isExecuting ? 'Executing...' : 'Execute Scenario'}
      </button>
      {executionContext && (
        <div>Status: {executionContext.status}</div>
      )}
    </div>
  );
}
```

### Managing UI State

```tsx
import { useUIMode, useSidebarOpen } from '@/store/hooks';
import { useAppDispatch } from '@/store/hooks';
import { toggleMode, toggleSidebar } from '@/store/uiSlice';

function AppLayout() {
  const dispatch = useAppDispatch();
  const mode = useUIMode();
  const sidebarOpen = useSidebarOpen();

  return (
    <div>
      <header>
        <button onClick={() => dispatch(toggleMode())}>
          Switch to {mode === 'config' ? 'Execution' : 'Config'} Mode
        </button>
        <button onClick={() => dispatch(toggleSidebar())}>
          {sidebarOpen ? 'Hide' : 'Show'} Sidebar
        </button>
      </header>
      {/* Rest of layout */}
    </div>
  );
}
```

## Best Practices

1. **Use typed hooks** - Always use `useAppDispatch` and `useAppSelector` instead of the plain Redux hooks
2. **Use custom selectors** - Prefer custom hooks like `useCurrentScenario()` over manual selection
3. **Normalize data when possible** - Use entity adapters for lists of items (already done in servers slice example in architecture doc)
4. **Keep actions simple** - Complex logic should be in thunks or separate functions
5. **Use immer** - RTK uses immer internally, so you can mutate state directly in reducers
6. **Batch updates** - When making multiple state changes, consider batching them
7. **Memoize selectors** - Use `useMemo` in custom hooks to prevent unnecessary recalculations

## Type Safety

All state, actions, and selectors are fully typed. TypeScript will catch errors at compile time:

```tsx
// This will cause a TypeScript error
dispatch(updateServer({ id: 123 })); // id must be a string

// This is correct
dispatch(updateServer({ id: 'srv_123', changes: { name: 'updated' } }));
```

## Testing

To test components using Redux:

```tsx
import { Provider } from 'react-redux';
import { store } from '@/store';
import { render } from '@testing-library/react';

function renderWithRedux(component: React.ReactElement) {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
}
```

For unit testing individual slices, you can import and test the reducer directly:

```tsx
import serversReducer, { addServer } from '@/store/serversSlice';

test('adds a server', () => {
  const initialState = { servers: [], selectedServerId: null };
  const server = { id: 'srv_1', name: 'test', /* ... */ };
  const newState = serversReducer(initialState, addServer(server));
  expect(newState.servers).toHaveLength(1);
  expect(newState.servers[0]).toEqual(server);
});
```
