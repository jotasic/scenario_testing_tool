/**
 * FlowCanvas - Main React Flow canvas component
 * Converts scenario steps to ReactFlow nodes and edges
 * Handles node selection and flow interactions
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
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
import { Box, Button, ButtonGroup, Tooltip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { Scenario, Step, StepExecutionResult } from '@/types';
import { nodeTypes, tfxNodeTypes } from './nodes';
import { getLayoutedElements } from '@/utils/layoutUtils';
import TFXEdge from './edges/TFXEdge';

interface FlowCanvasProps {
  scenario: Scenario;
  stepResults?: Record<string, StepExecutionResult>;
  selectedStepId?: string | null;
  onNodeClick?: (stepId: string) => void;
  onNodeDoubleClick?: (stepId: string, stepType: string) => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  readonly?: boolean;
  showMinimap?: boolean;
  showGrid?: boolean;
  tfxMode?: boolean;
  onTFXModeChange?: (enabled: boolean) => void;
  /** Steps to display (filtered by navigation level) */
  filteredSteps?: Step[];
  /** Edges to display (filtered by navigation level) */
  filteredEdges?: { id: string; sourceStepId: string; targetStepId: string; sourceHandle?: string; label?: string; animated?: boolean }[];
}

/**
 * Recursively collect all step IDs that are inside containers (Loop/Group)
 * This includes nested containers to any depth
 * NOTE: Branch targets from Condition/Request steps are NOT collected as container children
 * because they may point outside the container
 */
function collectStepIdsInContainers(steps: Step[]): Set<string> {
  const stepsInsideContainers = new Set<string>();

  // Helper function to recursively collect step IDs
  const collectFromContainer = (stepIds: string[]) => {
    stepIds.forEach(id => {
      // Skip if already processed to avoid infinite loops
      if (stepsInsideContainers.has(id)) return;

      // Find the actual step first to verify it exists
      const childStep = steps.find(s => s.id === id);
      if (!childStep) return; // Skip non-existent steps

      // Add this step ID only after verifying it exists
      stepsInsideContainers.add(id);

      // If this step is also a container, recursively collect its children
      if (childStep.type === 'loop' || childStep.type === 'group') {
        if (childStep.stepIds && childStep.stepIds.length > 0) {
          collectFromContainer(childStep.stepIds);
        }
      }

      // DO NOT collect branch targets from Condition/Request steps
      // Branch targets may point outside the container and should be rendered separately
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
 * If filteredSteps is provided, uses that list instead of filtering
 */
function convertStepsToNodes(
  steps: Step[],
  stepResults?: Record<string, StepExecutionResult>,
  startStepId?: string,
  readonly: boolean = false,
  filteredSteps?: Step[]
): Node[] {
  // Use provided filtered steps or auto-filter
  const stepsToDisplay = filteredSteps || (() => {
    // Get all step IDs that are inside Loop or Group containers (recursively)
    const stepsInsideContainers = collectStepIdsInContainers(steps);
    // Only create nodes for steps that are NOT inside containers
    return steps.filter(step => !stepsInsideContainers.has(step.id));
  })();

  return stepsToDisplay.map(step => {
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
 * If filteredEdges is provided, uses that list instead
 */
function convertScenarioEdges(
  scenario: Scenario,
  readonly: boolean = false,
  tfxMode: boolean = false,
  filteredEdges?: { id: string; sourceStepId: string; targetStepId: string; sourceHandle?: string; label?: string; animated?: boolean }[]
): Edge[] {
  const edgesToDisplay = filteredEdges || scenario.edges;

  return edgesToDisplay.map(edge => ({
    id: edge.id,
    source: edge.sourceStepId,
    target: edge.targetStepId,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    labelShowBg: tfxMode ? true : undefined,
    labelBgPadding: tfxMode ? [4, 2] : undefined,
    labelBgBorderRadius: tfxMode ? 3 : undefined,
    labelStyle: tfxMode ? { fontSize: 10, fontWeight: 600 } : undefined,
    animated: edge.animated ?? false,
    selectable: !readonly,
    deletable: !readonly,
    focusable: !readonly,
    type: tfxMode ? 'tfx' : 'default',
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
  onNodeDoubleClick,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
  onConnect: externalConnect,
  readonly = false,
  showMinimap = true,
  showGrid = true,
  tfxMode: externalTFXMode,
  onTFXModeChange,
  filteredSteps,
  filteredEdges,
}: FlowCanvasProps) {
  const { fitView } = useReactFlow();

  // Internal TFX mode state if not controlled externally
  const [internalTFXMode, setInternalTFXMode] = useState(false);
  const tfxMode = externalTFXMode ?? internalTFXMode;

  // Edge types for TFX mode
  const edgeTypes = useMemo(
    () => ({
      tfx: TFXEdge,
    }),
    []
  );

  // Convert scenario data to React Flow format
  const initialNodes = useMemo(
    () => convertStepsToNodes(scenario.steps, stepResults, scenario.startStepId, readonly, filteredSteps),
    [scenario.steps, stepResults, scenario.startStepId, readonly, filteredSteps]
  );

  const initialEdges = useMemo(
    () => convertScenarioEdges(scenario, readonly, tfxMode, filteredEdges),
    [scenario, readonly, tfxMode, filteredEdges]
  );

  // Local state for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when steps or results change
  // Using useEffect instead of useMemo for side effects
  useEffect(() => {
    setNodes(convertStepsToNodes(scenario.steps, stepResults, scenario.startStepId, readonly, filteredSteps));
  }, [scenario.steps, stepResults, scenario.startStepId, setNodes, readonly, filteredSteps]);

  // Update edges when scenario edges change
  useEffect(() => {
    setEdges(convertScenarioEdges(scenario, readonly, tfxMode, filteredEdges));
  }, [scenario, setEdges, readonly, tfxMode, filteredEdges]);

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

  // Handle node double click (for container navigation)
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeDoubleClick && node.type) {
        onNodeDoubleClick(node.id, node.type);
      }
    },
    [onNodeDoubleClick]
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

  // Handle auto-layout
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      {
        direction: 'LR',
        nodeWidth: tfxMode ? 180 : 250,
        nodeHeight: tfxMode ? 80 : 120,
        nodeSpacing: 50,
        rankSpacing: 100,
      }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, edges, setNodes, setEdges, fitView, tfxMode]);

  // Handle TFX mode toggle
  const handleTFXModeToggle = useCallback((enabled: boolean) => {
    if (onTFXModeChange) {
      onTFXModeChange(enabled);
    } else {
      setInternalTFXMode(enabled);
    }
  }, [onTFXModeChange]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'background.default',
        position: 'relative',
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
      {/* Control Panel */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          gap: 1,
        }}
      >
        {/* View Mode Toggle */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Classic View">
            <Button
              variant={!tfxMode ? 'contained' : 'outlined'}
              onClick={() => handleTFXModeToggle(false)}
              sx={{ minWidth: 40 }}
            >
              <ViewStreamIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="TFX Pipeline View">
            <Button
              variant={tfxMode ? 'contained' : 'outlined'}
              onClick={() => handleTFXModeToggle(true)}
              sx={{ minWidth: 40 }}
            >
              <AccountTreeIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Auto Layout Button */}
        <Tooltip title="Auto Layout">
          <Button
            variant="outlined"
            size="small"
            onClick={handleAutoLayout}
            startIcon={<AutoFixHighIcon />}
            sx={{ minWidth: 40 }}
          >
            Auto Layout
          </Button>
        </Tooltip>
      </Box>

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={readonly ? undefined : handleNodesChange}
        onEdgesChange={readonly ? undefined : handleEdgesChange}
        onConnect={readonly ? undefined : handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onInit={handleInit}
        nodeTypes={tfxMode ? tfxNodeTypes : nodeTypes}
        edgeTypes={edgeTypes}
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
