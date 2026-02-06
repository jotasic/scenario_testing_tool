/**
 * MiniFlowPreview Component
 * Displays a compact vertical flow chart of internal steps for Loop/Group containers
 */

import { Box, Paper, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { Step, ScenarioEdge } from '@/types';
import { getStepColor, getStepIcon } from '@/components/flow/nodes/shared/stepVisualUtils';

interface MiniFlowPreviewProps {
  stepIds: string[];
  allSteps: Step[];
  edges: ScenarioEdge[];
  onStepClick?: (stepId: string) => void;
}

export function MiniFlowPreview({ stepIds, allSteps, edges, onStepClick }: MiniFlowPreviewProps) {
  // Resolve step IDs to full step objects
  const steps = stepIds
    .map((id) => allSteps.find((s) => s.id === id))
    .filter((s): s is Step => s !== undefined);

  if (steps.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No steps yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add steps to visualize the flow
        </Typography>
      </Paper>
    );
  }

  // Find edges that connect steps within this container
  const getTargetSteps = (stepId: string): Array<{ step: Step; label?: string }> => {
    const outgoingEdges = edges.filter((e) => e.sourceStepId === stepId);
    const targets: Array<{ step: Step; label?: string }> = [];

    for (const edge of outgoingEdges) {
      const targetStep = steps.find((s) => s.id === edge.targetStepId);
      if (targetStep) {
        targets.push({ step: targetStep, label: edge.label });
      }
    }

    return targets;
  };

  // Check if step is a condition step with branches
  const isConditionWithBranches = (step: Step): boolean => {
    if (step.type !== 'condition') return false;
    const targets = getTargetSteps(step.id);
    return targets.length > 1;
  };

  return (
    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Internal Flow ({steps.length} step{steps.length !== 1 ? 's' : ''})
        </Typography>
      </Box>

      {/* Flow Chart */}
      <Box sx={{ p: 2, maxHeight: 400, overflowY: 'auto' }}>
        {steps.map((step, index) => {
          const isCondition = isConditionWithBranches(step);
          const targets = getTargetSteps(step.id);
          const isLastStep = index === steps.length - 1;

          return (
            <Box key={step.id}>
              {/* Step Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: onStepClick ? 'pointer' : 'default',
                  borderLeft: 3,
                  borderLeftColor: getStepColor(step.type),
                  transition: 'all 0.2s',
                  '&:hover': onStepClick
                    ? {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                      }
                    : undefined,
                }}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: `${getStepColor(step.type)}15`,
                    color: getStepColor(step.type),
                    flexShrink: 0,
                  }}
                >
                  {getStepIcon(step.type, 18)}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {step.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        bgcolor: `${getStepColor(step.type)}15`,
                        color: getStepColor(step.type),
                        fontWeight: 600,
                        fontSize: '0.65rem',
                      }}
                    >
                      {step.type}
                    </Typography>
                    {step.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {step.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              {/* Connection Arrows */}
              {!isLastStep && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  {isCondition && targets.length > 0 ? (
                    // Show branches for condition steps
                    <Box sx={{ width: '100%', px: 2 }}>
                      {targets.map((target, targetIndex) => (
                        <Box
                          key={target.step.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            ml: 2,
                            my: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 1,
                              bgcolor: 'text.secondary',
                            }}
                          />
                          <ArrowDownwardIcon
                            sx={{
                              fontSize: 16,
                              color: 'text.secondary',
                              transform: 'rotate(-90deg)',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {target.label || `Branch ${targetIndex + 1}`}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    // Simple arrow for sequential flow
                    <ArrowDownwardIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Footer Hint */}
      <Box
        sx={{
          p: 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Double-click to edit internal steps
        </Typography>
      </Box>
    </Paper>
  );
}
