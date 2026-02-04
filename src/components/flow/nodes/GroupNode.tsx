/**
 * GroupNode - Custom node for group steps
 * Container-style node for organizing related steps
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import type { GroupStep, StepExecutionStatus } from '@/types';

interface GroupNodeData {
  step: GroupStep;
  status?: StepExecutionStatus;
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

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const { step, status, isStartStep } = data;
  const statusColor = getStatusColor(status);
  const isCollapsed = step.collapsed ?? false;

  return (
    <Box
      sx={{
        minWidth: 200,
        maxWidth: 280,
        backgroundColor: 'background.paper',
        border: selected ? '2px solid' : isStartStep ? '2px solid' : '1px dashed',
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
          {isCollapsed ? (
            <FolderIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          ) : (
            <FolderOpenIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          )}
          <Chip
            label="GROUP"
            size="small"
            variant="outlined"
            sx={{
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

        {/* Step Count */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.7rem',
          }}
        >
          {step.stepIds.length} step{step.stepIds.length !== 1 ? 's' : ''}
          {isCollapsed ? ' (collapsed)' : ''}
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

export default memo(GroupNode);
