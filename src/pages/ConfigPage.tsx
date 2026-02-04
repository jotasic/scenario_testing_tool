/**
 * ConfigPage Component
 * Configuration mode page with server/scenario/step editors
 */

import { Box, Paper, Typography, Divider } from '@mui/material';
import {
  Storage as StorageIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { EmptyState } from '@/components/common/EmptyState';
import {
  useServers,
  useCurrentScenario,
  useCurrentSteps,
  useSelectedStepId,
  useAppDispatch,
  useSidebarOpen,
} from '@/store/hooks';
import { setSelectedStep } from '@/store/uiSlice';
import { setSelectedServer } from '@/store/serversSlice';
import { useState } from 'react';

export function ConfigPage() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useSidebarOpen();
  const servers = useServers();
  const currentScenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();

  const [selectedSection, setSelectedSection] = useState<'servers' | 'steps' | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const handleItemClick = (sectionId: string, itemId: string) => {
    if (sectionId === 'servers') {
      setSelectedSection('servers');
      setSelectedServerId(itemId);
      dispatch(setSelectedServer(itemId));
      dispatch(setSelectedStep(null));
    } else if (sectionId === 'steps') {
      setSelectedSection('steps');
      dispatch(setSelectedStep(itemId));
      setSelectedServerId(null);
    }
  };

  const handleAddServer = () => {
    // TODO: Open add server dialog
    console.log('Add server clicked');
  };

  const handleAddStep = () => {
    // TODO: Open add step dialog
    console.log('Add step clicked');
  };

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
    if (selectedSection === 'servers') return selectedServerId;
    if (selectedSection === 'steps') return selectedStepId;
    return null;
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

        {/* Bottom Section: Editor Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {selectedSection === 'servers' && selectedServerId ? (
            <ResizablePanel>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Server Editor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected server: {servers.find(s => s.id === selectedServerId)?.name}
                </Typography>
                {/* TODO: Add server editor form */}
              </Box>
            </ResizablePanel>
          ) : selectedSection === 'steps' && selectedStepId ? (
            <ResizablePanel>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Step Editor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected step: {steps.find(s => s.id === selectedStepId)?.name}
                </Typography>
                {/* TODO: Add step editor form */}
              </Box>
            </ResizablePanel>
          ) : (
            <EmptyState
              icon={ListAltIcon}
              title="No Selection"
              message="Select a server or step from the sidebar to edit its configuration."
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
