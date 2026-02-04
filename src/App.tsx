/**
 * App Component
 * Main application component with routing and theme
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Snackbar, Alert, CircularProgress, Box } from '@mui/material';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfigPage } from '@/pages/ConfigPage';
import { ExecutionPage } from '@/pages/ExecutionPage';
import { ImportExportDialog } from '@/components/common/ImportExportDialog';
import { useUIMode } from '@/store/hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoadOnMount, useAutoSave, useManualSave } from '@/hooks/useStorage';

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Router wrapper to sync mode with route
function AppRouter() {
  const mode = useUIMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Load data on mount
  const { isLoading: isLoadingData, error: loadError } = useLoadOnMount();

  // Auto-save functionality (debounced to 2 seconds)
  const { isSaving, lastSaved } = useAutoSave(2000);

  // Manual save functionality
  const { save } = useManualSave();

  // Sync route with mode
  useEffect(() => {
    const expectedPath = mode === 'config' ? '/config' : '/execution';
    if (location.pathname !== expectedPath && location.pathname !== '/') {
      navigate(expectedPath, { replace: true });
    }
  }, [mode, navigate, location.pathname]);

  // Show error if loading failed
  useEffect(() => {
    if (loadError) {
      // Using a timeout to avoid synchronous setState within effect
      const timer = setTimeout(() => {
        setSnackbarMessage(`Failed to load data: ${loadError}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loadError]);

  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      setSnackbarMessage('Scenario saved successfully');
      setSnackbarSeverity('success');
    } else {
      setSnackbarMessage(result.error || 'Failed to save scenario');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  };

  const handleLoad = () => {
    setImportExportOpen(true);
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // TODO: Implement settings dialog
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Show loading screen while initializing
  if (isLoadingData) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <div>Loading scenarios and servers...</div>
      </Box>
    );
  }

  return (
    <>
      <AppLayout onSave={handleSave} onLoad={handleLoad} onSettings={handleSettings}>
        <Routes>
          <Route path="/" element={<Navigate to="/config" replace />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/execution" element={<ExecutionPage />} />
          <Route path="*" element={<Navigate to="/config" replace />} />
        </Routes>
      </AppLayout>

      <ImportExportDialog open={importExportOpen} onClose={() => setImportExportOpen(false)} />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Auto-save indicator */}
      {isSaving && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 9999,
          }}
        >
          <CircularProgress size={16} sx={{ color: 'white' }} />
          <span>Saving...</span>
        </Box>
      )}

      {lastSaved && !isSaving && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            zIndex: 9999,
          }}
        >
          Last saved: {lastSaved.toLocaleTimeString()}
        </Box>
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
