/**
 * AddStepDialog Component
 * Dialog for creating a new step with type selection
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
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Http as HttpIcon,
  CallSplit as ConditionIcon,
  Loop as LoopIcon,
  Folder as GroupIcon,
} from '@mui/icons-material';
import type { Step, StepType } from '@/types';
import { createDefaultStep, getNewNodePosition } from '@/utils/stepFactory';

interface AddStepDialogProps {
  open: boolean;
  existingSteps: Step[];
  onClose: () => void;
  onAdd: (step: Step) => void;
}

const stepTypeInfo: Record<StepType, { icon: React.ReactNode; label: string; description: string }> = {
  request: {
    icon: <HttpIcon />,
    label: 'Request',
    description: 'Make an HTTP request to an API endpoint',
  },
  condition: {
    icon: <ConditionIcon />,
    label: 'Condition',
    description: 'Branch execution based on conditions',
  },
  loop: {
    icon: <LoopIcon />,
    label: 'Loop',
    description: 'Repeat steps multiple times',
  },
  group: {
    icon: <GroupIcon />,
    label: 'Group',
    description: 'Organize steps into a logical group',
  },
};

export function AddStepDialog({ open, existingSteps, onClose, onAdd }: AddStepDialogProps) {
  const [stepType, setStepType] = useState<StepType>('request');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const resetForm = useCallback(() => {
    setStepType('request');
    setName('');
    setDescription('');
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validate = useCallback(() => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Step name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name]);

  const handleSubmit = useCallback(() => {
    if (!validate()) {
      return;
    }

    const position = getNewNodePosition(existingSteps);
    const newStep = createDefaultStep(stepType, position);

    // Override default name and description
    newStep.name = name.trim();
    if (description.trim()) {
      newStep.description = description.trim();
    }

    onAdd(newStep);
    handleClose();
  }, [stepType, name, description, existingSteps, validate, onAdd, handleClose]);

  const handleTypeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newType: StepType | null) => {
      if (newType !== null) {
        setStepType(newType);
        // Set default name based on type if name is empty or matches a default
        if (!name || name.startsWith('New ')) {
          setName(`New ${newType.charAt(0).toUpperCase()}${newType.slice(1)}`);
        }
      }
    },
    [name]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="add-step-dialog-title"
    >
      <DialogTitle id="add-step-dialog-title">Add New Step</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Step Type Selection */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Step Type
            </Typography>
            <ToggleButtonGroup
              value={stepType}
              exclusive
              onChange={handleTypeChange}
              aria-label="step type"
              fullWidth
            >
              {(Object.keys(stepTypeInfo) as StepType[]).map((type) => (
                <ToggleButton key={type} value={type} aria-label={type}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {stepTypeInfo[type].icon}
                    <span>{stepTypeInfo[type].label}</span>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {stepTypeInfo[stepType].description}
            </Typography>
          </Box>

          {/* Step Name */}
          <TextField
            label="Step Name"
            placeholder="e.g., Login Request"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
          />

          {/* Step Description */}
          <TextField
            label="Description"
            placeholder="Optional description of what this step does"
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
          Add Step
        </Button>
      </DialogActions>
    </Dialog>
  );
}
