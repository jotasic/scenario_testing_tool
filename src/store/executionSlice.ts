/**
 * Execution Slice
 * Manages runtime execution state, results, logs, and execution lifecycle
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ExecutionContext,
  StepExecutionResult,
  ExecutionLog,
  LoopContext,
  ExecutionMode,
} from '@/types';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { serializeError } from '@/engine/httpClient';

interface ExecutionState {
  context: ExecutionContext | null;
  history: ExecutionContext[];
  maxHistorySize: number;
}

const initialState: ExecutionState = {
  context: null,
  history: [],
  maxHistorySize: 50,
};

// Async thunk for making HTTP requests
export const executeHttpRequest = createAsyncThunk(
  'execution/executeHttpRequest',
  async (
    payload: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: unknown;
      timeout?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const startTime = Date.now();
      const response = await axios({
        url: payload.url,
        method: payload.method,
        headers: payload.headers,
        data: payload.body,
        timeout: payload.timeout || 30000,
      });
      const duration = Date.now() - startTime;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        duration,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return rejectWithValue({
          code: axiosError.code || 'REQUEST_FAILED',
          message: axiosError.message,
          details: axiosError.response?.data,
        });
      }
      return rejectWithValue({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: serializeError(error),
      });
    }
  }
);

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
  extraReducers: builder => {
    builder
      .addCase(executeHttpRequest.pending, (state, action) => {
        // Request started - can add logging here if needed
        if (state.context) {
          const log: ExecutionLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `HTTP ${action.meta.arg.method} ${action.meta.arg.url}`,
          };
          state.context.logs.push(log);
        }
      })
      .addCase(executeHttpRequest.fulfilled, (state, action) => {
        // Request succeeded
        if (state.context) {
          const log: ExecutionLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Response received: ${action.payload.status} ${action.payload.statusText} (${action.payload.duration}ms)`,
            data: action.payload,
          };
          state.context.logs.push(log);
        }
      })
      .addCase(executeHttpRequest.rejected, (state, action) => {
        // Request failed
        if (state.context) {
          const log: ExecutionLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Request failed: ${
              action.payload && typeof action.payload === 'object' && 'message' in action.payload
                ? String(action.payload.message)
                : 'Unknown error'
            }`,
            data: action.payload,
          };
          state.context.logs.push(log);
        }
      });
  },
});

export const {
  startExecution,
  pauseExecution,
  resumeExecution,
  stopExecution,
  resetExecution,
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
  addLog,
  clearLogs,
  clearHistory,
  removeFromHistory,
  setMaxHistorySize,
} = executionSlice.actions;

export default executionSlice.reducer;
