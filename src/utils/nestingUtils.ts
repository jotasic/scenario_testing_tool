/**
 * Utility functions for calculating and managing step nesting depth
 */

import type { Step, LoopStep, GroupStep } from '@/types';

/**
 * Maximum allowed nesting depth for Loop and Group steps
 * This prevents overly complex nested structures that are hard to visualize
 */
export const MAX_NESTING_DEPTH = 3;

/**
 * Checks if a step is a container (Loop or Group) that can have children
 */
function isContainerStep(step: Step): step is LoopStep | GroupStep {
  return step.type === 'loop' || step.type === 'group';
}

/**
 * Calculates the nesting depth of a specific step within the step hierarchy
 *
 * The depth is calculated by counting how many container steps (Loop/Group)
 * contain the given step, either directly or indirectly.
 *
 * Examples:
 * - Root level step: depth = 0
 * - Step inside Loop1: depth = 1
 * - Step inside Loop2 which is inside Loop1: depth = 2
 * - Step inside Loop3 > Loop2 > Loop1: depth = 3
 *
 * @param stepId - ID of the step to calculate depth for
 * @param allSteps - All steps in the scenario
 * @returns Nesting depth (0 = root level, 1 = inside one container, etc.)
 */
export function calculateNestingDepth(stepId: string, allSteps: Step[]): number {
  let depth = 0;
  let currentStepId: string | null = stepId;

  // Keep searching for parent containers until we reach root level
  while (currentStepId !== null) {
    const parentContainer = findParentContainer(currentStepId, allSteps);

    if (parentContainer) {
      depth++;
      currentStepId = parentContainer.id;
    } else {
      // No parent found, we've reached the root
      currentStepId = null;
    }
  }

  return depth;
}

/**
 * Finds the direct parent container (Loop or Group) that contains the given step
 *
 * @param stepId - ID of the step to find parent for
 * @param allSteps - All steps in the scenario
 * @returns Parent container step, or null if step is at root level
 */
function findParentContainer(stepId: string, allSteps: Step[]): LoopStep | GroupStep | null {
  for (const step of allSteps) {
    if (isContainerStep(step) && step.stepIds.includes(stepId)) {
      return step;
    }
  }
  return null;
}

/**
 * Checks if adding a nested container (Loop/Group) within the current step
 * would exceed the maximum allowed nesting depth
 *
 * @param currentStepId - ID of the step where we want to add a nested container
 * @param allSteps - All steps in the scenario
 * @returns true if nesting limit would be exceeded, false otherwise
 */
export function wouldExceedNestingLimit(currentStepId: string, allSteps: Step[]): boolean {
  const currentDepth = calculateNestingDepth(currentStepId, allSteps);

  // If we add a nested container inside currentStep, its depth will be currentDepth + 1
  // We want to prevent creating containers at depth MAX_NESTING_DEPTH or higher
  return (currentDepth + 1) >= MAX_NESTING_DEPTH;
}

/**
 * Gets a user-friendly message explaining the nesting limit
 */
export function getNestingLimitMessage(): string {
  return `Maximum ${MAX_NESTING_DEPTH} levels of nesting allowed`;
}
