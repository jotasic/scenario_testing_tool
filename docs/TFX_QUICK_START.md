# TFX Pipeline Style - Quick Start Guide

## What is TFX Mode?

TFX (TensorFlow Extended) mode is a compact, professional visualization style for scenario flows. It provides a cleaner, more focused view of your pipeline with automatic layout capabilities.

## Quick Comparison

### Classic View
- Detailed node information
- Larger nodes (250-350px wide)
- Rich visual styling
- Inline child steps for loops/groups
- Manual positioning

### TFX Pipeline View
- Compact nodes (180px wide, 80px tall)
- Essential information only
- Consistent styling across types
- Clean, professional appearance
- Auto-layout support

## How to Use

### 1. Toggle TFX Mode

Click the view mode toggle buttons in the top-right corner:

- **Stream Icon** (≡): Classic detailed view
- **Tree Icon** (⎇): TFX pipeline view

### 2. Auto-Layout

Click the "Auto Layout" button to automatically organize your flow:

- Arranges nodes left to right
- Maintains hierarchy
- Optimal spacing
- Smooth animation

### 3. Keyboard Shortcuts

- **Pan**: Click and drag background
- **Zoom**: Mouse wheel or pinch
- **Select**: Click node
- **Delete**: Select + Delete/Backspace (when not readonly)

## Visual Guide

### TFX Node Structure

```
┌─────────────────────┐
│ [Icon] GET         │ ← Type header (colored)
├────────────────────┤
│ Fetch User Data    │ ← Step name
│ ● Success          │ ← Status
│ /api/users/123     │ ← Key details
└────────────────────┘
```

### Status Colors

- **Blue border** = Running (with pulse animation)
- **Green border** = Success
- **Red border** = Failed
- **Orange border** = Waiting
- **Gray border** = Pending/Skipped

### Type Colors (Header)

- **Blue** (`#1976D2`) = Request steps
- **Orange** (`#F57C00`) = Condition steps
- **Purple** (`#7B1FA2`) = Loop steps
- **Cyan** (`#0288D1`) = Group steps

## Best Practices

### When to Use TFX Mode

✅ **Good for:**
- Large, complex flows
- Presentations and documentation
- Quick overview of pipeline structure
- Sharing with stakeholders
- Export as images

❌ **Not ideal for:**
- Detailed debugging
- Editing node properties (use classic view)
- Viewing full descriptions
- Deep analysis of nested structures

### Auto-Layout Tips

1. **Before Layout:**
   - Ensure all nodes are visible
   - Check edge connections
   - Save any manual positioning you want to keep

2. **After Layout:**
   - Review the arrangement
   - Fine-tune positions if needed
   - Use zoom controls to navigate

3. **Best Results:**
   - Works best with 5-50 nodes
   - Clear hierarchies layout better
   - Avoid circular dependencies

## Customization

### Programmatic Control

```tsx
import FlowCanvas from '@/components/flow/FlowCanvas';

function MyComponent() {
  const [useTFX, setUseTFX] = useState(true);

  return (
    <FlowCanvas
      scenario={scenario}
      tfxMode={useTFX}
      onTFXModeChange={setUseTFX}
      readonly={false}
    />
  );
}
```

### Layout Options

The auto-layout uses these defaults (configurable in code):

```typescript
{
  direction: 'LR',      // Left to Right
  nodeWidth: 180,       // TFX node width
  nodeHeight: 80,       // TFX node height
  nodeSpacing: 50,      // Space between nodes
  rankSpacing: 100,     // Space between columns
}
```

## Troubleshooting

### Issue: Nodes overlap after layout

**Solution:** Increase spacing in layout configuration

### Issue: Labels are cut off

**Solution:** TFX mode shows essential info only - switch to classic view for full details

### Issue: Layout looks messy

**Solution:**
- Check for circular dependencies
- Simplify complex branch structures
- Consider breaking into smaller groups

### Issue: Animation is slow

**Solution:**
- Reduce number of nodes
- Check browser performance
- Disable animations if needed

## Performance

### Optimal Performance

- **Nodes:** 5-50 nodes per scenario
- **Edges:** Up to 100 edges
- **Nesting:** Up to 3 levels deep

### Large Scenarios

For scenarios with 100+ nodes:
1. Use TFX mode for better performance
2. Consider splitting into smaller scenarios
3. Use groups to organize sections
4. Disable minimap if needed

## FAQ

**Q: Can I edit nodes in TFX mode?**
A: Yes, click any node to select and edit. However, detailed editing is easier in classic view.

**Q: Will my manual positions be lost?**
A: Auto-layout overwrites positions. Save important layouts before applying.

**Q: Can I export the TFX view?**
A: Use browser screenshot tools or print to PDF (planned feature: native export).

**Q: Does it work on mobile?**
A: The UI is responsive, but desktop is recommended for editing.

**Q: Can I customize node colors?**
A: Currently uses fixed type-based colors. Custom themes coming in future update.

## Examples

### Simple Linear Flow

```
[Start] → [Fetch Data] → [Process] → [Save] → [End]
```

### Branching Flow

```
              ┌→ [Success Path]
[Condition] ──┤
              └→ [Failure Path]
```

### Loop Flow

```
[Setup] → [Loop: Process Items] → [Cleanup]
           ↑                    ↓
           └──── [Item Step] ───┘
```

## Next Steps

1. Try toggling between views
2. Apply auto-layout to an existing scenario
3. Create a new scenario in TFX mode
4. Experiment with different layouts
5. Share feedback for improvements

## Support

For issues or questions:
- Check the main documentation
- Review the code examples
- Submit issues on GitHub
- Contact the development team
