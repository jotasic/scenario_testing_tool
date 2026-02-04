/**
 * Array Field Input Component
 * Renders a dynamic array field with add/remove/reorder capabilities
 */

import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import type { ParameterSchema, ParameterValue } from '@/types';
import { DynamicParameterForm } from './DynamicParameterForm';

interface ArrayFieldInputProps {
  /** Schema definition for array items */
  itemSchema: ParameterSchema;
  /** Current array value */
  value: ParameterValue[];
  /** Callback when the array value changes */
  onChange: (value: ParameterValue[]) => void;
  /** Optional field name for display */
  name?: string;
}

export const ArrayFieldInput: React.FC<ArrayFieldInputProps> = ({
  itemSchema,
  value,
  onChange,
  name: _name,
}) => {
  const handleAddItem = () => {
    const defaultValue = getDefaultValue(itemSchema);
    onChange([...value, defaultValue]);
  };

  const handleRemoveItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newValue = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newValue.length) return;

    [newValue[index], newValue[targetIndex]] = [newValue[targetIndex], newValue[index]];
    onChange(newValue);
  };

  const handleItemChange = (index: number, itemValue: ParameterValue) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  return (
    <Box>
      <Stack spacing={1.5}>
        {value.map((item, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 2,
              position: 'relative',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 1,
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              {/* Item content */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Item {index + 1}
                </Typography>
                <DynamicParameterForm
                  schemas={[itemSchema]}
                  values={{ [itemSchema.name]: item }}
                  onChange={(values) => handleItemChange(index, values[itemSchema.name])}
                  compact
                />
              </Box>

              {/* Actions */}
              <Stack direction="column" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => handleMoveItem(index, 'up')}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleMoveItem(index, 'down')}
                  disabled={index === value.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                  aria-label="Remove item"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        ))}

        {/* Add button */}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          fullWidth
          sx={{ mt: 1 }}
        >
          Add Item
        </Button>
      </Stack>

      {value.length === 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
        >
          No items. Click "Add Item" to create one.
        </Typography>
      )}
    </Box>
  );
};

/**
 * Get default value for a schema
 */
function getDefaultValue(schema: ParameterSchema): ParameterValue {
  if (schema.defaultValue !== undefined) {
    return schema.defaultValue as ParameterValue;
  }

  switch (schema.type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'any':
      return null;
    default:
      return null;
  }
}
