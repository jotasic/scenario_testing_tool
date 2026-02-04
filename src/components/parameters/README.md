# Parameter Input Components

Schema-driven, type-safe parameter input components for the Scenario Testing Tool.

## Overview

This module provides a complete set of components for entering, editing, and validating scenario parameters based on `ParameterSchema` definitions. It supports both Form and JSON editing modes with bidirectional synchronization.

## Components

### ParameterInputPanel

Main panel component for parameter input and management.

**Features:**
- Toggle between Form and JSON editing modes
- Real-time validation based on schema
- Bidirectional sync between Form and JSON
- Apply parameters to execution context
- Reset to default values
- Visual validation feedback

**Usage:**
```tsx
import { ParameterInputPanel } from '@/components/parameters';
import { useCurrentScenario } from '@/store/hooks';

function MyComponent() {
  const scenario = useCurrentScenario();

  return (
    <ParameterInputPanel
      schemas={scenario?.parameterSchema || []}
      initialValues={{}}
      onApply={(values) => console.log('Applied:', values)}
    />
  );
}
```

**Props:**
- `schemas: ParameterSchema[]` - Schema definitions for all parameters
- `initialValues?: Record<string, ParameterValue>` - Initial parameter values
- `onApply?: (values) => void` - Callback when Apply button is clicked

---

### DynamicParameterForm

Recursively generates form fields from parameter schemas.

**Features:**
- Automatic field type detection
- Support for all parameter types (string, number, boolean, array, object)
- Nested object and array support
- Validation hints (min/max, pattern, enum)
- Compact mode for nested rendering

**Usage:**
```tsx
import { DynamicParameterForm } from '@/components/parameters';

function MyForm() {
  const [values, setValues] = useState({});

  return (
    <DynamicParameterForm
      schemas={schemas}
      values={values}
      onChange={setValues}
    />
  );
}
```

**Props:**
- `schemas: ParameterSchema[]` - Array of schemas to render
- `values: Record<string, ParameterValue>` - Current field values
- `onChange: (values) => void` - Callback when any value changes
- `compact?: boolean` - Enable compact mode for nested fields

---

### ArrayFieldInput

Dynamic array field editor with add/remove/reorder capabilities.

**Features:**
- Add/remove array items
- Reorder items (move up/down)
- Recursive rendering for complex item types
- Visual item numbering

**Usage:**
```tsx
import { ArrayFieldInput } from '@/components/parameters';

function MyArrayField() {
  const [items, setItems] = useState([]);

  return (
    <ArrayFieldInput
      itemSchema={{
        id: 'item',
        name: 'item',
        type: 'string',
        required: false,
      }}
      value={items}
      onChange={setItems}
    />
  );
}
```

**Props:**
- `itemSchema: ParameterSchema` - Schema for array items
- `value: ParameterValue[]` - Current array value
- `onChange: (value) => void` - Callback when array changes
- `name?: string` - Optional display name

---

### ObjectFieldInput

Collapsible object field editor for nested structures.

**Features:**
- Collapsible accordion UI
- Property count badge
- Nested field rendering via DynamicParameterForm
- Visual grouping with indentation

**Usage:**
```tsx
import { ObjectFieldInput } from '@/components/parameters';

function MyObjectField() {
  const [obj, setObj] = useState({});

  return (
    <ObjectFieldInput
      properties={[
        { id: '1', name: 'firstName', type: 'string', required: true },
        { id: '2', name: 'age', type: 'number', required: false },
      ]}
      value={obj}
      onChange={setObj}
    />
  );
}
```

**Props:**
- `properties: ParameterSchema[]` - Schema for object properties
- `value: Record<string, ParameterValue>` - Current object value
- `onChange: (value) => void` - Callback when object changes
- `name?: string` - Optional display name
- `defaultExpanded?: boolean` - Start expanded (default: true)

---

### FieldLabel

Reusable label component with metadata display.

**Features:**
- Field name display
- Required indicator (*)
- Type badge
- Description tooltip

**Usage:**
```tsx
import { FieldLabel } from '@/components/parameters';

function MyField() {
  return (
    <>
      <FieldLabel
        name="username"
        type="string"
        required
        description="User's login name"
      />
      <TextField ... />
    </>
  );
}
```

**Props:**
- `name: string` - Field name
- `type: ParameterType` - Parameter type
- `required?: boolean` - Show required indicator
- `description?: string` - Tooltip description

---

### ParameterPreview

Read-only formatted preview of parameter values.

**Features:**
- Syntax-highlighted JSON display
- Variable reference detection
- Variable reference chips
- Scrollable for large payloads

**Usage:**
```tsx
import { ParameterPreview } from '@/components/parameters';

function MyPreview() {
  const params = useExecutionParams();

  return (
    <ParameterPreview
      values={params}
      highlightVariables
    />
  );
}
```

**Props:**
- `values: Record<string, ParameterValue>` - Parameter values to display
- `highlightVariables?: boolean` - Detect and highlight variable refs (default: true)

---

## Supported Parameter Types

### String
- Standard text input
- Optional enum (dropdown)
- Pattern validation (regex)
- Min/max length validation

### Number
- Numeric input with step controls
- Min/max range validation
- Floating point support

### Boolean
- Switch control
- True/false values

### Array
- Dynamic item list
- Add/remove items
- Reorder items
- Nested array support

### Object
- Nested properties
- Collapsible sections
- Recursive rendering

### Any
- JSON textarea
- Auto-parsing
- Fallback for unknown types

---

## Validation

The `ParameterInputPanel` component performs comprehensive validation:

### Required Fields
- Checks for `undefined`, `null`, or empty string
- Shows error message with field name

### Type Validation
- Verifies actual type matches schema type
- Reports type mismatches

### String Validation
- Min/max length
- Regex pattern matching
- Enum constraint

### Number Validation
- Min/max range
- Numeric type check

### Array Validation
- Min/max item count

### Custom Validation
Extend validation by wrapping `ParameterInputPanel` and adding custom logic in `onApply`:

```tsx
function CustomPanel({ schemas }: Props) {
  const handleApply = (values: Record<string, ParameterValue>) => {
    // Custom validation
    if (values.startDate > values.endDate) {
      alert('Start date must be before end date');
      return;
    }

    // Proceed with application
    dispatch(setParameterValues(values));
  };

  return (
    <ParameterInputPanel
      schemas={schemas}
      onApply={handleApply}
    />
  );
}
```

---

## Variable References

The components support variable references in string values using `${variableName}` syntax:

```json
{
  "apiUrl": "${baseUrl}/api/v1",
  "authToken": "Bearer ${token}"
}
```

The `ParameterPreview` component automatically detects and highlights these references.

---

## Redux Integration

The `ParameterInputPanel` automatically integrates with Redux:

- **Apply**: Dispatches `setParameterValues` to update execution context
- **Values**: Can read initial values from `useExecutionParams()`
- **Schema**: Can read schema from `useCurrentScenario()?.parameterSchema`

Example integration:

```tsx
import { ParameterInputPanel } from '@/components/parameters';
import { useCurrentScenario, useExecutionParams } from '@/store/hooks';

function ParametersPage() {
  const scenario = useCurrentScenario();
  const currentParams = useExecutionParams();

  if (!scenario) {
    return <div>No scenario selected</div>;
  }

  return (
    <ParameterInputPanel
      schemas={scenario.parameterSchema}
      initialValues={currentParams}
    />
  );
}
```

---

## Styling

All components use Material-UI theming and support dark mode automatically:

- Consistent spacing with MUI spacing units
- Responsive design
- Accessible focus states
- Semantic color usage (error, warning, info, success)

### Customization

You can customize styling by wrapping components with MUI's `sx` prop:

```tsx
<Box sx={{ '& .MuiTextField-root': { mb: 2 } }}>
  <DynamicParameterForm schemas={schemas} values={values} onChange={onChange} />
</Box>
```

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper label associations
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Sufficient color contrast

---

## Performance

### Optimizations Implemented

1. **Memoization**: Expensive computations cached with `useMemo`
2. **Callback Stability**: `useCallback` prevents unnecessary re-renders
3. **Lazy Updates**: JSON mode only parses on mode switch
4. **Shallow Comparisons**: Redux selectors optimized

### Best Practices

- Use `compact` mode for deeply nested structures
- Limit array size for better UX (consider pagination)
- Defer validation until Apply click for large forms

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterInputPanel } from './ParameterInputPanel';

test('renders form fields from schema', () => {
  const schemas = [
    { id: '1', name: 'username', type: 'string', required: true }
  ];

  render(<ParameterInputPanel schemas={schemas} />);

  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});

test('validates required fields', () => {
  const schemas = [
    { id: '1', name: 'email', type: 'string', required: true }
  ];

  render(<ParameterInputPanel schemas={schemas} />);

  fireEvent.click(screen.getByText(/validate/i));

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### Integration Tests

Test with actual Redux store for full integration:

```tsx
import { Provider } from 'react-redux';
import { store } from '@/store';

test('applies parameters to execution context', () => {
  render(
    <Provider store={store}>
      <ParameterInputPanel schemas={schemas} />
    </Provider>
  );

  // Fill form...
  fireEvent.click(screen.getByText(/apply/i));

  const state = store.getState();
  expect(state.execution.context?.params).toEqual(expectedValues);
});
```

---

## Future Enhancements

Potential improvements for future versions:

1. **Conditional Fields**: Show/hide fields based on other field values
2. **Field Dependencies**: Auto-populate fields based on other values
3. **Import/Export**: Save/load parameter presets
4. **History**: Parameter value history with undo/redo
5. **Templates**: Predefined parameter templates
6. **Validation Debounce**: Real-time validation with debouncing
7. **Rich Editors**: Monaco editor for JSON mode
8. **Drag-and-Drop**: Reorder object properties
9. **Search**: Filter large parameter lists
10. **Diff View**: Compare parameter versions

---

## Troubleshooting

### Common Issues

**Issue**: Form values not syncing to JSON mode
- **Solution**: Ensure `onChange` callback updates both states

**Issue**: Validation errors not clearing
- **Solution**: Call `handleValidate()` again after fixing errors

**Issue**: Type errors with `any` type fields
- **Solution**: `any` type accepts JSON strings, parse before use

**Issue**: Nested arrays/objects not rendering
- **Solution**: Ensure `itemSchema` and `properties` are properly defined

---

## API Reference

See TypeScript types in `/src/types/parameter.ts` for complete type definitions:

- `ParameterType`: Supported data types
- `ParameterSchema`: Schema definition structure
- `ParameterValue`: Runtime value type
