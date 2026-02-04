/**
 * ExecutionControls Component
 * Main execution control panel with start/pause/stop/reset controls
 */

import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
} from '@mui/icons-material';
import {
  useExecutionContext,
  useExecutionStatus,
  useAppDispatch,
  useCurrentScenario,
  useExecutionStatistics,
} from '@/store/hooks';
import {
  resetExecution,
} from '@/store/executionSlice';
import { useScenarioExecution } from '@/hooks/useScenarioExecution';
import type { ExecutionStatus } from '@/types';

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { color: 'default' | 'primary' | 'warning' | 'success' | 'error'; label: string }
> = {
  idle: { color: 'default', label: 'Idle' },
  running: { color: 'primary', label: 'Running' },
  paused: { color: 'warning', label: 'Paused' },
  completed: { color: 'success', label: 'Completed' },
  failed: { color: 'error', label: 'Failed' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

export function ExecutionControls() {
  const dispatch = useAppDispatch();
  const context = useExecutionContext();
  const status = useExecutionStatus();
  const scenario = useCurrentScenario();
  const stats = useExecutionStatistics();

  // Use the execution hook to control the engine
  const {
    executeScenario,
    pauseExecution: pause,
    resumeExecution: resume,
    stopExecution: stop,
  } = useScenarioExecution();

  const handleStart = () => {
    if (!scenario) return;

    // Execute scenario with current parameters
    executeScenario(
      context?.params || {},
      context?.stepModeOverrides || {}
    );
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleStop = () => {
    stop();
  };

  const handleReset = () => {
    dispatch(resetExecution());
  };

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed' || status === 'failed' || status === 'cancelled';

  const statusConfig = STATUS_CONFIG[status];

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header with Status */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Execution Controls</Typography>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
          />
        </Stack>

        <Divider />

        {/* Control Buttons */}
        <Stack direction="row" spacing={1}>
          {/* Start/Resume Button */}
          {(isIdle || isPaused) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={isIdle ? handleStart : handleResume}
              disabled={!scenario}
              fullWidth
            >
              {isIdle ? 'Start' : 'Resume'}
            </Button>
          )}

          {/* Pause Button */}
          {isRunning && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Pause />}
              onClick={handlePause}
              fullWidth
            >
              Pause
            </Button>
          )}

          {/* Stop Button */}
          {(isRunning || isPaused) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={handleStop}
            >
              Stop
            </Button>
          )}

          {/* Reset Button */}
          {isCompleted && (
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleReset}
              fullWidth
            >
              Reset
            </Button>
          )}
        </Stack>

        {/* Progress Info */}
        {context && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">
                {stats.completedSteps} / {stats.totalSteps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                steps completed
              </Typography>
            </Stack>
            {stats.failedSteps > 0 && (
              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                {stats.failedSteps} failed
              </Typography>
            )}
            {stats.skippedSteps > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {stats.skippedSteps} skipped
              </Typography>
            )}
          </Box>
        )}

        {/* Current Step Info */}
        {context?.currentStepId && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Current Step
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {context.currentStepId}
            </Typography>
          </Box>
        )}

        {/* Duration */}
        {context?.startedAt && (
          <Typography variant="caption" color="text.secondary">
            {isCompleted && context.completedAt
              ? `Duration: ${Math.round(stats.duration / 1000)}s`
              : `Running for ${Math.round(
                  (Date.now() - new Date(context.startedAt).getTime()) / 1000
                )}s`}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
