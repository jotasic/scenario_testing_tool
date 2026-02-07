/**
 * ConfigPage Component
 * Configuration mode page with 3-column resizable layout: Sidebar - Editor - Graph
 */

import { useCallback, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Storage as StorageIcon,
  ListAlt as ListAltIcon,
  ViewStream as VerticalIcon,
  ViewColumn as HorizontalIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Settings as ParametersIcon,
} from '@mui/icons-material';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { ResizablePanels } from '@/components/layout/ResizablePanels';
import { ResizableDetailPanel } from '@/components/layout/ResizableDetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { StepEditor } from '@/components/steps/StepEditor';
import { ServerEditor } from '@/components/servers/ServerEditor';
import { AddServerDialog } from '@/components/servers/AddServerDialog';
import { AddStepDialog } from '@/components/steps/AddStepDialog';
import { ParameterSchemaEditor } from '@/components/parameters/ParameterSchemaEditor';
import { StepDetailPanel } from '@/components/execution/StepDetailPanel';
import FlowCanvas from '@/components/flow/FlowCanvas';
import { FlowBreadcrumbs, type NavigationLevel } from '@/components/flow/FlowBreadcrumbs';
import {
  useServers,
  useCurrentScenario,
  useCurrentSteps,
  useSelectedStepId,
  useAppDispatch,
  useSelectedServer,
} from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { addServer, setSelectedServer } from '@/store/serversSlice';
import { updateStep, addEdge, deleteEdge, addStep, deleteStep, autoLayoutSteps, setParameterSchema, updateScenario, addStepToContainer } from '@/store/scenariosSlice';
import type { Server, Step, ParameterSchema } from '@/types';

export function ConfigPage() {
  const dispatch = useAppDispatch();
  const servers = useServers();
  const currentScenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();
  const selectedServer = useSelectedServer();

  // Dialog states
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);

  // Sidebar section expand states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    servers: true,
    steps: true,
    parameters: true,
  });

  // Editor panel mode
  const [editorMode, setEditorMode] = useState<'item' | 'parameters'>('item');

  // Navigation state for nested graph
  const [navigationPath, setNavigationPath] = useState<NavigationLevel[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  /**
   * Get the current container ID based on navigation path
   * Returns null if at root level
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

  /**
   * Handle navigation to a specific level
   * index: -1 for root, otherwise the index in navigationPath
   */
  const handleNavigate = useCallback((index: number) => {
    if (index === -1) {
      // Navigate to root
      setNavigationPath([]);
    } else {
      // Navigate to specific level (truncate path)
      setNavigationPath(prev => prev.slice(0, index + 1));
    }
  }, []);

  /**
   * Handle node double click - navigate into container
   */
  const handleNodeDoubleClick = useCallback((stepId: string, stepType: string) => {
    // Only navigate into loop/group containers
    if (stepType !== 'loop' && stepType !== 'group') {
      return;
    }

    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    // Add to navigation path
    setNavigationPath(prev => [
      ...prev,
      {
        stepId: step.id,
        name: step.name,
      },
    ]);
  }, [steps]);

  const handleItemClick = (sectionId: string, itemId: string) => {
    if (sectionId === 'servers') {
      dispatch(setSelectedServer(itemId));
      dispatch(setSelectedStep(null));
      setEditorMode('item');
    } else if (sectionId === 'steps') {
      dispatch(setSelectedStep(itemId));
      dispatch(setSelectedServer(null));
      setEditorMode('item');
    }
  };

  const handleParametersClick = () => {
    dispatch(setSelectedServer(null));
    dispatch(setSelectedStep(null));
    setEditorMode('parameters');
  };

  const handleParameterSchemaChange = useCallback(
    (schemas: ParameterSchema[]) => {
      if (!currentScenario) return;
      dispatch(setParameterSchema({ scenarioId: currentScenario.id, schema: schemas }));
    },
    [dispatch, currentScenario]
  );

  const handleAddServer = () => {
    setAddServerDialogOpen(true);
  };

  const handleAddStep = () => {
    setAddStepDialogOpen(true);
  };

  const handleServerAdd = useCallback(
    (server: Server) => {
      dispatch(addServer(server));
      dispatch(setSelectedServer(server.id));
      dispatch(setSelectedStep(null));
    },
    [dispatch]
  );

  const handleStepAdd = useCallback(
    (step: Step) => {
      if (!currentScenario) return;
      dispatch(addStep({ scenarioId: currentScenario.id, step }));

      // If inside a container (Loop/Group), add the step to that container
      if (currentContainerId) {
        dispatch(addStepToContainer({
          scenarioId: currentScenario.id,
          containerId: currentContainerId,
          stepId: step.id,
        }));
      }

      dispatch(setSelectedStep(step.id));
      dispatch(setSelectedServer(null));
    },
    [dispatch, currentScenario, currentContainerId]
  );

  const handleAutoLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      if (currentScenario) {
        dispatch(autoLayoutSteps({ scenarioId: currentScenario.id, direction }));
      }
    },
    [dispatch, currentScenario]
  );

  const handleStartStepChange = useCallback(
    (startStepId: string) => {
      if (!currentScenario) return;
      dispatch(updateScenario({ id: currentScenario.id, changes: { startStepId } }));
    },
    [dispatch, currentScenario]
  );

  const handleNodeClick = useCallback(
    (stepId: string) => {
      dispatch(setSelectedStep(stepId));
      dispatch(setSelectedServer(null));
      setEditorMode('item');
    },
    [dispatch]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!currentScenario) return;

      changes.forEach(change => {
        // Handle position changes
        if (change.type === 'position' && change.position && !change.dragging) {
          dispatch(
            updateStep({
              scenarioId: currentScenario.id,
              stepId: change.id,
              changes: { position: change.position },
            })
          );
        }
        // Handle node deletion (via keyboard Delete/Backspace or UI button)
        else if (change.type === 'remove') {
          dispatch(
            deleteStep({
              scenarioId: currentScenario.id,
              stepId: change.id,
            })
          );
          // Clear selection if deleted node was selected
          if (selectedStepId === change.id) {
            dispatch(setSelectedStep(null));
          }
        }
      });
    },
    [dispatch, currentScenario, selectedStepId]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!currentScenario) return;

      changes.forEach(change => {
        if (change.type === 'remove') {
          dispatch(
            deleteEdge({
              scenarioId: currentScenario.id,
              edgeId: change.id,
            })
          );
        }
      });
    },
    [dispatch, currentScenario]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!currentScenario) return;
      if (!connection.source || !connection.target) return;

      const newEdge = {
        id: `edge_${Date.now()}`,
        sourceStepId: connection.source,
        targetStepId: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
      };

      dispatch(
        addEdge({
          scenarioId: currentScenario.id,
          edge: newEdge,
        })
      );
    },
    [dispatch, currentScenario]
  );

  const getSelectedItemId = () => {
    return selectedServer?.id || selectedStepId || null;
  };

  // Sidebar Panel Content
  const SidebarPanel = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Resources
        </Typography>
      </Paper>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List disablePadding>
          {/* Servers Section */}
          <ListItem
            disablePadding
            secondaryAction={
              <IconButton edge="end" size="small" onClick={handleAddServer}>
                <AddIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => toggleSection('servers')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <StorageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Servers"
                primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
              />
              {expandedSections.servers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expandedSections.servers} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {servers.length > 0 ? (
                servers.map(server => (
                  <ListItemButton
                    key={server.id}
                    sx={{ pl: 4 }}
                    selected={getSelectedItemId() === server.id}
                    onClick={() => handleItemClick('servers', server.id)}
                  >
                    <ListItemText
                      primary={server.name}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    />
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText
                    primary="No servers"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Collapse>

          <Divider />

          {/* Steps Section */}
          <ListItem
            disablePadding
            secondaryAction={
              currentScenario && (
                <IconButton edge="end" size="small" onClick={handleAddStep}>
                  <AddIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemButton onClick={() => toggleSection('steps')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ListAltIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Steps"
                primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
              />
              {expandedSections.steps ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expandedSections.steps} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {steps.length > 0 ? (
                steps.map(step => (
                  <ListItemButton
                    key={step.id}
                    sx={{ pl: 4 }}
                    selected={getSelectedItemId() === step.id}
                    onClick={() => handleItemClick('steps', step.id)}
                  >
                    <ListItemText
                      primary={step.name}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    />
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText
                    primary="No steps"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Collapse>

          <Divider />

          {/* Parameters Section */}
          {currentScenario && (
            <ListItem disablePadding>
              <ListItemButton
                selected={editorMode === 'parameters'}
                onClick={handleParametersClick}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ParametersIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Parameters"
                  primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                />
                <Chip
                  label={currentScenario.parameterSchema?.length || 0}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  );

  // Editor Panel Content
  const EditorPanel = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {editorMode === 'parameters' && currentScenario ? (
        <ParameterSchemaEditor
          schemas={currentScenario.parameterSchema || []}
          steps={steps}
          onChange={handleParameterSchemaChange}
        />
      ) : (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {selectedServer
                ? `Server: ${selectedServer.name}`
                : selectedStepId
                ? `Step: ${steps.find(s => s.id === selectedStepId)?.name || 'Unknown'}`
                : 'Configuration'}
            </Typography>
          </Paper>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {selectedServer ? (
              <ServerEditor server={selectedServer} />
            ) : selectedStepId ? (
              <StepEditor />
            ) : (
              <EmptyState
                icon={ListAltIcon}
                title="No Selection"
                message="Select a server or step to edit."
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );

  // Close StepDetailPanel
  const handleCloseDetailPanel = useCallback(() => {
    dispatch(setSelectedStep(null));
  }, [dispatch]);

  // Determine if detail panel should be shown
  // Show only when selectedStepId exists AND we're at the root level (no navigationPath)
  const showDetailPanel = selectedStepId !== null && navigationPath.length === 0;

  // Get the selected step for detail panel
  const selectedStepForDetail = useMemo(() => {
    if (!showDetailPanel || !selectedStepId) return null;
    return steps.find(s => s.id === selectedStepId) || null;
  }, [showDetailPanel, selectedStepId, steps]);

  // Graph Panel Content
  const GraphPanel = (
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
          <Stack direction="row" spacing={1} sx={{ ml: 1, flexShrink: 0, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="start-step-label">Start Step</InputLabel>
              <Select
                labelId="start-step-label"
                value={currentScenario.startStepId || ''}
                label="Start Step"
                onChange={(e) => handleStartStepChange(e.target.value)}
              >
                {steps.map((step) => (
                  <MenuItem key={step.id} value={step.id}>
                    {step.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider orientation="vertical" flexItem />
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
        )}
      </Paper>

      {/* Breadcrumbs for nested navigation */}
      {currentScenario && (
        <FlowBreadcrumbs
          path={navigationPath}
          onNavigate={handleNavigate}
        />
      )}

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Flow Canvas - takes full width when detail panel is hidden */}
        <Box sx={{ flex: showDetailPanel ? '1 1 60%' : '1 1 100%', overflow: 'hidden' }}>
          {currentScenario ? (
            <FlowCanvas
              scenario={currentScenario}
              selectedStepId={selectedStepId}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              readonly={false}
              showMinimap={true}
              showGrid={true}
              filteredSteps={filteredSteps}
              filteredEdges={filteredEdges}
            />
          ) : (
            <EmptyState
              icon={ListAltIcon}
              title="No Scenario"
              message="Create or load a scenario to see the flow graph."
            />
          )}
        </Box>

        {/* Step Detail Panel - shown when a step is selected and at root level */}
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
              onClose={handleCloseDetailPanel}
            />
          </ResizableDetailPanel>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <ResizablePanels
        height="100%"
        panels={[
          {
            key: 'sidebar',
            initialWidth: 240,
            minWidth: 180,
            maxWidth: 400,
            children: SidebarPanel,
          },
          {
            key: 'editor',
            initialWidth: 380,
            minWidth: 280,
            maxWidth: 600,
            children: EditorPanel,
          },
          {
            key: 'graph',
            flex: true,
            minWidth: 400,
            children: GraphPanel,
          },
        ]}
      />

      {/* Dialogs */}
      <AddServerDialog
        open={addServerDialogOpen}
        onClose={() => setAddServerDialogOpen(false)}
        onAdd={handleServerAdd}
      />

      {currentScenario && (
        <AddStepDialog
          open={addStepDialogOpen}
          existingSteps={steps}
          onClose={() => setAddStepDialogOpen(false)}
          onAdd={handleStepAdd}
        />
      )}
    </Box>
  );
}
