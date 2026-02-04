/**
 * ServerEditor Component
 * Server detail editor form with name, URL, timeout, description, and headers
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAppDispatch } from '@/store/hooks';
import { updateServer } from '@/store/serversSlice';
import type { Server, ServerHeader } from '@/types';
import { ServerHeaderEditor } from './ServerHeaderEditor';

interface ServerEditorProps {
  server: Server | null;
}

export function ServerEditor({ server }: ServerEditorProps) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [timeout, setTimeoutValue] = useState('30000');
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState<ServerHeader[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load server data when selected
  useEffect(() => {
    if (server) {
      setName(server.name);
      setBaseUrl(server.baseUrl);
      setTimeoutValue(String(server.timeout));
      setDescription(server.description || '');
      setHeaders(server.headers);
      setErrors({});
      setSuccessMessage('');
    }
  }, [server]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required';
    } else {
      try {
        new URL(baseUrl);
      } catch {
        newErrors.baseUrl = 'Invalid URL format';
      }
    }

    const timeoutNum = parseInt(timeout, 10);
    if (isNaN(timeoutNum) || timeoutNum <= 0) {
      newErrors.timeout = 'Timeout must be a positive number';
    }

    // Validate headers
    headers.forEach((header, index) => {
      if (header.enabled && !header.key.trim()) {
        newErrors[`header_key_${index}`] =
          'Header key is required when enabled';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!server) return;

    if (!validate()) {
      setSuccessMessage('');
      return;
    }

    dispatch(
      updateServer({
        id: server.id,
        changes: {
          name,
          baseUrl,
          timeout: parseInt(timeout, 10),
          description: description.trim() || undefined,
          headers,
        },
      })
    );

    setSuccessMessage('Server updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (!server) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a server to edit its configuration
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Server Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Edit server connection settings and headers
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          helperText={
            errors.name || 'Unique identifier for this server (e.g., mock_server)'
          }
          fullWidth
          required
          size="small"
        />

        <TextField
          label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          error={!!errors.baseUrl}
          helperText={
            errors.baseUrl ||
            'Full base URL including protocol (e.g., https://api.example.com)'
          }
          fullWidth
          required
          size="small"
          placeholder="https://api.example.com"
        />

        <TextField
          label="Timeout (ms)"
          type="number"
          value={timeout}
          onChange={(e) => setTimeoutValue(e.target.value)}
          error={!!errors.timeout}
          helperText={errors.timeout || 'Request timeout in milliseconds'}
          fullWidth
          required
          size="small"
          inputProps={{ min: 1, step: 1000 }}
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText="Optional description of the server's purpose"
          fullWidth
          multiline
          rows={3}
          size="small"
        />

        <Divider />

        <ServerHeaderEditor headers={headers} onChange={setHeaders} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            size="large"
          >
            Save Changes
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
