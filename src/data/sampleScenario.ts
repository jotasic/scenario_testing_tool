/**
 * Sample Scenario
 * A complete example scenario demonstrating various features:
 * - Multiple servers
 * - Parameter schema with list and nested objects
 * - Request steps with variable references
 * - Condition-based branching
 * - Loop with forEach
 * - Different execution modes
 */

import type { Scenario, Server } from '@/types';

/**
 * Sample servers used in the scenario
 */
export const sampleServers: Server[] = [
  {
    id: 'srv_mock_server',
    name: 'mock_server',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Accept', value: 'application/json', enabled: true },
    ],
    timeout: 30000,
    description: 'Mock REST API server for testing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv_api_server',
    name: 'api_server',
    baseUrl: 'https://api.github.com',
    headers: [
      { key: 'Accept', value: 'application/vnd.github.v3+json', enabled: true },
      { key: 'User-Agent', value: 'ScenarioTool/1.0', enabled: true },
    ],
    timeout: 30000,
    description: 'GitHub API server',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Sample scenario demonstrating all features
 */
export const sampleScenario: Scenario = {
  id: 'scn_sample_001',
  name: 'Sample API Test Flow',
  description: 'Demonstrates request steps, conditions, loops, and different execution modes',
  version: '1.0.0',
  serverIds: ['srv_mock_server', 'srv_api_server'],

  // Parameter schema - defines the input structure
  parameterSchema: [
    {
      id: 'param_list',
      name: 'list',
      type: 'array',
      required: true,
      description: 'List of items to process',
      itemSchema: {
        id: 'param_list_item',
        name: 'item',
        type: 'object',
        required: true,
        properties: [
          {
            id: 'param_item_id',
            name: 'id',
            type: 'number',
            required: true,
            description: 'User ID',
          },
          {
            id: 'param_item_count',
            name: 'count',
            type: 'number',
            required: true,
            description: 'Number of times to repeat',
            validation: { min: 1, max: 5 },
          },
        ],
      },
    },
    {
      id: 'param_repo',
      name: 'repository',
      type: 'string',
      required: false,
      defaultValue: 'facebook/react',
      description: 'GitHub repository in format owner/repo',
    },
  ],

  // Steps in the scenario
  steps: [
    // Step 1: Start - Get first user
    {
      id: 'step_start',
      name: 'Get User',
      type: 'request',
      description: 'Fetch user details from JSONPlaceholder',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/users/${params.list[0].id}',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'user',
      position: { x: 100, y: 100 },
    },

    // Step 2: Check user name condition
    {
      id: 'step_check_user',
      name: 'Check User Name',
      type: 'condition',
      description: 'Branch based on user name length',
      executionMode: 'auto',
      position: { x: 100, y: 250 },
      branches: [
        {
          id: 'branch_long_name',
          label: 'Long Name',
          condition: {
            id: 'cond_name_length',
            source: 'response',
            stepId: 'step_start',
            field: 'name',
            operator: '>',
            value: 15,
          },
          nextStepId: 'step_get_posts',
        },
        {
          id: 'branch_short_name',
          label: 'Short Name',
          isDefault: true,
          nextStepId: 'step_get_todos',
        },
      ],
    },

    // Step 3a: Get user posts (long name path)
    {
      id: 'step_get_posts',
      name: 'Get User Posts',
      type: 'request',
      description: 'Fetch all posts by the user',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/users/${params.list[0].id}/posts',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'posts',
      position: { x: 300, y: 350 },
    },

    // Step 3b: Get user todos (short name path)
    {
      id: 'step_get_todos',
      name: 'Get User Todos',
      type: 'request',
      description: 'Fetch all todos by the user',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/users/${params.list[0].id}/todos',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'todos',
      position: { x: -100, y: 350 },
    },

    // Step 4: Loop through items
    {
      id: 'step_loop_items',
      name: 'Process Each Item',
      type: 'loop',
      description: 'Loop through each item in the list with repeat count',
      executionMode: 'auto',
      position: { x: 100, y: 500 },
      loop: {
        id: 'loop_items',
        type: 'forEach',
        source: 'params.list',
        itemAlias: 'item',
        indexAlias: 'index',
        countField: 'count',
        maxIterations: 20,
      },
      stepIds: ['step_loop_request'],
    },

    // Step 5: Request inside loop
    {
      id: 'step_loop_request',
      name: 'Create Post for Item',
      type: 'request',
      description: 'Create a post for each item iteration',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'POST',
      endpoint: '/posts',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ],
      body: {
        title: 'Post ${loop.index} for User ${loop.item.id}',
        body: 'This is iteration ${loop.index} of ${loop.total}',
        userId: '${loop.item.id}',
      },
      waitForResponse: true,
      saveResponse: false,
      position: { x: 100, y: 650 },
    },

    // Step 6: Manual step - requires user confirmation
    {
      id: 'step_manual_check',
      name: 'Manual Verification',
      type: 'request',
      description: 'Manual step - requires user to review and continue',
      executionMode: 'manual',
      serverId: 'srv_api_server',
      method: 'GET',
      endpoint: '/repos/${params.repository}',
      headers: [],
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'repo',
      position: { x: 100, y: 800 },
    },

    // Step 7: Delayed step
    {
      id: 'step_delayed',
      name: 'Get Repository Stars',
      type: 'request',
      description: 'Delayed execution - waits 2 seconds before running',
      executionMode: 'delayed',
      delayMs: 2000,
      serverId: 'srv_api_server',
      method: 'GET',
      endpoint: '/repos/${params.repository}/stargazers',
      headers: [],
      queryParams: {
        per_page: '5',
      },
      waitForResponse: true,
      saveResponse: true,
      responseAlias: 'stargazers',
      position: { x: 100, y: 950 },
      branches: [
        {
          id: 'branch_has_stars',
          label: 'Has Stars',
          condition: {
            id: 'cond_stars',
            source: 'response',
            stepId: 'step_manual_check',
            field: 'stargazers_count',
            operator: '>',
            value: 1000,
          },
          nextStepId: 'step_final_success',
        },
        {
          id: 'branch_no_stars',
          label: 'Few Stars',
          isDefault: true,
          nextStepId: 'step_final_success',
        },
      ],
    },

    // Step 8: Final step
    {
      id: 'step_final_success',
      name: 'Final Summary',
      type: 'request',
      description: 'Get final user summary',
      executionMode: 'auto',
      serverId: 'srv_mock_server',
      method: 'GET',
      endpoint: '/users/${params.list[0].id}',
      headers: [],
      waitForResponse: true,
      saveResponse: false,
      position: { x: 100, y: 1100 },
    },
  ],

  // Edges connecting the steps
  edges: [
    {
      id: 'edge_start_to_check',
      sourceStepId: 'step_start',
      targetStepId: 'step_check_user',
      label: 'User Loaded',
    },
    {
      id: 'edge_check_to_posts',
      sourceStepId: 'step_check_user',
      targetStepId: 'step_get_posts',
      sourceHandle: 'long_name',
      label: 'Long Name',
    },
    {
      id: 'edge_check_to_todos',
      sourceStepId: 'step_check_user',
      targetStepId: 'step_get_todos',
      sourceHandle: 'short_name',
      label: 'Short Name',
    },
    {
      id: 'edge_posts_to_loop',
      sourceStepId: 'step_get_posts',
      targetStepId: 'step_loop_items',
    },
    {
      id: 'edge_todos_to_loop',
      sourceStepId: 'step_get_todos',
      targetStepId: 'step_loop_items',
    },
    {
      id: 'edge_loop_to_manual',
      sourceStepId: 'step_loop_items',
      targetStepId: 'step_manual_check',
      label: 'Loop Complete',
    },
    {
      id: 'edge_manual_to_delayed',
      sourceStepId: 'step_manual_check',
      targetStepId: 'step_delayed',
    },
    {
      id: 'edge_delayed_to_final',
      sourceStepId: 'step_delayed',
      targetStepId: 'step_final_success',
    },
  ],

  startStepId: 'step_start',

  tags: ['sample', 'demo', 'tutorial'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

export default sampleScenario;
