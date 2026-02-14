/**
 * RequestStepEditor Component
 * Editor for HTTP request step configuration
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { RequestStep, HttpMethod, StepHeader } from '@/types';
import { useServers, useCurrentScenario } from '@/store/hooks';
import { BranchEditor } from './BranchEditor';
import { AvailableLoopVariables } from './AvailableLoopVariables';

interface RequestStepEditorProps {
  step: RequestStep;
  onChange: (changes: Partial<RequestStep>) => void;
}

export function RequestStepEditor({ step, onChange }: RequestStepEditorProps) {
  const servers = useServers();
  const scenario = useCurrentScenario();
  const [expandHeaders, setExpandHeaders] = useState(false);
  const [expandBranches, setExpandBranches] = useState(false);
  const [expandRetry, setExpandRetry] = useState(false);

  // Body editing state - use focus/blur pattern to avoid input issues
  const [bodyLocalValue, setBodyLocalValue] = useState(() =>
    typeof step.body === 'string' ? step.body : JSON.stringify(step.body, null, 2)
  );
  const [isBodyEditing, setIsBodyEditing] = useState(false);

  // Sync body from external changes when not editing
  useEffect(() => {
    if (!isBodyEditing) {
      setBodyLocalValue(
        typeof step.body === 'string' ? step.body : JSON.stringify(step.body, null, 2)
      );
    }
  }, [step.body, isBodyEditing]);

  const handleHeaderChange = (index: number, field: keyof StepHeader, value: any) => {
    const newHeaders = [...step.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    onChange({ headers: newHeaders });
  };

  const handleAddHeader = () => {
    onChange({
      headers: [
        ...step.headers,
        { key: '', value: '', enabled: true },
      ],
    });
  };

  const handleDeleteHeader = (index: number) => {
    const newHeaders = [...step.headers];
    newHeaders.splice(index, 1);
    onChange({ headers: newHeaders });
  };

  const handleRetryConfigChange = (field: string, value: any) => {
    onChange({
      retryConfig: {
        maxRetries: step.retryConfig?.maxRetries ?? 3,
        retryDelayMs: step.retryConfig?.retryDelayMs ?? 1000,
        retryOn: step.retryConfig?.retryOn ?? [500, 502, 503, 504],
        [field]: value,
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Available Loop Variables */}
      {scenario && (
        <AvailableLoopVariables
          currentStepId={step.id}
          allSteps={scenario.steps}
        />
      )}

      {/* Server and Method */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Target Server</InputLabel>
          <Select
            value={step.serverId}
            label="Target Server"
            onChange={(e) => onChange({ serverId: e.target.value })}
          >
            {servers.map((server) => (
              <MenuItem key={server.id} value={server.id}>
                {server.name} ({server.baseUrl})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Method</InputLabel>
          <Select
            value={step.method}
            label="Method"
            onChange={(e) => onChange({ method: e.target.value as HttpMethod })}
          >
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Endpoint */}
      <TextField
        label="Endpoint"
        value={step.endpoint}
        onChange={(e) => onChange({ endpoint: e.target.value })}
        placeholder="/api/users/${params.userId}"
        helperText={
          <Box component="span">
            Variables: <code style={{ backgroundColor: '#f5f5f5', padding: '0 4px', borderRadius: 2 }}>${'{params.name}'}</code> (parameter) or{' '}
            <code style={{ backgroundColor: '#f5f5f5', padding: '0 4px', borderRadius: 2 }}>${'{responses.stepId.field}'}</code> (response)
          </Box>
        }
        fullWidth
      />

      {/* Headers Section */}
      <Box>
        <Button
          onClick={() => setExpandHeaders(!expandHeaders)}
          endIcon={<ExpandMoreIcon sx={{ transform: expandHeaders ? 'rotate(180deg)' : 'none' }} />}
          fullWidth
          sx={{ justifyContent: 'space-between' }}
        >
          Headers ({step.headers.length})
        </Button>
        <Collapse in={expandHeaders}>
          <Paper sx={{ p: 2, mt: 1 }}>
            {step.headers.map((header, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Switch
                  checked={header.enabled}
                  onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
                  size="small"
                />
                <TextField
                  label="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  size="small"
                  sx={{ flex: 2 }}
                />
                <IconButton onClick={() => handleDeleteHeader(index)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddHeader}
              size="small"
              variant="outlined"
              fullWidth
            >
              Add Header
            </Button>
          </Paper>
        </Collapse>
      </Box>

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes(step.method) && (
        <TextField
          label="Request Body"
          value={bodyLocalValue}
          onFocus={() => setIsBodyEditing(true)}
          onChange={(e) => setBodyLocalValue(e.target.value)}
          onBlur={() => {
            setIsBodyEditing(false);
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(bodyLocalValue);
              onChange({ body: parsed });
            } catch {
              // If not valid JSON, store as string
              onChange({ body: bodyLocalValue });
            }
          }}
          multiline
          rows={6}
          placeholder={`{
  "userId": "\${params.userId}",
  "name": "\${params.userName}",
  "previousId": "\${responses.step1.data.id}"
}`}
          helperText={
            <Box component="span">
              JSON format. Example: <code style={{ backgroundColor: '#f5f5f5', padding: '0 4px', borderRadius: 2 }}>{'"value": "${params.name}"'}</code>
            </Box>
          }
          fullWidth
        />
      )}

      {/* Response Configuration */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
        <FormControlLabel
          control={
            <Switch
              checked={step.waitForResponse}
              onChange={(e) => onChange({ waitForResponse: e.target.checked })}
            />
          }
          label="Wait for Response"
        />
        <FormControlLabel
          control={
            <Switch
              checked={step.saveResponse}
              onChange={(e) => onChange({ saveResponse: e.target.checked })}
            />
          }
          label="Save Response"
        />
        <TextField
          label="Response Alias"
          value={step.responseAlias || ''}
          onChange={(e) => onChange({ responseAlias: e.target.value })}
          placeholder={step.id}
          disabled={!step.saveResponse}
          helperText={
            step.saveResponse ? (
              <Box component="span">
                Reference this response in other steps as:{' '}
                <code style={{ backgroundColor: '#f5f5f5', padding: '0 4px', borderRadius: 2 }}>
                  {`\${responses.${step.responseAlias || step.id}.field}`}
                </code>
                <br />
                Example: <code style={{ backgroundColor: '#f5f5f5', padding: '0 4px', borderRadius: 2 }}>
                  {`\${responses.${step.responseAlias || step.id}.data.id}`}
                </code>
              </Box>
            ) : (
              'Enable "Save Response" to set a response alias'
            )
          }
          size="small"
        />
      </Box>

      {/* Timeout */}
      <TextField
        label="Timeout Override (ms)"
        type="number"
        value={step.timeout || ''}
        onChange={(e) => onChange({ timeout: e.target.value ? parseInt(e.target.value) : undefined })}
        helperText="Leave empty to use server default"
        size="small"
      />

      {/* Retry Configuration */}
      <Box>
        <Button
          onClick={() => setExpandRetry(!expandRetry)}
          endIcon={<ExpandMoreIcon sx={{ transform: expandRetry ? 'rotate(180deg)' : 'none' }} />}
          fullWidth
          sx={{ justifyContent: 'space-between' }}
        >
          Retry Configuration
        </Button>
        <Collapse in={expandRetry}>
          <Paper sx={{ p: 2, mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Max Retries"
              type="number"
              value={step.retryConfig?.maxRetries ?? 3}
              onChange={(e) => handleRetryConfigChange('maxRetries', parseInt(e.target.value))}
              size="small"
            />
            <TextField
              label="Retry Delay (ms)"
              type="number"
              value={step.retryConfig?.retryDelayMs ?? 1000}
              onChange={(e) => handleRetryConfigChange('retryDelayMs', parseInt(e.target.value))}
              size="small"
            />
            <TextField
              label="Retry on Status Codes (comma-separated)"
              value={step.retryConfig?.retryOn?.join(', ') ?? '500, 502, 503, 504'}
              onChange={(e) =>
                handleRetryConfigChange(
                  'retryOn',
                  e.target.value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
                )
              }
              size="small"
            />
          </Paper>
        </Collapse>
      </Box>

      <Divider />

      {/* Branches Section */}
      <Box>
        <Button
          onClick={() => setExpandBranches(!expandBranches)}
          endIcon={<ExpandMoreIcon sx={{ transform: expandBranches ? 'rotate(180deg)' : 'none' }} />}
          fullWidth
          sx={{ justifyContent: 'space-between' }}
        >
          Response Branches ({step.branches?.length || 0})
        </Button>
        <Collapse in={expandBranches}>
          <Box sx={{ mt: 2 }}>
            <BranchEditor
              branches={step.branches || []}
              onChange={(branches) => onChange({ branches })}
            />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}
