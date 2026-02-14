/**
 * LoopIterationIndicator Component
 * Compact component showing current loop iteration with progress bar
 * Displays iteration counter like "3/10" with visual progress indicator
 */

import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { Loop as LoopIcon } from '@mui/icons-material';
import { useExecutionContext } from '@/store/hooks';
import type { LoopIterationSnapshot } from '@/types/execution';

export interface LoopIterationIndicatorProps {
  /** ID of the step to find the loop in activeLoopStack */
  stepId: string;
  /** Size variant for the indicator */
  size?: 'small' | 'medium';
  /** Whether to show the progress bar */
  showProgressBar?: boolean;
}

/**
 * Display a single loop's current iteration state
 * Updates in real-time as the loop executes
 */
export function LoopIterationIndicator({
  stepId,
  size = 'medium',
  showProgressBar = true,
}: LoopIterationIndicatorProps) {
  const context = useExecutionContext();

  // Find the loop state for this step in the active loop stack
  const loopState: LoopIterationSnapshot | undefined = context?.activeLoopStack.find(
    (loop) => loop.stepId === stepId
  );

  // Return null if no active loop for this step
  if (!loopState) {
    return null;
  }

  const progress = loopState.totalIterations > 0
    ? (loopState.currentIteration / loopState.totalIterations) * 100
    : 0;

  // Size-based styling
  const chipHeight = size === 'small' ? 24 : 28;
  const fontSize = size === 'small' ? '0.75rem' : '0.813rem';
  const iconSize = size === 'small' ? 14 : 16;
  const progressHeight = size === 'small' ? 3 : 4;

  // Color based on depth (nested loops get different colors)
  const depthColors = [
    'primary',
    'secondary',
    'info',
    'success',
  ] as const;
  const chipColor = depthColors[loopState.depth % depthColors.length];

  // Indentation for nested loops
  const indentPx = loopState.depth * 8;

  return (
    <Box sx={{ pl: `${indentPx}px` }}>
      <Stack spacing={showProgressBar ? 0.5 : 0}>
        <Chip
          icon={<LoopIcon sx={{ fontSize: iconSize }} />}
          label={
            <Typography
              variant="caption"
              sx={{
                fontSize,
                fontWeight: 500,
                fontFamily: 'monospace',
              }}
            >
              {loopState.currentIteration}/{loopState.totalIterations}
            </Typography>
          }
          size={size}
          color={chipColor}
          sx={{
            height: chipHeight,
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />

        {showProgressBar && (
          <LinearProgress
            variant="determinate"
            value={progress}
            color={chipColor}
            sx={{
              height: progressHeight,
              borderRadius: 0.5,
              ml: `${indentPx}px`,
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
