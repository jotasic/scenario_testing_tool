/**
 * ServerHeaderEditor Component
 * Manages key-value pairs for server headers with add/remove functionality
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Stack,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import type { ServerHeader } from '@/types';

interface ServerHeaderEditorProps {
  headers: ServerHeader[];
  onChange: (headers: ServerHeader[]) => void;
  disabled?: boolean;
}

export function ServerHeaderEditor({
  headers,
  onChange,
  disabled = false,
}: ServerHeaderEditorProps) {
  const [showHint, setShowHint] = useState(false);

  const handleAddHeader = () => {
    onChange([
      ...headers,
      {
        key: '',
        value: '',
        enabled: true,
      },
    ]);
  };

  const handleDeleteHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (
    index: number,
    field: keyof ServerHeader,
    value: string | boolean
  ) => {
    const updated = headers.map((header, i) =>
      i === index ? { ...header, [field]: value } : header
    );
    onChange(updated);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Headers
        </Typography>
        <Tooltip title="Headers support variable references like ${token}">
          <IconButton
            size="small"
            onClick={() => setShowHint(!showHint)}
            aria-label="Show variable hint"
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {showHint && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.lighter' }} elevation={0}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <InfoIcon fontSize="small" color="info" />
            <Typography variant="body2" fontWeight="medium" color="info.dark">
              Variable References
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Use variable references in header values:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              <Chip label="${token}" size="small" sx={{ mr: 1 }} /> - Reference
              a parameter
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <Chip
                label="${response.step_id.field}"
                size="small"
                sx={{ mr: 1 }}
              />{' '}
              - Reference a step response
            </Typography>
          </Box>
        </Paper>
      )}

      <Stack spacing={2}>
        {headers.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No headers configured. Click the button below to add one.
            </Typography>
          </Paper>
        ) : (
          headers.map((header, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: header.enabled ? 'background.paper' : 'action.hover',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <TextField
                  label="Key"
                  value={header.key}
                  onChange={(e) =>
                    handleHeaderChange(index, 'key', e.target.value)
                  }
                  disabled={disabled}
                  size="small"
                  placeholder="Content-Type"
                  fullWidth
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  value={header.value}
                  onChange={(e) =>
                    handleHeaderChange(index, 'value', e.target.value)
                  }
                  disabled={disabled}
                  size="small"
                  placeholder="application/json or ${token}"
                  fullWidth
                  sx={{ flex: 2 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={header.enabled}
                        onChange={(e) =>
                          handleHeaderChange(index, 'enabled', e.target.checked)
                        }
                        disabled={disabled}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="caption" color="text.secondary">
                        Enabled
                      </Typography>
                    }
                    labelPlacement="top"
                    sx={{ m: 0 }}
                  />
                  <IconButton
                    onClick={() => handleDeleteHeader(index)}
                    disabled={disabled}
                    color="error"
                    size="small"
                    aria-label="Delete header"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
            </Paper>
          ))
        )}

        <Box>
          <IconButton
            onClick={handleAddHeader}
            disabled={disabled}
            color="primary"
            size="small"
            aria-label="Add header"
            sx={{
              border: 1,
              borderColor: 'divider',
              borderStyle: 'dashed',
              width: '100%',
              borderRadius: 1,
              py: 1,
            }}
          >
            <AddIcon />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Add Header
            </Typography>
          </IconButton>
        </Box>
      </Stack>
    </Box>
  );
}
