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
import { Box, Button, Tooltip } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { Scenario, Step, StepExecutionResult } from '@/types';
import { tfxNodeTypes } from './nodes';
import { getLayoutedElements } from '@/utils/layoutUtils';
import TFXEdge from './edges/TFXEdge';

interface FlowCanvasProps {
  scenario: Scenario;
  stepResults?: Record<string, StepExecutionResult>;
  selectedStepId?: string | null;
  onNodeClick?: (stepId: string) => void;
  onNodeDoubleClick?: (stepId: string, stepType: string) => void;
  onEdgeClick?: () => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onAutoLayout?: (positions: Record<string, { x: number; y: number }>) => void;
  /** Called when a node is dropped onto a container (Loop/Group) */
  onDropOnContainer?: (stepId: string, containerId: string) => void;
  readonly?: boolean;
  showMinimap?: boolean;
  showGrid?: boolean;
  /** Steps to display (filtered by navigation level) */
  filteredSteps?: Step[];
  /** Edges to display (filtered by navigation level) */
  filteredEdges?: { id: string; sourceStepId: string; targetStepId: string; sourceHandle?: string; label?: string; animated?: boolean }[];
  /** Step ID that is currently cut (for visual feedback) */
  cutStepId?: string | null;
}

/**
 * Check if a step can be dropped into a container
 * - Cannot drop container into itself
 * - Cannot drop container into its own children (recursive)
 */
function canDropIntoContainer(
  draggedStepId: string,
  targetContainerId: string,
  allSteps: Step[]
): boolean {
  // Cannot drop into itself
  if (draggedStepId === targetContainerId) {
    return false;
  }

  // Check if target is a descendant of dragged step
  const isDescendant = (containerId: string, potentialChild: string): boolean => {
    const container = allSteps.find(s => s.id === containerId);
    if (!container || (container.type !== 'loop' && container.type !== 'group')) {
      return false;
    }

    const childIds = container.stepIds || [];
    if (childIds.includes(potentialChild)) {
      return true;
    }

    // Recursively check children
    return childIds.some(childId => isDescendant(childId, potentialChild));
  };

  return !isDescendant(draggedStepId, targetContainerId);
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
  filteredSteps?: Step[],
  cutStepId?: string | null,
  draggingNodeId?: string | null,
  dragOverContainerId?: string | null,
  allSteps?: Step[]
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

    // Drag state
    const isDragging = step.id === draggingNodeId;
    const isDragTarget = step.id === dragOverContainerId;
    const isContainer = step.type === 'loop' || step.type === 'group';
    const isDropDisabled = draggingNodeId && isContainer && !canDropIntoContainer(draggingNodeId, step.id, allSteps || steps);

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
        isCut: step.id === cutStepId,
        // Drag states
        isDragging,
        isDragTarget,
        isDropDisabled,
        // Pass all steps for Group and Loop nodes to resolve child steps
        allSteps: (step.type === 'group' || step.type === 'loop') ? steps : undefined,
      },
    };
  });
}

/**
 * Convert scenario edges to ReactFlow edges (TFX style)
 * If filteredEdges is provided, uses that list instead
 */
function convertScenarioEdges(
  scenario: Scenario,
  readonly: boolean = false,
  filteredEdges?: { id: string; sourceStepId: string; targetStepId: string; sourceHandle?: string; label?: string; animated?: boolean }[]
): Edge[] {
  const edgesToDisplay = filteredEdges || scenario.edges;

  return edgesToDisplay.map(edge => ({
    id: edge.id,
    source: edge.sourceStepId,
    target: edge.targetStepId,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    labelShowBg: true,
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 3,
    labelStyle: { fontSize: 10, fontWeight: 600 },
    animated: edge.animated ?? false,
    selectable: !readonly,
    deletable: !readonly,
    focusable: !readonly,
    type: 'tfx',
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
  onEdgeClick: externalEdgeClick,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
  onConnect: externalConnect,
  onAutoLayout: externalAutoLayout,
  onDropOnContainer,
  readonly = false,
  showMinimap = true,
  showGrid = true,
  filteredSteps,
  filteredEdges,
  cutStepId,
}: FlowCanvasProps) {
  const { fitView } = useReactFlow();

  // Drag state management
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);

  // Edge types (TFX only)
  const edgeTypes = useMemo(
    () => ({
      tfx: TFXEdge,
    }),
    []
  );

  // Local state for nodes and edges - initialize with empty arrays
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when steps or results change
  useEffect(() => {
    setNodes(convertStepsToNodes(
      scenario.steps,
      stepResults,
      scenario.startStepId,
      readonly,
      filteredSteps,
      cutStepId,
      null, // Don't include drag state in initial render
      null,
      scenario.steps
    ));
  }, [scenario.steps, stepResults, scenario.startStepId, setNodes, readonly, filteredSteps, cutStepId]);

  // Update drag state in existing nodes without resetting positions
  useEffect(() => {
    if (draggingNodeId === null && dragOverContainerId === null) return;

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const step = scenario.steps.find((s) => s.id === node.id);
        if (!step) return node;

        const isDragging = node.id === draggingNodeId;
        const isDragTarget = node.id === dragOverContainerId;
        const isContainer = step.type === 'loop' || step.type === 'group';
        const isDropDisabled = draggingNodeId && isContainer && !canDropIntoContainer(draggingNodeId, node.id, scenario.steps);

        return {
          ...node,
          data: {
            ...node.data,
            isDragging,
            isDragTarget,
            isDropDisabled,
          },
        };
      })
    );
  }, [draggingNodeId, dragOverContainerId, scenario.steps, setNodes]);

  // Update edges when scenario edges change
  useEffect(() => {
    setEdges(convertScenarioEdges(scenario, readonly, filteredEdges));
  }, [scenario, setEdges, readonly, filteredEdges]);

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

  // Handle node drag start
  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readonly) return;
      setDraggingNodeId(node.id);
      setDragOverContainerId(null);
    },
    [readonly]
  );

  // Handle node drag - update drop target
  const handleNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!onDropOnContainer || readonly) return;

      // Find container nodes (Loop/Group)
      const containerNodes = nodes.filter(n =>
        n.type === 'loop' || n.type === 'group'
      );

      // Check if the dragged node is over a container
      const nodeWidth = 180; // TFX node width
      const nodeHeight = 100; // Approximate TFX node height

      let foundContainer: string | null = null;

      for (const containerNode of containerNodes) {
        // Can't drop on itself
        if (containerNode.id === node.id) continue;

        // Skip if drop is disabled (would create circular dependency)
        if (!canDropIntoContainer(node.id, containerNode.id, scenario.steps)) {
          continue;
        }

        // Check if node center is within container bounds
        const nodeCenterX = node.position.x + nodeWidth / 2;
        const nodeCenterY = node.position.y + nodeHeight / 2;

        const isOverContainer =
          nodeCenterX >= containerNode.position.x &&
          nodeCenterX <= containerNode.position.x + nodeWidth &&
          nodeCenterY >= containerNode.position.y &&
          nodeCenterY <= containerNode.position.y + nodeHeight;

        if (isOverContainer) {
          foundContainer = containerNode.id;
          break;
        }
      }

      setDragOverContainerId(foundContainer);
    },
    [nodes, onDropOnContainer, readonly, scenario.steps]
  );

  // Handle node drag stop - check if dropped on a container
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!onDropOnContainer || readonly) {
        setDraggingNodeId(null);
        setDragOverContainerId(null);
        return;
      }

      // Find container nodes (Loop/Group)
      const containerNodes = nodes.filter(n =>
        n.type === 'loop' || n.type === 'group'
      );

      // Check if the dragged node is dropped on a container
      const nodeWidth = 180; // TFX node width
      const nodeHeight = 100; // Approximate TFX node height

      for (const containerNode of containerNodes) {
        // Can't drop on itself
        if (containerNode.id === node.id) continue;

        // Skip if drop is disabled (would create circular dependency)
        if (!canDropIntoContainer(node.id, containerNode.id, scenario.steps)) {
          continue;
        }

        // Check if node center is within container bounds
        const nodeCenterX = node.position.x + nodeWidth / 2;
        const nodeCenterY = node.position.y + nodeHeight / 2;

        const isOverContainer =
          nodeCenterX >= containerNode.position.x &&
          nodeCenterX <= containerNode.position.x + nodeWidth &&
          nodeCenterY >= containerNode.position.y &&
          nodeCenterY <= containerNode.position.y + nodeHeight;

        if (isOverContainer) {
          onDropOnContainer(node.id, containerNode.id);
          break;
        }
      }

      // Clear drag state
      setDraggingNodeId(null);
      setDragOverContainerId(null);
    },
    [nodes, onDropOnContainer, readonly, scenario.steps]
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

  // Handle edge click - deselect all nodes to prevent accidental deletion
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, _edge: Edge) => {
      // Notify parent to clear selectedStepId
      if (externalEdgeClick) {
        externalEdgeClick();
      }
    },
    [externalEdgeClick]
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

  // Handle auto-layout (TFX dimensions)
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      {
        direction: 'LR',
        nodeWidth: 180,
        nodeHeight: 80,
        nodeSpacing: 50,
        rankSpacing: 100,
      }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Extract positions and notify parent
    if (externalAutoLayout) {
      const positions: Record<string, { x: number; y: number }> = {};
      layoutedNodes.forEach(node => {
        positions[node.id] = node.position;
      });
      externalAutoLayout(positions);
    }

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, edges, setNodes, setEdges, fitView, externalAutoLayout]);

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
        }}
      >
        {/* Auto Layout Button */}
        <Tooltip title="Auto Layout">
          <Button
            variant="outlined"
            size="small"
            onClick={handleAutoLayout}
            startIcon={<AutoFixHighIcon />}
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
        onNodeDragStart={readonly ? undefined : handleNodeDragStart}
        onNodeDrag={readonly ? undefined : handleNodeDrag}
        onNodeDragStop={readonly ? undefined : handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onInit={handleInit}
        nodeTypes={tfxNodeTypes}
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
