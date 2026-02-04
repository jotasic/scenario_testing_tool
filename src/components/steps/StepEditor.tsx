/**
 * StepEditor Component
 * Main editor that routes to appropriate step type editor
 */

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
} from '@mui/material';
import type { Step, ExecutionMode } from '@/types';
import { useCurrentScenario, useSelectedStep, useAppDispatch } from '@/store/hooks';
import { updateStep } from '@/store/scenariosSlice';
import { RequestStepEditor } from './RequestStepEditor';
import { ConditionStepEditor } from './ConditionStepEditor';
import { LoopStepEditor } from './LoopStepEditor';
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

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6">Edit Step: {step.name}</Typography>

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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Group steps are organizational containers. Use the flow editor to add steps to this group.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Child Steps</InputLabel>
              <Select
                multiple
                value={step.stepIds}
                label="Child Steps"
                disabled
                renderValue={(selected) => `${selected.length} step(s)`}
              >
                <MenuItem value="">Configure in flow editor</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
