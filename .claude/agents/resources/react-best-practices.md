# React Best Practices

Based on [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) - 57 rules across 8 categories.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## 1. Eliminating Waterfalls (CRITICAL)

### async-defer-await
Move `await` into branches where actually used.

```tsx
// BAD: Sequential awaits
async function fetchData() {
  const user = await getUser();
  const posts = await getPosts();
  return { user, posts };
}

// GOOD: Parallel with Promise.all
async function fetchData() {
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ]);
  return { user, posts };
}
```

### async-parallel
Use `Promise.all()` for independent operations.

### async-dependencies
Use `better-all` for partial dependencies when some promises depend on others.

### async-api-routes
Start promises early, await late in API routes.

```tsx
// GOOD: Start early, await late
export async function GET() {
  const userPromise = getUser();
  const configPromise = getConfig();

  // Do other sync work...

  const [user, config] = await Promise.all([userPromise, configPromise]);
  return Response.json({ user, config });
}
```

### async-suspense-boundaries
Use Suspense to stream content progressively.

```tsx
// GOOD: Progressive streaming
export default function Page() {
  return (
    <main>
      <Header /> {/* Renders immediately */}
      <Suspense fallback={<ContentSkeleton />}>
        <Content /> {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar /> {/* Streams when ready */}
      </Suspense>
    </main>
  );
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### bundle-barrel-imports
Import directly, avoid barrel files.

```tsx
// BAD: Barrel import pulls entire module
import { Button } from '@/components';

// GOOD: Direct import
import { Button } from '@/components/Button';
```

### bundle-dynamic-imports
Use `next/dynamic` for heavy components.

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### bundle-defer-third-party
Load analytics/logging after hydration.

```tsx
'use client';

import { useEffect } from 'react';

export function Analytics() {
  useEffect(() => {
    // Load analytics only after hydration
    import('./analytics').then(({ init }) => init());
  }, []);

  return null;
}
```

### bundle-conditional
Load modules only when feature is activated.

### bundle-preload
Preload on hover/focus for perceived speed.

```tsx
<Link
  href="/dashboard"
  onMouseEnter={() => router.prefetch('/dashboard')}
>
  Dashboard
</Link>
```

---

## 3. Server-Side Performance (HIGH)

### server-auth-actions
Authenticate server actions like API routes.

```tsx
'use server';

import { auth } from '@/lib/auth';

export async function updateUser(data: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  // Proceed with update
}
```

### server-cache-react
Use `React.cache()` for per-request deduplication.

```tsx
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

### server-cache-lru
Use LRU cache for cross-request caching.

### server-dedup-props
Avoid duplicate serialization in RSC props.

### server-serialization
Minimize data passed to client components.

```tsx
// BAD: Passing entire object
<ClientComponent user={user} />

// GOOD: Pass only needed data
<ClientComponent
  userName={user.name}
  userAvatar={user.avatar}
/>
```

### server-parallel-fetching
Restructure components to parallelize fetches.

### server-after-nonblocking
Use `after()` for non-blocking operations.

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### client-swr-dedup
Use SWR for automatic request deduplication.

```tsx
import useSWR from 'swr';

function useUser(id: string) {
  return useSWR(`/api/users/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}
```

### client-event-listeners
Deduplicate global event listeners.

### client-passive-event-listeners
Use passive listeners for scroll events.

```tsx
useEffect(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### client-localstorage-schema
Version and minimize localStorage data.

---

## 5. Re-render Optimization (MEDIUM)

### rerender-defer-reads
Don't subscribe to state only used in callbacks.

```tsx
// BAD: Subscribes to count, causes re-renders
function Counter() {
  const count = useStore((s) => s.count);
  const increment = useStore((s) => s.increment);

  return <button onClick={() => increment()}>+</button>;
}

// GOOD: Only subscribe to what's rendered
function Counter() {
  const increment = useStore((s) => s.increment);

  return <button onClick={() => increment()}>+</button>;
}
```

### rerender-memo
Extract expensive work into memoized components.

```tsx
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} {...item} />);
});
```

### rerender-memo-with-default-value
Hoist default non-primitive props.

```tsx
// BAD: Creates new object every render
function Component({ options = {} }) { ... }

// GOOD: Hoist default value
const DEFAULT_OPTIONS = {};
function Component({ options = DEFAULT_OPTIONS }) { ... }
```

### rerender-dependencies
Use primitive dependencies in effects.

### rerender-derived-state
Subscribe to derived booleans, not raw values.

```tsx
// BAD: Re-renders on every cart change
const cart = useStore((s) => s.cart);
const hasItems = cart.length > 0;

// GOOD: Only re-renders when boolean changes
const hasItems = useStore((s) => s.cart.length > 0);
```

### rerender-derived-state-no-effect
Derive state during render, not in effects.

### rerender-functional-setstate
Use functional setState for stable callbacks.

```tsx
// GOOD: Stable callback, no dependency on count
const increment = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

### rerender-lazy-state-init
Pass function to useState for expensive values.

```tsx
// BAD: Expensive computation on every render
const [data] = useState(expensiveComputation());

// GOOD: Only computed on mount
const [data] = useState(() => expensiveComputation());
```

### rerender-simple-expression-in-memo
Avoid memo for simple primitives.

### rerender-move-effect-to-event
Put interaction logic in event handlers.

### rerender-transitions
Use `startTransition` for non-urgent updates.

```tsx
import { startTransition } from 'react';

function handleSearch(query: string) {
  // Urgent: Update input
  setQuery(query);

  // Non-urgent: Update results
  startTransition(() => {
    setResults(search(query));
  });
}
```

### rerender-use-ref-transient-values
Use refs for transient frequent values.

---

## 6. Rendering Performance (MEDIUM)

### rendering-animate-svg-wrapper
Animate div wrapper, not SVG element.

### rendering-content-visibility
Use `content-visibility` for long lists.

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px;
}
```

### rendering-hoist-jsx
Extract static JSX outside components.

```tsx
// GOOD: Static JSX hoisted
const EMPTY_STATE = <p>No items found</p>;

function List({ items }) {
  if (!items.length) return EMPTY_STATE;
  return <ul>{items.map(...)}</ul>;
}
```

### rendering-svg-precision
Reduce SVG coordinate precision.

### rendering-hydration-no-flicker
Use inline script for client-only data.

### rendering-hydration-suppress-warning
Suppress expected hydration mismatches.

### rendering-activity
Use Activity component for show/hide.

### rendering-conditional-render
Use ternary, not `&&` for conditionals.

```tsx
// BAD: Can render "0" or "false"
{count && <Badge count={count} />}

// GOOD: Explicit boolean check
{count > 0 ? <Badge count={count} /> : null}
```

### rendering-usetransition-loading
Prefer useTransition for loading state.

---

## 7. JavaScript Performance (LOW-MEDIUM)

### js-batch-dom-css
Group CSS changes via classes or cssText.

### js-index-maps
Build Map for repeated lookups.

```tsx
// BAD: O(n) lookup every time
items.find(item => item.id === targetId);

// GOOD: O(1) lookup with Map
const itemsById = new Map(items.map(i => [i.id, i]));
itemsById.get(targetId);
```

### js-cache-property-access
Cache object properties in loops.

### js-cache-function-results
Cache function results in module-level Map.

### js-cache-storage
Cache localStorage/sessionStorage reads.

### js-combine-iterations
Combine multiple filter/map into one loop.

```tsx
// BAD: Multiple iterations
items.filter(x => x.active).map(x => x.name);

// GOOD: Single iteration
items.reduce((acc, x) => {
  if (x.active) acc.push(x.name);
  return acc;
}, []);
```

### js-length-check-first
Check array length before expensive comparison.

### js-early-exit
Return early from functions.

### js-hoist-regexp
Hoist RegExp creation outside loops.

### js-min-max-loop
Use loop for min/max instead of sort.

### js-set-map-lookups
Use Set/Map for O(1) lookups.

### js-tosorted-immutable
Use `toSorted()` for immutability.

---

## 8. Advanced Patterns (LOW)

### advanced-event-handler-refs
Store event handlers in refs.

```tsx
const onChangeRef = useRef(onChange);
useLayoutEffect(() => {
  onChangeRef.current = onChange;
});

const stableOnChange = useCallback((value) => {
  onChangeRef.current?.(value);
}, []);
```

### advanced-init-once
Initialize app once per app load.

### advanced-use-latest
useLatest for stable callback refs.

---

## Quick Audit Checklist

```
□ No sequential awaits for independent data
□ Using Promise.all for parallel fetching
□ Direct imports (no barrel files)
□ Heavy components dynamically imported
□ Third-party scripts deferred
□ Server components minimize client data
□ Using React.cache for deduplication
□ SWR/React Query for client fetching
□ Memoized components for expensive renders
□ Functional setState for stable callbacks
□ startTransition for non-urgent updates
□ Lists >50 items virtualized
□ No layout reads in render
```

## References

- [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
