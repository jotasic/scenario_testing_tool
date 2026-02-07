/**
 * EdgeConflictDialog Component
 * Displays edge conflict warnings when cutting/moving steps to containers
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { EdgeConflict } from '@/utils/edgeConflictUtils';

interface EdgeConflictDialogProps {
  open: boolean;
  operation: 'cut' | 'move';
  conflicts: EdgeConflict[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function EdgeConflictDialog({
  open,
  operation,
  conflicts,
  onConfirm,
  onCancel,
}: EdgeConflictDialogProps) {
  const operationLabel = operation === 'cut' ? 'Cut' : 'Move';
  const operationVerb = operation === 'cut' ? 'cutting' : 'moving';

  // Group conflicts by type
  const outgoingConflicts = conflicts.filter(c => c.conflictType === 'outgoing');
  const incomingConflicts = conflicts.filter(c => c.conflictType === 'incoming');

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="edge-conflict-dialog-title"
    >
      <DialogTitle id="edge-conflict-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="span">
            Edge Connection Warning
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {operationLabel} the selected step(s) will remove {conflicts.length} edge
          connection{conflicts.length !== 1 ? 's' : ''}.
        </Alert>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          The following edge connections will be removed when {operationVerb} the selected
          step(s):
        </Typography>

        {outgoingConflicts.length > 0 && (
          <>
            <Typography
              variant="subtitle2"
              sx={{ mt: 2, mb: 1, fontWeight: 600 }}
            >
              Outgoing Connections ({outgoingConflicts.length})
            </Typography>
            <List dense disablePadding>
              {outgoingConflicts.map((conflict, index) => (
                <ListItem key={`outgoing-${index}`} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ArrowForwardIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        <strong>{conflict.sourceStep.name}</strong>
                        {' → '}
                        {conflict.targetStep.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {conflict.edge.label || 'Default connection'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {incomingConflicts.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Incoming Connections ({incomingConflicts.length})
            </Typography>
            <List dense disablePadding>
              {incomingConflicts.map((conflict, index) => (
                <ListItem key={`incoming-${index}`} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ArrowForwardIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {conflict.sourceStep.name}
                        {' → '}
                        <strong>{conflict.targetStep.name}</strong>
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {conflict.edge.label || 'Default connection'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You can reconnect these edges manually after the operation.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="warning" variant="contained" autoFocus>
          Continue {operationLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
