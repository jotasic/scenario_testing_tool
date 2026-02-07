/**
 * ConfigPage Component
 * Configuration mode page with 3-column resizable layout: Sidebar - Editor - Graph
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
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
  Menu,
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
  ChevronRight as ChevronRightIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import { ActionCreators } from 'redux-undo';
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
  useAppSelector,
} from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { addServer, setSelectedServer } from '@/store/serversSlice';
import { updateStep, addEdge, deleteEdge, addStep, deleteStep, autoLayoutSteps, setParameterSchema, updateScenario, addStepToContainer } from '@/store/scenariosSlice';
import type { Server, Step, LoopStep, GroupStep, ParameterSchema } from '@/types';

export function ConfigPage() {
  const dispatch = useAppDispatch();
  const servers = useServers();
  const currentScenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();
  const selectedServer = useSelectedServer();

  // Undo/Redo state
  const canUndo = useAppSelector(state => state.scenarios.past.length > 0);
  const canRedo = useAppSelector(state => state.scenarios.future.length > 0);

  // Dialog states
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);

  // Sidebar section expand states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    servers: true,
    steps: true,
    parameters: true,
  });

  // Tree view expand states for step containers
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Editor panel mode
  const [editorMode, setEditorMode] = useState<'item' | 'parameters'>('item');

  // Navigation state for nested graph
  const [navigationPath, setNavigationPath] = useState<NavigationLevel[]>([]);

  // Clipboard state for copy/paste functionality
  const [clipboardStep, setClipboardStep] = useState<Step | null>(null);

  // Context menu state for right-click menu
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    stepId: string;
  } | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
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

  /**
   * Find the path of parent containers for a given step
   * Returns an array of container IDs from root to immediate parent
   */
  const findParentContainers = useCallback((stepId: string, allSteps: Step[]): string[] => {
    const path: string[] = [];

    const findPath = (targetId: string, currentPath: string[] = []): boolean => {
      for (const step of allSteps) {
        if (step.type === 'loop' || step.type === 'group') {
          const containerStep = step as LoopStep | GroupStep;
          if (containerStep.stepIds.includes(targetId)) {
            const newPath = [...currentPath, step.id];

            // Check if this container is inside another container
            if (findPath(step.id, newPath)) {
              return true;
            }

            // This is the outermost container
            path.push(...newPath);
            return true;
          }
        }
      }
      return false;
    };

    findPath(stepId);
    return path;
  }, []);

  const handleItemClick = (sectionId: string, itemId: string) => {
    if (sectionId === 'servers') {
      dispatch(setSelectedServer(itemId));
      dispatch(setSelectedStep(null));
      setEditorMode('item');
    } else if (sectionId === 'steps') {
      // Find if the step is inside any containers
      const parentContainers = findParentContainers(itemId, steps);

      if (parentContainers.length > 0) {
        // Step is inside a container, navigate to it
        const newPath: NavigationLevel[] = parentContainers.map(containerId => {
          const container = steps.find(s => s.id === containerId);
          return {
            stepId: containerId,
            name: container?.name || 'Unknown',
          };
        });
        setNavigationPath(newPath);
      } else {
        // Step is at root level, clear navigation path
        setNavigationPath([]);
      }

      // Select the step
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

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(ActionCreators.redo());
  }, [dispatch]);

  // Handle edge click - clear step selection to prevent accidental deletion
  const handleEdgeClick = useCallback(() => {
    dispatch(setSelectedStep(null));
  }, [dispatch]);

  const handleAutoLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      if (currentScenario) {
        dispatch(autoLayoutSteps({ scenarioId: currentScenario.id, direction }));
      }
    },
    [dispatch, currentScenario]
  );

  const handleFlowAutoLayout = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (!currentScenario) return;

      // Update each step's position in Redux
      Object.entries(positions).forEach(([stepId, position]) => {
        dispatch(
          updateStep({
            scenarioId: currentScenario.id,
            stepId,
            changes: { position },
          })
        );
      });
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

  /**
   * Copy the currently selected step to clipboard
   */
  const handleCopyStep = useCallback(() => {
    if (!selectedStepId) return;
    const step = steps.find(s => s.id === selectedStepId);
    if (step) {
      setClipboardStep(step);
      // Optional: Show a toast notification
      console.log(`Step "${step.name}" copied to clipboard`);
    }
  }, [selectedStepId, steps]);

  /**
   * Paste the step from clipboard
   * Creates a new step with a new ID, "(Copy)" suffix, and offset position
   */
  const handlePasteStep = useCallback(() => {
    if (!clipboardStep || !currentScenario) return;

    // Create a deep copy of the step with modifications
    const newStep: Step = {
      ...clipboardStep,
      id: `step_${Date.now()}`,
      name: `${clipboardStep.name} (Copy)`,
      position: {
        x: clipboardStep.position.x + 50,
        y: clipboardStep.position.y + 50,
      },
    };

    // For Loop/Group steps, initialize stepIds to empty array (don't copy children)
    if (newStep.type === 'loop' || newStep.type === 'group') {
      (newStep as LoopStep | GroupStep).stepIds = [];
    }

    // For RequestStep with branches, clear nextStepId references
    if (newStep.type === 'request' && 'branches' in newStep && newStep.branches) {
      newStep.branches = newStep.branches.map(branch => ({
        ...branch,
        nextStepId: '',
      }));
    }

    // For ConditionStep, clear nextStepId references
    if (newStep.type === 'condition' && newStep.branches) {
      newStep.branches = newStep.branches.map(branch => ({
        ...branch,
        nextStepId: '',
      }));
    }

    // Add the step to the scenario
    dispatch(addStep({ scenarioId: currentScenario.id, step: newStep }));

    // If inside a container, add the step to that container
    if (currentContainerId) {
      dispatch(addStepToContainer({
        scenarioId: currentScenario.id,
        containerId: currentContainerId,
        stepId: newStep.id,
      }));
    }

    // Select the newly created step
    dispatch(setSelectedStep(newStep.id));

    console.log(`Step "${newStep.name}" pasted`);
  }, [clipboardStep, currentScenario, currentContainerId, dispatch]);

  /**
   * Keyboard shortcut handler for copy/paste
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the target is an input element
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Don't trigger shortcuts if typing in an input field
      if (isInputField) return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopyStep();
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleCopyStep, handlePasteStep]);

  /**
   * Handle right-click on step tree item
   */
  const handleStepContextMenu = useCallback((event: React.MouseEvent, stepId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      stepId,
    });
  }, []);

  /**
   * Close context menu
   */
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * Handle context menu copy action
   */
  const handleContextMenuCopy = useCallback(() => {
    if (contextMenu) {
      const step = steps.find(s => s.id === contextMenu.stepId);
      if (step) {
        setClipboardStep(step);
        // Select the step as well
        dispatch(setSelectedStep(step.id));
        console.log(`Step "${step.name}" copied to clipboard`);
      }
    }
    handleCloseContextMenu();
  }, [contextMenu, steps, dispatch, handleCloseContextMenu]);

  /**
   * Handle context menu paste action
   */
  const handleContextMenuPaste = useCallback(() => {
    handleCloseContextMenu();
    handlePasteStep();
  }, [handleCloseContextMenu, handlePasteStep]);

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

  /**
   * Get root level steps (steps that are not inside any container)
   */
  const rootSteps = useMemo(() => {
    const stepsInContainers = collectStepIdsInContainers(steps);
    return steps.filter(s => !stepsInContainers.has(s.id));
  }, [steps, collectStepIdsInContainers]);

  /**
   * Recursive component to render step tree
   */
  interface StepTreeItemProps {
    step: Step;
    allSteps: Step[];
    depth: number;
    selectedId: string | null;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onContextMenu: (event: React.MouseEvent, stepId: string) => void;
  }

  function StepTreeItem({ step, allSteps, depth, selectedId, expandedIds, onToggle, onSelect, onContextMenu }: StepTreeItemProps) {
    const isContainer = step.type === 'loop' || step.type === 'group';
    const isExpanded = expandedIds.has(step.id);
    const childSteps = isContainer && 'stepIds' in step
      ? step.stepIds
          .map(id => allSteps.find(s => s.id === id))
          .filter((s): s is Step => s !== undefined)
      : [];

    const hasChildren = childSteps.length > 0;

    return (
      <>
        <ListItemButton
          sx={{
            pl: 2 + depth * 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          selected={selectedId === step.id}
          onClick={() => onSelect(step.id)}
          onContextMenu={(e) => onContextMenu(e, step.id)}
        >
          {isContainer && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(step.id);
              }}
              sx={{
                mr: 0.5,
                visibility: hasChildren ? 'visible' : 'hidden',
              }}
            >
              {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          )}
          {!isContainer && (
            <Box sx={{ width: 28, mr: 0.5 }} />
          )}
          <ListItemText
            primary={step.name}
            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
          />
          <Chip
            label={step.type}
            size="small"
            sx={{
              ml: 1,
              height: 20,
              fontSize: '0.65rem',
            }}
          />
        </ListItemButton>

        {isContainer && hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {childSteps.map(child => (
              <StepTreeItem
                key={child.id}
                step={child}
                allSteps={allSteps}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
              />
            ))}
          </Collapse>
        )}
      </>
    );
  }

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
              {rootSteps.length > 0 ? (
                rootSteps.map(step => (
                  <StepTreeItem
                    key={step.id}
                    step={step}
                    allSteps={steps}
                    depth={0}
                    selectedId={selectedStepId}
                    expandedIds={expandedSteps}
                    onToggle={toggleStepExpand}
                    onSelect={(id) => handleItemClick('steps', id)}
                    onContextMenu={handleStepContextMenu}
                  />
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
          <FormControl size="small" sx={{ minWidth: 140, ml: 1 }}>
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
                    <IconButton size="small" onClick={handleUndo} disabled={!canUndo}>
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Shift+Z)">
                  <span>
                    <IconButton size="small" onClick={handleRedo} disabled={!canRedo}>
                      <RedoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
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
              <FlowCanvas
                scenario={currentScenario}
                selectedStepId={selectedStepId}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onEdgeClick={handleEdgeClick}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onAutoLayout={handleFlowAutoLayout}
                readonly={false}
                showMinimap={true}
                showGrid={true}
                filteredSteps={filteredSteps}
                filteredEdges={filteredEdges}
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

      {/* Context Menu for Step Tree */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuCopy}>Copy</MenuItem>
        <MenuItem
          onClick={handleContextMenuPaste}
          disabled={clipboardStep === null}
        >
          Paste
        </MenuItem>
      </Menu>
    </Box>
  );
}
