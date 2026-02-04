# Server Management Components

Clean and functional server management UI components built with Material-UI and Redux.

## Components

### ServerPanel
The main component that combines all server management features.

```tsx
import { ServerPanel } from '@/components/servers';

function App() {
  return <ServerPanel />;
}
```

### ServerList
Displays a list of all servers with add, select, and delete functionality.

**Features:**
- Add new server button
- Select server (highlights selected server)
- Delete server with confirmation dialog
- Shows server count badge
- Displays server metadata (URL, timeout, header count)

```tsx
import { ServerList } from '@/components/servers';

function Sidebar() {
  return <ServerList />;
}
```

### ServerEditor
Form for editing server configuration details.

**Features:**
- Name input (TextField)
- Base URL input with validation
- Timeout input (number)
- Description input (multiline TextField)
- Headers list management
- Form validation
- Success feedback after save

```tsx
import { ServerEditor } from '@/components/servers';
import { useSelectedServer } from '@/store/hooks';

function EditorPanel() {
  const selectedServer = useSelectedServer();
  return <ServerEditor server={selectedServer} />;
}
```

### ServerHeaderEditor
Key-value pair editor for HTTP headers.

**Features:**
- Add/remove headers
- Enable/disable toggle for each header
- Variable reference hint (shows ${token} syntax)
- Visual indication for disabled headers

```tsx
import { ServerHeaderEditor } from '@/components/servers';

function HeaderConfig() {
  const [headers, setHeaders] = useState<ServerHeader[]>([]);
  return <ServerHeaderEditor headers={headers} onChange={setHeaders} />;
}
```

## Redux Integration

All components are connected to Redux using typed hooks:

```tsx
// Custom hooks used
import {
  useServers,           // Get all servers
  useSelectedServer,    // Get currently selected server
  useAppDispatch,       // Typed dispatch function
} from '@/store/hooks';

// Actions dispatched
import {
  addServer,           // Add new server
  updateServer,        // Update server configuration
  deleteServer,        // Delete server
  setSelectedServer,   // Set selected server ID
} from '@/store/serversSlice';
```

## Variable References

Headers and other fields support variable references using the `${variable}` syntax:

- `${token}` - Reference a parameter
- `${response.step_id.field}` - Reference a step response field

The ServerHeaderEditor component includes a helpful hint panel explaining this syntax.

## Layout

```
ServerPanel
├── ServerList (top)
│   ├── Header with Add button
│   └── List of servers
│       ├── Server item (clickable)
│       └── Delete button (with confirmation)
└── ServerEditor (bottom)
    ├── Basic info fields
    │   ├── Name
    │   ├── Base URL
    │   ├── Timeout
    │   └── Description
    ├── ServerHeaderEditor
    │   ├── Header list
    │   └── Add header button
    └── Save button
```

## Styling

All components use Material-UI components with consistent spacing and typography:

- Paper components with outlined variant for cards
- Proper color usage (primary, error, text.secondary)
- Responsive spacing using MUI's spacing system
- Accessible focus states and ARIA labels
- Icons from @mui/icons-material

## Accessibility

- All interactive elements have aria-labels
- Delete confirmation dialog for destructive actions
- Keyboard navigation support
- Focus states on all interactive elements
- Proper semantic HTML structure

## Type Safety

All components are fully typed with TypeScript:

```typescript
interface ServerEditorProps {
  server: Server | null;
}

interface ServerHeaderEditorProps {
  headers: ServerHeader[];
  onChange: (headers: ServerHeader[]) => void;
  disabled?: boolean;
}
```
