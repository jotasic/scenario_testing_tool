/**
 * Header Component
 * App header with title, mode toggle, and action buttons
 */

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppDispatch, useUIMode } from '@/store/hooks';
import { setMode, toggleSidebar } from '@/store/uiSlice';

interface HeaderProps {
  onSave?: () => void;
  onLoad?: () => void;
  onSettings?: () => void;
}

export function Header({ onSave, onLoad, onSettings }: HeaderProps) {
  const dispatch = useAppDispatch();
  const mode = useUIMode();

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'config' | 'execution' | null) => {
    if (newMode !== null) {
      dispatch(setMode(newMode));
    }
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={handleToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Scenario Testing Tool
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            aria-label="view mode"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              },
            }}
          >
            <ToggleButton value="config" aria-label="configuration mode">
              Configuration
            </ToggleButton>
            <ToggleButton value="execution" aria-label="execution mode">
              Execution
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onLoad && (
            <Tooltip title="Load Scenario">
              <Button
                color="inherit"
                startIcon={<UploadIcon />}
                onClick={onLoad}
                size="small"
              >
                Load
              </Button>
            </Tooltip>
          )}

          {onSave && (
            <Tooltip title="Save Scenario">
              <Button
                color="inherit"
                startIcon={<SaveIcon />}
                onClick={onSave}
                size="small"
              >
                Save
              </Button>
            </Tooltip>
          )}

          {onSettings && (
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={onSettings} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
