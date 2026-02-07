/**
 * Typed Redux Hooks
 * Provides type-safe hooks for accessing Redux state and dispatch
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useMemo } from 'react';
import type { Scenario, Step, Server, ExecutionContext } from '@/types';

// Basic typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Servers selectors
export const useServers = () => {
  return useAppSelector(state => state.servers.servers);
};

export const useSelectedServer = () => {
  const servers = useAppSelector(state => state.servers.servers);
  const selectedServerId = useAppSelector(state => state.servers.selectedServerId);
  return useMemo(
    () => servers.find(s => s.id === selectedServerId) || null,
    [servers, selectedServerId]
  );
};

export const useServerById = (serverId: string | null | undefined): Server | null => {
  const servers = useAppSelector(state => state.servers.servers);
  return useMemo(
    () => (serverId ? servers.find(s => s.id === serverId) || null : null),
    [servers, serverId]
  );
};

// Scenarios selectors
export const useScenarios = () => {
  return useAppSelector(state => state.scenarios.scenarios);
};

export const useCurrentScenario = (): Scenario | null => {
  const scenarios = useAppSelector(state => state.scenarios.scenarios);
  const currentScenarioId = useAppSelector(state => state.scenarios.currentScenarioId);
  return useMemo(
    () => scenarios.find(s => s.id === currentScenarioId) || null,
    [scenarios, currentScenarioId]
  );
};

export const useScenarioById = (scenarioId: string | null | undefined): Scenario | null => {
  const scenarios = useAppSelector(state => state.scenarios.scenarios);
  return useMemo(
    () => (scenarioId ? scenarios.find(s => s.id === scenarioId) || null : null),
    [scenarios, scenarioId]
  );
};

export const useCurrentSteps = (): Step[] => {
  const currentScenario = useCurrentScenario();
  return currentScenario?.steps || [];
};

export const useStepById = (stepId: string | null | undefined): Step | null => {
  const steps = useCurrentSteps();
  return useMemo(
    () => (stepId ? steps.find(s => s.id === stepId) || null : null),
    [steps, stepId]
  );
};

// Execution selectors
export const useExecutionContext = (): ExecutionContext | null => {
  return useAppSelector(state => state.execution.context);
};

export const useExecutionStatus = () => {
  return useAppSelector(state => state.execution.context?.status || 'idle');
};

export const useIsExecutionRunning = () => {
  const status = useExecutionStatus();
  return status === 'running' || status === 'paused';
};

export const useCurrentExecutionStep = () => {
  const context = useExecutionContext();
  const currentStepId = context?.currentStepId;
  return useStepById(currentStepId);
};

export const useStepResult = (stepId: string | null | undefined) => {
  const context = useExecutionContext();
  return useMemo(
    () => (stepId && context ? context.stepResults[stepId] || null : null),
    [context, stepId]
  );
};

export const useStepResults = () => {
  const context = useExecutionContext();
  return context?.stepResults || {};
};

export const useExecutionLogs = () => {
  const context = useExecutionContext();
  const filterLevel = useAppSelector(state => state.ui.logFilterLevel);

  return useMemo(() => {
    if (!context) return [];
    if (filterLevel === 'all') return context.logs;
    return context.logs.filter(log => log.level === filterLevel);
  }, [context, filterLevel]);
};

export const useExecutionResponses = () => {
  const context = useExecutionContext();
  return context?.responses || {};
};

export const useExecutionParams = () => {
  const context = useExecutionContext();
  return context?.params || {};
};

export const useLoopContextStack = () => {
  const context = useExecutionContext();
  return context?.loopContextStack || [];
};

export const useCurrentLoopContext = () => {
  const stack = useLoopContextStack();
  return stack.length > 0 ? stack[stack.length - 1] : null;
};

export const useExecutionHistory = () => {
  return useAppSelector(state => state.execution.history);
};

// UI selectors
export const useUIMode = () => {
  return useAppSelector(state => state.ui.mode);
};

export const useSelectedStep = () => {
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);
  const step = useStepById(selectedStepId);
  return step;
};

export const useSelectedStepId = () => {
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);
  return selectedStepId;
};

export const useExpandedPanels = () => {
  return useAppSelector(state => state.ui.expandedPanels);
};

export const useIsPanelExpanded = (panel: keyof RootState['ui']['expandedPanels']) => {
  return useAppSelector(state => state.ui.expandedPanels[panel]);
};

export const useSidebarOpen = () => {
  return useAppSelector(state => state.ui.sidebarOpen);
};

export const useRightPanelOpen = () => {
  return useAppSelector(state => state.ui.rightPanelOpen);
};

export const useFlowEditorPreferences = () => {
  return useAppSelector(state => ({
    showGrid: state.ui.showGrid,
    snapToGrid: state.ui.snapToGrid,
    gridSize: state.ui.gridSize,
    zoom: state.ui.zoom,
  }));
};

export const useNotifications = () => {
  return useAppSelector(state => state.ui.notifications);
};

// Complex computed selectors
export const useScenarioServers = (scenarioId: string | null | undefined) => {
  const scenario = useScenarioById(scenarioId);
  const servers = useServers();

  return useMemo(() => {
    if (!scenario) return [];
    return servers.filter(s => scenario.serverIds.includes(s.id));
  }, [scenario, servers]);
};

export const useStepExecutionMode = (stepId: string | null | undefined) => {
  const step = useStepById(stepId);
  const context = useExecutionContext();

  return useMemo(() => {
    if (!step) return null;
    return context?.stepModeOverrides[step.id] || step.executionMode;
  }, [step, context]);
};

export const useIsStepCompleted = (stepId: string | null | undefined) => {
  const result = useStepResult(stepId);
  return result?.status === 'success' || result?.status === 'failed' || result?.status === 'skipped';
};

export const useIsStepRunning = (stepId: string | null | undefined) => {
  const result = useStepResult(stepId);
  return result?.status === 'running';
};

export const useIsStepWaiting = (stepId: string | null | undefined) => {
  const result = useStepResult(stepId);
  return result?.status === 'waiting';
};

// Statistics
export const useExecutionStatistics = () => {
  const context = useExecutionContext();

  return useMemo(() => {
    if (!context) {
      return {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        pendingSteps: 0,
        successRate: 0,
        duration: 0,
      };
    }

    const results = Object.values(context.stepResults);
    const totalSteps = results.length;
    const completedSteps = results.filter(r => r.status === 'success').length;
    const failedSteps = results.filter(r => r.status === 'failed').length;
    const skippedSteps = results.filter(r => r.status === 'skipped').length;
    const pendingSteps = results.filter(r => r.status === 'pending').length;
    const successRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    let duration = 0;
    if (context.startedAt && context.completedAt) {
      const endTime = new Date(context.completedAt).getTime();
      const startTime = new Date(context.startedAt).getTime();
      duration = endTime - startTime;
    }

    return {
      totalSteps,
      completedSteps,
      failedSteps,
      skippedSteps,
      pendingSteps,
      successRate,
      duration,
    };
  }, [context]);
};
