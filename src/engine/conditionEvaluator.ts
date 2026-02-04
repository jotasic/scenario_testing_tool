/**
 * Condition evaluation for branching logic
 * Supports single conditions and complex condition groups with AND/OR logic
 */

import { get } from 'lodash-es';
import type {
  Condition,
  ConditionGroup,
  ConditionExpression,
  ComparisonOperator,
} from '../types';
import type { VariableContext } from './variableResolver';
import { resolveStringVariables } from './variableResolver';

/**
 * Retrieves the value for a condition from the context
 *
 * Resolves variables in the field path before accessing the value.
 * This allows dynamic field paths like "items[${loop.index}].name".
 *
 * @param condition - Condition to evaluate
 * @param context - Variable context
 * @returns The value to compare
 */
function getConditionValue(
  condition: Condition,
  context: VariableContext
): unknown {
  // Resolve variables in the field path (e.g., "items[${loop.index}].name" -> "items[2].name")
  const resolvedField = resolveStringVariables(condition.field, context);

  if (condition.source === 'params') {
    return get(context.params, resolvedField);
  }

  if (condition.source === 'response') {
    const response = context.responses[condition.stepId];
    if (!response) {
      return undefined;
    }
    return get(response, resolvedField);
  }

  return undefined;
}

/**
 * Checks if a value is empty
 * - String: length === 0
 * - Array: length === 0
 * - Object: no own properties
 * - null/undefined: true
 * - Other types: false
 *
 * @param value - Value to check
 * @returns True if value is considered empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Checks if a value exists (not null or undefined)
 *
 * @param value - Value to check
 * @returns True if value exists
 */
function exists(value: unknown): boolean {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value contains another value
 * - String: substring check
 * - Array: includes check
 * - Other types: false
 *
 * @param haystack - Value to search in
 * @param needle - Value to search for
 * @returns True if haystack contains needle
 */
function contains(haystack: unknown, needle: unknown): boolean {
  if (typeof haystack === 'string' && typeof needle === 'string') {
    return haystack.includes(needle);
  }

  if (Array.isArray(haystack)) {
    return haystack.includes(needle);
  }

  return false;
}

/**
 * Compares two values using the specified operator
 *
 * @param operator - Comparison operator
 * @param actualValue - Value from context
 * @param expectedValue - Value to compare against
 * @returns True if comparison passes
 */
function compareValues(
  operator: ComparisonOperator,
  actualValue: unknown,
  expectedValue: unknown
): boolean {
  switch (operator) {
    case '==':
      // eslint-disable-next-line eqeqeq
      return actualValue == expectedValue;

    case '!=':
      // eslint-disable-next-line eqeqeq
      return actualValue != expectedValue;

    case '>':
      if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
        return actualValue > expectedValue;
      }
      return false;

    case '>=':
      if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
        return actualValue >= expectedValue;
      }
      return false;

    case '<':
      if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
        return actualValue < expectedValue;
      }
      return false;

    case '<=':
      if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
        return actualValue <= expectedValue;
      }
      return false;

    case 'contains':
      return contains(actualValue, expectedValue);

    case 'notContains':
      return !contains(actualValue, expectedValue);

    case 'isEmpty':
      return isEmpty(actualValue);

    case 'isNotEmpty':
      return !isEmpty(actualValue);

    case 'exists':
      return exists(actualValue);

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

/**
 * Attempts to parse a string value into its appropriate type
 * Handles boolean, number, null, and JSON values
 *
 * @param value - String value to parse
 * @returns Parsed value or original string
 */
function parseStringValue(value: string): unknown {
  // Handle boolean strings
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // Handle numeric strings
  if (value !== '' && !isNaN(Number(value))) {
    return Number(value);
  }

  // Handle JSON objects/arrays
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

/**
 * Resolves the expected value from condition
 * If the value is a string containing variable references, resolve them
 * Also handles type conversion for string values (boolean, number, etc.)
 *
 * @param value - Expected value (may contain variable references)
 * @param context - Variable context
 * @returns Resolved value
 */
function resolveExpectedValue(value: unknown, context: VariableContext): unknown {
  if (typeof value === 'string') {
    // Check if the value contains variable references like ${params.xxx} or ${response.xxx}
    if (value.includes('${')) {
      const resolved = resolveStringVariables(value, context);
      return parseStringValue(resolved);
    }

    // Even without variable references, try to parse the string value
    // This handles cases like "true", "false", "123" entered in the UI
    return parseStringValue(value);
  }
  return value;
}

/**
 * Evaluates a single condition
 *
 * @param condition - Condition to evaluate
 * @param context - Variable context
 * @returns True if condition passes
 */
export function evaluateSingleCondition(
  condition: Condition,
  context: VariableContext
): boolean {
  const actualValue = getConditionValue(condition, context);
  // Resolve variable references in expected value (e.g., "${params.expectedStatus}")
  const expectedValue = resolveExpectedValue(condition.value, context);
  return compareValues(condition.operator, actualValue, expectedValue);
}

/**
 * Checks if an expression is a condition group
 *
 * @param expression - Expression to check
 * @returns True if expression is a ConditionGroup
 */
function isConditionGroup(
  expression: ConditionExpression
): expression is ConditionGroup {
  return 'operator' in expression && 'conditions' in expression;
}

/**
 * Evaluates a condition group with AND/OR logic
 *
 * @param group - Condition group to evaluate
 * @param context - Variable context
 * @returns True if group condition passes
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  context: VariableContext
): boolean {
  if (group.conditions.length === 0) {
    return true;
  }

  if (group.operator === 'AND') {
    // All conditions must pass
    return group.conditions.every((cond) =>
      evaluateCondition(cond, context)
    );
  }

  if (group.operator === 'OR') {
    // At least one condition must pass
    return group.conditions.some((cond) =>
      evaluateCondition(cond, context)
    );
  }

  throw new Error(`Unsupported logical operator: ${group.operator}`);
}

/**
 * Evaluates a condition expression (single condition or group)
 *
 * Supports:
 * - Single conditions: { source, field, operator, value }
 * - Nested groups: { operator: "AND"/"OR", conditions: [...] }
 *
 * @param expression - Condition expression to evaluate
 * @param context - Variable context
 * @returns True if condition passes
 * @throws Error if condition evaluation fails
 */
export function evaluateCondition(
  expression: ConditionExpression,
  context: VariableContext
): boolean {
  try {
    if (isConditionGroup(expression)) {
      return evaluateConditionGroup(expression, context);
    }

    return evaluateSingleCondition(expression, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to evaluate condition: ${message}`);
  }
}

/**
 * Evaluates an optional condition expression
 * Returns true if no condition is provided
 *
 * @param expression - Optional condition expression
 * @param context - Variable context
 * @returns True if condition passes or is undefined
 */
export function evaluateOptionalCondition(
  expression: ConditionExpression | undefined,
  context: VariableContext
): boolean {
  if (!expression) {
    return true;
  }

  return evaluateCondition(expression, context);
}
