/**
 * Storage Service
 * Handles IndexedDB persistence for scenarios and servers
 * Provides import/export functionality with JSON and YAML formats
 */

import { openDB, type IDBPDatabase } from 'idb';
import * as yaml from 'js-yaml';
import type { Scenario, Server } from '@/types';

const DB_NAME = 'scenario-tool-db';
const DB_VERSION = 1;
const SCENARIOS_STORE = 'scenarios';
const SERVERS_STORE = 'servers';

interface ScenarioToolDBSchema {
  scenarios: {
    key: string;
    value: Scenario;
  };
  servers: {
    key: string;
    value: Server;
  };
}

type ScenarioToolDB = IDBPDatabase<ScenarioToolDBSchema>;

/**
 * Initialize IndexedDB database
 * Creates object stores if they don't exist
 */
export async function initDatabase(): Promise<ScenarioToolDB> {
  try {
    const db = await openDB<ScenarioToolDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create scenarios store if it doesn't exist
        if (!db.objectStoreNames.contains(SCENARIOS_STORE)) {
          const scenariosStore = db.createObjectStore(SCENARIOS_STORE, { keyPath: 'id' });
          scenariosStore.createIndex('name', 'name', { unique: false });
          scenariosStore.createIndex('createdAt', 'createdAt', { unique: false });
          scenariosStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create servers store if it doesn't exist
        if (!db.objectStoreNames.contains(SERVERS_STORE)) {
          const serversStore = db.createObjectStore(SERVERS_STORE, { keyPath: 'id' });
          serversStore.createIndex('name', 'name', { unique: false });
          serversStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Database initialization failed');
  }
}

/**
 * Save or update a scenario in IndexedDB
 */
export async function saveScenario(scenario: Scenario): Promise<void> {
  try {
    const db = await initDatabase();
    await db.put(SCENARIOS_STORE, scenario);
  } catch (error) {
    console.error('Failed to save scenario:', error);
    throw new Error(`Failed to save scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load all scenarios from IndexedDB
 */
export async function loadScenarios(): Promise<Scenario[]> {
  try {
    const db = await initDatabase();
    const scenarios = await db.getAll(SCENARIOS_STORE);
    return scenarios;
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    throw new Error(`Failed to load scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load a single scenario by ID from IndexedDB
 */
export async function loadScenario(id: string): Promise<Scenario | undefined> {
  try {
    const db = await initDatabase();
    return await db.get(SCENARIOS_STORE, id);
  } catch (error) {
    console.error('Failed to load scenario:', error);
    throw new Error(`Failed to load scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a scenario from IndexedDB
 */
export async function deleteScenario(id: string): Promise<void> {
  try {
    const db = await initDatabase();
    await db.delete(SCENARIOS_STORE, id);
  } catch (error) {
    console.error('Failed to delete scenario:', error);
    throw new Error(`Failed to delete scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save all servers to IndexedDB
 */
export async function saveServers(servers: Server[]): Promise<void> {
  try {
    const db = await initDatabase();
    const tx = db.transaction(SERVERS_STORE, 'readwrite');

    // Clear existing servers and save new ones
    await tx.store.clear();
    await Promise.all(servers.map(server => tx.store.put(server)));
    await tx.done;
  } catch (error) {
    console.error('Failed to save servers:', error);
    throw new Error(`Failed to save servers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save a single server to IndexedDB
 */
export async function saveServer(server: Server): Promise<void> {
  try {
    const db = await initDatabase();
    await db.put(SERVERS_STORE, server);
  } catch (error) {
    console.error('Failed to save server:', error);
    throw new Error(`Failed to save server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load all servers from IndexedDB
 */
export async function loadServers(): Promise<Server[]> {
  try {
    const db = await initDatabase();
    const servers = await db.getAll(SERVERS_STORE);
    return servers;
  } catch (error) {
    console.error('Failed to load servers:', error);
    throw new Error(`Failed to load servers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a server from IndexedDB
 */
export async function deleteServerFromDB(id: string): Promise<void> {
  try {
    const db = await initDatabase();
    await db.delete(SERVERS_STORE, id);
  } catch (error) {
    console.error('Failed to delete server:', error);
    throw new Error(`Failed to delete server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export a scenario to JSON string
 */
export function exportToJson(scenario: Scenario): string {
  try {
    return JSON.stringify(scenario, null, 2);
  } catch (error) {
    console.error('Failed to export to JSON:', error);
    throw new Error(`Failed to export to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import a scenario from JSON string
 */
export function importFromJson(json: string): Scenario {
  try {
    const parsed = JSON.parse(json);
    validateScenario(parsed);
    const scenario = parsed as Scenario;

    // Ensure all steps have valid position data
    scenario.steps = scenario.steps.map((step, index) => ({
      ...step,
      position: step.position || { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 }
    }));

    // Sanitize container step references to only include existing steps
    sanitizeStepReferences(scenario);

    return scenario;
  } catch (error) {
    console.error('Failed to import from JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw new Error(`Failed to import from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export a scenario to YAML string
 */
export function exportToYaml(scenario: Scenario): string {
  try {
    return yaml.dump(scenario, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
  } catch (error) {
    console.error('Failed to export to YAML:', error);
    throw new Error(`Failed to export to YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import a scenario from YAML string
 */
export function importFromYaml(yamlString: string): Scenario {
  try {
    const parsed = yaml.load(yamlString);
    validateScenario(parsed);
    const scenario = parsed as Scenario;

    // Ensure all steps have valid position data
    scenario.steps = scenario.steps.map((step, index) => ({
      ...step,
      position: step.position || { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 }
    }));

    // Sanitize container step references to only include existing steps
    sanitizeStepReferences(scenario);

    return scenario;
  } catch (error) {
    console.error('Failed to import from YAML:', error);
    if (error instanceof yaml.YAMLException) {
      throw new Error(`Invalid YAML format: ${error.message}`);
    }
    throw new Error(`Failed to import from YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export servers to JSON string
 */
export function exportServersToJson(servers: Server[]): string {
  try {
    return JSON.stringify(servers, null, 2);
  } catch (error) {
    console.error('Failed to export servers to JSON:', error);
    throw new Error(`Failed to export servers to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import servers from JSON string
 */
export function importServersFromJson(json: string): Server[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected an array of servers');
    }
    parsed.forEach(validateServer);
    return parsed as Server[];
  } catch (error) {
    console.error('Failed to import servers from JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw new Error(`Failed to import servers from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sanitize step references in a scenario to remove references to non-existent steps
 * This prevents rendering issues when importing scenarios with invalid references
 */
function sanitizeStepReferences(scenario: Scenario): void {
  const validStepIds = new Set(scenario.steps.map(step => step.id));

  scenario.steps.forEach(step => {
    // Clean up Loop and Group container stepIds
    if ((step.type === 'loop' || step.type === 'group') && step.stepIds) {
      step.stepIds = step.stepIds.filter(id => validStepIds.has(id));
    }

    // Clean up Condition and Request branch nextStepIds
    if ((step.type === 'condition' || step.type === 'request') && step.branches) {
      step.branches = step.branches.map(branch => ({
        ...branch,
        nextStepId: branch.nextStepId && validStepIds.has(branch.nextStepId) ? branch.nextStepId : ''
      }));
    }
  });

  // Clean up scenario edges to only include edges between existing steps
  scenario.edges = scenario.edges.filter(
    edge => validStepIds.has(edge.sourceStepId) && validStepIds.has(edge.targetStepId)
  );

  // Verify startStepId exists, if not set to first step or empty
  if (!validStepIds.has(scenario.startStepId)) {
    scenario.startStepId = scenario.steps.length > 0 ? scenario.steps[0].id : '';
  }
}

/**
 * Validate that an object is a valid Scenario
 */
function validateScenario(obj: unknown): asserts obj is Scenario {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid scenario: must be an object');
  }

  const scenario = obj as Partial<Scenario>;

  if (!scenario.id || typeof scenario.id !== 'string') {
    throw new Error('Invalid scenario: missing or invalid id');
  }

  if (!scenario.name || typeof scenario.name !== 'string') {
    throw new Error('Invalid scenario: missing or invalid name');
  }

  if (!scenario.version || typeof scenario.version !== 'string') {
    throw new Error('Invalid scenario: missing or invalid version');
  }

  if (!Array.isArray(scenario.steps)) {
    throw new Error('Invalid scenario: steps must be an array');
  }

  if (!Array.isArray(scenario.edges)) {
    throw new Error('Invalid scenario: edges must be an array');
  }

  if (!Array.isArray(scenario.parameterSchema)) {
    throw new Error('Invalid scenario: parameterSchema must be an array');
  }

  if (!Array.isArray(scenario.serverIds)) {
    throw new Error('Invalid scenario: serverIds must be an array');
  }

  if (!scenario.startStepId || typeof scenario.startStepId !== 'string') {
    throw new Error('Invalid scenario: missing or invalid startStepId');
  }

  if (!scenario.createdAt || typeof scenario.createdAt !== 'string') {
    throw new Error('Invalid scenario: missing or invalid createdAt');
  }

  if (!scenario.updatedAt || typeof scenario.updatedAt !== 'string') {
    throw new Error('Invalid scenario: missing or invalid updatedAt');
  }
}

/**
 * Validate that an object is a valid Server
 */
function validateServer(obj: unknown): asserts obj is Server {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid server: must be an object');
  }

  const server = obj as Partial<Server>;

  if (!server.id || typeof server.id !== 'string') {
    throw new Error('Invalid server: missing or invalid id');
  }

  if (!server.name || typeof server.name !== 'string') {
    throw new Error('Invalid server: missing or invalid name');
  }

  if (!server.baseUrl || typeof server.baseUrl !== 'string') {
    throw new Error('Invalid server: missing or invalid baseUrl');
  }

  if (!Array.isArray(server.headers)) {
    throw new Error('Invalid server: headers must be an array');
  }

  if (typeof server.timeout !== 'number') {
    throw new Error('Invalid server: timeout must be a number');
  }

  if (!server.createdAt || typeof server.createdAt !== 'string') {
    throw new Error('Invalid server: missing or invalid createdAt');
  }

  if (!server.updatedAt || typeof server.updatedAt !== 'string') {
    throw new Error('Invalid server: missing or invalid updatedAt');
  }
}

/**
 * Clear all data from IndexedDB
 */
export async function clearAllData(): Promise<void> {
  try {
    const db = await initDatabase();
    const tx = db.transaction([SCENARIOS_STORE, SERVERS_STORE], 'readwrite');
    await Promise.all([
      tx.objectStore(SCENARIOS_STORE).clear(),
      tx.objectStore(SERVERS_STORE).clear(),
    ]);
    await tx.done;
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export all data (scenarios and servers) to a single JSON file
 */
export async function exportAllData(): Promise<string> {
  try {
    const [scenarios, servers] = await Promise.all([
      loadScenarios(),
      loadServers(),
    ]);

    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scenarios,
        servers,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Failed to export all data:', error);
    throw new Error(`Failed to export all data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import all data (scenarios and servers) from a JSON file
 */
export async function importAllData(json: string): Promise<{ scenarios: number; servers: number }> {
  try {
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data format');
    }

    const data = parsed as {
      version?: string;
      scenarios?: Scenario[];
      servers?: Server[];
    };

    // Validate scenarios
    if (data.scenarios && Array.isArray(data.scenarios)) {
      data.scenarios.forEach(validateScenario);
    }

    // Validate servers
    if (data.servers && Array.isArray(data.servers)) {
      data.servers.forEach(validateServer);
    }

    // Save to database
    const db = await initDatabase();
    const tx = db.transaction([SCENARIOS_STORE, SERVERS_STORE], 'readwrite');

    let scenariosCount = 0;
    let serversCount = 0;

    if (data.scenarios) {
      await Promise.all(
        data.scenarios.map(async scenario => {
          await tx.objectStore(SCENARIOS_STORE).put(scenario);
          scenariosCount++;
        })
      );
    }

    if (data.servers) {
      await Promise.all(
        data.servers.map(async server => {
          await tx.objectStore(SERVERS_STORE).put(server);
          serversCount++;
        })
      );
    }

    await tx.done;

    return { scenarios: scenariosCount, servers: serversCount };
  } catch (error) {
    console.error('Failed to import all data:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw new Error(`Failed to import all data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
