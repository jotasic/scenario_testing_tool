/**
 * StepEditor Component
 * Main editor that routes to appropriate step type editor
 */

import { useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  Delete as DeleteIcon,
  MoveDown as MoveIcon,
  ExitToApp as RemoveIcon,
} from '@mui/icons-material';
import type { Step, ExecutionMode, LoopStep, GroupStep } from '@/types';
import { useCurrentScenario, useSelectedStep, useAppDispatch } from '@/store/hooks';
import {
  updateStep,
  addEdge,
  deleteEdge,
  deleteStep,
  addStepToContainer,
  removeStepFromContainer,
} from '@/store/scenariosSlice';
import { setSelectedStep } from '@/store/uiSlice';
import { RequestStepEditor } from './RequestStepEditor';
import { ConditionStepEditor } from './ConditionStepEditor';
import { LoopStepEditor } from './LoopStepEditor';
import { GroupStepEditor } from './GroupStepEditor';
import { ConditionBuilder } from './ConditionBuilder';

export function StepEditor() {
  const dispatch = useAppDispatch();
  const scenario = useCurrentScenario();
  const step = useSelectedStep();

  if (!scenario || !step) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Select a step to edit
        </Typography>
      </Box>
    );
  }

  const handleCommonChange = (field: keyof Step, value: any) => {
    dispatch(
      updateStep({
        scenarioId: scenario.id,
        stepId: step.id,
        changes: { [field]: value },
      })
    );
  };

  const handleTypeSpecificChange = (changes: Partial<Step>) => {
    dispatch(
      updateStep({
        scenarioId: scenario.id,
        stepId: step.id,
        changes,
      })
    );
  };

  // Find the current next step from edges (default edge, not branch edges)
  const currentNextStep = useMemo(() => {
    const defaultEdge = scenario.edges.find(
      (e) => e.sourceStepId === step.id && !e.sourceHandle?.startsWith('branch_')
    );
    return defaultEdge?.targetStepId || '';
  }, [scenario.edges, step.id]);

  // Get other steps (excluding current step) for next step selection
  const otherSteps = useMemo(() => {
    return scenario.steps.filter((s) => s.id !== step.id);
  }, [scenario.steps, step.id]);

  // Find which container (Loop/Group) this step is inside, if any
  const parentContainer = useMemo(() => {
    return scenario.steps.find(
      (s) =>
        (s.type === 'loop' || s.type === 'group') &&
        (s as LoopStep | GroupStep).stepIds.includes(step.id)
    ) as (LoopStep | GroupStep) | undefined;
  }, [scenario.steps, step.id]);

  // Get available containers (Loop/Group) that this step can be moved into
  const availableContainers = useMemo(() => {
    return scenario.steps.filter(
      (s) =>
        (s.type === 'loop' || s.type === 'group') &&
        s.id !== step.id &&
        !(s as LoopStep | GroupStep).stepIds.includes(step.id)
    ) as (LoopStep | GroupStep)[];
  }, [scenario.steps, step.id]);

  // Handle next step change - creates or updates edge
  const handleNextStepChange = (nextStepId: string) => {
    // Find existing default edge from this step
    const existingEdge = scenario.edges.find(
      (e) => e.sourceStepId === step.id && !e.sourceHandle?.startsWith('branch_')
    );

    if (nextStepId === '') {
      // Remove edge if clearing the selection
      if (existingEdge) {
        dispatch(
          deleteEdge({
            scenarioId: scenario.id,
            edgeId: existingEdge.id,
          })
        );
      }
    } else if (existingEdge) {
      // Update existing edge target - delete and recreate
      dispatch(
        deleteEdge({
          scenarioId: scenario.id,
          edgeId: existingEdge.id,
        })
      );
      dispatch(
        addEdge({
          scenarioId: scenario.id,
          edge: {
            id: `edge_${Date.now()}`,
            sourceStepId: step.id,
            targetStepId: nextStepId,
          },
        })
      );
    } else {
      // Create new edge
      dispatch(
        addEdge({
          scenarioId: scenario.id,
          edge: {
            id: `edge_${Date.now()}`,
            sourceStepId: step.id,
            targetStepId: nextStepId,
          },
        })
      );
    }
  };

  // Handle delete step
  const handleDeleteStep = () => {
    if (confirm('Are you sure you want to delete this step?')) {
      dispatch(deleteStep({ scenarioId: scenario.id, stepId: step.id }));
      dispatch(setSelectedStep(null));
    }
  };

  // Handle moving step into a container
  const handleMoveToContainer = (containerId: string) => {
    if (!containerId) return;

    dispatch(
      addStepToContainer({
        scenarioId: scenario.id,
        containerId,
        stepId: step.id,
      })
    );
  };

  // Handle removing step from its parent container
  const handleRemoveFromContainer = () => {
    if (!parentContainer) return;

    if (
      confirm(
        `Remove "${step.name}" from ${parentContainer.type} "${parentContainer.name}"?\n\nThe step will become a standalone step in the flow.`
      )
    ) {
      dispatch(
        removeStepFromContainer({
          scenarioId: scenario.id,
          containerId: parentContainer.id,
          stepId: step.id,
        })
      );
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with delete button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Edit Step: {step.name}</Typography>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteStep}
          aria-label="Delete step"
        >
          Delete
        </Button>
      </Box>

      <Divider />

      {/* Common Fields */}
      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Basic Information
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Step Name"
            value={step.name}
            onChange={(e) => handleCommonChange('name', e.target.value)}
            fullWidth
          />

          <TextField
            label="Description"
            value={step.description || ''}
            onChange={(e) => handleCommonChange('description', e.target.value)}
            multiline
            rows={2}
            placeholder="Optional description of this step"
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Execution Mode</InputLabel>
            <Select
              value={step.executionMode}
              label="Execution Mode"
              onChange={(e) => handleCommonChange('executionMode', e.target.value as ExecutionMode)}
            >
              <MenuItem value="auto">Auto - Execute immediately</MenuItem>
              <MenuItem value="manual">Manual - Wait for confirmation</MenuItem>
              <MenuItem value="delayed">Delayed - Execute after delay</MenuItem>
              <MenuItem value="bypass">Bypass - Skip execution</MenuItem>
            </Select>
          </FormControl>

          {step.executionMode === 'delayed' && (
            <TextField
              label="Delay (milliseconds)"
              type="number"
              value={step.delayMs || 0}
              onChange={(e) => handleCommonChange('delayMs', parseInt(e.target.value))}
              fullWidth
            />
          )}
        </Box>
      </Paper>

      {/* Next Step - Flow Control */}
      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowIcon fontSize="small" />
          Next Step (Flow Control)
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Next Step</InputLabel>
          <Select
            value={currentNextStep}
            label="Next Step"
            onChange={(e) => handleNextStepChange(e.target.value)}
          >
            <MenuItem value="">
              <em>(End of flow)</em>
            </MenuItem>
            {otherSteps.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="caption">
            Select the step to execute after this one completes.
            <br />
            You can also drag edges in the graph view.
            {step.type === 'condition' && (
              <>
                <br />
                <strong>Note:</strong> Condition steps use branches to determine flow. Configure branches below.
              </>
            )}
          </Typography>
        </Alert>
      </Paper>

      {/* Container Management - Move to/from Loop/Group */}
      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoveIcon fontSize="small" />
          Container Management
        </Typography>

        {parentContainer ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ alignItems: 'center' }}>
              <Typography variant="body2">
                This step is currently inside: <strong>{parentContainer.name}</strong> ({parentContainer.type})
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RemoveIcon />}
              onClick={handleRemoveFromContainer}
              fullWidth
            >
              Remove from {parentContainer.type}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Move this step inside a Loop or Group container
              {(step.type === 'loop' || step.type === 'group') && (
                <Typography component="span" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', fontSize: '0.875rem' }}>
                  (Nested containers supported)
                </Typography>
              )}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Move to Container</InputLabel>
              <Select
                value=""
                label="Move to Container"
                onChange={(e) => handleMoveToContainer(e.target.value)}
              >
                {availableContainers.length === 0 ? (
                  <MenuItem disabled>No available containers</MenuItem>
                ) : (
                  availableContainers.map((container) => (
                    <MenuItem key={container.id} value={container.id}>
                      {container.name} ({container.type})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {availableContainers.length === 0 && (
              <Alert severity="info">
                <Typography variant="caption">
                  Create a Loop or Group step first to organize steps together.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Pre-condition */}
      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Pre-condition (optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Step will only execute if this condition is met
        </Typography>
        <ConditionBuilder
          value={step.condition}
          onChange={(condition) => handleCommonChange('condition', condition)}
        />
      </Paper>

      <Divider />

      {/* Type-specific Editor */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'capitalize' }}>
          {step.type} Configuration
        </Typography>

        {step.type === 'request' && (
          <RequestStepEditor step={step} onChange={handleTypeSpecificChange} />
        )}

        {step.type === 'condition' && (
          <ConditionStepEditor step={step} onChange={handleTypeSpecificChange} />
        )}

        {step.type === 'loop' && (
          <LoopStepEditor step={step} onChange={handleTypeSpecificChange} />
        )}

        {step.type === 'group' && (
          <GroupStepEditor
            step={step}
            allSteps={scenario.steps}
            onChange={handleTypeSpecificChange}
          />
        )}
      </Paper>

      {/* Save indicator - changes are saved automatically in Redux */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary">
          Changes are saved automatically
        </Typography>
      </Box>
    </Box>
  );
}
