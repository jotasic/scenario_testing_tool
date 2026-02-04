# Storage Implementation Guide

## Overview

The Scenario Testing Tool now includes comprehensive save/load functionality with local storage persistence using IndexedDB. This implementation provides automatic saving, manual save/load, and import/export capabilities with support for JSON and YAML formats.

## Architecture

### Storage Layer
- **IndexedDB**: Browser-based database for persistent storage
- **Database Name**: `scenario-tool-db`
- **Object Stores**:
  - `scenarios`: Stores all scenario definitions
  - `servers`: Stores all server configurations

### Components Created

```
src/
├── services/
│   └── storage.ts              # Core storage service with IndexedDB operations
├── hooks/
│   └── useStorage.ts           # React hooks for storage operations
└── components/
    └── common/
        └── ImportExportDialog.tsx  # UI for import/export functionality
```

## Features

### 1. Auto-Save Functionality

The application automatically saves scenarios and servers to IndexedDB with debouncing to prevent excessive writes.

**Implementation:**
- Uses `useAutoSave()` hook with 2-second debounce
- Monitors Redux state changes
- Only saves when data actually changes
- Visual indicator shows save status

**Usage in App.tsx:**
```typescript
const { isSaving, lastSaved } = useAutoSave(2000);
```

### 2. Manual Save

Users can manually save the current scenario using the Save button in the header.

**Implementation:**
- Uses `useManualSave()` hook
- Saves current scenario immediately
- Shows success/error feedback via Snackbar

**Usage:**
```typescript
const { save, isSaving, error } = useManualSave();
const result = await save();
```

### 3. Load on Mount

Application automatically loads all scenarios and servers when it starts.

**Implementation:**
- Uses `useLoadOnMount()` hook
- Shows loading screen during initialization
- Handles errors gracefully
- Initializes IndexedDB on first run

**Features:**
- Loading indicator during data retrieval
- Error handling with user feedback
- Prevents duplicate loading

### 4. Import/Export

Users can import and export scenarios and server configurations.

**Supported Formats:**
- **JSON**: Full fidelity, recommended for backups
- **YAML**: Human-readable format

**Export Options:**
- **Current Scenario**: Export single scenario with metadata
- **All Data**: Export all scenarios and servers (backup)

**Import Options:**
- **Single Scenario**: Import one scenario file
- **Full Backup**: Import complete data backup

## Storage Service API

### Core Functions

#### Initialize Database
```typescript
await initDatabase(): Promise<ScenarioToolDB>
```
Initializes the IndexedDB database. Creates object stores if they don't exist.

#### Scenario Operations

```typescript
// Save/update a scenario
await saveScenario(scenario: Scenario): Promise<void>

// Load all scenarios
await loadScenarios(): Promise<Scenario[]>

// Load single scenario by ID
await loadScenario(id: string): Promise<Scenario | undefined>

// Delete a scenario
await deleteScenario(id: string): Promise<void>
```

#### Server Operations

```typescript
// Save all servers
await saveServers(servers: Server[]): Promise<void>

// Save single server
await saveServer(server: Server): Promise<void>

// Load all servers
await loadServers(): Promise<Server[]>

// Delete a server
await deleteServerFromDB(id: string): Promise<void>
```

#### Import/Export Functions

```typescript
// Export to JSON
exportToJson(scenario: Scenario): string

// Import from JSON
importFromJson(json: string): Scenario

// Export to YAML
exportToYaml(scenario: Scenario): string

// Import from YAML
importFromYaml(yaml: string): Scenario

// Export all data
await exportAllData(): Promise<string>

// Import all data
await importAllData(json: string): Promise<{ scenarios: number; servers: number }>
```

#### Utility Functions

```typescript
// Clear all data from IndexedDB
await clearAllData(): Promise<void>

// Export servers to JSON
exportServersToJson(servers: Server[]): string

// Import servers from JSON
importServersFromJson(json: string): Server[]
```

## React Hooks API

### useLoadOnMount()

Loads data from IndexedDB when the app mounts.

```typescript
const { isLoading, error } = useLoadOnMount();
```

**Returns:**
- `isLoading`: Boolean indicating loading state
- `error`: Error message if loading failed

### useAutoSave(debounceMs?)

Automatically saves changes to IndexedDB with debouncing.

```typescript
const { isSaving, lastSaved } = useAutoSave(2000);
```

**Parameters:**
- `debounceMs`: Debounce delay in milliseconds (default: 1000)

**Returns:**
- `isSaving`: Boolean indicating save in progress
- `lastSaved`: Date of last successful save

### useManualSave()

Provides manual save functionality for current scenario.

```typescript
const { save, isSaving, error } = useManualSave();
const result = await save();
```

**Returns:**
- `save`: Async function to trigger save
- `isSaving`: Boolean indicating save in progress
- `error`: Error message if save failed

### useExport()

Handles exporting scenarios and data.

```typescript
const { exportScenario, exportAll, isExporting, error } = useExport();

// Export current scenario
await exportScenario('json'); // or 'yaml'

// Export all data
await exportAll();
```

**Returns:**
- `exportScenario`: Function to export single scenario
- `exportAll`: Function to export all data
- `isExporting`: Boolean indicating export in progress
- `error`: Error message if export failed

### useImport()

Handles importing scenarios and data.

```typescript
const { importScenario, importAll, isImporting, error } = useImport();

// Import single scenario
await importScenario(file);

// Import all data
await importAll(file);
```

**Returns:**
- `importScenario`: Function to import single scenario
- `importAll`: Function to import full backup
- `isImporting`: Boolean indicating import in progress
- `error`: Error message if import failed

### useUnsavedChanges()

Tracks whether there are unsaved changes.

```typescript
const { hasUnsavedChanges, markAsSaved } = useUnsavedChanges();
```

**Returns:**
- `hasUnsavedChanges`: Boolean indicating unsaved changes
- `markAsSaved`: Function to mark state as saved

## User Interface

### Header Buttons

**Save Button:**
- Manually saves current scenario
- Shows success/error feedback
- Disabled when no scenario is selected

**Load Button:**
- Opens Import/Export dialog
- Provides access to import and export features

### Import/Export Dialog

**Export Tab:**
- Select scope (current scenario or all data)
- Choose format (JSON or YAML for single scenario)
- Click Export to download file

**Import Tab:**
- Click "Select File" to choose file
- Preview file contents
- Click Import to load data
- Supports .json, .yaml, and .yml files

### Visual Indicators

**Auto-Save Indicator:**
- Shows "Saving..." with spinner during save
- Shows "Last saved: [time]" after successful save
- Located at bottom-left of screen

**Loading Screen:**
- Displays during initial data load
- Shows spinner and "Loading scenarios and servers..." message

**Snackbar Notifications:**
- Success messages for save/import/export
- Error messages with details
- Auto-dismiss after 4 seconds
- Located at bottom-right of screen

## Data Format

### Scenario Export (JSON)
```json
{
  "id": "scn_001",
  "name": "Sample Scenario",
  "description": "Description here",
  "version": "1.0.0",
  "serverIds": ["srv_001"],
  "parameterSchema": [...],
  "steps": [...],
  "edges": [...],
  "startStepId": "step_001",
  "tags": ["tag1", "tag2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Full Backup Format
```json
{
  "version": "1.0.0",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "scenarios": [...],
  "servers": [...]
}
```

## Error Handling

All storage operations include comprehensive error handling:

1. **Database Initialization Errors**: Caught and logged, user notified
2. **Save Errors**: Displayed via Snackbar with error details
3. **Load Errors**: Displayed via Snackbar, app continues with empty state
4. **Import Errors**: Validation errors shown in dialog with specific issues
5. **Export Errors**: Displayed via Snackbar with error details

### Validation

Import operations validate data structure:
- Required fields presence
- Correct data types
- Array structure validation
- Timestamp format validation

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge (all versions)

Storage quota varies by browser:
- Chrome: ~60% of available disk space
- Firefox: Up to 2GB per origin
- Safari: 1GB per origin

## Performance Considerations

1. **Debouncing**: Auto-save uses 2-second debounce to reduce writes
2. **Batch Operations**: Loading uses transactions for efficiency
3. **Indexes**: Database has indexes on name, createdAt, updatedAt
4. **Lazy Loading**: Data only loaded on app mount, not on every render

## Migration Notes

### From Previous Version

If upgrading from a version without storage:
1. First load will find empty database
2. Sample scenario will be available from code
3. Users should export existing work before clearing browser data

### Database Version Changes

Database version is currently 1. If schema changes in future:
1. Update DB_VERSION constant
2. Add migration logic in upgrade callback
3. Handle data transformation

## Testing Recommendations

1. **Save/Load Cycle**: Create scenario, save, refresh page, verify data persists
2. **Auto-Save**: Make changes, wait for indicator, refresh, verify persistence
3. **Import/Export**: Export scenario, clear data, import, verify integrity
4. **Error Cases**: Test with invalid JSON/YAML, verify error messages
5. **Large Data**: Test with many scenarios to verify performance

## Troubleshooting

### Data Not Persisting

1. Check browser console for errors
2. Verify IndexedDB is enabled in browser settings
3. Check storage quota hasn't been exceeded
4. Try clearing IndexedDB and restarting

### Import Fails

1. Verify file format (JSON or YAML)
2. Check file isn't corrupted
3. Verify required fields are present
4. Check browser console for validation errors

### Performance Issues

1. Check number of scenarios (consider pagination if >100)
2. Verify debounce delay is appropriate
3. Check browser storage quota usage
4. Consider clearing old/unused scenarios

## Future Enhancements

Possible improvements for future versions:

1. **Cloud Sync**: Sync data across devices
2. **Version Control**: Track scenario changes over time
3. **Conflict Resolution**: Handle concurrent edits
4. **Compression**: Compress large scenarios
5. **Selective Export**: Export specific scenarios
6. **Import Merge**: Merge imported data with existing
7. **Undo/Redo**: Implement history management
8. **Auto-Export**: Periodic automatic backups
9. **Search**: Full-text search across scenarios
10. **Tags Management**: Filter/organize by tags

## Security Considerations

1. **Local Storage Only**: Data never sent to external servers
2. **No Encryption**: Data stored in plain text in IndexedDB
3. **Same-Origin Policy**: Data isolated per domain
4. **User Responsibility**: Users should backup sensitive data
5. **Clear Data**: Provide way to clear all data for privacy

## API Reference Summary

### Storage Service (/src/services/storage.ts)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `initDatabase()` | - | `Promise<ScenarioToolDB>` | Initialize IndexedDB |
| `saveScenario()` | `scenario: Scenario` | `Promise<void>` | Save/update scenario |
| `loadScenarios()` | - | `Promise<Scenario[]>` | Load all scenarios |
| `loadScenario()` | `id: string` | `Promise<Scenario?>` | Load single scenario |
| `deleteScenario()` | `id: string` | `Promise<void>` | Delete scenario |
| `saveServers()` | `servers: Server[]` | `Promise<void>` | Save all servers |
| `saveServer()` | `server: Server` | `Promise<void>` | Save single server |
| `loadServers()` | - | `Promise<Server[]>` | Load all servers |
| `deleteServerFromDB()` | `id: string` | `Promise<void>` | Delete server |
| `exportToJson()` | `scenario: Scenario` | `string` | Export to JSON |
| `importFromJson()` | `json: string` | `Scenario` | Import from JSON |
| `exportToYaml()` | `scenario: Scenario` | `string` | Export to YAML |
| `importFromYaml()` | `yaml: string` | `Scenario` | Import from YAML |
| `exportAllData()` | - | `Promise<string>` | Export everything |
| `importAllData()` | `json: string` | `Promise<{scenarios, servers}>` | Import everything |
| `clearAllData()` | - | `Promise<void>` | Clear database |

### Storage Hooks (/src/hooks/useStorage.ts)

| Hook | Parameters | Returns | Description |
|------|-----------|---------|-------------|
| `useLoadOnMount()` | - | `{isLoading, error}` | Load data on mount |
| `useAutoSave()` | `debounceMs?: number` | `{isSaving, lastSaved}` | Auto-save with debounce |
| `useManualSave()` | - | `{save, isSaving, error}` | Manual save function |
| `useExport()` | - | `{exportScenario, exportAll, ...}` | Export functionality |
| `useImport()` | - | `{importScenario, importAll, ...}` | Import functionality |
| `useUnsavedChanges()` | - | `{hasUnsavedChanges, markAsSaved}` | Track unsaved state |

## Conclusion

The storage implementation provides a robust, user-friendly persistence layer for the Scenario Testing Tool. It combines automatic background saving with manual control, supports multiple export formats, and includes comprehensive error handling and user feedback.
