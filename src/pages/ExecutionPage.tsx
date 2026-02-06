/**
 * ExecutionPage Component
 * Execution mode page with flow visualization, controls, and logs
 */

import { useState, useCallback, useEffect } from 'react';
import { Box, Paper, Tabs, Tab, IconButton, Tooltip, Stack } from '@mui/material';
import { FlowCanvas } from '@/components/flow';
import { ExecutionControls } from '@/components/execution/ExecutionControls';
import { ExecutionLogs } from '@/components/execution/ExecutionLogs';
import { ExecutionProgressTable } from '@/components/execution/ExecutionProgressTable';
import { StepResultViewer } from '@/components/execution/StepResultViewer';
import { StepDetailPanel } from '@/components/execution/StepDetailPanel';
import { ManualStepDialog } from '@/components/execution/ManualStepDialog';
import { ParameterInputPanel } from '@/components/parameters/ParameterInputPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { useCurrentScenario, useSelectedStepId, useAppDispatch, useExecutionStatus, useCurrentExecutionStep, useStepResult, useStepResults, useStepById } from '@/store/hooks';
import { autoLayoutSteps } from '@/store/scenariosSlice';
import { setSelectedStep } from '@/store/uiSlice';
import {
  PlayArrow as PlayArrowIcon,
  ViewStream as VerticalIcon,
  ViewColumn as HorizontalIcon,
} from '@mui/icons-material';

export function ExecutionPage() {
  const dispatch = useAppDispatch();
  const currentScenario = useCurrentScenario();
  const selectedStepId = useSelectedStepId();
  const selectedStep = useStepById(selectedStepId);
  const selectedStepResult = useStepResult(selectedStepId);
  const executionStatus = useExecutionStatus();
  const currentStep = useCurrentExecutionStep();
  const currentStepResult = useStepResult(currentStep?.id);
  const stepResults = useStepResults();
  const [rightPanelTab, setRightPanelTab] = useState<'params' | 'detail' | 'result' | 'logs' | 'progress'>('params');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);

  // Show manual step dialog when execution is paused and current step is waiting
  useEffect(() => {
    if (executionStatus === 'paused' && currentStepResult?.status === 'waiting') {
      setManualDialogOpen(true);
    }
  }, [executionStatus, currentStepResult?.status]);

  // Initialize params from parameterSchema defaultValues
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    const initialParams: Record<string, unknown> = {};
    currentScenario?.parameterSchema?.forEach(schema => {
      if (schema.defaultValue !== undefined) {
        initialParams[schema.name] = schema.defaultValue;
      }
    });
    return initialParams;
  });

  // Update params when scenario changes
  useEffect(() => {
    const initialParams: Record<string, unknown> = {};
    currentScenario?.parameterSchema?.forEach(schema => {
      if (schema.defaultValue !== undefined) {
        initialParams[schema.name] = schema.defaultValue;
      }
    });
    setParams(initialParams);
  }, [currentScenario?.id, currentScenario?.parameterSchema]);

  const handleAutoLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      if (currentScenario) {
        dispatch(autoLayoutSteps({ scenarioId: currentScenario.id, direction }));
      }
    },
    [dispatch, currentScenario]
  );

  // Show empty state if no scenario
  if (!currentScenario) {
    return (
      <Box sx={{ flexGrow: 1, height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon={PlayArrowIcon}
          title="No Scenario Selected"
          message="Switch to Configuration mode to create or load a scenario, then return here to execute it."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Top Section: Execution Controls - Full Width */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <ExecutionControls params={params} />
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
            position: 'relative',
          }}
        >
          {/* Auto Layout Buttons */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 10,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
              p: 0.5,
            }}
          >
            <Tooltip title="Auto-arrange (Top to Bottom)">
              <IconButton size="small" onClick={() => handleAutoLayout('TB')}>
                <VerticalIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Auto-arrange (Left to Right)">
              <IconButton size="small" onClick={() => handleAutoLayout('LR')}>
                <HorizontalIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <FlowCanvas scenario={currentScenario} stepResults={stepResults} readonly={true} />
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
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Parameters" value="params" />
            <Tab label="Step Detail" value="detail" />
            <Tab label="Step Result" value="result" />
            <Tab label="Progress" value="progress" />
            <Tab label="Logs" value="logs" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflow: 'auto', p: rightPanelTab === 'progress' ? 0 : 2 }}>
            {rightPanelTab === 'params' && (
              <ParameterInputPanel
                schemas={currentScenario.parameterSchema || []}
                onApply={(values) => {
                  setParams(values);
                }}
              />
            )}

            {rightPanelTab === 'detail' && (
              selectedStep && currentScenario ? (
                <StepDetailPanel
                  step={selectedStep}
                  stepResult={selectedStepResult || undefined}
                  scenario={currentScenario}
                />
              ) : (
                <EmptyState
                  title="No Step Selected"
                  message="Click on a step in the flow diagram to view detailed information."
                />
              )
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

            {rightPanelTab === 'progress' && (
              <ExecutionProgressTable
                scenario={currentScenario}
                stepResults={stepResults}
                onStepClick={(stepId) => {
                  // Switch to detail tab and select the step
                  setRightPanelTab('detail');
                  dispatch(setSelectedStep(stepId));
                }}
              />
            )}

            {rightPanelTab === 'logs' && <ExecutionLogs />}
          </Box>
        </Box>
      </Box>

      {/* Manual Step Dialog */}
      <ManualStepDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
      />
    </Box>
  );
}
