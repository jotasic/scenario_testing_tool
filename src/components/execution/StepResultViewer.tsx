/**
 * StepResultViewer Component
 * Detailed viewer for step execution results
 */

import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Stack,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useStepResult, useStepById } from '@/store/hooks';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface JsonDisplayProps {
  data: unknown;
  label?: string;
}

function JsonDisplay({ data, label }: JsonDisplayProps) {
  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflow: 'auto',
          maxHeight: 400,
        }}
      >
        <pre style={{ margin: 0 }}>
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </Box>
    </Box>
  );
}

interface KeyValueListProps {
  items: Array<{ key: string; value: string }>;
}

function KeyValueList({ items }: KeyValueListProps) {
  return (
    <Stack spacing={1}>
      {items.map(({ key, value }) => (
        <Stack key={key} direction="row" spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 120, fontWeight: 'medium' }}
          >
            {key}:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
          >
            {value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

interface StepResultViewerProps {
  stepId: string | null;
}

export function StepResultViewer({ stepId }: StepResultViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const result = useStepResult(stepId);
  const step = useStepById(stepId);

  if (!stepId) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Select a step to view execution results
        </Typography>
      </Paper>
    );
  }

  if (!result) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Step has not been executed yet
        </Typography>
      </Paper>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const duration = result.startedAt && result.completedAt
    ? new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()
    : result.response?.duration || 0;

  const statusColor =
    result.status === 'success'
      ? 'success'
      : result.status === 'failed'
      ? 'error'
      : result.status === 'running'
      ? 'primary'
      : result.status === 'waiting'
      ? 'warning'
      : 'default';

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" noWrap>
              {step?.name || result.stepId}
            </Typography>
            <Chip
              label={result.status}
              color={statusColor}
              size="small"
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {result.stepId}
          </Typography>
          {duration > 0 && (
            <Typography variant="body2" color="text.secondary">
              Duration: {duration}ms
            </Typography>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Request" disabled={!result.request} />
          <Tab label="Response" disabled={!result.response} />
          <Tab label="Error" disabled={!result.error} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Request Tab */}
        <TabPanel value={activeTab} index={0}>
          {!result.request ? (
            <Typography variant="body2" color="text.secondary">
              No request data available
            </Typography>
          ) : (
            <Stack spacing={3}>
              <KeyValueList
                items={[
                  { key: 'Method', value: result.request.method },
                  { key: 'URL', value: result.request.url },
                ]}
              />
              <Divider />
              <JsonDisplay data={result.request.headers} label="Headers" />
              {result.request.body ? (
                <Stack spacing={3}>
                  <Divider />
                  <JsonDisplay data={result.request.body} label="Body" />
                </Stack>
              ) : null}
            </Stack>
          )}
        </TabPanel>

        {/* Response Tab */}
        <TabPanel value={activeTab} index={1}>
          {!result.response ? (
            <Typography variant="body2" color="text.secondary">
              No response data available
            </Typography>
          ) : (
            <Stack spacing={3}>
              <KeyValueList
                items={[
                  { key: 'Status', value: `${result.response.status} ${result.response.statusText}` },
                  { key: 'Duration', value: `${result.response.duration}ms` },
                ]}
              />
              <Divider />
              <JsonDisplay data={result.response.headers} label="Headers" />
              {result.response.data ? (
                <Stack spacing={3}>
                  <Divider />
                  <JsonDisplay data={result.response.data} label="Response Data" />
                </Stack>
              ) : null}
            </Stack>
          )}
        </TabPanel>

        {/* Error Tab */}
        <TabPanel value={activeTab} index={2}>
          {!result.error ? (
            <Typography variant="body2" color="text.secondary">
              No error information
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Alert severity="error">
                <Typography variant="body2" fontWeight="medium">
                  {result.error.code}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {result.error.message}
                </Typography>
              </Alert>
              {result.error.details ? (
                <Stack spacing={2}>
                  <Divider />
                  <JsonDisplay data={result.error.details} label="Error Details" />
                </Stack>
              ) : null}
            </Stack>
          )}
        </TabPanel>
      </Box>
    </Paper>
  );
}
