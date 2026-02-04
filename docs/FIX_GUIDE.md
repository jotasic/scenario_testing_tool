# Execution Mode Layout - Quick Fix Guide

This guide provides exact code changes needed to fix the documented issues.

---

## Fix 1: Move Execution Controls to Top

### File to Modify
`/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`

### Current Code (Lines 36-58)

```tsx
return (
  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
    {/* Top Section: Scenario Info and Controls */}
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Box>
        <Typography variant="h6">{currentScenario.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {currentScenario.steps.length} steps | Status: {executionStatus}
        </Typography>
      </Box>
      <ExecutionControls />
    </Paper>
```

### Replace With

```tsx
return (
  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
    {/* Top Section: Execution Controls */}
    <Box sx={{ flexShrink: 0 }}>
      <ExecutionControls />
    </Box>

    {/* Scenario Info Section */}
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Typography variant="h6">{currentScenario.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {currentScenario.steps.length} steps | Status: {executionStatus}
      </Typography>
    </Paper>
```

### Alternative: Merge Scenario Info into Controls

If you want to consolidate the UI, you can modify the ExecutionControls component to include scenario name instead of keeping it separate.

**File:** `/Users/taewookim/dev/scenario_tool/src/components/execution/ExecutionControls.tsx`

Add scenario name to the header (line 98):

```tsx
<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
  <Box>
    <Typography variant="h6">{scenario?.name || 'Execution Controls'}</Typography>
    <Typography variant="caption" color="text.secondary">
      {scenario?.steps.length || 0} steps
    </Typography>
  </Box>
  <Chip
    label={statusConfig.label}
    color={statusConfig.color}
    size="small"
  />
</Stack>
```

Then in ExecutionPage, only use the controls:

```tsx
return (
  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
    {/* Top Section: Execution Controls (now includes scenario info) */}
    <Box sx={{ flexShrink: 0 }}>
      <ExecutionControls />
    </Box>

    {/* Main Content: Flow + Right Panel */}
    <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
```

---

## Fix 2: Enable Canvas Panning

### File to Modify
`/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

### Current Code (Line 232)

```tsx
panOnDrag={!readonly}
```

### Replace With

```tsx
panOnDrag={true}
```

**Reasoning:** Panning is a navigation feature, not an editing feature. Users should always be able to pan the canvas to navigate the view, even in readonly mode.

---

## Fix 3: Enable Node Selection (Optional but Recommended)

### File to Modify
`/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

### Current Code (Line 235)

```tsx
elementsSelectable={!readonly}
```

### Replace With

```tsx
elementsSelectable={true}
```

**Reasoning:** Node selection is needed to view step details in the right panel. Selection doesn't modify the graph structure, so it should be allowed even in readonly mode.

**Note:** With `nodesDraggable={!readonly}`, selected nodes still won't be draggable in Execution mode.

---

## Complete Code Changes Summary

### ExecutionPage.tsx - Option A (Separate Sections)

**Lines 36-58, replace:**

```tsx
<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
  {/* Execution Controls at Top */}
  <Box sx={{ flexShrink: 0 }}>
    <ExecutionControls />
  </Box>

  {/* Scenario Info */}
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderBottom: 1,
      borderColor: 'divider',
      flexShrink: 0,
    }}
  >
    <Typography variant="h6">{currentScenario.name}</Typography>
    <Typography variant="body2" color="text.secondary">
      {currentScenario.steps.length} steps | Status: {executionStatus}
    </Typography>
  </Paper>

  {/* Main Content: Flow + Right Panel */}
  <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
    {/* ... rest of the code ... */}
  </Box>
</Box>
```

### FlowCanvas.tsx - Lines 232 and 235

**Change line 232:**
```tsx
panOnDrag={true}
```

**Change line 235:**
```tsx
elementsSelectable={true}
```

---

## Verification Steps

After applying fixes:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Execution mode:**
   - Open http://localhost:5173
   - Click "Execution" in header

3. **Verify layout:**
   - [ ] Execution Controls appear at the TOP
   - [ ] Flow Canvas appears BELOW controls
   - [ ] Canvas takes appropriate space

4. **Test panning:**
   - [ ] Click and drag canvas background
   - [ ] Canvas should pan/move
   - [ ] Minimap should update

5. **Test zoom:**
   - [ ] Use mouse wheel to zoom
   - [ ] Verify zoom in/out works
   - [ ] Test zoom controls in React Flow

6. **Test node interaction:**
   - [ ] Click a node
   - [ ] Node should be selected (highlighted)
   - [ ] Right panel should show step result
   - [ ] Try to drag node (should NOT move)

7. **Test readonly protection:**
   - [ ] Try to drag nodes (should NOT work)
   - [ ] Try to connect nodes (should NOT work)
   - [ ] Press Delete key (should NOT delete node)

---

## Rollback Instructions

If fixes cause issues, revert changes:

### Revert ExecutionPage.tsx

```bash
git checkout HEAD -- /Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx
```

### Revert FlowCanvas.tsx

```bash
git checkout HEAD -- /Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx
```

---

## Additional Considerations

### Performance
- No performance impact expected
- Layout changes are CSS-only
- React Flow props don't affect rendering performance

### Accessibility
- Ensure keyboard navigation still works
- Test with screen readers after changes
- Verify focus management

### Responsive Design
- Test on smaller screens
- Verify controls don't overflow
- Check tablet/mobile layouts

### Browser Compatibility
- Test in Chrome, Firefox, Safari
- Verify React Flow interactions work consistently
- Check for CSS compatibility issues

---

## Related Files (Reference Only - No Changes Needed)

- `/Users/taewookim/dev/scenario_tool/src/components/execution/ExecutionControls.tsx` - Controls component
- `/Users/taewookim/dev/scenario_tool/src/components/layout/AppLayout.tsx` - App layout wrapper
- `/Users/taewookim/dev/scenario_tool/src/App.tsx` - Routing configuration
- `/Users/taewookim/dev/scenario_tool/src/data/sampleScenario.ts` - Sample data for testing

---

**End of Fix Guide**
