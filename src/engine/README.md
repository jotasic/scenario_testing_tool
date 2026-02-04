# Scenario Execution Engine

The execution engine orchestrates the complete runtime behavior of scenarios, including variable resolution, condition evaluation, loop processing, HTTP requests, and step-by-step execution.

## Architecture

The engine is composed of five core modules:

```
engine/
├── variableResolver.ts      # Variable reference resolution (${...})
├── conditionEvaluator.ts    # Condition evaluation (==, !=, >, <, etc.)
├── loopProcessor.ts         # Loop iteration (forEach, count, while)
├── httpClient.ts            # HTTP request wrapper (axios)
├── scenarioExecutor.ts      # Main orchestrator
└── index.ts                 # Public API exports
```

## Modules

### 1. Variable Resolver (`variableResolver.ts`)

Resolves `${...}` variable references in strings, objects, and arrays.

**Supported Variable Types:**
- `${params.field}` - Scenario input parameters
- `${response.stepId.field}` - Response from a previous step
- `${loop.item}` - Current loop item (forEach loops)
- `${loop.item.field}` - Field in current loop item
- `${loop.index}` - Current loop index (0-based)
- `${system.timestamp}` - Current timestamp (ISO format)

**Features:**
- Nested path resolution: `${params.user.address.city}`
- Array access: `${params.list[0].id}`
- Type preservation: `"${params.count}"` returns number if count is 5
- Recursive resolution in objects and arrays

**Key Functions:**
```typescript
// Resolve any value (string, object, array)
resolveVariables(template: unknown, context: VariableContext): unknown

// Resolve a variable path
resolveVariablePath(path: string, context: VariableContext): unknown

// Create context for resolution
createVariableContext(
  params: Record<string, unknown>,
  responses?: Record<string, unknown>,
  loopContexts?: LoopContext[]
): VariableContext
```

**Example:**
```typescript
const context = createVariableContext(
  { userId: 123, name: "John" },
  { step1: { status: 200, data: { id: 456 } } }
);

resolveVariables("User ${params.name} (${params.userId})", context);
// => "User John (123)"

resolveVariables({ url: "/users/${params.userId}" }, context);
// => { url: "/users/123" }

resolveVariables("${response.step1.data.id}", context);
// => 456 (number, not string)
```

---

### 2. Condition Evaluator (`conditionEvaluator.ts`)

Evaluates conditions for branching and conditional step execution.

**Supported Operators:**
- `==`, `!=` - Equality (uses loose equality)
- `>`, `>=`, `<`, `<=` - Numeric comparison
- `contains`, `notContains` - String/array membership
- `isEmpty`, `isNotEmpty` - Empty check (string/array/object)
- `exists` - Null/undefined check

**Logical Operators:**
- `AND` - All conditions must pass
- `OR` - At least one condition must pass

**Features:**
- Single condition evaluation
- Nested condition groups
- Response-based and parameter-based conditions

**Key Functions:**
```typescript
// Evaluate a condition expression
evaluateCondition(
  expression: ConditionExpression,
  context: VariableContext
): boolean

// Evaluate optional condition (returns true if undefined)
evaluateOptionalCondition(
  expression: ConditionExpression | undefined,
  context: VariableContext
): boolean
```

**Example:**
```typescript
// Single condition
const condition: Condition = {
  id: "c1",
  source: "response",
  stepId: "step1",
  field: "status",
  operator: "==",
  value: 200
};

evaluateCondition(condition, context); // => true/false

// Nested condition group
const group: ConditionGroup = {
  id: "g1",
  operator: "AND",
  conditions: [
    { id: "c1", source: "params", field: "age", operator: ">", value: 18 },
    { id: "c2", source: "params", field: "verified", operator: "==", value: true }
  ]
};

evaluateCondition(group, context); // => true if both conditions pass
```

---

### 3. Loop Processor (`loopProcessor.ts`)

Manages loop iterations with support for forEach, count, and while loops.

**Loop Types:**

**ForEach Loop:**
- Iterates over arrays from params or responses
- Supports `countField` for nested iteration
- Access via `${loop.item}` and `${loop.index}`

**Count Loop:**
- Fixed number of iterations
- Count can be a number or variable reference
- Access via `${loop.index}`

**While Loop:**
- Condition-based iteration
- Maximum iteration limit to prevent infinite loops
- Condition re-evaluated after each iteration

**Features:**
- Iterator pattern for step-by-step execution
- Nested loop support via context stack
- Safety limits to prevent infinite loops
- Proper error handling with `LoopLimitExceededError`

**Key Functions:**
```typescript
// Create a loop iterator
createLoopIterator(loop: Loop, context: VariableContext): LoopIterator

// Update while loop condition (after each iteration)
updateWhileLoopCondition(
  iterator: LoopIterator,
  loop: WhileLoop,
  context: VariableContext
): void

// Iterator interface
interface LoopIterator {
  totalIterations: number;
  currentIndex: number;
  hasNext: boolean;
  next(): LoopContext | null;
  reset(): void;
}
```

**Example:**
```typescript
// ForEach loop
const forEachLoop: ForEachLoop = {
  id: "loop1",
  type: "forEach",
  source: "${params.users}",
  itemAlias: "user",
  indexAlias: "i"
};

const iterator = createLoopIterator(forEachLoop, context);

while (iterator.hasNext) {
  const loopContext = iterator.next();
  // loopContext.currentItem => current user
  // loopContext.currentIndex => iteration number
}

// Count loop
const countLoop: CountLoop = {
  id: "loop2",
  type: "count",
  count: 5
};

// While loop
const whileLoop: WhileLoop = {
  id: "loop3",
  type: "while",
  condition: {
    id: "c1",
    source: "response",
    stepId: "status",
    field: "hasMore",
    operator: "==",
    value: true
  },
  maxIterations: 100
};
```

---

### 4. HTTP Client (`httpClient.ts`)

Wraps axios for making HTTP requests with variable resolution.

**Features:**
- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Server and step header merging (step headers override)
- Variable resolution in URL, headers, and body
- Configurable timeout
- Structured response format
- Comprehensive error handling

**Key Functions:**
```typescript
// Execute a step request (with server config)
executeStepRequest(
  server: Server,
  method: HttpMethod,
  endpoint: string,
  stepHeaders: StepHeader[],
  body: unknown,
  queryParams: Record<string, string> | undefined,
  timeout: number | undefined,
  context: VariableContext
): Promise<HttpResponse>

// Make a raw HTTP request
makeHttpRequest(config: HttpRequestConfig): Promise<HttpResponse>

// Merge headers (step overrides server)
mergeHeaders(
  serverHeaders: StepHeader[],
  stepHeaders?: StepHeader[]
): Record<string, string>
```

**Response Format:**
```typescript
interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number; // in milliseconds
}
```

**Example:**
```typescript
const response = await executeStepRequest(
  server,
  "POST",
  "/users/${params.userId}",
  [{ key: "X-Custom", value: "value", enabled: true }],
  { name: "${params.name}" },
  undefined,
  5000,
  context
);

console.log(response.status); // 201
console.log(response.data);   // { id: 123, name: "John" }
console.log(response.duration); // 245 (ms)
```

---

### 5. Scenario Executor (`scenarioExecutor.ts`)

Main orchestrator that manages complete scenario execution.

**Features:**
- Step-by-step execution with proper flow control
- Execution modes: auto, manual, delayed, bypass
- Branch evaluation and navigation
- Loop execution with nested context
- Response storage for variable resolution
- Pause/resume/stop control
- Event callbacks for UI updates
- Comprehensive logging
- Error handling with optional stop-on-error

**Execution Flow:**
```
1. Start from startStepId
2. For each step:
   a. Check pre-condition
   b. Handle execution mode (manual, delayed, bypass)
   c. Execute step based on type:
      - Request: Make HTTP request, save response
      - Condition: Evaluate branches, navigate
      - Loop: Create iterator, execute body, manage context
      - Group: Execute contained steps
   d. Navigate to next step
3. Complete or fail
```

**Key Classes:**
```typescript
class ScenarioExecutor {
  constructor(scenario: Scenario, servers: Map<string, Server>)

  execute(
    params: Record<string, unknown>,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>

  getControl(): ExecutionControl
}

// Convenience function
executeScenario(
  scenario: Scenario,
  servers: Map<string, Server>,
  params: Record<string, unknown>,
  options?: ExecutionOptions
): Promise<ExecutionResult>
```

**Callbacks:**
```typescript
interface ExecutionCallbacks {
  onStepStart?: (stepId: string, status: StepExecutionStatus) => void;
  onStepComplete?: (stepId: string, result: StepExecutionResult) => void;
  onLog?: (log: ExecutionLog) => void;
  onError?: (error: Error, stepId?: string) => void;
  onStatusChange?: (status: ExecutionStatus) => void;
}
```

**Execution Control:**
```typescript
interface ExecutionControl {
  pause(): void;
  resume(): void;
  stop(): void;
  isPaused(): boolean;
  isStopped(): boolean;
}
```

**Example:**
```typescript
const executor = new ScenarioExecutor(scenario, serversMap);

const result = await executor.execute(
  { userId: 123, name: "John" },
  {
    stepModeOverrides: { "step2": "manual" },
    callbacks: {
      onStepComplete: (stepId, result) => {
        console.log(`Step ${stepId} completed:`, result);
      },
      onLog: (log) => {
        console.log(`[${log.level}] ${log.message}`);
      }
    },
    stopOnError: true
  }
);

console.log(result.status); // 'completed' | 'failed' | 'cancelled'
console.log(result.stepResults); // Map of step results
console.log(result.responses); // Saved responses
console.log(result.logs); // Execution logs
```

---

## Usage Examples

### Basic Execution

```typescript
import { executeScenario } from './engine';

const result = await executeScenario(
  scenario,
  serversMap,
  { userId: 123 }
);

if (result.status === 'completed') {
  console.log('Scenario completed successfully');
  console.log('Final responses:', result.responses);
}
```

### With Manual Steps and Control

```typescript
const executor = new ScenarioExecutor(scenario, serversMap);
const control = executor.getControl();

// Start execution in background
const resultPromise = executor.execute(
  { userId: 123 },
  {
    stepModeOverrides: { "step3": "manual" },
    callbacks: {
      onStatusChange: (status) => {
        if (status === 'paused') {
          // Show "Continue" button to user
          showContinueButton(() => control.resume());
        }
      }
    }
  }
);

// User can pause/resume/stop
pauseButton.onclick = () => control.pause();
resumeButton.onclick = () => control.resume();
stopButton.onclick = () => control.stop();

const result = await resultPromise;
```

### Variable Resolution in Steps

```typescript
// Request step with variable references
const requestStep: RequestStep = {
  // ... other fields
  endpoint: "/users/${params.userId}",
  body: {
    name: "${params.name}",
    email: "${params.email}",
    status: "${response.checkStep.status}"
  },
  headers: [
    {
      key: "Authorization",
      value: "Bearer ${params.token}",
      enabled: true
    }
  ]
};

// Variables are resolved before request is sent
```

### Loop with Nested Iterations

```typescript
// ForEach loop over users array
const loopStep: LoopStep = {
  id: "loop1",
  type: "loop",
  loop: {
    id: "userLoop",
    type: "forEach",
    source: "${params.users}",
    itemAlias: "user",
    indexAlias: "i"
  },
  stepIds: ["createUser", "assignRole"],
  // ... other fields
};

// Inside loop, access via:
// ${loop.item.name} => current user's name
// ${loop.index} => 0, 1, 2, ...
```

### Conditional Branching

```typescript
const conditionStep: ConditionStep = {
  id: "checkStatus",
  type: "condition",
  branches: [
    {
      id: "b1",
      condition: {
        id: "c1",
        source: "response",
        stepId: "apiCall",
        field: "status",
        operator: "==",
        value: 200
      },
      nextStepId: "successStep"
    },
    {
      id: "b2",
      condition: {
        id: "c2",
        source: "response",
        stepId: "apiCall",
        field: "status",
        operator: ">=",
        value: 400
      },
      nextStepId: "errorStep"
    },
    {
      id: "b3",
      isDefault: true,
      nextStepId: "retryStep"
    }
  ],
  // ... other fields
};
```

---

## Error Handling

The engine provides comprehensive error handling:

**Variable Resolution Errors:**
- Missing variables return `undefined`
- Path resolution errors are handled gracefully

**Condition Evaluation Errors:**
- Invalid operators throw `Error`
- Type mismatches return `false`

**Loop Processing Errors:**
- `LoopLimitExceededError` for infinite loops
- Invalid loop configuration throws `Error`

**HTTP Request Errors:**
- `HttpRequestError` with status, statusText, and response
- Network errors and timeouts are captured
- Error details are stored in step result

**Execution Errors:**
- Errors are logged and stored in execution result
- `stopOnError` option controls whether to continue
- Execution status set to 'failed' on error

---

## Performance Considerations

**Variable Resolution:**
- Uses lodash-es `get()` for efficient nested path access
- Single-pass string replacement with regex
- Lazy evaluation (only resolves when needed)

**Condition Evaluation:**
- Short-circuit evaluation for AND/OR groups
- Type checking before numeric comparisons
- Minimal object allocation

**Loop Processing:**
- Iterator pattern avoids loading all data upfront
- Safety limits prevent resource exhaustion
- Context stack for nested loops is lightweight

**HTTP Requests:**
- Uses axios with proper timeout configuration
- Connection pooling and keep-alive
- Response streaming for large payloads

**Memory Management:**
- Step results stored in Map for O(1) access
- Logs can grow large - consider implementing size limit
- Response data kept in memory - consider cleanup for long-running scenarios

---

## Type Safety

All modules are fully typed with TypeScript:
- No `any` types in public API
- Strict null checking
- Proper discriminated unions for step types
- Generic types for flexible usage

---

## Testing Recommendations

**Unit Tests:**
- Variable resolution with nested paths and arrays
- All condition operators
- Loop iterations (forEach, count, while)
- HTTP error scenarios
- Branch evaluation logic

**Integration Tests:**
- Complete scenario execution
- Nested loops
- Response-based conditions
- Manual step pause/resume
- Error recovery

**Performance Tests:**
- Large parameter objects
- Deep loop nesting
- Many concurrent requests
- Long-running scenarios

---

## Future Enhancements

Potential improvements for future versions:

1. **Parallel Step Execution**
   - Execute independent steps concurrently
   - Configurable parallelism limits

2. **Step Retry Logic**
   - Automatic retry on failure
   - Exponential backoff
   - Retry conditions

3. **Response Transformation**
   - JSONPath queries
   - Data extraction and mapping
   - Response validation

4. **Debugging Support**
   - Breakpoints
   - Step-by-step execution
   - Variable inspection

5. **Performance Monitoring**
   - Step duration metrics
   - Resource usage tracking
   - Bottleneck detection

6. **Advanced Loops**
   - Parallel loop execution
   - Loop break/continue
   - Dynamic loop targets

7. **Webhook Support**
   - Async request completion
   - Callback URLs
   - Event subscriptions
