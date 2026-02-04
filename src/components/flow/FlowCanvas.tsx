/**
 * FlowCanvas - Main React Flow canvas component
 * Converts scenario steps to ReactFlow nodes and edges
 * Handles node selection and flow interactions
 */

import { useCallback, useMemo } from 'react';
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
 * Convert scenario steps to ReactFlow nodes
 */
function convertStepsToNodes(
  steps: Step[],
  stepResults?: Record<string, StepExecutionResult>
): Node[] {
  return steps.map(step => {
    const result = stepResults?.[step.id];

    return {
      id: step.id,
      type: step.type,
      position: step.position,
      data: {
        step,
        status: result?.status,
        currentIteration: result?.currentIteration,
        totalIterations: result?.iterations,
      },
    };
  });
}

/**
 * Convert scenario edges to ReactFlow edges
 */
function convertScenarioEdges(scenario: Scenario): Edge[] {
  return scenario.edges.map(edge => ({
    id: edge.id,
    source: edge.sourceStepId,
    target: edge.targetStepId,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    animated: edge.animated ?? false,
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
    () => convertStepsToNodes(scenario.steps, stepResults),
    [scenario.steps, stepResults]
  );

  const initialEdges = useMemo(
    () => convertScenarioEdges(scenario),
    [scenario]
  );

  // Local state for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when steps or results change
  useMemo(() => {
    setNodes(convertStepsToNodes(scenario.steps, stepResults));
  }, [scenario.steps, stepResults, setNodes]);

  // Update edges when scenario edges change
  useMemo(() => {
    setEdges(convertScenarioEdges(scenario));
  }, [scenario, setEdges]);

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
        deleteKeyCode={readonly ? null : 'Delete'}
        multiSelectionKeyCode={readonly ? null : 'Control'}
        panOnDrag={!readonly}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
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
