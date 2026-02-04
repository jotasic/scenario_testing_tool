/**
 * FlowControls - Custom control buttons for React Flow
 * Provides zoom, fit, and layout controls
 */

import { IconButton, Tooltip, Divider, Paper } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import MapIcon from '@mui/icons-material/Map';
import { useReactFlow } from 'reactflow';

interface FlowControlsProps {
  showGrid: boolean;
  showMinimap: boolean;
  onToggleGrid: () => void;
  onToggleMinimap: () => void;
  onLayoutReset?: () => void;
}

export default function FlowControls({
  showGrid,
  showMinimap,
  onToggleGrid,
  onToggleMinimap,
  onLayoutReset,
}: FlowControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    fitView({ duration: 200, padding: 0.2 });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        p: 0.5,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Zoom In */}
      <Tooltip title="Zoom In" placement="left">
        <IconButton
          size="small"
          onClick={handleZoomIn}
          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Zoom Out */}
      <Tooltip title="Zoom Out" placement="left">
        <IconButton
          size="small"
          onClick={handleZoomOut}
          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Fit View */}
      <Tooltip title="Fit to View" placement="left">
        <IconButton
          size="small"
          onClick={handleFitView}
          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
        >
          <FitScreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider />

      {/* Toggle Grid */}
      <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'} placement="left">
        <IconButton
          size="small"
          onClick={onToggleGrid}
          sx={{
            '&:hover': { backgroundColor: 'action.hover' },
            color: showGrid ? 'primary.main' : 'action.active',
          }}
        >
          {showGrid ? (
            <GridOnIcon fontSize="small" />
          ) : (
            <GridOffIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* Toggle Minimap */}
      <Tooltip title={showMinimap ? 'Hide Minimap' : 'Show Minimap'} placement="left">
        <IconButton
          size="small"
          onClick={onToggleMinimap}
          sx={{
            '&:hover': { backgroundColor: 'action.hover' },
            color: showMinimap ? 'primary.main' : 'action.active',
          }}
        >
          <MapIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Layout Reset (Optional) */}
      {onLayoutReset && (
        <>
          <Divider />
          <Tooltip title="Reset Layout" placement="left">
            <IconButton
              size="small"
              onClick={onLayoutReset}
              sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Paper>
  );
}
