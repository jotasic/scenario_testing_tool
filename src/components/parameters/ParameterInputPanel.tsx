/**
 * Parameter Input Panel Component
 * Main panel for entering and managing scenario parameters
 * Supports both Form and JSON editing modes with bidirectional sync
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Stack,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import {
  ViewList as FormIcon,
  Code as JsonIcon,
  CheckCircle as ValidateIcon,
  Save as ApplyIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { DynamicParameterForm } from './DynamicParameterForm';
import type { ParameterSchema, ParameterValue } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { setParameterValues } from '@/store/executionSlice';

type EditorMode = 'form' | 'json';

interface ParameterInputPanelProps {
  /** Parameter schemas defining the structure */
  schemas: ParameterSchema[];
  /** Initial parameter values */
  initialValues?: Record<string, ParameterValue>;
  /** Callback when parameters are applied */
  onApply?: (values: Record<string, ParameterValue>) => void;
}

export const ParameterInputPanel: React.FC<ParameterInputPanelProps> = ({
  schemas,
  initialValues = {},
  onApply,
}) => {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<EditorMode>('form');
  const [formValues, setFormValues] = useState<Record<string, ParameterValue>>(initialValues);
  const [jsonValue, setJsonValue] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const isInitialized = useRef(false);

  // Initialize with default values from schema (only once on mount)
  useEffect(() => {
    if (isInitialized.current) return;

    const defaultValues: Record<string, ParameterValue> = {};

    schemas.forEach((schema) => {
      if (initialValues[schema.name] !== undefined) {
        defaultValues[schema.name] = initialValues[schema.name];
      } else if (schema.defaultValue !== undefined) {
        defaultValues[schema.name] = schema.defaultValue as ParameterValue;
      }
    });

    setFormValues(defaultValues);
    setJsonValue(JSON.stringify(defaultValues, null, 2));
    isInitialized.current = true;
  }, [schemas, initialValues]);

  // Sync form to JSON when switching modes
  useEffect(() => {
    if (mode === 'json') {
      setJsonValue(JSON.stringify(formValues, null, 2));
      setJsonError(null);
    }
  }, [mode, formValues]);

  const handleModeChange = useCallback((_: React.MouseEvent, newMode: EditorMode | null) => {
    if (newMode === null) return;

    // When switching from JSON to Form, validate and parse JSON
    if (mode === 'json' && newMode === 'form') {
      try {
        const parsed = JSON.parse(jsonValue);
        setFormValues(parsed);
        setJsonError(null);
        setMode(newMode);
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      }
    } else {
      setMode(newMode);
    }
  }, [mode, jsonValue]);

  const handleFormChange = useCallback((values: Record<string, ParameterValue>) => {
    setFormValues(values);
    setHasChanges(true);
  }, []);

  const handleJsonChange = useCallback((value: string) => {
    setJsonValue(value);
    setHasChanges(true);

    // Try to parse JSON for immediate validation
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  }, []);

  const handleValidate = useCallback(() => {
    const errors: string[] = [];
    const currentValues = mode === 'json' ? JSON.parse(jsonValue) : formValues;

    schemas.forEach((schema) => {
      const value = currentValues[schema.name];

      // Check required fields
      if (schema.required && (value === undefined || value === null || value === '')) {
        errors.push(`${schema.name} is required`);
      }

      // Type validation
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (schema.type !== 'any' && actualType !== schema.type) {
          errors.push(`${schema.name} must be of type ${schema.type}, got ${actualType}`);
        }
      }

      // Validation rules
      if (schema.validation && value !== undefined && value !== null) {
        const validation = schema.validation;

        // String/Array length
        if ((schema.type === 'string' || schema.type === 'array') && typeof value === 'string' || Array.isArray(value)) {
          const length = typeof value === 'string' ? value.length : value.length;
          if (validation.min !== undefined && length < validation.min) {
            errors.push(`${schema.name} must have at least ${validation.min} ${schema.type === 'string' ? 'characters' : 'items'}`);
          }
          if (validation.max !== undefined && length > validation.max) {
            errors.push(`${schema.name} must have at most ${validation.max} ${schema.type === 'string' ? 'characters' : 'items'}`);
          }
        }

        // Number range
        if (schema.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            errors.push(`${schema.name} must be at least ${validation.min}`);
          }
          if (validation.max !== undefined && value > validation.max) {
            errors.push(`${schema.name} must be at most ${validation.max}`);
          }
        }

        // Pattern
        if (validation.pattern && typeof value === 'string') {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push(`${schema.name} does not match pattern: ${validation.pattern}`);
          }
        }

        // Enum
        if (validation.enum && !validation.enum.includes(value)) {
          errors.push(`${schema.name} must be one of: ${validation.enum.join(', ')}`);
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [schemas, formValues, jsonValue, mode]);

  const handleApply = useCallback(() => {
    if (!handleValidate()) {
      return;
    }

    const values = mode === 'json' ? JSON.parse(jsonValue) : formValues;
    dispatch(setParameterValues(values));

    if (onApply) {
      onApply(values);
    }

    setHasChanges(false);
  }, [mode, formValues, jsonValue, handleValidate, dispatch, onApply]);

  const handleReset = useCallback(() => {
    const defaultValues: Record<string, ParameterValue> = {};

    schemas.forEach((schema) => {
      if (schema.defaultValue !== undefined) {
        defaultValues[schema.name] = schema.defaultValue as ParameterValue;
      }
    });

    setFormValues(defaultValues);
    setJsonValue(JSON.stringify(defaultValues, null, 2));
    setValidationErrors([]);
    setJsonError(null);
    setHasChanges(false);
  }, [schemas]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Parameters</Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            aria-label="editor mode"
          >
            <ToggleButton value="form" aria-label="form mode">
              <FormIcon sx={{ mr: 1 }} fontSize="small" />
              Form
            </ToggleButton>
            <ToggleButton value="json" aria-label="json mode">
              <JsonIcon sx={{ mr: 1 }} fontSize="small" />
              JSON
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Validation Errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* JSON parse error */}
        {jsonError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">JSON Parse Error:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {jsonError}
            </Typography>
          </Alert>
        )}

        {/* Empty state */}
        {schemas.length === 0 && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body1" gutterBottom>
              No parameters defined for this scenario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Go to <strong>Configuration</strong> mode and click <strong>Parameters</strong> in the sidebar to define parameters.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              Parameters let you pass dynamic values like user IDs, API keys, or test data to your scenario steps.
            </Typography>
          </Box>
        )}

        {/* Form mode */}
        {mode === 'form' && schemas.length > 0 && (
          <DynamicParameterForm
            schemas={schemas}
            values={formValues}
            onChange={handleFormChange}
          />
        )}

        {/* JSON mode */}
        {mode === 'json' && schemas.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 0,
              overflow: 'hidden',
            }}
          >
            <textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: '400px',
                border: 'none',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                padding: '16px',
                resize: 'both',
                backgroundColor: 'transparent',
                color: 'inherit',
              }}
              aria-label="JSON editor"
            />
          </Paper>
        )}
      </Box>

      {/* Actions */}
      {schemas.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                startIcon={<ValidateIcon />}
                onClick={handleValidate}
              >
                Validate
              </Button>
              <Button
                variant="contained"
                startIcon={<ApplyIcon />}
                onClick={handleApply}
                disabled={!hasChanges || !!jsonError}
              >
                Apply
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
};
