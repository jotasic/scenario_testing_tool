/**
 * Scenario Execution Engine
 *
 * Main entry point for all execution engine modules.
 * Provides variable resolution, condition evaluation, loop processing,
 * HTTP requests, and complete scenario orchestration.
 */

// Variable resolution
export {
  resolveVariables,
  resolveVariablePath,
  resolveStringVariables,
  resolveSingleVariable,
  hasVariableReferences,
  createVariableContext,
  type VariableContext,
} from './variableResolver';

// Condition evaluation
export {
  evaluateCondition,
  evaluateOptionalCondition,
  evaluateSingleCondition,
  evaluateConditionGroup,
} from './conditionEvaluator';

// Loop processing
export {
  createLoopIterator,
  updateWhileLoopCondition,
  LoopLimitExceededError,
  type LoopIterator,
} from './loopProcessor';

// HTTP client
export {
  makeHttpRequest,
  executeStepRequest,
  mergeHeaders,
  buildUrl,
  resolveRequestConfig,
  HttpRequestError,
  type HttpResponse,
  type HttpRequestConfig,
} from './httpClient';

// Scenario executor
export {
  ScenarioExecutor,
  executeScenario,
  type ExecutionCallbacks,
  type ExecutionOptions,
  type ExecutionControl,
  type ExecutionResult,
} from './scenarioExecutor';
