/**
 * TFXEdge - Custom edge for TFX pipeline style
 * Enhances edge labels for better visibility
 */

import { memo } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { Box } from '@mui/material';

function TFXEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <Box
            sx={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 600,
              pointerEvents: 'all',
              bgcolor: labelShowBg !== false ? 'background.paper' : 'transparent',
              border: labelShowBg !== false ? '1px solid' : 'none',
              borderColor: 'divider',
              borderRadius: labelBgBorderRadius ?? 1,
              px: labelBgPadding?.[0] ?? 0.5,
              py: labelBgPadding?.[1] ?? 0.25,
              boxShadow: labelShowBg !== false ? 1 : 'none',
              ...labelStyle,
              ...labelBgStyle,
            }}
            className="nodrag nopan"
          >
            {label}
          </Box>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(TFXEdge);
