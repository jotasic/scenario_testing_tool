/**
 * Scenario definition types
 * A scenario is a complete test flow with steps and parameters
 */

import { Step } from './step';
import { ParameterSchema } from './parameter';

/**
 * Edge connecting two steps in the scenario flow
 * Used by React Flow for visualization
 */
export interface ScenarioEdge {
  /** Unique identifier for this edge */
  id: string;
  /** ID of the source step */
  sourceStepId: string;
  /** ID of the target step */
  targetStepId: string;
  /** Optional handle identifier on the source step (e.g., "success", "error") */
  sourceHandle?: string;
  /** Display label for the edge */
  label?: string;
  /** Whether the edge should be animated in the UI */
  animated?: boolean;
}

/**
 * Complete scenario definition
 * Contains all steps, parameters, and configuration for a test scenario
 */
export interface Scenario {
  /** Unique identifier for this scenario */
  id: string;
  /** Display name for the scenario */
  name: string;
  /** Optional description of what this scenario tests */
  description?: string;
  /** Semantic version number (e.g., "1.0.0") */
  version: string;

  // References
  /** IDs of servers used by steps in this scenario */
  serverIds: string[];

  // Parameter definition
  /** Schema defining the structure and validation of input parameters */
  parameterSchema: ParameterSchema[];

  // Steps and flow
  /** All steps in this scenario */
  steps: Step[];
  /** Visual connections between steps */
  edges: ScenarioEdge[];
  /** ID of the step where execution begins */
  startStepId: string;

  // Metadata
  /** Optional tags for categorizing and filtering scenarios */
  tags?: string[];
  /** ISO timestamp when scenario was created */
  createdAt: string;
  /** ISO timestamp when scenario was last updated */
  updatedAt: string;
  /** Optional identifier of the user who created this scenario */
  createdBy?: string;
}
