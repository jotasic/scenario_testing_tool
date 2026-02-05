/**
 * RecursiveStepList - Renders a list of steps with recursive nesting support
 *
 * This component handles:
 * - Rendering child steps of Loop/Group containers
 * - Rendering branch targets for Condition steps
 * - Automatic depth limiting with "show more" indicator
 * - Collapsible nested containers
 */

import { memo, useCallback } from 'react';
import { Box, Typography, Stack, Collapse } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { ConditionStep } from '@/types';
import type { RecursiveStepListProps } from './types';
import { StepItemCard } from './StepItemCard';
import { BranchTargetList } from './BranchTargetList';
import {
  getStepColor,
  isContainerStep,
  resolveSteps,
  getChildStepIds
} from './stepVisualUtils';

/**
 * Default configuration values
 */
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_AUTO_COLLAPSE_DEPTH = 3;

/**
 * RecursiveStepList component
 */
function RecursiveStepListComponent({
  steps,
  allSteps,
  containerType,
  containerColor,
  depth = 0,
  maxDepth = DEFAULT_MAX_DEPTH,
  collapsedStepIds = new Set(),
  autoCollapseDepth = DEFAULT_AUTO_COLLAPSE_DEPTH,
  onStepClick,
  onToggleCollapse,
  parentStepIds = [],
}: RecursiveStepListProps): React.ReactElement {

  // Check if we've reached the depth limit
  const isAtMaxDepth = depth >= maxDepth;

  // Determine if a step should be auto-collapsed
  const shouldAutoCollapse = useCallback(
    (stepId: string) => {
      if (collapsedStepIds.has(stepId)) return true;
      if (depth >= autoCollapseDepth) return true;
      return false;
    },
    [collapsedStepIds, depth, autoCollapseDepth]
  );

  // Render function for recursive children
  const renderChildren = useCallback(
    (childSteps: typeof steps, newDepth: number) => (
      <RecursiveStepList
        steps={childSteps}
        allSteps={allSteps}
        containerType={containerType}
        containerColor={containerColor}
        depth={newDepth}
        maxDepth={maxDepth}
        collapsedStepIds={collapsedStepIds}
        autoCollapseDepth={autoCollapseDepth}
        onStepClick={onStepClick}
        onToggleCollapse={onToggleCollapse}
        parentStepIds={parentStepIds}
      />
    ),
    [
      allSteps,
      containerType,
      containerColor,
      maxDepth,
      collapsedStepIds,
      autoCollapseDepth,
      onStepClick,
      onToggleCollapse,
      parentStepIds,
    ]
  );

  // Show depth limit indicator
  if (isAtMaxDepth && steps.length > 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          bgcolor: 'rgba(0,0,0,0.04)',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <MoreHorizIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.6rem',
            fontStyle: 'italic',
          }}
        >
          {steps.length} nested step{steps.length !== 1 ? 's' : ''} (click parent to expand)
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (steps.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontStyle: 'italic',
          display: 'block',
          textAlign: 'center',
          py: 0.5,
          fontSize: '0.6rem',
        }}
      >
        No steps
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {steps.map((step, index) => {
        const isCollapsed = shouldAutoCollapse(step.id);
        const isContainer = isContainerStep(step);
        const childStepIds = getChildStepIds(step);
        const childSteps = resolveSteps(childStepIds, allSteps);

        return (
          <Box key={step.id}>
            {/* Arrow between steps */}
            {index > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
                <ArrowDownwardIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
              </Box>
            )}

            {/* Step Card */}
            <StepItemCard
              step={step}
              allSteps={allSteps}
              depth={depth}
              maxDepth={maxDepth}
              isCollapsed={isCollapsed}
              onStepClick={onStepClick}
              onToggleCollapse={onToggleCollapse || (() => {})}
              containerColor={containerColor}
              parentStepIds={parentStepIds}
              renderChildren={renderChildren}
            />

            {/* Condition Branches */}
            {step.type === 'condition' && (step as ConditionStep).branches.length > 0 && (
              <BranchTargetList
                branches={(step as ConditionStep).branches}
                allSteps={allSteps}
                depth={depth}
                maxDepth={maxDepth}
                onStepClick={onStepClick}
                onToggleCollapse={onToggleCollapse || (() => {})}
                parentStepIds={parentStepIds}
                collapsedStepIds={collapsedStepIds}
                renderChildren={renderChildren}
              />
            )}

            {/* Container Children (Loop/Group) */}
            {isContainer && childSteps.length > 0 && !isCollapsed && (
              <Collapse in={!isCollapsed}>
                <Box
                  sx={{
                    ml: 2,
                    mt: 0.5,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: `${getStepColor(step.type)}40`,
                  }}
                >
                  {renderChildren(childSteps, depth + 1)}
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

export const RecursiveStepList = memo(RecursiveStepListComponent);
