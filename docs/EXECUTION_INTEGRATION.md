# Execution Engine Integration Guide

This document describes how the execution engine is integrated with the UI and how to use the sample scenario.

## Overview

The scenario execution system consists of three main layers:

1. **Execution Engine** (`/src/engine/`) - Core execution logic
2. **Redux State Management** (`/src/store/`) - State tracking and persistence
3. **React Components** (`/src/components/execution/`) - UI controls and display

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components Layer                       │
│  - ExecutionControls: Start/Pause/Resume/Stop buttons       │
│  - ExecutionLogs: Display execution logs                    │
│  - ExecutionResults: Show step results                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ useScenarioExecution hook
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Redux State Management                      │
│  - executionSlice: Tracks execution state                   │
│  - scenariosSlice: Manages scenarios                        │
│  - serversSlice: Manages server configurations              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Callbacks & Dispatches
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Execution Engine                           │
│  - ScenarioExecutor: Main execution orchestrator            │
│  - VariableResolver: Resolves variable references           │
│  - ConditionEvaluator: Evaluates conditions                 │
│  - LoopProcessor: Handles loop iterations                   │
│  - HttpClient: Makes HTTP requests                          │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Sample Scenario Data
**File:** `/src/data/sampleScenario.ts`

Exports:
- `sampleScenario`: Complete scenario with 8 steps
- `sampleServers`: Two server configurations (mock_server, api_server)

Features demonstrated:
- Request steps with variable interpolation
- Conditional branching based on response data
- forEach loop with countField
- Different execution modes (auto, manual, delayed)
- Response saving and aliasing

### 2. Execution Hook
**File:** `/src/hooks/useScenarioExecution.ts`

Hook: `useScenarioExecution()`

Returns:
- `executeScenario(params?, overrides?)` - Start execution
- `pauseExecution()` - Pause current execution
- `resumeExecution()` - Resume paused execution
- `stopExecution()` - Stop and cancel execution
- `isExecuting` - Boolean flag
- `isPaused` - Boolean flag
- `isStopped` - Boolean flag
- `executor` - Current executor instance (for advanced use)

### 3. Sample Parameters
**File:** `/src/data/sampleParameters.ts`

Provides pre-configured parameter sets:
- `defaultSampleParameters` - Standard test case
- `minimalSampleParameters` - Minimal required params
- `extendedSampleParameters` - Extended test case
- `maxCountParameters` - Tests validation limits
- `alternativeRepoParameters` - Different repository

Helper function:
- `getSampleParameters(name)` - Get parameters by name
- `sampleParameterSets` - Array of all available sets

### 4. Updated Files

**ExecutionControls.tsx**
- Now uses `useScenarioExecution` hook
- Connects buttons to actual execution engine
- Handles real-time execution state

**scenariosSlice.ts**
- Initial state includes sample scenario
- Sets sample scenario as current

**serversSlice.ts**
- Initial state includes sample servers
- Removes old sample_server placeholder

## Usage

### Basic Execution

```typescript
import { useScenarioExecution } from '@/hooks/useScenarioExecution';

function MyComponent() {
  const { executeScenario, pauseExecution, resumeExecution, stopExecution } =
    useScenarioExecution();

  const handleStart = () => {
    // Execute with default parameters
    executeScenario();
  };

  const handleStartWithParams = () => {
    // Execute with custom parameters
    executeScenario({
      list: [{ id: 1, count: 2 }],
      repository: 'facebook/react'
    });
  };

  const handleStartWithOverrides = () => {
    // Execute with step mode overrides
    executeScenario(
      { list: [{ id: 1, count: 1 }] },
      { 'step_manual_check': 'bypass' } // Skip manual step
    );
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={pauseExecution}>Pause</button>
      <button onClick={resumeExecution}>Resume</button>
      <button onClick={stopExecution}>Stop</button>
    </div>
  );
}
```

### Execution Flow

1. **Initialize**: User clicks Start button
2. **Create Executor**: Hook creates `ScenarioExecutor` instance
3. **Start Execution**: Engine begins processing steps
4. **Callbacks**: Engine calls Redux callbacks for each event:
   - `onStepStart` → Updates current step in Redux
   - `onStepComplete` → Saves step result in Redux
   - `onLog` → Adds log entry to Redux
   - `onError` → Logs error to Redux
   - `onStatusChange` → Updates execution status
5. **Response Handling**: Responses saved to Redux for variable resolution
6. **Completion**: Final status updated in Redux

### Sample Scenario Flow

The sample scenario executes in this order:

1. **Step 1: Get User** (Auto)
   - Endpoint: `GET /users/${params.list[0].id}`
   - Saves response as `user`

2. **Step 2: Check User Name** (Condition)
   - If name length > 15 → Step 3a
   - Otherwise → Step 3b

3. **Step 3a/3b: Get Posts or Todos** (Auto)
   - Different endpoints based on condition
   - Saves response

4. **Step 4: Process Each Item** (Loop)
   - Iterates over `params.list`
   - Each item repeats `item.count` times
   - Total iterations = sum of all counts

5. **Step 5: Create Post for Item** (Auto, inside loop)
   - Endpoint: `POST /posts`
   - Uses loop variables in body

6. **Step 6: Manual Verification** (Manual)
   - **PAUSES HERE** - Waits for user to click Resume
   - Endpoint: `GET /repos/${params.repository}`
   - Fetches GitHub repo info

7. **Step 7: Get Repository Stars** (Delayed)
   - Waits 2 seconds
   - Endpoint: `GET /repos/${params.repository}/stargazers`
   - Branches based on star count

8. **Step 8: Final Summary** (Auto)
   - Final cleanup request
   - Execution completes

### Parameter Format

Required structure:
```typescript
{
  list: Array<{
    id: number;      // User ID (1-10 are valid in JSONPlaceholder)
    count: number;   // Repeat count (1-5)
  }>;
  repository?: string;  // Optional, defaults to "facebook/react"
}
```

### Variable References

The sample scenario uses these variable patterns:

#### Parameter Access
```javascript
${params.list[0].id}          // First item ID
${params.list[0].count}       // First item count
${params.repository}          // Repository name
```

#### Response Access
```javascript
${responses.user.name}        // User name from saved response
${responses.posts[0].title}   // First post title
```

#### Loop Variables
```javascript
${loop.index}                 // Current iteration index (0-based)
${loop.item.id}               // Current item ID
${loop.item.count}            // Current item count
${loop.total}                 // Total iterations
```

## Testing the Integration

### Quick Test
1. Application loads with sample scenario
2. Click "Start" in Execution Controls
3. Watch steps execute automatically
4. When "Manual Verification" step is reached, execution pauses
5. Click "Resume" to continue
6. Wait 2 seconds for delayed step
7. Execution completes

### Testing Different Parameters

Use the sample parameter sets:

```typescript
import { defaultSampleParameters } from '@/data/sampleParameters';

executeScenario(defaultSampleParameters);
```

### Testing Execution Modes

Override execution modes:

```typescript
// Skip manual step
executeScenario(params, {
  'step_manual_check': 'bypass'
});

// Make delayed step immediate
executeScenario(params, {
  'step_delayed': 'auto'
});
```

### Monitoring Execution

Use Redux DevTools or hooks to monitor:

```typescript
const context = useExecutionContext();
const logs = useExecutionLogs();
const stats = useExecutionStatistics();

console.log('Current step:', context?.currentStepId);
console.log('Completed:', stats.completedSteps, '/', stats.totalSteps);
console.log('Recent logs:', logs.slice(-5));
```

## Callbacks and Events

The execution engine emits these events:

### onStepStart
```typescript
(stepId: string, status: StepExecutionStatus) => void
```
Called when a step begins execution.

### onStepComplete
```typescript
(stepId: string, result: StepExecutionResult) => void
```
Called when a step finishes (success or failure).

### onLog
```typescript
(log: ExecutionLog) => void
```
Called for each log entry (info, warn, error, debug).

### onError
```typescript
(error: Error, stepId?: string) => void
```
Called when an error occurs.

### onStatusChange
```typescript
(status: ExecutionStatus) => void
```
Called when execution status changes.

## Error Handling

Errors are handled at multiple levels:

1. **Step Level**: Individual step failures are logged but don't stop execution
2. **Scenario Level**: `stopOnError` option controls whether to halt on first error
3. **Network Level**: HTTP errors are caught and logged with retry support
4. **Variable Resolution**: Invalid variable references throw errors

## Advanced Features

### Retry Configuration

Steps can have retry configuration:

```typescript
{
  retryConfig: {
    maxRetries: 3,
    retryDelayMs: 1000,
    retryOn: [500, 502, 503, 504] // HTTP status codes
  }
}
```

### Response Branching

Steps can branch based on response:

```typescript
{
  branches: [
    {
      condition: {
        source: 'response',
        stepId: 'previous_step',
        field: 'data.status',
        operator: '==',
        value: 'success'
      },
      nextStepId: 'success_step'
    },
    {
      isDefault: true,
      nextStepId: 'error_step'
    }
  ]
}
```

### Nested Loops

Loop contexts are stacked for nested loops:

```typescript
const loopStack = useLoopContextStack();
const currentLoop = loopStack[loopStack.length - 1];
const parentLoop = loopStack[loopStack.length - 2];
```

## Best Practices

1. **Always provide parameters**: Even if optional, provide defaults
2. **Handle manual steps**: Inform users when execution is paused
3. **Monitor logs**: Watch for warnings and errors during development
4. **Test with different data**: Use sample parameter sets to test edge cases
5. **Use meaningful aliases**: Name saved responses clearly
6. **Set reasonable timeouts**: Adjust based on expected response times
7. **Implement retry logic**: For unreliable endpoints
8. **Validate parameters**: Check parameter schema before execution

## Troubleshooting

### Execution doesn't start
- Check that scenario and servers are loaded
- Verify all server IDs exist
- Check browser console for errors

### Manual step doesn't pause
- Ensure `executionMode` is set to `'manual'`
- Check that mode override isn't set to `'auto'`

### Variables not resolving
- Verify variable syntax: `${path.to.value}`
- Check that referenced responses are saved
- Ensure step IDs match saved response aliases

### Loop not iterating
- Check that source path exists and is an array
- Verify `itemAlias` is unique
- Check `maxIterations` isn't too low

### Network errors
- Verify server `baseUrl` is correct
- Check CORS settings
- Verify endpoints are valid
- Check authentication headers

## Next Steps

1. Create custom scenarios using the sample as a template
2. Add more servers for different APIs
3. Build UI components for parameter editing
4. Add execution result visualization
5. Implement execution history playback
6. Add scenario templates
7. Create scenario import/export functionality
