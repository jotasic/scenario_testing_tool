# Loop Variables Feature

## Overview

This document describes the "Available Loop Variables" feature that helps users understand and use loop context variables when editing steps inside loops.

## Feature Description

When editing a step that is inside one or more loops, the step editor now displays a collapsible panel showing all available loop variables that can be used in that step's configuration (endpoint, body, headers, conditions, etc.).

## UI Components

### Main Component: `AvailableLoopVariables`

**Location:** `/src/components/steps/AvailableLoopVariables.tsx`

**Purpose:**
- Detects if the current step is inside any loop containers (including nested loops)
- Displays all available loop variables with descriptions and examples
- Provides copy-to-clipboard functionality for easy usage

### Integration Points

The component is integrated into all step editors:
- `RequestStepEditor.tsx` - For HTTP request steps
- `ConditionStepEditor.tsx` - For conditional branching steps
- `LoopStepEditor.tsx` - For nested loop steps
- `GroupStepEditor.tsx` - For grouped steps

## Variable Types

### ForEach Loop Variables

For a `forEach` loop named "UserLoop" with itemAlias "user" and indexAlias "idx":

| Variable | Description | Example |
|----------|-------------|---------|
| `${loops.UserLoop.idx}` | Current iteration index (0-based) | 0, 1, 2, ... |
| `${loops.UserLoop.user}` | Current item from the array | The whole item object |
| `${loops.UserLoop.user.fieldName}` | Access a specific field | `${loops.UserLoop.user.id}` |
| `${loops.UserLoop.total}` | Total number of iterations | Total array length |

**With countField:**
If the loop has a countField "repeat", it also provides:
- `${loops.UserLoop.user.repeat}` - Count field for nested iteration

### Count Loop Variables

For a `count` loop named "RetryLoop":

| Variable | Description | Example |
|----------|-------------|---------|
| `${loops.RetryLoop.index}` | Current iteration index (0-based) | 0, 1, 2, ... |
| `${loops.RetryLoop.total}` | Total number of iterations | From count config |

### While Loop Variables

For a `while` loop named "PollLoop":

| Variable | Description | Example |
|----------|-------------|---------|
| `${loops.PollLoop.index}` | Current iteration index (0-based) | 0, 1, 2, ... |

## Nested Loop Support

The component fully supports nested loops and displays them hierarchically:

1. **Outer to Inner Order:** Variables are displayed from the outermost loop to the innermost
2. **Depth Indicators:** Each loop level shows a "Level N" badge
3. **All Available:** All parent loop variables are accessible in nested steps

### Example: Nested Loop Context

```
Outer Loop (forEach - items)
  ├─ ${loops.OuterLoop.index}
  ├─ ${loops.OuterLoop.item}
  └─ Inner Loop (count - 3)
      ├─ ${loops.InnerLoop.index}
      ├─ ${loops.InnerLoop.total}
      └─ Step can access BOTH outer and inner variables
```

## User Interaction

### Visual Design

- **Header:** Primary colored header showing "Available Loop Variables" with a count badge
- **Collapsible:** Click to expand/collapse (default: expanded)
- **Copy Functionality:** Each variable has a copy icon that copies the variable syntax to clipboard
- **Visual Feedback:** Copied variables briefly highlight in green
- **Empty State:** Component is hidden when the step is not inside any loop

### Usage in Step Configuration

Users can copy variables and paste them into:
- **Request Endpoints:** `/api/users/${loops.UserLoop.user.id}`
- **Request Body:** `{ "index": ${loops.UserLoop.index}, "data": "${loops.UserLoop.user.name}" }`
- **Headers:** `X-Request-Index: ${loops.UserLoop.index}`
- **Conditions:** Compare loop variables in branch conditions
- **Parameters:** Reference loop variables anywhere variables are supported

## Implementation Details

### Algorithm: Finding Parent Loops

```typescript
/**
 * Recursively finds all parent loops that contain the current step
 * Returns loops from outermost to innermost
 */
const findParentLoops = (stepId: string, depth: number = 0): void => {
  // Find loop that contains this step
  const parentLoop = allSteps.find(
    (s) => s.type === 'loop' && s.stepIds.includes(stepId)
  );

  if (parentLoop) {
    // Generate variables for this loop
    contexts.unshift({ ...loopContext, depth });

    // Continue searching for outer loops
    findParentLoops(parentLoop.id, depth + 1);
  }
};
```

### Variable Generation

Variables are generated based on loop type:

1. **ForEach:** Uses configured `itemAlias` and `indexAlias` (or defaults)
2. **Count:** Always uses `index` and `total`
3. **While:** Minimal variables (just `index`)

## Benefits

1. **Discoverability:** Users can easily see what variables are available
2. **Documentation:** Each variable includes a description and example
3. **Productivity:** Copy-to-clipboard reduces typing errors
4. **Context Awareness:** Shows only relevant variables for the current step's context
5. **Nested Loop Support:** Clearly shows all accessible variables in complex nested scenarios

## Future Enhancements

Potential improvements:
1. **Smart Insertion:** Click to insert at cursor position in focused field
2. **Type Information:** Show inferred types for loop items
3. **Usage Examples:** Show real examples from the current scenario
4. **Validation:** Highlight invalid variable references
5. **Autocomplete:** Integrate with text field autocomplete

## Testing Scenarios

To test this feature:

1. **Simple Loop:**
   - Create a forEach loop
   - Add a request step inside
   - Verify variables are shown

2. **Nested Loops:**
   - Create a loop inside a loop
   - Add a step in the inner loop
   - Verify both loop contexts are shown

3. **Different Loop Types:**
   - Test with forEach, count, and while loops
   - Verify correct variables for each type

4. **Copy Functionality:**
   - Click copy button
   - Paste in a text field
   - Verify correct syntax

5. **Collapse/Expand:**
   - Toggle the panel
   - Verify state persists during editing

## Related Files

### New Files
- `/src/components/steps/AvailableLoopVariables.tsx` - Main component

### Modified Files
- `/src/components/steps/RequestStepEditor.tsx` - Added loop variables panel
- `/src/components/steps/ConditionStepEditor.tsx` - Added loop variables panel
- `/src/components/steps/LoopStepEditor.tsx` - Added loop variables panel
- `/src/components/steps/GroupStepEditor.tsx` - Added loop variables panel

## Conclusion

This feature significantly improves the user experience when working with loops by providing clear, contextual information about available variables. The copy-to-clipboard functionality and hierarchical display of nested loops make it easy for users to correctly reference loop variables in their step configurations.
