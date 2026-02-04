/**
 * ResizablePanels Component
 * A container for horizontally resizable panels with drag handles
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface PanelConfig {
  /** Unique key for the panel */
  key: string;
  /** Initial width in pixels (for fixed panels) or flex value */
  initialWidth?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Whether this panel should flex to fill remaining space */
  flex?: boolean;
  /** Panel content */
  children: React.ReactNode;
}

interface ResizablePanelsProps {
  /** Panel configurations */
  panels: PanelConfig[];
  /** Height of the container */
  height?: string | number;
}

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        width: 6,
        cursor: 'col-resize',
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&:active': {
          backgroundColor: 'primary.main',
        },
        '&::after': {
          content: '""',
          width: 2,
          height: 40,
          borderRadius: 1,
          backgroundColor: 'divider',
          transition: 'background-color 0.2s',
        },
        '&:hover::after': {
          backgroundColor: 'primary.main',
        },
      }}
    />
  );
}

export function ResizablePanels({ panels, height = '100%' }: ResizablePanelsProps) {
  // Initialize widths from panel configs
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    panels.forEach(panel => {
      if (!panel.flex && panel.initialWidth) {
        initial[panel.key] = panel.initialWidth;
      }
    });
    return initial;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    panelKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleMouseDown = useCallback((panelKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const currentWidth = widths[panelKey] || panels.find(p => p.key === panelKey)?.initialWidth || 200;

    draggingRef.current = {
      panelKey,
      startX: e.clientX,
      startWidth: currentWidth,
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [widths, panels]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;

      const { panelKey, startX, startWidth } = draggingRef.current;
      const panel = panels.find(p => p.key === panelKey);
      if (!panel) return;

      const delta = e.clientX - startX;
      let newWidth = startWidth + delta;

      // Apply constraints
      if (panel.minWidth) {
        newWidth = Math.max(newWidth, panel.minWidth);
      }
      if (panel.maxWidth) {
        newWidth = Math.min(newWidth, panel.maxWidth);
      }

      setWidths(prev => ({
        ...prev,
        [panelKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [panels]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        height,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {panels.map((panel, index) => {
        const isFlexPanel = panel.flex;
        const width = isFlexPanel ? undefined : (widths[panel.key] || panel.initialWidth);
        const isLastPanel = index === panels.length - 1;

        return (
          <Box key={panel.key} sx={{ display: 'flex', flexGrow: isFlexPanel ? 1 : 0, flexShrink: 0 }}>
            {/* Panel Content */}
            <Box
              sx={{
                width: isFlexPanel ? '100%' : width,
                minWidth: panel.minWidth,
                maxWidth: panel.maxWidth,
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: isFlexPanel ? 1 : 0,
                flexShrink: isFlexPanel ? 1 : 0,
              }}
            >
              {panel.children}
            </Box>

            {/* Resize Handle (not after the last panel) */}
            {!isLastPanel && !isFlexPanel && (
              <ResizeHandle onMouseDown={(e) => handleMouseDown(panel.key, e)} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
