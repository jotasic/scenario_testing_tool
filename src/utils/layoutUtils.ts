/**
 * Layout utilities for React Flow using dagre
 * Provides automatic graph layout for TFX pipeline style
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSpacing?: number;
  rankSpacing?: number;
}

/**
 * Calculate automatic layout for nodes using dagre
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param options - Layout configuration options
 * @returns Nodes with updated positions
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'LR',
    nodeWidth = 180,
    nodeHeight = 80,
    nodeSpacing = 50,
    rankSpacing = 100,
  } = options;

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph layout
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    edgesep: 30,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Apply the calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      // dagre returns center coordinates, so we need to adjust
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * Calculate layout for a group of nodes within a container
 * Useful for Loop and Group nodes with child steps
 */
export function getContainerLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node[]; width: number; height: number } {
  const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, {
    direction,
    nodeWidth: 140,
    nodeHeight: 60,
    nodeSpacing: 30,
    rankSpacing: 70,
  });

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layoutedNodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + 140);
    maxY = Math.max(maxY, node.position.y + 60);
  });

  // Normalize positions to start from (0, 0)
  const normalizedNodes = layoutedNodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - minX,
      y: node.position.y - minY,
    },
  }));

  return {
    nodes: normalizedNodes,
    width: maxX - minX,
    height: maxY - minY,
  };
}
