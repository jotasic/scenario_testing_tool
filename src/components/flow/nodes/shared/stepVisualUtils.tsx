/**
 * Utility functions for step visualization
 * Provides icons, colors, and helper functions for rendering steps
 */

import HttpIcon from '@mui/icons-material/Http';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import LoopIcon from '@mui/icons-material/Loop';
import FolderIcon from '@mui/icons-material/Folder';
import type { Step, StepType, LoopStep, GroupStep } from '@/types';

/**
 * Color mapping for each step type
 */
export const STEP_COLORS: Record<StepType, string> = {
  request: '#1976d2',
  condition: '#ed6c02',
  loop: '#9c27b0',
  group: '#0288d1',
};

/**
 * Get the theme color for a step type
 */
export function getStepColor(type: StepType): string {
  return STEP_COLORS[type] || '#757575';
}

/**
 * Get the icon component for a step type
 */
export function getStepIcon(type: StepType, fontSize: number = 14): React.ReactElement | null {
  const sx = { fontSize };

  switch (type) {
    case 'request':
      return <HttpIcon sx={sx} />;
    case 'condition':
      return <AltRouteIcon sx={sx} />;
    case 'loop':
      return <LoopIcon sx={sx} />;
    case 'group':
      return <FolderIcon sx={sx} />;
    default:
      return null;
  }
}

/**
 * Check if a step is a container (can have children)
 */
export function isContainerStep(step: Step): step is (LoopStep | GroupStep) {
  return step.type === 'loop' || step.type === 'group';
}

/**
 * Get child step IDs from a container step
 */
export function getChildStepIds(step: Step): string[] {
  if (step.type === 'loop' || step.type === 'group') {
    return (step as LoopStep | GroupStep).stepIds || [];
  }
  return [];
}

/**
 * Resolve step IDs to Step objects
 */
export function resolveSteps(stepIds: string[], allSteps: Step[]): Step[] {
  return stepIds
    .map((id) => allSteps.find((s) => s.id === id))
    .filter((s): s is Step => s !== undefined);
}

/**
 * Calculate visual indent based on depth
 */
export function getIndentStyle(depth: number, baseIndent: number = 12): React.CSSProperties {
  return {
    marginLeft: depth * baseIndent,
  };
}

/**
 * Get depth indicator color (progressively fades)
 */
export function getDepthIndicatorColor(depth: number, maxDepth: number): string {
  const opacity = Math.max(0.2, 1 - (depth / maxDepth) * 0.6);
  return `rgba(0, 0, 0, ${opacity})`;
}
