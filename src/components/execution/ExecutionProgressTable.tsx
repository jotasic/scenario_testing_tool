/**
 * ExecutionProgressTable Component
 * Displays execution progress of all steps in a table format
 * Shows real-time status, duration, and results
 */

import { useMemo, useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailedIcon,
  PlayArrow as RunningIcon,
  RadioButtonUnchecked as PendingIcon,
  RemoveCircle as SkippedIcon,
  HourglassEmpty as WaitingIcon,
} from '@mui/icons-material';
import type { Scenario, StepExecutionResult, Step } from '@/types';

interface ExecutionProgressTableProps {
  scenario: Scenario;
  stepResults?: Record<string, StepExecutionResult>;
  onStepClick?: (stepId: string) => void;
}

// Status icon and color mapping
const getStatusInfo = (status?: StepExecutionResult['status']) => {
  switch (status) {
    case 'success':
      return {
        icon: <SuccessIcon fontSize="small" />,
        color: '#4CAF50',
        label: 'Success',
      };
    case 'failed':
      return {
        icon: <FailedIcon fontSize="small" />,
        color: '#F44336',
        label: 'Failed',
      };
    case 'running':
      return {
        icon: <RunningIcon fontSize="small" />,
        color: '#2196F3',
        label: 'Running',
      };
    case 'waiting':
      return {
        icon: <WaitingIcon fontSize="small" />,
        color: '#FF9800',
        label: 'Waiting',
      };
    case 'skipped':
      return {
        icon: <SkippedIcon fontSize="small" />,
        color: '#9E9E9E',
        label: 'Skipped',
      };
    case 'cancelled':
      return {
        icon: <SkippedIcon fontSize="small" />,
        color: '#757575',
        label: 'Cancelled',
      };
    case 'pending':
    default:
      return {
        icon: <PendingIcon fontSize="small" />,
        color: '#9E9E9E',
        label: 'Pending',
      };
  }
};

// Format duration in human-readable format
const formatDuration = (ms?: number): string => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Calculate duration from timestamps or use provided duration
const calculateDuration = (result?: StepExecutionResult): number | undefined => {
  if (!result) return undefined;

  // If duration is provided, use it
  if (result.response?.duration !== undefined) {
    return result.response.duration;
  }

  // Calculate from timestamps
  if (result.startedAt && result.completedAt) {
    return new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime();
  }

  return undefined;
};

// Get type label for step
const getStepTypeLabel = (step: Step): string => {
  switch (step.type) {
    case 'request':
      return step.method;
    case 'condition':
      return 'Condition';
    case 'loop':
      return 'Loop';
    case 'group':
      return 'Group';
  }
};

// Get result summary for step
const getResultSummary = (step: Step, result?: StepExecutionResult): string => {
  if (!result) return '-';

  // Failed steps show error
  if (result.status === 'failed' && result.error) {
    return result.error.message;
  }

  // Request steps show status code
  if (step.type === 'request' && result.response) {
    return `${result.response.status} ${result.response.statusText}`;
  }

  // Condition steps show which branch was taken
  if (step.type === 'condition') {
    // This would need additional data from execution context
    return 'Branch taken';
  }

  // Loop steps show iteration count
  if (step.type === 'loop' && result.iterations) {
    return `${result.currentIteration || 0}/${result.iterations} iterations`;
  }

  return '-';
};

export function ExecutionProgressTable({
  scenario,
  stepResults = {},
  onStepClick,
}: ExecutionProgressTableProps) {
  // Track current time for real-time duration updates
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every 100ms for running steps
  useEffect(() => {
    const hasRunningSteps = Object.values(stepResults).some(
      result => result.status === 'running'
    );

    if (!hasRunningSteps) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [stepResults]);

  // Flatten steps (including nested steps in loops/groups)
  const allSteps = useMemo(() => {
    const steps: Step[] = [];
    const visited = new Set<string>();

    const collectSteps = (stepList: Step[], depth = 0) => {
      stepList.forEach(step => {
        if (visited.has(step.id)) return;
        visited.add(step.id);

        steps.push(step);

        // Recursively collect child steps
        if ((step.type === 'loop' || step.type === 'group') && step.stepIds) {
          const childSteps = step.stepIds
            .map(id => scenario.steps.find(s => s.id === id))
            .filter((s): s is Step => s !== undefined);
          collectSteps(childSteps, depth + 1);
        }
      });
    };

    collectSteps(scenario.steps);
    return steps;
  }, [scenario.steps]);

  // Calculate real-time duration for running steps
  const getRealTimeDuration = (result?: StepExecutionResult): number | undefined => {
    if (!result) return undefined;

    // Completed steps use calculated duration
    if (result.status === 'success' || result.status === 'failed') {
      return calculateDuration(result);
    }

    // Running steps calculate from start time to now
    if (result.status === 'running' && result.startedAt) {
      return currentTime - new Date(result.startedAt).getTime();
    }

    return undefined;
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ maxHeight: '100%', overflow: 'auto' }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 50, fontWeight: 'bold' }}>#</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Step Name</TableCell>
            <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Type</TableCell>
            <TableCell sx={{ width: 120, fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Duration</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allSteps.map((step, index) => {
            const result = stepResults[step.id];
            const statusInfo = getStatusInfo(result?.status);
            const duration = getRealTimeDuration(result);
            const isRunning = result?.status === 'running';

            return (
              <TableRow
                key={step.id}
                onClick={() => onStepClick?.(step.id)}
                sx={{
                  cursor: onStepClick ? 'pointer' : 'default',
                  backgroundColor: isRunning ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  animation: isRunning ? 'pulse-row 2s ease-in-out infinite' : 'none',
                  '@keyframes pulse-row': {
                    '0%, 100%': { backgroundColor: 'rgba(33, 150, 243, 0.08)' },
                    '50%': { backgroundColor: 'rgba(33, 150, 243, 0.15)' },
                  },
                  '&:hover': {
                    backgroundColor: isRunning ? 'rgba(33, 150, 243, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                {/* Index */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {index + 1}
                  </Typography>
                </TableCell>

                {/* Step Name */}
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isRunning ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 200,
                    }}
                  >
                    {step.name}
                  </Typography>
                  {step.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                      }}
                    >
                      {step.description}
                    </Typography>
                  )}
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Chip
                    label={getStepTypeLabel(step)}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 20,
                      backgroundColor:
                        step.type === 'request'
                          ? '#E3F2FD'
                          : step.type === 'condition'
                          ? '#FFF3E0'
                          : step.type === 'loop'
                          ? '#F3E5F5'
                          : '#E8F5E9',
                    }}
                  />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ color: statusInfo.color, display: 'flex', alignItems: 'center' }}>
                      {statusInfo.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: statusInfo.color,
                        fontWeight: isRunning ? 600 : 400,
                        fontSize: '0.8rem',
                      }}
                    >
                      {statusInfo.label}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Duration */}
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: isRunning ? 'primary.main' : 'text.secondary',
                      fontWeight: isRunning ? 600 : 400,
                    }}
                  >
                    {formatDuration(duration)}
                    {isRunning && '...'}
                  </Typography>
                </TableCell>

                {/* Result */}
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      color:
                        result?.status === 'failed'
                          ? 'error.main'
                          : result?.status === 'success'
                          ? 'success.main'
                          : 'text.secondary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 200,
                    }}
                  >
                    {getResultSummary(step, result)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {allSteps.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">No steps in scenario</Typography>
        </Box>
      )}
    </TableContainer>
  );
}
