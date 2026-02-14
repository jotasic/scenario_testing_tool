/**
 * ConfigGraph Component
 * Right panel showing flow graph with breadcrumb navigation and detail panel
 */

import { useCallback, useMemo } from 'react';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ViewStream as VerticalIcon,
  ViewColumn as HorizontalIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { ResizableDetailPanel } from '@/components/layout/ResizableDetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { StepDetailPanel } from '@/components/execution/StepDetailPanel';
import FlowCanvas from '@/components/flow/FlowCanvas';
import { FlowBreadcrumbs, type NavigationLevel } from '@/components/flow/FlowBreadcrumbs';
import type { Scenario, Step } from '@/types';

export interface ConfigGraphProps {
  // Data
  currentScenario: Scenario | null;
  steps: Step[];
  selectedStepId: string | null;

  // Navigation state
  navigationPath: NavigationLevel[];

  // Clipboard state
  cutStepId: string | null;

  // Undo/Redo state
  canUndo: boolean;
  canRedo: boolean;

  // Handlers
  onNavigate: (index: number) => void;
  onNodeClick: (stepId: string) => void;
  onNodeDoubleClick: (stepId: string, stepType: string) => void;
  onEdgeClick: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  onFlowAutoLayout: (positions: Record<string, { x: number; y: number }>) => void;
  onStartStepChange: (startStepId: string) => void;
  onDropOnContainer: (stepId: string, containerId: string | null) => void;
  onCloseDetailPanel: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function ConfigGraph({
  currentScenario,
  steps,
  selectedStepId,
  navigationPath,
  cutStepId,
  canUndo,
  canRedo,
  onNavigate,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAutoLayout,
  onFlowAutoLayout,
  onStartStepChange,
  onDropOnContainer,
  onCloseDetailPanel,
  onUndo,
  onRedo,
}: ConfigGraphProps) {
  /**
   * Get the current container ID based on navigation path
   */
  const currentContainerId = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].stepId
    : null;

  /**
   * Collect all step IDs that are inside containers
   */
  const collectStepIdsInContainers = useCallback((steps: Step[]): Set<string> => {
    const stepsInsideContainers = new Set<string>();

    const collectFromContainer = (stepIds: string[]) => {
      stepIds.forEach(id => {
        if (stepsInsideContainers.has(id)) return;
        const childStep = steps.find(s => s.id === id);
        if (!childStep) return;

        stepsInsideContainers.add(id);

        if (childStep.type === 'loop' || childStep.type === 'group') {
          if (childStep.stepIds && childStep.stepIds.length > 0) {
            collectFromContainer(childStep.stepIds);
          }
        }
      });
    };

    steps.forEach(step => {
      if ((step.type === 'loop' || step.type === 'group') && step.stepIds && step.stepIds.length > 0) {
        collectFromContainer(step.stepIds);
      }
    });

    return stepsInsideContainers;
  }, []);

  /**
   * Get filtered steps for the current navigation level
   */
  const filteredSteps = useMemo(() => {
    if (!currentScenario) return [];

    if (!currentContainerId) {
      // Root level: show steps not inside any container
      const stepsInContainers = collectStepIdsInContainers(steps);
      return steps.filter(s => !stepsInContainers.has(s.id));
    } else {
      // Inside a container: show only steps in that container
      const container = steps.find(s => s.id === currentContainerId);
      if (container && (container.type === 'loop' || container.type === 'group')) {
        return container.stepIds
          .map(id => steps.find(s => s.id === id))
          .filter((s): s is Step => s !== undefined);
      }
      return [];
    }
  }, [currentScenario, currentContainerId, steps, collectStepIdsInContainers]);

  /**
   * Get filtered edges for the current navigation level
   */
  const filteredEdges = useMemo(() => {
    if (!currentScenario) return [];

    const currentStepIds = new Set(filteredSteps.map(s => s.id));
    return currentScenario.edges.filter(
      edge => currentStepIds.has(edge.sourceStepId) && currentStepIds.has(edge.targetStepId)
    );
  }, [currentScenario, filteredSteps]);

  // Determine if detail panel should be shown
  const showDetailPanel = selectedStepId !== null;

  // Get the selected step for detail panel
  const selectedStepForDetail = useMemo(() => {
    if (!showDetailPanel || !selectedStepId) return null;
    return steps.find(s => s.id === selectedStepId) || null;
  }, [showDetailPanel, selectedStepId, steps]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {currentScenario?.name || 'Scenario Flow'}
          </Typography>
          {currentScenario?.description && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {currentScenario.description}
            </Typography>
          )}
        </Box>
        {currentScenario && (
          <FormControl size="small" sx={{ minWidth: 140, ml: 1 }}>
            <InputLabel id="start-step-label">Start Step</InputLabel>
            <Select
              labelId="start-step-label"
              value={currentScenario.startStepId || ''}
              label="Start Step"
              onChange={(e) => onStartStepChange(e.target.value)}
            >
              {steps.map((step) => (
                <MenuItem key={step.id} value={step.id}>
                  {step.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>

      {/* Breadcrumbs for nested navigation */}
      {currentScenario && (
        <FlowBreadcrumbs
          path={navigationPath}
          onNavigate={onNavigate}
        />
      )}

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Flow Canvas - takes full width when detail panel is hidden */}
        <Box sx={{ flex: showDetailPanel ? '1 1 60%' : '1 1 100%', overflow: 'hidden', position: 'relative' }}>
          {currentScenario ? (
            <>
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
                <Tooltip title="Undo (Ctrl+Z)">
                  <span>
                    <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Shift+Z)">
                  <span>
                    <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
                      <RedoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Tooltip title="Auto-arrange (Top to Bottom)">
                  <IconButton size="small" onClick={() => onAutoLayout('TB')}>
                    <VerticalIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Auto-arrange (Left to Right)">
                  <IconButton size="small" onClick={() => onAutoLayout('LR')}>
                    <HorizontalIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <FlowCanvas
                scenario={currentScenario}
                selectedStepId={selectedStepId}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onEdgeClick={onEdgeClick}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onAutoLayout={onFlowAutoLayout}
                onDropOnContainer={onDropOnContainer}
                readonly={false}
                showMinimap={true}
                showGrid={true}
                filteredSteps={filteredSteps}
                filteredEdges={filteredEdges}
                cutStepId={cutStepId}
              />
            </>
          ) : (
            <EmptyState
              icon={ListAltIcon}
              title="No Scenario"
              message="Create or load a scenario to see the flow graph."
            />
          )}
        </Box>

        {/* Step Detail Panel - shown when a step is selected */}
        {showDetailPanel && selectedStepForDetail && currentScenario && (
          <ResizableDetailPanel
            storageKey="configPageStepDetailPanelWidth"
            defaultWidth={400}
            minWidth={320}
            maxWidth={800}
          >
            <StepDetailPanel
              step={selectedStepForDetail}
              scenario={currentScenario}
              onClose={onCloseDetailPanel}
            />
          </ResizableDetailPanel>
        )}
      </Box>
    </Box>
  );
}
