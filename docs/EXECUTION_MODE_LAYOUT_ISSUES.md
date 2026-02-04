# Execution Mode Layout - Current State and Issues Report

**Report Date:** 2026-02-04
**Mode:** Execution Mode (http://localhost:5173/execution)
**Status:** Investigation Complete - No Fixes Applied

---

## Executive Summary

This report documents the current layout structure of Execution Mode and identifies three key issues that need to be addressed:

1. **Layout Order Issue**: Execution controls need to be moved to the top
2. **Graph Panning Issue**: Canvas panning is disabled in readonly mode
3. **Graph Editing Features**: Add/Delete/Connect features are intentionally disabled but may need clarification

---

## Task 1: Current Layout Verification

### Layout Structure Analysis

**File:** `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`

**Current Layout Order (Lines 36-120):**
```
┌─────────────────────────────────────────────────────┐
│ 1. Top Section (Paper component, lines 39-58)      │
│    ├─ Scenario Info (left)                          │
│    │  - Scenario name (h6 typography)               │
│    │  - Step count and status (body2)               │
│    └─ Execution Controls (right)                    │
│       - <ExecutionControls /> component             │
├─────────────────────────────────────────────────────┤
│ 2. Main Content Area (Box, lines 61-119)           │
│    ├─ Left: Flow Canvas (flexGrow: 1)              │
│    │  - <FlowCanvas scenario={} readonly={true} />  │
│    └─ Right: Tabs Panel (width: 400px)             │
│       ├─ Parameters Tab                             │
│       ├─ Step Result Tab                            │
│       └─ Logs Tab                                   │
└─────────────────────────────────────────────────────┘
```

### Current Implementation Details

**Container Structure:**
- **Outer Box** (line 37): `flexDirection: 'column'`, `height: '100%'`, `overflow: 'hidden'`
- **Top Paper** (line 39-58): `flexShrink: 0`, contains scenario info and controls
- **Main Box** (line 61): `flexGrow: 1`, `display: 'flex'`, horizontal split
- **Flow Canvas Box** (line 63-72): `flexGrow: 1`, `height: '100%'`, takes remaining space
- **Right Panel Box** (line 75-84): `width: 400px`, `flexShrink: 0`, fixed width

**FlowCanvas Component Configuration:**
- **File:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`
- **Props:** `readonly={true}` (line 71 in ExecutionPage)
- **Dimensions:** Takes 100% width and height of parent container (line 194-195)
- **React Flow Container:** `width: '100%'`, `height: '100%'` (lines 194-195)

### React Flow Size Verification

The React Flow canvas is properly configured to fill its container:

1. **Parent Box** (ExecutionPage, lines 63-72):
   - `flexGrow: 1` - Takes all remaining vertical space
   - `height: '100%'` - Full height of parent
   - `borderRight: 1, borderColor: 'divider'`

2. **FlowCanvas Inner Box** (FlowCanvas.tsx, lines 192-204):
   - `width: '100%'` - Full width of parent
   - `height: '100%'` - Full height of parent
   - `backgroundColor: 'background.default'`

3. **ReactFlow Component** (FlowCanvas.tsx, lines 205-264):
   - Takes 100% of parent Box dimensions
   - `fitView` prop enabled (line 214)
   - `fitViewOptions` configured with padding 0.2 (lines 215-220)
   - `onInit` handler calls `fitView()` with 50ms timeout (lines 179-189)

**VERDICT:** React Flow canvas is correctly sized and should display at proper dimensions.

---

## Task 2: Layout Order Change - Issue #1

### Current Behavior

**Current Order:**
```
1. Scenario Info (left) + Execution Controls (right) - Single row
2. Flow Canvas (left, grows) + Right Panel (right, 400px fixed)
```

**Problem Identified:**
The Execution Controls component is positioned on the RIGHT side of the scenario info section (line 57), not at the TOP of the page.

### Required Order

**Expected Order:**
```
1. Execution Controls at TOP (full width)
2. Flow Canvas below controls (should grow to fill space)
```

### Code Location & Required Changes

**File to Modify:** `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`

**Current Structure (Lines 36-58):**
```tsx
<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
  {/* Top Section: Scenario Info and Controls */}
  <Paper sx={{ p: 2, borderBottom: 1, display: 'flex',
               justifyContent: 'space-between', alignItems: 'center' }}>
    <Box>
      <Typography variant="h6">{currentScenario.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {currentScenario.steps.length} steps | Status: {executionStatus}
      </Typography>
    </Box>
    <ExecutionControls />  {/* Currently on RIGHT side */}
  </Paper>

  {/* Main Content: Flow + Right Panel */}
  <Box sx={{ flexGrow: 1, display: 'flex' }}>
    {/* Flow Canvas */}
    <Box sx={{ flexGrow: 1, height: '100%' }}>
      <FlowCanvas scenario={currentScenario} readonly={true} />
    </Box>
    {/* Right Panel with tabs */}
  </Box>
</Box>
```

**Required Change Strategy:**

1. **Move ExecutionControls to a separate top section** (full width)
2. **Keep Scenario Info** in its own section or integrate into the controls
3. **Update layout structure** to stack vertically:
   - ExecutionControls (top, full width)
   - Flow Canvas + Right Panel (main content area)

**Suggested Approach:**

```tsx
<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
  {/* 1. Execution Controls at TOP */}
  <Box sx={{ flexShrink: 0 }}>
    <ExecutionControls />
  </Box>

  {/* 2. Scenario Info (optional) */}
  <Paper sx={{ p: 2, borderBottom: 1, flexShrink: 0 }}>
    <Typography variant="h6">{currentScenario.name}</Typography>
    <Typography variant="body2">
      {currentScenario.steps.length} steps | Status: {executionStatus}
    </Typography>
  </Paper>

  {/* 3. Main Content: Flow + Right Panel */}
  <Box sx={{ flexGrow: 1, display: 'flex' }}>
    {/* Flow Canvas */}
    <Box sx={{ flexGrow: 1, height: '100%' }}>
      <FlowCanvas scenario={currentScenario} readonly={true} />
    </Box>
    {/* Right Panel */}
  </Box>
</Box>
```

**Alternative - Combine Controls with Scenario Info:**

The ExecutionControls component already shows scenario progress. Consider merging scenario name into the controls header.

---

## Task 3: Graph Panning Issue - Issue #2

### Current Behavior Analysis

**File:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

**React Flow Configuration (Lines 205-236):**

```tsx
<ReactFlow
  nodes={nodesWithSelection}
  edges={edges}
  onNodesChange={readonly ? undefined : handleNodesChange}
  onEdgesChange={readonly ? undefined : handleEdgesChange}
  onConnect={readonly ? undefined : handleConnect}
  onNodeClick={handleNodeClick}
  onInit={handleInit}
  nodeTypes={nodeTypes}
  fitView
  fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
  minZoom={0.1}
  maxZoom={2}
  deleteKeyCode={readonly ? null : 'Delete'}
  multiSelectionKeyCode={readonly ? null : 'Control'}
  panOnDrag={!readonly}  // LINE 232 - PROBLEM IDENTIFIED
  nodesDraggable={!readonly}
  nodesConnectable={!readonly}
  elementsSelectable={!readonly}
>
```

### Problem Identified

**Line 232:** `panOnDrag={!readonly}`

**Current Value in Execution Mode:**
- `readonly = true` (passed from ExecutionPage line 71)
- Therefore: `panOnDrag = !true = false`
- **Result: Canvas panning is DISABLED**

### Impact Analysis

When `panOnDrag={false}`:
- Users **CANNOT** pan/drag the canvas background
- Users **CAN** still zoom with mouse wheel (zoom props are not affected)
- Users **CAN** click nodes to select them
- Users **CANNOT** drag nodes to reposition them

### Root Cause

The `readonly` prop is designed to prevent editing (moving nodes, connecting edges, deleting). However, it also disables canvas panning, which should be a **view-only navigation feature**, not an editing feature.

### Required Change

**File to Modify:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

**Line 232 - Change:**
```tsx
// BEFORE
panOnDrag={!readonly}

// AFTER
panOnDrag={true}  // Always allow panning, even in readonly mode
```

**Alternative with separate prop:**
```tsx
// Add new prop to FlowCanvasProps (line 28-39)
interface FlowCanvasProps {
  scenario: Scenario;
  stepResults?: Record<string, StepExecutionResult>;
  selectedStepId?: string | null;
  onNodeClick?: (stepId: string) => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  readonly?: boolean;
  allowPanning?: boolean;  // NEW PROP
  showMinimap?: boolean;
  showGrid?: boolean;
}

// Then use in ReactFlow (line 232)
panOnDrag={allowPanning ?? true}  // Default to true
```

### Additional Zoom Configuration

Current zoom settings are correct:
- `minZoom={0.1}` (line 221) - Allows zooming out to 10%
- `maxZoom={2}` (line 222) - Allows zooming in to 200%
- Mouse wheel zoom works independently of `panOnDrag`

**VERDICT:** Zoom should work correctly. Only panning is broken.

---

## Task 4: Graph Editing Features - Issue #3

### Current Configuration Analysis

**File:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

**React Flow Editing Props (Lines 230-235):**

```tsx
deleteKeyCode={readonly ? null : 'Delete'}      // Disabled in readonly
multiSelectionKeyCode={readonly ? null : 'Control'}  // Disabled in readonly
panOnDrag={!readonly}                           // Disabled in readonly
nodesDraggable={!readonly}                      // Disabled in readonly
nodesConnectable={!readonly}                    // Disabled in readonly
elementsSelectable={!readonly}                  // Disabled in readonly
```

### Features Status in Execution Mode

| Feature | Current State | Reason |
|---------|---------------|--------|
| **Add New Nodes** | ❌ Disabled | No add node controls in FlowCanvas |
| **Delete Nodes** | ❌ Disabled | `deleteKeyCode={null}` in readonly mode |
| **Drag Nodes** | ❌ Disabled | `nodesDraggable={false}` in readonly mode |
| **Connect Edges** | ❌ Disabled | `nodesConnectable={false}` in readonly mode |
| **Select Nodes** | ❌ Disabled | `elementsSelectable={false}` in readonly mode |
| **Click Nodes** | ✅ Enabled | `onNodeClick` handler is active |

### Architecture Analysis

**FlowCanvas Props:**
- `onNodesChange` - Called when nodes are modified (position, added, deleted)
- `onEdgesChange` - Called when edges are modified (added, deleted)
- `onConnect` - Called when user connects two nodes
- `readonly` - Master switch that disables all editing features

**ExecutionPage Usage (Line 71):**
```tsx
<FlowCanvas scenario={currentScenario} readonly={true} />
```

**No callbacks provided:**
- No `onNodesChange` handler
- No `onEdgesChange` handler
- No `onConnect` handler

### Design Intent

The `readonly={true}` configuration suggests **intentional design decisions**:

1. **Execution Mode is VIEW-ONLY** - Users should observe execution, not edit structure
2. **Configuration Mode is for EDITING** - Separate page for creating/modifying scenarios
3. **Node clicking is enabled** - To view step results in the right panel

### Missing Add Node Controls

**FlowCanvas Component Analysis:**

Searching for node creation controls:
- No "Add Node" button in FlowCanvas.tsx
- No node palette or sidebar
- No drag-and-drop functionality for creating nodes
- React Flow's `Controls` component shown (line 243), but only provides zoom/fit controls

**FlowControls Component:**

Let me check if there's a separate controls component:

**File:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowControls.tsx`

This file exists but is not imported/used in FlowCanvas or ExecutionPage.

### Findings Summary

**Feature Status:**

1. **Add Nodes:**
   - Not implemented in FlowCanvas component
   - No UI controls available
   - Would need to be implemented with custom toolbar or palette

2. **Delete Nodes:**
   - Disabled via `deleteKeyCode={null}` when readonly
   - Could be enabled by changing the prop

3. **Connect Edges:**
   - Disabled via `nodesConnectable={false}` when readonly
   - React Flow supports drag from handles to create connections
   - Could be enabled by changing the prop

4. **Drag Nodes:**
   - Disabled via `nodesDraggable={false}` when readonly
   - Could be enabled by changing the prop

**Clarification Needed:**

The documentation should clarify whether Execution Mode **should** support editing:

**Option A: Execution Mode is View-Only (Current Design)**
- Keep `readonly={true}`
- Only fix panning to allow navigation
- All editing happens in Configuration Mode

**Option B: Execution Mode Supports Editing**
- Change to `readonly={false}` or add granular controls
- Implement add node controls
- Enable delete, connect, and drag features
- Need callbacks to persist changes

---

## Summary of Findings

### Issue #1: Layout Order - REQUIRES FIX

**Current:** Execution Controls on right side of scenario info
**Required:** Execution Controls at TOP, Flow Canvas below
**File:** `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`
**Lines:** 36-58 (restructure needed)
**Complexity:** Medium - requires layout restructuring

### Issue #2: Graph Panning - REQUIRES FIX

**Problem:** Canvas panning disabled in readonly mode
**Root Cause:** `panOnDrag={!readonly}` on line 232
**File:** `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`
**Fix:** Change to `panOnDrag={true}` to always allow panning
**Complexity:** Easy - single line change

### Issue #3: Graph Editing Features - NEEDS CLARIFICATION

**Current:** All editing disabled via `readonly={true}`
**Add Nodes:** Not implemented (no controls)
**Delete/Connect/Drag:** Disabled by readonly prop
**Question:** Is Execution Mode intended to be view-only or should it support editing?
**Decision Needed:**
- If view-only: No changes needed (working as intended)
- If editable: Remove readonly prop and implement add node controls

### React Flow Size Status - VERIFIED WORKING

**Verdict:** React Flow is correctly configured and should display at proper size
**Configuration:**
- Container: `flexGrow: 1`, `height: '100%'`
- FlowCanvas: `width: '100%'`, `height: '100%'`
- FitView enabled with proper options
**Status:** No issues identified

---

## Recommended Next Steps

1. **Fix Layout Order** (Priority: High)
   - Restructure ExecutionPage to move controls to top
   - Consider merging scenario info into controls component

2. **Fix Panning** (Priority: High)
   - Change `panOnDrag` to always true
   - Test zoom and pan functionality

3. **Clarify Editing Requirements** (Priority: Medium)
   - Decide if Execution Mode should support editing
   - If yes, implement add/delete/connect features
   - If no, document that it's intentionally view-only

4. **Test with Browser** (Priority: High)
   - Verify React Flow rendering at correct size
   - Test panning after fix
   - Test zoom functionality
   - Verify node selection and result viewing

---

## Code References

### Key Files

1. **ExecutionPage.tsx** - Main page layout
   `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx`

2. **FlowCanvas.tsx** - React Flow wrapper
   `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx`

3. **ExecutionControls.tsx** - Control panel component
   `/Users/taewookim/dev/scenario_tool/src/components/execution/ExecutionControls.tsx`

4. **AppLayout.tsx** - Overall app structure
   `/Users/taewookim/dev/scenario_tool/src/components/layout/AppLayout.tsx`

### Key Lines

- ExecutionPage layout structure: Lines 36-120
- FlowCanvas readonly configuration: Line 71 (ExecutionPage), Lines 230-235 (FlowCanvas)
- Panning disabled: Line 232 (FlowCanvas)
- Controls placement: Line 57 (ExecutionPage)

---

**Report End**
