/**
 * Field Label Component
 * Displays a label with metadata for parameter fields
 */

import React from 'react';
import {
  Typography,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import type { ParameterType } from '@/types';

interface FieldLabelProps {
  /** Field name to display */
  name: string;
  /** Parameter type */
  type: ParameterType;
  /** Whether the field is required */
  required?: boolean;
  /** Optional description tooltip */
  description?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  name,
  type,
  required = false,
  description,
}) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography
        variant="body2"
        component="label"
        sx={{ fontWeight: 500 }}
      >
        {name}
        {required && (
          <Typography
            component="span"
            sx={{ color: 'error.main', ml: 0.5 }}
          >
            *
          </Typography>
        )}
      </Typography>

      <Chip
        label={type}
        size="small"
        variant="outlined"
        sx={{
          height: 20,
          fontSize: '0.7rem',
          fontFamily: 'monospace',
        }}
      />

      {description && (
        <Tooltip title={description} arrow placement="right">
          <InfoOutlined
            sx={{
              fontSize: 16,
              color: 'text.secondary',
              cursor: 'help',
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
};
