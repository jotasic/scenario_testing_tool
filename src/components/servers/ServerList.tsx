/**
 * ServerList Component
 * Displays list of servers with add, select, and delete functionality
 */

import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAppDispatch, useServers, useSelectedServer } from '@/store/hooks';
import {
  addServer,
  deleteServer,
  setSelectedServer,
} from '@/store/serversSlice';
import type { Server } from '@/types';

export function ServerList() {
  const dispatch = useAppDispatch();
  const servers = useServers();
  const selectedServer = useSelectedServer();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null);

  const handleAddServer = () => {
    const timestamp = Date.now();
    const newServer: Server = {
      id: `srv_${timestamp}`,
      name: `server_${timestamp}`,
      baseUrl: 'https://api.example.com',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ],
      timeout: 30000,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addServer(newServer));
    dispatch(setSelectedServer(newServer.id));
  };

  const handleSelectServer = (serverId: string) => {
    dispatch(
      setSelectedServer(serverId === selectedServer?.id ? null : serverId)
    );
  };

  const handleDeleteClick = (server: Server, event: React.MouseEvent) => {
    event.stopPropagation();
    setServerToDelete(server);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (serverToDelete) {
      dispatch(deleteServer(serverToDelete.id));
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setServerToDelete(null);
  };

  return (
    <Box>
      <Paper variant="outlined">
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <StorageIcon color="primary" />
            <Typography variant="h6">Servers</Typography>
            <Chip label={servers.length} size="small" color="primary" />
          </Stack>
          <Tooltip title="Add new server">
            <IconButton
              onClick={handleAddServer}
              color="primary"
              size="small"
              aria-label="Add server"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {servers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No servers configured
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddServer}
            >
              Add First Server
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {servers.map((server, index) => (
              <ListItem
                key={server.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => handleDeleteClick(server, e)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  borderBottom:
                    index < servers.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <ListItemButton
                  selected={selectedServer?.id === server.id}
                  onClick={() => handleSelectServer(server.id)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      borderLeft: 3,
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {server.name}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {server.baseUrl}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`${server.timeout}ms`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${server.headers.filter((h) => h.enabled).length} headers`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Server</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{serverToDelete?.name}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            This action cannot be undone. Any scenarios using this server may
            need to be updated.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
