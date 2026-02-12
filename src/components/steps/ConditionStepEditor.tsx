/**
 * ConditionStepEditor Component
 * Editor for condition step configuration with branch management
 */

import { Box, Typography } from '@mui/material';
import type { ConditionStep } from '@/types';
import { useCurrentScenario } from '@/store/hooks';
import { BranchEditor } from './BranchEditor';
import { AvailableLoopVariables } from './AvailableLoopVariables';

interface ConditionStepEditorProps {
  step: ConditionStep;
  onChange: (changes: Partial<ConditionStep>) => void;
}

export function ConditionStepEditor({ step, onChange }: ConditionStepEditorProps) {
  const scenario = useCurrentScenario();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Available Loop Variables */}
      {scenario && (
        <AvailableLoopVariables
          currentStepId={step.id}
          allSteps={scenario.steps}
        />
      )}

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
