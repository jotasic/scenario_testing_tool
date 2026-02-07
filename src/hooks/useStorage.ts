/**
 * Storage Hooks
 * React hooks for storage operations with auto-save and loading functionality
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addScenario, loadScenarios as loadScenariosAction } from '@/store/scenariosSlice';
import { loadServers as loadServersAction } from '@/store/serversSlice';
import {
  saveScenario,
  loadScenarios,
  loadServers,
  saveServer,
  exportToJson,
  exportToYaml,
  importFromJson,
  importFromYaml,
  exportAllData,
  importAllData,
  initDatabase,
} from '@/services/storage';
import type { Scenario } from '@/types';

/**
 * Hook to load scenarios and servers on app mount
 */
export function useLoadOnMount() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize database
        await initDatabase();

        // Load scenarios and servers in parallel
        const [scenarios, servers] = await Promise.all([
          loadScenarios(),
          loadServers(),
        ]);

        // Dispatch to store using bulk load actions
        if (scenarios.length > 0) {
          dispatch(loadScenariosAction(scenarios));
        }

        if (servers.length > 0) {
          dispatch(loadServersAction(servers));
        }

        console.log(`Loaded ${scenarios.length} scenarios and ${servers.length} servers from IndexedDB`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        console.error('Error loading data:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  return { isLoading, error };
}

/**
 * Hook to auto-save scenarios to IndexedDB when they change
 * Debounces saves to avoid excessive writes
 */
export function useAutoSave(debounceMs: number = 1000) {
  const scenarios = useAppSelector(state => state.scenarios.present.scenarios);
  const servers = useAppSelector(state => state.servers.servers);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previousScenariosRef = useRef<string>('');
  const previousServersRef = useRef<string>('');

  useEffect(() => {
    // Serialize current state to compare
    const currentScenarios = JSON.stringify(scenarios);
    const currentServers = JSON.stringify(servers);

    // Check if anything changed
    const scenariosChanged = currentScenarios !== previousScenariosRef.current;
    const serversChanged = currentServers !== previousServersRef.current;

    if (!scenariosChanged && !serversChanged) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);

        // Save scenarios that changed
        if (scenariosChanged) {
          await Promise.all(scenarios.map(scenario => saveScenario(scenario)));
          previousScenariosRef.current = currentScenarios;
        }

        // Save servers that changed
        if (serversChanged) {
          await Promise.all(servers.map(server => saveServer(server)));
          previousServersRef.current = currentServers;
        }

        setLastSaved(new Date());
        console.log('Auto-saved to IndexedDB');
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scenarios, servers, debounceMs]);

  return { isSaving, lastSaved };
}

/**
 * Hook to manually save the current scenario
 */
export function useManualSave() {
  const currentScenarioId = useAppSelector(state => state.scenarios.present.currentScenarioId);
  const scenarios = useAppSelector(state => state.scenarios.present.scenarios);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!currentScenarioId) {
      setError('No scenario selected');
      return { success: false, error: 'No scenario selected' };
    }

    const scenario = scenarios.find(s => s.id === currentScenarioId);
    if (!scenario) {
      setError('Scenario not found');
      return { success: false, error: 'Scenario not found' };
    }

    try {
      setIsSaving(true);
      setError(null);
      await saveScenario(scenario);
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save scenario';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [currentScenarioId, scenarios]);

  return { save, isSaving, error };
}

/**
 * Hook to export scenarios
 */
export function useExport() {
  const currentScenarioId = useAppSelector(state => state.scenarios.present.currentScenarioId);
  const scenarios = useAppSelector(state => state.scenarios.present.scenarios);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportScenario = useCallback(
    async (format: 'json' | 'yaml' = 'json', scenarioId?: string) => {
      const id = scenarioId || currentScenarioId;
      if (!id) {
        setError('No scenario selected');
        return { success: false, error: 'No scenario selected' };
      }

      const scenario = scenarios.find(s => s.id === id);
      if (!scenario) {
        setError('Scenario not found');
        return { success: false, error: 'Scenario not found' };
      }

      try {
        setIsExporting(true);
        setError(null);

        const content = format === 'yaml' ? exportToYaml(scenario) : exportToJson(scenario);
        const blob = new Blob([content], {
          type: format === 'yaml' ? 'text/yaml' : 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scenario.name}_${scenario.version}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export scenario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsExporting(false);
      }
    },
    [currentScenarioId, scenarios]
  );

  const exportAll = useCallback(async () => {
    try {
      setIsExporting(true);
      setError(null);

      const content = await exportAllData();
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenario-tool-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export all data';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportScenario, exportAll, isExporting, error };
}

/**
 * Hook to import scenarios
 */
export function useImport() {
  const dispatch = useAppDispatch();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importScenario = useCallback(
    async (file: File): Promise<{ success: boolean; scenario?: Scenario; error?: string }> => {
      try {
        setIsImporting(true);
        setError(null);

        const content = await file.text();
        const extension = file.name.split('.').pop()?.toLowerCase();

        let scenario: Scenario;
        if (extension === 'yaml' || extension === 'yml') {
          scenario = importFromYaml(content);
        } else if (extension === 'json') {
          scenario = importFromJson(content);
        } else {
          throw new Error('Unsupported file format. Please use .json or .yaml files.');
        }

        // Update timestamps
        scenario.updatedAt = new Date().toISOString();

        // Save to IndexedDB
        await saveScenario(scenario);

        // Add to Redux store
        dispatch(addScenario(scenario));

        return { success: true, scenario };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import scenario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsImporting(false);
      }
    },
    [dispatch]
  );

  const importAll = useCallback(
    async (file: File): Promise<{ success: boolean; scenarios?: number; servers?: number; error?: string }> => {
      try {
        setIsImporting(true);
        setError(null);

        const content = await file.text();
        const result = await importAllData(content);

        // Reload data from IndexedDB
        const [scenarios, servers] = await Promise.all([loadScenarios(), loadServers()]);

        // Update Redux store using bulk load actions
        if (scenarios.length > 0) {
          dispatch(loadScenariosAction(scenarios));
        }
        if (servers.length > 0) {
          dispatch(loadServersAction(servers));
        }

        return { success: true, scenarios: result.scenarios, servers: result.servers };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsImporting(false);
      }
    },
    [dispatch]
  );

  return { importScenario, importAll, isImporting, error };
}

/**
 * Hook to check if there are unsaved changes
 */
export function useUnsavedChanges() {
  const scenarios = useAppSelector(state => state.scenarios.present.scenarios);
  const servers = useAppSelector(state => state.servers.servers);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedStateRef = useRef<string>('');

  useEffect(() => {
    const currentState = JSON.stringify({ scenarios, servers });

    if (savedStateRef.current === '') {
      // Initialize on first render
      savedStateRef.current = currentState;
      return;
    }

    setHasUnsavedChanges(currentState !== savedStateRef.current);
  }, [scenarios, servers]);

  const markAsSaved = useCallback(() => {
    savedStateRef.current = JSON.stringify({ scenarios, servers });
    setHasUnsavedChanges(false);
  }, [scenarios, servers]);

  return { hasUnsavedChanges, markAsSaved };
}
