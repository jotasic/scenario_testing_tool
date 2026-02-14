/**
 * ConfigSidebar Component
 * Left sidebar panel showing servers, steps tree, and parameters navigation
 */

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Chip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  ListAlt as ListAltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Settings as ParametersIcon,
} from '@mui/icons-material';
import { StepTreeItem } from './StepTreeItem';
import type { Server, Step, Scenario } from '@/types';

export interface ConfigSidebarProps {
  // Data
  servers: Server[];
  steps: Step[];
  currentScenario: Scenario | null;

  // Selection state
  selectedServerId: string | null;
  selectedStepId: string | null;
  editorMode: 'item' | 'parameters';

  // Expand state
  expandedSections: Record<string, boolean>;
  expandedSteps: Set<string>;

  // Clipboard state
  cutStepId: string | null;

  // Handlers
  onServerSelect: (serverId: string) => void;
  onStepSelect: (stepId: string) => void;
  onParametersClick: () => void;
  onAddServer: () => void;
  onAddStep: () => void;
  onToggleSection: (sectionId: string) => void;
  onToggleStepExpand: (stepId: string) => void;
  onStepContextMenu: (event: React.MouseEvent, stepId: string) => void;
}

export function ConfigSidebar({
  servers,
  steps,
  currentScenario,
  selectedServerId,
  selectedStepId,
  editorMode,
  expandedSections,
  expandedSteps,
  cutStepId,
  onServerSelect,
  onStepSelect,
  onParametersClick,
  onAddServer,
  onAddStep,
  onToggleSection,
  onToggleStepExpand,
  onStepContextMenu,
}: ConfigSidebarProps) {
  /**
   * Get root level steps (steps that are not inside any container)
   */
  const rootSteps = useMemo(() => {
    const stepsInContainers = new Set<string>();

    const collectFromContainer = (stepIds: string[]) => {
      stepIds.forEach(id => {
        if (stepsInContainers.has(id)) return;
        const childStep = steps.find(s => s.id === id);
        if (!childStep) return;

        stepsInContainers.add(id);

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

    return steps.filter(s => !stepsInContainers.has(s.id));
  }, [steps]);

  const selectedItemId = selectedServerId || selectedStepId || null;

  return (
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
              <IconButton edge="end" size="small" onClick={onAddServer}>
                <AddIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => onToggleSection('servers')}>
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
                    selected={selectedItemId === server.id}
                    onClick={() => onServerSelect(server.id)}
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
                <IconButton edge="end" size="small" onClick={onAddStep}>
                  <AddIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemButton onClick={() => onToggleSection('steps')}>
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
                    cutStepId={cutStepId}
                    onToggle={onToggleStepExpand}
                    onSelect={onStepSelect}
                    onContextMenu={onStepContextMenu}
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
                onClick={onParametersClick}
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
}
