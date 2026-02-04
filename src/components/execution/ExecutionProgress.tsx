/**
 * ExecutionProgress Component
 * Visual progress indicator for scenario execution
 */

import { Box, LinearProgress, Stack, Typography, Paper } from '@mui/material';
import { useExecutionContext, useExecutionStatistics } from '@/store/hooks';

export function ExecutionProgress() {
  const context = useExecutionContext();
  const stats = useExecutionStatistics();

  if (!context) {
    return null;
  }

  const progress =
    stats.totalSteps > 0 ? (stats.completedSteps / stats.totalSteps) * 100 : 0;

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const elapsed = context.startedAt
    ? Date.now() - new Date(context.startedAt).getTime()
    : 0;

  // Simple estimation: assume remaining steps will take the same avg time
  const avgTimePerStep =
    stats.completedSteps > 0 ? elapsed / stats.completedSteps : 0;
  const estimatedRemaining =
    avgTimePerStep > 0
      ? avgTimePerStep * (stats.totalSteps - stats.completedSteps)
      : 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Execution Progress
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {stats.completedSteps} / {stats.totalSteps}
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 1,
          }}
        />

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Elapsed
            </Typography>
            <Typography variant="body2">{formatDuration(elapsed)}</Typography>
          </Box>

          {context.status === 'running' && estimatedRemaining > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Est. Remaining
              </Typography>
              <Typography variant="body2">
                {formatDuration(estimatedRemaining)}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Success Rate
            </Typography>
            <Typography
              variant="body2"
              color={stats.successRate === 100 ? 'success.main' : 'text.primary'}
            >
              {stats.successRate.toFixed(0)}%
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
