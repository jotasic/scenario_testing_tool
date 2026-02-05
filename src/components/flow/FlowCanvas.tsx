/**
 * FlowCanvas - Main React Flow canvas component
 * Converts scenario steps to ReactFlow nodes and edges
 * Handles node selection and flow interactions
 */

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';
import type { Scenario, Step, StepExecutionResult } from '@/types';
import { nodeTypes } from './nodes';

interface FlowCanvasProps {
  scenario: Scenario;
  stepResults?: Record<string, StepExecutionResult>;
  selectedStepId?: string | null;
  onNodeClick?: (stepId: string) => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  readonly?: boolean;
  showMinimap?: boolean;
  showGrid?: boolean;
}

/**
 * Recursively collect all step IDs that are inside containers (Loop/Group)
 * This includes nested containers to any depth
 * Also collects branch target steps from Condition/Request steps inside containers
 */
function collectStepIdsInContainers(steps: Step[]): Set<string> {
  const stepsInsideContainers = new Set<string>();

  // Helper function to recursively collect step IDs
  const collectFromContainer = (stepIds: string[]) => {
    stepIds.forEach(id => {
      // Skip if already processed to avoid infinite loops
      if (stepsInsideContainers.has(id)) return;

      // Add this step ID
      stepsInsideContainers.add(id);

      // Find the actual step
      const childStep = steps.find(s => s.id === id);
      if (!childStep) return;

      // If this step is also a container, recursively collect its children
      if (childStep.type === 'loop' || childStep.type === 'group') {
        if (childStep.stepIds && childStep.stepIds.length > 0) {
          collectFromContainer(childStep.stepIds);
        }
      }

      // If this step is a Condition or Request with branches, collect branch target steps
      if (childStep.type === 'condition' || (childStep.type === 'request' && childStep.branches)) {
        const branches = childStep.branches || [];
        branches.forEach(branch => {
          if (branch.nextStepId) {
            // Recursively collect this branch target and its descendants
            collectFromContainer([branch.nextStepId]);
          }
        });
      }
    });
  };

  // Start collection from all top-level containers
  steps.forEach(step => {
    if ((step.type === 'loop' || step.type === 'group') && step.stepIds && step.stepIds.length > 0) {
      collectFromContainer(step.stepIds);
    }
  });

  return stepsInsideContainers;
}

/**
 * Convert scenario steps to ReactFlow nodes
 * Filters out steps that are inside Loop/Group containers to prevent duplicate display
 */
function convertStepsToNodes(
  steps: Step[],
  stepResults?: Record<string, StepExecutionResult>,
  startStepId?: string,
  readonly: boolean = false
): Node[] {
  // Get all step IDs that are inside Loop or Group containers (recursively)
  const stepsInsideContainers = collectStepIdsInContainers(steps);

  // Only create nodes for steps that are NOT inside containers
  return steps
    .filter(step => !stepsInsideContainers.has(step.id))
    .map(step => {
      const result = stepResults?.[step.id];

      return {
        id: step.id,
        type: step.type,
        position: step.position,
        // Allow deletion via keyboard or UI buttons
        deletable: !readonly,
        selectable: true,
        draggable: !readonly,
        data: {
          step,
          status: result?.status,
          currentIteration: result?.currentIteration,
          totalIterations: result?.iterations,
          isStartStep: step.id === startStepId,
          // Pass all steps for Group and Loop nodes to resolve child steps
          allSteps: (step.type === 'group' || step.type === 'loop') ? steps : undefined,
        },
      };
    });
}

/**
 * Convert scenario edges to ReactFlow edges
 */
function convertScenarioEdges(scenario: Scenario, readonly: boolean = false): Edge[] {
  return scenario.edges.map(edge => ({
    id: edge.id,
    source: edge.sourceStepId,
    target: edge.targetStepId,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    animated: edge.animated ?? false,
    selectable: !readonly,
    deletable: !readonly,
    focusable: !readonly,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    style: {
      strokeWidth: 2,
    },
  }));
}

function FlowCanvasInner({
  scenario,
  stepResults,
  selectedStepId,
  onNodeClick,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
  onConnect: externalConnect,
  readonly = false,
  showMinimap = true,
  showGrid = true,
}: FlowCanvasProps) {
  const { fitView } = useReactFlow();

  // Convert scenario data to React Flow format
  const initialNodes = useMemo(
    () => convertStepsToNodes(scenario.steps, stepResults, scenario.startStepId, readonly),
    [scenario.steps, stepResults, scenario.startStepId, readonly]
  );

  const initialEdges = useMemo(
    () => convertScenarioEdges(scenario, readonly),
    [scenario, readonly]
  );

  // Local state for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when steps or results change
  // Using useEffect instead of useMemo for side effects
  useEffect(() => {
    setNodes(convertStepsToNodes(scenario.steps, stepResults, scenario.startStepId, readonly));
  }, [scenario.steps, stepResults, scenario.startStepId, setNodes, readonly]);

  // Update edges when scenario edges change
  useEffect(() => {
    setEdges(convertScenarioEdges(scenario, readonly));
  }, [scenario.edges, setEdges, readonly]);

  // Handle node changes (position, selection, etc.)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (externalNodesChange) {
        externalNodesChange(changes);
      }
    },
    [onNodesChange, externalNodesChange]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (externalEdgesChange) {
        externalEdgesChange(changes);
      }
    },
    [onEdgesChange, externalEdgesChange]
  );

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (externalConnect) {
        externalConnect(connection);
      }
    },
    [externalConnect]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Update node selection state
  const nodesWithSelection = useMemo(
    () =>
      nodes.map(node => ({
        ...node,
        selected: node.id === selectedStepId,
      })),
    [nodes, selectedStepId]
  );

  // Handle initialization - fit view after the flow is ready
  const handleInit = useCallback(() => {
    // Use a small timeout to ensure the container has rendered
    setTimeout(() => {
      fitView({
        padding: 0.2,
        includeHiddenNodes: false,
        minZoom: 0.1,
        maxZoom: 1.5,
      });
    }, 50);
  }, [fitView]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'background.default',
        '& .react-flow__node': {
          cursor: readonly ? 'default' : 'pointer',
        },
        '& .react-flow__edge': {
          cursor: readonly ? 'default' : 'pointer',
        },
        '& .react-flow__edge.selected .react-flow__edge-path': {
          stroke: '#1976d2',
          strokeWidth: 3,
        },
        '& .react-flow__edge:hover .react-flow__edge-path': {
          stroke: '#42a5f5',
          strokeWidth: 2.5,
        },
        // Running step glow effect
        '@keyframes pulse-glow': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 5px #2196F3)',
          },
          '50%': {
            filter: 'drop-shadow(0 0 20px #2196F3) drop-shadow(0 0 30px #2196F3)',
          },
        },
      }}
    >
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={readonly ? undefined : handleNodesChange}
        onEdgesChange={readonly ? undefined : handleEdgesChange}
        onConnect={readonly ? undefined : handleConnect}
        onNodeClick={handleNodeClick}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        deleteKeyCode={readonly ? null : ['Delete', 'Backspace']}
        multiSelectionKeyCode={readonly ? null : 'Control'}
        panOnDrag={true}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        edgesFocusable={!readonly}
        selectNodesOnDrag={false}
      >
        <Background
          color="#aaa"
          gap={16}
          size={1}
          style={{ display: showGrid ? 'block' : 'none' }}
        />
        <Controls showInteractive={!readonly} />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const nodeData = node.data as { status?: string };
              const status = nodeData?.status;

              if (status === 'running') return '#2196F3';
              if (status === 'success') return '#4CAF50';
              if (status === 'failed') return '#F44336';
              if (status === 'waiting') return '#FF9800';
              if (status === 'skipped') return '#9E9E9E';

              return '#E0E0E0';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          />
        )}
      </ReactFlow>
    </Box>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
