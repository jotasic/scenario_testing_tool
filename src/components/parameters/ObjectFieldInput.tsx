/**
 * Object Field Input Component
 * Renders nested object fields with collapsible sections
 */

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
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
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      variant="outlined"
      sx={{
        '&:before': {
          display: 'none',
        },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          '&.Mui-expanded': {
            minHeight: 48,
          },
          '& .MuiAccordionSummary-content': {
            my: 1,
          },
        }}
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
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
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
      </AccordionDetails>
    </Accordion>
  );
};
