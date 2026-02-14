/**
 * StepTreeItem Component
 * Recursive tree item for displaying steps in sidebar with container expansion
 */

import {
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Box,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { Step } from '@/types';

export interface StepTreeItemProps {
  step: Step;
  allSteps: Step[];
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  cutStepId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, stepId: string) => void;
}

export function StepTreeItem({
  step,
  allSteps,
  depth,
  selectedId,
  expandedIds,
  cutStepId,
  onToggle,
  onSelect,
  onContextMenu,
}: StepTreeItemProps) {
  const isContainer = step.type === 'loop' || step.type === 'group';
  const isExpanded = expandedIds.has(step.id);
  const childSteps = isContainer && 'stepIds' in step
    ? step.stepIds
        .map(id => allSteps.find(s => s.id === id))
        .filter((s): s is Step => s !== undefined)
    : [];

  const hasChildren = childSteps.length > 0;
  const isCut = cutStepId === step.id;

  return (
    <>
      <ListItemButton
        sx={{
          pl: 2 + depth * 2,
          '&:hover': {
            bgcolor: 'action.hover',
          },
          // Cut visualization - dimmed and dashed border
          ...(isCut && {
            opacity: 0.5,
            borderLeft: 3,
            borderColor: 'warning.main',
            borderStyle: 'dashed',
            bgcolor: alpha('#FF9800', 0.08),
          }),
        }}
        selected={selectedId === step.id}
        onClick={() => onSelect(step.id)}
        onContextMenu={(e) => onContextMenu(e, step.id)}
      >
        {isContainer && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(step.id);
            }}
            sx={{
              mr: 0.5,
              visibility: hasChildren ? 'visible' : 'hidden',
            }}
          >
            {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        )}
        {!isContainer && (
          <Box sx={{ width: 28, mr: 0.5 }} />
        )}
        <ListItemText
          primary={step.name}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
        <Chip
          label={step.type}
          size="small"
          sx={{
            ml: 1,
            height: 20,
            fontSize: '0.65rem',
          }}
        />
      </ListItemButton>

      {isContainer && hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {childSteps.map(child => (
            <StepTreeItem
              key={child.id}
              step={child}
              allSteps={allSteps}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              cutStepId={cutStepId}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}
