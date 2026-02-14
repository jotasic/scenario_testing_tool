/**
 * AvailableLoopVariables Component
 * Shows available loop variables for the current step context
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import type { Step, LoopStep, ForEachLoop, CountLoop } from '@/types';

interface LoopContext {
  loopStepId: string;
  /** Display name for UI (can be Korean) */
  displayName: string;
  /** Variable name for code references (English identifier) */
  variableName: string;
  loopType: 'forEach' | 'count' | 'while';
  variables: {
    name: string;
    description: string;
    example: string;
  }[];
  depth: number;
}

interface AvailableLoopVariablesProps {
  currentStepId: string;
  allSteps: Step[];
}

export function AvailableLoopVariables({ currentStepId, allSteps }: AvailableLoopVariablesProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  /**
   * Find all parent loops that contain the current step
   * Returns loops from outermost to innermost
   */
  const loopContexts = useMemo((): LoopContext[] => {
    const contexts: LoopContext[] = [];

    // Recursive function to find parent loops
    const findParentLoops = (stepId: string, depth: number = 0): void => {
      const parentLoop = allSteps.find(
        (s) =>
          s.type === 'loop' &&
          (s as LoopStep).stepIds.includes(stepId)
      ) as LoopStep | undefined;

      if (parentLoop) {
        const loopConfig = parentLoop.loop;
        const variables: LoopContext['variables'] = [];
        const varName = parentLoop.variableName;

        // Generate variables based on loop type
        if (loopConfig.type === 'forEach') {
          const forEachConfig = loopConfig as ForEachLoop;
          const itemAlias = forEachConfig.itemAlias || 'item';
          const indexAlias = forEachConfig.indexAlias || 'index';

          // Index variable
          variables.push({
            name: `\${loops.${varName}.${indexAlias}}`,
            description: 'Current iteration index (0-based)',
            example: '0, 1, 2, ...',
          });

          // Item variable
          variables.push({
            name: `\${loops.${varName}.${itemAlias}}`,
            description: 'Current item from the array',
            example: 'The whole item object or value',
          });

          // Item field access (for object arrays)
          variables.push({
            name: `\${loops.${varName}.${itemAlias}.fieldName}`,
            description: 'Access a specific field of the current item',
            example: `\${loops.${varName}.${itemAlias}.id}`,
          });

          // Total count
          variables.push({
            name: `\${loops.${varName}.total}`,
            description: 'Total number of iterations',
            example: 'Total array length',
          });

          // CountField support
          if (forEachConfig.countField) {
            variables.push({
              name: `\${loops.${varName}.${itemAlias}.${forEachConfig.countField}}`,
              description: `Count field used for nested iteration`,
              example: `\${loops.${varName}.${itemAlias}.${forEachConfig.countField}}`,
            });
          }
        } else if (loopConfig.type === 'count') {
          const countConfig = loopConfig as CountLoop;

          // Index variable
          variables.push({
            name: `\${loops.${varName}.index}`,
            description: 'Current iteration index (0-based)',
            example: '0, 1, 2, ...',
          });

          // Total count
          variables.push({
            name: `\${loops.${varName}.total}`,
            description: 'Total number of iterations',
            example: typeof countConfig.count === 'number'
              ? countConfig.count.toString()
              : countConfig.count,
          });
        } else if (loopConfig.type === 'while') {
          // While loops don't have predefined iteration variables
          variables.push({
            name: `\${loops.${varName}.index}`,
            description: 'Current iteration index (0-based)',
            example: '0, 1, 2, ...',
          });
        }

        // Add this context to the beginning (outer loops first)
        // Display name: show name if set, otherwise variableName
        const displayName = parentLoop.name || varName;
        contexts.unshift({
          loopStepId: parentLoop.id,
          displayName,
          variableName: varName,
          loopType: loopConfig.type,
          variables,
          depth,
        });

        // Continue searching for outer loops
        findParentLoops(parentLoop.id, depth + 1);
      }
    };

    findParentLoops(currentStepId);
    return contexts;
  }, [currentStepId, allSteps]);

  /**
   * Copy variable to clipboard
   */
  const handleCopyVariable = async (variableName: string) => {
    try {
      await navigator.clipboard.writeText(variableName);
      setCopiedVariable(variableName);
      setTimeout(() => setCopiedVariable(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Don't render if not inside any loop
  if (loopContexts.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        mb: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Available Loop Variables
          </Typography>
          <Chip
            label={loopContexts.length}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'inherit',
              height: 20,
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <IconButton
          size="small"
          sx={{
            color: 'inherit',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              This step is inside {loopContexts.length === 1 ? 'a loop' : `${loopContexts.length} nested loops`}.
              Click on any variable to copy it to clipboard.
            </Typography>
          </Alert>

          {loopContexts.map((context, contextIndex) => (
            <Box
              key={context.loopStepId}
              sx={{
                mb: contextIndex < loopContexts.length - 1 ? 2 : 0,
                pl: context.depth * 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {context.displayName}
                </Typography>
                {context.displayName !== context.variableName && (
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    ({context.variableName})
                  </Typography>
                )}
                <Chip
                  label={context.loopType.toUpperCase()}
                  size="small"
                  color="secondary"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
                {context.depth > 0 && (
                  <Chip
                    label={`Level ${context.depth + 1}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {context.variables.map((variable, varIndex) => (
                  <Box
                    key={varIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: copiedVariable === variable.name
                        ? 'success.light'
                        : 'background.default',
                      transition: 'background-color 0.3s',
                      '&:hover': {
                        bgcolor: copiedVariable === variable.name
                          ? 'success.light'
                          : 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{
                            fontWeight: 600,
                            wordBreak: 'break-all',
                          }}
                        >
                          {variable.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {variable.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        fontFamily="monospace"
                        sx={{
                          mt: 0.5,
                          fontStyle: 'italic',
                          opacity: 0.7,
                        }}
                      >
                        Example: {variable.example}
                      </Typography>
                    </Box>
                    <Tooltip
                      title={copiedVariable === variable.name ? 'Copied!' : 'Copy to clipboard'}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyVariable(variable.name);
                        }}
                        sx={{
                          color: copiedVariable === variable.name ? 'success.main' : 'text.secondary',
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}
