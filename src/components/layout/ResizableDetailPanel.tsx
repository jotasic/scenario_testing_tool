/**
 * ResizableDetailPanel Component
 * A resizable panel for step detail information with drag handle
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface ResizableDetailPanelProps {
  /** Panel content */
  children: React.ReactNode;
  /** LocalStorage key for persisting width */
  storageKey?: string;
  /** Default width as percentage of viewport or pixel value */
  defaultWidth?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
}

export function ResizableDetailPanel({
  children,
  storageKey = 'stepDetailPanelWidth',
  defaultWidth = 400,
  minWidth = 320,
  maxWidth = 800,
}: ResizableDetailPanelProps) {
  // Load initial width from localStorage or use default
  const [width, setWidth] = useState<number>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedWidth = parseInt(stored, 10);
        if (!isNaN(parsedWidth)) {
          // Apply constraints to stored value
          return Math.max(minWidth, Math.min(parsedWidth, maxWidth));
        }
      }
    }
    return defaultWidth;
  });

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save to localStorage when width changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Calculate new width (subtract delta because we're dragging from the left edge)
      const delta = startXRef.current - e.clientX;
      let newWidth = startWidthRef.current + delta;

      // Calculate dynamic max width (60% of viewport or maxWidth, whichever is smaller)
      const dynamicMaxWidth = Math.min(window.innerWidth * 0.6, maxWidth);

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(newWidth, dynamicMaxWidth));

      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
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
  }, [minWidth, maxWidth]);

  return (
    <Box
      sx={{
        width,
        minWidth,
        maxWidth: Math.min(window.innerWidth * 0.6, maxWidth),
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Resize Handle - Left Edge */}
      <Box
        onMouseDown={handleMouseDown}
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

      {/* Panel Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: 1,
          borderColor: 'divider',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
