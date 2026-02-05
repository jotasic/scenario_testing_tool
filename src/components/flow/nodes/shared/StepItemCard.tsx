/**
 * StepItemCard - Renders a single step as a clickable card
 *
 * Features:
 * - Type-specific icon and color
 * - Collapsible indicator for containers
 * - Depth-aware styling
 * - Click to select step
 */

import { memo } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { StepItemCardProps } from './types';
import { getStepColor, getStepIcon, isContainerStep, getChildStepIds } from './stepVisualUtils';

/**
 * StepItemCard component
 */
function StepItemCardComponent({
  step,
  depth,
  isCollapsed,
  onStepClick,
  onToggleCollapse,
}: StepItemCardProps): React.ReactElement {
  const stepColor = getStepColor(step.type);
  const isContainer = isContainerStep(step);
  const childCount = getChildStepIds(step).length;

  // Determine if this step is a nested container (needs special styling)
  const isNestedContainer = isContainer && depth > 0;

  // Handle collapse toggle
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(step.id);
  };

  return (
    <Box
      onClick={(e) => onStepClick(step.id, e)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        p: depth === 0 ? 1 : 0.75,
        bgcolor: isNestedContainer ? `${stepColor}08` : 'white',
        borderRadius: 1.5,
        border: isNestedContainer ? '2px solid' : '1.5px solid',
        borderColor: isNestedContainer ? stepColor : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: stepColor,
        boxShadow: depth === 0 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
        minHeight: depth === 0 ? 44 : 36,
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transform: 'translateX(2px)',
          bgcolor: isNestedContainer ? `${stepColor}12` : 'rgba(0,0,0,0.02)',
        },
      }}
    >
      {/* Step Icon */}
      <Box sx={{ color: stepColor, display: 'flex', flexShrink: 0 }}>
        {getStepIcon(step.type, depth === 0 ? 14 : 12)}
      </Box>

      {/* Step Name */}
      <Typography
        variant="caption"
        sx={{
          flex: 1,
          fontWeight: isContainer ? 700 : 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: depth === 0 ? '0.7rem' : '0.65rem',
          color: isNestedContainer ? stepColor : 'text.primary',
        }}
      >
        {step.name}
      </Typography>

      {/* Child count for containers */}
      {isContainer && (
        <Typography
          component="span"
          sx={{
            fontSize: '0.55rem',
            color: stepColor,
            opacity: 0.7,
          }}
        >
          ({childCount})
        </Typography>
      )}

      {/* Type chip */}
      <Chip
        label={step.type}
        size="small"
        sx={{
          fontSize: depth === 0 ? '0.55rem' : '0.5rem',
          height: depth === 0 ? 16 : 14,
          bgcolor: `${stepColor}15`,
          color: stepColor,
          fontWeight: 600,
          flexShrink: 0,
        }}
      />

      {/* Collapse toggle for containers */}
      {isContainer && childCount > 0 && (
        <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
          <IconButton
            size="small"
            onClick={handleToggleClick}
            sx={{
              p: 0.25,
              color: stepColor,
              '&:hover': {
                bgcolor: `${stepColor}20`,
              },
            }}
          >
            {isCollapsed ? (
              <ExpandMoreIcon sx={{ fontSize: 14 }} />
            ) : (
              <ExpandLessIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export const StepItemCard = memo(StepItemCardComponent);
