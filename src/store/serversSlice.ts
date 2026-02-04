/**
 * Servers Slice
 * Manages server configurations and connections
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Server } from '@/types';
import { sampleServers } from '@/data/sampleScenario';

interface ServersState {
  servers: Server[];
  selectedServerId: string | null;
}

const initialState: ServersState = {
  servers: sampleServers,
  selectedServerId: null,
};

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    addServer: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
    },

    updateServer: (state, action: PayloadAction<{ id: string; changes: Partial<Server> }>) => {
      const index = state.servers.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.servers[index] = {
          ...state.servers[index],
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter(s => s.id !== action.payload);
      if (state.selectedServerId === action.payload) {
        state.selectedServerId = null;
      }
    },

    setSelectedServer: (state, action: PayloadAction<string | null>) => {
      state.selectedServerId = action.payload;
    },

    duplicateServer: (state, action: PayloadAction<string>) => {
      const original = state.servers.find(s => s.id === action.payload);
      if (original) {
        const timestamp = Date.now();
        const duplicate: Server = {
          ...original,
          id: `srv_${timestamp}`,
          name: `${original.name}_copy`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.servers.push(duplicate);
      }
    },

    // Bulk operations
    loadServers: (state, action: PayloadAction<Server[]>) => {
      // Replace all servers with loaded ones
      state.servers = action.payload;
      // If selected server no longer exists, clear selection
      if (state.selectedServerId && !action.payload.find(s => s.id === state.selectedServerId)) {
        state.selectedServerId = null;
      }
    },

    clearServers: (state) => {
      state.servers = [];
      state.selectedServerId = null;
    },
  },
});

export const {
  addServer,
  updateServer,
  deleteServer,
  setSelectedServer,
  duplicateServer,
  loadServers,
  clearServers,
} = serversSlice.actions;

export default serversSlice.reducer;
