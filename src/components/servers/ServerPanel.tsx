/**
 * ServerPanel Component
 * Combined panel with ServerList and ServerEditor
 */

import { Box, Stack } from '@mui/material';
import { useSelectedServer } from '@/store/hooks';
import { ServerList } from './ServerList';
import { ServerEditor } from './ServerEditor';

export function ServerPanel() {
  const selectedServer = useSelectedServer();

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Stack spacing={3} sx={{ p: 3 }}>
        <ServerList />
        <ServerEditor server={selectedServer} />
      </Stack>
    </Box>
  );
}
