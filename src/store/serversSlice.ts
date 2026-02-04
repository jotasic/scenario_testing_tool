/**
 * Servers Slice
 * Manages server configurations and connections
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Server } from '@/types';

interface ServersState {
  servers: Server[];
  selectedServerId: string | null;
}

const initialState: ServersState = {
  servers: [
    {
      id: 'srv_sample_001',
      name: 'sample_server',
      baseUrl: 'https://jsonplaceholder.typicode.com',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      timeout: 30000,
      description: 'Sample server for testing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
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
  },
});

export const {
  addServer,
  updateServer,
  deleteServer,
  setSelectedServer,
  duplicateServer,
} = serversSlice.actions;

export default serversSlice.reducer;
