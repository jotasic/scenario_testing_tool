/**
 * StepList Component
 * Displays a list of steps in the current scenario with add/delete/select actions
 */

import { useState, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  HttpOutlined as HttpIcon,
  AccountTree as ConditionIcon,
  Loop as LoopIcon,
  Folder as GroupIcon,
} from '@mui/icons-material';
import type { Step, StepType, ExecutionMode } from '@/types';
import { useCurrentScenario, useCurrentSteps, useSelectedStepId, useAppDispatch } from '@/store/hooks';
import { addStep, deleteStep } from '@/store/scenariosSlice';
import { setSelectedStep } from '@/store/uiSlice';

const STEP_TYPE_CONFIG: Record<StepType, { icon: React.ReactElement; label: string; color: string }> = {
  request: { icon: <HttpIcon />, label: 'Request', color: '#2196f3' },
  condition: { icon: <ConditionIcon />, label: 'Condition', color: '#ff9800' },
  loop: { icon: <LoopIcon />, label: 'Loop', color: '#9c27b0' },
  group: { icon: <GroupIcon />, label: 'Group', color: '#4caf50' },
};

const EXECUTION_MODE_CONFIG: Record<ExecutionMode, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  auto: { label: 'Auto', color: 'success' },
  manual: { label: 'Manual', color: 'primary' },
  delayed: { label: 'Delayed', color: 'warning' },
  bypass: { label: 'Bypass', color: 'default' },
};

export function StepList() {
  const dispatch = useAppDispatch();
  const scenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleAddStep = useCallback((type: StepType) => {
    if (!scenario) return;

    // Generate unique IDs using crypto.randomUUID for purity
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const stepId = `step_${uniqueId}`;
    const baseStep = {
      id: stepId,
      name: `New ${STEP_TYPE_CONFIG[type].label}`,
      type,
      executionMode: 'auto' as ExecutionMode,
      position: { x: 100, y: 100 + steps.length * 100 },
    };

    let newStep: Step;

    switch (type) {
      case 'request':
        newStep = {
          ...baseStep,
          type: 'request',
          serverId: '',
          method: 'GET',
          endpoint: '',
          headers: [],
          waitForResponse: true,
          saveResponse: true,
        };
        break;
      case 'condition':
        newStep = {
          ...baseStep,
          type: 'condition',
          branches: [],
        };
        break;
      case 'loop': {
        const loopUniqueId = crypto.randomUUID().slice(0, 8);
        newStep = {
          ...baseStep,
          type: 'loop',
          loop: {
            id: `loop_${loopUniqueId}`,
            type: 'count',
            count: 1,
          },
          stepIds: [],
          variableName: `loop_${loopUniqueId}`,
        };
        break;
      }
      case 'group':
        newStep = {
          ...baseStep,
          type: 'group',
          stepIds: [],
        };
        break;
    }

    dispatch(addStep({ scenarioId: scenario.id, step: newStep }));
    dispatch(setSelectedStep(stepId));
    handleAddMenuClose();
  }, [scenario, steps.length, dispatch]);

  const handleSelectStep = (stepId: string) => {
    dispatch(setSelectedStep(stepId));
  };

  const handleDeleteStep = (stepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!scenario) return;

    if (confirm('Are you sure you want to delete this step?')) {
      dispatch(deleteStep({ scenarioId: scenario.id, stepId }));
      if (selectedStepId === stepId) {
        dispatch(setSelectedStep(null));
      }
    }
  };

  if (!scenario) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No scenario selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Steps</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          variant="contained"
          size="small"
        >
          Add Step
        </Button>
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={handleAddMenuClose}
        >
          {(Object.keys(STEP_TYPE_CONFIG) as StepType[]).map((type) => (
            <MenuItem key={type} onClick={() => handleAddStep(type)}>
              <ListItemIcon sx={{ color: STEP_TYPE_CONFIG[type].color }}>
                {STEP_TYPE_CONFIG[type].icon}
              </ListItemIcon>
              <ListItemText>{STEP_TYPE_CONFIG[type].label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {steps.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No steps yet. Click "Add Step" to get started.
            </Typography>
          </Box>
        ) : (
          steps.map((step) => (
            <ListItem
              key={step.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => handleDeleteStep(step.id, e)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton
                selected={selectedStepId === step.id}
                onClick={() => handleSelectStep(step.id)}
              >
                <ListItemIcon sx={{ color: STEP_TYPE_CONFIG[step.type].color }}>
                  {STEP_TYPE_CONFIG[step.type].icon}
                </ListItemIcon>
                <ListItemText
                  primary={step.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip
                        label={STEP_TYPE_CONFIG[step.type].label}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: STEP_TYPE_CONFIG[step.type].color,
                          color: 'white',
                        }}
                      />
                      <Chip
                        label={EXECUTION_MODE_CONFIG[step.executionMode].label}
                        size="small"
                        color={EXECUTION_MODE_CONFIG[step.executionMode].color}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}
