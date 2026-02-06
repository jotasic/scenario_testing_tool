/**
 * TFXNode - Unified TFX pipeline style node
 * Displays all step types in a consistent, professional format
 * Similar to TensorFlow Extended (TFX) pipeline visualization
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import HttpIcon from '@mui/icons-material/Http';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import RepeatIcon from '@mui/icons-material/Repeat';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { Step, StepExecutionStatus } from '@/types';

interface TFXNodeData {
  step: Step;
  status?: StepExecutionStatus;
  currentIteration?: number;
  totalIterations?: number;
  isStartStep?: boolean;
  allSteps?: Step[];
}

// Type-specific colors (header background)
const TYPE_COLORS: Record<string, string> = {
  request: '#1976D2',    // Blue
  condition: '#F57C00',  // Orange
  loop: '#7B1FA2',       // Purple
  group: '#0288D1',      // Cyan
};

// Status colors (border)
const STATUS_COLORS: Record<StepExecutionStatus, string> = {
  pending: '#9E9E9E',
  running: '#2196F3',
  waiting: '#FF9800',
  success: '#4CAF50',
  failed: '#F44336',
  skipped: '#9E9E9E',
  cancelled: '#757575',
};

// Status icons
const STATUS_ICONS: Record<StepExecutionStatus, React.ReactNode> = {
  pending: <HourglassEmptyIcon sx={{ fontSize: 14 }} />,
  running: <PlayArrowIcon sx={{ fontSize: 14 }} />,
  waiting: <HourglassEmptyIcon sx={{ fontSize: 14 }} />,
  success: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  failed: <ErrorIcon sx={{ fontSize: 14 }} />,
  skipped: <HourglassEmptyIcon sx={{ fontSize: 14 }} />,
  cancelled: <ErrorIcon sx={{ fontSize: 14 }} />,
};

// Type icons
function getTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    request: <HttpIcon sx={{ fontSize: 16 }} />,
    condition: <CallSplitIcon sx={{ fontSize: 16 }} />,
    loop: <RepeatIcon sx={{ fontSize: 16 }} />,
    group: <FolderIcon sx={{ fontSize: 16 }} />,
  };
  return icons[type] || <HttpIcon sx={{ fontSize: 16 }} />;
}

// Get step type label
function getTypeLabel(step: Step): string {
  if (step.type === 'request') {
    return step.method;
  }
  return step.type.toUpperCase();
}

// Get step details for display
function getStepDetails(step: Step, currentIteration?: number, totalIterations?: number): string[] {
  const details: string[] = [];

  switch (step.type) {
    case 'request':
      details.push(`Endpoint: ${step.endpoint}`);
      if (step.saveResponse) {
        details.push(`Save Response: ${step.responseAlias || step.id}`);
      }
      break;
    case 'condition':
      details.push(`Branches: ${step.branches.length}`);
      break;
    case 'loop':
      if (currentIteration !== undefined && totalIterations !== undefined) {
        details.push(`Iteration: ${currentIteration + 1}/${totalIterations}`);
      } else if (step.loop.type === 'count') {
        details.push(`Count: ${step.loop.count}`);
      } else if (step.loop.type === 'forEach') {
        details.push(`ForEach: ${step.loop.source}`);
      }
      details.push(`Steps: ${step.stepIds.length}`);
      break;
    case 'group':
      details.push(`Steps: ${step.stepIds.length}`);
      break;
  }

  if (step.description) {
    details.push(step.description);
  }

  return details;
}

function TFXNode({ data, selected }: NodeProps<TFXNodeData>) {
  const { step, status, currentIteration, totalIterations, isStartStep } = data;

  const typeColor = TYPE_COLORS[step.type] || '#666';
  const borderColor = status ? STATUS_COLORS[status] : '#E0E0E0';
  const details = getStepDetails(step, currentIteration, totalIterations);

  // Running animation
  const isRunning = status === 'running';

  return (
    <Box
      sx={{
        width: 180,
        backgroundColor: 'background.paper',
        border: '2px solid',
        borderColor: borderColor,
        borderRadius: '4px',
        boxShadow: selected ? 3 : 1,
        transition: 'all 0.2s',
        overflow: 'hidden',
        animation: isRunning ? 'tfx-pulse 2s ease-in-out infinite' : 'none',
        '@keyframes tfx-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)',
            borderColor: borderColor,
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(33, 150, 243, 0.1)',
            borderColor: '#2196F3',
          },
        },
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* Header - Type and Icon */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          backgroundColor: typeColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          minHeight: 32,
        }}
      >
        {getTypeIcon(step.type)}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            flex: 1,
          }}
        >
          {getTypeLabel(step)}
        </Typography>
        {isStartStep && (
          <Chip
            label="START"
            size="small"
            sx={{
              height: 16,
              fontSize: '0.55rem',
              fontWeight: 700,
              bgcolor: 'success.main',
              color: 'white',
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
        )}
      </Box>

      {/* Body - Step Info */}
      <Box sx={{ p: 1.5 }}>
        {/* Step Name */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            mb: 0.75,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
          title={step.name}
        >
          {step.name}
        </Typography>

        {/* Status */}
        {status && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <Box sx={{ color: STATUS_COLORS[status], display: 'flex' }}>
              {STATUS_ICONS[status]}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: STATUS_COLORS[status],
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {status}
            </Typography>
          </Box>
        )}

        {/* Details */}
        {details.slice(0, 2).map((detail, idx) => (
          <Typography
            key={idx}
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              color: 'text.secondary',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}
            title={detail}
          >
            {detail}
          </Typography>
        ))}

        {/* Execution Mode Badge */}
        {step.executionMode !== 'auto' && (
          <Chip
            label={step.executionMode}
            size="small"
            variant="outlined"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              mt: 0.5,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>

      {/* Source Handle (Bottom) - Default */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* Branch Handles (Right) - For Condition and Request with branches */}
      {step.type === 'condition' && step.branches.length > 0 && (
        <>
          {step.branches.map((branch, index) => (
            <Handle
              key={branch.id}
              type="source"
              position={Position.Right}
              id={branch.id}
              style={{
                background: branch.isDefault ? '#FFA500' : '#4CAF50',
                width: 8,
                height: 8,
                border: '2px solid white',
                top: `${50 + (index - step.branches.length / 2 + 0.5) * 20}%`,
              }}
            />
          ))}
        </>
      )}

      {step.type === 'request' && step.branches && step.branches.length > 0 && (
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
                  border: '2px solid white',
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

export default memo(TFXNode);
