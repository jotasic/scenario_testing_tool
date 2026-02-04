/**
 * Execution runtime types
 * Tracks the state and results of scenario execution
 */

import type { HttpMethod } from './step';
import type { ExecutionMode } from './step';

/**
 * Overall execution status
 */
export type ExecutionStatus =
  | "idle" // Not started
  | "running" // Currently executing
  | "paused" // Paused (waiting for manual step)
  | "completed" // Successfully finished all steps
  | "failed" // Failed with error
  | "cancelled"; // User cancelled execution

/**
 * Status of an individual step execution
 */
export type StepExecutionStatus =
  | "pending" // Not yet executed
  | "running" // Currently executing
  | "waiting" // Waiting for manual trigger or delay
  | "success" // Completed successfully
  | "failed" // Failed with error
  | "skipped" // Bypassed or condition not met
  | "cancelled"; // Cancelled by user

/**
 * Result of executing a single step
 */
export interface StepExecutionResult {
  /** ID of the step that was executed */
  stepId: string;
  /** Current status of this step */
  status: StepExecutionStatus;
  /** ISO timestamp when step execution started */
  startedAt?: string;
  /** ISO timestamp when step execution completed */
  completedAt?: string;

  // Request step data
  /** Details of the HTTP request that was sent (for request steps) */
  request?: {
    /** Full URL that was called */
    url: string;
    /** HTTP method used */
    method: HttpMethod;
    /** Headers sent with the request */
    headers: Record<string, string>;
    /** Request body (if any) */
    body?: unknown;
  };

  /** Response received from the server (for request steps) */
  response?: {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Response headers */
    headers: Record<string, string>;
    /** Response body */
    data: unknown;
    /** Response time in milliseconds */
    duration: number;
  };

  /** Error information if the step failed */
  error?: {
    /** Error code or type */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: unknown;
  };

  // Loop step data
  /** Total number of iterations (for loop steps) */
  iterations?: number;
  /** Current iteration number (for loop steps) */
  currentIteration?: number;
}

/**
 * Log entry for execution events
 */
export interface ExecutionLog {
  /** Unique identifier for this log entry */
  id: string;
  /** ISO timestamp when this log was created */
  timestamp: string;
  /** Log level */
  level: "info" | "warn" | "error" | "debug";
  /** ID of the step that generated this log (if applicable) */
  stepId?: string;
  /** Log message */
  message: string;
  /** Additional structured data */
  data?: unknown;
}

/**
 * Context information for loop execution
 * Maintained in a stack to support nested loops
 */
export interface LoopContext {
  /** ID of the loop step */
  loopId: string;
  /** Current iteration index (0-based) */
  currentIndex: number;
  /** Current item being processed (for forEach loops) */
  currentItem?: unknown;
  /** Total number of iterations for this loop */
  totalIterations: number;
}

/**
 * Complete execution context for a scenario run
 * Contains all state needed to execute and track a scenario
 */
export interface ExecutionContext {
  /** Unique identifier for this execution run */
  id: string;
  /** ID of the scenario being executed */
  scenarioId: string;
  /** Current overall execution status */
  status: ExecutionStatus;

  // Input parameters
  /** Parameter values provided for this execution */
  params: Record<string, unknown>;

  // Runtime overrides
  /** Step-specific execution mode overrides (stepId -> mode) */
  stepModeOverrides: Record<string, ExecutionMode>;

  // Execution state
  /** ID of the currently executing step */
  currentStepId?: string;
  /** Results for each step that has been executed (stepId -> result) */
  stepResults: Record<string, StepExecutionResult>;

  // Variable storage
  /** Saved responses from steps (stepId or alias -> response data) */
  responses: Record<string, unknown>;
  /** Stack of loop contexts for nested loop support */
  loopContextStack: LoopContext[];

  // Logs
  /** Chronological log of execution events */
  logs: ExecutionLog[];

  // Timing
  /** ISO timestamp when execution started */
  startedAt?: string;
  /** ISO timestamp when execution completed */
  completedAt?: string;
}
