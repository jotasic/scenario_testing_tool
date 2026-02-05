/**
 * RequestNode - Custom node for request steps
 * Displays HTTP method, endpoint, and execution status
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import type { RequestStep, StepExecutionStatus } from '@/types';

interface RequestNodeData {
  step: RequestStep;
  status?: StepExecutionStatus;
  selected?: boolean;
  isStartStep?: boolean;
}

const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: '#61AFFE',
    POST: '#49CC90',
    PUT: '#FCA130',
    PATCH: '#50E3C2',
    DELETE: '#F93E3E',
  };
  return colors[method] || '#999999';
};

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

function RequestNode({ data, selected }: NodeProps<RequestNodeData>) {
  const { step, status, isStartStep } = data;
  const methodColor = getMethodColor(step.method);
  const statusColor = getStatusColor(status);

  return (
    <Box
      sx={{
        minWidth: 250,
        maxWidth: 350,
        backgroundColor: 'background.paper',
        border: selected ? '2px solid' : isStartStep ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : 'divider',
        borderRadius: 2,
        boxShadow: selected ? 3 : isStartStep ? 2 : status === 'running' ? '0 0 20px rgba(33, 150, 243, 0.6)' : 1,
        transition: 'all 0.2s',
        position: 'relative',
        animation: status === 'running' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        '@keyframes pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(33, 150, 243, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(33, 150, 243, 0.8), 0 0 35px rgba(33, 150, 243, 0.6)',
          },
        },
        '&:hover': {
          boxShadow: status === 'running' ? '0 0 30px rgba(33, 150, 243, 0.8)' : 3,
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
        {/* Method Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={step.method}
            size="small"
            sx={{
              backgroundColor: methodColor,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: 24,
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

        {/* Endpoint */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {step.endpoint}
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

      {/* Branch Handles (if branches exist) */}
      {step.branches && step.branches.length > 0 && (
        <>
          {step.branches.map((branch, index) => {
            const branchCount = step.branches?.length ?? 0;
            return (
              <Handle
                key={branch.id}
                type="source"
                position={Position.Right}
                id={branch.id}
                style={{
                  background: branch.isDefault ? '#FFA500' : '#4CAF50',
                  width: 8,
                  height: 8,
                  top: `${50 + (index - branchCount / 2 + 0.5) * 20}%`,
                }}
              />
            );
          })}
        </>
      )}
    </Box>
  );
}

export default memo(RequestNode);
