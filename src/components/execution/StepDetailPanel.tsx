/**
 * StepDetailPanel Component
 * TFX-style detailed panel for step execution results
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
  Table,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as WaitingIcon,
  Loop as RunningIcon,
  RemoveCircle as SkippedIcon,
  Cancel as CancelledIcon,
  ExpandMore as ExpandMoreIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Step, Scenario, StepExecutionResult, RequestStep, ConditionStep, LoopStep, GroupStep } from '@/types';
import FlowCanvas from '@/components/flow/FlowCanvas';
import { NestedLoopBreadcrumb } from '@/components/execution/NestedLoopBreadcrumb';

// Helper function to get step type emoji/icon
function getStepTypeIcon(step: Step) {
  switch (step.type) {
    case 'request':
      return '📡';
    case 'condition':
      return '🔀';
    case 'loop':
      return '🔁';
    case 'group':
      return '📦';
    default:
      return '📋';
  }
}

// Helper function to get step type label
function getStepTypeLabel(step: Step) {
  switch (step.type) {
    case 'request':
      return 'Request Step';
    case 'condition':
      return 'Condition Step';
    case 'loop':
      return 'Loop Step';
    case 'group':
      return 'Group Step';
    default:
      return 'Step';
  }
}

// Helper function to get status icon
function getStatusIcon(status: StepExecutionResult['status']) {
  switch (status) {
    case 'success':
      return <SuccessIcon color="success" />;
    case 'failed':
      return <ErrorIcon color="error" />;
    case 'running':
      return <RunningIcon color="primary" />;
    case 'waiting':
      return <WaitingIcon color="warning" />;
    case 'skipped':
      return <SkippedIcon color="disabled" />;
    case 'cancelled':
      return <CancelledIcon color="disabled" />;
    default:
      return <PendingIcon color="disabled" />;
  }
}

// Helper function to get status color
function getStatusColor(status: StepExecutionResult['status']) {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'primary';
    case 'waiting':
      return 'warning';
    case 'skipped':
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
}

// Helper function to format timestamp
function formatTime(timestamp?: string) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false });
}

// Helper function to format duration
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

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
  language?: string;
}

function JsonDisplay({ data, label, language = 'json' }: JsonDisplayProps) {
  const [expanded, setExpanded] = useState(true);

  const content = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2);

  return (
    <Box>
      {label && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary" fontWeight="medium">
            {label}
          </Typography>
        </Stack>
      )}
      <Collapse in={expanded}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '4px',
            fontSize: '0.875rem',
            maxHeight: '400px',
          }}
        >
          {content}
        </SyntaxHighlighter>
      </Collapse>
    </Box>
  );
}

interface InfoTableProps {
  rows: Array<{ label: string; value: React.ReactNode }>;
}

function InfoTable({ rows }: InfoTableProps) {
  return (
    <Table size="small" sx={{ '& td': { border: 0 } }}>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            <TableCell sx={{ width: '140px', fontWeight: 'medium', color: 'text.secondary', py: 0.75 }}>
              {row.label}
            </TableCell>
            <TableCell sx={{ py: 0.75 }}>{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface RequestTabProps {
  step: RequestStep;
  result?: StepExecutionResult;
}

function RequestTab({ step, result }: RequestTabProps) {
  return (
    <Stack spacing={3}>
      {/* Request Info */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Request Details
        </Typography>
        <InfoTable
          rows={[
            { label: 'Method', value: <Chip label={step.method} size="small" color="primary" /> as React.ReactNode },
            { label: 'Endpoint', value: <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{step.endpoint}</Typography> as React.ReactNode },
            { label: 'Server ID', value: <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{step.serverId}</Typography> as React.ReactNode },
            ...(result?.request ? [
              { label: 'Full URL', value: <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.request.url}</Typography> as React.ReactNode }
            ] : []),
          ]}
        />
      </Box>

      {/* Headers */}
      {result?.request?.headers && Object.keys(result.request.headers).length > 0 ? (
        <>
          <Divider />
          <JsonDisplay data={result.request.headers} label="Request Headers" />
        </>
      ) : null}

      {/* Request Body */}
      {result?.request?.body ? (
        <>
          <Divider />
          <JsonDisplay data={result.request.body} label="Request Body" />
        </>
      ) : null}
    </Stack>
  );
}

interface ResponseTabProps {
  result?: StepExecutionResult;
}

function ResponseTab({ result }: ResponseTabProps) {
  if (!result?.response) {
    return (
      <Alert severity="info">
        No response data available. The request may not have been sent yet or the response was not saved.
      </Alert>
    );
  }

  const { response } = result;
  const statusColor = response.status >= 200 && response.status < 300 ? 'success' : 'error';

  return (
    <Stack spacing={3}>
      {/* Response Info */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Response Details
        </Typography>
        <InfoTable
          rows={[
            {
              label: 'Status',
              value: (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`${response.status} ${response.statusText}`}
                    size="small"
                    color={statusColor}
                  />
                </Stack>
              ) as React.ReactNode
            },
            { label: 'Duration', value: <Typography variant="body2">{formatDuration(response.duration)}</Typography> as React.ReactNode },
          ]}
        />
      </Box>

      {/* Response Headers */}
      {response.headers && Object.keys(response.headers).length > 0 ? (
        <>
          <Divider />
          <JsonDisplay data={response.headers} label="Response Headers" />
        </>
      ) : null}

      {/* Response Body */}
      {response.data ? (
        <>
          <Divider />
          <JsonDisplay data={response.data} label="Response Body" />
        </>
      ) : null}
    </Stack>
  );
}

interface ConditionTabProps {
  step: ConditionStep;
  result?: StepExecutionResult;
}

function ConditionTab({ step }: ConditionTabProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Branches
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total branches: {step.branches.length}
        </Typography>
        <Stack spacing={2}>
          {step.branches.map((branch, index) => (
            <Paper key={branch.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight="medium">
                    Branch {index + 1}
                  </Typography>
                  {branch.isDefault && <Chip label="Default" size="small" color="primary" />}
                  {branch.label && <Chip label={branch.label} size="small" variant="outlined" />}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  → Next Step: {branch.nextStepId}
                </Typography>
                {branch.condition && (
                  <JsonDisplay data={branch.condition} label="Condition" />
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

interface LoopTabProps {
  step: LoopStep;
  result?: StepExecutionResult;
}

function LoopTab({ step, result }: LoopTabProps) {
  const loopConfig = step.loop;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Loop Configuration
        </Typography>
        <InfoTable
          rows={[
            { label: 'Loop Type', value: <Chip label={loopConfig.type} size="small" color="secondary" /> as React.ReactNode },
            ...(result?.iterations !== undefined && result?.currentIteration !== undefined ? [
              {
                label: 'Progress',
                value: (
                  <Typography variant="body2">
                    {result.currentIteration} / {result.iterations} iterations
                  </Typography>
                ) as React.ReactNode
              }
            ] : []),
            { label: 'Child Steps', value: <Typography variant="body2">{step.stepIds.length} steps</Typography> as React.ReactNode },
          ]}
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Loop Details
        </Typography>
        <JsonDisplay data={loopConfig} label={`${loopConfig.type} Configuration`} />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Child Step IDs
        </Typography>
        <Stack spacing={0.5}>
          {step.stepIds.map((stepId, index) => (
            <Typography key={stepId} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {index + 1}. {stepId}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

interface GroupTabProps {
  step: GroupStep;
  scenario: Scenario;
}

function GroupTab({ step, scenario }: GroupTabProps) {
  const childSteps = scenario.steps.filter(s => step.stepIds.includes(s.id));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Group Information
        </Typography>
        <InfoTable
          rows={[
            { label: 'Total Steps', value: <Typography variant="body2">{step.stepIds.length}</Typography> as React.ReactNode },
            { label: 'Collapsed', value: <Chip label={step.collapsed ? 'Yes' : 'No'} size="small" /> as React.ReactNode },
          ]}
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Contained Steps
        </Typography>
        <Stack spacing={1.5}>
          {childSteps.map((childStep, index) => (
            <Paper key={childStep.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{getStepTypeIcon(childStep)}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {index + 1}. {childStep.name}
                  </Typography>
                  <Chip label={childStep.type} size="small" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {childStep.id}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

interface SubGraphTabProps {
  step: LoopStep | GroupStep;
  scenario: Scenario;
}

function SubGraphTab({ step, scenario }: SubGraphTabProps) {
  // Filter steps that are inside this Loop/Group
  const filteredSteps = scenario.steps.filter(s => step.stepIds.includes(s.id));

  // Filter edges that connect steps inside this Loop/Group
  const filteredEdges = scenario.edges.filter(edge =>
    step.stepIds.includes(edge.sourceStepId) && step.stepIds.includes(edge.targetStepId)
  );

  if (filteredSteps.length === 0) {
    return (
      <Alert severity="info">
        No steps found inside this {step.type}.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '400px', width: '100%' }}>
      <FlowCanvas
        scenario={scenario}
        filteredSteps={filteredSteps}
        filteredEdges={filteredEdges}
        readonly={true}
        showMinimap={false}
        showGrid={true}
      />
    </Box>
  );
}

interface LogsTabProps {
  result?: StepExecutionResult;
}

function LogsTab({ result }: LogsTabProps) {
  if (!result?.startedAt && !result?.completedAt) {
    return (
      <Alert severity="info">
        No execution logs available yet.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Execution Timeline
        </Typography>
        <InfoTable
          rows={[
            { label: 'Started At', value: <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatTime(result.startedAt)}</Typography> as React.ReactNode },
            { label: 'Completed At', value: <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatTime(result.completedAt)}</Typography> as React.ReactNode },
            ...(result.startedAt && result.completedAt ? [{
              label: 'Duration',
              value: (
                <Typography variant="body2">
                  {formatDuration(new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime())}
                </Typography>
              ) as React.ReactNode
            }] : []),
          ]}
        />
      </Box>

      {result.error ? (
        <>
          <Divider />
          <Alert severity="error">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {result.error.code}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {result.error.message}
            </Typography>
            {result.error.details ? (
              <JsonDisplay data={result.error.details} label="Error Details" />
            ) : null}
          </Alert>
        </>
      ) : null}
    </Stack>
  );
}

export interface StepDetailPanelProps {
  step: Step;
  stepResult?: StepExecutionResult;
  scenario: Scenario;
  onClose?: () => void;
}

export function StepDetailPanel({ step, stepResult, scenario, onClose }: StepDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Calculate duration
  const duration = stepResult?.startedAt && stepResult?.completedAt
    ? new Date(stepResult.completedAt).getTime() - new Date(stepResult.startedAt).getTime()
    : stepResult?.response?.duration || 0;

  // Determine available tabs based on step type
  const tabs = [];

  if (step.type === 'request') {
    tabs.push({ label: 'Request', value: 0 });
    tabs.push({ label: 'Response', value: 1 });
  } else if (step.type === 'condition') {
    tabs.push({ label: 'Branches', value: 0 });
  } else if (step.type === 'loop') {
    tabs.push({ label: 'Loop Config', value: 0 });
    tabs.push({ label: 'Sub Graph', value: 1 });
  } else if (step.type === 'group') {
    tabs.push({ label: 'Group Info', value: 0 });
    tabs.push({ label: 'Sub Graph', value: 1 });
  }

  tabs.push({ label: 'Logs', value: tabs.length });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                {getStepTypeIcon(step)}
              </Typography>
              <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                {step.name}
              </Typography>
            </Stack>
            <Chip
              label={getStepTypeLabel(step)}
              size="small"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {stepResult && (
              <Stack direction="row" spacing={1} alignItems="center">
                {getStatusIcon(stepResult.status)}
                <Chip
                  label={stepResult.status}
                  color={getStatusColor(stepResult.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                  size="small"
                />
              </Stack>
            )}
            {onClose && (
              <IconButton size="small" onClick={onClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Metadata */}
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            ID: {step.id}
          </Typography>
          {step.description && (
            <Typography variant="body2" color="text.secondary">
              {step.description}
            </Typography>
          )}
          {duration > 0 && (
            <Stack direction="row" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Duration: {formatDuration(duration)}
              </Typography>
              {stepResult?.startedAt && (
                <Typography variant="body2" color="text.secondary">
                  Started: {formatTime(stepResult.startedAt)}
                </Typography>
              )}
              {stepResult?.completedAt && (
                <Typography variant="body2" color="text.secondary">
                  Finished: {formatTime(stepResult.completedAt)}
                </Typography>
              )}
            </Stack>
          )}

          {/* Loop Context Section */}
          {stepResult?.loopContext && stepResult.loopContext.length > 0 && (
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', display: 'block', mb: 0.5 }}>
                Loop Context:
              </Typography>
              <NestedLoopBreadcrumb loopStack={stepResult.loopContext} />
            </Box>
          )}
        </Stack>
      </Box>

      {/* Tabs */}
      {tabs.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {step.type === 'request' && (
          <>
            <TabPanel value={activeTab} index={0}>
              <RequestTab step={step as RequestStep} result={stepResult} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <ResponseTab result={stepResult} />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <LogsTab result={stepResult} />
            </TabPanel>
          </>
        )}

        {step.type === 'condition' && (
          <>
            <TabPanel value={activeTab} index={0}>
              <ConditionTab step={step as ConditionStep} result={stepResult} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <LogsTab result={stepResult} />
            </TabPanel>
          </>
        )}

        {step.type === 'loop' && (
          <>
            <TabPanel value={activeTab} index={0}>
              <LoopTab step={step as LoopStep} result={stepResult} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <SubGraphTab step={step as LoopStep} scenario={scenario} />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <LogsTab result={stepResult} />
            </TabPanel>
          </>
        )}

        {step.type === 'group' && (
          <>
            <TabPanel value={activeTab} index={0}>
              <GroupTab step={step as GroupStep} scenario={scenario} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <SubGraphTab step={step as GroupStep} scenario={scenario} />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <LogsTab result={stepResult} />
            </TabPanel>
          </>
        )}
      </Box>
    </Paper>
  );
}
