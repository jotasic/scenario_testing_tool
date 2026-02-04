/**
 * UI Slice
 * Manages UI state, view modes, panel visibility, and user preferences
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type ViewMode = 'config' | 'execution';
type LogFilterLevel = 'all' | 'info' | 'warn' | 'error' | 'debug';

interface UIState {
  // View mode
  mode: ViewMode;

  // Selection state
  selectedStepId: string | null;

  // Panel visibility
  expandedPanels: {
    parameters: boolean;
    steps: boolean;
    execution: boolean;
    logs: boolean;
    variables: boolean;
    history: boolean;
  };

  // Layout
  sidebarOpen: boolean;
  rightPanelOpen: boolean;

  // Execution view preferences
  autoScrollLogs: boolean;
  logFilterLevel: LogFilterLevel;
  showStepDetails: boolean;
  expandedStepResults: string[];

  // Flow editor preferences
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoom: number;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

const initialState: UIState = {
  mode: 'config',
  selectedStepId: null,
  expandedPanels: {
    parameters: true,
    steps: true,
    execution: true,
    logs: true,
    variables: false,
    history: false,
  },
  sidebarOpen: true,
  rightPanelOpen: true,
  autoScrollLogs: true,
  logFilterLevel: 'all',
  showStepDetails: true,
  expandedStepResults: [],
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  zoom: 1,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // View mode
    setMode: (state, action: PayloadAction<ViewMode>) => {
      state.mode = action.payload;
    },

    toggleMode: state => {
      state.mode = state.mode === 'config' ? 'execution' : 'config';
    },

    // Selection
    setSelectedStep: (state, action: PayloadAction<string | null>) => {
      state.selectedStepId = action.payload;
    },

    // Panel management
    togglePanel: (state, action: PayloadAction<keyof UIState['expandedPanels']>) => {
      state.expandedPanels[action.payload] = !state.expandedPanels[action.payload];
    },

    setPanel: (
      state,
      action: PayloadAction<{ panel: keyof UIState['expandedPanels']; expanded: boolean }>
    ) => {
      state.expandedPanels[action.payload.panel] = action.payload.expanded;
    },

    expandAllPanels: state => {
      Object.keys(state.expandedPanels).forEach(key => {
        state.expandedPanels[key as keyof UIState['expandedPanels']] = true;
      });
    },

    collapseAllPanels: state => {
      Object.keys(state.expandedPanels).forEach(key => {
        state.expandedPanels[key as keyof UIState['expandedPanels']] = false;
      });
    },

    // Layout
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    toggleRightPanel: state => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },

    setRightPanel: (state, action: PayloadAction<boolean>) => {
      state.rightPanelOpen = action.payload;
    },

    // Execution view preferences
    setAutoScrollLogs: (state, action: PayloadAction<boolean>) => {
      state.autoScrollLogs = action.payload;
    },

    setLogFilterLevel: (state, action: PayloadAction<LogFilterLevel>) => {
      state.logFilterLevel = action.payload;
    },

    setShowStepDetails: (state, action: PayloadAction<boolean>) => {
      state.showStepDetails = action.payload;
    },

    toggleStepResult: (state, action: PayloadAction<string>) => {
      const index = state.expandedStepResults.indexOf(action.payload);
      if (index === -1) {
        state.expandedStepResults.push(action.payload);
      } else {
        state.expandedStepResults.splice(index, 1);
      }
    },

    expandAllStepResults: (state, action: PayloadAction<string[]>) => {
      state.expandedStepResults = action.payload;
    },

    collapseAllStepResults: state => {
      state.expandedStepResults = [];
    },

    // Flow editor preferences
    setShowGrid: (state, action: PayloadAction<boolean>) => {
      state.showGrid = action.payload;
    },

    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload;
    },

    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    },

    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(2, action.payload));
    },

    zoomIn: state => {
      state.zoom = Math.min(2, state.zoom + 0.1);
    },

    zoomOut: state => {
      state.zoom = Math.max(0.1, state.zoom - 0.1);
    },

    resetZoom: state => {
      state.zoom = 1;
    },

    // Notifications
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'info' | 'success' | 'warning' | 'error';
        message: string;
      }>
    ) => {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    clearNotifications: state => {
      state.notifications = [];
    },

    // Reset UI state
    resetUI: state => {
      return { ...initialState, notifications: state.notifications };
    },
  },
});

export const {
  setMode,
  toggleMode,
  setSelectedStep,
  togglePanel,
  setPanel,
  expandAllPanels,
  collapseAllPanels,
  toggleSidebar,
  setSidebar,
  toggleRightPanel,
  setRightPanel,
  setAutoScrollLogs,
  setLogFilterLevel,
  setShowStepDetails,
  toggleStepResult,
  expandAllStepResults,
  collapseAllStepResults,
  setShowGrid,
  setSnapToGrid,
  setGridSize,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  addNotification,
  removeNotification,
  clearNotifications,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
