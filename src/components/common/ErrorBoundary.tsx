/**
 * ErrorBoundary Component
 * Catches errors in component tree and displays user-friendly fallback UI
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary to catch and handle React component errors
 * Uses class component as required by React error boundary API
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportIssue = (): void => {
    // Placeholder for issue reporting
    // In production, this could open a GitHub issue or send to error tracking service
    console.log('Report issue clicked');
    console.log('Error:', this.state.error);
    console.log('Error Info:', this.state.errorInfo);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackMessage = 'An unexpected error occurred' } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: '600px',
              width: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />

            <Typography variant="h5" gutterBottom>
              {fallbackMessage}
            </Typography>

            <Alert severity="error" sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" component="div">
                <strong>Error:</strong> {error?.message || 'Unknown error'}
              </Typography>
            </Alert>

            {import.meta.env.DEV && errorInfo && (
              <Box
                sx={{
                  mt: 2,
                  mb: 3,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button variant="contained" color="primary" startIcon={<RefreshIcon />} onClick={this.handleReset}>
                Retry
              </Button>

              <Button variant="outlined" color="secondary" startIcon={<BugReportIcon />} onClick={this.handleReportIssue}>
                Report Issue
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
