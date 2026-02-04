/**
 * JsonEditor Component
 * Provides a JSON editing interface with syntax highlighting placeholder
 * Can be enhanced later with Monaco editor or similar
 */

import { TextField } from '@mui/material';
import { useState, useCallback } from 'react';

interface JsonEditorProps {
  value: string | object;
  onChange: (value: string) => void;
  readOnly?: boolean;
  label?: string;
  minRows?: number;
  maxRows?: number;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  label = 'JSON',
  minRows = 10,
  maxRows = 30,
  error = false,
  helperText,
  fullWidth = true,
}: JsonEditorProps) {
  const [internalValue, setInternalValue] = useState(() => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  });

  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInternalValue(newValue);

      // Validate JSON
      try {
        JSON.parse(newValue);
        setIsValid(true);
        onChange(newValue);
      } catch {
        setIsValid(false);
      }
    },
    [onChange]
  );

  return (
    <TextField
      value={internalValue}
      onChange={handleChange}
      multiline
      minRows={minRows}
      maxRows={maxRows}
      label={label}
      fullWidth={fullWidth}
      error={error || !isValid}
      helperText={
        helperText || (!isValid ? 'Invalid JSON format' : undefined)
      }
      disabled={readOnly}
      slotProps={{
        input: {
          sx: {
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: '0.875rem',
          },
        },
      }}
    />
  );
}
