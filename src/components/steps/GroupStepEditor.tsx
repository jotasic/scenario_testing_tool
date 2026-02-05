/**
 * GroupStepEditor Component
 * Editor for configuring group step - selecting child steps to include in the group
 */

import { useMemo, useCallback, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Menu,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { GroupStep, Step, RequestStep, ConditionStep, LoopStep } from '@/types';
import { useCurrentScenario, useAppDispatch } from '@/store/hooks';
import { addStep } from '@/store/scenariosSlice';
import { wouldExceedNestingLimit, getNestingLimitMessage } from '@/utils/nestingUtils';

interface GroupStepEditorProps {
  step: GroupStep;
  allSteps: Step[];
  onChange: (changes: Partial<GroupStep>) => void;
}

export function GroupStepEditor({ step, allSteps, onChange }: GroupStepEditorProps) {
  const scenario = useCurrentScenario();
  const dispatch = useAppDispatch();
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);

  // Check if adding nested containers would exceed the nesting limit
  const exceedsNestingLimit = useMemo(() => {
    return wouldExceedNestingLimit(step.id, allSteps);
  }, [step.id, allSteps]);

  // Get available steps (not already in this group and not this step itself)
  const availableSteps = useMemo(() => {
    return allSteps.filter(
      (s) => s.id !== step.id && !step.stepIds.includes(s.id)
    );
  }, [allSteps, step.id, step.stepIds]);

  // Get current child steps with their full data
  const childSteps = useMemo(() => {
    return step.stepIds
      .map((id) => allSteps.find((s) => s.id === id))
      .filter((s): s is Step => s !== undefined);
  }, [step.stepIds, allSteps]);

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
          `Remove "${stepName}" from this group?\n\nThe step will become a standalone step in the flow.`
        )
      ) {
        onChange({
          stepIds: step.stepIds.filter((id) => id !== stepId),
        });
      }
    },
    [step.stepIds, onChange]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newStepIds = [...step.stepIds];
      const [removed] = newStepIds.splice(fromIndex, 1);
      newStepIds.splice(toIndex, 0, removed);
      onChange({ stepIds: newStepIds });
    },
    [step.stepIds, onChange]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        handleReorder(index, index - 1);
      }
    },
    [handleReorder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < step.stepIds.length - 1) {
        handleReorder(index, index + 1);
      }
    },
    [handleReorder, step.stepIds.length]
  );

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'primary';
      case 'condition':
        return 'warning';
      case 'loop':
        return 'secondary';
      case 'group':
        return 'info';
      default:
        return 'default';
    }
  };

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

  const handleCreateNewStep = useCallback(
    (stepType: 'request' | 'condition' | 'loop' | 'group') => {
      if (!scenario) return;

      const timestamp = Date.now();
      const stepId = `step_${timestamp}`;

      // Calculate position near the group node
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
        } as LoopStep;
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

      // Add step to group
      onChange({
        stepIds: [...step.stepIds, stepId],
      });

      setCreateMenuAnchor(null);
    },
    [scenario, step, onChange, dispatch]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Collapsed toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={step.collapsed ?? false}
            onChange={(e) => onChange({ collapsed: e.target.checked })}
          />
        }
        label="Collapsed in flow view"
      />

      {/* Info */}
      <Alert severity="info">
        <Typography variant="body2">
          Groups organize multiple steps together. Steps in a group are executed
          sequentially in the order listed below.
        </Typography>
      </Alert>

      {/* Add/Create Step Controls */}
      <Box sx={{ display: 'flex', gap: 1 }}>
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
                      color={getStepTypeColor(s.type)}
                      variant="outlined"
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
          <Tooltip
            title={exceedsNestingLimit ? getNestingLimitMessage() : ''}
            placement="left"
          >
            <span>
              <MenuItem
                onClick={() => handleCreateNewStep('loop')}
                disabled={exceedsNestingLimit}
              >
                <Chip
                  label="loop"
                  size="small"
                  sx={{
                    bgcolor: `${getStepColor('loop')}15`,
                    color: exceedsNestingLimit ? 'text.disabled' : getStepColor('loop'),
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 20,
                    mr: 1,
                  }}
                />
                Loop Step (nested)
              </MenuItem>
            </span>
          </Tooltip>
          <Tooltip
            title={exceedsNestingLimit ? getNestingLimitMessage() : ''}
            placement="left"
          >
            <span>
              <MenuItem
                onClick={() => handleCreateNewStep('group')}
                disabled={exceedsNestingLimit}
              >
                <Chip
                  label="group"
                  size="small"
                  sx={{
                    bgcolor: `${getStepColor('group')}15`,
                    color: exceedsNestingLimit ? 'text.disabled' : getStepColor('group'),
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 20,
                    mr: 1,
                  }}
                />
                Group Step (nested)
              </MenuItem>
            </span>
          </Tooltip>
        </Menu>
      </Box>

      {/* Child Steps List */}
      <Paper variant="outlined" sx={{ p: 0 }}>
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="subtitle2">
            Steps in Group ({childSteps.length})
          </Typography>
        </Box>

        {childSteps.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No steps in this group yet.
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
                      title="Remove from group (step will become standalone)"
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
                        color={getStepTypeColor(childStep.type)}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
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
        <Alert severity="success" icon={false}>
          <Typography variant="caption">
            <strong>Execution Order:</strong>{' '}
            {childSteps.map((s) => s.name).join(' -> ')}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
