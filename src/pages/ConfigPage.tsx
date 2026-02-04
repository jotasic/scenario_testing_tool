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
import { EmptyState } from '@/components/common/EmptyState';
import { StepEditor } from '@/components/steps/StepEditor';
import { ServerEditor } from '@/components/servers/ServerEditor';
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
import { setSelectedServer } from '@/store/serversSlice';

export function ConfigPage() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useSidebarOpen();
  const servers = useServers();
  const currentScenario = useCurrentScenario();
  const steps = useCurrentSteps();
  const selectedStepId = useSelectedStepId();
  const selectedServer = useSelectedServer();

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

        {/* Bottom Section: Editor Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {selectedServer ? (
            <ServerEditor server={selectedServer} />
          ) : selectedStepId ? (
            <StepEditor />
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
