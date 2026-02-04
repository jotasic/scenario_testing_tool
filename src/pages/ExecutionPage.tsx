/**
 * ExecutionPage Component
 * Execution mode page - placeholder for Phase 6
 */

import { Box, Paper, Typography, Button } from '@mui/material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { EmptyState } from '@/components/common/EmptyState';
import { useCurrentScenario } from '@/store/hooks';

export function ExecutionPage() {
  const currentScenario = useCurrentScenario();

  const handleRunScenario = () => {
    console.log('Run scenario clicked');
    // TODO: Implement execution logic in Phase 6
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Section: Execution Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {currentScenario ? (
          <>
            <Box>
              <Typography variant="h6">{currentScenario.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentScenario.steps.length} steps configured
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleRunScenario}
            >
              Run Scenario
            </Button>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No scenario selected. Switch to Configuration mode to create or load a scenario.
          </Typography>
        )}
      </Paper>

      {/* Main Content: Execution View */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        <EmptyState
          icon={PlayArrowIcon}
          title="Execution View"
          message="This page will display execution progress, logs, and results. Implementation coming in Phase 6."
        />
      </Box>
    </Box>
  );
}
