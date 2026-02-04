# Execution Mode Layout - Visual Comparison

## Current Layout vs Required Layout

### CURRENT LAYOUT (As Implemented)

```
┌────────────────────────────────────────────────────────────────────────┐
│ App Header (Navigation, Save, Load, Settings)                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Top Section (Paper)                                              │ │
│  │ ┌────────────────────────────┬──────────────────────────────────┐│ │
│  │ │ LEFT: Scenario Info        │ RIGHT: Execution Controls        ││ │
│  │ │                            │                                  ││ │
│  │ │ Sample API Test Flow       │  ┌────────────────────────────┐ ││ │
│  │ │ 8 steps | Status: idle     │  │ Execution Controls         │ ││ │
│  │ │                            │  │ Status: Idle               │ ││ │
│  │ │                            │  │ [Start Button]             │ ││ │
│  │ │                            │  │ Progress: 0/8              │ ││ │
│  │ │                            │  └────────────────────────────┘ ││ │
│  │ └────────────────────────────┴──────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Main Content (Flex Row)                                          │ │
│  │ ┌───────────────────────────────────────┬─────────────────────┐ │ │
│  │ │ LEFT: Flow Canvas (flexGrow: 1)       │ RIGHT: Tabs Panel   │ │ │
│  │ │                                       │ (width: 400px)      │ │ │
│  │ │  ┌─────────────────────────────────┐  │                     │ │ │
│  │ │  │                                 │  │ ┌─────────────────┐ │ │ │
│  │ │  │   React Flow Canvas             │  │ │[Params][Result] │ │ │ │
│  │ │  │                                 │  │ │    [Logs]       │ │ │ │
│  │ │  │   ┌────┐                        │  │ ├─────────────────┤ │ │ │
│  │ │  │   │Node│                        │  │ │                 │ │ │ │
│  │ │  │   └──┬─┘                        │  │ │  Tab Content    │ │ │ │
│  │ │  │      │                          │  │ │                 │ │ │ │
│  │ │  │   ┌──▼─┐                        │  │ │                 │ │ │ │
│  │ │  │   │Node│                        │  │ │                 │ │ │ │
│  │ │  │   └────┘                        │  │ │                 │ │ │ │
│  │ │  │                                 │  │ │                 │ │ │ │
│  │ │  │   [Minimap] [Controls]          │  │ │                 │ │ │ │
│  │ │  └─────────────────────────────────┘  │ └─────────────────┘ │ │ │
│  │ │                                       │                     │ │ │
│  │ └───────────────────────────────────────┴─────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**ISSUE:** Execution Controls are on the RIGHT side of scenario info, not at the TOP.

---

### REQUIRED LAYOUT (Target State)

```
┌────────────────────────────────────────────────────────────────────────┐
│ App Header (Navigation, Save, Load, Settings)                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ TOP: Execution Controls (Full Width)                             │ │
│  │                                                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ Execution Controls                                         │ │ │
│  │  │ Status: Idle                                               │ │ │
│  │  │ [Start Button]                                             │ │ │
│  │  │ Progress: 0/8                                              │ │ │
│  │  │ Current Step: -                                            │ │ │
│  │  │ Duration: -                                                │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Scenario Info (Optional - Can be merged into controls)           │ │
│  │ Sample API Test Flow | 8 steps                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Main Content (Flex Row - Takes remaining vertical space)         │ │
│  │ ┌───────────────────────────────────────┬─────────────────────┐ │ │
│  │ │ LEFT: Flow Canvas (flexGrow: 1)       │ RIGHT: Tabs Panel   │ │ │
│  │ │                                       │ (width: 400px)      │ │ │
│  │ │  ┌─────────────────────────────────┐  │                     │ │ │
│  │ │  │                                 │  │ ┌─────────────────┐ │ │ │
│  │ │  │   React Flow Canvas             │  │ │[Params][Result] │ │ │ │
│  │ │  │   (PANNING ENABLED)             │  │ │    [Logs]       │ │ │ │
│  │ │  │                                 │  │ ├─────────────────┤ │ │ │
│  │ │  │   ┌────┐                        │  │ │                 │ │ │ │
│  │ │  │   │Node│                        │  │ │  Tab Content    │ │ │ │
│  │ │  │   └──┬─┘                        │  │ │                 │ │ │ │
│  │ │  │      │                          │  │ │                 │ │ │ │
│  │ │  │   ┌──▼─┐                        │  │ │                 │ │ │ │
│  │ │  │   │Node│                        │  │ │                 │ │ │ │
│  │ │  │   └────┘                        │  │ │                 │ │ │ │
│  │ │  │                                 │  │ │                 │ │ │ │
│  │ │  │   [Minimap] [Controls]          │  │ │                 │ │ │ │
│  │ │  └─────────────────────────────────┘  │ └─────────────────┘ │ │ │
│  │ │                                       │                     │ │ │
│  │ └───────────────────────────────────────┴─────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**KEY CHANGES:**
1. Execution Controls moved to TOP (full width)
2. Flow Canvas takes more vertical space
3. Panning enabled in Flow Canvas (readonly mode still prevents editing)

---

## Layout Structure Comparison

### Current Code Structure (ExecutionPage.tsx)

```tsx
<Box flexDirection="column">                    // Outer container

  <Paper>                                       // Top section
    <Box>                                       // LEFT
      <Typography>Scenario Name</Typography>
      <Typography>Steps | Status</Typography>
    </Box>
    <ExecutionControls />                       // RIGHT ⚠️
  </Paper>

  <Box display="flex">                          // Main content (row)
    <Box flexGrow={1}>                          // Flow Canvas
      <FlowCanvas readonly={true} />
    </Box>
    <Box width={400}>                           // Right panel
      <Tabs>...</Tabs>
    </Box>
  </Box>

</Box>
```

### Required Code Structure

```tsx
<Box flexDirection="column">                    // Outer container

  <Box flexShrink={0}>                          // TOP section ✓
    <ExecutionControls />
  </Box>

  <Paper>                                       // Scenario info (optional)
    <Typography>Scenario Name</Typography>
    <Typography>Steps | Status</Typography>
  </Paper>

  <Box flexGrow={1} display="flex">             // Main content (row)
    <Box flexGrow={1}>                          // Flow Canvas
      <FlowCanvas readonly={true} />
    </Box>
    <Box width={400}>                           // Right panel
      <Tabs>...</Tabs>
    </Box>
  </Box>

</Box>
```

---

## React Flow Props Comparison

### Current Props (FlowCanvas.tsx, readonly mode)

```tsx
<ReactFlow
  panOnDrag={!readonly}              // FALSE in Execution Mode ⚠️
  nodesDraggable={!readonly}         // FALSE - correct (view-only)
  nodesConnectable={!readonly}       // FALSE - correct (view-only)
  elementsSelectable={!readonly}     // FALSE - prevents selection ⚠️
  deleteKeyCode={readonly ? null : 'Delete'}   // null - correct
  onNodeClick={handleNodeClick}      // Enabled - correct
  minZoom={0.1}                      // Correct
  maxZoom={2}                        // Correct
  fitView                            // Enabled - correct
/>
```

### Required Props (Fixed)

```tsx
<ReactFlow
  panOnDrag={true}                   // ALWAYS TRUE ✓
  nodesDraggable={!readonly}         // FALSE - correct (view-only)
  nodesConnectable={!readonly}       // FALSE - correct (view-only)
  elementsSelectable={true}          // TRUE - allow selection for viewing ✓
  deleteKeyCode={readonly ? null : 'Delete'}   // null - correct
  onNodeClick={handleNodeClick}      // Enabled - correct
  minZoom={0.1}                      // Correct
  maxZoom={2}                        // Correct
  fitView                            // Enabled - correct
/>
```

**KEY CHANGES:**
1. `panOnDrag={true}` - Enable panning for navigation
2. `elementsSelectable={true}` - Allow selection to view step details (but don't allow dragging)

---

## Interaction Matrix

### Current Behavior (readonly=true)

| Action | Allowed? | Purpose |
|--------|----------|---------|
| Click node | ✅ YES | View step result in right panel |
| Drag canvas | ❌ NO | Navigate view (BROKEN) |
| Zoom with wheel | ✅ YES | Navigate view |
| Drag node | ❌ NO | Reposition node (correct - view-only) |
| Connect nodes | ❌ NO | Create edge (correct - view-only) |
| Delete node | ❌ NO | Remove node (correct - view-only) |
| Select node | ❌ NO | Highlight node (BROKEN - needed for viewing) |

### Required Behavior (readonly=true + fixes)

| Action | Allowed? | Purpose |
|--------|----------|---------|
| Click node | ✅ YES | View step result in right panel |
| Drag canvas | ✅ YES | Navigate view (FIXED) |
| Zoom with wheel | ✅ YES | Navigate view |
| Drag node | ❌ NO | Reposition node (correct - view-only) |
| Connect nodes | ❌ NO | Create edge (correct - view-only) |
| Delete node | ❌ NO | Remove node (correct - view-only) |
| Select node | ✅ YES | Highlight node for viewing (FIXED) |

---

## File Modification Checklist

### Priority 1: Layout Order

- [ ] File: `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`
- [ ] Lines: 36-58
- [ ] Change: Restructure layout to move ExecutionControls to top
- [ ] Test: Verify controls appear above flow canvas

### Priority 2: Enable Panning

- [ ] File: `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`
- [ ] Line: 232
- [ ] Change: `panOnDrag={!readonly}` → `panOnDrag={true}`
- [ ] Test: Verify canvas panning works in Execution mode

### Priority 3: Enable Node Selection (Optional)

- [ ] File: `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`
- [ ] Line: 235
- [ ] Change: `elementsSelectable={!readonly}` → `elementsSelectable={true}`
- [ ] Test: Verify nodes can be selected (but not dragged)

---

## Testing Checklist

After fixes are applied:

### Layout Testing
- [ ] Navigate to http://localhost:5173/execution
- [ ] Verify Execution Controls appear at TOP of page
- [ ] Verify Flow Canvas appears BELOW controls
- [ ] Verify Flow Canvas takes appropriate vertical space
- [ ] Check responsive behavior on smaller screens

### Panning & Zoom Testing
- [ ] Click and drag on canvas background (should pan)
- [ ] Use mouse wheel to zoom in/out
- [ ] Test minimap interaction
- [ ] Test fit view button in controls
- [ ] Verify panning doesn't interfere with node selection

### Node Interaction Testing
- [ ] Click on a node (should select and show in right panel)
- [ ] Try to drag a node (should NOT move - readonly)
- [ ] Try to connect nodes (should NOT work - readonly)
- [ ] Try to delete node with Delete key (should NOT work - readonly)
- [ ] Verify node status colors display correctly during execution

### Right Panel Testing
- [ ] Switch between Parameters, Step Result, and Logs tabs
- [ ] Click different nodes and verify results update
- [ ] Verify parameters panel loads correctly
- [ ] Verify logs display during execution

---

**End of Visual Comparison**
