/**
 * useScenarioExecution Hook
 * Connects the ScenarioExecutor engine with Redux state
 * Handles execution lifecycle, callbacks, and manual step dialogs
 */

import { useCallback } from 'react';
import { ScenarioExecutor, type ExecutionCallbacks } from '@/engine';
import {
  useAppDispatch,
  useAppSelector,
  useCurrentScenario,
  useServers,
  useExecutionContext,
  useExecutionParams,
} from '@/store/hooks';
import {
  startExecution,
  pauseExecution as pauseExecutionAction,
  resumeExecution as resumeExecutionAction,
  stopExecution,
  setCurrentStep,
  updateStepResult,
  addLog,
  saveResponse,
  setExecutor,
  clearExecutor,
  selectExecutor,
} from '@/store/executionSlice';
import type { ExecutionMode, StepExecutionResult, ExecutionLog } from '@/types';

/**
 * Hook for managing scenario execution
 * Integrates the execution engine with Redux and provides control methods
 */
export function useScenarioExecution() {
  const dispatch = useAppDispatch();
  const currentScenario = useCurrentScenario();
  const servers = useServers();
  const executionContext = useExecutionContext();
  const params = useExecutionParams();
  const executor = useAppSelector(selectExecutor);

  /**
   * Create execution callbacks that dispatch to Redux
   */
  const createCallbacks = useCallback((): ExecutionCallbacks => {
    return {
      onStepStart: (stepId: string, status) => {
        dispatch(setCurrentStep(stepId));
        dispatch(
          updateStepResult({
            stepId,
            status,
            startedAt: new Date().toISOString(),
          })
        );
      },

      onStepComplete: (stepId: string, result: StepExecutionResult) => {
        dispatch(updateStepResult(result));

        // Save response if available
        if (result.response) {
          const step = currentScenario?.steps.find(s => s.id === stepId);
          if (step?.type === 'request' && step.saveResponse) {
            const alias = step.responseAlias || stepId;
            dispatch(saveResponse({ key: alias, data: result.response.data }));
          }
        }
      },

      onLog: (log: ExecutionLog) => {
        dispatch(
          addLog({
            level: log.level,
            message: log.message,
            stepId: log.stepId,
            data: log.data,
          })
        );
      },

      onError: (error: Error, stepId?: string) => {
        dispatch(
          addLog({
            level: 'error',
            message: `Error: ${error.message}`,
            stepId,
            data: { error: error.message, stack: error.stack },
          })
        );
      },

      onStatusChange: (status) => {
        // Sync executor status with Redux
        if (status === 'paused') {
          dispatch(pauseExecutionAction());
        } else if (status === 'running') {
          dispatch(resumeExecutionAction());
        } else if (status === 'completed') {
          dispatch(stopExecution('completed'));
        } else if (status === 'failed') {
          dispatch(stopExecution('failed'));
        } else if (status === 'cancelled') {
          dispatch(stopExecution('cancelled'));
        }
      },
    };
  }, [dispatch, currentScenario]);

  /**
   * Start scenario execution
   */
  const executeScenario = useCallback(
    async (
      parameterValues?: Record<string, unknown>,
      stepModeOverrides?: Record<string, ExecutionMode>
    ) => {
      if (!currentScenario) {
        console.error('No scenario selected');
        return;
      }

      // Create server map
      const serverMap = new Map(servers.map(s => [s.id, s]));

      // Verify all required servers exist
      const missingServers = currentScenario.serverIds.filter(
        id => !serverMap.has(id)
      );
      if (missingServers.length > 0) {
        console.error('Missing servers:', missingServers);
        dispatch(
          addLog({
            level: 'error',
            message: `Missing servers: ${missingServers.join(', ')}`,
          })
        );
        return;
      }

      // Initialize execution in Redux
      dispatch(
        startExecution({
          scenarioId: currentScenario.id,
          params: parameterValues || params || {},
          stepModeOverrides: stepModeOverrides || executionContext?.stepModeOverrides || {},
        })
      );

      // Create new executor instance and store in Redux
      const newExecutor = new ScenarioExecutor(currentScenario, serverMap);
      dispatch(setExecutor(newExecutor));

      // Execute scenario with callbacks
      const callbacks = createCallbacks();

      newExecutor
        .execute(parameterValues || params || {}, {
          stepModeOverrides: stepModeOverrides || executionContext?.stepModeOverrides || {},
          callbacks,
          stopOnError: true,
        })
        .then(result => {
          console.log('Execution completed:', result);
        })
        .catch(error => {
          console.error('Execution failed:', error);
          dispatch(
            addLog({
              level: 'error',
              message: `Execution failed: ${error.message}`,
              data: error,
            })
          );
        })
        .finally(() => {
          dispatch(clearExecutor());
        });
    },
    [
      currentScenario,
      servers,
      params,
      executionContext?.stepModeOverrides,
      dispatch,
      createCallbacks,
    ]
  );

  /**
   * Pause execution
   */
  const pauseExecution = useCallback(() => {
    if (executor) {
      executor.getControl().pause();
      dispatch(pauseExecutionAction());
    }
  }, [executor, dispatch]);

  /**
   * Resume execution
   */
  const resumeExecution = useCallback(() => {
    if (executor) {
      executor.getControl().resume();
      dispatch(resumeExecutionAction());
    }
  }, [executor, dispatch]);

  /**
   * Stop execution
   */
  const stopExecutionNow = useCallback(() => {
    if (executor) {
      executor.getControl().stop();
      dispatch(stopExecution('cancelled'));
      dispatch(clearExecutor());
    }
  }, [executor, dispatch]);

  /**
   * Check if execution is in progress
   */
  const isExecuting = executor !== null;

  /**
   * Check if execution is paused
   */
  const isPaused = executor?.getControl().isPaused() ?? false;

  /**
   * Check if execution is stopped
   */
  const isStopped = executor?.getControl().isStopped() ?? false;

  return {
    executeScenario,
    pauseExecution,
    resumeExecution,
    stopExecution: stopExecutionNow,
    isExecuting,
    isPaused,
    isStopped,
    executor,
  };
}
