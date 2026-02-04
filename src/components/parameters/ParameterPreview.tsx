/**
 * Parameter Preview Component
 * Read-only formatted display of parameter values
 */

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import type { ParameterValue } from '@/types';

// Register JSON language
SyntaxHighlighter.registerLanguage('json', json);

interface ParameterPreviewProps {
  /** Parameter values to display */
  values: Record<string, ParameterValue>;
  /** Whether to highlight variable references */
  highlightVariables?: boolean;
}

export const ParameterPreview: React.FC<ParameterPreviewProps> = ({
  values,
  highlightVariables = true,
}) => {
  const formattedJson = useMemo(() => {
    return JSON.stringify(values, null, 2);
  }, [values]);

  const variableReferences = useMemo(() => {
    if (!highlightVariables) return [];

    const references: string[] = [];
    const regex = /\$\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(formattedJson)) !== null) {
      const ref = match[1];
      if (!references.includes(ref)) {
        references.push(ref);
      }
    }

    return references;
  }, [formattedJson, highlightVariables]);

  const isEmpty = Object.keys(values).length === 0;

  if (isEmpty) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        <Typography variant="body2">
          No parameters defined
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Variable references */}
      {variableReferences.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Variable References Found:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {variableReferences.map((ref) => (
              <Chip
                key={ref}
                label={`\${${ref}}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* JSON preview */}
      <Paper
        variant="outlined"
        sx={{
          overflow: 'auto',
          maxHeight: 600,
          '& pre': {
            margin: 0,
            padding: 2,
            fontSize: '0.875rem',
          },
        }}
      >
        <SyntaxHighlighter
          language="json"
          style={atomOneLight}
          customStyle={{
            background: 'transparent',
            padding: 0,
          }}
        >
          {formattedJson}
        </SyntaxHighlighter>
      </Paper>
    </Box>
  );
};
