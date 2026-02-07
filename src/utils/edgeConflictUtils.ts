/**
 * Edge Conflict Detection Utilities
 * Detects edge conflicts when cutting or moving steps to containers
 */

import type { Step, ScenarioEdge, LoopStep, GroupStep } from '@/types';

/**
 * Represents an edge conflict
 */
export interface EdgeConflict {
  /** The edge that will be affected */
  edge: ScenarioEdge;
  /** The source step of the edge */
  sourceStep: Step;
  /** The target step of the edge */
  targetStep: Step;
  /** Type of conflict */
  conflictType: 'outgoing' | 'incoming' | 'both';
  /** Human-readable description of the conflict */
  description: string;
}

/**
 * Result of edge conflict detection
 */
export interface EdgeConflictResult {
  /** Whether conflicts were detected */
  hasConflicts: boolean;
  /** List of detected conflicts */
  conflicts: EdgeConflict[];
  /** List of edge IDs that will be deleted if the operation proceeds */
  edgesToDelete: string[];
}

/**
 * Check if a step is inside a container (Loop or Group)
 */
export function isStepInContainer(
  stepId: string,
  containerId: string,
  allSteps: Step[]
): boolean {
  const container = allSteps.find(s => s.id === containerId);
  if (!container || (container.type !== 'loop' && container.type !== 'group')) {
    return false;
  }

  const containerStep = container as LoopStep | GroupStep;
  return containerStep.stepIds.includes(stepId);
}

/**
 * Get all parent containers of a step (from immediate parent to root)
 */
export function getParentContainers(stepId: string, allSteps: Step[]): string[] {
  const parents: string[] = [];

  const findParent = (targetId: string): string | null => {
    for (const step of allSteps) {
      if (step.type === 'loop' || step.type === 'group') {
        const containerStep = step as LoopStep | GroupStep;
        if (containerStep.stepIds.includes(targetId)) {
          return step.id;
        }
      }
    }
    return null;
  };

  let currentId = stepId;
  while (true) {
    const parentId = findParent(currentId);
    if (!parentId) break;
    parents.push(parentId);
    currentId = parentId;
  }

  return parents;
}

/**
 * Check if step will remain in the same container after the operation
 */
export function willStepStayInSameContainer(
  stepId: string,
  targetContainerId: string | null,
  allSteps: Step[]
): boolean {
  // Get current container (immediate parent)
  const currentParents = getParentContainers(stepId, allSteps);
  const currentContainer = currentParents[0] || null;

  return currentContainer === targetContainerId;
}

/**
 * Detect edge conflicts when cutting/moving a step to a container
 *
 * @param stepIds - IDs of steps to be cut/moved
 * @param targetContainerId - Target container ID (null for root level)
 * @param allSteps - All steps in the scenario
 * @param allEdges - All edges in the scenario
 * @param operation - Type of operation ('cut' or 'move')
 * @returns EdgeConflictResult containing conflicts and edges to delete
 */
export function detectEdgeConflicts(
  stepIds: string[],
  targetContainerId: string | null,
  allSteps: Step[],
  allEdges: ScenarioEdge[]
): EdgeConflictResult {
  const conflicts: EdgeConflict[] = [];
  const edgesToDelete = new Set<string>();
  const stepIdSet = new Set(stepIds);

  // Helper: Check if a step is in the target container scope
  const isInTargetScope = (stepId: string): boolean => {
    if (targetContainerId === null) {
      // Target is root level - step should not be in any container
      const parents = getParentContainers(stepId, allSteps);
      return parents.length === 0;
    } else {
      // Target is a container - step should be directly in that container
      return isStepInContainer(stepId, targetContainerId, allSteps);
    }
  };

  // Analyze each edge
  for (const edge of allEdges) {
    const sourceStep = allSteps.find(s => s.id === edge.sourceStepId);
    const targetStep = allSteps.find(s => s.id === edge.targetStepId);

    if (!sourceStep || !targetStep) continue;

    const isSourceSelected = stepIdSet.has(edge.sourceStepId);
    const isTargetSelected = stepIdSet.has(edge.targetStepId);

    // Case 1: Both source and target are being moved together
    if (isSourceSelected && isTargetSelected) {
      // No conflict - internal edge moves with the steps
      continue;
    }

    // Case 2: Only source is being moved
    if (isSourceSelected && !isTargetSelected) {
      // Check if target will be in the same scope after the move
      const targetInScope = isInTargetScope(edge.targetStepId);

      if (!targetInScope) {
        // Conflict: outgoing edge to external step
        conflicts.push({
          edge,
          sourceStep,
          targetStep,
          conflictType: 'outgoing',
          description: `${sourceStep.name} → ${targetStep.name} (outgoing to external step)`,
        });
        edgesToDelete.add(edge.id);
      }
    }

    // Case 3: Only target is being moved
    if (!isSourceSelected && isTargetSelected) {
      // Check if source will be in the same scope after the move
      const sourceInScope = isInTargetScope(edge.sourceStepId);

      if (!sourceInScope) {
        // Conflict: incoming edge from external step
        conflicts.push({
          edge,
          sourceStep,
          targetStep,
          conflictType: 'incoming',
          description: `${sourceStep.name} → ${targetStep.name} (incoming from external step)`,
        });
        edgesToDelete.add(edge.id);
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    edgesToDelete: Array.from(edgesToDelete),
  };
}

/**
 * Format edge conflict message for display
 */
export function formatConflictMessage(
  result: EdgeConflictResult,
  operation: 'cut' | 'move'
): string {
  if (!result.hasConflicts) {
    return '';
  }

  const opVerb = operation === 'cut' ? 'cutting' : 'moving';
  const lines: string[] = [
    `The following edge connections will be removed when ${opVerb} the selected step(s):`,
    '',
  ];

  // Group by conflict type
  const outgoing = result.conflicts.filter(c => c.conflictType === 'outgoing');
  const incoming = result.conflicts.filter(c => c.conflictType === 'incoming');

  if (outgoing.length > 0) {
    lines.push('Outgoing connections:');
    outgoing.forEach(c => lines.push(`  • ${c.description}`));
    if (incoming.length > 0) lines.push('');
  }

  if (incoming.length > 0) {
    lines.push('Incoming connections:');
    incoming.forEach(c => lines.push(`  • ${c.description}`));
  }

  lines.push('');
  lines.push(`Total: ${result.conflicts.length} edge(s) will be deleted.`);

  return lines.join('\n');
}
