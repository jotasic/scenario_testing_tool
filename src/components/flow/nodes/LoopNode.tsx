/**
 * LoopNode - Custom node for loop steps
 * Displays loop type, iteration info, and child steps inline
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import RepeatIcon from '@mui/icons-material/Repeat';
import type { LoopStep, Step, StepExecutionStatus } from '@/types';
import { useDispatch } from 'react-redux';
import { setSelectedStep } from '@/store/uiSlice';
import { RecursiveStepList } from './shared';

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

function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  const { step, status, currentIteration, totalIterations, isStartStep, allSteps = [] } = data;
  const statusColor = getStatusColor(status);
  const dispatch = useDispatch();
  const [collapsedStepIds, setCollapsedStepIds] = useState<Set<string>>(new Set());

  // Resolve child steps
  const childSteps = useMemo(() => {
    return step.stepIds
      .map((id) => allSteps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined);
  }, [step.stepIds, allSteps]);

  // Calculate progress percentage
  const progressPercent = currentIteration !== undefined && totalIterations !== undefined && totalIterations > 0
    ? ((currentIteration + 1) / totalIterations) * 100
    : 0;

  // Handle clicking on a child step or branch target
  const handleStepClick = useCallback((stepId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering parent node selection
    dispatch(setSelectedStep(stepId));
  }, [dispatch]);

  // Handle collapse toggle
  const handleToggleCollapse = useCallback((stepId: string) => {
    setCollapsedStepIds(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  return (
    <Box
      sx={{
        minWidth: 240,
        maxWidth: 340,
        backgroundColor: '#f3e5f5',
        border: selected ? '4px solid' : isStartStep ? '3px solid' : '3px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : '#9c27b0',
        borderRadius: 3,
        boxShadow: selected ? '0 8px 24px rgba(156, 39, 176, 0.4)' : isStartStep ? '0 4px 12px rgba(76, 175, 80, 0.3)' : status === 'running' ? '0 0 20px rgba(33, 150, 243, 0.6)' : '0 4px 16px rgba(156, 39, 176, 0.25)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        animation: status === 'running' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        '@keyframes pulse-glow': {
          '0%, 100%': {
            boxShadow: status === 'running' ? '0 0 10px rgba(33, 150, 243, 0.4)' : '0 4px 16px rgba(156, 39, 176, 0.25)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(33, 150, 243, 0.8), 0 0 35px rgba(33, 150, 243, 0.6)',
          },
        },
        '&:hover': {
          boxShadow: status === 'running' ? '0 0 30px rgba(33, 150, 243, 0.8)' : '0 8px 32px rgba(156, 39, 176, 0.35)',
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

        {/* Recursive Step List */}
        <RecursiveStepList
          steps={childSteps}
          allSteps={allSteps}
          containerType="loop"
          containerColor="#9c27b0"
          depth={0}
          maxDepth={4}
          collapsedStepIds={collapsedStepIds}
          autoCollapseDepth={2}
          onStepClick={handleStepClick}
          onToggleCollapse={handleToggleCollapse}
          parentStepIds={step.stepIds}
        />

        {/* Loop back indicator */}
        {childSteps.length > 0 && (
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
