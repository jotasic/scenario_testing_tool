/**
 * NestedLoopBreadcrumb Component
 * Shows the full loop hierarchy as a breadcrumb trail
 * Example: "Loop A [2/5] > Loop B [1/3] > Loop C [7/10]"
 */

import { Breadcrumbs, Chip, Typography, Box } from '@mui/material';
import { NavigateNext as ChevronIcon, Loop as LoopIcon } from '@mui/icons-material';
import { useExecutionContext, useCurrentScenario } from '@/store/hooks';
import type { LoopIterationSnapshot } from '@/types/execution';

export interface NestedLoopBreadcrumbProps {
  /** Maximum number of loop levels to display before collapsing */
  maxDisplayDepth?: number;
  /** Callback when a loop breadcrumb is clicked */
  onLoopClick?: (stepId: string) => void;
  /** Optional loop stack to display (if not provided, uses activeLoopStack from context) */
  loopStack?: LoopIterationSnapshot[];
}

/**
 * Display breadcrumb chain showing the full nested loop hierarchy
 * Updates in real-time as loops execute and nest
 */
export function NestedLoopBreadcrumb({
  maxDisplayDepth = 3,
  onLoopClick,
  loopStack,
}: NestedLoopBreadcrumbProps) {
  const context = useExecutionContext();
  const scenario = useCurrentScenario();

  // Get the active loop stack from execution context or use provided loopStack
  const activeLoopStack: LoopIterationSnapshot[] = loopStack || context?.activeLoopStack || [];

  // Return null if no active loops
  if (activeLoopStack.length === 0) {
    return null;
  }

  // Get step names from scenario
  const getStepName = (stepId: string): string => {
    const step = scenario?.steps.find((s) => s.id === stepId);
    return step?.name || 'Unknown Loop';
  };

  // Handle overflow if there are too many nested levels
  const shouldCollapse = activeLoopStack.length > maxDisplayDepth;
  const displayStack = shouldCollapse
    ? [
        ...activeLoopStack.slice(0, 1), // First loop
        ...activeLoopStack.slice(-(maxDisplayDepth - 1)), // Last N-1 loops
      ]
    : activeLoopStack;

  // Track if we've collapsed some items
  const collapsedCount = shouldCollapse
    ? activeLoopStack.length - maxDisplayDepth
    : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <Breadcrumbs
        separator={<ChevronIcon fontSize="small" />}
        aria-label="nested loop breadcrumb"
        sx={{ flexWrap: 'wrap' }}
      >
        {displayStack.map((loop, index) => {
          const isCollapsed = shouldCollapse && index === 1;
          const originalIndex = shouldCollapse && index > 0
            ? activeLoopStack.length - (displayStack.length - index)
            : index;

          // Show ellipsis for collapsed items
          if (isCollapsed && collapsedCount > 0) {
            return (
              <Chip
                key="collapsed"
                label={`... ${collapsedCount} more`}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  cursor: 'default',
                }}
              />
            );
          }

          const stepName = getStepName(loop.stepId);
          const iterationText = `${loop.currentIteration}/${loop.totalIterations}`;

          // Color based on depth
          const depthColors = [
            'primary',
            'secondary',
            'info',
            'success',
          ] as const;
          const chipColor = depthColors[loop.depth % depthColors.length];

          const isClickable = !!onLoopClick;

          return (
            <Chip
              key={`${loop.stepId}-${originalIndex}`}
              icon={<LoopIcon sx={{ fontSize: 14 }} />}
              label={
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {stepName} <Box component="span" sx={{ fontFamily: 'monospace' }}>[{iterationText}]</Box>
                </Typography>
              }
              size="small"
              color={chipColor}
              onClick={isClickable ? () => onLoopClick(loop.stepId) : undefined}
              sx={{
                height: 24,
                cursor: isClickable ? 'pointer' : 'default',
                '& .MuiChip-label': {
                  px: 1,
                },
                ...(isClickable && {
                  '&:hover': {
                    opacity: 0.8,
                  },
                }),
              }}
            />
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
