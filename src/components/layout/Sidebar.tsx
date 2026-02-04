/**
 * Sidebar Component
 * Left sidebar for navigation and resource lists
 */

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useSidebarOpen } from '@/store/hooks';

const SIDEBAR_WIDTH = 280;

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: Array<{ id: string; label: string }>;
  onAddClick?: () => void;
}

interface SidebarProps {
  sections?: SidebarSection[];
  selectedItemId?: string | null;
  onItemClick?: (sectionId: string, itemId: string) => void;
}

export function Sidebar({ sections = [], selectedItemId, onItemClick }: SidebarProps) {
  const open = useSidebarOpen();
  // Start with all sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach(section => {
      initial[section.id] = true;
    });
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
          borderRight: 1,
          borderColor: 'divider',
          transition: 'transform 0.3s ease',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        <List>
          {sections.map((section, index) => (
            <Box key={section.id}>
              {index > 0 && <Divider />}

              <ListItem
                secondaryAction={
                  section.onAddClick && (
                    <IconButton
                      edge="end"
                      aria-label="add"
                      size="small"
                      onClick={section.onAddClick}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )
                }
                disablePadding
              >
                <ListItemButton onClick={() => toggleSection(section.id)}>
                  <ListItemIcon>{section.icon}</ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      fontWeight: 600,
                    }}
                  />
                  {expandedSections[section.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>

              <Collapse in={expandedSections[section.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items && section.items.length > 0 ? (
                    section.items.map(item => (
                      <ListItemButton
                        key={item.id}
                        sx={{ pl: 4 }}
                        selected={selectedItemId === item.id}
                        onClick={() => onItemClick?.(section.id, item.id)}
                      >
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            noWrap: true,
                          }}
                        />
                      </ListItemButton>
                    ))
                  ) : (
                    <ListItem sx={{ pl: 4 }}>
                      <ListItemText
                        primary="No items"
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                          fontStyle: 'italic',
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>

        {sections.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No sections available
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
