/**
 * ExecutionLogs Component
 * Execution log viewer with filtering and detail expansion
 */

import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Stack,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Info,
  Warning,
  Error as ErrorIcon,
  BugReport,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useExecutionContext, useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearLogs } from '@/store/executionSlice';
import { setLogFilterLevel } from '@/store/uiSlice';
import type { ExecutionLog } from '@/types';
import { useState, useEffect, useRef, useMemo } from 'react';

const LOG_LEVEL_CONFIG = {
  info: { icon: Info, iconColor: 'info' as const, chipColor: 'info' as const, label: 'Info' },
  warn: { icon: Warning, iconColor: 'warning' as const, chipColor: 'warning' as const, label: 'Warning' },
  error: { icon: ErrorIcon, iconColor: 'error' as const, chipColor: 'error' as const, label: 'Error' },
  debug: { icon: BugReport, iconColor: 'action' as const, chipColor: 'default' as const, label: 'Debug' },
};

interface LogItemProps {
  log: ExecutionLog;
}

function LogItem({ log }: LogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = LOG_LEVEL_CONFIG[log.level];
  const Icon = config.icon;

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const hasData = log.data !== undefined && log.data !== null;

  return (
    <ListItem
      disablePadding
      sx={{
        borderLeft: 3,
        borderColor: `${config.chipColor}.main`,
        mb: 0.5,
      }}
    >
      <ListItemButton
        onClick={() => hasData && setExpanded(!expanded)}
        disabled={!hasData}
        sx={{ py: 0.5 }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-start" width="100%">
          <Icon
            fontSize="small"
            color={config.iconColor}
            sx={{ mt: 0.5, flexShrink: 0 }}
          />
          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', flexShrink: 0 }}
              >
                {formatTimestamp(log.timestamp)}
              </Typography>
              <Chip
                label={config.label}
                size="small"
                color={config.chipColor}
                sx={{ height: 18, fontSize: '0.625rem' }}
              />
              {log.stepId && (
                <Chip
                  label={log.stepId}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.625rem' }}
                />
              )}
            </Stack>
            <Typography
              variant="body2"
              sx={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {log.message}
            </Typography>
            {hasData && (
              <Collapse in={expanded}>
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </Box>
              </Collapse>
            )}
          </Box>
          {hasData && (
            <Box sx={{ flexShrink: 0 }}>
              {expanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </Box>
          )}
        </Stack>
      </ListItemButton>
    </ListItem>
  );
}

export function ExecutionLogs() {
  const dispatch = useAppDispatch();
  const context = useExecutionContext();
  const filterLevel = useAppSelector(state => state.ui.logFilterLevel);
  const autoScrollLogs = useAppSelector(state => state.ui.autoScrollLogs);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    if (!context) return [];
    if (filterLevel === 'all') return context.logs;
    return context.logs.filter(log => log.level === filterLevel);
  }, [context, filterLevel]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollLogs && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScrollLogs]);

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      dispatch(
        setLogFilterLevel(newFilter as 'all' | 'info' | 'warn' | 'error' | 'debug')
      );
    }
  };

  const handleClearLogs = () => {
    dispatch(clearLogs());
  };

  const logCounts = useMemo(() => {
    if (!context) return { info: 0, warn: 0, error: 0, debug: 0 };
    return context.logs.reduce(
      (acc, log) => {
        acc[log.level]++;
        return acc;
      },
      { info: 0, warn: 0, error: 0, debug: 0 }
    );
  }, [context]);

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 2, pb: 1 }}
      >
        <Typography variant="h6">Execution Logs</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {filteredLogs.length} logs
          </Typography>
          <Tooltip title="Clear logs">
            <IconButton
              size="small"
              onClick={handleClearLogs}
              disabled={!context || context.logs.length === 0}
            >
              <Clear fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filter Buttons */}
      <Box sx={{ px: 2, pb: 1 }}>
        <ToggleButtonGroup
          value={filterLevel}
          exclusive
          onChange={handleFilterChange}
          size="small"
          fullWidth
        >
          <ToggleButton value="all">
            All ({context?.logs.length || 0})
          </ToggleButton>
          <ToggleButton value="info">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Info fontSize="small" />
              <span>{logCounts.info}</span>
            </Stack>
          </ToggleButton>
          <ToggleButton value="warn">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Warning fontSize="small" />
              <span>{logCounts.warn}</span>
            </Stack>
          </ToggleButton>
          <ToggleButton value="error">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ErrorIcon fontSize="small" />
              <span>{logCounts.error}</span>
            </Stack>
          </ToggleButton>
          <ToggleButton value="debug">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BugReport fontSize="small" />
              <span>{logCounts.debug}</span>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider />

      {/* Log List */}
      <Box
        ref={listRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          minHeight: 200,
        }}
      >
        {filteredLogs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {context
                ? filterLevel === 'all'
                  ? 'No logs yet'
                  : `No ${filterLevel} logs`
                : 'Start execution to see logs'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {filteredLogs.map(log => (
              <LogItem key={log.id} log={log} />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
