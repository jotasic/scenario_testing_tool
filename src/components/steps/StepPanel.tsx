/**
 * StepPanel Component
 * Combined panel showing step list and step editor
 */

import { Box } from '@mui/material';
import { StepList } from './StepList';
import { StepEditor } from './StepEditor';
import { useSelectedStepId } from '@/store/hooks';

export function StepPanel() {
  const selectedStepId = useSelectedStepId();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Step List - Fixed height at top */}
      <Box
        sx={{
          height: selectedStepId ? '40%' : '100%',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          borderBottom: selectedStepId ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        <StepList />
      </Box>

      {/* Step Editor - Takes remaining space when step is selected */}
      {selectedStepId && (
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          <StepEditor />
        </Box>
      )}
    </Box>
  );
}
