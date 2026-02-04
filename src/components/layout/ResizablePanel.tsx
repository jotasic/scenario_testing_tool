/**
 * ResizablePanel Component
 * Simple resizable panel wrapper using CSS resize
 */

import { Box, Paper } from '@mui/material';
import type { ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth?: number | string;
  defaultHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  direction?: 'horizontal' | 'vertical' | 'both';
  elevation?: number;
}

export function ResizablePanel({
  children,
  defaultWidth = '100%',
  defaultHeight = '100%',
  minWidth = 200,
  minHeight = 200,
  maxWidth = '100%',
  maxHeight = '100%',
  direction = 'both',
  elevation = 0,
}: ResizablePanelProps) {
  const resizeValue =
    direction === 'horizontal'
      ? 'horizontal'
      : direction === 'vertical'
      ? 'vertical'
      : 'both';

  return (
    <Paper
      elevation={elevation}
      sx={{
        width: defaultWidth,
        height: defaultHeight,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        resize: resizeValue,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
}
