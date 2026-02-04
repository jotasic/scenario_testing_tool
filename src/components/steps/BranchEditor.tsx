/**
 * BranchEditor Component
 * Editor for managing branch configurations with conditions and next step selection
 */

import {
  Box,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Branch } from '@/types';
import { useCurrentSteps } from '@/store/hooks';
import { ConditionBuilder } from './ConditionBuilder';

interface BranchEditorProps {
  branches: Branch[];
  onChange: (branches: Branch[]) => void;
}

export function BranchEditor({ branches, onChange }: BranchEditorProps) {
  const steps = useCurrentSteps();

  const handleAddBranch = () => {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      nextStepId: '',
      label: `Branch ${branches.length + 1}`,
    };
    onChange([...branches, newBranch]);
  };

  const handleDeleteBranch = (index: number) => {
    const newBranches = [...branches];
    newBranches.splice(index, 1);
    onChange(newBranches);
  };

  const handleBranchChange = (index: number, field: keyof Branch, value: any) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index], [field]: value };
    onChange(newBranches);
  };

  const handleToggleDefault = (index: number) => {
    const newBranches = branches.map((branch, i) => ({
      ...branch,
      isDefault: i === index ? !branch.isDefault : false,
    }));
    onChange(newBranches);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">Branches</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddBranch}
          size="small"
          variant="outlined"
        >
          Add Branch
        </Button>
      </Box>

      {branches.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No branches configured. Add at least one branch.
          </Typography>
        </Box>
      ) : (
        branches.map((branch, index) => (
          <Paper key={branch.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <TextField
                label="Branch Label"
                value={branch.label || ''}
                onChange={(e) => handleBranchChange(index, 'label', e.target.value)}
                size="small"
                fullWidth
                sx={{ mr: 2 }}
              />
              <IconButton onClick={() => handleDeleteBranch(index)} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={branch.isDefault || false}
                  onChange={() => handleToggleDefault(index)}
                  size="small"
                />
              }
              label="Default Branch (fallback)"
              sx={{ mb: 2 }}
            />

            {!branch.isDefault && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Condition
                </Typography>
                <ConditionBuilder
                  value={branch.condition}
                  onChange={(condition) => handleBranchChange(index, 'condition', condition)}
                />
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth size="small">
              <InputLabel>Next Step</InputLabel>
              <Select
                value={branch.nextStepId}
                label="Next Step"
                onChange={(e) => handleBranchChange(index, 'nextStepId', e.target.value)}
              >
                <MenuItem value="">
                  <em>None (End)</em>
                </MenuItem>
                {steps.map((step) => (
                  <MenuItem key={step.id} value={step.id}>
                    {step.name} ({step.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        ))
      )}
    </Box>
  );
}
