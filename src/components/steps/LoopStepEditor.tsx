/**
 * LoopStepEditor Component
 * Editor for loop step configuration with support for forEach, count, and while loops
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
} from '@mui/material';
import type { LoopStep, LoopType, ForEachLoop, CountLoop, WhileLoop } from '@/types';
import { useCurrentSteps } from '@/store/hooks';
import { ConditionBuilder } from './ConditionBuilder';

interface LoopStepEditorProps {
  step: LoopStep;
  onChange: (changes: Partial<LoopStep>) => void;
}

export function LoopStepEditor({ step, onChange }: LoopStepEditorProps) {
  const steps = useCurrentSteps();
  const availableSteps = steps.filter((s) => s.id !== step.id);

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

      {/* Child Steps Selection */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Steps to Execute in Loop
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Child Steps</InputLabel>
          <Select
            multiple
            value={step.stepIds}
            label="Child Steps"
            onChange={(e) =>
              onChange({ stepIds: typeof e.target.value === 'string' ? [] : e.target.value })
            }
            renderValue={(selected) => {
              const selectedSteps = steps.filter((s) => selected.includes(s.id));
              return selectedSteps.map((s) => s.name).join(', ');
            }}
          >
            {availableSteps.map((availableStep) => (
              <MenuItem key={availableStep.id} value={availableStep.id}>
                {availableStep.name} ({availableStep.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          These steps will be executed in each iteration
        </Typography>
      </Box>
    </Box>
  );
}
