/**
 * LoopStepEditor Component
 * Editor for loop step configuration with support for forEach, count, and while loops
 */

import { useMemo, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Button,
  Menu,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { LoopStep, LoopType, ForEachLoop, CountLoop, WhileLoop, Step, RequestStep, ConditionStep, LoopStep as LoopStepType, GroupStep } from '@/types';
import { useCurrentSteps, useCurrentScenario, useAppDispatch } from '@/store/hooks';
import { addStep } from '@/store/scenariosSlice';
import { ConditionBuilder } from './ConditionBuilder';

interface LoopStepEditorProps {
  step: LoopStep;
  onChange: (changes: Partial<LoopStep>) => void;
}

const getStepColor = (type: string) => {
  switch (type) {
    case 'request':
      return '#1976d2';
    case 'condition':
      return '#ed6c02';
    case 'loop':
      return '#9c27b0';
    case 'group':
      return '#0288d1';
    default:
      return '#757575';
  }
};

export function LoopStepEditor({ step, onChange }: LoopStepEditorProps) {
  const steps = useCurrentSteps();
  const scenario = useCurrentScenario();
  const dispatch = useAppDispatch();
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);

  // Get available steps (not already in this loop and not this step itself)
  const availableSteps = useMemo(() => {
    return steps.filter(
      (s) => s.id !== step.id && !step.stepIds.includes(s.id)
    );
  }, [steps, step.id, step.stepIds]);

  // Get current child steps with their full data
  const childSteps = useMemo(() => {
    return step.stepIds
      .map((id) => steps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined);
  }, [step.stepIds, steps]);

  const handleLoopTypeChange = (type: LoopType) => {
    let newLoop;
    switch (type) {
      case 'forEach':
        newLoop = {
          id: step.loop.id,
          type: 'forEach',
          source: '',
          itemAlias: 'item',
        } as ForEachLoop;
        break;
      case 'count':
        newLoop = {
          id: step.loop.id,
          type: 'count',
          count: 1,
        } as CountLoop;
        break;
      case 'while':
        newLoop = {
          id: step.loop.id,
          type: 'while',
          condition: {
            id: `cond_${Date.now()}`,
            source: 'params',
            field: '',
            operator: '==',
          },
        } as WhileLoop;
        break;
    }
    onChange({ loop: newLoop });
  };

  const handleLoopChange = (field: string, value: any) => {
    onChange({
      loop: {
        ...step.loop,
        [field]: value,
      },
    });
  };

  const handleAddStep = useCallback(
    (stepId: string) => {
      if (stepId && !step.stepIds.includes(stepId)) {
        onChange({
          stepIds: [...step.stepIds, stepId],
        });
      }
    },
    [step.stepIds, onChange]
  );

  const handleRemoveStep = useCallback(
    (stepId: string, stepName: string) => {
      if (
        confirm(
          `Remove "${stepName}" from this loop?\n\nThe step will become a standalone step in the flow.`
        )
      ) {
        onChange({
          stepIds: step.stepIds.filter((id) => id !== stepId),
        });
      }
    },
    [step.stepIds, onChange]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        const newStepIds = [...step.stepIds];
        const [removed] = newStepIds.splice(index, 1);
        newStepIds.splice(index - 1, 0, removed);
        onChange({ stepIds: newStepIds });
      }
    },
    [step.stepIds, onChange]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < step.stepIds.length - 1) {
        const newStepIds = [...step.stepIds];
        const [removed] = newStepIds.splice(index, 1);
        newStepIds.splice(index + 1, 0, removed);
        onChange({ stepIds: newStepIds });
      }
    },
    [step.stepIds, onChange]
  );

  const handleCreateNewStep = useCallback(
    (stepType: 'request' | 'condition' | 'loop' | 'group') => {
      if (!scenario) return;

      const timestamp = Date.now();
      const stepId = `step_${timestamp}`;

      // Calculate position near the loop node
      const baseX = step.position.x + 50;
      const baseY = step.position.y + 100 + (step.stepIds.length * 80);

      let newStep: Step;

      if (stepType === 'request') {
        newStep = {
          id: stepId,
          name: `New Request`,
          type: 'request',
          description: '',
          executionMode: 'auto',
          position: { x: baseX, y: baseY },
          serverId: '',
          method: 'GET',
          endpoint: '',
          headers: [],
          waitForResponse: true,
          saveResponse: true,
        } as RequestStep;
      } else if (stepType === 'condition') {
        newStep = {
          id: stepId,
          name: `New Condition`,
          type: 'condition',
          description: '',
          executionMode: 'auto',
          position: { x: baseX, y: baseY },
          branches: [],
        } as ConditionStep;
      } else if (stepType === 'loop') {
        newStep = {
          id: stepId,
          name: `New Loop`,
          type: 'loop',
          description: '',
          executionMode: 'auto',
          position: { x: baseX, y: baseY },
          loop: {
            id: `loop_${timestamp}`,
            type: 'count',
            count: 1,
          },
          stepIds: [],
        } as LoopStepType;
      } else {
        newStep = {
          id: stepId,
          name: `New Group`,
          type: 'group',
          description: '',
          executionMode: 'auto',
          position: { x: baseX, y: baseY },
          stepIds: [],
        } as GroupStep;
      }

      // Add step to scenario
      dispatch(addStep({ scenarioId: scenario.id, step: newStep }));

      // Add step to loop
      onChange({
        stepIds: [...step.stepIds, stepId],
      });

      setCreateMenuAnchor(null);
    },
    [scenario, step, onChange, dispatch]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Loop Type Selection */}
      <FormControl fullWidth>
        <InputLabel>Loop Type</InputLabel>
        <Select
          value={step.loop.type}
          label="Loop Type"
          onChange={(e) => handleLoopTypeChange(e.target.value as LoopType)}
        >
          <MenuItem value="forEach">For Each (iterate over array)</MenuItem>
          <MenuItem value="count">Count (fixed iterations)</MenuItem>
          <MenuItem value="while">While (condition-based)</MenuItem>
        </Select>
      </FormControl>

      {/* Loop Configuration Based on Type */}
      {step.loop.type === 'forEach' && (
        <>
          <TextField
            label="Source Array"
            value={(step.loop as ForEachLoop).source}
            onChange={(e) => handleLoopChange('source', e.target.value)}
            placeholder="params.items or responses.stepId.data"
            helperText="JSON path to the array to iterate over"
            fullWidth
          />
          <TextField
            label="Item Alias"
            value={(step.loop as ForEachLoop).itemAlias}
            onChange={(e) => handleLoopChange('itemAlias', e.target.value)}
            placeholder="item"
            helperText="Variable name for current item (e.g., 'item', 'user')"
            fullWidth
          />
          <TextField
            label="Index Alias (optional)"
            value={(step.loop as ForEachLoop).indexAlias || ''}
            onChange={(e) => handleLoopChange('indexAlias', e.target.value || undefined)}
            placeholder="index"
            helperText="Variable name for current index"
            fullWidth
          />
          <TextField
            label="Count Field (optional)"
            value={(step.loop as ForEachLoop).countField || ''}
            onChange={(e) => handleLoopChange('countField', e.target.value || undefined)}
            placeholder="count"
            helperText="Field in each item specifying repeat count"
            fullWidth
          />
        </>
      )}

      {step.loop.type === 'count' && (
        <TextField
          label="Iteration Count"
          value={(step.loop as CountLoop).count}
          onChange={(e) => {
            const value = e.target.value;
            handleLoopChange('count', isNaN(Number(value)) ? value : Number(value));
          }}
          placeholder="10 or ${params.count}"
          helperText="Number of iterations or variable reference"
          fullWidth
        />
      )}

      {step.loop.type === 'while' && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Loop Condition
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Loop continues while this condition is true
          </Typography>
          <ConditionBuilder
            value={(step.loop as WhileLoop).condition}
            onChange={(condition) => {
              if (condition) {
                handleLoopChange('condition', condition);
              }
            }}
          />
        </Box>
      )}

      {/* Max Iterations Safety Limit */}
      <TextField
        label="Max Iterations (safety limit)"
        type="number"
        value={step.loop.maxIterations || ''}
        onChange={(e) =>
          handleLoopChange('maxIterations', e.target.value ? parseInt(e.target.value) : undefined)
        }
        helperText="Optional: Prevent infinite loops"
        fullWidth
      />

      <Divider />

      {/* Child Steps Selection - Improved UI */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Steps to Execute in Loop
        </Typography>

        {/* Add/Create Step Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {/* Add Existing Step Select */}
          <FormControl fullWidth>
            <InputLabel>Add Existing Step</InputLabel>
            <Select
              value=""
              label="Add Existing Step"
              onChange={(e) => handleAddStep(e.target.value)}
            >
              {availableSteps.length === 0 ? (
                <MenuItem disabled>No available steps</MenuItem>
              ) : (
                availableSteps.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={s.type}
                        size="small"
                        sx={{
                          bgcolor: `${getStepColor(s.type)}15`,
                          color: getStepColor(s.type),
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Create New Step Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
            sx={{ minWidth: 180 }}
          >
            Create New Step
          </Button>
          <Menu
            anchorEl={createMenuAnchor}
            open={Boolean(createMenuAnchor)}
            onClose={() => setCreateMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleCreateNewStep('request')}>
              <Chip
                label="request"
                size="small"
                sx={{
                  bgcolor: `${getStepColor('request')}15`,
                  color: getStepColor('request'),
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  mr: 1,
                }}
              />
              Request Step
            </MenuItem>
            <MenuItem onClick={() => handleCreateNewStep('condition')}>
              <Chip
                label="condition"
                size="small"
                sx={{
                  bgcolor: `${getStepColor('condition')}15`,
                  color: getStepColor('condition'),
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  mr: 1,
                }}
              />
              Condition Step
            </MenuItem>
            <MenuItem onClick={() => handleCreateNewStep('loop')}>
              <Chip
                label="loop"
                size="small"
                sx={{
                  bgcolor: `${getStepColor('loop')}15`,
                  color: getStepColor('loop'),
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  mr: 1,
                }}
              />
              Loop Step (nested)
            </MenuItem>
            <MenuItem onClick={() => handleCreateNewStep('group')}>
              <Chip
                label="group"
                size="small"
                sx={{
                  bgcolor: `${getStepColor('group')}15`,
                  color: getStepColor('group'),
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  mr: 1,
                }}
              />
              Group Step (nested)
            </MenuItem>
          </Menu>
        </Box>

        {/* Child Steps List */}
        <Paper variant="outlined" sx={{ p: 0 }}>
          <Box
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: '#f3e5f5',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#9c27b0' }}>
              Loop Body ({childSteps.length} step{childSteps.length !== 1 ? 's' : ''})
            </Typography>
          </Box>

          {childSteps.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                No steps in loop body yet.
              </Typography>
              <Typography variant="caption">
                Use the dropdown above to add steps.
              </Typography>
            </Box>
          ) : (
            <List dense>
              {childSteps.map((childStep, index) => (
                <ListItem
                  key={childStep.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <Typography variant="caption">^</Typography>
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === childSteps.length - 1}
                        title="Move down"
                      >
                        <Typography variant="caption">v</Typography>
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="warning"
                        onClick={() => handleRemoveStep(childStep.id, childStep.name)}
                        title="Remove from loop (step will become standalone)"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    borderBottom: index < childSteps.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Typography variant="caption" color="text.secondary">
                      {index + 1}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={childStep.type}
                          size="small"
                          sx={{
                            bgcolor: `${getStepColor(childStep.type)}15`,
                            color: getStepColor(childStep.type),
                            fontWeight: 600,
                            fontSize: '0.6rem',
                            height: 18,
                          }}
                        />
                        <Typography variant="body2">{childStep.name}</Typography>
                      </Box>
                    }
                    secondary={childStep.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Execution order info */}
        {childSteps.length > 1 && (
          <Alert severity="info" icon={false} sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Execution Order:</strong>{' '}
              {childSteps.map((s) => s.name).join(' → ')} → (repeat)
            </Typography>
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          These steps will be executed in each iteration
        </Typography>
      </Box>
    </Box>
  );
}
