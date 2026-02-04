# Parameter Components - Quick Start Guide

## Installation

The parameter components are already included. Dependencies installed:
- `@mui/material` (already present)
- `@mui/icons-material` (already present)
- `react-syntax-highlighter` (newly installed)
- `@types/react-syntax-highlighter` (newly installed)

## Basic Usage

### 1. Import the Components

```tsx
import { ParameterInputPanel } from '@/components/parameters';
```

### 2. Use in Your Component

```tsx
import { useCurrentScenario, useExecutionParams } from '@/store/hooks';

function ParametersView() {
  const scenario = useCurrentScenario();
  const currentParams = useExecutionParams();

  if (!scenario) return null;

  return (
    <ParameterInputPanel
      schemas={scenario.parameterSchema}
      initialValues={currentParams}
      onApply={(values) => {
        console.log('Applied parameters:', values);
      }}
    />
  );
}
```

## Component Tree

```
ParameterInputPanel (Main component)
├── DynamicParameterForm (Auto-generated form)
│   ├── FieldLabel (Field metadata)
│   ├── TextField (String/Number inputs)
│   ├── Switch (Boolean inputs)
│   ├── ArrayFieldInput (Array editor)
│   │   └── DynamicParameterForm (Recursive)
│   └── ObjectFieldInput (Object editor)
│       └── DynamicParameterForm (Recursive)
└── ParameterPreview (JSON preview mode)
```

## Schema Structure

Define parameters using `ParameterSchema`:

```tsx
const schema: ParameterSchema = {
  id: 'unique-id',           // Unique identifier
  name: 'fieldName',         // Field name (used as key)
  type: 'string',            // Type: string, number, boolean, array, object, any
  required: true,            // Is required?
  defaultValue: 'default',   // Default value
  description: 'Help text',  // Tooltip description

  // For arrays
  itemSchema: { ... },       // Schema for array items

  // For objects
  properties: [ ... ],       // Array of property schemas

  // Validation rules
  validation: {
    min: 0,                  // Min value/length
    max: 100,                // Max value/length
    pattern: '^[a-z]+$',     // Regex pattern (strings)
    enum: ['a', 'b', 'c'],   // Allowed values
  },
};
```

## Common Scenarios

### Simple String Input

```tsx
{
  id: 'username',
  name: 'username',
  type: 'string',
  required: true,
  description: 'User login name',
}
```

### Number with Range

```tsx
{
  id: 'age',
  name: 'age',
  type: 'number',
  required: false,
  defaultValue: 18,
  validation: { min: 0, max: 120 },
}
```

### Dropdown (Enum)

```tsx
{
  id: 'status',
  name: 'status',
  type: 'string',
  required: true,
  validation: {
    enum: ['active', 'inactive', 'pending'],
  },
}
```

### Array of Strings

```tsx
{
  id: 'tags',
  name: 'tags',
  type: 'array',
  required: false,
  itemSchema: {
    id: 'tag',
    name: 'tag',
    type: 'string',
    required: true,
  },
}
```

### Nested Object

```tsx
{
  id: 'user',
  name: 'user',
  type: 'object',
  required: true,
  properties: [
    { id: 'name', name: 'name', type: 'string', required: true },
    { id: 'email', name: 'email', type: 'string', required: true },
    { id: 'age', name: 'age', type: 'number', required: false },
  ],
}
```

### Array of Objects

```tsx
{
  id: 'items',
  name: 'items',
  type: 'array',
  required: true,
  itemSchema: {
    id: 'item',
    name: 'item',
    type: 'object',
    required: true,
    properties: [
      { id: 'id', name: 'id', type: 'string', required: true },
      { id: 'qty', name: 'qty', type: 'number', required: true },
    ],
  },
}
```

## Redux Integration

The components automatically integrate with Redux:

```tsx
// Reads from Redux store
const params = useExecutionParams();  // Current parameters
const scenario = useCurrentScenario(); // Current scenario (has schema)

// Writes to Redux store
// Apply button in ParameterInputPanel calls:
dispatch(setParameterValues(values));
```

## Variable References

Support `${variableName}` syntax in string values:

```tsx
{
  id: 'endpoint',
  name: 'endpoint',
  type: 'string',
  defaultValue: '${baseUrl}/api/v1/users',
}
```

The `ParameterPreview` component highlights these references.

## Form vs JSON Mode

Users can toggle between two modes:

1. **Form Mode** - User-friendly form fields
2. **JSON Mode** - Direct JSON editing

Changes sync bidirectionally when switching modes.

## Validation

Validation runs when:
- User clicks "Validate" button
- User clicks "Apply" button (blocks if invalid)

Validation checks:
- Required fields
- Type correctness
- Min/max constraints
- Pattern matching (regex)
- Enum constraints

## Styling

Components use Material-UI theming:

```tsx
// Customize spacing
<Box sx={{ '& .MuiTextField-root': { mb: 2 } }}>
  <ParameterInputPanel ... />
</Box>

// Customize colors (uses theme)
// Works in light/dark mode automatically
```

## Accessibility

All components are accessible:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast

## Performance Tips

1. Use `compact` mode for nested forms
2. Memoize schema arrays
3. Debounce onChange for large forms
4. Use JSON mode for bulk editing

```tsx
// Good: Memoized schema
const schemas = useMemo(() => [
  { id: '1', name: 'field1', ... },
  { id: '2', name: 'field2', ... },
], []);

// Bad: New array every render
const schemas = [
  { id: '1', name: 'field1', ... },
  { id: '2', name: 'field2', ... },
];
```

## Troubleshooting

**Q: Form not updating?**
A: Check that `onChange` callback updates state correctly.

**Q: Validation not working?**
A: Ensure validation rules are in `validation` object.

**Q: JSON mode parse error?**
A: Check for valid JSON syntax (trailing commas, quotes, etc.).

**Q: Nested fields not showing?**
A: Ensure `itemSchema` (arrays) or `properties` (objects) are defined.

**Q: Type errors with `any` type?**
A: `any` type fields accept JSON strings; parse before using.

## Examples

See `ParameterInputPanel.example.tsx` for comprehensive examples:
- Simple forms
- Nested structures
- Arrays of objects
- Variable references
- API testing scenarios

## Next Steps

1. Define parameter schemas in your scenario
2. Add `<ParameterInputPanel>` to your UI
3. Connect to Redux (or use standalone)
4. Customize styling as needed
5. Add custom validation if needed

## Resources

- Full documentation: `README.md`
- Type definitions: `/src/types/parameter.ts`
- Redux store: `/src/store/executionSlice.ts`
- Examples: `ParameterInputPanel.example.tsx`
