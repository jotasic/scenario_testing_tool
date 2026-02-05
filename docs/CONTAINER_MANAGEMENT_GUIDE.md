# Container Management User Guide

## Overview
This guide explains how to organize your scenario steps using Loop and Group containers, and how to move steps in and out of these containers.

## What Are Containers?

### Loop Container
Groups steps that should be executed multiple times (iterations). Common patterns:
- Iterate over an array of items (forEach)
- Repeat a fixed number of times (count)
- Continue while a condition is true (while)

### Group Container
Organizes related steps together for better visualization and organization. All steps execute once in sequence.

## Step Visibility Rules

**Important**: Steps inside Loop/Group containers are displayed ONLY inside the container node, not as separate nodes in the flow canvas.

**Before Container Management**:
```
Flow Canvas:
- Request A (standalone)
- Loop (contains: Request A)  ← Request A appears twice!
```

**After Container Management**:
```
Flow Canvas:
- Loop (contains: Request A)     ← Request A appears once only
```

## How to Move Steps INTO a Container

### Prerequisites
1. You need at least one Loop or Group step in your scenario
2. The step you want to move must be a regular step (request, condition)

### Steps
1. Click on the step you want to move in the flow canvas
2. In the right panel (Step Editor), scroll to the "Container Management" section
3. You'll see a dropdown labeled "Move to Container"
4. Select the target Loop or Group from the dropdown
5. The step immediately moves into the selected container

**Visual Result**:
- The step disappears from the main flow canvas
- The step now appears inside the container node
- The container's step count increases

## How to Move Steps OUT OF a Container

You have two methods:

### Method 1: From the Step Editor (When Step is Selected)

1. Click on a step that's inside a container
2. In the Step Editor, find the "Container Management" section
3. You'll see an alert showing: "This step is currently inside: [Container Name]"
4. Click the "Remove from [loop/group]" button
5. Confirm the action in the dialog
6. The step becomes a standalone step in the flow

### Method 2: From the Container Editor

1. Click on the Loop or Group container
2. In the container's step list, find the step you want to remove
3. Click the warning-colored delete icon (trash can) next to the step
4. Confirm the removal in the dialog
5. The step becomes a standalone step in the flow

**Visual Result**:
- The step appears as a new node in the main flow canvas
- The container's step count decreases
- The step's position is preserved (or nearby the container)

## Example Workflows

### Scenario 1: Organizing API Calls in a Loop

**Goal**: Make 3 API requests run in a loop

1. Create a Loop step (name it "API Loop")
2. Create or select Request Step 1
3. In Request Step 1 editor → Container Management → Select "API Loop"
4. Repeat for Request Steps 2 and 3
5. All 3 requests now execute inside the loop

**Result**: Clean visualization with loop clearly showing its 3 internal steps.

### Scenario 2: Extracting a Step from a Group

**Goal**: A step was mistakenly added to a group and needs to be standalone

1. Select the misplaced step
2. See "Container Management" showing current group
3. Click "Remove from group"
4. Confirm
5. Step is now standalone and can be repositioned

### Scenario 3: Moving a Step Between Containers

**Goal**: Move a step from Loop A to Group B

1. Select the step (currently in Loop A)
2. Click "Remove from loop"
3. Confirm removal
4. With step still selected, use "Move to Container" dropdown
5. Select "Group B"
6. Step is now in Group B

## Tips and Best Practices

### Organization
- Use Groups to organize related steps (e.g., "Setup Steps", "Cleanup Steps")
- Use Loops for repetitive operations (e.g., "Process each user")
- Name your containers clearly to understand their purpose

### Step Order
- Steps inside containers execute in the order shown in the list
- Use the up/down arrows to reorder steps within a container
- First step in container executes first, last step executes last

### Visual Clarity
- Keep container names descriptive: "User Registration Loop" instead of "Loop 1"
- Add descriptions to containers explaining what they do
- Limit the number of steps in a container for readability (typically 2-5 steps)

### Performance
- Nested containers are supported but can be complex
- Consider breaking down deeply nested logic into multiple scenarios
- Use conditions inside loops to skip unnecessary operations

## Troubleshooting

### "No available containers" Message
**Problem**: The dropdown shows "No available containers"
**Solution**: Create a Loop or Group step first, then you can move steps into it.

### Step Disappeared After Moving
**Problem**: I moved a step into a container and can't see it
**Solution**: This is expected! Click on the container node to see its internal steps. The step is now inside the container.

### Can't Move a Container Into Another Container
**Problem**: I want to move Loop A into Group B
**Solution**: Currently, you cannot move container steps (Loop/Group) into other containers. Only regular steps (request, condition) can be moved.

### Confirmation Dialog on Every Remove
**Problem**: The confirmation dialog is annoying
**Solution**: The confirmation prevents accidental removal. The step becomes standalone and may need repositioning, so the confirmation ensures intentional action.

## Keyboard Shortcuts

Currently, container management requires clicking. Future versions may include:
- Drag & Drop support
- Keyboard shortcuts for quick moves
- Multi-step selection for bulk operations

## Related Features

- **Step Ordering**: Use up/down arrows within container editors
- **Edge Management**: Edges automatically adjust when steps move
- **Auto Layout**: Use the Layout button to reorganize flow after changes
- **Undo/Redo**: Coming soon for container operations

## FAQ

**Q: Can I have a step in multiple containers?**
A: No, a step can only be in one container at a time.

**Q: What happens to edges when I move a step?**
A: Edges are preserved. If a step had connections before moving, they remain after moving.

**Q: Can I nest containers (Loop inside a Group)?**
A: Not currently. Only regular steps can be added to containers.

**Q: Will the step position change when removed from a container?**
A: The step retains its previous position. You may need to reposition it using drag or auto-layout.

**Q: Can I see all steps in a scenario, including those in containers?**
A: Click on a container to view its internal steps. The Step List (if available) shows all steps including contained ones.

## Version History

- **v1.0** (Current): Initial container management implementation
  - Add/remove steps from containers
  - Visual filtering of contained steps
  - Confirmation dialogs for safety
