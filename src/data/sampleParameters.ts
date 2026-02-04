/**
 * Sample Parameter Values
 * Example parameter values that can be used with the sample scenario
 */

/**
 * Default parameter values for the sample scenario
 * This demonstrates:
 * - Array of objects with nested properties
 * - Multiple items with different count values
 * - Optional parameter with default override
 */
export const defaultSampleParameters = {
  list: [
    { id: 1, count: 2 },
    { id: 2, count: 3 },
    { id: 3, count: 1 },
  ],
  repository: 'facebook/react',
};

/**
 * Minimal parameter set
 * Uses only required parameters
 */
export const minimalSampleParameters = {
  list: [
    { id: 1, count: 1 },
  ],
  // repository is optional, will use default value
};

/**
 * Extended parameter set
 * More items for testing loop behavior
 */
export const extendedSampleParameters = {
  list: [
    { id: 1, count: 1 },
    { id: 2, count: 2 },
    { id: 3, count: 1 },
    { id: 4, count: 3 },
    { id: 5, count: 1 },
  ],
  repository: 'microsoft/vscode',
};

/**
 * Edge case: Maximum count
 * Tests validation limits (count max is 5)
 */
export const maxCountParameters = {
  list: [
    { id: 1, count: 5 },
    { id: 2, count: 5 },
  ],
  repository: 'nodejs/node',
};

/**
 * Test different repository
 * Tests GitHub API with different repos
 */
export const alternativeRepoParameters = {
  list: [
    { id: 1, count: 2 },
  ],
  repository: 'vuejs/core',
};

/**
 * Get sample parameters by name
 */
export function getSampleParameters(name: 'default' | 'minimal' | 'extended' | 'maxCount' | 'alternativeRepo') {
  switch (name) {
    case 'default':
      return defaultSampleParameters;
    case 'minimal':
      return minimalSampleParameters;
    case 'extended':
      return extendedSampleParameters;
    case 'maxCount':
      return maxCountParameters;
    case 'alternativeRepo':
      return alternativeRepoParameters;
    default:
      return defaultSampleParameters;
  }
}

/**
 * List of available sample parameter sets
 */
export const sampleParameterSets = [
  {
    name: 'default',
    label: 'Default',
    description: 'Standard test with 3 items',
    parameters: defaultSampleParameters,
  },
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'Single item, minimal configuration',
    parameters: minimalSampleParameters,
  },
  {
    name: 'extended',
    label: 'Extended',
    description: '5 items to test loop performance',
    parameters: extendedSampleParameters,
  },
  {
    name: 'maxCount',
    label: 'Max Count',
    description: 'Tests maximum count validation',
    parameters: maxCountParameters,
  },
  {
    name: 'alternativeRepo',
    label: 'Alternative Repository',
    description: 'Tests with Vue.js repository',
    parameters: alternativeRepoParameters,
  },
] as const;
