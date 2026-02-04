/**
 * Custom node types for React Flow
 * Export as nodeTypes object for ReactFlow component
 */

import RequestNode from './RequestNode';
import ConditionNode from './ConditionNode';
import LoopNode from './LoopNode';
import GroupNode from './GroupNode';

export const nodeTypes = {
  request: RequestNode,
  condition: ConditionNode,
  loop: LoopNode,
  group: GroupNode,
};

export { RequestNode, ConditionNode, LoopNode, GroupNode };
