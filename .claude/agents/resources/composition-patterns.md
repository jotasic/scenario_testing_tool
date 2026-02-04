# React Composition Patterns

Based on [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns) - Patterns for flexible, maintainable components.

## When to Apply

Reference these guidelines when:
- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

---

## Core Principles

### 1. Composition over Configuration

Enable consumer composition instead of property expansion.

```tsx
// BAD: Configuration-driven with boolean props
<Composer
  hasAttachments
  hasEmoji
  hasMentions
  hasGifs
  isEditing
  showSendButton
/>

// GOOD: Composition-driven
<Composer>
  <Composer.Input />
  <Composer.Toolbar>
    <Composer.Attachments />
    <Composer.Emoji />
    <Composer.Mentions />
    <Composer.Gifs />
  </Composer.Toolbar>
  <Composer.Send />
</Composer>
```

### 2. Lift Your State

Maintain state in providers rather than component internals.

```tsx
// BAD: State trapped inside component
function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);
  // Consumers can't control which item is open
}

// GOOD: State lifted to provider
function Accordion({ children, value, onValueChange }) {
  return (
    <AccordionContext.Provider value={{ value, onValueChange }}>
      {children}
    </AccordionContext.Provider>
  );
}

// Usage: Consumer controls state
const [open, setOpen] = useState('item-1');
<Accordion value={open} onValueChange={setOpen}>
  <Accordion.Item value="item-1">...</Accordion.Item>
  <Accordion.Item value="item-2">...</Accordion.Item>
</Accordion>
```

### 3. Compose Your Internals

Subcomponents access context, avoiding prop drilling.

```tsx
// BAD: Prop drilling through every level
<Menu onSelect={handleSelect}>
  <MenuItem onSelect={handleSelect}>
    <MenuItemIcon onSelect={handleSelect} />
    <MenuItemLabel onSelect={handleSelect} />
  </MenuItem>
</Menu>

// GOOD: Context-based access
const MenuContext = createContext<MenuContextValue>(null);

function Menu({ children, onSelect }) {
  return (
    <MenuContext.Provider value={{ onSelect }}>
      {children}
    </MenuContext.Provider>
  );
}

function MenuItem({ children, value }) {
  const { onSelect } = useContext(MenuContext);
  return (
    <button onClick={() => onSelect(value)}>
      {children}
    </button>
  );
}
```

### 4. Explicit Variants

Create purpose-specific variants instead of boolean modes.

```tsx
// BAD: Boolean prop to change behavior
<Composer isEditing />
<Composer isThread />
<Composer isReply />

// GOOD: Explicit variant components
<ThreadComposer />
<EditComposer message={message} />
<ReplyComposer parent={parentMessage} />
```

---

## Rule Categories by Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Component Architecture | HIGH |
| 2 | State Management | MEDIUM |
| 3 | Implementation Patterns | MEDIUM |
| 4 | React 19+ APIs | MEDIUM |

---

## Component Architecture (HIGH)

### architecture-avoid-boolean-props

Don't add boolean props to customize behavior; use composition.

```tsx
// BAD: Boolean prop proliferation
interface ButtonProps {
  isLoading?: boolean;
  isDisabled?: boolean;
  hasIcon?: boolean;
  iconPosition?: 'left' | 'right';
  hasSpinner?: boolean;
  // Props keep growing...
}

// GOOD: Composition with slots
interface ButtonProps {
  children: ReactNode;
  disabled?: boolean;
}

<Button>
  <Button.Icon><SearchIcon /></Button.Icon>
  <Button.Label>Search</Button.Label>
</Button>

<Button disabled>
  <Button.Spinner />
  <Button.Label>Loading...</Button.Label>
</Button>
```

### architecture-compound-components

Structure complex components using shared context.

```tsx
// Compound component pattern
const TabsContext = createContext<TabsContextValue>(null);

function Tabs({ children, value, onValueChange }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ value, children }) {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = value === selectedValue;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }) {
  const { value: selectedValue } = useContext(TabsContext);
  if (value !== selectedValue) return null;

  return (
    <div role="tabpanel">
      {children}
    </div>
  );
}

// Attach subcomponents
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">Overview content</Tabs.Panel>
  <Tabs.Panel value="settings">Settings content</Tabs.Panel>
</Tabs>
```

---

## State Management (MEDIUM)

### state-decouple-implementation

Provider handles state management implementation details.

```tsx
// BAD: Implementation details exposed
function useMessages() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Consumer must handle all the logic
  const addMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  return { messages, isLoading, setMessages, addMessage, setIsLoading };
}

// GOOD: Implementation hidden behind provider
function MessagesProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const value = useMemo(() => ({
    messages,
    isLoading,
    addMessage: (msg) => setMessages(prev => [...prev, msg]),
    removeMessage: (id) => setMessages(prev => prev.filter(m => m.id !== id)),
    clearMessages: () => setMessages([]),
  }), [messages, isLoading]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}
```

### state-context-interface

Define generic interface with state, actions, and metadata.

```tsx
interface ContextValue<T> {
  // State
  data: T | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  update: (data: Partial<T>) => Promise<void>;

  // Metadata
  lastUpdated: Date | null;
}

// Apply to specific context
interface UserContextValue extends ContextValue<User> {
  // Additional user-specific actions
  logout: () => void;
}
```

### state-lift-state

Move state into provider components for sibling access.

```tsx
// BAD: State in parent, passed through props
function Page() {
  const [user, setUser] = useState(null);

  return (
    <div>
      <Header user={user} />
      <Sidebar user={user} onUserChange={setUser} />
      <Content user={user} />
    </div>
  );
}

// GOOD: State in provider, accessed via context
function Page() {
  return (
    <UserProvider>
      <Header />
      <Sidebar />
      <Content />
    </UserProvider>
  );
}

// Each component accesses what it needs
function Header() {
  const { user } = useUser();
  return <header>{user?.name}</header>;
}
```

---

## Implementation Patterns (MEDIUM)

### patterns-explicit-variants

Create explicit variant components instead of boolean modes.

```tsx
// BAD: Mode switching with booleans
function Modal({ isDrawer, isFullscreen, isSheet }) {
  if (isDrawer) return <DrawerLayout>...</DrawerLayout>;
  if (isFullscreen) return <FullscreenLayout>...</FullscreenLayout>;
  if (isSheet) return <SheetLayout>...</SheetLayout>;
  return <ModalLayout>...</ModalLayout>;
}

// GOOD: Explicit variants sharing logic via hooks
function useModalBehavior() {
  const [isOpen, setIsOpen] = useState(false);
  // Shared logic
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}

function Modal({ children }) {
  const behavior = useModalBehavior();
  return <ModalLayout {...behavior}>{children}</ModalLayout>;
}

function Drawer({ children }) {
  const behavior = useModalBehavior();
  return <DrawerLayout {...behavior}>{children}</DrawerLayout>;
}

function Sheet({ children }) {
  const behavior = useModalBehavior();
  return <SheetLayout {...behavior}>{children}</SheetLayout>;
}
```

### patterns-children-over-render-props

Use children for composition over render props.

```tsx
// BAD: Render props pattern
<Dropdown
  renderTrigger={(props) => <Button {...props}>Open</Button>}
  renderContent={(props) => <Menu {...props}>...</Menu>}
/>

// GOOD: Children composition
<Dropdown>
  <Dropdown.Trigger asChild>
    <Button>Open</Button>
  </Dropdown.Trigger>
  <Dropdown.Content>
    <Menu>...</Menu>
  </Dropdown.Content>
</Dropdown>
```

---

## React 19+ APIs (MEDIUM)

### react19-no-forwardref

Avoid `forwardRef`; use `use()` instead of `useContext()`.

```tsx
// React 18: forwardRef required
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <button ref={ref} {...props} />;
});

// React 19+: ref is a regular prop
function Button({ ref, ...props }: ButtonProps & { ref?: Ref<HTMLButtonElement> }) {
  return <button ref={ref} {...props} />;
}

// React 18: useContext
function MenuItem() {
  const menu = useContext(MenuContext);
  return <button onClick={() => menu.select()}>..</button>;
}

// React 19+: use() hook
function MenuItem() {
  const menu = use(MenuContext);
  return <button onClick={() => menu.select()}>..</button>;
}
```

---

## Pattern Examples

### Complete Compound Component Example

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface AccordionContextValue {
  value: string | null;
  onValueChange: (value: string) => void;
}

interface AccordionProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface AccordionItemProps {
  children: ReactNode;
  value: string;
}

// Context
const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion');
  }
  return context;
}

// Components
function Accordion({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue,
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = isControlled ? onValueChange! : setUncontrolledValue;

  return (
    <AccordionContext.Provider value={{ value, onValueChange: setValue }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ children, value }: AccordionItemProps) {
  const { value: selectedValue, onValueChange } = useAccordion();
  const isOpen = value === selectedValue;

  return (
    <div className="accordion-item" data-state={isOpen ? 'open' : 'closed'}>
      {children}
    </div>
  );
}

function AccordionTrigger({ children, value }: { children: ReactNode; value: string }) {
  const { value: selectedValue, onValueChange } = useAccordion();
  const isOpen = value === selectedValue;

  return (
    <button
      className="accordion-trigger"
      aria-expanded={isOpen}
      onClick={() => onValueChange(isOpen ? '' : value)}
    >
      {children}
    </button>
  );
}

function AccordionContent({ children, value }: { children: ReactNode; value: string }) {
  const { value: selectedValue } = useAccordion();
  const isOpen = value === selectedValue;

  if (!isOpen) return null;

  return (
    <div className="accordion-content" role="region">
      {children}
    </div>
  );
}

// Attach subcomponents
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

export { Accordion };

// Usage
<Accordion defaultValue="item-1">
  <Accordion.Item value="item-1">
    <Accordion.Trigger value="item-1">Section 1</Accordion.Trigger>
    <Accordion.Content value="item-1">Content for section 1</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Trigger value="item-2">Section 2</Accordion.Trigger>
    <Accordion.Content value="item-2">Content for section 2</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

---

## Quick Audit Checklist

```
□ No boolean prop proliferation (3+ booleans = refactor)
□ Complex components use compound pattern
□ State accessible via context, not prop drilling
□ Variants are explicit components, not boolean modes
□ Children composition preferred over render props
□ forwardRef removed in React 19+ projects
□ Context has clear interface (state, actions, metadata)
□ Implementation details hidden in providers
```

---

## References

- [Vercel Composition Patterns](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [React Patterns](https://reactpatterns.com/)
