/**
 * ConfigEditor Component
 * Middle panel for editing selected server, step, or parameters
 */

import { Box, Paper, Typography } from '@mui/material';
import { ListAlt as ListAltIcon } from '@mui/icons-material';
import { EmptyState } from '@/components/common/EmptyState';
import { StepEditor } from '@/components/steps/StepEditor';
import { ServerEditor } from '@/components/servers/ServerEditor';
import { ParameterSchemaEditor } from '@/components/parameters/ParameterSchemaEditor';
import type { Server, Step, Scenario, ParameterSchema } from '@/types';

export interface ConfigEditorProps {
  // Data
  selectedServer: Server | null;
  selectedStepId: string | null;
  currentScenario: Scenario | null;
  steps: Step[];

  // Editor mode
  editorMode: 'item' | 'parameters';

  // Handlers
  onParameterSchemaChange: (schemas: ParameterSchema[]) => void;
}

export function ConfigEditor({
  selectedServer,
  selectedStepId,
  currentScenario,
  steps,
  editorMode,
  onParameterSchemaChange,
}: ConfigEditorProps) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {editorMode === 'parameters' && currentScenario ? (
        <ParameterSchemaEditor
          schemas={currentScenario.parameterSchema || []}
          steps={steps}
          onChange={onParameterSchemaChange}
        />
      ) : (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {selectedServer
                ? `Server: ${selectedServer.name}`
                : selectedStepId
                ? `Step: ${steps.find(s => s.id === selectedStepId)?.name || 'Unknown'}`
                : 'Configuration'}
            </Typography>
          </Paper>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {selectedServer ? (
              <ServerEditor server={selectedServer} />
            ) : selectedStepId ? (
              <StepEditor />
            ) : (
              <EmptyState
                icon={ListAltIcon}
                title="No Selection"
                message="Select a server or step to edit."
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
