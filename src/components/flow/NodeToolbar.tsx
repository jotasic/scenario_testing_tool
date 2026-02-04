/**
 * NodeToolbar - Floating toolbar for adding nodes to the graph
 * Displays buttons for each step type with icons and tooltips
 */

import { Paper, IconButton, Tooltip } from '@mui/material';
import HttpIcon from '@mui/icons-material/Http';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import LoopIcon from '@mui/icons-material/Loop';
import FolderIcon from '@mui/icons-material/Folder';
import type { StepType } from '@/types';

interface NodeToolbarProps {
  /** Callback when user wants to add a node of a specific type */
  onAddNode: (type: StepType) => void;
  /** Whether the toolbar is disabled */
  disabled?: boolean;
}

const stepTypes: Array<{
  type: StepType;
  label: string;
  icon: React.ReactElement;
  color: string;
}> = [
  {
    type: 'request',
    label: 'Request',
    icon: <HttpIcon />,
    color: '#49CC90',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <CallSplitIcon />,
    color: '#FCA130',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <LoopIcon />,
    color: '#2196F3',
  },
  {
    type: 'group',
    label: 'Group',
    icon: <FolderIcon />,
    color: '#9E9E9E',
  },
];

export default function NodeToolbar({ onAddNode, disabled = false }: NodeToolbarProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        gap: 1,
        p: 1,
        backgroundColor: 'background.paper',
      }}
    >
      {stepTypes.map(({ type, label, icon, color }) => (
        <Tooltip key={type} title={`Add ${label}`} placement="bottom">
          <span>
            <IconButton
              onClick={() => onAddNode(type)}
              disabled={disabled}
              sx={{
                color: disabled ? 'action.disabled' : color,
                '&:hover': {
                  backgroundColor: disabled ? 'transparent' : `${color}20`,
                },
              }}
              aria-label={`Add ${label} step`}
            >
              {icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Paper>
  );
}
