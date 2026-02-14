/**
 * ExecutionControls Component
 * Compact toolbar with execution status and start/pause/stop/reset controls
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
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

interface ExecutionControlsProps {
  params?: Record<string, unknown>;
}

export function ExecutionControls({ params: externalParams }: ExecutionControlsProps) {
  const dispatch = useAppDispatch();
  const context = useExecutionContext();
  const status = useExecutionStatus();
  const scenario = useCurrentScenario();
  const stats = useExecutionStatistics();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const {
    executeScenario,
    pauseExecution: pause,
    resumeExecution: resume,
    stopExecution: stop,
  } = useScenarioExecution();

  // Update elapsed time every second when running
  useEffect(() => {
    const startedAt = context?.startedAt;
    if (!startedAt || status === 'completed' || status === 'failed' || status === 'cancelled') {
      return;
    }

    const updateElapsed = () => {
      const elapsed = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsedSeconds(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [context?.startedAt, status]);

  const handleStart = () => {
    if (!scenario) return;
    executeScenario(
      externalParams || context?.params || {},
      context?.stepModeOverrides || {}
    );
  };

  const handlePause = () => pause();
  const handleResume = () => resume();
  const handleStop = () => stop();
  const handleReset = () => dispatch(resetExecution());

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed' || status === 'failed' || status === 'cancelled';

  const statusConfig = STATUS_CONFIG[status];
  const progressPercent = stats.totalSteps > 0
    ? (stats.completedSteps / stats.totalSteps) * 100
    : 0;

  return (
    <Box>
      {/* Compact Toolbar - Single Row */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ px: 1, py: 0.5 }}
      >
        {/* Status Chip */}
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          sx={{ minWidth: 80 }}
        />

        {/* Progress Info (when running or completed) */}
        {context && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 50 }}>
              {stats.completedSteps}/{stats.totalSteps}
            </Typography>
            {stats.failedSteps > 0 && (
              <Typography variant="body2" color="error" sx={{ fontSize: '0.75rem' }}>
                ({stats.failedSteps} failed)
              </Typography>
            )}
          </Stack>
        )}

        {/* Duration */}
        {context?.startedAt && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {isCompleted && context.completedAt
              ? `${Math.round(stats.duration / 1000)}s`
              : `${elapsedSeconds}s`}
          </Typography>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Control Buttons - Compact */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {/* Start Button */}
          {isIdle && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleStart}
              disabled={!scenario}
              sx={{ minWidth: 90 }}
            >
              Start
            </Button>
          )}

          {/* Resume Button */}
          {isPaused && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleResume}
              sx={{ minWidth: 90 }}
            >
              Resume
            </Button>
          )}

          {/* Pause Button */}
          {isRunning && (
            <Tooltip title="Pause">
              <IconButton
                color="warning"
                onClick={handlePause}
                size="small"
                sx={{
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  '&:hover': { bgcolor: 'warning.dark' }
                }}
              >
                <Pause fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Stop Button */}
          {(isRunning || isPaused) && (
            <Tooltip title="Stop">
              <IconButton
                color="error"
                onClick={handleStop}
                size="small"
              >
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Reset Button */}
          {isCompleted && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={handleReset}
              sx={{ minWidth: 80 }}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Progress Bar (only when running or has progress) */}
      {context && stats.totalSteps > 0 && (
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          color={stats.failedSteps > 0 ? 'error' : 'primary'}
          sx={{ height: 2 }}
        />
      )}
    </Box>
  );
}
