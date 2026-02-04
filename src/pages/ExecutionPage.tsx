/**
 * ExecutionPage Component
 * Execution mode page with flow visualization, controls, and logs
 */

import { useState } from 'react';
import { Box, Paper, Typography, Tabs, Tab } from '@mui/material';
import { FlowCanvas } from '@/components/flow';
import { ExecutionControls } from '@/components/execution/ExecutionControls';
import { ExecutionLogs } from '@/components/execution/ExecutionLogs';
import { StepResultViewer } from '@/components/execution/StepResultViewer';
import { ParameterInputPanel } from '@/components/parameters/ParameterInputPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { useCurrentScenario, useSelectedStepId, useExecutionStatus } from '@/store/hooks';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';

export function ExecutionPage() {
  const currentScenario = useCurrentScenario();
  const selectedStepId = useSelectedStepId();
  const executionStatus = useExecutionStatus();
  const [rightPanelTab, setRightPanelTab] = useState<'params' | 'result' | 'logs'>('params');

  // Show empty state if no scenario
  if (!currentScenario) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon={PlayArrowIcon}
          title="No Scenario Selected"
          message="Switch to Configuration mode to create or load a scenario, then return here to execute it."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Section: Scenario Info and Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h6">{currentScenario.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentScenario.steps.length} steps | Status: {executionStatus}
          </Typography>
        </Box>
        <ExecutionControls />
      </Paper>

      {/* Main Content: Flow + Right Panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Flow Canvas */}
        <Box
          sx={{
            flexGrow: 1,
            height: '100%',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <FlowCanvas scenario={currentScenario} readonly={true} />
        </Box>

        {/* Right: Tabs Panel */}
        <Box
          sx={{
            width: 400,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={rightPanelTab}
            onChange={(_, newValue) => setRightPanelTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
          >
            <Tab label="Parameters" value="params" />
            <Tab label="Step Result" value="result" />
            <Tab label="Logs" value="logs" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {rightPanelTab === 'params' && (
              <ParameterInputPanel
                schemas={currentScenario.parameterSchema || []}
                onApply={(values) => {
                  console.log('Parameters applied:', values);
                }}
              />
            )}

            {rightPanelTab === 'result' && (
              selectedStepId ? (
                <StepResultViewer stepId={selectedStepId} />
              ) : (
                <EmptyState
                  title="No Step Selected"
                  message="Click on a step in the flow diagram to view its execution result."
                />
              )
            )}

            {rightPanelTab === 'logs' && <ExecutionLogs />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
