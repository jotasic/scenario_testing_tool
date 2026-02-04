# UI Investigation Report
**Date:** 2026-02-04
**Application:** Scenario Testing Tool (http://localhost:5173)

---

## Executive Summary

Two critical UI layout issues have been identified and analyzed:

1. **Layout not using full screen**: The application is constrained to a narrow width (~234px) instead of filling the viewport (1920px)
2. **React Flow graph appearing tiny**: The React Flow visualization is only 77px wide, appearing as a small minimap in the corner instead of filling the main content area

**Root Cause:** Both issues stem from inappropriate default Vite template CSS in `App.css` and `index.css` that centers and constrains the layout.

---

## Issue 1: Layout Not Using Full Screen

### Visual Evidence
- Viewport: 1920x1080
- #root width: 233.59px (should be 1920px)
- Content is cramped on the left side of the screen

### Technical Analysis

#### File: `/Users/taewookim/dev/scenario_tool/src/App.css`

**Current Code (Lines 1-6):**
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
```

**Problems:**
- `max-width: 1280px` - Limits the root container to 1280px maximum width
- `margin: 0 auto` - Centers the container horizontally
- `padding: 2rem` - Adds 32px padding on all sides
- `text-align: center` - Not appropriate for app layout

**Impact:**
The #root element is constrained and centered, preventing the application from using the full viewport width.

#### File: `/Users/taewookim/dev/scenario_tool/src/index.css`

**Current Code (Lines 25-31):**
```css
body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}
```

**Problems:**
- `display: flex` with `place-items: center` centers child elements
- This conflicts with the full-screen layout needed for the application

**Impact:**
The body element centers its children both horizontally and vertically, causing layout collapse.

---

## Issue 2: React Flow Graph Appearing Tiny

### Visual Evidence
- React Flow width: 77.15625px (should be ~1120px to fill available space)
- React Flow height: 849.5px (correct)
- Position: Far left edge of screen
- Appears as a tiny minimap instead of main visualization

### Technical Analysis

#### React Flow Container Hierarchy
```
body (1920x1080, display: flex, place-items: center)
  └─ #root (234x1080) ← CONSTRAINED BY App.css
      └─ AppLayout > main (flexGrow: 1)
          └─ ExecutionPage > Box (flexGrow: 1, display: flex)
              └─ FlowCanvas Box (flexGrow: 1)
                  └─ ReactFlow Box (width: 100%, height: 100%)
                      └─ .react-flow (77px width) ← CONSTRAINED BY PARENT
```

**Analysis:**
The React Flow container has `width: '100%'` and `height: '100%'`, which should make it fill its parent. However, because the #root container is only ~234px wide due to the App.css constraints, the React Flow can only be that wide.

The FlowCanvas component at `/Users/taewookim/dev/scenario_tool/src/components/flow/FlowCanvas.tsx` is correctly implemented with:
```tsx
<Box
  sx={{
    width: '100%',
    height: '100%',
    backgroundColor: 'background.default',
    ...
  }}
>
```

The ExecutionPage at `/Users/taewookim/dev/scenario_tool/src/pages/ExecutionPage.tsx` is also correctly implemented with:
```tsx
<Box
  sx={{
    flexGrow: 1,
    height: '100%',
    borderRight: 1,
    borderColor: 'divider',
  }}
>
  <FlowCanvas scenario={currentScenario} readonly={true} />
</Box>
```

**Conclusion:** The component structure is correct. The issue is entirely caused by the CSS constraints in App.css and index.css.

---

## Recommended Fixes

### Fix 1: Update `/Users/taewookim/dev/scenario_tool/src/App.css`

**Replace:**
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
```

**With:**
```css
#root {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

**Rationale:**
- `width: 100%` - Fill the entire viewport width
- `height: 100vh` - Fill the entire viewport height
- `margin: 0` - Remove centering
- `padding: 0` - Remove extra spacing
- `overflow: hidden` - Prevent scrollbars (app handles overflow internally)

### Fix 2: Update `/Users/taewookim/dev/scenario_tool/src/index.css`

**Replace:**
```css
body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}
```

**With:**
```css
body {
  margin: 0;
  padding: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
}
```

**Rationale:**
- Remove `display: flex` and `place-items: center` which center the content
- Add `padding: 0` to ensure no extra spacing
- Keep `overflow: hidden` to prevent scrollbars

### Optional: Clean up `/Users/taewookim/dev/scenario_tool/src/App.css`

The remaining rules in App.css (lines 8-43) are unused Vite template defaults and can be safely removed:
- `.logo`, `.logo.react`, `@keyframes logo-spin`, `.card`, `.read-the-docs`

These are not used in the actual application.

---

## Expected Results After Fixes

1. **Full-screen layout:**
   - #root will be 1920x1080 (full viewport)
   - Application will use entire screen
   - No wasted whitespace

2. **React Flow properly sized:**
   - React Flow will expand to fill available space (~1120px width)
   - Flow visualization will be clearly visible
   - Minimap will be properly positioned in bottom-right corner

3. **No other breaking changes:**
   - AppLayout's flex layout will work correctly
   - Header will remain at top
   - Sidebar and content areas will properly distribute space
   - ExecutionPage split view (Flow + Right Panel) will work as designed

---

## Files Requiring Changes

1. **`/Users/taewookim/dev/scenario_tool/src/App.css`** - Lines 1-6 (CRITICAL)
2. **`/Users/taewookim/dev/scenario_tool/src/index.css`** - Lines 25-31 (CRITICAL)
3. **`/Users/taewookim/dev/scenario_tool/src/App.css`** - Lines 8-43 (OPTIONAL cleanup)

---

## Testing Checklist

After applying fixes:
- [ ] Navigate to http://localhost:5173
- [ ] Verify Config mode uses full screen width
- [ ] Switch to Execution mode
- [ ] Verify React Flow graph fills the main content area
- [ ] Verify minimap appears in bottom-right of flow canvas
- [ ] Verify right panel (Parameters/Step Result/Logs) is visible
- [ ] Test window resize - layout should remain responsive
- [ ] Check console for errors - should be none

---

## Additional Notes

### Why These Files Had These Styles

These CSS files were generated from the default Vite + React + TypeScript template, which includes starter styles for a centered, constrained demo application. The template assumes a small demo site, not a full-screen application.

### Why This Wasn't Caught Earlier

The AppLayout component correctly uses `height: '100vh'` and flex layout, which would work properly if the parent containers didn't constrain it. The component-level styling is correct - it's the global CSS that's the problem.

### Component Structure is Correct

The React component hierarchy is well-structured:
- AppLayout uses flexbox with `height: 100vh`
- ExecutionPage uses nested flex containers
- FlowCanvas uses `width: 100%` and `height: 100%`

All component-level styles are appropriate. Only the global CSS needs to be fixed.
