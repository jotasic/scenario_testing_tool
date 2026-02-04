/**
 * LoadingOverlay Component
 * Displays a loading spinner overlay
 */

import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export function LoadingOverlay({ open, message }: LoadingOverlayProps) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme => theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      {message && (
        <Box>
          <Typography variant="body1">{message}</Typography>
        </Box>
      )}
    </Backdrop>
  );
}
