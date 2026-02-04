/**
 * Variable resolution for scenario execution
 * Resolves ${...} variable references in strings, objects, and arrays
 */

import { get } from 'lodash-es';
import type { LoopContext } from '../types';

/**
 * Context containing all available variables for resolution
 */
export interface VariableContext {
  /** Scenario input parameters */
  params: Record<string, unknown>;
  /** Saved responses from completed steps (by stepId or alias) */
  responses: Record<string, unknown>;
  /** Stack of loop contexts for nested loop support */
  loopContexts: LoopContext[];
  /** System variables */
  system: {
    /** Current timestamp in ISO format */
    timestamp: string;
  };
}

/**
 * Regular expression to match variable references: ${variable.path}
 * Captures the variable path inside ${...}
 */
const VARIABLE_PATTERN = /\$\{([^}]+)\}/g;

/**
 * Resolves a variable path to its value from the context
 *
 * Supports:
 * - ${params.field} - Parameter values
 * - ${response.stepId.field} - Response from a step
 * - ${loop.item} - Current loop item
 * - ${loop.item.field} - Field in current loop item
 * - ${loop.index} - Current loop index
 * - ${system.timestamp} - Current timestamp
 * - Nested paths: ${params.user.address.city}
 * - Array access: ${params.list[0].id}
 *
 * @param path - Variable path (e.g., "params.name", "response.step1.data.id")
 * @param context - Variable context containing all available data
 * @returns Resolved value or undefined if not found
 */
export function resolveVariablePath(
  path: string,
  context: VariableContext
): unknown {
  const trimmedPath = path.trim();

  // Handle params.* paths
  if (trimmedPath.startsWith('params.')) {
    const fieldPath = trimmedPath.substring('params.'.length);
    return get(context.params, fieldPath);
  }

  // Handle response.stepId.* paths
  if (trimmedPath.startsWith('response.')) {
    const responsePath = trimmedPath.substring('response.'.length);
    const firstDotIndex = responsePath.indexOf('.');

    if (firstDotIndex === -1) {
      // Just ${response.stepId} - return entire response
      return context.responses[responsePath];
    }

    // ${response.stepId.field} - extract field from response
    const stepId = responsePath.substring(0, firstDotIndex);
    const fieldPath = responsePath.substring(firstDotIndex + 1);
    const response = context.responses[stepId];

    if (!response) {
      return undefined;
    }

    return get(response, fieldPath);
  }

  // Handle loop.* paths (uses the most recent loop context)
  if (trimmedPath.startsWith('loop.')) {
    const loopPath = trimmedPath.substring('loop.'.length);

    // Get the current (top of stack) loop context
    const currentLoop = context.loopContexts[context.loopContexts.length - 1];

    if (!currentLoop) {
      return undefined;
    }

    // Handle loop.index
    if (loopPath === 'index') {
      return currentLoop.currentIndex;
    }

    // Handle loop.item or loop.item.field
    if (loopPath === 'item') {
      return currentLoop.currentItem;
    }

    if (loopPath.startsWith('item.')) {
      const itemFieldPath = loopPath.substring('item.'.length);
      return get(currentLoop.currentItem, itemFieldPath);
    }

    return undefined;
  }

  // Handle system.* paths
  if (trimmedPath.startsWith('system.')) {
    const systemPath = trimmedPath.substring('system.'.length);
    return get(context.system, systemPath);
  }

  // If no prefix matches, return undefined
  return undefined;
}

/**
 * Resolves all variable references in a string
 *
 * Examples:
 * - "User ${params.name}" -> "User John"
 * - "/api/users/${params.id}" -> "/api/users/123"
 * - "${params.count}" -> "5" (if count is 5)
 *
 * @param template - String potentially containing ${...} references
 * @param context - Variable context
 * @returns String with all variables replaced
 */
export function resolveStringVariables(
  template: string,
  context: VariableContext
): string {
  return template.replace(VARIABLE_PATTERN, (_match, path) => {
    const value = resolveVariablePath(path, context);

    // Convert value to string
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

/**
 * Checks if a string contains any variable references
 *
 * @param value - String to check
 * @returns True if the string contains ${...} patterns
 */
export function hasVariableReferences(value: string): boolean {
  return VARIABLE_PATTERN.test(value);
}

/**
 * Resolves a value that might be a single variable reference to its actual value
 *
 * If the entire string is "${varPath}", returns the actual value (preserving type).
 * Otherwise, performs string substitution.
 *
 * Examples:
 * - "${params.count}" -> 5 (number)
 * - "${params.user}" -> {name: "John"} (object)
 * - "Count: ${params.count}" -> "Count: 5" (string)
 *
 * @param value - String value to resolve
 * @param context - Variable context
 * @returns Resolved value with original type preserved if possible
 */
export function resolveSingleVariable(
  value: string,
  context: VariableContext
): unknown {
  const trimmed = value.trim();

  // Check if the entire string is a single variable reference
  const singleVarMatch = /^\$\{([^}]+)\}$/.exec(trimmed);

  if (singleVarMatch) {
    // Return the actual value, preserving its type
    return resolveVariablePath(singleVarMatch[1], context);
  }

  // Otherwise, perform string substitution
  return resolveStringVariables(value, context);
}

/**
 * Recursively resolves variables in any value type
 *
 * Handles:
 * - Strings: Variable substitution
 * - Objects: Recursive resolution of all values
 * - Arrays: Recursive resolution of all elements
 * - Primitives: Returned as-is
 *
 * @param template - Value to resolve (can be any type)
 * @param context - Variable context
 * @returns Resolved value with same structure
 */
export function resolveVariables(
  template: unknown,
  context: VariableContext
): unknown {
  // Handle null/undefined
  if (template === null || template === undefined) {
    return template;
  }

  // Handle strings
  if (typeof template === 'string') {
    return resolveSingleVariable(template, context);
  }

  // Handle arrays
  if (Array.isArray(template)) {
    return template.map((item) => resolveVariables(item, context));
  }

  // Handle objects
  if (typeof template === 'object') {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(template)) {
      resolved[key] = resolveVariables(value, context);
    }

    return resolved;
  }

  // Handle primitives (numbers, booleans)
  return template;
}

/**
 * Creates a variable context for scenario execution
 *
 * @param params - Scenario input parameters
 * @param responses - Step responses
 * @param loopContexts - Loop context stack
 * @returns Variable context ready for resolution
 */
export function createVariableContext(
  params: Record<string, unknown>,
  responses: Record<string, unknown> = {},
  loopContexts: LoopContext[] = []
): VariableContext {
  return {
    params,
    responses,
    loopContexts,
    system: {
      timestamp: new Date().toISOString(),
    },
  };
}
