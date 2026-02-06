# TFX Pipeline Style Implementation

This document describes the TFX (TensorFlow Extended) pipeline style implementation for the FlowCanvas component.

## Overview

The implementation adds a professional, clean TFX pipeline visualization style to the scenario flow editor, inspired by TensorFlow Extended pipelines. Users can toggle between the classic detailed view and the new TFX compact view.

## Features

### 1. TFX-Style Nodes (`TFXNode.tsx`)

A unified node component that displays all step types (request, condition, loop, group) in a consistent, compact format:

**Visual Design:**
```
┌────────────────────────┐
│ [Icon] REQUEST         │ ← Header (type-specific color)
├────────────────────────┤
│ Step Name              │
│ ● Success              │ ← Status indicator
│ Endpoint: /api/users   │ ← Type-specific details
└────────────────────────┘
```

**Type-Specific Colors:**
- Request: Blue (`#1976D2`)
- Condition: Orange (`#F57C00`)
- Loop: Purple (`#7B1FA2`)
- Group: Cyan (`#0288D1`)

**Status Indicators:**
- Border color changes based on status
- Icon and text show current state
- Running state has pulse animation

**Dimensions:**
- Width: 180px
- Height: 80px (compact for better layout)

### 2. Auto-Layout with Dagre (`layoutUtils.ts`)

Automatic graph layout using the dagre library:

**Features:**
- Horizontal layout (Left to Right)
- Configurable node spacing (50px)
- Configurable rank spacing (100px)
- Automatic node positioning
- Supports nested containers

**Usage:**
```typescript
import { getLayoutedElements } from '@/utils/layoutUtils';

const { nodes, edges } = getLayoutedElements(currentNodes, currentEdges, {
  direction: 'LR',
  nodeWidth: 180,
  nodeHeight: 80,
  nodeSpacing: 50,
  rankSpacing: 100,
});
```

### 3. Enhanced FlowCanvas

**New Props:**
- `tfxMode?: boolean` - Enable TFX pipeline view
- `onTFXModeChange?: (enabled: boolean) => void` - Callback for mode changes

**UI Controls:**
1. **View Mode Toggle:**
   - Classic View (detailed nodes)
   - TFX Pipeline View (compact nodes)

2. **Auto Layout Button:**
   - Applies dagre layout algorithm
   - Animates to new positions
   - Fits view after layout

**Edge Styling:**
- TFX mode uses `smoothstep` edges for clean 90-degree angles
- Classic mode uses default edges
- Consistent arrow markers

### 4. Visual Improvements

**TFX Mode Enhancements:**
- Compact node design (180x80)
- Clean borders with rounded corners (4px)
- Type-based header colors
- Status-based border colors
- Running animation (pulse effect)
- Smooth transitions

**Control Panel:**
- Positioned top-right
- Button group for view toggle
- Auto-layout button with icon
- Tooltips for clarity

## File Structure

```
src/
├── components/flow/
│   ├── FlowCanvas.tsx          # Main canvas with TFX mode
│   └── nodes/
│       ├── index.ts            # Export both node type sets
│       ├── TFXNode.tsx         # New: TFX-style unified node
│       ├── RequestNode.tsx     # Existing: Classic request node
│       ├── ConditionNode.tsx   # Existing: Classic condition node
│       ├── LoopNode.tsx        # Existing: Classic loop node
│       └── GroupNode.tsx       # Existing: Classic group node
└── utils/
    └── layoutUtils.ts          # New: Dagre layout utilities
```

## Usage Example

```tsx
import FlowCanvas from '@/components/flow/FlowCanvas';

function MyComponent() {
  const [tfxMode, setTFXMode] = useState(true);

  return (
    <FlowCanvas
      scenario={scenario}
      stepResults={stepResults}
      tfxMode={tfxMode}
      onTFXModeChange={setTFXMode}
      showMinimap={true}
      showGrid={true}
    />
  );
}
```

## Implementation Details

### Node Type Registration

Two sets of node types are exported:

```typescript
// Classic detailed nodes
export const nodeTypes = {
  request: RequestNode,
  condition: ConditionNode,
  loop: LoopNode,
  group: GroupNode,
};

// TFX compact nodes (all use TFXNode)
export const tfxNodeTypes = {
  request: TFXNode,
  condition: TFXNode,
  loop: TFXNode,
  group: TFXNode,
};
```

### Edge Type Selection

```typescript
// Edges use smoothstep in TFX mode for clean 90-degree angles
type: tfxMode ? 'smoothstep' : 'default'
```

### Auto-Layout Algorithm

1. Creates dagre directed graph
2. Adds all nodes with dimensions
3. Adds all edges
4. Calculates layout
5. Applies positions to nodes
6. Fits view with animation

## Benefits

1. **Professional Appearance**: Clean, consistent design similar to industry-standard pipeline tools
2. **Compact View**: More nodes visible on screen at once
3. **Quick Overview**: Essential information at a glance
4. **Auto-Layout**: One-click organization of complex flows
5. **Flexibility**: Toggle between detailed and compact views
6. **Accessibility**: Clear visual hierarchy and status indicators

## Future Enhancements

Potential improvements for future versions:

1. **Vertical Layout Option**: Add TB (Top-to-Bottom) layout support
2. **Custom Edge Labels**: Show branch conditions on edges
3. **Mini Nodes**: Even more compact view for large scenarios
4. **Layout Persistence**: Save preferred layout positions
5. **Export as Image**: Export TFX view as PNG/SVG
6. **Advanced Grouping**: Visual containers for loop/group nodes in TFX mode

## Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES2020+ support
- Tested with React 19.x
- Requires ReactFlow 11.x

## Performance Considerations

- TFX nodes are smaller and render faster
- Auto-layout calculation is O(n log n) complexity
- Memoization prevents unnecessary re-renders
- Smooth animations use requestAnimationFrame

## Accessibility

- All controls have ARIA labels
- Keyboard navigation supported
- Focus indicators visible
- Screen reader compatible
- Color contrast meets WCAG AA standards

## Testing

To test the implementation:

1. Start the dev server: `npm run dev`
2. Open a scenario
3. Click the TFX toggle button (tree icon)
4. Click "Auto Layout" to organize nodes
5. Toggle between classic and TFX views
6. Test with different scenario complexities

## Migration Guide

No breaking changes - the feature is additive:

- Existing code continues to work
- Classic view is default
- TFX mode is opt-in via prop
- All existing node types remain functional
