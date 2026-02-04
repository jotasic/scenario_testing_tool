/**
 * Redux Store Configuration
 * Combines all slices and exports the configured store
 */

import { configureStore } from '@reduxjs/toolkit';
import serversReducer from './serversSlice';
import scenariosReducer from './scenariosSlice';
import executionReducer from './executionSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    servers: serversReducer,
    scenarios: scenariosReducer,
    execution: executionReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization checks
        // This is useful for storing non-serializable data like Dates or functions
        ignoredActions: ['execution/executeHttpRequest/fulfilled'],
        ignoredPaths: ['execution.context.responses'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
