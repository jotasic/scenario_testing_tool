/**
 * Shared types for recursive step visualization components
 */

import type { Step, LoopStep, GroupStep, Branch } from '@/types';

/**
 * Container step types that can have children
 */
export type ContainerStep = LoopStep | GroupStep;

/**
 * Step types for visualization styling
 */
export type StepVisualizationType = 'request' | 'condition' | 'loop' | 'group';

/**
 * Props for RecursiveStepList component
 */
export interface RecursiveStepListProps {
  /** Steps to render */
  steps: Step[];
  /** All steps in the scenario (for resolving references) */
  allSteps: Step[];
  /** Parent container type (affects styling) */
  containerType: 'loop' | 'group' | 'root';
  /** Parent container's theme color */
  containerColor: string;
  /** Current nesting depth (0 = top level) */
  depth?: number;
  /** Maximum depth to render before showing placeholder */
  maxDepth?: number;
  /** Set of collapsed step IDs */
  collapsedStepIds?: Set<string>;
  /** Depth at which to auto-collapse (default: 2) */
  autoCollapseDepth?: number;
  /** Step click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse?: (stepId: string) => void;
  /** Parent step IDs (for scope checking) */
  parentStepIds?: string[];
}

/**
 * Props for StepItemCard component
 */
export interface StepItemCardProps {
  /** Step to render */
  step: Step;
  /** All steps for resolving references */
  allSteps: Step[];
  /** Current nesting depth */
  depth: number;
  /** Maximum rendering depth */
  maxDepth: number;
  /** Whether this step is collapsed */
  isCollapsed: boolean;
  /** Click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse: (stepId: string) => void;
  /** Container's theme color */
  containerColor: string;
  /** Parent step IDs (for scope checking) */
  parentStepIds?: string[];
  /** Recursive render function for children */
  renderChildren: (childSteps: Step[], newDepth: number) => React.ReactNode;
}

/**
 * Props for BranchTargetList component
 */
export interface BranchTargetListProps {
  /** Branches to render */
  branches: Branch[];
  /** All steps for resolving targets */
  allSteps: Step[];
  /** Current nesting depth */
  depth: number;
  /** Maximum rendering depth */
  maxDepth: number;
  /** Click handler */
  onStepClick: (stepId: string, event: React.MouseEvent) => void;
  /** Collapse toggle handler */
  onToggleCollapse: (stepId: string) => void;
  /** Parent step IDs for scope checking */
  parentStepIds?: string[];
  /** Collapsed step IDs */
  collapsedStepIds: Set<string>;
  /** Render function for nested children */
  renderChildren: (childSteps: Step[], newDepth: number) => React.ReactNode;
}
