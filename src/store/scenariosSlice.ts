/**
 * Scenarios Slice
 * Manages scenario definitions, steps, edges, and parameter schemas
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import type { Scenario, Step, ScenarioEdge, ParameterSchema } from '@/types';
import sampleScenario from '@/data/sampleScenario';
import { applyAutoLayout } from '@/utils/graphLayout';

// Undo history limit - can be adjusted for performance
const UNDO_LIMIT = 50;

interface ScenariosState {
  scenarios: Scenario[];
  currentScenarioId: string | null;
}

const initialState: ScenariosState = {
  scenarios: [sampleScenario],
  currentScenarioId: sampleScenario.id,
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
        // Deep clone step to prevent shared references
        const clonedStep = structuredClone(action.payload.step);
        scenario.steps.push(clonedStep);
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
          // Deep clone changes to prevent shared references between steps
          const clonedChanges = structuredClone(action.payload.changes);
          scenario.steps[stepIndex] = {
            ...scenario.steps[stepIndex],
            ...clonedChanges,
          } as Step;
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },

    deleteStep: (state, action: PayloadAction<{ scenarioId: string; stepId: string }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const stepIdToDelete = action.payload.stepId;

        // Remove the step
        scenario.steps = scenario.steps.filter(s => s.id !== stepIdToDelete);

        // Remove edges connected to this step
        scenario.edges = scenario.edges.filter(
          e =>
            e.sourceStepId !== stepIdToDelete &&
            e.targetStepId !== stepIdToDelete
        );

        // Clear references from other steps for bidirectional sync
        scenario.steps.forEach(step => {
          // Clear branch nextStepId references
          if ((step.type === 'condition' || step.type === 'request') && step.branches) {
            step.branches.forEach(branch => {
              if (branch.nextStepId === stepIdToDelete) {
                branch.nextStepId = '';
              }
            });
          }

          // Remove from loop/group stepIds
          if ((step.type === 'loop' || step.type === 'group') && step.stepIds) {
            step.stepIds = step.stepIds.filter(id => id !== stepIdToDelete);
          }
        });

        // Update start step if it was deleted
        if (scenario.startStepId === stepIdToDelete) {
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

    autoLayoutSteps: (
      state,
      action: PayloadAction<{ scenarioId: string; direction?: 'TB' | 'LR' }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        scenario.steps = applyAutoLayout(scenario.steps, scenario.edges, {
          direction: action.payload.direction || 'TB',
        });
        scenario.updatedAt = new Date().toISOString();
      }
    },

    // Edge operations
    addEdge: (state, action: PayloadAction<{ scenarioId: string; edge: ScenarioEdge }>) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const edge = action.payload.edge;
        scenario.edges.push(edge);

        // Sync edge to step properties for bidirectional sync
        const sourceStep = scenario.steps.find(s => s.id === edge.sourceStepId);
        if (sourceStep) {
          const handle = edge.sourceHandle;

          // Branch connections for ConditionStep (handle is branch.id like 'branch_1234567890')
          if (handle?.startsWith('branch_') && sourceStep.type === 'condition') {
            // Find branch by matching the branch.id (handle ID)
            const branch = sourceStep.branches?.find(b => b.id === handle);
            if (branch) {
              branch.nextStepId = edge.targetStepId;
            }
          }
          // Branch connections for RequestStep with branches
          else if (handle?.startsWith('branch_') && sourceStep.type === 'request' && sourceStep.branches) {
            const branch = sourceStep.branches.find(b => b.id === handle);
            if (branch) {
              branch.nextStepId = edge.targetStepId;
            }
          }
          // Loop body connections
          else if (handle === 'loop-body' && sourceStep.type === 'loop') {
            if (!sourceStep.stepIds.includes(edge.targetStepId)) {
              sourceStep.stepIds.push(edge.targetStepId);
            }
          }
          // Group step connections
          else if (handle === 'group-body' && sourceStep.type === 'group') {
            if (!sourceStep.stepIds.includes(edge.targetStepId)) {
              sourceStep.stepIds.push(edge.targetStepId);
            }
          }
        }

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
        // Find the edge before deleting to sync step properties
        const edge = scenario.edges.find(e => e.id === action.payload.edgeId);

        if (edge) {
          const sourceStep = scenario.steps.find(s => s.id === edge.sourceStepId);
          if (sourceStep) {
            const handle = edge.sourceHandle;

            // Clear branch nextStepId for ConditionStep
            if (handle?.startsWith('branch_') && sourceStep.type === 'condition') {
              const branch = sourceStep.branches?.find(b => b.id === handle);
              if (branch) {
                branch.nextStepId = '';
              }
            }
            // Clear branch nextStepId for RequestStep
            else if (handle?.startsWith('branch_') && sourceStep.type === 'request' && sourceStep.branches) {
              const branch = sourceStep.branches.find(b => b.id === handle);
              if (branch) {
                branch.nextStepId = '';
              }
            }
            // Remove from loop stepIds
            else if (handle === 'loop-body' && sourceStep.type === 'loop') {
              sourceStep.stepIds = sourceStep.stepIds.filter(id => id !== edge.targetStepId);
            }
            // Remove from group stepIds
            else if (handle === 'group-body' && sourceStep.type === 'group') {
              sourceStep.stepIds = sourceStep.stepIds.filter(id => id !== edge.targetStepId);
            }
          }
        }

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

    // Container operations (Loop/Group)
    addStepToContainer: (
      state,
      action: PayloadAction<{ scenarioId: string; containerId: string; stepId: string }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const container = scenario.steps.find(s => s.id === action.payload.containerId);
        if (container && (container.type === 'loop' || container.type === 'group')) {
          if (!container.stepIds.includes(action.payload.stepId)) {
            container.stepIds.push(action.payload.stepId);
            scenario.updatedAt = new Date().toISOString();
          }
        }
      }
    },

    removeStepFromContainer: (
      state,
      action: PayloadAction<{ scenarioId: string; containerId: string; stepId: string }>
    ) => {
      const scenario = state.scenarios.find(s => s.id === action.payload.scenarioId);
      if (scenario) {
        const container = scenario.steps.find(s => s.id === action.payload.containerId);
        if (container && (container.type === 'loop' || container.type === 'group')) {
          container.stepIds = container.stepIds.filter(id => id !== action.payload.stepId);
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },

    // Bulk operations
    loadScenarios: (state, action: PayloadAction<Scenario[]>) => {
      // Replace all scenarios with loaded ones
      state.scenarios = action.payload;
      // If current scenario no longer exists, clear selection
      if (state.currentScenarioId && !action.payload.find(s => s.id === state.currentScenarioId)) {
        state.currentScenarioId = null;
      }
    },

    clearScenarios: (state) => {
      state.scenarios = [];
      state.currentScenarioId = null;
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
  autoLayoutSteps,
  addEdge,
  updateEdge,
  deleteEdge,
  addStepToContainer,
  removeStepFromContainer,
  setParameterSchema,
  addParameterSchema,
  updateParameterSchema,
  deleteParameterSchema,
  loadScenarios,
  clearScenarios,
} = scenariosSlice.actions;

// Wrap the reducer with undoable
export default undoable(scenariosSlice.reducer, {
  limit: UNDO_LIMIT,
  filter: (action) => {
    // Actions that should be undoable
    const undoableActions = [
      'scenarios/addScenario',
      'scenarios/updateScenario',
      'scenarios/deleteScenario',
      'scenarios/duplicateScenario',
      'scenarios/addStep',
      'scenarios/updateStep',
      'scenarios/deleteStep',
      'scenarios/reorderSteps',
      'scenarios/autoLayoutSteps',
      'scenarios/addEdge',
      'scenarios/updateEdge',
      'scenarios/deleteEdge',
      'scenarios/addStepToContainer',
      'scenarios/removeStepFromContainer',
      'scenarios/setParameterSchema',
      'scenarios/addParameterSchema',
      'scenarios/updateParameterSchema',
      'scenarios/deleteParameterSchema',
    ];
    return undoableActions.includes(action.type);
  },
});
