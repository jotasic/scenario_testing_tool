/**
 * ParameterSchemaEditor Component
 * Editor for defining parameter schemas in Configuration mode
 * Shows which steps use each parameter
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import type { ParameterSchema, ParameterType, Step } from '@/types';

interface ParameterSchemaEditorProps {
  schemas: ParameterSchema[];
  steps: Step[];
  onChange: (schemas: ParameterSchema[]) => void;
}

/**
 * Find which steps reference a given parameter
 */
function findParameterUsage(paramName: string, steps: Step[]): string[] {
  const usageSteps: string[] = [];
  const pattern = new RegExp(`\\$\\{params\\.${paramName}[.\\[\\}]`, 'g');

  steps.forEach(step => {
    const stepJson = JSON.stringify(step);
    if (pattern.test(stepJson)) {
      usageSteps.push(step.name);
    }
  });

  return usageSteps;
}

const parameterTypes: { value: ParameterType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'any', label: 'Any' },
];

interface SchemaItemProps {
  schema: ParameterSchema;
  steps: Step[];
  onUpdate: (updated: ParameterSchema) => void;
  onDelete: () => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

function SchemaItem({ schema, steps, onUpdate, onDelete, expanded, onExpandChange }: SchemaItemProps) {
  const usedInSteps = findParameterUsage(schema.name, steps);

  const handleFieldChange = (field: keyof ParameterSchema, value: unknown) => {
    onUpdate({ ...schema, [field]: value });
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onExpandChange(isExpanded)}
      sx={{ '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {schema.name || '(unnamed)'}
          </Typography>
          <Chip
            label={schema.type}
            size="small"
            variant="outlined"
            color={schema.required ? 'primary' : 'default'}
          />
          {usedInSteps.length > 0 && (
            <Tooltip title={`Used in: ${usedInSteps.join(', ')}`}>
              <Chip
                label={`${usedInSteps.length} steps`}
                size="small"
                color="success"
                variant="filled"
              />
            </Tooltip>
          )}
          {usedInSteps.length === 0 && (
            <Tooltip title="Not used in any step">
              <Chip
                label="Unused"
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            label="Parameter Name"
            size="small"
            fullWidth
            value={schema.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            helperText={`Reference: \${params.${schema.name}}`}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={schema.type}
              label="Type"
              onChange={(e) => handleFieldChange('type', e.target.value)}
            >
              {parameterTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={schema.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />

          <TextField
            label="Default Value"
            size="small"
            fullWidth
            value={
              schema.defaultValue !== undefined
                ? typeof schema.defaultValue === 'object'
                  ? JSON.stringify(schema.defaultValue)
                  : String(schema.defaultValue)
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              try {
                // Try to parse as JSON
                handleFieldChange('defaultValue', JSON.parse(val));
              } catch {
                // Use as string if not valid JSON
                handleFieldChange('defaultValue', val || undefined);
              }
            }}
            helperText="JSON for objects/arrays, plain text for strings"
          />

          <FormControlLabel
            control={
              <Switch
                checked={schema.required}
                onChange={(e) => handleFieldChange('required', e.target.checked)}
              />
            }
            label="Required"
          />

          {/* Validation Rules */}
          {(schema.type === 'string' || schema.type === 'number' || schema.type === 'array') && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Validation Rules
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Min"
                  size="small"
                  type="number"
                  value={schema.validation?.min ?? ''}
                  onChange={(e) =>
                    handleFieldChange('validation', {
                      ...schema.validation,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Max"
                  size="small"
                  type="number"
                  value={schema.validation?.max ?? ''}
                  onChange={(e) =>
                    handleFieldChange('validation', {
                      ...schema.validation,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  sx={{ width: 100 }}
                />
              </Stack>
              {schema.type === 'string' && (
                <TextField
                  label="Pattern (regex)"
                  size="small"
                  fullWidth
                  value={schema.validation?.pattern ?? ''}
                  onChange={(e) =>
                    handleFieldChange('validation', {
                      ...schema.validation,
                      pattern: e.target.value || undefined,
                    })
                  }
                  sx={{ mt: 2 }}
                />
              )}
            </Paper>
          )}

          {/* Usage Info */}
          {usedInSteps.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="success" />
                <Typography variant="caption" color="text.secondary">
                  Used in steps:
                </Typography>
              </Stack>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {usedInSteps.map(stepName => (
                  <Chip key={stepName} label={stepName} size="small" />
                ))}
              </Box>
            </Paper>
          )}

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              Delete Parameter
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export function ParameterSchemaEditor({ schemas, steps, onChange }: ParameterSchemaEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const newSchema: ParameterSchema = {
      id: uuidv4(),
      name: `param_${schemas.length + 1}`,
      type: 'string',
      required: false,
    };
    onChange([...schemas, newSchema]);
    setExpandedId(newSchema.id);
  }, [schemas, onChange]);

  const handleUpdate = useCallback(
    (index: number, updated: ParameterSchema) => {
      const newSchemas = [...schemas];
      newSchemas[index] = updated;
      onChange(newSchemas);
    },
    [schemas, onChange]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const newSchemas = schemas.filter((_, i) => i !== index);
      onChange(newSchemas);
    },
    [schemas, onChange]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Parameter Schema
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          variant="outlined"
        >
          Add Parameter
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {schemas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No parameters defined.
            </Typography>
            <Typography variant="caption">
              Add parameters to use as {"${params.name}"} in your steps.
            </Typography>
          </Box>
        ) : (
          schemas.map((schema, index) => (
            <SchemaItem
              key={schema.id}
              schema={schema}
              steps={steps}
              onUpdate={(updated) => handleUpdate(index, updated)}
              onDelete={() => handleDelete(index)}
              expanded={expandedId === schema.id}
              onExpandChange={(expanded) => setExpandedId(expanded ? schema.id : null)}
            />
          ))
        )}
      </Box>

      {/* Info Footer */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Parameters are defined here and values are set in Execution mode.
          <br />
          Use {"${params.name}"} syntax in step endpoints, body, or headers.
        </Typography>
      </Paper>
    </Box>
  );
}
