/**
 * FlowExample - Complete example of using flow components
 * This file demonstrates how to integrate FlowCanvas with Redux
 * and handle node/edge changes
 */

import { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { ReactFlowProvider } from 'reactflow';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedStep, setShowGrid } from '@/store/uiSlice';
import { updateStep, addEdge, deleteEdge } from '@/store/scenariosSlice';
import FlowCanvas from './FlowCanvas';
import FlowControls from './FlowControls';

interface FlowExampleProps {
  /** If true, disables all editing (for execution view) */
  readonly?: boolean;
}

/**
 * Example component showing complete integration with Redux store
 */
export default function FlowExample({ readonly = false }: FlowExampleProps) {
  const dispatch = useAppDispatch();

  // Get current scenario from Redux
  const currentScenarioId = useAppSelector(
    state => state.scenarios.currentScenarioId
  );
  const scenario = useAppSelector(state =>
    state.scenarios.scenarios.find(s => s.id === currentScenarioId)
  );

  // Get execution context for status visualization
  const executionContext = useAppSelector(state => state.execution.context);

  // Get UI state
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);
  const showGrid = useAppSelector(state => state.ui.showGrid);

  // Local state for minimap
  const [showMinimap, setShowMinimap] = useState(true);

  /**
   * Handle node click - update selected step in Redux
   */
  const handleNodeClick = useCallback(
    (stepId: string) => {
      dispatch(setSelectedStep(stepId));
    },
    [dispatch]
  );

  /**
   * Handle node position changes - update step positions in Redux
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!currentScenarioId || readonly) return;

      changes.forEach(change => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Only update position when drag is complete
          dispatch(
            updateStep({
              scenarioId: currentScenarioId,
              stepId: change.id,
              changes: { position: change.position },
            })
          );
        }
      });
    },
    [dispatch, currentScenarioId, readonly]
  );

  /**
   * Handle edge changes - update edges in Redux
   */
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!currentScenarioId || readonly) return;

      changes.forEach(change => {
        if (change.type === 'remove') {
          // User deleted an edge
          dispatch(
            deleteEdge({
              scenarioId: currentScenarioId,
              edgeId: change.id,
            })
          );
        }
      });
    },
    [dispatch, currentScenarioId, readonly]
  );

  /**
   * Handle new connections - add edges to Redux
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!currentScenarioId || readonly) return;
      if (!connection.source || !connection.target) return;

      // Create new edge
      const newEdge = {
        id: `edge_${Date.now()}`,
        sourceStepId: connection.source,
        targetStepId: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
      };

      dispatch(
        addEdge({
          scenarioId: currentScenarioId,
          edge: newEdge,
        })
      );
    },
    [dispatch, currentScenarioId, readonly]
  );

  /**
   * Toggle grid visibility
   */
  const handleToggleGrid = useCallback(() => {
    dispatch(setShowGrid(!showGrid));
  }, [dispatch, showGrid]);

  /**
   * Toggle minimap visibility
   */
  const handleToggleMinimap = useCallback(() => {
    setShowMinimap(prev => !prev);
  }, []);

  if (!scenario) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        No scenario selected
      </Box>
    );
  }

  return (
    <ReactFlowProvider>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <FlowCanvas
          scenario={scenario}
          stepResults={executionContext?.stepResults}
          selectedStepId={selectedStepId}
          onNodeClick={handleNodeClick}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          readonly={readonly}
          showMinimap={showMinimap}
          showGrid={showGrid}
        />

        <FlowControls
          showGrid={showGrid}
          showMinimap={showMinimap}
          onToggleGrid={handleToggleGrid}
          onToggleMinimap={handleToggleMinimap}
        />
      </Box>
    </ReactFlowProvider>
  );
}
