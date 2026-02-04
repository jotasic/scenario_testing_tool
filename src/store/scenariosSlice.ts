/**
 * Scenarios Slice
 * Manages scenario definitions, steps, edges, and parameter schemas
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Scenario, Step, ScenarioEdge, ParameterSchema } from '@/types';

interface ScenariosState {
  scenarios: Scenario[];
  currentScenarioId: string | null;
}

const initialState: ScenariosState = {
  scenarios: [],
  currentScenarioId: null,
};

const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    // Scenario CRUD operations
    addScenario: (state, action: PayloadAction<Scenario>) => {
      state.scenarios.push(action.payload);
    },

    updateScenario: (state, action: PayloadAction<{ id: string; changes: Partial<Scenario> }>) => {
      const index = state.scenarios.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.scenarios[index] = {
          ...state.scenarios[index],
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteScenario: (state, action: PayloadAction<string>) => {
      state.scenarios = state.scenarios.filter(s => s.id !== action.payload);
      if (state.currentScenarioId === action.payload) {
        state.currentScenarioId = null;
      }
    },

    setCurrentScenario: (state, action: PayloadAction<string | null>) => {
      state.currentScenarioId = action.payload;
    },

    duplicateScenario: (state, action: PayloadAction<string>) => {
      const original = state.scenarios.find(s => s.id === action.payload);
      if (original) {
        const timestamp = Date.now();
        const duplicate: Scenario = {
          ...original,
          id: `scn_${timestamp}`,
          name: `${original.name}_copy`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.scenarios.push(duplicate);
      }
    },

    // Step CRUD operations
    addStep: (state, action: PayloadAction<{ scenarioId: string; step: Step }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.steps.push(action.payload.step);
        scenario.updatedAt = new Date().toISOString();
      }
    },

    updateStep: (
      state,
      action: PayloadAction<{ scenarioId: string; stepId: string; changes: Partial<Step> }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const stepIndex = scenario.steps.findIndex(s => s.id === action.payload.stepId);
        if (stepIndex !== -1) {
          scenario.steps[stepIndex] = {
            ...scenario.steps[stepIndex],
            ...action.payload.changes,
          } as Step;
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },

    deleteStep: (state, action: PayloadAction<{ scenarioId: string; stepId: string }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        // Remove the step
        scenario.steps = scenario.steps.filter(s => s.id !== action.payload.stepId);

        // Remove edges connected to this step
        scenario.edges = scenario.edges.filter(
          e =>
            e.sourceStepId !== action.payload.stepId &&
            e.targetStepId !== action.payload.stepId
        );

        // Update start step if it was deleted
        if (scenario.startStepId === action.payload.stepId) {
          scenario.startStepId = scenario.steps[0]?.id || '';
        }

        scenario.updatedAt = new Date().toISOString();
      }
    },

    reorderSteps: (
      state,
      action: PayloadAction<{ scenarioId: string; stepIds: string[] }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const stepMap = new Map(scenario.steps.map(step => [step.id, step]));
        scenario.steps = action.payload.stepIds
          .map(id => stepMap.get(id))
          .filter((step): step is Step => step !== undefined);
        scenario.updatedAt = new Date().toISOString();
      }
    },

    // Edge operations
    addEdge: (state, action: PayloadAction<{ scenarioId: string; edge: ScenarioEdge }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.edges.push(action.payload.edge);
        scenario.updatedAt = new Date().toISOString();
      }
    },

    updateEdge: (
      state,
      action: PayloadAction<{ scenarioId: string; edgeId: string; changes: Partial<ScenarioEdge> }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const edgeIndex = scenario.edges.findIndex(e => e.id === action.payload.edgeId);
        if (edgeIndex !== -1) {
          scenario.edges[edgeIndex] = {
            ...scenario.edges[edgeIndex],
            ...action.payload.changes,
          };
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },

    deleteEdge: (state, action: PayloadAction<{ scenarioId: string; edgeId: string }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.edges = scenario.edges.filter(e => e.id !== action.payload.edgeId);
        scenario.updatedAt = new Date().toISOString();
      }
    },

    // Parameter schema operations
    setParameterSchema: (
      state,
      action: PayloadAction<{ scenarioId: string; schema: ParameterSchema[] }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.parameterSchema = action.payload.schema;
        scenario.updatedAt = new Date().toISOString();
      }
    },

    addParameterSchema: (
      state,
      action: PayloadAction<{ scenarioId: string; schema: ParameterSchema }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.parameterSchema.push(action.payload.schema);
        scenario.updatedAt = new Date().toISOString();
      }
    },

    updateParameterSchema: (
      state,
      action: PayloadAction<{
        scenarioId: string;
        schemaId: string;
        changes: Partial<ParameterSchema>;
      }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const schemaIndex = scenario.parameterSchema.findIndex(
          s => s.id === action.payload.schemaId
        );
        if (schemaIndex !== -1) {
          scenario.parameterSchema[schemaIndex] = {
            ...scenario.parameterSchema[schemaIndex],
            ...action.payload.changes,
          };
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },

    deleteParameterSchema: (
      state,
      action: PayloadAction<{ scenarioId: string; schemaId: string }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.parameterSchema = scenario.parameterSchema.filter(
          s => s.id !== action.payload.schemaId
        );
        scenario.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  addScenario,
  updateScenario,
  deleteScenario,
  setCurrentScenario,
  duplicateScenario,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  addEdge,
  updateEdge,
  deleteEdge,
  setParameterSchema,
  addParameterSchema,
  updateParameterSchema,
  deleteParameterSchema,
} = scenariosSlice.actions;

export default scenariosSlice.reducer;
