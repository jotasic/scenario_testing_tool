/**
 * Graph Layout Utilities
 * Auto-arrange nodes in a flow graph using Dagre-like layout algorithm
 */

import type { Step } from '@/types';

interface LayoutOptions {
  /** Horizontal spacing between nodes */
  nodeSpacingX?: number;
  /** Vertical spacing between nodes */
  nodeSpacingY?: number;
  /** Node width for layout calculation */
  nodeWidth?: number;
  /** Node height for layout calculation */
  nodeHeight?: number;
  /** Layout direction: 'TB' (top-bottom) or 'LR' (left-right) */
  direction?: 'TB' | 'LR';
}

interface Edge {
  sourceStepId: string;
  targetStepId: string;
}

/**
 * Calculate new positions for nodes using a simple hierarchical layout
 * Based on topological sorting and level assignment
 */
export function calculateAutoLayout(
  steps: Step[],
  edges: Edge[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeSpacingX = 200,
    nodeSpacingY = 150,
    nodeWidth = 180,
    nodeHeight = 80,
    direction = 'TB',
  } = options;

  const positions = new Map<string, { x: number; y: number }>();

  if (steps.length === 0) {
    return positions;
  }

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  steps.forEach(step => {
    adjacencyList.set(step.id, []);
    inDegree.set(step.id, 0);
  });

  edges.forEach(edge => {
    const sources = adjacencyList.get(edge.sourceStepId);
    if (sources) {
      sources.push(edge.targetStepId);
    }
    inDegree.set(edge.targetStepId, (inDegree.get(edge.targetStepId) || 0) + 1);
  });

  // Assign levels using BFS (topological sort)
  const levels = new Map<string, number>();
  const queue: string[] = [];

  // Start with nodes that have no incoming edges
  steps.forEach(step => {
    if ((inDegree.get(step.id) || 0) === 0) {
      queue.push(step.id);
      levels.set(step.id, 0);
    }
  });

  // BFS to assign levels
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    const neighbors = adjacencyList.get(current) || [];

    neighbors.forEach(neighbor => {
      if (!levels.has(neighbor)) {
        levels.set(neighbor, currentLevel + 1);
        queue.push(neighbor);
      } else {
        // Ensure the neighbor is at least one level below
        const existingLevel = levels.get(neighbor) || 0;
        if (existingLevel <= currentLevel) {
          levels.set(neighbor, currentLevel + 1);
        }
      }
    });
  }

  // Handle disconnected nodes (assign them level 0 if not assigned)
  steps.forEach(step => {
    if (!levels.has(step.id)) {
      levels.set(step.id, 0);
    }
  });

  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });

  // Calculate positions
  const maxNodesInLevel = Math.max(
    ...Array.from(levelGroups.values()).map(nodes => nodes.length)
  );

  levelGroups.forEach((nodeIds, level) => {
    const nodesInLevel = nodeIds.length;
    const totalWidth = (nodesInLevel - 1) * (nodeWidth + nodeSpacingX);
    const startX = (maxNodesInLevel * (nodeWidth + nodeSpacingX) - totalWidth) / 2;

    nodeIds.forEach((nodeId, index) => {
      let x: number, y: number;

      if (direction === 'TB') {
        // Top to bottom layout
        x = startX + index * (nodeWidth + nodeSpacingX);
        y = level * (nodeHeight + nodeSpacingY) + 50;
      } else {
        // Left to right layout
        x = level * (nodeWidth + nodeSpacingX) + 50;
        y = startX + index * (nodeHeight + nodeSpacingY);
      }

      positions.set(nodeId, { x, y });
    });
  });

  return positions;
}

/**
 * Apply auto-layout to steps and return updated steps with new positions
 */
export function applyAutoLayout(
  steps: Step[],
  edges: Edge[],
  options?: LayoutOptions
): Step[] {
  const newPositions = calculateAutoLayout(steps, edges, options);

  return steps.map(step => {
    const newPosition = newPositions.get(step.id);
    if (newPosition) {
      return {
        ...step,
        position: newPosition,
      };
    }
    return step;
  });
}
