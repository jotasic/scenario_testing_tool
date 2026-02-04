/**
 * Dynamic Parameter Form Component
 * Recursively renders form fields based on parameter schema
 */

import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  MenuItem,
} from '@mui/material';
import type { ParameterSchema, ParameterValue } from '@/types';
import { FieldLabel } from './FieldLabel';
import { ArrayFieldInput } from './ArrayFieldInput';
import { ObjectFieldInput } from './ObjectFieldInput';

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
 */
function renderArrayField(
  schema: ParameterSchema,
  value: ParameterValue[],
  onChange: (name: string, value: ParameterValue) => void
) {
  if (!schema.itemSchema) {
    return null;
  }

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

/**
 * Render object field
 */
function renderObjectField(
  schema: ParameterSchema,
  value: Record<string, ParameterValue>,
  onChange: (name: string, value: ParameterValue) => void
) {
  if (!schema.properties || schema.properties.length === 0) {
    return null;
  }

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

/**
 * Render any type field (JSON input)
 */
function renderAnyField(
  schema: ParameterSchema,
  value: ParameterValue,
  onChange: (name: string, value: ParameterValue) => void
) {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

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
        multiline
        rows={4}
        value={stringValue}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onChange(schema.name, parsed);
          } catch {
            // Keep as string if not valid JSON
            onChange(schema.name, e.target.value);
          }
        }}
        placeholder={schema.defaultValue ? JSON.stringify(schema.defaultValue, null, 2) : '{}'}
        required={schema.required}
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      />
    </Box>
  );
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
