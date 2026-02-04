/**
 * AddServerDialog Component
 * Dialog for creating a new server configuration
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import type { Server } from '@/types';

interface AddServerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (server: Server) => void;
}

export function AddServerDialog({ open, onClose, onAdd }: AddServerDialogProps) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; baseUrl?: string }>({});

  const resetForm = useCallback(() => {
    setName('');
    setBaseUrl('https://');
    setDescription('');
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validate = useCallback(() => {
    const newErrors: { name?: string; baseUrl?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Server name is required';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, baseUrl]);

  const handleSubmit = useCallback(() => {
    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const newServer: Server = {
      id: uuidv4(),
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      description: description.trim() || undefined,
      headers: [],
      timeout: 30000,
      createdAt: now,
      updatedAt: now,
    };

    onAdd(newServer);
    handleClose();
  }, [name, baseUrl, description, validate, onAdd, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="add-server-dialog-title"
    >
      <DialogTitle id="add-server-dialog-title">Add New Server</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Server Name"
            placeholder="e.g., Production API"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Base URL"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            error={!!errors.baseUrl}
            helperText={errors.baseUrl}
            fullWidth
            required
          />
          <TextField
            label="Description"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Server
        </Button>
      </DialogActions>
    </Dialog>
  );
}
