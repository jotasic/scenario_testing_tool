# Web Design Guidelines

Based on [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) - 100+ rules covering accessibility, performance, and UX.

## When to Apply

Reference these guidelines when:
- Reviewing UI code for accessibility
- Implementing forms and interactive elements
- Adding animations and transitions
- Optimizing performance
- Building responsive layouts

---

## Accessibility (CRITICAL)

### Interactive Elements

- Icon buttons require `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements must support keyboard (`onKeyDown`/`onKeyUp`)
- Use `<button>` for actions, `<a>`/`<Link>` for navigation
- Never use `<div onClick>` for clickable elements

```tsx
// BAD
<div onClick={handleClick}>Click me</div>

// GOOD
<button onClick={handleClick}>Click me</button>

// BAD: Icon button without label
<button onClick={toggleMenu}><MenuIcon /></button>

// GOOD
<button onClick={toggleMenu} aria-label="Toggle menu">
  <MenuIcon aria-hidden="true" />
</button>
```

### Images and Icons

- Images need `alt` text (or `alt=""` for decorative)
- Decorative icons: `aria-hidden="true"`

```tsx
// Informative image
<img src="chart.png" alt="Sales increased 25% in Q4" />

// Decorative image
<img src="decoration.png" alt="" />

// Decorative icon
<SearchIcon aria-hidden="true" />
```

### Dynamic Content

- Async updates require `aria-live="polite"`
- Prefer semantic HTML over ARIA
- Hierarchical headings with skip links
- Heading anchors need `scroll-margin-top`

```tsx
// Status updates
<div aria-live="polite" aria-atomic="true">
  {status && <p>{status}</p>}
</div>
```

---

## Focus States

- Interactive elements need visible focus (`focus-visible:ring-*`)
- Never remove outlines without replacement
- Use `:focus-visible` over `:focus`
- Group focus with `:focus-within` for compound controls

```css
/* BAD */
button:focus {
  outline: none;
}

/* GOOD */
button:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Compound control */
.input-group:focus-within {
  ring: 2px solid var(--focus-color);
}
```

---

## Forms

### Input Attributes

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` and `inputmode`
- Never block paste
- Clickable labels via `htmlFor` or wrapping

```tsx
// GOOD: Proper form input
<label htmlFor="email">Email</label>
<input
  id="email"
  name="email"
  type="email"
  inputMode="email"
  autoComplete="email"
  spellCheck={false}
/>

// GOOD: Password with paste allowed
<input
  type="password"
  autoComplete="current-password"
  // Never add onPaste with preventDefault
/>
```

### Form Behavior

- Disable spellcheck on emails/codes (`spellCheck={false}`)
- Checkbox/radio labels and controls share single hit target
- Submit button enabled until request; spinner during request
- Inline error messages; focus first error
- Placeholders end with `…` and show pattern
- Non-auth fields: `autocomplete="off"`
- Warn before navigation with unsaved changes

```tsx
// GOOD: Submit button state
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? <Spinner /> : 'Submit'}
</button>

// GOOD: Error handling
{errors.email && (
  <p role="alert" className="error">
    {errors.email.message}
  </p>
)}
```

---

## Animation

### Performance

- Animate only `transform`/`opacity`
- Never `transition: all`—list explicitly
- Set correct `transform-origin`

```css
/* BAD */
.card {
  transition: all 0.3s;
}

/* GOOD */
.card {
  transition: transform 0.3s, opacity 0.3s;
}
```

### Accessibility

- Honor `prefers-reduced-motion`
- Animations must be interruptible

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### SVG Animation

- SVG transforms on `<g>` with `transform-box: fill-box`

```css
.icon g {
  transform-box: fill-box;
  transform-origin: center;
}
```

---

## Typography

- Use ellipsis (`…`) not three dots (`...`)
- Curly quotes, not straight
- Non-breaking spaces for units and brand names
- Loading states: `"Loading…"`, `"Saving…"`
- Use `font-variant-numeric: tabular-nums` for number columns
- Apply `text-wrap: balance` or `text-pretty` on headings

```css
/* Number alignment in tables */
.table-cell-number {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Balanced headings */
h1, h2, h3 {
  text-wrap: balance;
}
```

---

## Content Handling

- Text containers handle overflow: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` for text truncation
- Handle empty states gracefully
- Anticipate short, average, and very long user inputs

```tsx
// GOOD: Truncation with flex
<div className="flex items-center gap-2">
  <Avatar />
  <span className="min-w-0 truncate">{userName}</span>
</div>

// GOOD: Line clamping
<p className="line-clamp-3">{description}</p>
```

---

## Images

- `<img>` needs explicit `width` and `height`
- Below-fold: `loading="lazy"`
- Above-fold critical: `priority` or `fetchpriority="high"`

```tsx
// GOOD: Next.js Image
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="Hero banner"
  priority // Above fold
/>

// GOOD: Native img with dimensions
<img
  src="/avatar.jpg"
  width={48}
  height={48}
  alt={userName}
  loading="lazy"
/>
```

---

## Performance

- Lists >50 items: virtualize
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`, etc.)
- Batch DOM operations
- Prefer uncontrolled inputs
- Add `<link rel="preconnect">` for CDN domains
- Critical fonts: `<link rel="preload">` with `font-display: swap`

```tsx
// GOOD: Virtualized list
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

```html
<!-- GOOD: Preconnect and preload -->
<link rel="preconnect" href="https://cdn.example.com" />
<link
  rel="preload"
  href="/fonts/Inter.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

---

## Navigation & State

- URL reflects state (filters, tabs, pagination)
- Use `<a>`/`<Link>` for link behavior (Cmd/Ctrl+click support)
- Deep-link stateful UI
- Destructive actions: confirm before executing

```tsx
// GOOD: URL-synced filters
import { useSearchParams } from 'next/navigation';

function Filters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';

  const handleStatusChange = (newStatus: string) => {
    setSearchParams({ status: newStatus });
  };

  return <StatusFilter value={status} onChange={handleStatusChange} />;
}
```

---

## Touch & Interaction

- `touch-action: manipulation`
- Set `-webkit-tap-highlight-color` intentionally
- `overscroll-behavior: contain` in modals/drawers
- Disable text selection during drag; mark dragged elements `inert`
- Use `autoFocus` sparingly (desktop, single input, avoid mobile)

```css
/* Prevent double-tap zoom on buttons */
button {
  touch-action: manipulation;
}

/* Modal scroll containment */
.modal {
  overscroll-behavior: contain;
}

/* During drag */
.dragging {
  user-select: none;
}
```

---

## Safe Areas & Layout

- Full-bleed layouts: `env(safe-area-inset-*)`
- Prevent unwanted scrollbars
- Use Flex/Grid over JS measurement

```css
/* Safe areas for notched devices */
.footer {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Prevent horizontal overflow */
html {
  overflow-x: hidden;
}
```

---

## Dark Mode & Theming

- `color-scheme: dark` on `<html>`
- `<meta name="theme-color">` matches background
- Native `<select>`: explicit colors for Windows dark mode

```html
<html style="color-scheme: dark">
<head>
  <meta name="theme-color" content="#0a0a0a" />
</head>
```

```css
/* Windows dark mode select fix */
select {
  color: var(--text-primary);
  background-color: var(--bg-primary);
}
```

---

## Locale & i18n

- Use `Intl.DateTimeFormat`, `Intl.NumberFormat`
- Detect language via `Accept-Language`/`navigator.languages`

```tsx
// GOOD: Locale-aware formatting
const formatDate = (date: Date, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(date);
};

const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
```

---

## Hydration Safety

- Inputs with `value` need `onChange` (or use `defaultValue`)
- Guard date/time rendering against hydration mismatch
- Minimize `suppressHydrationWarning`

```tsx
// BAD: Hydration mismatch
<p>Today is {new Date().toLocaleDateString()}</p>

// GOOD: Client-only rendering
'use client';
import { useEffect, useState } from 'react';

function CurrentDate() {
  const [date, setDate] = useState<string>();

  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);

  if (!date) return null;
  return <p>Today is {date}</p>;
}
```

---

## Hover & Interactive States

- Buttons/links need `hover:` states
- Interactive states increase contrast

```css
.button {
  background: var(--button-bg);
  transition: background 0.15s;
}

.button:hover {
  background: var(--button-bg-hover);
}

.button:active {
  background: var(--button-bg-active);
}
```

---

## Content & Copy

- Active voice
- Title Case for headings/buttons
- Use numerals for counts
- Specific button labels
- Error messages include next steps
- Second person perspective
- Use `&` where space-constrained

```tsx
// BAD
<button>Submit</button>

// GOOD: Specific action
<button>Create Account</button>
<button>Save Changes</button>

// BAD: Vague error
<p>An error occurred.</p>

// GOOD: Actionable error
<p>Unable to save. Check your connection and try again.</p>
```

---

## Anti-patterns Checklist

Flag these during code review:

```
□ user-scalable=no or zoom restrictions
□ onPaste with preventDefault
□ transition: all
□ outline-none without replacement
□ Inline navigation without <a>
□ <div>/<span> click handlers (use <button>)
□ Images without dimensions
□ Large lists (>50) without virtualization
□ Unlabeled form inputs
□ Icon buttons without aria-label
□ Hardcoded date/number formats
□ Unjustified autoFocus
```

---

## References

- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
