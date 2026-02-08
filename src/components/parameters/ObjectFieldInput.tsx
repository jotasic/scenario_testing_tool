/**
 * Object Field Input Component
 * Renders nested object fields with collapsible sections
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { ParameterSchema, ParameterValue } from '@/types';
import { DynamicParameterForm } from './DynamicParameterForm';

interface ObjectFieldInputProps {
  /** Schema definition for object properties */
  properties: ParameterSchema[];
  /** Current object value */
  value: Record<string, ParameterValue>;
  /** Callback when the object value changes */
  onChange: (value: Record<string, ParameterValue>) => void;
  /** Optional field name for display */
  name?: string;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
}

export const ObjectFieldInput: React.FC<ObjectFieldInputProps> = ({
  properties,
  value,
  onChange,
  name,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleChange = (newValues: Record<string, ParameterValue>) => {
    onChange(newValues);
  };

  if (properties.length === 0) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontStyle: 'italic' }}
      >
        No properties defined
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: 'action.hover',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {name || 'Object'}
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            ({properties.length} {properties.length === 1 ? 'property' : 'properties'})
          </Typography>
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Content - Resizable */}
      <Collapse in={expanded}>
        <Box
          sx={{
            minHeight: 50,
            maxHeight: 600,
            overflow: 'auto',
            resize: 'vertical',
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              pl: 2,
              borderLeft: 2,
              borderColor: 'divider',
            }}
          >
            <DynamicParameterForm
              schemas={properties}
              values={value}
              onChange={handleChange}
              compact
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};
