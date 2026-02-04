/**
 * Parameter schema types
 * Defines the structure and validation rules for scenario input parameters
 */

/**
 * Supported parameter types
 */
export type ParameterType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "any";

/**
 * Parameter schema definition
 * Supports nested objects and arrays for complex data structures
 */
export interface ParameterSchema {
  /** Unique identifier for this parameter */
  id: string;
  /** Field name for the parameter */
  name: string;
  /** Data type of the parameter */
  type: ParameterType;
  /** Whether this parameter is required */
  required: boolean;
  /** Default value if not provided */
  defaultValue?: unknown;
  /** Description of the parameter's purpose */
  description?: string;

  // Array type configuration
  /** Schema for array items (required when type is "array") */
  itemSchema?: ParameterSchema;

  // Object type configuration
  /** Schema for object properties (required when type is "object") */
  properties?: ParameterSchema[];

  // Validation rules
  /** Optional validation constraints */
  validation?: {
    /** Minimum value (for numbers) or length (for strings/arrays) */
    min?: number;
    /** Maximum value (for numbers) or length (for strings/arrays) */
    max?: number;
    /** Regular expression pattern for string validation */
    pattern?: string;
    /** Enumeration of allowed values */
    enum?: unknown[];
  };
}

/**
 * Runtime parameter value
 * Represents the actual data provided when executing a scenario
 */
export type ParameterValue = string | number | boolean | ParameterValue[] | { [key: string]: ParameterValue } | null;
