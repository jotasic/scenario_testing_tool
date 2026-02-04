# Graph Editing Design - Configuration Mode

## 1. Context

### Current State
- **FlowCanvas.tsx** renders scenarios using React Flow with conditional editing based on `readonly` prop
- **ConfigPage.tsx** displays sidebar with servers/steps but no graph canvas
- Redux store has complete CRUD actions: `addStep`, `deleteStep`, `updateStep`, `addEdge`, `deleteEdge`
- **StepList.tsx** already implements add step functionality via dropdown menu
- Node components (RequestNode, etc.) have proper handles for edge connections

### Problem Statement
Configuration mode needs visual graph editing capabilities. Users should be able to:
1. Add new nodes directly from the graph canvas
2. Delete nodes via keyboard and UI
3. Connect nodes by dragging between handles
4. Drag nodes to reposition them

### Current Gaps
| Feature | Status | Notes |
|---------|--------|-------|
| Node dragging | Working | `nodesDraggable={!readonly}` in FlowCanvas |
| Edge connections | Partial | Handles exist, `onConnect` wired in FlowExample but not ConfigPage |
| Node deletion | Not wired | `deleteKeyCode` set but no handler for `remove` changes |
| Add nodes | Not implemented | Only available via StepList sidebar |

---

## 2. Design Options

### Option A: Floating Toolbar with Node Palette (Recommended)
**Description**: Add a floating toolbar above the canvas with node type buttons. Click a button, then click on canvas to place the node.

```
┌────────────────────────────────────────────────────┐
│  [+ Request] [+ Condition] [+ Loop] [+ Group]      │  <- Floating toolbar
├────────────────────────────────────────────────────┤
│                                                    │
│     ┌──────────┐         ┌──────────┐             │
│     │  Step 1  │────────▶│  Step 2  │             │
│     └──────────┘         └──────────┘             │
│                                                    │
│                     Canvas                         │
└────────────────────────────────────────────────────┘
```

**Pros**:
- Discoverable UI pattern (similar to Figma, Miro)
- Quick access to all node types
- Works well with existing FlowControls component pattern
- Can show tooltips/hints for each node type

**Cons**:
- Requires click-then-click or click-and-drag interaction
- Takes up vertical space

**Effort**: Small (S)

### Option B: Right-Click Context Menu
**Description**: Right-click on canvas background to show context menu with "Add Node" submenu.

**Pros**:
- No permanent UI space used
- Common pattern in diagram tools
- Can show position-aware options

**Cons**:
- Less discoverable
- Requires right-click support (touch devices?)
- More complex implementation

**Effort**: Medium (M)

### Option C: Drag from Sidebar Palette
**Description**: Make step types in sidebar draggable, drop onto canvas to create node.

**Pros**:
- Intuitive drag-and-drop
- Reuses existing sidebar space

**Cons**:
- Cross-component drag complexity
- Sidebar may not be visible when needed
- Requires react-dnd integration

**Effort**: Large (L)

---

## 3. Recommendation

### Chosen Approach: Option A (Floating Toolbar) + Keyboard Shortcuts

This approach provides:
1. **Best discoverability** for new users
2. **Low implementation effort** using existing patterns
3. **Consistent with FlowControls** component already in use
4. **Accessible** via both mouse and keyboard

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ConfigPage                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐   ┌──────────────────────────────────────────┐ │
│  │ Sidebar │   │            GraphEditor                   │ │
│  │         │   │  ┌──────────────────────────────────┐    │ │
│  │ Servers │   │  │     NodeToolbar (new)            │    │ │
│  │ Steps   │   │  │  [Request][Condition][Loop]...   │    │ │
│  │         │   │  └──────────────────────────────────┘    │ │
│  │         │   │  ┌──────────────────────────────────┐    │ │
│  │         │   │  │        FlowCanvas                │    │ │
│  │         │   │  │     (existing component)         │    │ │
│  │         │   │  └──────────────────────────────────┘    │ │
│  │         │   │  ┌──────────────────────────────────┐    │ │
│  │         │   │  │      FlowControls (existing)     │    │ │
│  │         │   │  └──────────────────────────────────┘    │ │
│  └─────────┘   └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action          Component              Redux Action
───────────────────────────────────────────────────────────
Click Add Node   →   NodeToolbar        →   (set pendingNodeType)
Click Canvas     →   FlowCanvas         →   addStep({ scenarioId, step })
                                        →   (clear pendingNodeType)

Drag Node        →   FlowCanvas         →   updateStep({ position })

Connect Nodes    →   FlowCanvas         →   addEdge({ scenarioId, edge })

Delete Key       →   FlowCanvas         →   deleteStep({ scenarioId, stepId })
                                        →   deleteEdge({ scenarioId, edgeId })

Select Node      →   FlowCanvas         →   setSelectedStep(stepId)
```

---

## 4. Implementation Plan

### Phase 1: Wire Up Existing Features (Priority: HIGH)
**Goal**: Make node deletion and edge connections work in ConfigPage

**Files to modify**:
- `/src/pages/ConfigPage.tsx` - Add FlowCanvas with edit handlers

**Changes**:
1. Add FlowCanvas below the scenario info section
2. Wire up `onNodesChange` to handle position updates and deletions
3. Wire up `onEdgesChange` to handle edge deletions  
4. Wire up `onConnect` to create new edges
5. Add `onNodeClick` for step selection

**Code structure**:
```typescript
// ConfigPage.tsx additions
const handleNodesChange = useCallback((changes: NodeChange[]) => {
  changes.forEach(change => {
    if (change.type === 'position' && change.position && !change.dragging) {
      dispatch(updateStep({ scenarioId, stepId: change.id, changes: { position: change.position }}));
    }
    if (change.type === 'remove') {
      dispatch(deleteStep({ scenarioId, stepId: change.id }));
    }
  });
}, [dispatch, scenarioId]);

const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      dispatch(deleteEdge({ scenarioId, edgeId: change.id }));
    }
  });
}, [dispatch, scenarioId]);

const handleConnect = useCallback((connection: Connection) => {
  dispatch(addEdge({ 
    scenarioId, 
    edge: { id: `edge_${Date.now()}`, sourceStepId: connection.source, targetStepId: connection.target }
  }));
}, [dispatch, scenarioId]);
```

### Phase 2: Node Toolbar Component (Priority: HIGH)
**Goal**: Create toolbar for adding nodes from the graph

**New file**: `/src/components/flow/NodeToolbar.tsx`

**Features**:
- Horizontal button bar with node type icons
- Click to activate "add mode", click canvas to place
- Visual feedback when add mode is active
- ESC to cancel add mode

**Props**:
```typescript
interface NodeToolbarProps {
  onAddNode: (type: StepType, position: { x: number; y: number }) => void;
  disabled?: boolean;
}
```

### Phase 3: Delete Confirmation & Selection UI (Priority: MEDIUM)
**Goal**: Improve deletion UX

**Changes**:
1. Add delete button to selected node overlay or toolbar
2. Confirmation dialog for destructive actions
3. Multi-select support (Ctrl+click to select multiple)
4. Batch delete for selected nodes

### Phase 4: Keyboard Shortcuts (Priority: LOW)
**Goal**: Power user features

| Shortcut | Action |
|----------|--------|
| Delete/Backspace | Delete selected nodes/edges |
| Ctrl+A | Select all |
| Ctrl+D | Duplicate selected |
| Escape | Clear selection / Cancel add mode |

---

## 5. Components to Create/Modify

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| NodeToolbar | `/src/components/flow/NodeToolbar.tsx` | Floating toolbar for adding nodes |
| GraphEditor | `/src/components/flow/GraphEditor.tsx` | Wrapper combining toolbar + canvas + controls |
| DeleteConfirmDialog | `/src/components/common/DeleteConfirmDialog.tsx` | Reusable confirmation dialog |

### Modified Components

| Component | Changes |
|-----------|---------|
| ConfigPage.tsx | Add GraphEditor to layout, split-pane with sidebar |
| FlowCanvas.tsx | Add `onPaneClick` for placing nodes in add mode |
| uiSlice.ts | Add `pendingNodeType` state for add mode |

---

## 6. Concerns and Mitigations

### Concern 1: Undo/Redo Support
**Risk**: Users may accidentally delete nodes without recovery option.
**Mitigation**: 
- Phase 1: Add confirmation dialogs for deletion
- Future: Implement undo/redo stack in Redux (redux-undo middleware)

### Concern 2: Edge Validation
**Risk**: Users could create invalid edges (cycles, wrong node types).
**Mitigation**: Add `isValidConnection` callback to FlowCanvas that validates:
- No self-loops
- No duplicate edges
- Type-specific rules (e.g., loop nodes need specific connections)

### Concern 3: Node Positioning
**Risk**: Nodes placed on top of each other when added.
**Mitigation**: 
- Calculate center of viewport for new node position
- Add auto-layout button for future enhancement
- Snap-to-grid option

### Concern 4: Mobile/Touch Support
**Risk**: Edge dragging may not work well on touch devices.
**Mitigation**: React Flow has touch support, but may need testing. Lower priority since this is likely desktop-focused tool.

---

## 7. Summary

| Priority | Task | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | Wire deletion/connection handlers in ConfigPage | S | None |
| 2 | Create NodeToolbar component | S | None |
| 3 | Integrate GraphEditor in ConfigPage layout | S | 1, 2 |
| 4 | Add delete confirmation dialog | S | 1 |
| 5 | Add keyboard shortcuts | S | 1-3 |
| 6 | Edge validation rules | M | 1 |
| 7 | Multi-select and batch operations | M | 1-3 |

**Total estimated effort**: 2-3 days for core features (1-5)

---

## 8. ASCII Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │           ConfigPage                │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   ┌─────────────┐           ┌─────────────────┐         ┌─────────────┐
   │   Sidebar   │           │  GraphEditor    │         │  StepEditor │
   │             │           │  (new wrapper)  │         │  (existing) │
   │  - Servers  │           └────────┬────────┘         └─────────────┘
   │  - Steps    │                    │
   └─────────────┘      ┌─────────────┼─────────────┐
                        │             │             │
                        ▼             ▼             ▼
                 ┌────────────┐ ┌───────────┐ ┌────────────┐
                 │NodeToolbar │ │FlowCanvas │ │FlowControls│
                 │   (new)    │ │(modified) │ │ (existing) │
                 └────────────┘ └─────┬─────┘ └────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │ RequestNode │   │ConditionNode│   │  LoopNode   │
            └─────────────┘   └─────────────┘   └─────────────┘


Redux Store Updates:
───────────────────────────────────────────────────────────────
│ scenarios/addStep      │ Add new step to scenario.steps     │
│ scenarios/deleteStep   │ Remove step + connected edges      │
│ scenarios/updateStep   │ Update position, config            │
│ scenarios/addEdge      │ Create connection between nodes    │
│ scenarios/deleteEdge   │ Remove edge                        │
│ ui/setSelectedStep     │ Track selected node for editor     │
│ ui/setPendingNodeType  │ Track add mode (new)               │
───────────────────────────────────────────────────────────────
```
