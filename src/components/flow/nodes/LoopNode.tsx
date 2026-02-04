/**
 * LoopNode - Custom node for loop steps
 * Displays loop type and iteration information
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import type { LoopStep, StepExecutionStatus } from '@/types';

interface LoopNodeData {
  step: LoopStep;
  status?: StepExecutionStatus;
  currentIteration?: number;
  totalIterations?: number;
  selected?: boolean;
  isStartStep?: boolean;
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
      return `${loop.count} times`;
    case 'while':
      return 'while condition true';
    default:
      return '';
  }
};

function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  const { step, status, currentIteration, totalIterations, isStartStep } = data;
  const statusColor = getStatusColor(status);

  return (
    <Box
      sx={{
        minWidth: 220,
        maxWidth: 300,
        backgroundColor: 'background.paper',
        border: selected ? '2px solid' : isStartStep ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : 'divider',
        borderRadius: 2,
        boxShadow: selected ? 3 : isStartStep ? 2 : 1,
        transition: 'all 0.2s',
        position: 'relative',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#555',
          width: 10,
          height: 10,
        }}
      />

      {/* Status Indicator */}
      {status && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: status === 'running' ? `0 0 8px ${statusColor}` : 'none',
            animation: status === 'running' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
      )}

      {/* Node Content */}
      <Box sx={{ p: 2 }}>
        {/* Icon and Type */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <LoopIcon sx={{ fontSize: 20, color: 'info.main' }} />
          <Chip
            label={getLoopTypeLabel(step.loop.type)}
            size="small"
            sx={{
              backgroundColor: 'info.main',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              height: 22,
            }}
          />
          {isStartStep && (
            <Chip
              label="START"
              size="small"
              color="success"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
          {step.executionMode !== 'auto' && (
            <Chip
              label={step.executionMode}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        {/* Step Name */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {step.name}
        </Typography>

        {/* Loop Info */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getLoopInfo(step)}
        </Typography>

        {/* Iteration Progress */}
        {currentIteration !== undefined && totalIterations !== undefined && (
          <Typography
            variant="caption"
            sx={{
              color: 'info.main',
              display: 'block',
              mt: 0.5,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            Iteration {currentIteration + 1} / {totalIterations}
          </Typography>
        )}

        {/* Step Count */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            mt: 0.5,
            fontSize: '0.7rem',
          }}
        >
          {step.stepIds.length} child step{step.stepIds.length !== 1 ? 's' : ''}
        </Typography>

        {/* Description */}
        {step.description && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.5,
              fontSize: '0.65rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.description}
          </Typography>
        )}
      </Box>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#555',
          width: 10,
          height: 10,
        }}
      />
    </Box>
  );
}

export default memo(LoopNode);
