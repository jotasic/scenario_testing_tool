# Execution Components

This directory contains all components related to scenario execution control, monitoring, and logging.

## Components

### ExecutionControls

Main execution control panel with start/pause/stop/reset controls.

**Features:**
- Start/Resume button (enabled when idle/paused)
- Pause button (enabled when running)
- Stop button (enabled when running/paused)
- Reset button (enabled when completed/failed)
- Status indicator chip with color coding
- Progress display (completed steps / total steps)
- Current step display
- Execution duration tracking

**Usage:**
```tsx
import { ExecutionControls } from '@/components/execution';

function ExecutionPanel() {
  return <ExecutionControls />;
}
```

### ExecutionProgress

Visual progress indicator for scenario execution.

**Features:**
- Linear progress bar
- Step count (completed / total)
- Elapsed time display
- Estimated remaining time (when running)
- Success rate percentage

**Usage:**
```tsx
import { ExecutionProgress } from '@/components/execution';

function ExecutionPanel() {
  return <ExecutionProgress />;
}
```

### ExecutionLogs

Execution log viewer with filtering and detail expansion.

**Features:**
- Display logs from execution context
- Filter by level (all, info, debug, warn, error)
- Auto-scroll to latest logs
- Log entry format: `[timestamp] [level] [stepId?] message`
- Click on log to expand details (data object)
- Clear logs button
- Log count badges for each level

**Usage:**
```tsx
import { ExecutionLogs } from '@/components/execution';

function ExecutionPanel() {
  return <ExecutionLogs />;
}
```

### StepResultViewer

Detailed viewer for step execution results.

**Features:**
- Three tabs: Request / Response / Error
- Request tab: method, url, headers, body (formatted JSON)
- Response tab: status, headers, data (formatted JSON)
- Error tab: error code, message, and details
- Timing information (duration)
- Status chip with color coding

**Props:**
- `stepId`: string | null - ID of the step to view results for

**Usage:**
```tsx
import { StepResultViewer } from '@/components/execution';
import { useSelectedStepId } from '@/store/hooks';

function ResultPanel() {
  const selectedStepId = useSelectedStepId();

  return <StepResultViewer stepId={selectedStepId} />;
}
```

### ManualStepDialog

Dialog for manual step execution confirmation.

**Features:**
- Shows when a step with executionMode='manual' is waiting
- Displays step name and description
- Shows request details for request steps
- Execute / Skip / Cancel buttons
- Auto-focus on Execute button

**Props:**
- `open`: boolean - Whether the dialog is open
- `onClose`: () => void - Callback when dialog is closed

**Usage:**
```tsx
import { ManualStepDialog } from '@/components/execution';
import { useState, useEffect } from 'react';
import { useExecutionStatus, useCurrentExecutionStep } from '@/store/hooks';

function ExecutionMonitor() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const status = useExecutionStatus();
  const currentStep = useCurrentExecutionStep();

  useEffect(() => {
    // Open dialog when execution is paused and current step is manual
    if (status === 'paused' && currentStep?.executionMode === 'manual') {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  }, [status, currentStep]);

  return (
    <ManualStepDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
    />
  );
}
```

## Redux Integration

All components use the following Redux hooks:

### Execution Hooks
- `useExecutionContext()` - Get the full execution context
- `useExecutionStatus()` - Get current execution status
- `useCurrentExecutionStep()` - Get the currently executing step
- `useStepResult(stepId)` - Get execution result for a specific step
- `useExecutionStatistics()` - Get execution statistics
- `useExecutionLogs()` - Get filtered execution logs (respects logFilterLevel)

### Dispatch Actions
- `startExecution({ scenarioId, params, stepModeOverrides })` - Start execution
- `pauseExecution()` - Pause execution
- `resumeExecution()` - Resume paused execution
- `stopExecution(status)` - Stop execution with status ('completed' | 'failed' | 'cancelled')
- `resetExecution()` - Reset execution context
- `clearLogs()` - Clear all execution logs
- `updateStepResult(result)` - Update step execution result

### UI Actions
- `setLogFilterLevel(level)` - Set log filter level

## Example: Complete Execution Panel

```tsx
import {
  ExecutionControls,
  ExecutionProgress,
  ExecutionLogs,
  StepResultViewer,
  ManualStepDialog,
} from '@/components/execution';
import { Box, Stack, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import {
  useExecutionStatus,
  useCurrentExecutionStep,
  useSelectedStepId
} from '@/store/hooks';

export function ExecutionPanel() {
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const status = useExecutionStatus();
  const currentStep = useCurrentExecutionStep();
  const selectedStepId = useSelectedStepId();

  // Auto-open manual step dialog
  useEffect(() => {
    if (status === 'paused' && currentStep?.executionMode === 'manual') {
      setManualDialogOpen(true);
    } else {
      setManualDialogOpen(false);
    }
  }, [status, currentStep]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Controls and Progress */}
        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <ExecutionControls />
          </Box>
          <Box flex={1}>
            <ExecutionProgress />
          </Box>
        </Stack>

        {/* Logs and Results */}
        <Stack direction="row" spacing={2} sx={{ height: 600 }}>
          <Box flex={1}>
            <ExecutionLogs />
          </Box>
          <Box flex={1}>
            <StepResultViewer stepId={selectedStepId} />
          </Box>
        </Stack>
      </Stack>

      {/* Manual Step Dialog */}
      <ManualStepDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
      />
    </Box>
  );
}
```

## Styling

All components use Material-UI components and follow the application's theme. They are fully responsive and support dark mode if configured in the theme.

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation is fully supported
- Focus management is handled correctly
- Color contrast meets WCAG AA standards
- Screen reader announcements for important state changes

## Performance

- Components use React hooks for efficient re-rendering
- Logs are virtualized for performance with large log lists
- Memoization is used where appropriate
- Auto-scroll only triggers when enabled and new logs arrive
