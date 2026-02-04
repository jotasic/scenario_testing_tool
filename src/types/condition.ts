/**
 * Condition evaluation types
 * Used for branching logic and conditional step execution
 */

/**
 * Source of the value being evaluated in a condition
 * - "params": From scenario input parameters
 * - "response": From a previous step's response
 */
export type ConditionSource = "params" | "response";

/**
 * Comparison operators for condition evaluation
 */
export type ComparisonOperator =
  | "==" // Equal to
  | "!=" // Not equal to
  | ">" // Greater than
  | ">=" // Greater than or equal to
  | "<" // Less than
  | "<=" // Less than or equal to
  | "contains" // String/array contains value
  | "notContains" // String/array does not contain value
  | "isEmpty" // Value is empty (string/array/object)
  | "isNotEmpty" // Value is not empty
  | "exists"; // Field exists (not null/undefined)

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = "AND" | "OR";

/**
 * Base condition interface with common fields
 */
export interface BaseCondition {
  /** Unique identifier for this condition */
  id: string;
  /** Source of the value to evaluate */
  source: ConditionSource;
  /** JSON path to the field (e.g., "data.status", "list[0].id") */
  field: string;
  /** Comparison operator to apply */
  operator: ComparisonOperator;
  /** Value to compare against (not required for isEmpty, isNotEmpty, exists) */
  value?: unknown;
}

/**
 * Condition that evaluates scenario input parameters
 */
export interface ParamCondition extends BaseCondition {
  source: "params";
}

/**
 * Condition that evaluates a previous step's response
 */
export interface ResponseCondition extends BaseCondition {
  source: "response";
  /** ID of the step whose response to evaluate */
  stepId: string;
}

/**
 * Single condition (either parameter-based or response-based)
 */
export type Condition = ParamCondition | ResponseCondition;

/**
 * Group of conditions combined with logical operators
 * Supports nesting for complex logic
 */
export interface ConditionGroup {
  /** Unique identifier for this condition group */
  id: string;
  /** Logical operator to combine conditions */
  operator: LogicalOperator;
  /** Array of conditions or nested condition groups */
  conditions: (Condition | ConditionGroup)[];
}

/**
 * A condition expression can be either a single condition or a group
 */
export type ConditionExpression = Condition | ConditionGroup;
