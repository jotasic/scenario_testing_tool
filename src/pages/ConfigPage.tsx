/**
 * ConfigPage Component
 * Configuration mode page with server/scenario/step editors
 */

import { useCallback, useState } from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import {
  Storage as StorageIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmptyState } from '@/components/common/EmptyState';
import { StepEditor } from '@/components/steps/StepEditor';
import { ServerEditor } from '@/components/servers/ServerEditor';
import { AddServerDialog } from '@/components/servers/AddServerDialog';
import { AddStepDialog } from '@/components/steps/AddStepDialog';
import FlowCanvas from '@/components/flow/FlowCanvas';
import {
  useServers,
  useCurrentScenario,
  useCurrentSteps,
  useSelectedStepId,
  useAppDispatch,
  useSidebarOpen,
  useSelectedServer,
} from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { addServer, setSelectedServer } from '@/store/serversSlice';
import { updateStep, addEdge, deleteEdge, deleteStep, addStep } from '@/store/scenariosSlice';
import type { Server, Step } from '@/types';

export function ConfigPage() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useSidebarOpen();
  const servers = useServers();
  const currentScenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();
  const selectedServer = useSelectedServer();

  // Dialog states
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);

  const handleItemClick = (sectionId: string, itemId: string) => {
    if (sectionId === 'servers') {
      dispatch(setSelectedServer(itemId));
      dispatch(setSelectedStep(null));
    } else if (sectionId === 'steps') {
      dispatch(setSelectedStep(itemId));
      dispatch(setSelectedServer(null));
    }
  };

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
      dispatch(setSelectedStep(step.id));
      dispatch(setSelectedServer(null));
    },
    [dispatch, currentScenario]
  );

  /**
   * Handle node click in graph - select step for editing
   */
  const handleNodeClick = useCallback(
    (stepId: string) => {
      dispatch(setSelectedStep(stepId));
      dispatch(setSelectedServer(null));
    },
    [dispatch]
  );

  /**
   * Handle node position changes and deletions in graph
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!currentScenario) return;

      changes.forEach(change => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Only update position when drag is complete
          dispatch(
            updateStep({
              scenarioId: currentScenario.id,
              stepId: change.id,
              changes: { position: change.position },
            })
          );
        } else if (change.type === 'remove') {
          // User deleted a node with Delete key
          dispatch(
            deleteStep({
              scenarioId: currentScenario.id,
              stepId: change.id,
            })
          );
        }
      });
    },
    [dispatch, currentScenario]
  );

  /**
   * Handle edge deletions in graph
   */
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!currentScenario) return;

      changes.forEach(change => {
        if (change.type === 'remove') {
          // User deleted an edge
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

  /**
   * Handle new connections in graph
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!currentScenario) return;
      if (!connection.source || !connection.target) return;

      // Create new edge
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

  const sidebarSections = [
    {
      id: 'servers',
      title: 'Servers',
      icon: <StorageIcon />,
      items: servers.map(server => ({
        id: server.id,
        label: server.name,
      })),
      onAddClick: handleAddServer,
    },
    {
      id: 'steps',
      title: 'Steps',
      icon: <ListAltIcon />,
      items: steps.map(step => ({
        id: step.id,
        label: step.name,
      })),
      onAddClick: currentScenario ? handleAddStep : undefined,
    },
  ];

  const getSelectedItemId = () => {
    return selectedServer?.id || selectedStepId || null;
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <Sidebar
        sections={sidebarSections}
        selectedItemId={getSelectedItemId()}
        onItemClick={handleItemClick}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ml: sidebarOpen ? 0 : 0,
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Top Section: Scenario Info */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {currentScenario ? (
            <Box>
              <Typography variant="h6">{currentScenario.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentScenario.description || 'No description'}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No scenario selected. Create or load a scenario to begin.
            </Typography>
          )}
        </Paper>

        <Divider />

        {/* Middle Section: Graph Editor (60% height) */}
        {currentScenario && (
          <Box
            sx={{
              height: '60%',
              minHeight: 400,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <FlowCanvas
              scenario={currentScenario}
              selectedStepId={selectedStepId}
              onNodeClick={handleNodeClick}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              readonly={false}
              showMinimap={true}
              showGrid={true}
            />
          </Box>
        )}

        <Divider />

        {/* Bottom Section: Editor Area (40% height) */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 200 }}>
          {selectedServer ? (
            <ServerEditor server={selectedServer} />
          ) : selectedStepId ? (
            <StepEditor />
          ) : (
            <EmptyState
              icon={ListAltIcon}
              title="No Selection"
              message={
                currentScenario
                  ? 'Select a server or step from the sidebar to edit its configuration, or click a node in the graph above.'
                  : 'Select a server or step from the sidebar to edit its configuration.'
              }
            />
          )}
        </Box>
      </Box>

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
