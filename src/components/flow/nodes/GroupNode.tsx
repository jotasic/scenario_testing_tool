/**
 * GroupNode - Custom node for group steps
 * Container-style node for organizing related steps
 * Shows child steps inline for better visualization
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import type { GroupStep, Step, StepExecutionStatus } from '@/types';
import { useDispatch } from 'react-redux';
import { setSelectedStep } from '@/store/uiSlice';
import { RecursiveStepList } from './shared';

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

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const { step, status, isStartStep, allSteps = [] } = data;
  const statusColor = getStatusColor(status);
  const isCollapsed = step.collapsed ?? false;
  const dispatch = useDispatch();
  const [collapsedStepIds, setCollapsedStepIds] = useState<Set<string>>(new Set());

  // Resolve child steps
  const childSteps = useMemo(() => {
    return step.stepIds
      .map((id) => allSteps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined);
  }, [step.stepIds, allSteps]);

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
        backgroundColor: '#e3f2fd',
        border: selected ? '4px solid' : isStartStep ? '3px solid' : '3px solid',
        borderColor: selected ? 'primary.main' : isStartStep ? 'success.main' : '#0288d1',
        borderRadius: 3,
        boxShadow: selected ? '0 8px 24px rgba(2, 136, 209, 0.4)' : isStartStep ? '0 4px 12px rgba(76, 175, 80, 0.3)' : status === 'running' ? '0 0 20px rgba(33, 150, 243, 0.6)' : '0 4px 16px rgba(2, 136, 209, 0.25)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        animation: status === 'running' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        '@keyframes pulse-glow': {
          '0%, 100%': {
            boxShadow: status === 'running' ? '0 0 10px rgba(33, 150, 243, 0.4)' : '0 4px 16px rgba(2, 136, 209, 0.25)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(33, 150, 243, 0.8), 0 0 35px rgba(33, 150, 243, 0.6)',
          },
        },
        '&:hover': {
          boxShadow: status === 'running' ? '0 0 30px rgba(33, 150, 243, 0.8)' : '0 8px 32px rgba(2, 136, 209, 0.35)',
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
          <>
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

            {/* Recursive Step List */}
            <RecursiveStepList
              steps={childSteps}
              allSteps={allSteps}
              containerType="group"
              containerColor="#0288d1"
              depth={0}
              maxDepth={4}
              collapsedStepIds={collapsedStepIds}
              autoCollapseDepth={2}
              onStepClick={handleStepClick}
              onToggleCollapse={handleToggleCollapse}
              parentStepIds={step.stepIds}
            />
          </>
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
