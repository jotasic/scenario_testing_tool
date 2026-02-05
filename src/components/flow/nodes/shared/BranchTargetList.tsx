/**
 * BranchTargetList - Renders condition branch targets
 *
 * Features:
 * - Shows branch label and target step
 * - Special visualization for container targets (Loop/Group)
 * - Recursive rendering of container children
 * - Scope awareness (shows "exit" indicator for external targets)
 */

import { memo } from 'react';
import { Box, Typography, Chip, Collapse } from '@mui/material';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import type { Step } from '@/types';
import type { BranchTargetListProps } from './types';
import { getStepColor, getStepIcon, isContainerStep, resolveSteps, getChildStepIds } from './stepVisualUtils';

/**
 * BranchTargetList component
 */
function BranchTargetListComponent({
  branches,
  allSteps,
  depth,
  onStepClick,
  parentStepIds = [],
  collapsedStepIds,
  renderChildren,
}: BranchTargetListProps): React.ReactElement {

  // Check if a step is within the current container scope
  const isStepInScope = (stepId: string): boolean => {
    return parentStepIds.includes(stepId);
  };

  // Get step by ID
  const getStepById = (stepId: string): Step | undefined => {
    return allSteps.find((s) => s.id === stepId);
  };

  return (
    <Box
      sx={{
        ml: 2,
        mt: 0.5,
        pl: 1,
        borderLeft: '2px solid',
        borderColor: '#ed6c02',
      }}
    >
      {branches.map((branch, branchIndex) => {
        const hasTarget = branch.nextStepId && branch.nextStepId !== '';
        const targetStep = hasTarget ? getStepById(branch.nextStepId) : undefined;
        const isInScope = hasTarget && isStepInScope(branch.nextStepId);
        const isExitingScope = hasTarget && !isInScope && targetStep !== undefined;
        const isContainerTarget = targetStep && isContainerStep(targetStep);
        const isCollapsed = targetStep ? collapsedStepIds.has(targetStep.id) : false;

        // Determine target display name
        let targetName = '(no target)';
        if (hasTarget) {
          if (targetStep) {
            targetName = targetStep.name;
            if (isExitingScope) {
              targetName += ' (exit)';
            }
          } else {
            targetName = '(unknown step)';
          }
        }

        const branchLabel = branch.label || (branch.isDefault ? 'default' : `branch ${branchIndex + 1}`);

        return (
          <Box
            key={branch.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              py: 0.25,
            }}
          >
            {/* Branch header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.65rem',
                color: 'text.secondary',
              }}
            >
              <SubdirectoryArrowRightIcon sx={{ fontSize: 12, color: '#ed6c02' }} />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ed6c02' }}
              >
                {branchLabel}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
              >
                →
              </Typography>

              {/* Container target card */}
              {isContainerTarget && targetStep ? (
                <Box
                  onClick={(e) => onStepClick(branch.nextStepId, e)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.5,
                    bgcolor: `${getStepColor(targetStep.type)}08`,
                    border: '1.5px solid',
                    borderColor: getStepColor(targetStep.type),
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: `${getStepColor(targetStep.type)}15`,
                      boxShadow: `0 2px 6px ${getStepColor(targetStep.type)}40`,
                    },
                  }}
                >
                  <Box sx={{ color: getStepColor(targetStep.type), display: 'flex' }}>
                    {getStepIcon(targetStep.type, 12)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: getStepColor(targetStep.type),
                      maxWidth: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {targetStep.name}
                  </Typography>
                  <Chip
                    label={targetStep.type}
                    size="small"
                    sx={{
                      fontSize: '0.5rem',
                      height: 14,
                      bgcolor: `${getStepColor(targetStep.type)}20`,
                      color: getStepColor(targetStep.type),
                    }}
                  />
                  {isExitingScope && (
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.5rem', color: 'warning.main', fontStyle: 'italic' }}
                    >
                      (exit)
                    </Typography>
                  )}
                </Box>
              ) : (
                /* Simple text target */
                <Typography
                  variant="caption"
                  onClick={(e) => hasTarget && branch.nextStepId ? onStepClick(branch.nextStepId, e) : undefined}
                  sx={{
                    fontSize: '0.65rem',
                    color: isInScope ? 'text.primary' : isExitingScope ? 'warning.main' : 'text.disabled',
                    fontStyle: isInScope ? 'normal' : 'italic',
                    fontWeight: isExitingScope ? 600 : 400,
                    cursor: hasTarget ? 'pointer' : 'default',
                    '&:hover': hasTarget ? { textDecoration: 'underline' } : {},
                  }}
                >
                  {targetName}
                </Typography>
              )}
            </Box>

            {/* Container children (recursive) */}
            {isContainerTarget && targetStep && !isCollapsed && (
              <Collapse in={!isCollapsed}>
                <Box
                  sx={{
                    ml: 3,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: `${getStepColor(targetStep.type)}40`,
                  }}
                >
                  {renderChildren(
                    resolveSteps(getChildStepIds(targetStep), allSteps),
                    depth + 1
                  )}
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export const BranchTargetList = memo(BranchTargetListComponent);
