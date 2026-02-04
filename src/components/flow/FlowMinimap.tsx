/**
 * FlowMinimap - Styled minimap wrapper
 * Provides a bird's eye view of the flow canvas
 */

import { MiniMap } from 'reactflow';
import type { MiniMapProps } from 'reactflow';

interface FlowMinimapProps extends Partial<MiniMapProps> {
  visible?: boolean;
}

export default function FlowMinimap({
  visible = true,
  ...props
}: FlowMinimapProps) {
  if (!visible) return null;

  return (
    <MiniMap
      nodeColor={(node) => {
        const nodeData = node.data as any;
        const status = nodeData?.status;

        // Color based on execution status
        if (status === 'running') return '#2196F3';
        if (status === 'success') return '#4CAF50';
        if (status === 'failed') return '#F44336';
        if (status === 'waiting') return '#FF9800';
        if (status === 'skipped') return '#9E9E9E';
        if (status === 'cancelled') return '#757575';

        // Color based on node type if no status
        const nodeType = node.type;
        if (nodeType === 'request') return '#61AFFE';
        if (nodeType === 'condition') return '#FFA726';
        if (nodeType === 'loop') return '#42A5F5';
        if (nodeType === 'group') return '#BDBDBD';

        return '#E0E0E0';
      }}
      maskColor="rgba(0, 0, 0, 0.1)"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
      {...props}
    />
  );
}
