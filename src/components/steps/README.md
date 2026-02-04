# Step Management Components

This directory contains UI components for managing scenario steps in the Scenario Tool.

## Components Overview

### StepPanel
Main combined panel showing the step list and editor together.

```tsx
import { StepPanel } from '@/components/steps';

function App() {
  return <StepPanel />;
}
```

### StepList
Displays all steps in the current scenario with add/delete/select functionality.

**Features:**
- Lists all steps with type icons and execution mode badges
- Add step button with type selection dropdown (Request, Condition, Loop, Group)
- Click to select a step
- Delete button for each step
- Visual indication of selected step

### StepEditor
Main editor that detects the step type and routes to the appropriate type-specific editor.

**Features:**
- Common fields: name, description, execution mode
- Pre-condition builder
- Routes to type-specific editors
- Auto-save to Redux store

### RequestStepEditor
Editor for HTTP request steps.

**Configuration:**
- Target server selection
- HTTP method (GET, POST, PUT, DELETE, PATCH)
- Endpoint with variable support
- Headers editor (key/value pairs with enable/disable)
- Request body (JSON)
- Response configuration (wait, save, alias)
- Timeout override
- Retry configuration
- Response branches

### ConditionStepEditor
Editor for condition steps that evaluate branches.

**Configuration:**
- Branch list with conditions
- Each branch has a condition and next step
- Default branch (fallback)

### LoopStepEditor
Editor for loop steps with three loop types.

**Loop Types:**
1. **forEach**: Iterate over an array
   - Source array path
   - Item alias
   - Index alias (optional)
   - Count field (optional)

2. **count**: Fixed number of iterations
   - Count value or variable reference

3. **while**: Condition-based loop
   - Condition builder
   - Evaluates before each iteration

**Additional:**
- Max iterations safety limit
- Child steps selection

### ConditionBuilder
Visual builder for creating condition expressions with nested groups.

**Features:**
- Single conditions or condition groups
- Source selection: Parameters or Response
- Response conditions: Select which step's response
- Field path input (JSON path)
- Operator selection (==, !=, >, >=, <, <=, contains, etc.)
- Value input (not needed for isEmpty, isNotEmpty, exists)
- Logical operators (AND/OR) for groups
- Nested groups with visual indentation
- Add/delete conditions and groups

### BranchEditor
Editor for managing branches with conditions.

**Features:**
- List of branches
- Each branch:
  - Label
  - Condition (using ConditionBuilder)
  - Next step selection
  - Default branch toggle
- Add/delete branches

## Redux Integration

All components use Redux hooks for state management:

```tsx
import {
  useCurrentScenario,
  useCurrentSteps,
  useSelectedStep,
  useSelectedStepId,
  useServers,
  useAppDispatch,
} from '@/store/hooks';

import {
  addStep,
  updateStep,
  deleteStep,
} from '@/store/scenariosSlice';

import { setSelectedStep } from '@/store/uiSlice';
```

## Type System

All components use strongly-typed TypeScript interfaces:

```tsx
import type {
  Step,
  RequestStep,
  ConditionStep,
  LoopStep,
  GroupStep,
  StepType,
  ExecutionMode,
  HttpMethod,
  Condition,
  ConditionGroup,
  Branch,
  Loop,
} from '@/types';
```

## Material-UI Components Used

- **Layout**: Box, Paper, Divider
- **Typography**: Typography
- **Inputs**: TextField, Select, MenuItem, Switch, ToggleButtonGroup
- **Buttons**: Button, IconButton
- **Lists**: List, ListItem, ListItemButton, ListItemIcon, ListItemText
- **Feedback**: Chip, Collapse
- **Icons**: MUI Icons (@mui/icons-material)

## Component Hierarchy

```
StepPanel
├── StepList
│   ├── Add Step Menu (by type)
│   └── Step Items (with delete button)
└── StepEditor (when step selected)
    ├── Common Fields
    │   ├── Name, Description
    │   ├── Execution Mode
    │   └── Pre-condition (ConditionBuilder)
    └── Type-Specific Editor
        ├── RequestStepEditor
        │   ├── Server/Method/Endpoint
        │   ├── Headers
        │   ├── Body
        │   ├── Response Config
        │   ├── Timeout/Retry
        │   └── BranchEditor
        ├── ConditionStepEditor
        │   └── BranchEditor
        ├── LoopStepEditor
        │   ├── Loop Type Config
        │   └── Child Steps
        └── GroupStep (basic)
```

## Usage Example

```tsx
import { Provider } from 'react-redux';
import { store } from '@/store';
import { StepPanel } from '@/components/steps';

function App() {
  return (
    <Provider store={store}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StepPanel />
      </Box>
    </Provider>
  );
}
```

## Features

### Variable Support
All text fields support variable references:
- `${params.fieldName}` - Access scenario parameters
- `${responses.stepId.fieldName}` - Access previous step responses
- Examples: `${params.userId}`, `${responses.step_123.data.token}`

### Auto-save
All changes are automatically saved to Redux store. No manual save button needed.

### Type Safety
Full TypeScript support with type narrowing for step types:

```tsx
if (step.type === 'request') {
  // step is typed as RequestStep
  console.log(step.method, step.endpoint);
}
```

### Accessibility
- Keyboard navigation support
- ARIA labels on icon buttons
- Form labels properly associated
- Semantic HTML structure

## Future Enhancements

Potential improvements:
- Drag-and-drop step reordering
- Bulk operations (duplicate, delete multiple)
- Step templates
- Import/export steps
- Validation indicators
- Undo/redo support
