/**
 * Custom node types for React Flow
 * Export as nodeTypes object for ReactFlow component
 */

import RequestNode from './RequestNode';
import ConditionNode from './ConditionNode';
import LoopNode from './LoopNode';
import GroupNode from './GroupNode';
import TFXNode from './TFXNode';

export const nodeTypes = {
  request: RequestNode,
  condition: ConditionNode,
  loop: LoopNode,
  group: GroupNode,
};

// TFX-style unified node types
export const tfxNodeTypes = {
  request: TFXNode,
  condition: TFXNode,
  loop: TFXNode,
  group: TFXNode,
};

export { RequestNode, ConditionNode, LoopNode, GroupNode, TFXNode };
