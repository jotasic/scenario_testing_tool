/**
 * App Component
 * Main application component with routing and theme
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfigPage } from '@/pages/ConfigPage';
import { ExecutionPage } from '@/pages/ExecutionPage';
import { useUIMode } from '@/store/hooks';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  // Sync route with mode
  useEffect(() => {
    const expectedPath = mode === 'config' ? '/config' : '/execution';
    if (location.pathname !== expectedPath && location.pathname !== '/') {
      navigate(expectedPath, { replace: true });
    }
  }, [mode, navigate, location.pathname]);

  const handleSave = () => {
    console.log('Save clicked');
    // TODO: Implement save functionality
  };

  const handleLoad = () => {
    console.log('Load clicked');
    // TODO: Implement load functionality
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // TODO: Implement settings dialog
  };

  return (
    <AppLayout onSave={handleSave} onLoad={handleLoad} onSettings={handleSettings}>
      <Routes>
        <Route path="/" element={<Navigate to="/config" replace />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/execution" element={<ExecutionPage />} />
        <Route path="*" element={<Navigate to="/config" replace />} />
      </Routes>
    </AppLayout>
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
