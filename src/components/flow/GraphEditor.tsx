/**
 * GraphEditor - Wrapper combining NodeToolbar and FlowCanvas with editing logic
 * Handles node addition, deletion, edge creation, and node position updates
 */

import { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { useAppDispatch } from '@/store/hooks';
import { addStep, deleteStep, updateStep, addEdge, deleteEdge } from '@/store/scenariosSlice';
import type { Scenario, Step, StepType, StepExecutionResult } from '@/types';
import FlowCanvas from './FlowCanvas';
import NodeToolbar from './NodeToolbar';

interface GraphEditorProps {
  /** The scenario to display and edit */
  scenario: Scenario;
  /** Execution results for each step (for visualization) */
  stepResults?: Record<string, StepExecutionResult>;
  /** Currently selected step ID */
  selectedStepId?: string | null;
  /** Callback when a node is clicked */
  onNodeClick?: (stepId: string) => void;
  /** Whether the graph is in readonly mode */
  readonly?: boolean;
  /** Whether to show the minimap */
  showMinimap?: boolean;
  /** Whether to show the grid */
  showGrid?: boolean;
}

/**
 * Create a default step based on type
 */
function createDefaultStep(type: StepType, position: { x: number; y: number }): Step {
  const baseStep = {
    id: uuidv4(),
    type,
    name: `New ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    description: '',
    executionMode: 'auto' as const,
    position,
  };

  switch (type) {
    case 'request':
      return {
        ...baseStep,
        type: 'request',
        serverId: '',
        method: 'GET',
        endpoint: '/',
        headers: [],
        waitForResponse: true,
        saveResponse: true,
      };

    case 'condition':
      return {
        ...baseStep,
        type: 'condition',
        branches: [],
      };

    case 'loop':
      return {
        ...baseStep,
        type: 'loop',
        loop: {
          id: uuidv4(),
          type: 'count',
          count: 1,
        },
        stepIds: [],
      };

    case 'group':
      return {
        ...baseStep,
        type: 'group',
        stepIds: [],
        collapsed: false,
      };

    default:
      throw new Error(`Unknown step type: ${type}`);
  }
}

/**
 * Calculate center position for new nodes based on viewport
 * Falls back to a default position if viewport is not available
 */
function getNewNodePosition(existingSteps: Step[]): { x: number; y: number } {
  // If no existing steps, start at a default position
  if (existingSteps.length === 0) {
    return { x: 250, y: 100 };
  }

  // Find the rightmost and bottommost positions
  const maxX = Math.max(...existingSteps.map(s => s.position.x));
  const maxY = Math.max(...existingSteps.map(s => s.position.y));

  // Place new node offset from the last one
  return {
    x: maxX + 50,
    y: maxY + 50,
  };
}

export default function GraphEditor({
  scenario,
  stepResults,
  selectedStepId,
  onNodeClick,
  readonly = false,
  showMinimap = true,
  showGrid = true,
}: GraphEditorProps) {
  const dispatch = useAppDispatch();
  const [pendingNodeType, setPendingNodeType] = useState<StepType | null>(null);

  /**
   * Handle adding a new node
   */
  const handleAddNode = useCallback(
    (type: StepType) => {
      const position = getNewNodePosition(scenario.steps);
      const newStep = createDefaultStep(type, position);

      dispatch(addStep({ scenarioId: scenario.id, step: newStep }));
      setPendingNodeType(null);

      // Optionally select the newly created step
      if (onNodeClick) {
        onNodeClick(newStep.id);
      }
    },
    [scenario.id, scenario.steps, dispatch, onNodeClick]
  );

  /**
   * Handle node changes (position, selection, deletion)
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Update step position when dragging completes
          dispatch(
            updateStep({
              scenarioId: scenario.id,
              stepId: change.id,
              changes: { position: change.position },
            })
          );
        }

        if (change.type === 'remove') {
          // Delete step when removed (e.g., Delete key pressed)
          dispatch(deleteStep({ scenarioId: scenario.id, stepId: change.id }));
        }
      });
    },
    [dispatch, scenario.id]
  );

  /**
   * Handle edge changes (deletion)
   */
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'remove') {
          // Delete edge when removed
          dispatch(deleteEdge({ scenarioId: scenario.id, edgeId: change.id }));
        }
      });
    },
    [dispatch, scenario.id]
  );

  /**
   * Handle new edge connections
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      // Create a new edge
      const newEdge = {
        id: `edge_${uuidv4()}`,
        sourceStepId: connection.source,
        targetStepId: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        label: undefined,
        animated: false,
      };

      dispatch(addEdge({ scenarioId: scenario.id, edge: newEdge }));
    },
    [dispatch, scenario.id]
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Node Toolbar - only show in edit mode */}
      {!readonly && (
        <NodeToolbar onAddNode={handleAddNode} disabled={pendingNodeType !== null} />
      )}

      {/* Flow Canvas */}
      <FlowCanvas
        scenario={scenario}
        stepResults={stepResults}
        selectedStepId={selectedStepId}
        onNodeClick={onNodeClick}
        onNodesChange={readonly ? undefined : handleNodesChange}
        onEdgesChange={readonly ? undefined : handleEdgesChange}
        onConnect={readonly ? undefined : handleConnect}
        readonly={readonly}
        showMinimap={showMinimap}
        showGrid={showGrid}
      />
    </Box>
  );
}
