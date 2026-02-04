/**
 * Loop types for iterative step execution
 */

import type { ConditionExpression } from './condition';

/**
 * Types of loops supported
 * - "forEach": Iterate over an array
 * - "count": Execute a fixed number of times
 * - "while": Execute while a condition is true
 */
export type LoopType = "forEach" | "count" | "while";

/**
 * Base interface for all loop types
 */
export interface BaseLoop {
  /** Unique identifier for this loop */
  id: string;
  /** Type of loop */
  type: LoopType;
  /** Safety limit to prevent infinite loops */
  maxIterations?: number;
}

/**
 * Loop that iterates over an array
 * Supports nested counting via countField
 */
export interface ForEachLoop extends BaseLoop {
  type: "forEach";
  /** JSON path to the array to iterate over (e.g., "params.list") */
  source: string;
  /** Variable name for the current item (e.g., "item") */
  itemAlias: string;
  /** Optional variable name for the current index (e.g., "index") */
  indexAlias?: string;
  /**
   * Optional field in each item that specifies how many times to repeat
   * If specified, each item will be repeated item[countField] times
   */
  countField?: string;
}

/**
 * Loop that executes a fixed number of times
 */
export interface CountLoop extends BaseLoop {
  type: "count";
  /** Number of iterations (can be a fixed number or variable reference like "${params.count}") */
  count: number | string;
}

/**
 * Loop that continues while a condition is true
 */
export interface WhileLoop extends BaseLoop {
  type: "while";
  /** Condition to evaluate before each iteration */
  condition: ConditionExpression;
}

/**
 * Union type of all loop types
 */
export type Loop = ForEachLoop | CountLoop | WhileLoop;
