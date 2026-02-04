/**
 * ManualStepDialog Component
 * Dialog for manual step execution confirmation
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { PlayArrow, SkipNext } from '@mui/icons-material';
import { useCurrentExecutionStep, useAppDispatch } from '@/store/hooks';
import { resumeExecution, updateStepResult } from '@/store/executionSlice';
import type { RequestStep } from '@/types';

interface ManualStepDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ManualStepDialog({ open, onClose }: ManualStepDialogProps) {
  const dispatch = useAppDispatch();
  const currentStep = useCurrentExecutionStep();

  const handleExecute = () => {
    // Resume execution - the executor will handle executing the manual step
    dispatch(resumeExecution());
    onClose();
  };

  const handleSkip = () => {
    if (!currentStep) return;

    // Mark step as skipped
    dispatch(
      updateStepResult({
        stepId: currentStep.id,
        status: 'skipped',
        completedAt: new Date().toISOString(),
      })
    );

    // Resume execution to move to next step
    dispatch(resumeExecution());
    onClose();
  };

  if (!currentStep) {
    return null;
  }

  const isRequestStep = currentStep.type === 'request';
  const requestStep = isRequestStep ? (currentStep as RequestStep) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manual Step Confirmation</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">
            This step requires manual confirmation before execution.
          </Alert>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Step Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {currentStep.name}
            </Typography>
          </Box>

          {currentStep.description && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentStep.description}
              </Typography>
            </Box>
          )}

          <Divider />

          {requestStep && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Request Details
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    Method:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {requestStep.method}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    Endpoint:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {requestStep.endpoint}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Step ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="text.secondary">
              {currentStep.id}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSkip}
          startIcon={<SkipNext />}
          color="warning"
        >
          Skip
        </Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          startIcon={<PlayArrow />}
          autoFocus
        >
          Execute
        </Button>
      </DialogActions>
    </Dialog>
  );
}
