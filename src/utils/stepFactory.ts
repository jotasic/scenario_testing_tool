/**
 * Step Factory
 * Utility for creating default step instances
 */

import { v4 as uuidv4 } from 'uuid';
import type { Step, StepType } from '@/types';

/**
 * Create a default step based on type
 */
export function createDefaultStep(type: StepType, position: { x: number; y: number }): Step {
  const baseStep = {
    id: uuidv4(),
    type,
    name: `New ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    description: '',
    executionMode: 'auto' as const,
    position,
  };

  switch (type) {
    case 'request':
      return {
        ...baseStep,
        type: 'request',
        serverId: '',
        method: 'GET',
        endpoint: '/',
        headers: [],
        waitForResponse: true,
        saveResponse: true,
      };

    case 'condition':
      return {
        ...baseStep,
        type: 'condition',
        branches: [],
      };

    case 'loop':
      return {
        ...baseStep,
        type: 'loop',
        loop: {
          id: uuidv4(),
          type: 'count',
          count: 1,
        },
        stepIds: [],
        variableName: `loop_${Date.now()}`,
      };

    case 'group':
      return {
        ...baseStep,
        type: 'group',
        stepIds: [],
        collapsed: false,
      };

    default:
      throw new Error(`Unknown step type: ${type}`);
  }
}

/**
 * Calculate position for new nodes based on existing steps
 */
export function getNewNodePosition(existingSteps: Step[]): { x: number; y: number } {
  if (existingSteps.length === 0) {
    return { x: 250, y: 100 };
  }

  const maxX = Math.max(...existingSteps.map(s => s.position.x));
  const maxY = Math.max(...existingSteps.map(s => s.position.y));

  return {
    x: maxX + 50,
    y: maxY + 50,
  };
}
