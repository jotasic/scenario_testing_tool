/**
 * Loop processing for iterative step execution
 * Supports forEach, count, and while loops with nested loop capability
 */

import { get } from 'lodash-es';
import type { Loop, ForEachLoop, CountLoop, WhileLoop, LoopContext } from '../types';
import type { VariableContext } from './variableResolver';
import { evaluateCondition } from './conditionEvaluator';
import { resolveVariables } from './variableResolver';

/**
 * Default maximum iterations to prevent infinite loops
 */
const DEFAULT_MAX_ITERATIONS = 1000;

/**
 * Iterator interface for step-by-step loop execution
 */
export interface LoopIterator {
  /** Total number of iterations this loop will perform */
  totalIterations: number;
  /** Current iteration index (0-based) */
  currentIndex: number;
  /** Whether there are more iterations remaining */
  hasNext: boolean;
  /** Moves to the next iteration and returns the loop context */
  next(): LoopContext | null;
  /** Resets the iterator to the beginning */
  reset(): void;
}

/**
 * Error thrown when loop iteration limit is exceeded
 */
export class LoopLimitExceededError extends Error {
  constructor(loopId: string, maxIterations: number) {
    super(
      `Loop "${loopId}" exceeded maximum iterations (${maxIterations}). ` +
      `Possible infinite loop detected.`
    );
    this.name = 'LoopLimitExceededError';
  }
}

/**
 * Resolves the source array for a forEach loop
 *
 * @param loop - ForEach loop configuration
 * @param context - Variable context
 * @returns Array to iterate over
 * @throws Error if source is not an array
 */
function resolveForEachSource(
  loop: ForEachLoop,
  context: VariableContext
): unknown[] {
  // Resolve the source path (e.g., "${params.list}")
  const resolvedSource = resolveVariables(loop.source, context);

  if (resolvedSource === undefined || resolvedSource === null) {
    // Check if this might be a timing issue with fire-and-forget requests
    const sourcePattern = loop.source;
    const isResponseReference = sourcePattern.includes('responses.') || sourcePattern.includes('response.');

    throw new Error(
      `ForEach loop source "${loop.source}" resolved to ${resolvedSource}.\n` +
      (isResponseReference
        ? `This may be a timing issue: the referenced step might have "Wait for Response" disabled (fire-and-forget).\n` +
          `Solution: Enable "Wait for Response" and "Save Response" on the step that provides this data.`
        : `Make sure the source path exists and contains an array.`)
    );
  }

  if (!Array.isArray(resolvedSource)) {
    throw new Error(
      `ForEach loop source "${loop.source}" did not resolve to an array. ` +
      `Got: ${typeof resolvedSource} (${JSON.stringify(resolvedSource).slice(0, 100)})`
    );
  }

  return resolvedSource;
}

/**
 * Expands forEach loop items based on countField
 * If countField is specified, each item is repeated item[countField] times
 *
 * @param items - Original array items
 * @param countField - Field in each item specifying repeat count
 * @returns Expanded array with repeated items
 */
function expandForEachItems(
  items: unknown[],
  countField: string | undefined
): unknown[] {
  if (!countField) {
    return items;
  }

  const expanded: unknown[] = [];

  for (const item of items) {
    const count = get(item, countField);

    if (typeof count !== 'number' || count <= 0) {
      // If count is invalid, include the item once
      expanded.push(item);
      continue;
    }

    // Repeat the item 'count' times
    for (let i = 0; i < count; i++) {
      expanded.push(item);
    }
  }

  return expanded;
}

/**
 * Creates an iterator for a forEach loop
 *
 * @param loop - ForEach loop configuration
 * @param context - Variable context
 * @param loopName - Name of the loop step for named access
 * @returns Loop iterator
 */
function createForEachIterator(
  loop: ForEachLoop,
  context: VariableContext,
  loopName: string
): LoopIterator {
  const sourceArray = resolveForEachSource(loop, context);
  const items = expandForEachItems(sourceArray, loop.countField);
  const maxIterations = loop.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const totalIterations = Math.min(items.length, maxIterations);

  let currentIndex = 0;

  return {
    totalIterations,
    currentIndex,
    hasNext: currentIndex < totalIterations,

    next() {
      if (currentIndex >= totalIterations) {
        return null;
      }

      if (currentIndex >= maxIterations) {
        throw new LoopLimitExceededError(loop.id, maxIterations);
      }

      const loopContext: LoopContext = {
        loopId: loop.id,
        loopName,
        currentIndex,
        currentItem: items[currentIndex],
        totalIterations,
        itemAlias: loop.itemAlias,
        indexAlias: loop.indexAlias,
      };

      currentIndex++;
      this.currentIndex = currentIndex;
      this.hasNext = currentIndex < totalIterations;

      return loopContext;
    },

    reset() {
      currentIndex = 0;
      this.currentIndex = 0;
      this.hasNext = totalIterations > 0;
    },
  };
}

/**
 * Resolves the count for a count loop
 *
 * @param loop - Count loop configuration
 * @param context - Variable context
 * @returns Number of iterations
 */
function resolveCountValue(
  loop: CountLoop,
  context: VariableContext
): number {
  let count: unknown = loop.count;

  // If count is a string, resolve variables
  if (typeof count === 'string') {
    count = resolveVariables(count, context);
  }

  // Convert string numbers to actual numbers
  if (typeof count === 'string') {
    const parsed = Number(count);
    if (!isNaN(parsed)) {
      count = parsed;
    }
  }

  if (typeof count !== 'number' || count < 0 || isNaN(count)) {
    throw new Error(
      `Count loop count must be a non-negative number. Got: ${typeof count} (${count})`
    );
  }

  return Math.floor(count);
}

/**
 * Creates an iterator for a count loop
 *
 * @param loop - Count loop configuration
 * @param context - Variable context
 * @param loopName - Name of the loop step for named access
 * @returns Loop iterator
 */
function createCountIterator(
  loop: CountLoop,
  context: VariableContext,
  loopName: string
): LoopIterator {
  const count = resolveCountValue(loop, context);
  const maxIterations = loop.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const totalIterations = Math.min(count, maxIterations);

  let currentIndex = 0;

  return {
    totalIterations,
    currentIndex,
    hasNext: currentIndex < totalIterations,

    next() {
      if (currentIndex >= totalIterations) {
        return null;
      }

      if (currentIndex >= maxIterations) {
        throw new LoopLimitExceededError(loop.id, maxIterations);
      }

      const loopContext: LoopContext = {
        loopId: loop.id,
        loopName,
        currentIndex,
        currentItem: undefined,
        totalIterations,
      };

      currentIndex++;
      this.currentIndex = currentIndex;
      this.hasNext = currentIndex < totalIterations;

      return loopContext;
    },

    reset() {
      currentIndex = 0;
      this.currentIndex = 0;
      this.hasNext = totalIterations > 0;
    },
  };
}

/**
 * Creates an iterator for a while loop
 *
 * @param loop - While loop configuration
 * @param context - Variable context
 * @param loopName - Name of the loop step for named access
 * @returns Loop iterator
 */
function createWhileIterator(
  loop: WhileLoop,
  context: VariableContext,
  loopName: string
): LoopIterator {
  const maxIterations = loop.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  let currentIndex = 0;
  let conditionMet = false;

  // Check initial condition
  try {
    conditionMet = evaluateCondition(loop.condition, context);
  } catch (error) {
    throw new Error(
      `Failed to evaluate while loop condition: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    totalIterations: maxIterations, // Unknown until loop completes
    currentIndex,
    hasNext: conditionMet,

    next() {
      if (!conditionMet || currentIndex >= maxIterations) {
        if (currentIndex >= maxIterations && conditionMet) {
          throw new LoopLimitExceededError(loop.id, maxIterations);
        }
        return null;
      }

      const loopContext: LoopContext = {
        loopId: loop.id,
        loopName,
        currentIndex,
        currentItem: undefined,
        totalIterations: maxIterations,
      };

      currentIndex++;
      this.currentIndex = currentIndex;

      // Re-evaluate condition for next iteration
      // Note: Condition evaluation happens with updated context in the executor
      // This iterator just tracks state; condition re-evaluation happens externally
      // For now, we assume hasNext will be updated externally
      this.hasNext = currentIndex < maxIterations;

      return loopContext;
    },

    reset() {
      currentIndex = 0;
      this.currentIndex = 0;
      try {
        conditionMet = evaluateCondition(loop.condition, context);
        this.hasNext = conditionMet;
      } catch {
        this.hasNext = false;
      }
    },
  };
}

/**
 * Creates a loop iterator for the specified loop configuration
 *
 * @param loop - Loop configuration (forEach, count, or while)
 * @param context - Variable context
 * @param loopName - Name of the loop step for named access (defaults to loop.id)
 * @returns Loop iterator for step-by-step execution
 * @throws Error if loop type is unsupported or configuration is invalid
 */
export function createLoopIterator(
  loop: Loop,
  context: VariableContext,
  loopName?: string
): LoopIterator {
  const name = loopName ?? loop.id;
  try {
    switch (loop.type) {
      case 'forEach':
        return createForEachIterator(loop, context, name);

      case 'count':
        return createCountIterator(loop, context, name);

      case 'while':
        return createWhileIterator(loop, context, name);

      default:
        throw new Error(`Unsupported loop type: ${(loop as Loop).type}`);
    }
  } catch (error) {
    if (error instanceof LoopLimitExceededError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create loop iterator for "${loop.id}": ${message}`);
  }
}

/**
 * Updates a while loop iterator's condition state
 * Should be called after each iteration to check if loop should continue
 *
 * @param iterator - Loop iterator to update
 * @param loop - While loop configuration
 * @param context - Updated variable context
 */
export function updateWhileLoopCondition(
  iterator: LoopIterator,
  loop: WhileLoop,
  context: VariableContext
): void {
  try {
    const conditionMet = evaluateCondition(loop.condition, context);
    const maxIterations = loop.maxIterations ?? DEFAULT_MAX_ITERATIONS;

    iterator.hasNext = conditionMet && iterator.currentIndex < maxIterations;
  } catch {
    // If condition evaluation fails, stop the loop
    iterator.hasNext = false;
  }
}
