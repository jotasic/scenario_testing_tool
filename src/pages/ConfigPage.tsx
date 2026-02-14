/**
 * ConfigPage Component
 * Configuration mode page with 3-column resizable layout: Sidebar - Editor - Graph
 * Refactored to use focused subcomponents following vertical slice pattern
 */

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Box, Menu, MenuItem, Divider, Chip, Typography } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { ActionCreators } from 'redux-undo';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { ResizablePanels } from '@/components/layout/ResizablePanels';
import { EdgeConflictDialog } from '@/components/common/EdgeConflictDialog';
import { AddServerDialog } from '@/components/servers/AddServerDialog';
import { AddStepDialog } from '@/components/steps/AddStepDialog';
import { ConfigSidebar } from '@/components/config/ConfigSidebar';
import { ConfigEditor } from '@/components/config/ConfigEditor';
import { ConfigGraph } from '@/components/config/ConfigGraph';
import { type NavigationLevel } from '@/components/flow/FlowBreadcrumbs';
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
import { updateStep, addEdge, deleteEdge, addStep, deleteStep, autoLayoutSteps, setParameterSchema, updateScenario, addStepToContainer, moveStepToContainer } from '@/store/scenariosSlice';
import type { Server, Step, LoopStep, GroupStep, ParameterSchema } from '@/types';
import { useClipboard } from '@/hooks';
import { detectEdgeConflicts, getAvailableContainers, type EdgeConflict } from '@/utils/edgeConflictUtils';

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

  // Clipboard management
  const {
    clipboardData,
    hasClipboard,
    cutStepId,
    copyStep,
    cutStep,
    consumeClipboard,
  } = useClipboard();

  // Edge conflict dialog state
  const [edgeConflictDialog, setEdgeConflictDialog] = useState<{
    open: boolean;
    operation: 'cut' | 'move';
    conflicts: EdgeConflict[];
    onConfirm: () => void;
  }>({
    open: false,
    operation: 'cut',
    conflicts: [],
    onConfirm: () => {},
  });

  // Context menu state for right-click menu
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    stepId: string;
  } | null>(null);

  // Move to Container submenu anchor
  const [moveToContainerAnchor, setMoveToContainerAnchor] = useState<HTMLElement | null>(null);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const toggleStepExpand = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  }, []);

  /**
   * Auto-expand containers in the navigation path
   * Computed derived state instead of useEffect to avoid lint warning
   */
  const expandedStepsWithNavigation = useMemo(() => {
    const result = new Set(expandedSteps);
    if (navigationPath.length > 0) {
      navigationPath.forEach(level => result.add(level.stepId));
    }
    return result;
  }, [expandedSteps, navigationPath]);

  /**
   * Get the current container ID based on navigation path
   */
  const currentContainerId = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].stepId
    : null;

  /**
   * Find the path of parent containers for a given step
   */
  const findParentContainers = useCallback((stepId: string, allSteps: Step[]): string[] => {
    const path: string[] = [];

    const findPath = (targetId: string, currentPath: string[] = []): boolean => {
      for (const step of allSteps) {
        if (step.type === 'loop' || step.type === 'group') {
          const containerStep = step as LoopStep | GroupStep;
          if (containerStep.stepIds.includes(targetId)) {
            const newPath = [...currentPath, step.id];

            if (findPath(step.id, newPath)) {
              return true;
            }

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

  /**
   * Handle navigation to a specific level
   */
  const handleNavigate = useCallback((index: number) => {
    if (index === -1) {
      setNavigationPath([]);
    } else {
      setNavigationPath(prev => prev.slice(0, index + 1));
    }
  }, []);

  /**
   * Handle node double click - navigate into container
   */
  const handleNodeDoubleClick = useCallback((stepId: string, stepType: string) => {
    if (stepType !== 'loop' && stepType !== 'group') {
      return;
    }

    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    setNavigationPath(prev => [
      ...prev,
      {
        stepId: step.id,
        name: step.name,
      },
    ]);
  }, [steps]);

  /**
   * Handle server selection from sidebar
   */
  const handleServerSelect = useCallback((serverId: string) => {
    dispatch(setSelectedServer(serverId));
    dispatch(setSelectedStep(null));
    setEditorMode('item');
  }, [dispatch]);

  /**
   * Handle step selection from sidebar
   */
  const handleStepSelect = useCallback((stepId: string) => {
    const parentContainers = findParentContainers(stepId, steps);

    if (parentContainers.length > 0) {
      const newPath: NavigationLevel[] = parentContainers.map(containerId => {
        const container = steps.find(s => s.id === containerId);
        return {
          stepId: containerId,
          name: container?.name || 'Unknown',
        };
      });
      setNavigationPath(newPath);
    } else {
      setNavigationPath([]);
    }

    dispatch(setSelectedStep(stepId));
    dispatch(setSelectedServer(null));
    setEditorMode('item');
  }, [dispatch, steps, findParentContainers]);

  const handleParametersClick = useCallback(() => {
    dispatch(setSelectedServer(null));
    dispatch(setSelectedStep(null));
    setEditorMode('parameters');
  }, [dispatch]);

  const handleParameterSchemaChange = useCallback((schemas: ParameterSchema[]) => {
    if (!currentScenario) return;
    dispatch(setParameterSchema({ scenarioId: currentScenario.id, schema: schemas }));
  }, [dispatch, currentScenario]);

  const handleAddServer = useCallback(() => {
    setAddServerDialogOpen(true);
  }, []);

  const handleAddStep = useCallback(() => {
    setAddStepDialogOpen(true);
  }, []);

  const handleServerAdd = useCallback((server: Server) => {
    dispatch(addServer(server));
    dispatch(setSelectedServer(server.id));
    dispatch(setSelectedStep(null));
  }, [dispatch]);

  const handleStepAdd = useCallback((step: Step) => {
    if (!currentScenario) return;
    dispatch(addStep({ scenarioId: currentScenario.id, step }));

    if (currentContainerId) {
      dispatch(addStepToContainer({
        scenarioId: currentScenario.id,
        containerId: currentContainerId,
        stepId: step.id,
      }));
    }

    dispatch(setSelectedStep(step.id));
    dispatch(setSelectedServer(null));
  }, [dispatch, currentScenario, currentContainerId]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(ActionCreators.redo());
  }, [dispatch]);

  // Handle edge click
  const handleEdgeClick = useCallback(() => {
    dispatch(setSelectedStep(null));
  }, [dispatch]);

  const handleAutoLayout = useCallback((direction: 'TB' | 'LR') => {
    if (currentScenario) {
      dispatch(autoLayoutSteps({ scenarioId: currentScenario.id, direction }));
    }
  }, [dispatch, currentScenario]);

  const handleFlowAutoLayout = useCallback((positions: Record<string, { x: number; y: number }>) => {
    if (!currentScenario) return;

    Object.entries(positions).forEach(([stepId, position]) => {
      dispatch(
        updateStep({
          scenarioId: currentScenario.id,
          stepId,
          changes: { position },
        })
      );
    });
  }, [dispatch, currentScenario]);

  const handleStartStepChange = useCallback((startStepId: string) => {
    if (!currentScenario) return;
    dispatch(updateScenario({ id: currentScenario.id, changes: { startStepId } }));
  }, [dispatch, currentScenario]);

  /**
   * Copy the currently selected step to clipboard
   */
  const handleCopyStep = useCallback(() => {
    if (!selectedStepId) return;
    const step = steps.find(s => s.id === selectedStepId);
    if (step) {
      copyStep(step, currentContainerId);
      console.log(`Step "${step.name}" copied to clipboard`);
    }
  }, [selectedStepId, steps, currentContainerId, copyStep]);

  /**
   * Cut the currently selected step to clipboard
   */
  const handleCutStep = useCallback(() => {
    if (!selectedStepId || !currentScenario) return;
    const step = steps.find(s => s.id === selectedStepId);
    if (!step) return;

    const conflictResult = detectEdgeConflicts(
      [selectedStepId],
      null,
      steps,
      currentScenario.edges
    );

    if (conflictResult.hasConflicts) {
      setEdgeConflictDialog({
        open: true,
        operation: 'cut',
        conflicts: conflictResult.conflicts,
        onConfirm: () => {
          cutStep(step, currentContainerId);
          conflictResult.edgesToDelete.forEach(edgeId => {
            dispatch(deleteEdge({ scenarioId: currentScenario.id, edgeId }));
          });
          setEdgeConflictDialog(prev => ({ ...prev, open: false }));
          console.log(`Step "${step.name}" cut to clipboard`);
        },
      });
    } else {
      cutStep(step, currentContainerId);
      console.log(`Step "${step.name}" cut to clipboard`);
    }
  }, [selectedStepId, currentScenario, steps, currentContainerId, cutStep, dispatch]);

  /**
   * Paste the step from clipboard
   */
  const handlePasteStep = useCallback(() => {
    if (!clipboardData || !currentScenario) return;

    const data = consumeClipboard();
    if (!data) return;

    if (data.operation === 'copy') {
      const newStep: Step = {
        ...data.step,
        id: `step_${Date.now()}`,
        name: `${data.step.name} (Copy)`,
        position: {
          x: data.step.position.x + 50,
          y: data.step.position.y + 50,
        },
      };

      if (newStep.type === 'loop' || newStep.type === 'group') {
        (newStep as LoopStep | GroupStep).stepIds = [];
      }

      if (newStep.type === 'request' && 'branches' in newStep && newStep.branches) {
        newStep.branches = newStep.branches.map(branch => ({
          ...branch,
          nextStepId: '',
        }));
      }

      if (newStep.type === 'condition' && newStep.branches) {
        newStep.branches = newStep.branches.map(branch => ({
          ...branch,
          nextStepId: '',
        }));
      }

      dispatch(addStep({ scenarioId: currentScenario.id, step: newStep }));

      if (currentContainerId) {
        dispatch(addStepToContainer({
          scenarioId: currentScenario.id,
          containerId: currentContainerId,
          stepId: newStep.id,
        }));
      }

      dispatch(setSelectedStep(newStep.id));
      console.log(`Step "${newStep.name}" pasted (copied)`);
    } else {
      const stepToMove = data.step;

      const conflictResult = detectEdgeConflicts(
        [stepToMove.id],
        currentContainerId,
        steps,
        currentScenario.edges
      );

      const performMove = () => {
        dispatch(moveStepToContainer({
          scenarioId: currentScenario.id,
          stepId: stepToMove.id,
          sourceContainerId: data.sourceContainerId || null,
          targetContainerId: currentContainerId || null,
          edgesToDelete: conflictResult.edgesToDelete,
        }));

        dispatch(setSelectedStep(stepToMove.id));
        console.log(`Step "${stepToMove.name}" pasted (moved)`);
      };

      if (conflictResult.hasConflicts) {
        setEdgeConflictDialog({
          open: true,
          operation: 'move',
          conflicts: conflictResult.conflicts,
          onConfirm: () => {
            performMove();
            setEdgeConflictDialog(prev => ({ ...prev, open: false }));
          },
        });
      } else {
        performMove();
      }
    }
  }, [clipboardData, currentScenario, currentContainerId, consumeClipboard, steps, dispatch]);

  /**
   * Keyboard shortcut handler
   */
  const handleCopyStepRef = useRef(handleCopyStep);
  const handleCutStepRef = useRef(handleCutStep);
  const handlePasteStepRef = useRef(handlePasteStep);

  useEffect(() => {
    handleCopyStepRef.current = handleCopyStep;
    handleCutStepRef.current = handleCutStep;
    handlePasteStepRef.current = handlePasteStep;
  }, [handleCopyStep, handleCutStep, handlePasteStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputField) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch(ActionCreators.undo());
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        dispatch(ActionCreators.redo());
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopyStepRef.current();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCutStepRef.current();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteStepRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

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

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuCopy = useCallback(() => {
    if (contextMenu) {
      const step = steps.find(s => s.id === contextMenu.stepId);
      if (step) {
        copyStep(step, currentContainerId);
        dispatch(setSelectedStep(step.id));
        console.log(`Step "${step.name}" copied to clipboard`);
      }
    }
    handleCloseContextMenu();
  }, [contextMenu, steps, currentContainerId, copyStep, dispatch, handleCloseContextMenu]);

  const handleContextMenuCut = useCallback(() => {
    if (contextMenu && currentScenario) {
      const step = steps.find(s => s.id === contextMenu.stepId);
      if (step) {
        const conflictResult = detectEdgeConflicts(
          [step.id],
          null,
          steps,
          currentScenario.edges
        );

        const performCut = () => {
          cutStep(step, currentContainerId);
          if (conflictResult.hasConflicts) {
            conflictResult.edgesToDelete.forEach(edgeId => {
              dispatch(deleteEdge({ scenarioId: currentScenario.id, edgeId }));
            });
          }
          dispatch(setSelectedStep(step.id));
          console.log(`Step "${step.name}" cut to clipboard`);
        };

        if (conflictResult.hasConflicts) {
          setEdgeConflictDialog({
            open: true,
            operation: 'cut',
            conflicts: conflictResult.conflicts,
            onConfirm: () => {
              performCut();
              setEdgeConflictDialog(prev => ({ ...prev, open: false }));
            },
          });
        } else {
          performCut();
        }
      }
    }
    handleCloseContextMenu();
  }, [contextMenu, currentScenario, steps, currentContainerId, cutStep, dispatch, handleCloseContextMenu]);

  const handleContextMenuPaste = useCallback(() => {
    handleCloseContextMenu();
    handlePasteStep();
  }, [handleCloseContextMenu, handlePasteStep]);

  const availableContainers = useMemo(() => {
    if (!contextMenu) return [];
    return getAvailableContainers(contextMenu.stepId, steps);
  }, [contextMenu, steps]);

  const handleMoveToContainer = useCallback((containerId: string | null) => {
    if (!contextMenu || !currentScenario) return;
    const stepId = contextMenu.stepId;
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const currentParent = steps.find(s => {
      if (s.type !== 'loop' && s.type !== 'group') return false;
      return (s as LoopStep | GroupStep).stepIds.includes(stepId);
    });

    const conflictResult = detectEdgeConflicts(
      [stepId],
      containerId,
      steps,
      currentScenario.edges
    );

    const performMove = () => {
      dispatch(moveStepToContainer({
        scenarioId: currentScenario.id,
        stepId,
        sourceContainerId: currentParent?.id || null,
        targetContainerId: containerId,
        edgesToDelete: conflictResult.edgesToDelete,
      }));
      const destination = containerId ? `container "${steps.find(s => s.id === containerId)?.name}"` : 'root level';
      console.log(`Step "${step.name}" moved to ${destination}`);
    };

    if (conflictResult.hasConflicts) {
      setEdgeConflictDialog({
        open: true,
        operation: 'move',
        conflicts: conflictResult.conflicts,
        onConfirm: () => {
          performMove();
          setEdgeConflictDialog(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      performMove();
    }

    setMoveToContainerAnchor(null);
    handleCloseContextMenu();
  }, [contextMenu, currentScenario, steps, dispatch, handleCloseContextMenu]);

  const handleDropOnContainer = useCallback((stepId: string, containerId: string | null) => {
    if (!currentScenario) return;
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const currentParent = steps.find(s => {
      if (s.type !== 'loop' && s.type !== 'group') return false;
      return (s as LoopStep | GroupStep).stepIds.includes(stepId);
    });

    if (currentParent?.id === containerId) return;

    const conflictResult = detectEdgeConflicts(
      [stepId],
      containerId,
      steps,
      currentScenario.edges
    );

    const performMove = () => {
      dispatch(moveStepToContainer({
        scenarioId: currentScenario.id,
        stepId,
        sourceContainerId: currentParent?.id || null,
        targetContainerId: containerId,
        edgesToDelete: conflictResult.edgesToDelete,
      }));
      const destination = containerId ? `container "${steps.find(s => s.id === containerId)?.name}"` : 'root level';
      console.log(`Step "${step.name}" moved to ${destination}`);
    };

    if (conflictResult.hasConflicts) {
      setEdgeConflictDialog({
        open: true,
        operation: 'move',
        conflicts: conflictResult.conflicts,
        onConfirm: () => {
          performMove();
          setEdgeConflictDialog(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      performMove();
    }
  }, [currentScenario, steps, dispatch]);

  const handleNodeClick = useCallback((stepId: string) => {
    dispatch(setSelectedStep(stepId));
    dispatch(setSelectedServer(null));
    setEditorMode('item');
  }, [dispatch]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (!currentScenario) return;

    changes.forEach(change => {
      if (change.type === 'position' && change.position && !change.dragging) {
        dispatch(
          updateStep({
            scenarioId: currentScenario.id,
            stepId: change.id,
            changes: { position: change.position },
          })
        );
      } else if (change.type === 'remove') {
        dispatch(
          deleteStep({
            scenarioId: currentScenario.id,
            stepId: change.id,
          })
        );
        if (selectedStepId === change.id) {
          dispatch(setSelectedStep(null));
        }
      }
    });
  }, [dispatch, currentScenario, selectedStepId]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
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
  }, [dispatch, currentScenario]);

  const handleConnect = useCallback((connection: Connection) => {
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
  }, [dispatch, currentScenario]);

  const handleCloseDetailPanel = useCallback(() => {
    dispatch(setSelectedStep(null));
  }, [dispatch]);

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
            children: (
              <ConfigSidebar
                servers={servers}
                steps={steps}
                currentScenario={currentScenario}
                selectedServerId={selectedServer?.id || null}
                selectedStepId={selectedStepId}
                editorMode={editorMode}
                expandedSections={expandedSections}
                expandedSteps={expandedStepsWithNavigation}
                cutStepId={cutStepId}
                onServerSelect={handleServerSelect}
                onStepSelect={handleStepSelect}
                onParametersClick={handleParametersClick}
                onAddServer={handleAddServer}
                onAddStep={handleAddStep}
                onToggleSection={toggleSection}
                onToggleStepExpand={toggleStepExpand}
                onStepContextMenu={handleStepContextMenu}
              />
            ),
          },
          {
            key: 'editor',
            initialWidth: 380,
            minWidth: 280,
            maxWidth: 600,
            children: (
              <ConfigEditor
                selectedServer={selectedServer}
                selectedStepId={selectedStepId}
                currentScenario={currentScenario}
                steps={steps}
                editorMode={editorMode}
                onParameterSchemaChange={handleParameterSchemaChange}
              />
            ),
          },
          {
            key: 'graph',
            flex: true,
            minWidth: 400,
            children: (
              <ConfigGraph
                currentScenario={currentScenario}
                steps={steps}
                selectedStepId={selectedStepId}
                navigationPath={navigationPath}
                cutStepId={cutStepId}
                canUndo={canUndo}
                canRedo={canRedo}
                onNavigate={handleNavigate}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onEdgeClick={handleEdgeClick}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onAutoLayout={handleAutoLayout}
                onFlowAutoLayout={handleFlowAutoLayout}
                onStartStepChange={handleStartStepChange}
                onDropOnContainer={handleDropOnContainer}
                onCloseDetailPanel={handleCloseDetailPanel}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            ),
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
        <MenuItem onClick={handleContextMenuCopy}>Copy (Ctrl+C)</MenuItem>
        <MenuItem onClick={handleContextMenuCut}>Cut (Ctrl+X)</MenuItem>
        <MenuItem
          onClick={handleContextMenuPaste}
          disabled={!hasClipboard}
        >
          Paste (Ctrl+V)
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={availableContainers.length === 0}
          onClick={(e) => setMoveToContainerAnchor(e.currentTarget)}
        >
          Move to Container
          {availableContainers.length > 0 && (
            <ChevronRightIcon fontSize="small" sx={{ ml: 'auto' }} />
          )}
        </MenuItem>

        {contextMenu && (() => {
          const step = steps.find(s => s.id === contextMenu.stepId);
          const isInContainer = step && steps.some(s => {
            if (s.type !== 'loop' && s.type !== 'group') return false;
            return (s as LoopStep | GroupStep).stepIds.includes(contextMenu.stepId);
          });
          return isInContainer && (
            <MenuItem
              onClick={() => handleMoveToContainer(null)}
            >
              Extract to Root Level
            </MenuItem>
          );
        })()}
      </Menu>

      {/* Move to Container Submenu */}
      <Menu
        open={Boolean(moveToContainerAnchor)}
        anchorEl={moveToContainerAnchor}
        onClose={() => setMoveToContainerAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {availableContainers.map(container => (
          <MenuItem
            key={container.id}
            onClick={() => handleMoveToContainer(container.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={container.type.toUpperCase()}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  bgcolor: container.type === 'loop' ? 'secondary.main' : 'info.main',
                  color: 'white',
                }}
              />
              <Typography variant="body2">{container.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Edge Conflict Dialog */}
      <EdgeConflictDialog
        open={edgeConflictDialog.open}
        operation={edgeConflictDialog.operation}
        conflicts={edgeConflictDialog.conflicts}
        onConfirm={edgeConflictDialog.onConfirm}
        onCancel={() => setEdgeConflictDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
