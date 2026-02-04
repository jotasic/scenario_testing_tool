/**
 * AppLayout Component
 * Main application layout with header and content area
 */

import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  onSave?: () => void;
  onLoad?: () => void;
  onSettings?: () => void;
}

export function AppLayout({ children, onSave, onLoad, onSettings }: AppLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header onSave={onSave} onLoad={onLoad} onSettings={onSettings} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
