/**
 * Simple 2-Step Test Scenario
 * Used for testing navigation and panel visibility
 */

import type { Scenario } from '@/types';

export const twoStepScenario: Scenario = {
  id: 'scn_two_step_test',
  name: '2 step',
  description: 'Simple scenario with 2 steps for testing',
  version: '1.0.0',
  serverIds: ['srv_mock_server'],

  parameterSchema: [],

  steps: [
    {
      id: 'step_1',
      name: 'First Step',
      type: 'request',
      description: 'First request step',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/posts/1',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'post',
      position: { x: 100, y: 100 },
    },

    {
      id: 'step_2',
      name: 'Second Step',
      type: 'request',
      description: 'Second request step',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/posts/2',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'post2',
      position: { x: 100, y: 250 },
    },
  ],

  edges: [
    {
      id: 'edge_1_to_2',
      sourceStepId: 'step_1',
      targetStepId: 'step_2',
    },
  ],

  startStepId: 'step_1',

  tags: ['test', 'simple'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

export default twoStepScenario;
