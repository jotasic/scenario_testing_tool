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
  Alert,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Help as HelpIcon,
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
          <Box>
            <TextField
              label="Parameter Name"
              size="small"
              fullWidth
              value={schema.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Reference:
              </Typography>
              <Chip
                label={`\${params.${schema.name}}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                onClick={() => copyToClipboard(`\${params.${schema.name}}`)}
                onDelete={() => copyToClipboard(`\${params.${schema.name}}`)}
                deleteIcon={
                  <Tooltip title="Copy to clipboard">
                    <CopyIcon sx={{ fontSize: '0.9rem !important' }} />
                  </Tooltip>
                }
              />
            </Box>
          </Box>

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

          {/* Array Item Schema */}
          {schema.type === 'array' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Array Item Type
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Define the type of items in this array
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={schema.itemSchema?.type || 'string'}
                  label="Item Type"
                  onChange={(e) =>
                    handleFieldChange('itemSchema', {
                      id: schema.itemSchema?.id || `item_${Date.now()}`,
                      name: 'item',
                      type: e.target.value,
                      required: false,
                    })
                  }
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="any">Any (JSON)</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  In Execution mode, you can add/remove items dynamically.
                  <br />
                  For complex nested arrays, use <strong>Any (JSON)</strong> type.
                </Typography>
              </Alert>
            </Paper>
          )}

          {/* Object Properties Info */}
          {schema.type === 'object' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Object Structure
              </Typography>
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="caption">
                  For object parameters, define the structure using JSON in the Default Value field.
                  <br />
                  Example: <code>{`{"name": "", "age": 0}`}</code>
                  <br /><br />
                  Or use the JSON editor in Execution mode to input values.
                </Typography>
              </Alert>
              <TextField
                label="Default Object Structure (JSON)"
                size="small"
                fullWidth
                multiline
                rows={4}
                value={
                  schema.defaultValue
                    ? JSON.stringify(schema.defaultValue, null, 2)
                    : '{\n  \n}'
                }
                onChange={(e) => {
                  try {
                    handleFieldChange('defaultValue', JSON.parse(e.target.value));
                  } catch {
                    // Keep invalid JSON as-is for editing
                  }
                }}
                placeholder={`{\n  "key": "value",\n  "count": 0\n}`}
                sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
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

/** Copy text to clipboard helper */
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

/** Parameter usage guide component */
function ParameterUsageGuide() {
  const [expanded, setExpanded] = useState(false);

  const examples = [
    { syntax: '${params.userId}', description: 'Use in endpoint: /api/users/${params.userId}' },
    { syntax: '${params.apiKey}', description: 'Use in header: Authorization: Bearer ${params.apiKey}' },
    { syntax: '${params.data}', description: 'Use in body: { "payload": ${params.data} }' },
    { syntax: '${responses.step1.id}', description: 'Reference previous step response' },
  ];

  return (
    <Alert
      severity="info"
      icon={<HelpIcon />}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide' : 'Show'} Guide
        </Button>
      }
      sx={{ mb: 1 }}
    >
      <Typography variant="body2" fontWeight={500}>
        How to Use Parameters
      </Typography>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" component="div" sx={{ mb: 1 }}>
            1. <strong>Define</strong> parameters here (name, type, default value)
          </Typography>
          <Typography variant="caption" component="div" sx={{ mb: 1 }}>
            2. <strong>Reference</strong> in steps using syntax below
          </Typography>
          <Typography variant="caption" component="div" sx={{ mb: 1 }}>
            3. <strong>Set values</strong> in Execution mode before running
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
            Syntax Examples:
          </Typography>
          {examples.map((ex, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5,
                fontSize: '0.75rem',
              }}
            >
              <Chip
                label={ex.syntax}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                onClick={() => copyToClipboard(ex.syntax)}
                onDelete={() => copyToClipboard(ex.syntax)}
                deleteIcon={<CopyIcon sx={{ fontSize: '0.9rem !important' }} />}
              />
              <Typography variant="caption" color="text.secondary">
                {ex.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Alert>
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
        {/* Usage Guide */}
        <ParameterUsageGuide />

        {schemas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No parameters defined.
            </Typography>
            <Typography variant="caption">
              Click &quot;Add Parameter&quot; to create your first parameter.
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
