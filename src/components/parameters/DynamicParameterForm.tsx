/**
 * Dynamic Parameter Form Component
 * Recursively renders form fields based on parameter schema
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  MenuItem,
  IconButton,
} from '@mui/material';
import type { ParameterSchema, ParameterValue } from '@/types';
import { FieldLabel } from './FieldLabel';
import { ArrayFieldInput } from './ArrayFieldInput';
import { ObjectFieldInput } from './ObjectFieldInput';

/**
 * JSON Array Field Component
 * Extracted to avoid hooks in render function
 */
interface JsonArrayFieldProps {
  schema: ParameterSchema;
  value: ParameterValue[];
  onChange: (name: string, value: ParameterValue) => void;
}

function JsonArrayField({ schema, value, onChange }: JsonArrayFieldProps) {
  const [localValue, setLocalValue] = useState(JSON.stringify(value, null, 2));
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      queueMicrotask(() => {
        setLocalValue(JSON.stringify(value, null, 2));
        setJsonError(null);
      });
    }
  }, [value, isEditing]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(localValue);
      setLocalValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    try {
      const parsed = JSON.parse(localValue);
      if (Array.isArray(parsed)) {
        onChange(schema.name, parsed);
        setJsonError(null);
      } else {
        setJsonError('Value must be a JSON array');
        setLocalValue(JSON.stringify(value, null, 2));
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      setLocalValue(JSON.stringify(value, null, 2));
    }
  };

  return (
    <Box>
      <FieldLabel
        name={schema.name}
        type={schema.type}
        required={schema.required}
        description={schema.description}
      />
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={8}
          maxRows={20}
          value={localValue}
          onFocus={() => setIsEditing(true)}
          onChange={(e) => {
            setLocalValue(e.target.value);
            try {
              JSON.parse(e.target.value);
              setJsonError(null);
            } catch (err) {
              setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
            }
          }}
          onBlur={handleBlur}
          placeholder={schema.defaultValue ? JSON.stringify(schema.defaultValue, null, 2) : '[\n  "item1",\n  "item2"\n]'}
          required={schema.required}
          error={!!jsonError}
          helperText={jsonError || 'Enter a valid JSON array'}
          sx={{
            '& .MuiInputBase-root': { resize: 'vertical', overflow: 'auto' },
            '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary' },
          }}
        />
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={handleFormat}
            title="Format JSON"
            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Format</span>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * JSON Object Field Component
 * Extracted to avoid hooks in render function
 */
interface JsonObjectFieldProps {
  schema: ParameterSchema;
  value: Record<string, ParameterValue>;
  onChange: (name: string, value: ParameterValue) => void;
}

function JsonObjectField({ schema, value, onChange }: JsonObjectFieldProps) {
  const [localValue, setLocalValue] = useState(JSON.stringify(value, null, 2));
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      queueMicrotask(() => {
        setLocalValue(JSON.stringify(value, null, 2));
        setJsonError(null);
      });
    }
  }, [value, isEditing]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(localValue);
      setLocalValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    try {
      const parsed = JSON.parse(localValue);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        onChange(schema.name, parsed);
        setJsonError(null);
      } else {
        setJsonError('Value must be a JSON object');
        setLocalValue(JSON.stringify(value, null, 2));
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      setLocalValue(JSON.stringify(value, null, 2));
    }
  };

  return (
    <Box>
      <FieldLabel
        name={schema.name}
        type={schema.type}
        required={schema.required}
        description={schema.description}
      />
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={8}
          maxRows={20}
          value={localValue}
          onFocus={() => setIsEditing(true)}
          onChange={(e) => {
            setLocalValue(e.target.value);
            try {
              JSON.parse(e.target.value);
              setJsonError(null);
            } catch (err) {
              setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
            }
          }}
          onBlur={handleBlur}
          placeholder={schema.defaultValue ? JSON.stringify(schema.defaultValue, null, 2) : '{\n  "key": "value"\n}'}
          required={schema.required}
          error={!!jsonError}
          helperText={jsonError || 'Enter a valid JSON object'}
          sx={{
            '& .MuiInputBase-root': { resize: 'vertical', overflow: 'auto' },
            '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary' },
          }}
        />
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={handleFormat}
            title="Format JSON"
            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Format</span>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * JSON Any Field Component
 * Extracted to avoid hooks in render function
 */
interface JsonAnyFieldProps {
  schema: ParameterSchema;
  value: ParameterValue;
  onChange: (name: string, value: ParameterValue) => void;
}

function JsonAnyField({ schema, value, onChange }: JsonAnyFieldProps) {
  const [localValue, setLocalValue] = useState(
    typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      queueMicrotask(() => {
        setLocalValue(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
        setJsonError(null);
      });
    }
  }, [value, isEditing]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(localValue);
      setLocalValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setJsonError(null);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    try {
      const parsed = JSON.parse(localValue);
      onChange(schema.name, parsed);
      setJsonError(null);
    } catch {
      onChange(schema.name, localValue);
      setJsonError(null);
    }
  };

  return (
    <Box>
      <FieldLabel
        name={schema.name}
        type={schema.type}
        required={schema.required}
        description={schema.description}
      />
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={6}
          maxRows={20}
          value={localValue}
          onFocus={() => setIsEditing(true)}
          onChange={(e) => {
            setLocalValue(e.target.value);
            try {
              JSON.parse(e.target.value);
              setJsonError(null);
            } catch {
              setJsonError(null);
            }
          }}
          onBlur={handleBlur}
          placeholder={schema.defaultValue ? JSON.stringify(schema.defaultValue, null, 2) : '{}'}
          required={schema.required}
          error={!!jsonError}
          helperText={jsonError || 'Enter any value (JSON or plain text)'}
          sx={{
            '& .MuiInputBase-root': { resize: 'vertical', overflow: 'auto' },
            '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary' },
          }}
        />
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={handleFormat}
            title="Format JSON"
            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Format</span>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

interface DynamicParameterFormProps {
  /** Array of parameter schemas to render */
  schemas: ParameterSchema[];
  /** Current values for all parameters */
  values: Record<string, ParameterValue>;
  /** Callback when any value changes */
  onChange: (values: Record<string, ParameterValue>) => void;
  /** Compact mode for nested fields */
  compact?: boolean;
}

export const DynamicParameterForm: React.FC<DynamicParameterFormProps> = ({
  schemas,
  values,
  onChange,
  compact = false,
}) => {
  const handleFieldChange = useCallback(
    (fieldName: string, value: ParameterValue) => {
      onChange({
        ...values,
        [fieldName]: value,
      });
    },
    [values, onChange]
  );

  const renderField = (schema: ParameterSchema) => {
    const rawValue = values[schema.name] ?? schema.defaultValue ?? getDefaultValue(schema);
    const value = rawValue as ParameterValue;

    switch (schema.type) {
      case 'string':
        return renderStringField(schema, value as string, handleFieldChange);

      case 'number':
        return renderNumberField(schema, value as number, handleFieldChange);

      case 'boolean':
        return renderBooleanField(schema, value as boolean, handleFieldChange);

      case 'array':
        return renderArrayField(schema, value as ParameterValue[], handleFieldChange);

      case 'object':
        return renderObjectField(schema, value as Record<string, ParameterValue>, handleFieldChange);

      case 'any':
        return renderAnyField(schema, value, handleFieldChange);

      default:
        return null;
    }
  };

  return (
    <Stack spacing={compact ? 2 : 3}>
      {schemas.map((schema) => (
        <Box key={schema.id}>
          {renderField(schema)}
        </Box>
      ))}
    </Stack>
  );
};

/**
 * Render string field
 */
function renderStringField(
  schema: ParameterSchema,
  value: string,
  onChange: (name: string, value: ParameterValue) => void
) {
  const hasEnum = schema.validation?.enum && schema.validation.enum.length > 0;

  return (
    <Box>
      <FieldLabel
        name={schema.name}
        type={schema.type}
        required={schema.required}
        description={schema.description}
      />
      <TextField
        fullWidth
        size="small"
        select={hasEnum}
        value={value}
        onChange={(e) => onChange(schema.name, e.target.value)}
        placeholder={schema.defaultValue as string}
        required={schema.required}
        inputProps={{
          pattern: schema.validation?.pattern,
          minLength: schema.validation?.min,
          maxLength: schema.validation?.max,
        }}
        helperText={
          schema.validation?.pattern
            ? `Pattern: ${schema.validation.pattern}`
            : undefined
        }
      >
        {hasEnum &&
          schema.validation!.enum!.map((option) => (
            <MenuItem key={String(option)} value={String(option)}>
              {String(option)}
            </MenuItem>
          ))}
      </TextField>
    </Box>
  );
}

/**
 * Render number field
 */
function renderNumberField(
  schema: ParameterSchema,
  value: number,
  onChange: (name: string, value: ParameterValue) => void
) {
  return (
    <Box>
      <FieldLabel
        name={schema.name}
        type={schema.type}
        required={schema.required}
        description={schema.description}
      />
      <TextField
        fullWidth
        size="small"
        type="number"
        value={value}
        onChange={(e) => onChange(schema.name, parseFloat(e.target.value) || 0)}
        placeholder={String(schema.defaultValue)}
        required={schema.required}
        inputProps={{
          min: schema.validation?.min,
          max: schema.validation?.max,
          step: 'any',
        }}
        helperText={
          schema.validation?.min !== undefined || schema.validation?.max !== undefined
            ? `Range: ${schema.validation?.min ?? '-∞'} to ${schema.validation?.max ?? '∞'}`
            : undefined
        }
      />
    </Box>
  );
}

/**
 * Render boolean field
 */
function renderBooleanField(
  schema: ParameterSchema,
  value: boolean,
  onChange: (name: string, value: ParameterValue) => void
) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={value}
            onChange={(e) => onChange(schema.name, e.target.checked)}
          />
        }
        label={
          <Box>
            <FieldLabel
              name={schema.name}
              type={schema.type}
              required={schema.required}
              description={schema.description}
            />
          </Box>
        }
      />
    </Box>
  );
}

/**
 * Render array field
 * Falls back to JSON editor if no itemSchema defined
 */
function renderArrayField(
  schema: ParameterSchema,
  value: ParameterValue[],
  onChange: (name: string, value: ParameterValue) => void
) {
  // If itemSchema is defined, use structured input
  if (schema.itemSchema) {
    return (
      <Box>
        <FieldLabel
          name={schema.name}
          type={schema.type}
          required={schema.required}
          description={schema.description}
        />
        <Box sx={{ mt: 1 }}>
          <ArrayFieldInput
            itemSchema={schema.itemSchema}
            value={value}
            onChange={(newValue) => onChange(schema.name, newValue)}
            name={schema.name}
          />
        </Box>
      </Box>
    );
  }

  // Fallback to JSON editor component for arrays without defined itemSchema
  return <JsonArrayField schema={schema} value={value} onChange={onChange} />;
}

/**
 * Render object field
 * Falls back to JSON editor if no properties defined
 */
function renderObjectField(
  schema: ParameterSchema,
  value: Record<string, ParameterValue>,
  onChange: (name: string, value: ParameterValue) => void
) {
  // If properties are defined, use structured input
  if (schema.properties && schema.properties.length > 0) {
    return (
      <Box>
        <FieldLabel
          name={schema.name}
          type={schema.type}
          required={schema.required}
          description={schema.description}
        />
        <Box sx={{ mt: 1 }}>
          <ObjectFieldInput
            properties={schema.properties}
            value={value}
            onChange={(newValue) => onChange(schema.name, newValue)}
            name={schema.name}
          />
        </Box>
      </Box>
    );
  }

  // Fallback to JSON editor component for objects without defined properties
  return <JsonObjectField schema={schema} value={value} onChange={onChange} />;
}

/**
 * Render any type field (JSON input)
 */
function renderAnyField(
  schema: ParameterSchema,
  value: ParameterValue,
  onChange: (name: string, value: ParameterValue) => void
) {
  return <JsonAnyField schema={schema} value={value} onChange={onChange} />;
}

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
      return [] as ParameterValue[];
    case 'object':
      return {} as { [key: string]: ParameterValue };
    case 'any':
      return null;
    default:
      return null;
  }
}
