/**
 * Scenario execution orchestrator
 * Manages the complete execution flow of a scenario including steps, loops, and branches
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Scenario,
  Step,
  RequestStep,
  ConditionStep,
  LoopStep,
  ExecutionMode,
  ExecutionStatus,
  StepExecutionStatus,
  StepExecutionResult,
  ExecutionLog,
  LoopContext,
  Server,
  Branch,
  WhileLoop,
} from '../types';
import {
  createVariableContext,
  type VariableContext,
} from './variableResolver';
import { evaluateCondition, evaluateOptionalCondition } from './conditionEvaluator';
import {
  createLoopIterator,
  updateWhileLoopCondition,
} from './loopProcessor';
import { executeStepRequest } from './httpClient';

/**
 * Callback functions for execution events
 */
export interface ExecutionCallbacks {
  /** Called when a step starts executing */
  onStepStart?: (stepId: string, status: StepExecutionStatus) => void;
  /** Called when a step completes */
  onStepComplete?: (stepId: string, result: StepExecutionResult) => void;
  /** Called when a log entry is added */
  onLog?: (log: ExecutionLog) => void;
  /** Called when an error occurs */
  onError?: (error: Error, stepId?: string) => void;
  /** Called when execution status changes */
  onStatusChange?: (status: ExecutionStatus) => void;
}

/**
 * Options for scenario execution
 */
export interface ExecutionOptions {
  /** Step-specific execution mode overrides */
  stepModeOverrides?: Record<string, ExecutionMode>;
  /** Callbacks for execution events */
  callbacks?: ExecutionCallbacks;
  /** Whether to stop execution on first error */
  stopOnError?: boolean;
}

/**
 * Execution control interface
 */
export interface ExecutionControl {
  /** Pauses execution (for manual steps) */
  pause(): void;
  /** Resumes execution */
  resume(): void;
  /** Stops execution */
  stop(): void;
  /** Checks if execution is paused */
  isPaused(): boolean;
  /** Checks if execution is stopped */
  isStopped(): boolean;
}

/**
 * Complete execution result
 */
export interface ExecutionResult {
  /** Execution ID */
  id: string;
  /** Final execution status */
  status: ExecutionStatus;
  /** Results for each executed step */
  stepResults: Record<string, StepExecutionResult>;
  /** Saved responses */
  responses: Record<string, unknown>;
  /** Execution logs */
  logs: ExecutionLog[];
  /** Start timestamp */
  startedAt: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Final error if execution failed */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Main scenario executor class
 */
export class ScenarioExecutor {
  private scenario: Scenario;
  private servers: Map<string, Server>;
  private executionId: string;
  private status: ExecutionStatus = 'idle';
  private paused = false;
  private stopped = false;

  // Execution state
  private params: Record<string, unknown> = {};
  private stepResults: Map<string, StepExecutionResult> = new Map();
  private responses: Map<string, unknown> = new Map();
  private loopContextStack: LoopContext[] = [];
  private logs: ExecutionLog[] = [];
  private startedAt?: string;
  private completedAt?: string;
  private stepModeOverrides: Record<string, ExecutionMode> = {};

  // Callbacks
  private callbacks: ExecutionCallbacks = {};

  // Control
  private resumePromise?: Promise<void>;
  private resumeResolver?: () => void;

  /**
   * Creates a new scenario executor
   *
   * @param scenario - Scenario to execute
   * @param servers - Map of server configurations (serverId -> Server)
   */
  constructor(scenario: Scenario, servers: Map<string, Server>) {
    this.scenario = scenario;
    this.servers = servers;
    this.executionId = uuidv4();
  }

  /**
   * Executes the scenario
   *
   * @param params - Input parameters
   * @param options - Execution options
   * @returns Promise resolving to execution result
   */
  async execute(
    params: Record<string, unknown>,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    this.params = params;
    this.stepModeOverrides = options.stepModeOverrides ?? {};
    this.callbacks = options.callbacks ?? {};
    const stopOnError = options.stopOnError ?? true;

    this.startedAt = new Date().toISOString();
    this.setStatus('running');
    this.addLog('info', 'Execution started', { params });

    try {
      // Start execution from the start step
      const startStep = this.findStep(this.scenario.startStepId);
      if (!startStep) {
        throw new Error(`Start step "${this.scenario.startStepId}" not found`);
      }

      // Execute steps in sequence following edges
      let currentStepId: string | null = startStep.id;
      while (currentStepId && !this.stopped) {
        const currentStep = this.findStep(currentStepId);
        if (!currentStep) {
          this.addLog('warn', `Step "${currentStepId}" not found, stopping execution`);
          break;
        }

        const nextStepId = await this.executeStep(currentStep);
        currentStepId = nextStepId;
      }

      // Mark as completed if not already failed/cancelled
      if (this.status === 'running') {
        this.setStatus('completed');
        this.completedAt = new Date().toISOString();
        this.addLog('info', 'Execution completed successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addLog('error', `Execution failed: ${message}`, { error });

      if (stopOnError) {
        this.setStatus('failed');
        this.completedAt = new Date().toISOString();
        this.callbacks.onError?.(
          error instanceof Error ? error : new Error(message)
        );
      }
    }

    return this.getResult();
  }

  /**
   * Gets the execution control interface
   */
  getControl(): ExecutionControl {
    return {
      pause: () => this.pause(),
      resume: () => this.resume(),
      stop: () => this.stop(),
      isPaused: () => this.paused,
      isStopped: () => this.stopped,
    };
  }

  /**
   * Pauses execution
   */
  private pause(): void {
    if (this.status === 'running') {
      this.paused = true;
      this.setStatus('paused');
      this.addLog('info', 'Execution paused');
    }
  }

  /**
   * Resumes execution
   */
  private resume(): void {
    if (this.status === 'paused') {
      this.paused = false;
      this.setStatus('running');
      this.addLog('info', 'Execution resumed');
      this.resumeResolver?.();
    }
  }

  /**
   * Stops execution
   */
  private stop(): void {
    this.stopped = true;
    this.setStatus('cancelled');
    this.completedAt = new Date().toISOString();
    this.addLog('info', 'Execution cancelled by user');
    this.resumeResolver?.();
  }

  /**
   * Waits for resume if paused
   */
  private async waitForResume(): Promise<void> {
    if (!this.paused) return;

    this.resumePromise = new Promise((resolve) => {
      this.resumeResolver = resolve;
    });

    await this.resumePromise;
  }

  /**
   * Executes a single step
   */
  private async executeStep(step: Step): Promise<string | null> {
    if (this.stopped) return null;

    // Check step pre-condition
    const context = this.createContext();
    if (!evaluateOptionalCondition(step.condition, context)) {
      this.addLog('info', `Step "${step.name}" skipped (condition not met)`, {
        stepId: step.id,
      });
      return this.getNextStepId(step);
    }

    // Get effective execution mode
    const mode = this.stepModeOverrides[step.id] ?? step.executionMode;

    // Handle bypass mode
    if (mode === 'bypass') {
      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'skipped',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      return this.getNextStepId(step);
    }

    // Handle delayed mode
    if (mode === 'delayed' && step.delayMs) {
      this.addLog('info', `Waiting ${step.delayMs}ms before executing step "${step.name}"`, {
        stepId: step.id,
      });
      await this.delay(step.delayMs);
    }

    // Handle manual mode
    if (mode === 'manual') {
      this.addLog('info', `Step "${step.name}" waiting for manual trigger`, {
        stepId: step.id,
      });
      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'waiting',
        startedAt: new Date().toISOString(),
      });
      this.pause();
      await this.waitForResume();

      if (this.stopped) return null;
    }

    // Execute based on step type
    switch (step.type) {
      case 'request':
        return this.executeRequestStep(step);
      case 'condition':
        return this.executeConditionStep(step);
      case 'loop':
        return this.executeLoopStep(step);
      case 'group':
        return this.executeGroupStep(step);
      default:
        throw new Error(`Unsupported step type: ${(step as Step).type}`);
    }
  }

  /**
   * Executes a request step
   */
  private async executeRequestStep(step: RequestStep): Promise<string | null> {
    const startTime = new Date().toISOString();
    this.setStepResult(step.id, {
      stepId: step.id,
      status: 'running',
      startedAt: startTime,
    });

    this.addLog('info', `Executing request: ${step.method} ${step.endpoint}`, {
      stepId: step.id,
    });

    try {
      const server = this.servers.get(step.serverId);
      if (!server) {
        throw new Error(`Server "${step.serverId}" not found`);
      }

      const context = this.createContext();
      const response = await executeStepRequest(
        server,
        step.method,
        step.endpoint,
        step.headers,
        step.body,
        step.queryParams,
        step.timeout,
        context
      );

      // Save response if configured
      if (step.saveResponse) {
        const alias = step.responseAlias || step.id;
        this.responses.set(alias, response.data);
        this.addLog('debug', `Response saved as "${alias}"`, {
          stepId: step.id,
        });
      }

      const result: StepExecutionResult = {
        stepId: step.id,
        status: 'success',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        request: {
          url: `${server.baseUrl}${step.endpoint}`,
          method: step.method,
          headers: step.headers.reduce((acc, h) => {
            if (h.enabled) acc[h.key] = h.value;
            return acc;
          }, {} as Record<string, string>),
          body: step.body,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          duration: response.duration,
        },
      };

      this.setStepResult(step.id, result);
      this.addLog('info', `Request completed: ${response.status} (${response.duration}ms)`, {
        stepId: step.id,
      });

      // Handle branching based on response
      if (step.branches && step.branches.length > 0) {
        return this.evaluateBranches(step.branches);
      }

      return this.getNextStepId(step);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result: StepExecutionResult = {
        stepId: step.id,
        status: 'failed',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        error: {
          code: 'REQUEST_FAILED',
          message,
          details: error,
        },
      };

      this.setStepResult(step.id, result);
      this.addLog('error', `Request failed: ${message}`, { stepId: step.id });
      throw error;
    }
  }

  /**
   * Executes a condition step
   */
  private async executeConditionStep(step: ConditionStep): Promise<string | null> {
    const startTime = new Date().toISOString();
    this.setStepResult(step.id, {
      stepId: step.id,
      status: 'running',
      startedAt: startTime,
    });

    this.addLog('info', `Evaluating conditions for step "${step.name}"`, {
      stepId: step.id,
    });

    try {
      const nextStepId = this.evaluateBranches(step.branches);

      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'success',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
      });

      return nextStepId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'failed',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        error: {
          code: 'CONDITION_EVAL_FAILED',
          message,
        },
      });
      throw error;
    }
  }

  /**
   * Executes a loop step
   */
  private async executeLoopStep(step: LoopStep): Promise<string | null> {
    const startTime = new Date().toISOString();
    this.setStepResult(step.id, {
      stepId: step.id,
      status: 'running',
      startedAt: startTime,
      iterations: 0,
      currentIteration: 0,
    });

    this.addLog('info', `Starting loop "${step.name}"`, { stepId: step.id });

    try {
      const context = this.createContext();
      const iterator = createLoopIterator(step.loop, context);

      let iteration = 0;

      while (iterator.hasNext && !this.stopped) {
        const loopContext = iterator.next();
        if (!loopContext) break;

        // Push loop context onto stack
        this.loopContextStack.push(loopContext);

        this.addLog('debug', `Loop iteration ${iteration + 1}/${iterator.totalIterations}`, {
          stepId: step.id,
          iteration,
        });

        // Update step result with current iteration
        const currentResult = this.stepResults.get(step.id);
        if (currentResult) {
          this.setStepResult(step.id, {
            ...currentResult,
            currentIteration: iteration + 1,
            iterations: iterator.totalIterations,
          });
        }

        // Execute loop body (all steps in stepIds)
        for (const childStepId of step.stepIds) {
          const childStep = this.findStep(childStepId);
          if (childStep) {
            await this.executeStep(childStep);
          }
        }

        // Pop loop context from stack
        this.loopContextStack.pop();

        // Update while loop condition if needed
        if (step.loop.type === 'while') {
          const updatedContext = this.createContext();
          updateWhileLoopCondition(iterator, step.loop as WhileLoop, updatedContext);
        }

        iteration++;
      }

      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'success',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        iterations: iteration,
      });

      this.addLog('info', `Loop completed: ${iteration} iterations`, {
        stepId: step.id,
      });

      return this.getNextStepId(step);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setStepResult(step.id, {
        stepId: step.id,
        status: 'failed',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        error: {
          code: 'LOOP_FAILED',
          message,
        },
      });
      throw error;
    }
  }

  /**
   * Executes a group step
   */
  private async executeGroupStep(step: Step): Promise<string | null> {
    // Groups are organizational only, execute contained steps in sequence
    if (step.type !== 'group') return null;

    const startTime = new Date().toISOString();
    this.setStepResult(step.id, {
      stepId: step.id,
      status: 'running',
      startedAt: startTime,
    });

    for (const childStepId of step.stepIds) {
      const childStep = this.findStep(childStepId);
      if (childStep) {
        await this.executeStep(childStep);
      }
    }

    this.setStepResult(step.id, {
      stepId: step.id,
      status: 'success',
      startedAt: startTime,
      completedAt: new Date().toISOString(),
    });

    return this.getNextStepId(step);
  }

  /**
   * Evaluates branches and returns the next step ID
   * Evaluates conditional branches first, then falls back to default branch
   */
  private evaluateBranches(branches: Branch[]): string | null {
    const context = this.createContext();

    // First, evaluate non-default branches with conditions
    for (const branch of branches) {
      if (branch.isDefault) continue; // Skip default, check it last

      // Evaluate branch condition
      if (branch.condition && evaluateCondition(branch.condition, context)) {
        this.addLog('debug', `Branch condition met, going to "${branch.nextStepId}"`, {
          branchId: branch.id,
          branchLabel: branch.label,
        });
        return branch.nextStepId || null;
      }
    }

    // Then, check for default branch as fallback
    const defaultBranch = branches.find((b) => b.isDefault);
    if (defaultBranch) {
      this.addLog('debug', `Taking default branch to "${defaultBranch.nextStepId}"`, {
        branchId: defaultBranch.id,
        branchLabel: defaultBranch.label,
      });
      return defaultBranch.nextStepId || null;
    }

    // No branch matched
    this.addLog('warn', 'No branch condition met and no default branch defined');
    return null;
  }

  /**
   * Gets the next step ID based on scenario edges
   * Only considers edges from the default (bottom) handle, not branch handles
   */
  private getNextStepId(step: Step): string | null {
    // Find edge from this step that doesn't have a branch handle (regular flow)
    const edge = this.scenario.edges.find(
      (e) => e.sourceStepId === step.id && !e.sourceHandle?.startsWith('branch_')
    );
    return edge?.targetStepId ?? null;
  }

  /**
   * Finds a step by ID
   */
  private findStep(stepId: string): Step | undefined {
    return this.scenario.steps.find((s) => s.id === stepId);
  }

  /**
   * Creates the current variable context
   */
  private createContext(): VariableContext {
    return createVariableContext(
      this.params,
      Object.fromEntries(this.responses),
      this.loopContextStack
    );
  }

  /**
   * Sets a step execution result
   */
  private setStepResult(stepId: string, result: StepExecutionResult): void {
    this.stepResults.set(stepId, result);
    this.callbacks.onStepComplete?.(stepId, result);
  }

  /**
   * Adds a log entry
   */
  private addLog(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: unknown
  ): void {
    const log: ExecutionLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    this.logs.push(log);
    this.callbacks.onLog?.(log);
  }

  /**
   * Sets the execution status
   */
  private setStatus(status: ExecutionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  /**
   * Delays execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets the execution result
   */
  private getResult(): ExecutionResult {
    return {
      id: this.executionId,
      status: this.status,
      stepResults: Object.fromEntries(this.stepResults),
      responses: Object.fromEntries(this.responses),
      logs: this.logs,
      startedAt: this.startedAt!,
      completedAt: this.completedAt,
    };
  }
}

/**
 * Executes a scenario (convenience function)
 *
 * @param scenario - Scenario to execute
 * @param servers - Map of server configurations
 * @param params - Input parameters
 * @param options - Execution options
 * @returns Promise resolving to execution result
 */
export async function executeScenario(
  scenario: Scenario,
  servers: Map<string, Server>,
  params: Record<string, unknown>,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const executor = new ScenarioExecutor(scenario, servers);
  return executor.execute(params, options);
}
