/**
 * GroupNode - Custom node for group steps
 * Container-style node for organizing related steps
 * Shows child steps inline for better visualization
 */

import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip, Stack } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import HttpIcon from '@mui/icons-material/Http';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import LoopIcon from '@mui/icons-material/Loop';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import type { GroupStep, Step, StepExecutionStatus, ConditionStep } from '@/types';

interface GroupNodeData {
  step: GroupStep;
  status?: StepExecutionStatus;
  selected?: boolean;
  isStartStep?: boolean;
  // All steps in scenario for resolving child steps
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

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const { step, status, isStartStep, allSteps = [] } = data;
  const statusColor = getStatusColor(status);
  const isCollapsed = step.collapsed ?? false;

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

  // Check if a step is inside the group
  const isStepInGroup = (stepId: string): boolean => {
    return step.stepIds.includes(stepId);
  };

  return (
    <Box
      sx={{
        minWidth: 240,
        maxWidth: 340,
        backgroundColor: '#e3f2fd',
        border: selected ? '4px solid' : isStartStep ? '3px solid' : '3px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : '#0288d1',
        borderRadius: 3,
        boxShadow: selected ? '0 8px 24px rgba(2, 136, 209, 0.4)' : isStartStep ? '0 4px 12px rgba(76, 175, 80, 0.3)' : '0 4px 16px rgba(2, 136, 209, 0.25)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(2, 136, 209, 0.35)',
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
          background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isCollapsed ? (
            <FolderIcon sx={{ fontSize: 20 }} />
          ) : (
            <FolderOpenIcon sx={{ fontSize: 20 }} />
          )}
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
        {step.description && (
          <Typography
            variant="caption"
            sx={{
              opacity: 0.9,
              display: 'block',
              mt: 0.5,
              fontSize: '0.65rem',
            }}
          >
            {step.description}
          </Typography>
        )}
      </Box>

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

      {/* Child Steps Content */}
      <Box
        sx={{
          p: 1.5,
          background: 'linear-gradient(to bottom, rgba(2, 136, 209, 0.03), rgba(2, 136, 209, 0.08))',
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
            No steps in group
          </Typography>
        ) : isCollapsed ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}
          >
            {childSteps.length} step{childSteps.length !== 1 ? 's' : ''} (collapsed)
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {/* Group indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                bgcolor: 'rgba(2, 136, 209, 0.1)',
                borderRadius: 1,
                borderLeft: '4px solid #0288d1',
                mb: 1,
              }}
            >
              <FolderOpenIcon sx={{ fontSize: 14, color: '#0288d1' }} />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#0288d1' }}>
                GROUP CONTENTS ({childSteps.length} step{childSteps.length !== 1 ? 's' : ''})
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
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.7rem',
                    }}
                  >
                    {childStep.name}
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
                      const isInGroup = hasNextStepId && isStepInGroup(branch.nextStepId);

                      let targetName = '(no target)';
                      let isExitingGroup = false;

                      if (hasNextStepId) {
                        const targetStepName = getStepNameById(branch.nextStepId);
                        if (targetStepName && targetStepName !== '(unknown)') {
                          // Step exists
                          if (isInGroup) {
                            targetName = targetStepName;
                          } else {
                            // Step exists but outside group - this exits the group
                            targetName = `${targetStepName} (exit group)`;
                            isExitingGroup = true;
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
                              color: isInGroup ? 'text.primary' : isExitingGroup ? 'warning.main' : 'text.disabled',
                              fontStyle: isInGroup ? 'normal' : 'italic',
                              fontWeight: isExitingGroup ? 600 : 400,
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
          {childSteps.length} step{childSteps.length !== 1 ? 's' : ''}
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

export default memo(GroupNode);
