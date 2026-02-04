/**
 * ConditionStepEditor Component
 * Editor for condition step configuration with branch management
 */

import { Box, Typography } from '@mui/material';
import type { ConditionStep } from '@/types';
import { BranchEditor } from './BranchEditor';

interface ConditionStepEditorProps {
  step: ConditionStep;
  onChange: (changes: Partial<ConditionStep>) => void;
}

export function ConditionStepEditor({ step, onChange }: ConditionStepEditorProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Condition steps evaluate branches in order and navigate to the first matching branch.
        Configure at least one default branch as fallback.
      </Typography>

      <BranchEditor
        branches={step.branches}
        onChange={(branches) => onChange({ branches })}
      />
    </Box>
  );
}
