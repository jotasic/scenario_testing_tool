/**
 * Step definition types
 * Steps are the building blocks of scenarios
 */

import type { ConditionExpression } from './condition';
import type { Loop } from './loop';
import type { Branch } from './branch';

/**
 * HTTP methods supported for request steps
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Execution modes for steps
 * - "auto": Execute automatically when reached
 * - "manual": Wait for user confirmation before executing
 * - "delayed": Execute after a specified delay
 * - "bypass": Skip execution entirely
 */
export type ExecutionMode = "auto" | "manual" | "delayed" | "bypass";

/**
 * Types of steps available
 */
export type StepType = "request" | "condition" | "loop" | "group";

/**
 * Header configuration for individual request steps
 */
export interface StepHeader {
  /** Header key (e.g., "Content-Type") */
  key: string;
  /** Header value (supports variable references) */
  value: string;
  /** Whether this header is enabled */
  enabled: boolean;
}

/**
 * Base properties common to all step types
 */
export interface BaseStep {
  /** Unique identifier for this step */
  id: string;
  /** Display name for the step */
  name: string;
  /** Type of step */
  type: StepType;
  /** Optional description of what this step does */
  description?: string;
  /** How this step should be executed */
  executionMode: ExecutionMode;
  /** Delay in milliseconds (required when executionMode is "delayed") */
  delayMs?: number;
  /** Optional pre-condition that must be met for this step to execute */
  condition?: ConditionExpression;
  /** Position in the visual flow editor */
  position: {
    x: number;
    y: number;
  };
}

/**
 * Step that makes an HTTP request
 */
export interface RequestStep extends BaseStep {
  type: "request";
  /** ID of the server to send the request to */
  serverId: string;
  /** HTTP method to use */
  method: HttpMethod;
  /** API endpoint (can contain variable references like "${params.id}") */
  endpoint: string;
  /** Step-specific headers (merged with server headers) */
  headers: StepHeader[];
  /** Request body (can contain variable references) */
  body?: unknown;
  /** Query parameters for the request */
  queryParams?: Record<string, string>;
  /** Whether to wait for the response before continuing */
  waitForResponse: boolean;
  /** Whether to save the response for later reference */
  saveResponse: boolean;
  /** Custom alias for referencing this response (defaults to step ID) */
  responseAlias?: string;
  /** Override the server's default timeout for this request */
  timeout?: number;
  /** Response-based branching logic */
  branches?: Branch[];
  /** Retry configuration for handling failures */
  retryConfig?: {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Delay between retries in milliseconds */
    retryDelayMs: number;
    /** HTTP status codes that should trigger a retry */
    retryOn: number[];
  };
}

/**
 * Step that evaluates conditions and branches to different steps
 */
export interface ConditionStep extends BaseStep {
  type: "condition";
  /** Branches to evaluate (at least 2 required, typically including a default) */
  branches: Branch[];
}

/**
 * Step that executes child steps in a loop
 */
export interface LoopStep extends BaseStep {
  type: "loop";
  /** Loop configuration (forEach, count, or while) */
  loop: Loop;
  /** IDs of steps to execute in each iteration */
  stepIds: string[];
}

/**
 * Step that groups other steps for organization
 */
export interface GroupStep extends BaseStep {
  type: "group";
  /** IDs of steps contained in this group */
  stepIds: string[];
  /** Whether the group is collapsed in the UI */
  collapsed?: boolean;
}

/**
 * Union type of all step types
 */
export type Step = RequestStep | ConditionStep | LoopStep | GroupStep;
