/**
 * Execution Slice
 * Manages runtime execution state, results, logs, and execution lifecycle
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ExecutionContext,
  StepExecutionResult,
  ExecutionLog,
  LoopContext,
  LoopIterationSnapshot,
  ExecutionMode,
} from '@/types';
import type { ScenarioExecutor } from '@/engine';

interface ExecutionState {
  context: ExecutionContext | null;
  history: ExecutionContext[];
  maxHistorySize: number;
  executor: ScenarioExecutor | null; // Non-serializable, runtime only
}

const initialState: ExecutionState = {
  context: null,
  history: [],
  maxHistorySize: 50,
  executor: null,
};

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    // Execution lifecycle
    startExecution: (
      state,
      action: PayloadAction<{
        scenarioId: string;
        params: Record<string, unknown>;
        stepModeOverrides?: Record<string, ExecutionMode>;
      }>
    ) => {
      const newContext: ExecutionContext = {
        id: `exec_${Date.now()}`,
        scenarioId: action.payload.scenarioId,
        status: 'running',
        params: action.payload.params,
        stepModeOverrides: action.payload.stepModeOverrides || {},
        stepResults: {},
        responses: {},
        loopContextStack: [],
        activeLoopStack: [],
        logs: [],
        startedAt: new Date().toISOString(),
      };
      state.context = newContext;
    },

    pauseExecution: state => {
      if (state.context) {
        state.context.status = 'paused';
      }
    },

    resumeExecution: state => {
      if (state.context && state.context.status === 'paused') {
        state.context.status = 'running';
      }
    },

    stopExecution: (state, action: PayloadAction<'completed' | 'failed' | 'cancelled'>) => {
      if (state.context) {
        state.context.status = action.payload;
        state.context.completedAt = new Date().toISOString();

        // Move to history
        state.history.unshift(state.context);
        if (state.history.length > state.maxHistorySize) {
          state.history.pop();
        }
      }
    },

    resetExecution: state => {
      state.context = null;
      state.executor = null;
    },

    // Executor management
    setExecutor: (state, action: PayloadAction<ScenarioExecutor | null>) => {
      state.executor = action.payload;
    },

    clearExecutor: state => {
      state.executor = null;
    },

    // Step execution
    setCurrentStep: (state, action: PayloadAction<string>) => {
      if (state.context) {
        state.context.currentStepId = action.payload;
      }
    },

    updateStepResult: (state, action: PayloadAction<StepExecutionResult>) => {
      if (state.context) {
        state.context.stepResults[action.payload.stepId] = action.payload;
      }
    },

    // Response storage
    saveResponse: (
      state,
      action: PayloadAction<{ key: string; data: unknown }>
    ) => {
      if (state.context) {
        state.context.responses[action.payload.key] = action.payload.data;
      }
    },

    // Parameter values
    setParameterValues: (state, action: PayloadAction<Record<string, unknown>>) => {
      if (state.context) {
        state.context.params = action.payload;
      }
    },

    updateParameterValue: (
      state,
      action: PayloadAction<{ key: string; value: unknown }>
    ) => {
      if (state.context) {
        state.context.params[action.payload.key] = action.payload.value;
      }
    },

    // Execution mode overrides
    setStepModeOverride: (
      state,
      action: PayloadAction<{ stepId: string; mode: ExecutionMode }>
    ) => {
      if (state.context) {
        state.context.stepModeOverrides[action.payload.stepId] = action.payload.mode;
      }
    },

    clearStepModeOverride: (state, action: PayloadAction<string>) => {
      if (state.context) {
        delete state.context.stepModeOverrides[action.payload];
      }
    },

    // Loop context management
    pushLoopContext: (state, action: PayloadAction<LoopContext>) => {
      if (state.context) {
        state.context.loopContextStack.push(action.payload);
      }
    },

    popLoopContext: state => {
      if (state.context) {
        state.context.loopContextStack.pop();
      }
    },

    updateLoopContext: (
      state,
      action: PayloadAction<{ index: number; changes: Partial<LoopContext> }>
    ) => {
      if (state.context && state.context.loopContextStack[action.payload.index]) {
        state.context.loopContextStack[action.payload.index] = {
          ...state.context.loopContextStack[action.payload.index],
          ...action.payload.changes,
        };
      }
    },

    // Loop iteration visualization
    enterLoop: (state, action: PayloadAction<LoopIterationSnapshot>) => {
      if (state.context) {
        state.context.activeLoopStack.push(action.payload);
      }
    },

    updateLoopIteration: (
      state,
      action: PayloadAction<{ stepId: string; currentIteration: number }>
    ) => {
      if (state.context) {
        const loopIndex = state.context.activeLoopStack.findIndex(
          loop => loop.stepId === action.payload.stepId
        );
        if (loopIndex !== -1) {
          state.context.activeLoopStack[loopIndex].currentIteration =
            action.payload.currentIteration;
        }
      }
    },

    exitLoop: (state, action: PayloadAction<string>) => {
      if (state.context) {
        const loopIndex = state.context.activeLoopStack.findIndex(
          loop => loop.stepId === action.payload
        );
        if (loopIndex !== -1) {
          state.context.activeLoopStack.splice(loopIndex, 1);
        }
      }
    },

    // Logging
    addLog: (
      state,
      action: PayloadAction<Omit<ExecutionLog, 'id' | 'timestamp'>>
    ) => {
      if (state.context) {
        const log: ExecutionLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          ...action.payload,
        };
        state.context.logs.push(log);
      }
    },

    clearLogs: state => {
      if (state.context) {
        state.context.logs = [];
      }
    },

    // History management
    clearHistory: state => {
      state.history = [];
    },

    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(h => h.id !== action.payload);
    },

    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxHistorySize = action.payload;
      if (state.history.length > action.payload) {
        state.history = state.history.slice(0, action.payload);
      }
    },
  },
});

export const {
  startExecution,
  pauseExecution,
  resumeExecution,
  stopExecution,
  resetExecution,
  setExecutor,
  clearExecutor,
  setCurrentStep,
  updateStepResult,
  saveResponse,
  setParameterValues,
  updateParameterValue,
  setStepModeOverride,
  clearStepModeOverride,
  pushLoopContext,
  popLoopContext,
  updateLoopContext,
  enterLoop,
  updateLoopIteration,
  exitLoop,
  addLog,
  clearLogs,
  clearHistory,
  removeFromHistory,
  setMaxHistorySize,
} = executionSlice.actions;

// Selectors
export const selectExecutor = (state: { execution: ExecutionState }) => state.execution.executor;

export default executionSlice.reducer;
