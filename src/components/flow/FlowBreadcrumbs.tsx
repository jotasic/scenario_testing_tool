/**
 * FlowBreadcrumbs - Navigation breadcrumbs for nested graph navigation
 * Allows users to navigate between container levels
 */

import { Box, Breadcrumbs, Link, Typography, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Home as HomeIcon } from '@mui/icons-material';

export interface NavigationLevel {
  stepId: string;
  name: string;
}

interface FlowBreadcrumbsProps {
  /** Current navigation path (empty array = root level) */
  path: NavigationLevel[];
  /** Called when user clicks on a breadcrumb to navigate */
  onNavigate: (index: number) => void;
}

export function FlowBreadcrumbs({ path, onNavigate }: FlowBreadcrumbsProps) {
  // Don't show breadcrumbs if at root level
  if (path.length === 0) {
    return null;
  }

  const handleBack = () => {
    // Navigate to parent level (one level up)
    onNavigate(Math.max(0, path.length - 2));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Back button */}
      <IconButton
        size="small"
        onClick={handleBack}
        aria-label="Go back to parent level"
        sx={{ mr: 0.5 }}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>

      {/* Breadcrumb navigation */}
      <Breadcrumbs separator="›" aria-label="navigation breadcrumbs">
        {/* Root level - always clickable */}
        <Link
          component="button"
          variant="body2"
          onClick={() => onNavigate(-1)}
          underline="hover"
          color={path.length > 0 ? 'inherit' : 'text.primary'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: 0,
            fontWeight: path.length === 0 ? 600 : 400,
          }}
        >
          <HomeIcon fontSize="small" />
          Main Flow
        </Link>

        {/* Container levels */}
        {path.map((level, index) => {
          const isLast = index === path.length - 1;

          if (isLast) {
            // Current level - not clickable
            return (
              <Typography
                key={level.stepId}
                color="text.primary"
                variant="body2"
                fontWeight={600}
              >
                {level.name}
              </Typography>
            );
          }

          // Previous levels - clickable
          return (
            <Link
              key={level.stepId}
              component="button"
              variant="body2"
              onClick={() => onNavigate(index)}
              underline="hover"
              color="inherit"
              sx={{
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
              }}
            >
              {level.name}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
