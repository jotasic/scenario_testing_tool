/**
 * Import/Export Dialog Component
 * Provides UI for importing and exporting scenarios and data
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  LinearProgress,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Close as CloseIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useExport, useImport } from '@/hooks/useStorage';
import { useAppSelector } from '@/store/hooks';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type TabValue = 'import' | 'export';
type ExportFormat = 'json' | 'yaml';
type ExportScope = 'current' | 'all';

export function ImportExportDialog({ open, onClose }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportScope, setExportScope] = useState<ExportScope>('current');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentScenario = useAppSelector(state => {
    const currentId = state.scenarios.present.currentScenarioId;
    return state.scenarios.present.scenarios.find(s => s.id === currentId);
  });

  const { exportScenario, exportAll, isExporting, error: exportError } = useExport();
  const { importScenario, importAll, isImporting, error: importError } = useImport();

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    setSuccessMessage('');
    setErrorMessage('');
    setSelectedFile(null);
    setShowPreview(false);
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSuccessMessage('');
    setErrorMessage('');

    // Read file for preview
    try {
      const content = await file.text();
      setPreviewContent(content);
      setShowPreview(true);
    } catch {
      setErrorMessage('Failed to read file');
      setShowPreview(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');

    try {
      const filename = selectedFile.name.toLowerCase();

      if (filename.includes('backup') || exportScope === 'all') {
        // Import all data
        const result = await importAll(selectedFile);
        if (result.success) {
          setSuccessMessage(
            `Successfully imported ${result.scenarios} scenarios and ${result.servers} servers`
          );
          setSelectedFile(null);
          setShowPreview(false);
          setTimeout(() => onClose(), 2000);
        } else {
          setErrorMessage(result.error || 'Import failed');
        }
      } else {
        // Import single scenario
        const result = await importScenario(selectedFile);
        if (result.success) {
          setSuccessMessage(`Successfully imported scenario: ${result.scenario?.name}`);
          setSelectedFile(null);
          setShowPreview(false);
          setTimeout(() => onClose(), 2000);
        } else {
          setErrorMessage(result.error || 'Import failed');
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
    }
  }, [selectedFile, exportScope, importAll, importScenario, onClose]);

  const handleExport = useCallback(async () => {
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (exportScope === 'all') {
        const result = await exportAll();
        if (result.success) {
          setSuccessMessage('Successfully exported all data');
        } else {
          setErrorMessage(result.error || 'Export failed');
        }
      } else {
        if (!currentScenario) {
          setErrorMessage('No scenario selected');
          return;
        }
        const result = await exportScenario(exportFormat);
        if (result.success) {
          setSuccessMessage(`Successfully exported scenario: ${currentScenario.name}`);
        } else {
          setErrorMessage(result.error || 'Export failed');
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed');
    }
  }, [exportScope, exportFormat, currentScenario, exportAll, exportScenario]);

  const handleClose = () => {
    setSelectedFile(null);
    setShowPreview(false);
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Import / Export</Typography>
        <IconButton onClick={handleClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Export" value="export" icon={<DownloadIcon />} iconPosition="start" />
            <Tab label="Import" value="import" icon={<UploadIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {(isExporting || isImporting) && <LinearProgress sx={{ mb: 2 }} />}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {(errorMessage || exportError || importError) && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => {
              setErrorMessage('');
            }}
          >
            {errorMessage || exportError || importError}
          </Alert>
        )}

        {activeTab === 'export' && (
          <Box>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Export Scope</FormLabel>
              <RadioGroup
                value={exportScope}
                onChange={e => setExportScope(e.target.value as ExportScope)}
              >
                <FormControlLabel
                  value="current"
                  control={<Radio />}
                  label={`Current Scenario${currentScenario ? ` (${currentScenario.name})` : ''}`}
                  disabled={!currentScenario}
                />
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="All Data (Scenarios + Servers)"
                />
              </RadioGroup>
            </FormControl>

            {exportScope === 'current' && (
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Format</FormLabel>
                <RadioGroup
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as ExportFormat)}
                >
                  <FormControlLabel value="json" control={<Radio />} label="JSON" />
                  <FormControlLabel value="yaml" control={<Radio />} label="YAML" />
                </RadioGroup>
              </FormControl>
            )}

            {exportScope === 'current' && !currentScenario && (
              <Alert severity="warning">
                Please select a scenario in the Configuration view before exporting.
              </Alert>
            )}
          </Box>
        )}

        {activeTab === 'import' && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                />
              </Button>

              {selectedFile && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon color="action" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>

            {showPreview && previewContent && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Preview:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {previewContent.slice(0, 2000)}
                    {previewContent.length > 2000 && '\n... (truncated)'}
                  </pre>
                </Paper>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              Supported formats: JSON (.json) and YAML (.yaml, .yml)
              <br />
              Files named with "backup" will import all data (scenarios and servers).
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeTab === 'export' ? (
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting || (exportScope === 'current' && !currentScenario)}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!selectedFile || isImporting}
            startIcon={<UploadIcon />}
          >
            Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
