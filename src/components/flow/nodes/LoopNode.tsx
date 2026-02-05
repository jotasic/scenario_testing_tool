/**
 * LoopNode - Custom node for loop steps
 * Displays loop type, iteration info, and child steps inline
 */

import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip, Stack, LinearProgress } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import RepeatIcon from '@mui/icons-material/Repeat';
import HttpIcon from '@mui/icons-material/Http';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import type { LoopStep, Step, StepExecutionStatus, ConditionStep } from '@/types';

interface LoopNodeData {
  step: LoopStep;
  status?: StepExecutionStatus;
  currentIteration?: number;
  totalIterations?: number;
  selected?: boolean;
  isStartStep?: boolean;
  allSteps?: Step[];
}

const getStatusColor = (status?: StepExecutionStatus): string => {
  const colors: Record<StepExecutionStatus, string> = {
    pending: '#9E9E9E',
    running: '#2196F3',
    waiting: '#FF9800',
    success: '#4CAF50',
    failed: '#F44336',
    skipped: '#9E9E9E',
    cancelled: '#757575',
  };
  return status ? colors[status] : '#9E9E9E';
};

const getLoopTypeLabel = (loopType: string): string => {
  const labels: Record<string, string> = {
    forEach: 'FOR EACH',
    count: 'COUNT',
    while: 'WHILE',
  };
  return labels[loopType] || loopType.toUpperCase();
};

const getLoopInfo = (step: LoopStep): string => {
  const { loop } = step;

  switch (loop.type) {
    case 'forEach':
      return `over ${loop.source}`;
    case 'count':
      return `${loop.count} iterations`;
    case 'while':
      return 'while condition true';
    default:
      return '';
  }
};

const getStepIcon = (type: string) => {
  switch (type) {
    case 'request':
      return <HttpIcon sx={{ fontSize: 14 }} />;
    case 'condition':
      return <AltRouteIcon sx={{ fontSize: 14 }} />;
    case 'loop':
      return <LoopIcon sx={{ fontSize: 14 }} />;
    case 'group':
      return <FolderIcon sx={{ fontSize: 14 }} />;
    default:
      return null;
  }
};

const getStepColor = (type: string) => {
  switch (type) {
    case 'request':
      return '#1976d2';
    case 'condition':
      return '#ed6c02';
    case 'loop':
      return '#9c27b0';
    case 'group':
      return '#0288d1';
    default:
      return '#757575';
  }
};

function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  const { step, status, currentIteration, totalIterations, isStartStep, allSteps = [] } = data;
  const statusColor = getStatusColor(status);

  // Resolve child steps
  const childSteps = useMemo(() => {
    return step.stepIds
      .map((id) => allSteps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined);
  }, [step.stepIds, allSteps]);

  // Helper to get step name by ID
  const getStepNameById = (stepId: string): string => {
    const targetStep = allSteps.find((s) => s.id === stepId);
    return targetStep?.name || '(unknown)';
  };

  // Check if a step is inside the loop
  const isStepInLoop = (stepId: string): boolean => {
    return step.stepIds.includes(stepId);
  };

  // Calculate progress percentage
  const progressPercent = currentIteration !== undefined && totalIterations !== undefined && totalIterations > 0
    ? ((currentIteration + 1) / totalIterations) * 100
    : 0;

  return (
    <Box
      sx={{
        minWidth: 240,
        maxWidth: 340,
        backgroundColor: '#f3e5f5',
        border: selected ? '4px solid' : isStartStep ? '3px solid' : '3px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : '#9c27b0',
        borderRadius: 3,
        boxShadow: selected ? '0 8px 24px rgba(156, 39, 176, 0.4)' : isStartStep ? '0 4px 12px rgba(76, 175, 80, 0.3)' : '0 4px 16px rgba(156, 39, 176, 0.25)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(156, 39, 176, 0.35)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#555',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />

      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RepeatIcon sx={{ fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.name}
          </Typography>
          {isStartStep && (
            <Chip
              label="START"
              size="small"
              sx={{
                fontSize: '0.6rem',
                height: 18,
                bgcolor: 'success.main',
                color: 'white',
              }}
            />
          )}
        </Box>

        {/* Loop Type Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip
            label={getLoopTypeLabel(step.loop.type)}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 18,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
            {getLoopInfo(step)}
          </Typography>
        </Box>

        {step.description && (
          <Typography
            variant="caption"
            sx={{
              opacity: 0.8,
              display: 'block',
              mt: 0.5,
              fontSize: '0.6rem',
            }}
          >
            {step.description}
          </Typography>
        )}
      </Box>

      {/* Progress Bar (when running) */}
      {status === 'running' && totalIterations !== undefined && totalIterations > 0 && (
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 4,
            bgcolor: 'rgba(156, 39, 176, 0.1)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#9c27b0',
            },
          }}
        />
      )}

      {/* Status Indicator */}
      {status && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid white',
            boxShadow: status === 'running' ? `0 0 8px ${statusColor}` : 'none',
            animation: status === 'running' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
      )}

      {/* Iteration Progress */}
      {currentIteration !== undefined && totalIterations !== undefined && (
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            bgcolor: '#f3e5f5',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#9c27b0',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          >
            Iteration {currentIteration + 1} / {totalIterations}
          </Typography>
        </Box>
      )}

      {/* Child Steps Content */}
      <Box
        sx={{
          p: 1.5,
          background: 'linear-gradient(to bottom, rgba(156, 39, 176, 0.03), rgba(156, 39, 176, 0.08))',
        }}
      >
        {childSteps.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              display: 'block',
              textAlign: 'center',
              py: 1,
            }}
          >
            No steps in loop body
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {/* Loop indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: 1,
                borderLeft: '4px solid #9c27b0',
                mb: 1,
              }}
            >
              <LoopIcon sx={{ fontSize: 14, color: '#9c27b0' }} />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9c27b0' }}>
                LOOP BODY ({childSteps.length} step{childSteps.length !== 1 ? 's' : ''})
              </Typography>
            </Box>

            {childSteps.map((childStep, index) => (
              <Box key={childStep.id}>
                {/* Arrow between steps */}
                {index > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
                    <ArrowDownwardIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  </Box>
                )}
                {/* Child Step Item */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    p: 1,
                    bgcolor: 'white',
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: getStepColor(childStep.type),
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    // Enhanced visual for nested containers
                    ...(childStep.type === 'loop' || childStep.type === 'group' ? {
                      bgcolor: `${getStepColor(childStep.type)}08`,
                      borderWidth: '3px',
                      fontWeight: 700,
                    } : {}),
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box sx={{ color: getStepColor(childStep.type), display: 'flex' }}>
                    {getStepIcon(childStep.type)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      fontWeight: (childStep.type === 'loop' || childStep.type === 'group') ? 700 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.7rem',
                    }}
                  >
                    {childStep.name}
                    {(childStep.type === 'loop' || childStep.type === 'group') && (
                      <Typography component="span" sx={{ ml: 0.5, fontSize: '0.6rem', opacity: 0.7 }}>
                        ({(childStep as any).stepIds?.length || 0} steps)
                      </Typography>
                    )}
                  </Typography>
                  <Chip
                    label={childStep.type}
                    size="small"
                    sx={{
                      fontSize: '0.55rem',
                      height: 16,
                      bgcolor: `${getStepColor(childStep.type)}15`,
                      color: getStepColor(childStep.type),
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Condition Branches Visualization */}
                {childStep.type === 'condition' && (childStep as ConditionStep).branches.length > 0 && (
                  <Box
                    sx={{
                      ml: 2,
                      mt: 0.5,
                      pl: 1,
                      borderLeft: '2px solid',
                      borderColor: '#ed6c02',
                    }}
                  >
                    {(childStep as ConditionStep).branches.map((branch, branchIndex) => {
                      // Determine target step info
                      const hasNextStepId = branch.nextStepId && branch.nextStepId !== '';
                      const isInLoop = hasNextStepId && isStepInLoop(branch.nextStepId);

                      let targetName = '(no target)';
                      let isExitingLoop = false;

                      if (hasNextStepId) {
                        const targetStepName = getStepNameById(branch.nextStepId);
                        if (targetStepName && targetStepName !== '(unknown)') {
                          // Step exists
                          if (isInLoop) {
                            targetName = targetStepName;
                          } else {
                            // Step exists but outside loop - this exits the loop
                            targetName = `${targetStepName} (exit loop)`;
                            isExitingLoop = true;
                          }
                        } else {
                          // Step ID set but step not found
                          targetName = '(unknown step)';
                        }
                      }

                      const branchLabel = branch.label || (branch.isDefault ? 'default' : `branch ${branchIndex + 1}`);

                      return (
                        <Box
                          key={branch.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            py: 0.25,
                            fontSize: '0.65rem',
                            color: 'text.secondary',
                          }}
                        >
                          <SubdirectoryArrowRightIcon sx={{ fontSize: 12, color: '#ed6c02' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: '#ed6c02',
                            }}
                          >
                            {branchLabel}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: 'text.secondary',
                            }}
                          >
                            →
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: isInLoop ? 'text.primary' : isExitingLoop ? 'warning.main' : 'text.disabled',
                              fontStyle: isInLoop ? 'normal' : 'italic',
                              fontWeight: isExitingLoop ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {targetName}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}

            {/* Loop back indicator */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.75,
                mt: 1,
                p: 1,
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: 1,
                border: '2px dashed #9c27b0',
              }}
            >
              <RepeatIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9c27b0' }}>
                REPEAT TO START
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: '#f5f5f5',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
          {childSteps.length} step{childSteps.length !== 1 ? 's' : ''} in loop
        </Typography>
        {step.executionMode !== 'auto' && (
          <Chip
            label={step.executionMode}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.6rem', height: 16 }}
          />
        )}
      </Box>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#555',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
    </Box>
  );
}

export default memo(LoopNode);
