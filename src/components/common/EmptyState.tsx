/**
 * EmptyState Component
 * Displays an empty state placeholder with icon and message
 */

import { Box, Typography } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<SvgIconProps>;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 4,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: 64,
            mb: 2,
            opacity: 0.5,
          }}
        />
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
