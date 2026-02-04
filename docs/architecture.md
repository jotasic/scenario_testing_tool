# Scenario Testing Tool - Architecture Proposal

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Redux State Architecture](#3-redux-state-architecture)
4. [Execution Engine](#4-execution-engine)
5. [Variable Resolution](#5-variable-resolution)
6. [Validation Strategy](#6-validation-strategy)
7. [Storage Strategy](#7-storage-strategy)
8. [Component Hierarchy](#8-component-hierarchy)
9. [Key Challenges and Solutions](#9-key-challenges-and-solutions)

---

## 1. Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   UI Layer  │  │ Redux Store │  │   Execution Engine      │  │
│  │  (MUI + RF) │◄─┤  (RTK)      │◄─┤  (Pure TypeScript)      │  │
│  └─────────────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│                          │                      │                │
│                   ┌──────┴──────────────────────┴──────┐        │
│                   │         Service Layer              │        │
│                   │  (HTTP Client, Storage, Validators)│        │
│                   └────────────────┬───────────────────┘        │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Server A │    │ Server B │    │ Server N │
              └──────────┘    └──────────┘    └──────────┘
```

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 18+ with TypeScript |
| State Management | Redux Toolkit (RTK) |
| UI Components | Material-UI (MUI) v5 |
| Flow Visualization | React Flow |
| HTTP Client | Axios |
| Storage | LocalStorage + IndexedDB |
| Validation | Zod |

---

## 2. Data Model

### 2.1 Core Entity Relationship

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Scenario   │──1:N──│    Step     │──1:N──│   Branch    │
└──────┬──────┘       └──────┬──────┘       └─────────────┘
       │                     │
       │1:N                  │1:1
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Server    │       │    Loop     │
└─────────────┘       └─────────────┘
       │                     │
       │                     │1:N
       │              ┌──────┴──────┐
       │              ▼             ▼
       │       ┌───────────┐ ┌───────────┐
       └───────│ Condition │ │ Variable  │
               └───────────┘ └───────────┘
```

### 2.2 TypeScript Interface Definitions


#### 2.2.1 Server Definition

```typescript
// src/types/server.ts

export interface ServerHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Server {
  id: string;                    // UUID
  name: string;                  // Unique identifier (e.g., "mock_server")
  baseUrl: string;               // e.g., "http://mock.example.com"
  headers: ServerHeader[];       // Common headers for all requests
  timeout: number;               // Request timeout in milliseconds
  description?: string;          // Optional description
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

// Example:
const exampleServer: Server = {
  id: "srv_123",
  name: "mock_server",
  baseUrl: "http://mock.example.com",
  headers: [
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Authorization", value: "Bearer ${token}", enabled: true }
  ],
  timeout: 30000,
  description: "External vendor mock server",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};
```

#### 2.2.2 Condition Definition

```typescript
// src/types/condition.ts

export type ConditionSource = "params" | "response";

export type ComparisonOperator = 
  | "==" | "!=" 
  | ">" | ">=" | "<" | "<="
  | "contains" | "notContains"
  | "isEmpty" | "isNotEmpty" | "exists";

export type LogicalOperator = "AND" | "OR";

export interface BaseCondition {
  id: string;
  source: ConditionSource;
  field: string;                 // JSON path (e.g., "data.status", "list[0].id")
  operator: ComparisonOperator;
  value?: unknown;               // Not required for isEmpty, isNotEmpty, exists
}

export interface ParamCondition extends BaseCondition {
  source: "params";
}

export interface ResponseCondition extends BaseCondition {
  source: "response";
  stepId: string;                // Reference to the step whose response to check
}

export type Condition = ParamCondition | ResponseCondition;

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (Condition | ConditionGroup)[];  // Supports nesting
}

// Helper type for single or grouped conditions
export type ConditionExpression = Condition | ConditionGroup;

// Example:
const exampleCondition: ConditionGroup = {
  id: "cg_1",
  operator: "OR",
  conditions: [
    {
      id: "c_1",
      source: "params",
      field: "list.length",
      operator: ">=",
      value: 2
    },
    {
      id: "c_2",
      source: "response",
      stepId: "step_123",
      field: "data.status",
      operator: "==",
      value: "SUCCESS"
    }
  ]
};
```

#### 2.2.3 Loop Definition

```typescript
// src/types/loop.ts

export type LoopType = "forEach" | "count" | "while";

export interface BaseLoop {
  id: string;
  type: LoopType;
  maxIterations?: number;        // Safety limit to prevent infinite loops
}

export interface ForEachLoop extends BaseLoop {
  type: "forEach";
  source: string;                // JSON path to array (e.g., "params.list")
  itemAlias: string;             // Variable name for current item (e.g., "item")
  indexAlias?: string;           // Variable name for index (e.g., "index")
  countField?: string;           // Field in each item for nested count (e.g., "count")
}

export interface CountLoop extends BaseLoop {
  type: "count";
  count: number | string;        // Fixed number or variable reference
}

export interface WhileLoop extends BaseLoop {
  type: "while";
  condition: ConditionExpression;
}

export type Loop = ForEachLoop | CountLoop | WhileLoop;

// Example:
const exampleForEachLoop: ForEachLoop = {
  id: "loop_1",
  type: "forEach",
  source: "params.list",
  itemAlias: "item",
  indexAlias: "i",
  countField: "count",
  maxIterations: 100
};
```

#### 2.2.4 Branch Definition

```typescript
// src/types/branch.ts

export interface Branch {
  id: string;
  condition?: ConditionExpression;  // If undefined, this is the default branch
  isDefault?: boolean;
  nextStepId: string;               // Target step to jump to
  label?: string;                   // Display label for the branch
}

// Example:
const exampleBranches: Branch[] = [
  {
    id: "br_1",
    condition: {
      id: "c_1",
      source: "response",
      stepId: "step_payment",
      field: "status",
      operator: "==",
      value: "SUCCESS"
    },
    nextStepId: "step_complete",
    label: "Success"
  },
  {
    id: "br_2",
    isDefault: true,
    nextStepId: "step_error",
    label: "Error (default)"
  }
];
```

#### 2.2.5 Step Definition

```typescript
// src/types/step.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ExecutionMode = "auto" | "manual" | "delayed" | "bypass";

export type StepType = "request" | "condition" | "loop" | "group";

export interface StepHeader {
  key: string;
  value: string;                 // Can contain variable references
  enabled: boolean;
}

export interface BaseStep {
  id: string;
  name: string;
  type: StepType;
  description?: string;
  executionMode: ExecutionMode;
  delayMs?: number;              // For delayed mode
  condition?: ConditionExpression;  // Pre-condition to execute this step
  position: {                    // For React Flow visualization
    x: number;
    y: number;
  };
}

export interface RequestStep extends BaseStep {
  type: "request";
  serverId: string;              // Reference to server
  method: HttpMethod;
  endpoint: string;              // Can contain variable references
  headers: StepHeader[];         // Step-specific headers (merged with server headers)
  body?: unknown;                // Request body (can contain variable references)
  queryParams?: Record<string, string>;
  waitForResponse: boolean;      // Long-polling support
  saveResponse: boolean;         // Save response for later reference
  responseAlias?: string;        // Custom name for response reference
  timeout?: number;              // Override server timeout
  branches?: Branch[];           // Response-based branching
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    retryOn: number[];           // HTTP status codes to retry on
  };
}

export interface ConditionStep extends BaseStep {
  type: "condition";
  branches: Branch[];            // At least 2 branches required
}

export interface LoopStep extends BaseStep {
  type: "loop";
  loop: Loop;
  stepIds: string[];             // Steps to execute in each iteration
}

export interface GroupStep extends BaseStep {
  type: "group";
  stepIds: string[];             // Grouped steps (for organization)
  collapsed?: boolean;           // UI state
}

export type Step = RequestStep | ConditionStep | LoopStep | GroupStep;

// Example:
const exampleRequestStep: RequestStep = {
  id: "step_x1",
  name: "x1 Request",
  type: "request",
  description: "Send x1 request to mock server",
  executionMode: "auto",
  serverId: "srv_mock",
  method: "POST",
  endpoint: "/scenario/x1",
  headers: [],
  body: {
    list: "${params.list}",
    timestamp: "${system.timestamp}"
  },
  waitForResponse: true,
  saveResponse: true,
  responseAlias: "x1Response",
  condition: {
    id: "c_1",
    source: "params",
    field: "list.length",
    operator: ">=",
    value: 2
  },
  branches: [
    {
      id: "br_1",
      condition: {
        id: "c_2",
        source: "response",
        stepId: "step_x1",
        field: "status",
        operator: "==",
        value: "SUCCESS"
      },
      nextStepId: "step_complete"
    }
  ],
  position: { x: 200, y: 100 }
};
```

#### 2.2.6 Parameter Schema Definition

```typescript
// src/types/parameter.ts

export type ParameterType = 
  | "string" | "number" | "boolean" 
  | "object" | "array" | "any";

export interface ParameterSchema {
  id: string;
  name: string;                  // Field name
  type: ParameterType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  
  // For array type
  itemSchema?: ParameterSchema;
  
  // For object type
  properties?: ParameterSchema[];
  
  // Validation
  validation?: {
    min?: number;                // For number/string length/array length
    max?: number;
    pattern?: string;            // Regex for string
    enum?: unknown[];            // Allowed values
  };
}

// Example:
const exampleParameterSchema: ParameterSchema[] = [
  {
    id: "param_list",
    name: "list",
    type: "array",
    required: true,
    description: "List of items to process",
    itemSchema: {
      id: "param_list_item",
      name: "item",
      type: "object",
      required: true,
      properties: [
        {
          id: "param_id",
          name: "id",
          type: "number",
          required: true
        },
        {
          id: "param_count",
          name: "count",
          type: "number",
          required: true,
          defaultValue: 1,
          validation: { min: 1, max: 10 }
        }
      ]
    }
  }
];
```

#### 2.2.7 Scenario Definition

```typescript
// src/types/scenario.ts

export interface ScenarioEdge {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  sourceHandle?: string;         // For branching (e.g., "success", "error")
  label?: string;
  animated?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  version: string;               // Semantic versioning
  
  // References
  serverIds: string[];           // Servers used in this scenario
  
  // Parameter definition
  parameterSchema: ParameterSchema[];
  
  // Steps and flow
  steps: Step[];
  edges: ScenarioEdge[];         // Connections between steps
  startStepId: string;           // Entry point
  
  // Metadata
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Example:
const exampleScenario: Scenario = {
  id: "scn_001",
  name: "External Vendor Integration Test",
  description: "Test scenario for vendor API integration",
  version: "1.0.0",
  serverIds: ["srv_mock", "srv_main"],
  parameterSchema: [/* ... */],
  steps: [/* ... */],
  edges: [
    { id: "e_1", sourceStepId: "step_start", targetStepId: "step_x1" },
    { id: "e_2", sourceStepId: "step_x1", targetStepId: "step_loop", sourceHandle: "success" }
  ],
  startStepId: "step_start",
  tags: ["integration", "vendor"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};
```

#### 2.2.8 Execution State Types

```typescript
// src/types/execution.ts

export type ExecutionStatus = 
  | "idle"           // Not started
  | "running"        // Currently executing
  | "paused"         // Paused (manual step waiting)
  | "completed"      // Successfully finished
  | "failed"         // Failed with error
  | "cancelled";     // User cancelled

export type StepExecutionStatus = 
  | "pending"        // Not yet executed
  | "running"        // Currently executing
  | "waiting"        // Waiting for manual trigger or delay
  | "success"        // Completed successfully
  | "failed"         // Failed with error
  | "skipped"        // Bypassed or condition not met
  | "cancelled";     // Cancelled by user

export interface StepExecutionResult {
  stepId: string;
  status: StepExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  
  // For request steps
  request?: {
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    duration: number;            // Response time in ms
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  
  // For loop steps
  iterations?: number;
  currentIteration?: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  stepId?: string;
  message: string;
  data?: unknown;
}

export interface ExecutionContext {
  id: string;                    // Unique execution ID
  scenarioId: string;
  status: ExecutionStatus;
  
  // Input parameters
  params: Record<string, unknown>;
  
  // Runtime overrides
  stepModeOverrides: Record<string, ExecutionMode>;
  
  // Execution state
  currentStepId?: string;
  stepResults: Record<string, StepExecutionResult>;
  
  // Variable storage
  responses: Record<string, unknown>;  // stepId/alias -> response data
  loopContextStack: LoopContext[];     // For nested loops
  
  // Logs
  logs: ExecutionLog[];
  
  // Timing
  startedAt?: string;
  completedAt?: string;
}

export interface LoopContext {
  loopId: string;
  currentIndex: number;
  currentItem?: unknown;
  totalIterations: number;
}
```

---

## 3. Redux State Architecture

### 3.1 Store Structure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Redux Store                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   servers   │  │  scenarios  │  │     execution       │  │
│  │   Slice     │  │   Slice     │  │      Slice          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │     ui      │  │   editor    │  │     templates       │  │
│  │   Slice     │  │   Slice     │  │      Slice          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Slice Definitions

#### 3.2.1 Servers Slice

```typescript
// src/store/slices/serversSlice.ts

import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Server } from '../../types/server';

const serversAdapter = createEntityAdapter<Server>({
  selectId: (server) => server.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface ServersState {
  entities: Record<string, Server>;
  ids: string[];
  selectedServerId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ServersState = serversAdapter.getInitialState({
  selectedServerId: null,
  loading: false,
  error: null,
});

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    addServer: serversAdapter.addOne,
    updateServer: serversAdapter.updateOne,
    removeServer: serversAdapter.removeOne,
    setServers: serversAdapter.setAll,
    selectServer: (state, action: PayloadAction<string | null>) => {
      state.selectedServerId = action.payload;
    },
    duplicateServer: (state, action: PayloadAction<string>) => {
      const original = state.entities[action.payload];
      if (original) {
        const duplicate: Server = {
          ...original,
          id: `srv_${Date.now()}`,
          name: `${original.name}_copy`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        serversAdapter.addOne(state, duplicate);
      }
    },
  },
});

export const serversActions = serversSlice.actions;
export const serversSelectors = serversAdapter.getSelectors();
export default serversSlice.reducer;
```

#### 3.2.2 Scenarios Slice

```typescript
// src/store/slices/scenariosSlice.ts

import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Scenario, Step, ScenarioEdge } from '../../types/scenario';

const scenariosAdapter = createEntityAdapter<Scenario>({
  selectId: (scenario) => scenario.id,
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

interface ScenariosState {
  entities: Record<string, Scenario>;
  ids: string[];
  activeScenarioId: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterTags: string[];
}

const initialState: ScenariosState = scenariosAdapter.getInitialState({
  activeScenarioId: null,
  loading: false,
  error: null,
  searchQuery: '',
  filterTags: [],
});

const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    // CRUD operations
    addScenario: scenariosAdapter.addOne,
    updateScenario: scenariosAdapter.updateOne,
    removeScenario: scenariosAdapter.removeOne,
    setScenarios: scenariosAdapter.setAll,
    
    // Active scenario
    setActiveScenario: (state, action: PayloadAction<string | null>) => {
      state.activeScenarioId = action.payload;
    },
    
    // Step operations (within active scenario)
    addStep: (state, action: PayloadAction<{ scenarioId: string; step: Step }>) => {
      const scenario = state.entities[action.payload.scenarioId];
      if (scenario) {
        scenario.steps.push(action.payload.step);
        scenario.updatedAt = new Date().toISOString();
      }
    },
    
    updateStep: (state, action: PayloadAction<{ 
      scenarioId: string; 
      stepId: string; 
      changes: Partial<Step> 
    }>) => {
      const scenario = state.entities[action.payload.scenarioId];
      if (scenario) {
        const stepIndex = scenario.steps.findIndex(s => s.id === action.payload.stepId);
        if (stepIndex !== -1) {
          scenario.steps[stepIndex] = { 
            ...scenario.steps[stepIndex], 
            ...action.payload.changes 
          } as Step;
          scenario.updatedAt = new Date().toISOString();
        }
      }
    },
    
    removeStep: (state, action: PayloadAction<{ scenarioId: string; stepId: string }>) => {
      const scenario = state.entities[action.payload.scenarioId];
      if (scenario) {
        scenario.steps = scenario.steps.filter(s => s.id !== action.payload.stepId);
        scenario.edges = scenario.edges.filter(
          e => e.sourceStepId !== action.payload.stepId && 
               e.targetStepId !== action.payload.stepId
        );
        scenario.updatedAt = new Date().toISOString();
      }
    },
    
    // Edge operations
    addEdge: (state, action: PayloadAction<{ scenarioId: string; edge: ScenarioEdge }>) => {
      const scenario = state.entities[action.payload.scenarioId];
      if (scenario) {
        scenario.edges.push(action.payload.edge);
        scenario.updatedAt = new Date().toISOString();
      }
    },
    
    removeEdge: (state, action: PayloadAction<{ scenarioId: string; edgeId: string }>) => {
      const scenario = state.entities[action.payload.scenarioId];
      if (scenario) {
        scenario.edges = scenario.edges.filter(e => e.id !== action.payload.edgeId);
        scenario.updatedAt = new Date().toISOString();
      }
    },
    
    // Filtering
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterTags: (state, action: PayloadAction<string[]>) => {
      state.filterTags = action.payload;
    },
  },
});

export const scenariosActions = scenariosSlice.actions;
export const scenariosSelectors = scenariosAdapter.getSelectors();
export default scenariosSlice.reducer;
```

#### 3.2.3 Execution Slice

```typescript
// src/store/slices/executionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ExecutionContext, 
  ExecutionStatus, 
  StepExecutionResult, 
  ExecutionLog,
  ExecutionMode 
} from '../../types/execution';

interface ExecutionState {
  // Current execution context
  context: ExecutionContext | null;
  
  // Execution history (last N executions)
  history: ExecutionContext[];
  maxHistorySize: number;
  
  // UI state
  autoScroll: boolean;
  logFilter: 'all' | 'info' | 'warn' | 'error';
  expandedSteps: string[];
}

const initialState: ExecutionState = {
  context: null,
  history: [],
  maxHistorySize: 50,
  autoScroll: true,
  logFilter: 'all',
  expandedSteps: [],
};

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    // Execution lifecycle
    startExecution: (state, action: PayloadAction<{
      scenarioId: string;
      params: Record<string, unknown>;
      stepModeOverrides?: Record<string, ExecutionMode>;
    }>) => {
      const newContext: ExecutionContext = {
        id: `exec_${Date.now()}`,
        scenarioId: action.payload.scenarioId,
        status: 'running',
        params: action.payload.params,
        stepModeOverrides: action.payload.stepModeOverrides || {},
        stepResults: {},
        responses: {},
        loopContextStack: [],
        logs: [],
        startedAt: new Date().toISOString(),
      };
      state.context = newContext;
    },
    
    pauseExecution: (state) => {
      if (state.context) {
        state.context.status = 'paused';
      }
    },
    
    resumeExecution: (state) => {
      if (state.context && state.context.status === 'paused') {
        state.context.status = 'running';
      }
    },
    
    cancelExecution: (state) => {
      if (state.context) {
        state.context.status = 'cancelled';
        state.context.completedAt = new Date().toISOString();
        // Move to history
        state.history.unshift(state.context);
        if (state.history.length > state.maxHistorySize) {
          state.history.pop();
        }
      }
    },
    
    completeExecution: (state, action: PayloadAction<'completed' | 'failed'>) => {
      if (state.context) {
        state.context.status = action.payload;
        state.context.completedAt = new Date().toISOString();
        state.history.unshift(state.context);
        if (state.history.length > state.maxHistorySize) {
          state.history.pop();
        }
      }
    },
    
    clearCurrentExecution: (state) => {
      state.context = null;
    },
    
    // Step execution updates
    setCurrentStep: (state, action: PayloadAction<string>) => {
      if (state.context) {
        state.context.currentStepId = action.payload;
      }
    },
    
    updateStepResult: (state, action: PayloadAction<StepExecutionResult>) => {
      if (state.context) {
        state.context.stepResults[action.payload.stepId] = action.payload;
      }
    },
    
    // Response storage
    saveResponse: (state, action: PayloadAction<{
      key: string;  // stepId or alias
      data: unknown;
    }>) => {
      if (state.context) {
        state.context.responses[action.payload.key] = action.payload.data;
      }
    },
    
    // Loop context
    pushLoopContext: (state, action: PayloadAction<{
      loopId: string;
      totalIterations: number;
    }>) => {
      if (state.context) {
        state.context.loopContextStack.push({
          loopId: action.payload.loopId,
          currentIndex: 0,
          totalIterations: action.payload.totalIterations,
        });
      }
    },
    
    updateLoopContext: (state, action: PayloadAction<{
      loopId: string;
      currentIndex: number;
      currentItem?: unknown;
    }>) => {
      if (state.context) {
        const ctx = state.context.loopContextStack.find(
          lc => lc.loopId === action.payload.loopId
        );
        if (ctx) {
          ctx.currentIndex = action.payload.currentIndex;
          ctx.currentItem = action.payload.currentItem;
        }
      }
    },
    
    popLoopContext: (state) => {
      if (state.context) {
        state.context.loopContextStack.pop();
      }
    },
    
    // Logging
    addLog: (state, action: PayloadAction<Omit<ExecutionLog, 'id' | 'timestamp'>>) => {
      if (state.context) {
        state.context.logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          ...action.payload,
        });
      }
    },
    
    // UI state
    setAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.autoScroll = action.payload;
    },
    
    setLogFilter: (state, action: PayloadAction<'all' | 'info' | 'warn' | 'error'>) => {
      state.logFilter = action.payload;
    },
    
    toggleStepExpanded: (state, action: PayloadAction<string>) => {
      const idx = state.expandedSteps.indexOf(action.payload);
      if (idx === -1) {
        state.expandedSteps.push(action.payload);
      } else {
        state.expandedSteps.splice(idx, 1);
      }
    },
    
    // History
    clearHistory: (state) => {
      state.history = [];
    },
    
    loadFromHistory: (state, action: PayloadAction<string>) => {
      const historical = state.history.find(h => h.id === action.payload);
      if (historical) {
        state.context = { ...historical };
      }
    },
  },
});

export const executionActions = executionSlice.actions;
export default executionSlice.reducer;
```

#### 3.2.4 UI Slice

```typescript
// src/store/slices/uiSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AppMode = 'config' | 'execution';
type EditorTab = 'visual' | 'json' | 'yaml';
type SidePanel = 'servers' | 'parameters' | 'steps' | 'none';

interface UIState {
  // Global mode
  mode: AppMode;
  
  // Editor state
  editorTab: EditorTab;
  selectedStepId: string | null;
  sidePanel: SidePanel;
  sidePanelWidth: number;
  
  // Dialogs
  dialogs: {
    serverEdit: { open: boolean; serverId: string | null };
    stepEdit: { open: boolean; stepId: string | null };
    conditionBuilder: { open: boolean; targetStepId: string | null };
    loopConfig: { open: boolean; targetStepId: string | null };
    importExport: { open: boolean; mode: 'import' | 'export' };
    confirmation: { 
      open: boolean; 
      title: string; 
      message: string; 
      onConfirm: string | null;  // Action type to dispatch
    };
  };
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    autoHideDuration?: number;
  }>;
  
  // React Flow state
  flowViewport: { x: number; y: number; zoom: number };
  
  // Preferences
  theme: 'light' | 'dark';
  compactMode: boolean;
}

const initialState: UIState = {
  mode: 'config',
  editorTab: 'visual',
  selectedStepId: null,
  sidePanel: 'steps',
  sidePanelWidth: 300,
  dialogs: {
    serverEdit: { open: false, serverId: null },
    stepEdit: { open: false, stepId: null },
    conditionBuilder: { open: false, targetStepId: null },
    loopConfig: { open: false, targetStepId: null },
    importExport: { open: false, mode: 'export' },
    confirmation: { open: false, title: '', message: '', onConfirm: null },
  },
  notifications: [],
  flowViewport: { x: 0, y: 0, zoom: 1 },
  theme: 'light',
  compactMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppMode>) => {
      state.mode = action.payload;
    },
    
    setEditorTab: (state, action: PayloadAction<EditorTab>) => {
      state.editorTab = action.payload;
    },
    
    selectStep: (state, action: PayloadAction<string | null>) => {
      state.selectedStepId = action.payload;
    },
    
    setSidePanel: (state, action: PayloadAction<SidePanel>) => {
      state.sidePanel = action.payload;
    },
    
    setSidePanelWidth: (state, action: PayloadAction<number>) => {
      state.sidePanelWidth = action.payload;
    },
    
    openDialog: (state, action: PayloadAction<{
      dialog: keyof UIState['dialogs'];
      data?: Partial<UIState['dialogs'][keyof UIState['dialogs']]>;
    }>) => {
      const { dialog, data } = action.payload;
      state.dialogs[dialog] = { 
        ...state.dialogs[dialog], 
        open: true, 
        ...data 
      } as any;
    },
    
    closeDialog: (state, action: PayloadAction<keyof UIState['dialogs']>) => {
      state.dialogs[action.payload].open = false;
    },
    
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      state.notifications.push({
        id: `notif_${Date.now()}`,
        ...action.payload,
      });
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    setFlowViewport: (state, action: PayloadAction<{ x: number; y: number; zoom: number }>) => {
      state.flowViewport = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
```

#### 3.2.5 Templates Slice

```typescript
// src/store/slices/templatesSlice.ts

import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Step } from '../../types/scenario';

export interface StepTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  step: Omit<Step, 'id' | 'position'>;
  createdAt: string;
}

const templatesAdapter = createEntityAdapter<StepTemplate>({
  selectId: (template) => template.id,
});

interface TemplatesState {
  entities: Record<string, StepTemplate>;
  ids: string[];
  categories: string[];
}

const initialState: TemplatesState = templatesAdapter.getInitialState({
  categories: ['HTTP Request', 'Condition', 'Loop', 'Custom'],
});

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    addTemplate: templatesAdapter.addOne,
    updateTemplate: templatesAdapter.updateOne,
    removeTemplate: templatesAdapter.removeOne,
    addCategory: (state, action: PayloadAction<string>) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload);
      }
    },
  },
});

export const templatesActions = templatesSlice.actions;
export const templatesSelectors = templatesAdapter.getSelectors();
export default templatesSlice.reducer;
```

#### 3.2.6 Store Configuration

```typescript
// src/store/index.ts

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER 
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import serversReducer from './slices/serversSlice';
import scenariosReducer from './slices/scenariosSlice';
import executionReducer from './slices/executionSlice';
import uiReducer from './slices/uiSlice';
import templatesReducer from './slices/templatesSlice';

const rootReducer = combineReducers({
  servers: serversReducer,
  scenarios: scenariosReducer,
  execution: executionReducer,
  ui: uiReducer,
  templates: templatesReducer,
});

const persistConfig = {
  key: 'scenario-tool',
  version: 1,
  storage,
  whitelist: ['servers', 'scenarios', 'templates'],  // Persist these slices
  blacklist: ['execution', 'ui'],  // Don't persist these
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 4. Execution Engine

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Execution Engine                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Executor   │───▶│  Resolver   │───▶│   HTTP Client       │  │
│  │  (Main)     │    │  (Variables)│    │   (Axios)           │  │
│  └──────┬──────┘    └─────────────┘    └─────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Condition  │    │    Loop     │    │   Branch            │  │
│  │  Evaluator  │    │   Handler   │    │   Handler           │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Core Executor

```typescript
// src/engine/executor.ts

import { store } from '../store';
import { executionActions } from '../store/slices/executionSlice';
import { Scenario, Step, RequestStep, ConditionStep, LoopStep } from '../types/scenario';
import { ExecutionMode, StepExecutionStatus } from '../types/execution';
import { VariableResolver } from './variableResolver';
import { ConditionEvaluator } from './conditionEvaluator';
import { LoopHandler } from './loopHandler';
import { HttpClient } from './httpClient';

export class ScenarioExecutor {
  private scenario: Scenario;
  private resolver: VariableResolver;
  private conditionEvaluator: ConditionEvaluator;
  private loopHandler: LoopHandler;
  private httpClient: HttpClient;
  private abortController: AbortController;
  private isPaused: boolean = false;
  private manualResolve: (() => void) | null = null;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.resolver = new VariableResolver();
    this.conditionEvaluator = new ConditionEvaluator(this.resolver);
    this.loopHandler = new LoopHandler(this.resolver);
    this.httpClient = new HttpClient();
    this.abortController = new AbortController();
  }

  async execute(params: Record<string, unknown>): Promise<void> {
    const dispatch = store.dispatch;
    
    try {
      // Initialize execution context
      dispatch(executionActions.startExecution({
        scenarioId: this.scenario.id,
        params,
      }));

      // Start from the entry point
      await this.executeStep(this.scenario.startStepId);

      // Mark as completed
      dispatch(executionActions.completeExecution('completed'));
      
    } catch (error) {
      if (error instanceof ExecutionCancelledError) {
        dispatch(executionActions.addLog({
          level: 'info',
          message: 'Execution cancelled by user',
        }));
      } else {
        dispatch(executionActions.addLog({
          level: 'error',
          message: `Execution failed: ${(error as Error).message}`,
          data: error,
        }));
        dispatch(executionActions.completeExecution('failed'));
      }
      throw error;
    }
  }

  private async executeStep(stepId: string): Promise<string | null> {
    const dispatch = store.dispatch;
    const step = this.scenario.steps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Check abort signal
    if (this.abortController.signal.aborted) {
      throw new ExecutionCancelledError();
    }

    dispatch(executionActions.setCurrentStep(stepId));
    dispatch(executionActions.addLog({
      level: 'info',
      stepId,
      message: `Starting step: ${step.name}`,
    }));

    // Get effective execution mode (with overrides)
    const context = store.getState().execution.context!;
    const effectiveMode = context.stepModeOverrides[stepId] || step.executionMode;

    // Handle execution mode
    if (effectiveMode === 'bypass') {
      dispatch(executionActions.updateStepResult({
        stepId,
        status: 'skipped',
      }));
      return this.getNextStepId(step);
    }

    if (effectiveMode === 'manual') {
      dispatch(executionActions.pauseExecution());
      dispatch(executionActions.updateStepResult({
        stepId,
        status: 'waiting',
      }));
      await this.waitForManualTrigger();
      dispatch(executionActions.resumeExecution());
    }

    if (effectiveMode === 'delayed' && step.delayMs) {
      dispatch(executionActions.updateStepResult({
        stepId,
        status: 'waiting',
      }));
      await this.delay(step.delayMs);
    }

    // Check pre-condition
    if (step.condition) {
      const shouldExecute = this.conditionEvaluator.evaluate(step.condition);
      if (!shouldExecute) {
        dispatch(executionActions.updateStepResult({
          stepId,
          status: 'skipped',
        }));
        dispatch(executionActions.addLog({
          level: 'info',
          stepId,
          message: 'Step skipped: condition not met',
        }));
        return this.getNextStepId(step);
      }
    }

    // Execute based on step type
    let nextStepId: string | null = null;

    switch (step.type) {
      case 'request':
        nextStepId = await this.executeRequestStep(step);
        break;
      case 'condition':
        nextStepId = await this.executeConditionStep(step);
        break;
      case 'loop':
        nextStepId = await this.executeLoopStep(step);
        break;
      case 'group':
        nextStepId = await this.executeGroupStep(step);
        break;
    }

    // Continue to next step if exists
    if (nextStepId) {
      return this.executeStep(nextStepId);
    }

    return null;
  }

  private async executeRequestStep(step: RequestStep): Promise<string | null> {
    const dispatch = store.dispatch;
    const startTime = Date.now();

    dispatch(executionActions.updateStepResult({
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));

    try {
      // Resolve variables in request
      const resolvedRequest = this.resolver.resolveRequest(step);
      
      // Execute HTTP request
      const response = await this.httpClient.request(
        resolvedRequest,
        this.abortController.signal
      );

      const duration = Date.now() - startTime;

      // Save response if configured
      if (step.saveResponse) {
        const key = step.responseAlias || step.id;
        dispatch(executionActions.saveResponse({
          key,
          data: response.data,
        }));
      }

      dispatch(executionActions.updateStepResult({
        stepId: step.id,
        status: 'success',
        completedAt: new Date().toISOString(),
        request: resolvedRequest,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          duration,
        },
      }));

      // Handle branching based on response
      if (step.branches && step.branches.length > 0) {
        for (const branch of step.branches) {
          if (branch.isDefault) continue;
          if (branch.condition && this.conditionEvaluator.evaluate(branch.condition)) {
            return branch.nextStepId;
          }
        }
        // Fall through to default branch
        const defaultBranch = step.branches.find(b => b.isDefault);
        if (defaultBranch) {
          return defaultBranch.nextStepId;
        }
      }

      return this.getNextStepId(step);

    } catch (error) {
      dispatch(executionActions.updateStepResult({
        stepId: step.id,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: {
          code: 'REQUEST_FAILED',
          message: (error as Error).message,
          details: error,
        },
      }));
      throw error;
    }
  }

  private async executeConditionStep(step: ConditionStep): Promise<string | null> {
    const dispatch = store.dispatch;

    dispatch(executionActions.updateStepResult({
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));

    // Evaluate branches in order
    for (const branch of step.branches) {
      if (branch.isDefault) continue;
      if (branch.condition && this.conditionEvaluator.evaluate(branch.condition)) {
        dispatch(executionActions.updateStepResult({
          stepId: step.id,
          status: 'success',
          completedAt: new Date().toISOString(),
        }));
        dispatch(executionActions.addLog({
          level: 'info',
          stepId: step.id,
          message: `Branch taken: ${branch.label || branch.nextStepId}`,
        }));
        return branch.nextStepId;
      }
    }

    // Default branch
    const defaultBranch = step.branches.find(b => b.isDefault);
    if (defaultBranch) {
      dispatch(executionActions.updateStepResult({
        stepId: step.id,
        status: 'success',
        completedAt: new Date().toISOString(),
      }));
      return defaultBranch.nextStepId;
    }

    throw new Error(`No matching branch found for condition step: ${step.id}`);
  }

  private async executeLoopStep(step: LoopStep): Promise<string | null> {
    const dispatch = store.dispatch;
    const loop = step.loop;

    dispatch(executionActions.updateStepResult({
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));

    const iterations = this.loopHandler.getIterations(loop);
    
    dispatch(executionActions.pushLoopContext({
      loopId: loop.id,
      totalIterations: iterations.length,
    }));

    for (let i = 0; i < iterations.length; i++) {
      if (this.abortController.signal.aborted) {
        throw new ExecutionCancelledError();
      }

      const item = iterations[i];
      
      dispatch(executionActions.updateLoopContext({
        loopId: loop.id,
        currentIndex: i,
        currentItem: item,
      }));

      dispatch(executionActions.addLog({
        level: 'info',
        stepId: step.id,
        message: `Loop iteration ${i + 1}/${iterations.length}`,
        data: { item },
      }));

      // Execute nested steps
      for (const nestedStepId of step.stepIds) {
        await this.executeStep(nestedStepId);
      }

      // Check max iterations safety limit
      if (loop.maxIterations && i >= loop.maxIterations - 1) {
        dispatch(executionActions.addLog({
          level: 'warn',
          stepId: step.id,
          message: `Loop terminated: max iterations (${loop.maxIterations}) reached`,
        }));
        break;
      }
    }

    dispatch(executionActions.popLoopContext());
    dispatch(executionActions.updateStepResult({
      stepId: step.id,
      status: 'success',
      completedAt: new Date().toISOString(),
      iterations: iterations.length,
    }));

    return this.getNextStepId(step);
  }

  private async executeGroupStep(step: GroupStep): Promise<string | null> {
    for (const nestedStepId of step.stepIds) {
      await this.executeStep(nestedStepId);
    }
    return this.getNextStepId(step);
  }

  private getNextStepId(step: Step): string | null {
    const edge = this.scenario.edges.find(e => e.sourceStepId === step.id);
    return edge?.targetStepId || null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);
      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new ExecutionCancelledError());
      });
    });
  }

  private waitForManualTrigger(): Promise<void> {
    return new Promise((resolve) => {
      this.manualResolve = resolve;
    });
  }

  public triggerManualStep(): void {
    if (this.manualResolve) {
      this.manualResolve();
      this.manualResolve = null;
    }
  }

  public cancel(): void {
    this.abortController.abort();
  }
}

class ExecutionCancelledError extends Error {
  constructor() {
    super('Execution cancelled');
    this.name = 'ExecutionCancelledError';
  }
}
```

---

## 5. Variable Resolution

### 5.1 Variable Syntax

```
┌─────────────────────────────────────────────────────────────────┐
│                     Variable Reference Syntax                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ${params.fieldName}           - Input parameters                │
│  ${params.list[0].id}          - Array access in params          │
│  ${params.list.length}         - Array length                    │
│                                                                  │
│  ${response.stepId.field}      - Response from specific step     │
│  ${response.alias.data.id}     - Response using alias            │
│                                                                  │
│  ${loop.item}                  - Current loop item               │
│  ${loop.item.fieldName}        - Field in current loop item      │
│  ${loop.index}                 - Current loop index (0-based)    │
│  ${loop.count}                 - Total iteration count           │
│                                                                  │
│  ${system.timestamp}           - Current timestamp (ISO)         │
│  ${system.uuid}                - Generate UUID                   │
│  ${system.random}              - Random number (0-1)             │
│  ${system.env.VAR_NAME}        - Environment variable            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Variable Resolver Implementation

```typescript
// src/engine/variableResolver.ts

import { store } from '../store';
import { RequestStep } from '../types/scenario';
import { get as lodashGet } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export interface ResolvedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export class VariableResolver {
  private variablePattern = /\$\{([^}]+)\}/g;

  /**
   * Resolve all variables in a request step
   */
  resolveRequest(step: RequestStep): ResolvedRequest {
    const state = store.getState();
    const server = state.servers.entities[step.serverId];
    
    if (!server) {
      throw new Error(`Server not found: ${step.serverId}`);
    }

    // Resolve endpoint
    const endpoint = this.resolveString(step.endpoint);
    const url = `${server.baseUrl}${endpoint}`;

    // Merge and resolve headers (server headers + step headers)
    const headers: Record<string, string> = {};
    
    // Server headers first
    for (const header of server.headers) {
      if (header.enabled) {
        headers[header.key] = this.resolveString(header.value);
      }
    }
    
    // Step headers override server headers
    for (const header of step.headers) {
      if (header.enabled) {
        headers[header.key] = this.resolveString(header.value);
      }
    }

    // Resolve body
    const body = step.body ? this.resolveValue(step.body) : undefined;

    return {
      url,
      method: step.method,
      headers,
      body,
      timeout: step.timeout || server.timeout,
    };
  }

  /**
   * Resolve variables in a string
   */
  resolveString(input: string): string {
    return input.replace(this.variablePattern, (match, path) => {
      const value = this.resolvePath(path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Resolve variables in any value (recursively for objects/arrays)
   */
  resolveValue(input: unknown): unknown {
    if (typeof input === 'string') {
      // Check if entire string is a variable reference
      const fullMatch = input.match(/^\$\{([^}]+)\}$/);
      if (fullMatch) {
        // Return the actual value (preserving type)
        return this.resolvePath(fullMatch[1].trim());
      }
      // Otherwise resolve embedded variables as strings
      return this.resolveString(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.resolveValue(item));
    }

    if (input !== null && typeof input === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        resolved[key] = this.resolveValue(value);
      }
      return resolved;
    }

    return input;
  }

  /**
   * Resolve a variable path to its value
   */
  private resolvePath(path: string): unknown {
    const parts = path.split('.');
    const namespace = parts[0];
    const restPath = parts.slice(1).join('.');

    switch (namespace) {
      case 'params':
        return this.resolveParams(restPath);
      case 'response':
        return this.resolveResponse(restPath);
      case 'loop':
        return this.resolveLoop(restPath);
      case 'system':
        return this.resolveSystem(restPath);
      default:
        console.warn(`Unknown variable namespace: ${namespace}`);
        return undefined;
    }
  }

  private resolveParams(path: string): unknown {
    const context = store.getState().execution.context;
    if (!context) return undefined;
    return lodashGet(context.params, path);
  }

  private resolveResponse(path: string): unknown {
    const context = store.getState().execution.context;
    if (!context) return undefined;
    
    // Path format: stepId.field or alias.field
    const dotIndex = path.indexOf('.');
    if (dotIndex === -1) {
      return context.responses[path];
    }
    
    const key = path.substring(0, dotIndex);
    const fieldPath = path.substring(dotIndex + 1);
    const responseData = context.responses[key];
    
    return lodashGet(responseData, fieldPath);
  }

  private resolveLoop(path: string): unknown {
    const context = store.getState().execution.context;
    if (!context || context.loopContextStack.length === 0) return undefined;
    
    // Get innermost loop context
    const loopContext = context.loopContextStack[context.loopContextStack.length - 1];

    switch (path) {
      case 'index':
        return loopContext.currentIndex;
      case 'count':
        return loopContext.totalIterations;
      case 'item':
        return loopContext.currentItem;
      default:
        // Handle loop.item.fieldName
        if (path.startsWith('item.')) {
          return lodashGet(loopContext.currentItem, path.substring(5));
        }
        return undefined;
    }
  }

  private resolveSystem(path: string): unknown {
    switch (path) {
      case 'timestamp':
        return new Date().toISOString();
      case 'uuid':
        return uuidv4();
      case 'random':
        return Math.random();
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return new Date().toISOString().split('T')[1].split('.')[0];
      default:
        // Handle system.env.VAR_NAME
        if (path.startsWith('env.')) {
          const envVar = path.substring(4);
          return process.env[envVar];
        }
        return undefined;
    }
  }

  /**
   * Extract all variable references from a value
   */
  extractVariables(input: unknown): string[] {
    const variables: string[] = [];
    
    const extract = (value: unknown): void => {
      if (typeof value === 'string') {
        let match;
        while ((match = this.variablePattern.exec(value)) !== null) {
          variables.push(match[1].trim());
        }
        this.variablePattern.lastIndex = 0;  // Reset regex
      } else if (Array.isArray(value)) {
        value.forEach(extract);
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(extract);
      }
    };
    
    extract(input);
    return [...new Set(variables)];  // Remove duplicates
  }

  /**
   * Validate that all variables can be resolved
   */
  validateVariables(variables: string[], availableResponses: string[]): string[] {
    const errors: string[] = [];
    
    for (const variable of variables) {
      const parts = variable.split('.');
      const namespace = parts[0];
      
      switch (namespace) {
        case 'params':
          // Params are validated against schema separately
          break;
        case 'response':
          const stepRef = parts[1];
          if (!availableResponses.includes(stepRef)) {
            errors.push(`Variable "${variable}" references unknown response: ${stepRef}`);
          }
          break;
        case 'loop':
          // Loop variables are only valid within loop context
          break;
        case 'system':
          const systemPath = parts.slice(1).join('.');
          if (!['timestamp', 'uuid', 'random', 'date', 'time'].includes(systemPath) &&
              !systemPath.startsWith('env.')) {
            errors.push(`Unknown system variable: ${systemPath}`);
          }
          break;
        default:
          errors.push(`Unknown variable namespace: ${namespace}`);
      }
    }
    
    return errors;
  }
}
```

### 5.3 Condition Evaluator

```typescript
// src/engine/conditionEvaluator.ts

import { 
  Condition, 
  ConditionGroup, 
  ConditionExpression,
  ComparisonOperator 
} from '../types/condition';
import { VariableResolver } from './variableResolver';

export class ConditionEvaluator {
  constructor(private resolver: VariableResolver) {}

  /**
   * Evaluate a condition expression (single or group)
   */
  evaluate(expression: ConditionExpression): boolean {
    if (this.isConditionGroup(expression)) {
      return this.evaluateGroup(expression);
    }
    return this.evaluateSingle(expression);
  }

  private isConditionGroup(expr: ConditionExpression): expr is ConditionGroup {
    return 'operator' in expr && 'conditions' in expr;
  }

  private evaluateGroup(group: ConditionGroup): boolean {
    const results = group.conditions.map(c => this.evaluate(c));
    
    if (group.operator === 'AND') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }

  private evaluateSingle(condition: Condition): boolean {
    // Get the actual value based on source
    let actualValue: unknown;
    
    if (condition.source === 'params') {
      actualValue = this.resolver.resolveString(`\${params.${condition.field}}`);
      // Try to parse the resolved value back to its original type
      actualValue = this.parseValue(actualValue);
    } else {
      // Response-based condition
      actualValue = this.resolver.resolveString(
        `\${response.${condition.stepId}.${condition.field}}`
      );
      actualValue = this.parseValue(actualValue);
    }

    return this.compare(actualValue, condition.operator, condition.value);
  }

  private parseValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Try to parse as number
      const num = Number(value);
      if (!isNaN(num)) return num;
      
      // Try to parse as boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      
      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  private compare(actual: unknown, operator: ComparisonOperator, expected: unknown): boolean {
    switch (operator) {
      case '==':
        return actual === expected || String(actual) === String(expected);
      
      case '!=':
        return actual !== expected && String(actual) !== String(expected);
      
      case '>':
        return Number(actual) > Number(expected);
      
      case '>=':
        return Number(actual) >= Number(expected);
      
      case '<':
        return Number(actual) < Number(expected);
      
      case '<=':
        return Number(actual) <= Number(expected);
      
      case 'contains':
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return String(actual).includes(String(expected));
      
      case 'notContains':
        if (Array.isArray(actual)) {
          return !actual.includes(expected);
        }
        return !String(actual).includes(String(expected));
      
      case 'isEmpty':
        if (actual === null || actual === undefined) return true;
        if (typeof actual === 'string') return actual.length === 0;
        if (Array.isArray(actual)) return actual.length === 0;
        if (typeof actual === 'object') return Object.keys(actual).length === 0;
        return false;
      
      case 'isNotEmpty':
        return !this.compare(actual, 'isEmpty', expected);
      
      case 'exists':
        return actual !== null && actual !== undefined;
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }
}
```

### 5.4 Loop Handler

```typescript
// src/engine/loopHandler.ts

import { Loop, ForEachLoop, CountLoop, WhileLoop } from '../types/loop';
import { VariableResolver } from './variableResolver';
import { ConditionEvaluator } from './conditionEvaluator';

export class LoopHandler {
  private conditionEvaluator: ConditionEvaluator;

  constructor(private resolver: VariableResolver) {
    this.conditionEvaluator = new ConditionEvaluator(resolver);
  }

  /**
   * Get all items to iterate over (pre-computed for forEach and count)
   */
  getIterations(loop: Loop): unknown[] {
    switch (loop.type) {
      case 'forEach':
        return this.getForEachIterations(loop);
      case 'count':
        return this.getCountIterations(loop);
      case 'while':
        // While loops can't be pre-computed - return empty array
        // They're handled specially in the executor
        return [];
      default:
        return [];
    }
  }

  private getForEachIterations(loop: ForEachLoop): unknown[] {
    const source = this.resolver.resolveString(`\${${loop.source}}`);
    let items: unknown[];
    
    if (typeof source === 'string') {
      try {
        items = JSON.parse(source);
      } catch {
        console.warn(`Could not parse loop source as array: ${source}`);
        return [];
      }
    } else if (Array.isArray(source)) {
      items = source;
    } else {
      // If source is actually resolved from resolver
      const resolvedSource = this.resolver.resolveValue(`\${${loop.source}}`);
      if (Array.isArray(resolvedSource)) {
        items = resolvedSource;
      } else {
        return [];
      }
    }

    // If countField is specified, expand each item by its count
    if (loop.countField) {
      const expanded: unknown[] = [];
      for (const item of items) {
        const count = (item as Record<string, unknown>)[loop.countField];
        const repeatCount = typeof count === 'number' ? count : 1;
        for (let i = 0; i < repeatCount; i++) {
          expanded.push(item);
        }
      }
      return expanded;
    }

    return items;
  }

  private getCountIterations(loop: CountLoop): unknown[] {
    let count: number;
    
    if (typeof loop.count === 'number') {
      count = loop.count;
    } else {
      // Resolve variable reference
      const resolved = this.resolver.resolveString(`\${${loop.count}}`);
      count = Number(resolved) || 0;
    }

    // Apply safety limit
    if (loop.maxIterations && count > loop.maxIterations) {
      count = loop.maxIterations;
    }

    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Check if while loop should continue
   */
  shouldContinueWhile(loop: WhileLoop, iteration: number): boolean {
    // Safety check
    if (loop.maxIterations && iteration >= loop.maxIterations) {
      return false;
    }
    
    return this.conditionEvaluator.evaluate(loop.condition);
  }
}
```

---

## 6. Validation Strategy

### 6.1 Validation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Validation Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Schema    │  │  Reference  │  │   Runtime               │  │
│  │ Validation  │  │ Validation  │  │   Validation            │  │
│  │   (Zod)     │  │ (Variables) │  │   (Before Execute)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  Validates:        Validates:        Validates:                  │
│  - Data types      - Step refs       - Server connectivity       │
│  - Required fields - Response refs   - Parameter values          │
│  - Value ranges    - Loop sources    - Timeout settings          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Zod Schema Definitions

```typescript
// src/validation/schemas.ts

import { z } from 'zod';

// Server schema
export const serverHeaderSchema = z.object({
  key: z.string().min(1, 'Header key is required'),
  value: z.string(),
  enabled: z.boolean(),
});

export const serverSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Server name is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Server name must start with letter, alphanumeric and underscore only'),
  baseUrl: z.string().url('Invalid URL format'),
  headers: z.array(serverHeaderSchema),
  timeout: z.number().min(1000).max(600000),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Condition schema
export const comparisonOperatorSchema = z.enum([
  '==', '!=', '>', '>=', '<', '<=',
  'contains', 'notContains',
  'isEmpty', 'isNotEmpty', 'exists'
]);

export const baseConditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1, 'Field path is required'),
  operator: comparisonOperatorSchema,
  value: z.unknown().optional(),
});

export const paramConditionSchema = baseConditionSchema.extend({
  source: z.literal('params'),
});

export const responseConditionSchema = baseConditionSchema.extend({
  source: z.literal('response'),
  stepId: z.string().min(1, 'Step ID is required'),
});

export const conditionSchema: z.ZodType<Condition> = z.union([
  paramConditionSchema,
  responseConditionSchema,
]);

export const conditionGroupSchema: z.ZodType<ConditionGroup> = z.object({
  id: z.string(),
  operator: z.enum(['AND', 'OR']),
  conditions: z.array(z.lazy(() => conditionExpressionSchema)),
});

export const conditionExpressionSchema = z.union([
  conditionSchema,
  conditionGroupSchema,
]);

// Loop schema
export const forEachLoopSchema = z.object({
  id: z.string(),
  type: z.literal('forEach'),
  source: z.string().min(1),
  itemAlias: z.string().min(1),
  indexAlias: z.string().optional(),
  countField: z.string().optional(),
  maxIterations: z.number().min(1).max(10000).optional(),
});

export const countLoopSchema = z.object({
  id: z.string(),
  type: z.literal('count'),
  count: z.union([z.number().min(1), z.string()]),
  maxIterations: z.number().min(1).max(10000).optional(),
});

export const whileLoopSchema = z.object({
  id: z.string(),
  type: z.literal('while'),
  condition: conditionExpressionSchema,
  maxIterations: z.number().min(1).max(10000).default(100),
});

export const loopSchema = z.union([forEachLoopSchema, countLoopSchema, whileLoopSchema]);

// Branch schema
export const branchSchema = z.object({
  id: z.string(),
  condition: conditionExpressionSchema.optional(),
  isDefault: z.boolean().optional(),
  nextStepId: z.string().min(1),
  label: z.string().optional(),
}).refine(
  data => data.condition || data.isDefault,
  { message: 'Branch must have either a condition or be marked as default' }
);

// Step schema
export const stepHeaderSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  enabled: z.boolean(),
});

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const executionModeSchema = z.enum(['auto', 'manual', 'delayed', 'bypass']);

export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const retryConfigSchema = z.object({
  maxRetries: z.number().min(1).max(10),
  retryDelayMs: z.number().min(100).max(60000),
  retryOn: z.array(z.number().min(400).max(599)),
});

export const baseStepSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional(),
  executionMode: executionModeSchema,
  delayMs: z.number().min(0).optional(),
  condition: conditionExpressionSchema.optional(),
  position: positionSchema,
});

export const requestStepSchema = baseStepSchema.extend({
  type: z.literal('request'),
  serverId: z.string().min(1, 'Server is required'),
  method: httpMethodSchema,
  endpoint: z.string().min(1, 'Endpoint is required'),
  headers: z.array(stepHeaderSchema),
  body: z.unknown().optional(),
  queryParams: z.record(z.string()).optional(),
  waitForResponse: z.boolean(),
  saveResponse: z.boolean(),
  responseAlias: z.string().optional(),
  timeout: z.number().min(1000).max(600000).optional(),
  branches: z.array(branchSchema).optional(),
  retryConfig: retryConfigSchema.optional(),
});

export const conditionStepSchema = baseStepSchema.extend({
  type: z.literal('condition'),
  branches: z.array(branchSchema).min(2, 'At least 2 branches required'),
});

export const loopStepSchema = baseStepSchema.extend({
  type: z.literal('loop'),
  loop: loopSchema,
  stepIds: z.array(z.string()).min(1, 'At least 1 step required in loop'),
});

export const groupStepSchema = baseStepSchema.extend({
  type: z.literal('group'),
  stepIds: z.array(z.string()),
  collapsed: z.boolean().optional(),
});

export const stepSchema = z.union([
  requestStepSchema,
  conditionStepSchema,
  loopStepSchema,
  groupStepSchema,
]);

// Parameter schema
export const parameterTypeSchema = z.enum([
  'string', 'number', 'boolean', 'object', 'array', 'any'
]);

export const parameterValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
});

export const parameterSchemaSchema: z.ZodType<ParameterSchema> = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: parameterTypeSchema,
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
  itemSchema: z.lazy(() => parameterSchemaSchema.optional()),
  properties: z.array(z.lazy(() => parameterSchemaSchema)).optional(),
  validation: parameterValidationSchema.optional(),
});

// Scenario schema
export const scenarioEdgeSchema = z.object({
  id: z.string(),
  sourceStepId: z.string(),
  targetStepId: z.string(),
  sourceHandle: z.string().optional(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
});

export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Scenario name is required'),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (use semver)'),
  serverIds: z.array(z.string()),
  parameterSchema: z.array(parameterSchemaSchema),
  steps: z.array(stepSchema).min(1, 'At least 1 step required'),
  edges: z.array(scenarioEdgeSchema),
  startStepId: z.string(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),
});
```

### 6.3 Validation Service

```typescript
// src/validation/validationService.ts

import { z } from 'zod';
import { scenarioSchema, serverSchema } from './schemas';
import { Scenario, Step } from '../types/scenario';
import { Server } from '../types/server';
import { VariableResolver } from '../engine/variableResolver';

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class ValidationService {
  private resolver = new VariableResolver();

  /**
   * Validate a server configuration
   */
  validateServer(server: unknown): ValidationResult {
    const result = serverSchema.safeParse(server);
    return this.formatZodResult(result);
  }

  /**
   * Validate a scenario configuration
   */
  validateScenario(scenario: unknown, servers: Server[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Schema validation
    const schemaResult = scenarioSchema.safeParse(scenario);
    if (!schemaResult.success) {
      return this.formatZodResult(schemaResult);
    }

    const validScenario = schemaResult.data as Scenario;

    // Reference validation
    errors.push(...this.validateReferences(validScenario, servers));

    // Variable validation
    errors.push(...this.validateVariables(validScenario));

    // Flow validation
    errors.push(...this.validateFlow(validScenario));

    // Warnings
    warnings.push(...this.checkWarnings(validScenario));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate input parameters against schema
   */
  validateParameters(
    params: Record<string, unknown>,
    schema: ParameterSchema[]
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const validateParam = (
      value: unknown,
      paramSchema: ParameterSchema,
      path: string
    ): void => {
      // Required check
      if (paramSchema.required && (value === undefined || value === null)) {
        errors.push({
          path,
          message: `Required parameter "${paramSchema.name}" is missing`,
          code: 'REQUIRED',
        });
        return;
      }

      if (value === undefined || value === null) return;

      // Type check
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (paramSchema.type !== 'any' && actualType !== paramSchema.type) {
        errors.push({
          path,
          message: `Expected ${paramSchema.type}, got ${actualType}`,
          code: 'TYPE_MISMATCH',
        });
        return;
      }

      // Validation rules
      if (paramSchema.validation) {
        const v = paramSchema.validation;
        
        if (v.min !== undefined) {
          const numValue = typeof value === 'number' ? value : 
                          typeof value === 'string' ? value.length :
                          Array.isArray(value) ? value.length : 0;
          if (numValue < v.min) {
            errors.push({
              path,
              message: `Value must be at least ${v.min}`,
              code: 'MIN_VIOLATION',
            });
          }
        }

        if (v.max !== undefined) {
          const numValue = typeof value === 'number' ? value :
                          typeof value === 'string' ? value.length :
                          Array.isArray(value) ? value.length : Infinity;
          if (numValue > v.max) {
            errors.push({
              path,
              message: `Value must be at most ${v.max}`,
              code: 'MAX_VIOLATION',
            });
          }
        }

        if (v.pattern && typeof value === 'string') {
          const regex = new RegExp(v.pattern);
          if (!regex.test(value)) {
            errors.push({
              path,
              message: `Value does not match pattern: ${v.pattern}`,
              code: 'PATTERN_MISMATCH',
            });
          }
        }

        if (v.enum && !v.enum.includes(value)) {
          errors.push({
            path,
            message: `Value must be one of: ${v.enum.join(', ')}`,
            code: 'ENUM_VIOLATION',
          });
        }
      }

      // Nested validation for objects
      if (paramSchema.type === 'object' && paramSchema.properties) {
        for (const prop of paramSchema.properties) {
          validateParam(
            (value as Record<string, unknown>)[prop.name],
            prop,
            `${path}.${prop.name}`
          );
        }
      }

      // Array item validation
      if (paramSchema.type === 'array' && paramSchema.itemSchema && Array.isArray(value)) {
        value.forEach((item, index) => {
          validateParam(item, paramSchema.itemSchema!, `${path}[${index}]`);
        });
      }
    };

    for (const paramSchema of schema) {
      validateParam(params[paramSchema.name], paramSchema, paramSchema.name);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  private validateReferences(scenario: Scenario, servers: Server[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const serverIds = new Set(servers.map(s => s.id));
    const stepIds = new Set(scenario.steps.map(s => s.id));

    // Check server references
    for (const serverId of scenario.serverIds) {
      if (!serverIds.has(serverId)) {
        errors.push({
          path: `serverIds`,
          message: `Referenced server not found: ${serverId}`,
          code: 'INVALID_REFERENCE',
        });
      }
    }

    // Check step references
    for (const step of scenario.steps) {
      if (step.type === 'request' && !serverIds.has(step.serverId)) {
        errors.push({
          path: `steps.${step.id}.serverId`,
          message: `Step "${step.name}" references unknown server: ${step.serverId}`,
          code: 'INVALID_REFERENCE',
        });
      }

      if (step.type === 'loop') {
        for (const nestedId of step.stepIds) {
          if (!stepIds.has(nestedId)) {
            errors.push({
              path: `steps.${step.id}.stepIds`,
              message: `Loop step "${step.name}" references unknown step: ${nestedId}`,
              code: 'INVALID_REFERENCE',
            });
          }
        }
      }

      // Check branch references
      const branches = step.type === 'condition' ? step.branches :
                       step.type === 'request' ? step.branches : undefined;
      if (branches) {
        for (const branch of branches) {
          if (!stepIds.has(branch.nextStepId)) {
            errors.push({
              path: `steps.${step.id}.branches`,
              message: `Branch references unknown step: ${branch.nextStepId}`,
              code: 'INVALID_REFERENCE',
            });
          }
        }
      }
    }

    // Check start step
    if (!stepIds.has(scenario.startStepId)) {
      errors.push({
        path: 'startStepId',
        message: `Start step not found: ${scenario.startStepId}`,
        code: 'INVALID_REFERENCE',
      });
    }

    // Check edge references
    for (const edge of scenario.edges) {
      if (!stepIds.has(edge.sourceStepId)) {
        errors.push({
          path: `edges.${edge.id}`,
          message: `Edge source step not found: ${edge.sourceStepId}`,
          code: 'INVALID_REFERENCE',
        });
      }
      if (!stepIds.has(edge.targetStepId)) {
        errors.push({
          path: `edges.${edge.id}`,
          message: `Edge target step not found: ${edge.targetStepId}`,
          code: 'INVALID_REFERENCE',
        });
      }
    }

    return errors;
  }

  private validateVariables(scenario: Scenario): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Build list of available responses (steps with saveResponse=true)
    const availableResponses: string[] = [];
    for (const step of scenario.steps) {
      if (step.type === 'request' && step.saveResponse) {
        availableResponses.push(step.id);
        if (step.responseAlias) {
          availableResponses.push(step.responseAlias);
        }
      }
    }

    // Extract and validate variables from each step
    for (const step of scenario.steps) {
      if (step.type === 'request') {
        const variables = this.resolver.extractVariables({
          endpoint: step.endpoint,
          headers: step.headers,
          body: step.body,
        });

        const varErrors = this.resolver.validateVariables(variables, availableResponses);
        for (const err of varErrors) {
          errors.push({
            path: `steps.${step.id}`,
            message: err,
            code: 'INVALID_VARIABLE',
          });
        }
      }
    }

    return errors;
  }

  private validateFlow(scenario: Scenario): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for unreachable steps
    const reachable = new Set<string>();
    const visit = (stepId: string): void => {
      if (reachable.has(stepId)) return;
      reachable.add(stepId);

      const step = scenario.steps.find(s => s.id === stepId);
      if (!step) return;

      // Follow edges
      const edges = scenario.edges.filter(e => e.sourceStepId === stepId);
      for (const edge of edges) {
        visit(edge.targetStepId);
      }

      // Follow branches
      const branches = step.type === 'condition' ? step.branches :
                       step.type === 'request' ? step.branches : undefined;
      if (branches) {
        for (const branch of branches) {
          visit(branch.nextStepId);
        }
      }

      // Follow loop steps
      if (step.type === 'loop') {
        for (const nestedId of step.stepIds) {
          visit(nestedId);
        }
      }
    };

    visit(scenario.startStepId);

    for (const step of scenario.steps) {
      if (!reachable.has(step.id)) {
        errors.push({
          path: `steps.${step.id}`,
          message: `Step "${step.name}" is unreachable`,
          code: 'UNREACHABLE_STEP',
        });
      }
    }

    // Check for missing default branch in condition steps
    for (const step of scenario.steps) {
      if (step.type === 'condition') {
        const hasDefault = step.branches.some(b => b.isDefault);
        if (!hasDefault) {
          errors.push({
            path: `steps.${step.id}`,
            message: `Condition step "${step.name}" has no default branch`,
            code: 'MISSING_DEFAULT_BRANCH',
          });
        }
      }
    }

    return errors;
  }

  private checkWarnings(scenario: Scenario): string[] {
    const warnings: string[] = [];

    // Warn about while loops without maxIterations
    for (const step of scenario.steps) {
      if (step.type === 'loop' && step.loop.type === 'while') {
        if (!step.loop.maxIterations || step.loop.maxIterations > 1000) {
          warnings.push(
            `Loop "${step.name}" has high or unlimited max iterations - risk of infinite loop`
          );
        }
      }
    }

    // Warn about steps with no outgoing edges (dead ends)
    const stepsWithOutgoing = new Set(scenario.edges.map(e => e.sourceStepId));
    for (const step of scenario.steps) {
      if (!stepsWithOutgoing.has(step.id)) {
        const hasBranches = step.type === 'condition' ||
                           (step.type === 'request' && step.branches?.length);
        if (!hasBranches) {
          warnings.push(`Step "${step.name}" has no outgoing connections (potential end state)`);
        }
      }
    }

    return warnings;
  }

  private formatZodResult(result: z.SafeParseReturnType<unknown, unknown>): ValidationResult {
    if (result.success) {
      return { valid: true, errors: [], warnings: [] };
    }

    const errors: ValidationError[] = result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return { valid: false, errors, warnings: [] };
  }
}
```

---

## 7. Storage Strategy

### 7.1 Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────────────────────┐ │
│  │   LocalStorage     │  │         IndexedDB                  │ │
│  │                    │  │                                    │ │
│  │  - User prefs      │  │  - Scenarios (large data)          │ │
│  │  - UI state        │  │  - Execution history               │ │
│  │  - Small configs   │  │  - Templates library               │ │
│  │                    │  │  - Logs archive                    │ │
│  └────────────────────┘  └────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Import/Export (JSON/YAML)                    │   │
│  │                                                           │   │
│  │  - Scenario definitions                                   │   │
│  │  - Server configurations                                  │   │
│  │  - Templates                                              │   │
│  │  - Full workspace backup                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Storage Service Implementation

```typescript
// src/services/storageService.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Scenario } from '../types/scenario';
import { Server } from '../types/server';
import { ExecutionContext } from '../types/execution';
import { StepTemplate } from '../store/slices/templatesSlice';

interface ScenarioToolDB extends DBSchema {
  scenarios: {
    key: string;
    value: Scenario;
    indexes: {
      'by-name': string;
      'by-updated': string;
      'by-tags': string[];
    };
  };
  servers: {
    key: string;
    value: Server;
    indexes: {
      'by-name': string;
    };
  };
  executionHistory: {
    key: string;
    value: ExecutionContext;
    indexes: {
      'by-scenario': string;
      'by-date': string;
    };
  };
  templates: {
    key: string;
    value: StepTemplate;
    indexes: {
      'by-category': string;
    };
  };
}

const DB_NAME = 'scenario-tool-db';
const DB_VERSION = 1;

class StorageService {
  private db: IDBPDatabase<ScenarioToolDB> | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<ScenarioToolDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Scenarios store
        const scenarioStore = db.createObjectStore('scenarios', { keyPath: 'id' });
        scenarioStore.createIndex('by-name', 'name');
        scenarioStore.createIndex('by-updated', 'updatedAt');
        scenarioStore.createIndex('by-tags', 'tags', { multiEntry: true });

        // Servers store
        const serverStore = db.createObjectStore('servers', { keyPath: 'id' });
        serverStore.createIndex('by-name', 'name');

        // Execution history store
        const historyStore = db.createObjectStore('executionHistory', { keyPath: 'id' });
        historyStore.createIndex('by-scenario', 'scenarioId');
        historyStore.createIndex('by-date', 'startedAt');

        // Templates store
        const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
        templateStore.createIndex('by-category', 'category');
      },
    });
  }

  private getDb(): IDBPDatabase<ScenarioToolDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Scenarios
  async saveScenario(scenario: Scenario): Promise<void> {
    await this.getDb().put('scenarios', scenario);
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.getDb().get('scenarios', id);
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return this.getDb().getAll('scenarios');
  }

  async deleteScenario(id: string): Promise<void> {
    await this.getDb().delete('scenarios', id);
  }

  async searchScenarios(query: string): Promise<Scenario[]> {
    const all = await this.getAllScenarios();
    const lowerQuery = query.toLowerCase();
    return all.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description?.toLowerCase().includes(lowerQuery) ||
      s.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  // Servers
  async saveServer(server: Server): Promise<void> {
    await this.getDb().put('servers', server);
  }

  async getServer(id: string): Promise<Server | undefined> {
    return this.getDb().get('servers', id);
  }

  async getAllServers(): Promise<Server[]> {
    return this.getDb().getAll('servers');
  }

  async deleteServer(id: string): Promise<void> {
    await this.getDb().delete('servers', id);
  }

  // Execution History
  async saveExecution(execution: ExecutionContext): Promise<void> {
    await this.getDb().put('executionHistory', execution);
    // Cleanup old entries (keep last 100)
    await this.cleanupOldExecutions(100);
  }

  async getExecutionHistory(scenarioId?: string, limit = 50): Promise<ExecutionContext[]> {
    const db = this.getDb();
    if (scenarioId) {
      return db.getAllFromIndex('executionHistory', 'by-scenario', scenarioId);
    }
    const all = await db.getAllFromIndex('executionHistory', 'by-date');
    return all.slice(-limit).reverse();
  }

  private async cleanupOldExecutions(keep: number): Promise<void> {
    const db = this.getDb();
    const all = await db.getAllFromIndex('executionHistory', 'by-date');
    if (all.length > keep) {
      const toDelete = all.slice(0, all.length - keep);
      const tx = db.transaction('executionHistory', 'readwrite');
      for (const exec of toDelete) {
        tx.store.delete(exec.id);
      }
      await tx.done;
    }
  }

  // Templates
  async saveTemplate(template: StepTemplate): Promise<void> {
    await this.getDb().put('templates', template);
  }

  async getAllTemplates(): Promise<StepTemplate[]> {
    return this.getDb().getAll('templates');
  }

  async getTemplatesByCategory(category: string): Promise<StepTemplate[]> {
    return this.getDb().getAllFromIndex('templates', 'by-category', category);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.getDb().delete('templates', id);
  }

  // Import/Export
  async exportAll(): Promise<ExportData> {
    const [scenarios, servers, templates] = await Promise.all([
      this.getAllScenarios(),
      this.getAllServers(),
      this.getAllTemplates(),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenarios,
      servers,
      templates,
    };
  }

  async importAll(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      scenarios: { imported: 0, skipped: 0, errors: [] },
      servers: { imported: 0, skipped: 0, errors: [] },
      templates: { imported: 0, skipped: 0, errors: [] },
    };

    // Import servers first (scenarios reference them)
    for (const server of data.servers || []) {
      try {
        await this.saveServer(server);
        result.servers.imported++;
      } catch (error) {
        result.servers.errors.push(`Failed to import server ${server.name}: ${error}`);
      }
    }

    // Import scenarios
    for (const scenario of data.scenarios || []) {
      try {
        await this.saveScenario(scenario);
        result.scenarios.imported++;
      } catch (error) {
        result.scenarios.errors.push(`Failed to import scenario ${scenario.name}: ${error}`);
      }
    }

    // Import templates
    for (const template of data.templates || []) {
      try {
        await this.saveTemplate(template);
        result.templates.imported++;
      } catch (error) {
        result.templates.errors.push(`Failed to import template ${template.name}: ${error}`);
      }
    }

    return result;
  }

  async exportScenario(scenarioId: string): Promise<ScenarioExport | null> {
    const scenario = await this.getScenario(scenarioId);
    if (!scenario) return null;

    const servers = await this.getAllServers();
    const usedServers = servers.filter(s => scenario.serverIds.includes(s.id));

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario,
      servers: usedServers,
    };
  }

  async importScenario(data: ScenarioExport): Promise<void> {
    // Import servers first
    for (const server of data.servers) {
      await this.saveServer(server);
    }
    // Import scenario
    await this.saveScenario(data.scenario);
  }
}

export interface ExportData {
  version: string;
  exportedAt: string;
  scenarios: Scenario[];
  servers: Server[];
  templates: StepTemplate[];
}

export interface ScenarioExport {
  version: string;
  exportedAt: string;
  scenario: Scenario;
  servers: Server[];
}

export interface ImportResult {
  scenarios: { imported: number; skipped: number; errors: string[] };
  servers: { imported: number; skipped: number; errors: string[] };
  templates: { imported: number; skipped: number; errors: string[] };
}

export const storageService = new StorageService();
```

### 7.3 YAML/JSON Serialization

```typescript
// src/services/serializationService.ts

import * as yaml from 'js-yaml';
import { Scenario } from '../types/scenario';
import { Server } from '../types/server';

export type SerializationFormat = 'json' | 'yaml';

export class SerializationService {
  /**
   * Serialize data to string
   */
  serialize(data: unknown, format: SerializationFormat): string {
    if (format === 'yaml') {
      return yaml.dump(data, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Parse string to data
   */
  parse<T>(content: string, format: SerializationFormat): T {
    if (format === 'yaml') {
      return yaml.load(content) as T;
    }
    return JSON.parse(content) as T;
  }

  /**
   * Detect format from content
   */
  detectFormat(content: string): SerializationFormat {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    return 'yaml';
  }

  /**
   * Convert between formats
   */
  convert(content: string, toFormat: SerializationFormat): string {
    const fromFormat = this.detectFormat(content);
    if (fromFormat === toFormat) {
      return content;
    }
    const data = this.parse(content, fromFormat);
    return this.serialize(data, toFormat);
  }

  /**
   * Download as file
   */
  downloadAsFile(data: unknown, filename: string, format: SerializationFormat): void {
    const content = this.serialize(data, format);
    const ext = format === 'yaml' ? 'yaml' : 'json';
    const mimeType = format === 'yaml' ? 'text/yaml' : 'application/json';
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Read from file
   */
  async readFromFile(file: File): Promise<{ data: unknown; format: SerializationFormat }> {
    const content = await file.text();
    const format = this.detectFormat(content);
    const data = this.parse(content, format);
    return { data, format };
  }
}

export const serializationService = new SerializationService();
```

---

## 8. Component Hierarchy

### 8.1 Component Tree Overview

```
App
├── ThemeProvider (MUI)
├── Provider (Redux)
│
├── AppLayout
│   ├── AppBar
│   │   ├── Logo
│   │   ├── ModeSwitch (Config/Execute)
│   │   ├── ScenarioSelector
│   │   └── SettingsMenu
│   │
│   ├── Sidebar (Collapsible)
│   │   ├── ServerList
│   │   ├── ParameterSchemaEditor
│   │   └── StepList
│   │
│   └── MainContent
│       │
│       ├── [Config Mode]
│       │   ├── EditorTabs (Visual/JSON/YAML)
│       │   ├── FlowCanvas (React Flow)
│       │   │   ├── StartNode
│       │   │   ├── RequestStepNode
│       │   │   ├── ConditionNode
│       │   │   ├── LoopNode
│       │   │   └── GroupNode
│       │   └── StepDetailPanel
│       │       ├── BasicSettings
│       │       ├── HeadersEditor
│       │       ├── BodyEditor
│       │       ├── ConditionBuilder
│       │       ├── BranchEditor
│       │       └── LoopConfig
│       │
│       └── [Execute Mode]
│           ├── ParameterInputPanel
│           │   ├── FormView
│           │   └── JsonView
│           ├── ExecutionControls
│           ├── SequenceDiagram
│           │   └── ProgressIndicator
│           └── LogPanel
│               ├── LogFilters
│               ├── LogList
│               └── RequestResponseDetail
│
├── Dialogs
│   ├── ServerEditDialog
│   ├── StepEditDialog
│   ├── ConditionBuilderDialog
│   ├── LoopConfigDialog
│   ├── ImportExportDialog
│   └── ConfirmationDialog
│
└── NotificationSnackbar
```

### 8.2 Key Component Specifications

#### 8.2.1 Flow Canvas Components

```typescript
// src/components/flow/FlowCanvas.tsx

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { scenariosActions } from '../../store/slices/scenariosSlice';
import { uiActions } from '../../store/slices/uiSlice';

import StartNode from './nodes/StartNode';
import RequestStepNode from './nodes/RequestStepNode';
import ConditionNode from './nodes/ConditionNode';
import LoopNode from './nodes/LoopNode';
import GroupNode from './nodes/GroupNode';

const nodeTypes: NodeTypes = {
  start: StartNode,
  request: RequestStepNode,
  condition: ConditionNode,
  loop: LoopNode,
  group: GroupNode,
};

export const FlowCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const scenario = useAppSelector(state => {
    const id = state.scenarios.activeScenarioId;
    return id ? state.scenarios.entities[id] : null;
  });
  const selectedStepId = useAppSelector(state => state.ui.selectedStepId);

  // Convert scenario steps to React Flow nodes
  const nodes = useMemo(() => {
    if (!scenario) return [];
    
    return scenario.steps.map(step => ({
      id: step.id,
      type: step.type,
      position: step.position,
      data: {
        step,
        selected: step.id === selectedStepId,
      },
      selected: step.id === selectedStepId,
    }));
  }, [scenario, selectedStepId]);

  // Convert scenario edges to React Flow edges
  const edges = useMemo(() => {
    if (!scenario) return [];
    
    return scenario.edges.map(edge => ({
      id: edge.id,
      source: edge.sourceStepId,
      target: edge.targetStepId,
      sourceHandle: edge.sourceHandle,
      label: edge.label,
      animated: edge.animated,
      style: { stroke: '#888' },
    }));
  }, [scenario]);

  const onNodesChange = useCallback((changes) => {
    // Handle node position changes
    for (const change of changes) {
      if (change.type === 'position' && change.position && scenario) {
        dispatch(scenariosActions.updateStep({
          scenarioId: scenario.id,
          stepId: change.id,
          changes: { position: change.position },
        }));
      }
    }
  }, [dispatch, scenario]);

  const onConnect = useCallback((connection: Connection) => {
    if (scenario && connection.source && connection.target) {
      dispatch(scenariosActions.addEdge({
        scenarioId: scenario.id,
        edge: {
          id: `edge_${Date.now()}`,
          sourceStepId: connection.source,
          targetStepId: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
        },
      }));
    }
  }, [dispatch, scenario]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    dispatch(uiActions.selectStep(node.id));
  }, [dispatch]);

  const onPaneClick = useCallback(() => {
    dispatch(uiActions.selectStep(null));
  }, [dispatch]);

  if (!scenario) {
    return <EmptyState message="Select or create a scenario" />;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
};
```

#### 8.2.2 Step Node Component Example

```typescript
// src/components/flow/nodes/RequestStepNode.tsx

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Paper, Typography, Chip, IconButton } from '@mui/material';
import {
  Http as HttpIcon,
  PlayArrow as AutoIcon,
  PanTool as ManualIcon,
  Timer as DelayedIcon,
  Block as BypassIcon,
} from '@mui/icons-material';
import { RequestStep } from '../../../types/scenario';

interface RequestStepNodeData {
  step: RequestStep;
  selected: boolean;
}

const executionModeIcons = {
  auto: <AutoIcon fontSize="small" />,
  manual: <ManualIcon fontSize="small" />,
  delayed: <DelayedIcon fontSize="small" />,
  bypass: <BypassIcon fontSize="small" />,
};

const methodColors: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
};

const RequestStepNode: React.FC<NodeProps<RequestStepNodeData>> = ({ data }) => {
  const { step, selected } = data;

  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        p: 1.5,
        minWidth: 200,
        border: selected ? '2px solid #1976d2' : '1px solid #ddd',
        borderRadius: 2,
      }}
    >
      {/* Input handle */}
      <Handle type="target" position={Position.Top} />

      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <HttpIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight="bold" noWrap flex={1}>
          {step.name}
        </Typography>
        {executionModeIcons[step.executionMode]}
      </Box>

      {/* Method + Endpoint */}
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Chip
          label={step.method}
          size="small"
          sx={{
            bgcolor: methodColors[step.method],
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.7rem',
          }}
        />
        <Typography variant="caption" color="text.secondary" noWrap>
          {step.endpoint}
        </Typography>
      </Box>

      {/* Condition indicator */}
      {step.condition && (
        <Chip
          label="Has Condition"
          size="small"
          variant="outlined"
          color="warning"
          sx={{ mb: 1 }}
        />
      )}

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} id="default" />

      {/* Branch handles */}
      {step.branches && step.branches.length > 0 && (
        <>
          {step.branches.map((branch, index) => (
            <Handle
              key={branch.id}
              type="source"
              position={Position.Right}
              id={branch.id}
              style={{ top: `${30 + index * 20}%` }}
            />
          ))}
        </>
      )}
    </Paper>
  );
};

export default memo(RequestStepNode);
```

#### 8.2.3 Condition Builder Component

```typescript
// src/components/editors/ConditionBuilder.tsx

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Condition,
  ConditionGroup,
  ConditionExpression,
  ComparisonOperator,
  LogicalOperator,
} from '../../types/condition';
import { useAppSelector } from '../../store/hooks';

interface ConditionBuilderProps {
  value: ConditionExpression | undefined;
  onChange: (value: ConditionExpression | undefined) => void;
  availableSteps: Array<{ id: string; name: string }>;
}

const operators: { value: ComparisonOperator; label: string }[] = [
  { value: '==', label: 'Equals (==)' },
  { value: '!=', label: 'Not Equals (!=)' },
  { value: '>', label: 'Greater Than (>)' },
  { value: '>=', label: 'Greater or Equal (>=)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '<=', label: 'Less or Equal (<=)' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
  { value: 'exists', label: 'Exists' },
];

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  value,
  onChange,
  availableSteps,
}) => {
  const parameterSchema = useAppSelector(state => {
    const scenarioId = state.scenarios.activeScenarioId;
    if (!scenarioId) return [];
    return state.scenarios.entities[scenarioId]?.parameterSchema || [];
  });

  const createEmptyCondition = (): Condition => ({
    id: `cond_${Date.now()}`,
    source: 'params',
    field: '',
    operator: '==',
    value: '',
  });

  const createEmptyGroup = (): ConditionGroup => ({
    id: `group_${Date.now()}`,
    operator: 'AND',
    conditions: [createEmptyCondition()],
  });

  const isGroup = (expr: ConditionExpression): expr is ConditionGroup => {
    return 'conditions' in expr;
  };

  const handleAddCondition = () => {
    if (!value) {
      onChange(createEmptyCondition());
    } else if (isGroup(value)) {
      onChange({
        ...value,
        conditions: [...value.conditions, createEmptyCondition()],
      });
    } else {
      // Convert single condition to group
      onChange({
        id: `group_${Date.now()}`,
        operator: 'AND',
        conditions: [value, createEmptyCondition()],
      });
    }
  };

  const handleRemoveCondition = (index: number) => {
    if (!value || !isGroup(value)) {
      onChange(undefined);
      return;
    }
    
    const newConditions = value.conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0) {
      onChange(undefined);
    } else if (newConditions.length === 1) {
      onChange(newConditions[0]);
    } else {
      onChange({ ...value, conditions: newConditions });
    }
  };

  const handleUpdateCondition = (index: number, updates: Partial<Condition>) => {
    if (!value) return;
    
    if (isGroup(value)) {
      const newConditions = [...value.conditions];
      newConditions[index] = { ...newConditions[index], ...updates } as Condition;
      onChange({ ...value, conditions: newConditions });
    } else {
      onChange({ ...value, ...updates } as Condition);
    }
  };

  const handleGroupOperatorChange = (operator: LogicalOperator) => {
    if (value && isGroup(value)) {
      onChange({ ...value, operator });
    }
  };

  const renderConditionRow = (condition: Condition, index: number) => (
    <Paper key={condition.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
        {/* Source selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={condition.source}
            label="Source"
            onChange={(e) => handleUpdateCondition(index, { 
              source: e.target.value as 'params' | 'response',
              field: '',
            })}
          >
            <MenuItem value="params">Parameters</MenuItem>
            <MenuItem value="response">Response</MenuItem>
          </Select>
        </FormControl>

        {/* Step selector (for response source) */}
        {condition.source === 'response' && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Step</InputLabel>
            <Select
              value={(condition as any).stepId || ''}
              label="Step"
              onChange={(e) => handleUpdateCondition(index, { stepId: e.target.value })}
            >
              {availableSteps.map(step => (
                <MenuItem key={step.id} value={step.id}>{step.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Field path */}
        <TextField
          size="small"
          label="Field Path"
          value={condition.field}
          onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
          placeholder="e.g., data.status"
          sx={{ minWidth: 150, flex: 1 }}
        />

        {/* Operator */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Operator</InputLabel>
          <Select
            value={condition.operator}
            label="Operator"
            onChange={(e) => handleUpdateCondition(index, { 
              operator: e.target.value as ComparisonOperator 
            })}
          >
            {operators.map(op => (
              <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Value (not needed for isEmpty, isNotEmpty, exists) */}
        {!['isEmpty', 'isNotEmpty', 'exists'].includes(condition.operator) && (
          <TextField
            size="small"
            label="Value"
            value={condition.value ?? ''}
            onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
            sx={{ minWidth: 120 }}
          />
        )}

        {/* Delete button */}
        <IconButton 
          size="small" 
          color="error"
          onClick={() => handleRemoveCondition(index)}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Conditions
      </Typography>

      {value && isGroup(value) && value.conditions.length > 1 && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="body2">Match:</Typography>
          <Select
            size="small"
            value={value.operator}
            onChange={(e) => handleGroupOperatorChange(e.target.value as LogicalOperator)}
          >
            <MenuItem value="AND">All conditions (AND)</MenuItem>
            <MenuItem value="OR">Any condition (OR)</MenuItem>
          </Select>
        </Box>
      )}

      {/* Render conditions */}
      {!value && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          No conditions defined. This step will always execute.
        </Typography>
      )}
      
      {value && !isGroup(value) && renderConditionRow(value, 0)}
      
      {value && isGroup(value) && value.conditions.map((cond, index) => (
        <React.Fragment key={cond.id}>
          {renderConditionRow(cond as Condition, index)}
          {index < value.conditions.length - 1 && (
            <Box textAlign="center" my={1}>
              <Chip 
                label={value.operator} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          )}
        </React.Fragment>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddCondition}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Condition
      </Button>
    </Box>
  );
};
```

#### 8.2.4 Execution Panel Component

```typescript
// src/components/execution/ExecutionPanel.tsx

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { executionActions } from '../../store/slices/executionSlice';
import { ScenarioExecutor } from '../../engine/executor';

export const ExecutionPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const executorRef = useRef<ScenarioExecutor | null>(null);
  
  const context = useAppSelector(state => state.execution.context);
  const scenario = useAppSelector(state => {
    const id = state.scenarios.activeScenarioId;
    return id ? state.scenarios.entities[id] : null;
  });
  const autoScroll = useAppSelector(state => state.execution.autoScroll);
  const expandedSteps = useAppSelector(state => state.execution.expandedSteps);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [context?.logs.length, autoScroll]);

  const handleStart = useCallback(async (params: Record<string, unknown>) => {
    if (!scenario) return;
    
    executorRef.current = new ScenarioExecutor(scenario);
    try {
      await executorRef.current.execute(params);
    } catch (error) {
      console.error('Execution error:', error);
    }
  }, [scenario]);

  const handlePause = useCallback(() => {
    dispatch(executionActions.pauseExecution());
  }, [dispatch]);

  const handleResume = useCallback(() => {
    if (executorRef.current) {
      executorRef.current.triggerManualStep();
    }
    dispatch(executionActions.resumeExecution());
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    if (executorRef.current) {
      executorRef.current.cancel();
    }
    dispatch(executionActions.cancelExecution());
  }, [dispatch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
      case 'waiting':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
      case 'waiting':
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!scenario) {
    return <Typography>No scenario selected</Typography>;
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Control Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" flex={1}>
            Execution: {scenario.name}
          </Typography>
          
          {context?.status && (
            <Chip 
              label={context.status.toUpperCase()} 
              color={getStatusColor(context.status)}
              size="small"
            />
          )}

          {(!context || context.status === 'completed' || context.status === 'failed') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayIcon />}
              onClick={() => handleStart({})}  // TODO: Get params from input panel
            >
              Start
            </Button>
          )}

          {context?.status === 'running' && (
            <>
              <Button
                variant="outlined"
                startIcon={<PauseIcon />}
                onClick={handlePause}
              >
                Pause
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </>
          )}

          {context?.status === 'paused' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayIcon />}
                onClick={handleResume}
              >
                Resume / Execute Step
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>

        {/* Progress */}
        {context?.status === 'running' && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </Paper>

      {/* Step Results */}
      <Paper sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Step Results
        </Typography>
        
        <List dense>
          {scenario.steps.map(step => {
            const result = context?.stepResults[step.id];
            const isExpanded = expandedSteps.includes(step.id);
            
            return (
              <React.Fragment key={step.id}>
                <ListItem
                  button
                  onClick={() => dispatch(executionActions.toggleStepExpanded(step.id))}
                  sx={{
                    bgcolor: context?.currentStepId === step.id ? 'action.selected' : undefined,
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(result?.status || 'pending')}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.name}
                    secondary={result?.response?.duration ? `${result.response.duration}ms` : undefined}
                  />
                  {result && (
                    <>
                      {result.response && (
                        <Chip 
                          label={result.response.status} 
                          size="small"
                          color={result.response.status < 400 ? 'success' : 'error'}
                          sx={{ mr: 1 }}
                        />
                      )}
                      <IconButton size="small">
                        {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </>
                  )}
                </ListItem>

                {/* Expanded details */}
                <Collapse in={isExpanded}>
                  {result && (
                    <Box sx={{ pl: 6, pr: 2, pb: 2 }}>
                      {/* Request */}
                      {result.request && (
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary">
                            Request
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 1, mt: 0.5 }}>
                            <Typography variant="body2" fontFamily="monospace">
                              {result.request.method} {result.request.url}
                            </Typography>
                            {result.request.body && (
                              <Box 
                                component="pre" 
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  overflow: 'auto',
                                  maxHeight: 200,
                                  m: 0,
                                  mt: 1,
                                }}
                              >
                                {JSON.stringify(result.request.body, null, 2)}
                              </Box>
                            )}
                          </Paper>
                        </Box>
                      )}

                      {/* Response */}
                      {result.response && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Response ({result.response.duration}ms)
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 1, mt: 0.5 }}>
                            <Box 
                              component="pre" 
                              sx={{ 
                                fontSize: '0.75rem', 
                                overflow: 'auto',
                                maxHeight: 300,
                                m: 0,
                              }}
                            >
                              {JSON.stringify(result.response.data, null, 2)}
                            </Box>
                          </Paper>
                        </Box>
                      )}

                      {/* Error */}
                      {result.error && (
                        <Box>
                          <Typography variant="caption" color="error">
                            Error
                          </Typography>
                          <Paper 
                            variant="outlined" 
                            sx={{ p: 1, mt: 0.5, borderColor: 'error.main' }}
                          >
                            <Typography variant="body2" color="error">
                              {result.error.message}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  )}
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
        <div ref={logEndRef} />
      </Paper>
    </Box>
  );
};
```

---

## 9. Key Challenges and Solutions

### 9.1 Challenge: Complex Variable Resolution

**Problem:** Variables can reference nested paths in parameters, responses, and loop contexts. The resolution must handle type preservation and error cases gracefully.

**Solution:**
```typescript
// Resolution Strategy

1. Parse variable syntax: ${namespace.path}
2. Route to appropriate resolver based on namespace
3. Use lodash.get for safe nested access
4. Preserve types for full-match variables (${params.list} returns array)
5. Convert to string for embedded variables ("id: ${params.id}")
6. Return undefined/original for unresolved (don't fail silently in validation)
```

**Implementation highlights:**
- Use regex with non-greedy matching: `/\$\{([^}]+)\}/g`
- Differentiate full-match vs embedded: `/^\$\{([^}]+)\}$/`
- Stack-based loop context for nested loops
- Cache resolved values during single execution

### 9.2 Challenge: Circular Reference Detection

**Problem:** Steps can reference each other through branches and edges, potentially creating infinite loops.

**Solution:**
```typescript
// Detect cycles during validation

function detectCycles(scenario: Scenario): string[] {
  const errors: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(stepId: string, path: string[]): void {
    if (recursionStack.has(stepId)) {
      const cycleStart = path.indexOf(stepId);
      const cycle = path.slice(cycleStart).concat(stepId);
      errors.push(`Circular reference detected: ${cycle.join(' -> ')}`);
      return;
    }

    if (visited.has(stepId)) return;
    
    visited.add(stepId);
    recursionStack.add(stepId);
    
    // Follow all outgoing connections
    const step = scenario.steps.find(s => s.id === stepId);
    if (step) {
      const nextSteps = getNextStepIds(step, scenario.edges);
      for (const nextId of nextSteps) {
        dfs(nextId, [...path, stepId]);
      }
    }
    
    recursionStack.delete(stepId);
  }

  dfs(scenario.startStepId, []);
  return errors;
}
```

### 9.3 Challenge: Long-Polling and Timeout Handling

**Problem:** Some requests need to wait for extended periods (long-polling), while others should timeout quickly.

**Solution:**
```typescript
// HTTP Client with flexible timeout

class HttpClient {
  async request(
    config: ResolvedRequest,
    signal: AbortSignal
  ): Promise<HttpResponse> {
    const controller = new AbortController();
    
    // Combine external abort signal with timeout
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    });

    try {
      const response = await axios({
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.body,
        signal: controller.signal,
        validateStatus: () => true,  // Don't throw on any status
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

### 9.4 Challenge: UI State Synchronization

**Problem:** The visual flow editor, JSON/YAML editor, and form editors must stay synchronized.

**Solution:**
```
┌─────────────────────────────────────────────────────────────────┐
│               Single Source of Truth (Redux)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Redux Store │◄──── All mutations go through actions         │
│  │  (Scenarios) │                                               │
│  └───────┬──────┘                                               │
│          │                                                       │
│    ┌─────┴─────┬─────────────┬─────────────┐                    │
│    ▼           ▼             ▼             ▼                    │
│  ┌─────┐   ┌─────┐       ┌─────┐       ┌─────┐                  │
│  │Flow │   │JSON │       │YAML │       │Form │                  │
│  │View │   │Edit │       │Edit │       │Edit │                  │
│  └──┬──┘   └──┬──┘       └──┬──┘       └──┬──┘                  │
│     │         │             │             │                      │
│     └─────────┴──────┬──────┴─────────────┘                     │
│                      ▼                                           │
│            Dispatch actions on change                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key implementation points:**
- Debounce JSON/YAML editor changes (300-500ms)
- Validate before applying text editor changes
- Show validation errors inline without blocking
- Use optimistic updates with rollback on validation failure

### 9.5 Challenge: CORS and Browser Security

**Problem:** Browser-based application making requests to arbitrary servers faces CORS restrictions.

**Solutions:**
```
Option 1: Proxy Server (Recommended for production)
─────────────────────────────────────────────────
React App ──► Proxy Server ──► Target Servers
             (Same origin)     (No CORS)

Option 2: Browser Extension
───────────────────────────
Use extension to bypass CORS (development only)

Option 3: Server Configuration
──────────────────────────────
Configure target servers to allow CORS (if you control them)
```

**Proxy implementation (for Option 1):**
```typescript
// Simple Express proxy (development)
// server/proxy.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/proxy/:target(*)', (req, res, next) => {
  const targetUrl = decodeURIComponent(req.params.target);
  
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { [`^/proxy/${encodeURIComponent(targetUrl)}`]: '' },
    onProxyReq: (proxyReq, req) => {
      // Forward original headers
    },
  })(req, res, next);
});

app.listen(3001);
```

### 9.6 Challenge: Performance with Large Scenarios

**Problem:** Scenarios with many steps and complex flows can cause performance issues.

**Solutions:**

```typescript
// 1. Virtualized rendering for step lists
import { FixedSizeList } from 'react-window';

const StepList = ({ steps }) => (
  <FixedSizeList
    height={600}
    itemCount={steps.length}
    itemSize={60}
  >
    {({ index, style }) => (
      <StepListItem step={steps[index]} style={style} />
    )}
  </FixedSizeList>
);

// 2. Memoization for expensive computations
const MemoizedFlowCanvas = React.memo(FlowCanvas, (prev, next) => {
  return prev.scenarioId === next.scenarioId &&
         prev.selectedStepId === next.selectedStepId;
});

// 3. Lazy loading for execution history
const ExecutionHistory = React.lazy(() => 
  import('./ExecutionHistory')
);

// 4. Web Worker for validation (large scenarios)
// validation.worker.ts
self.onmessage = (event) => {
  const { scenario, servers } = event.data;
  const result = validateScenario(scenario, servers);
  self.postMessage(result);
};
```

---

## 10. Project Structure

```
src/
├── components/
│   ├── common/              # Shared UI components
│   │   ├── ConfirmDialog.tsx
│   │   ├── JsonEditor.tsx
│   │   ├── YamlEditor.tsx
│   │   └── LoadingOverlay.tsx
│   │
│   ├── flow/                # React Flow components
│   │   ├── FlowCanvas.tsx
│   │   ├── nodes/
│   │   │   ├── StartNode.tsx
│   │   │   ├── RequestStepNode.tsx
│   │   │   ├── ConditionNode.tsx
│   │   │   ├── LoopNode.tsx
│   │   │   └── GroupNode.tsx
│   │   └── edges/
│   │       └── CustomEdge.tsx
│   │
│   ├── editors/             # Form editors
│   │   ├── ServerEditor.tsx
│   │   ├── StepEditor.tsx
│   │   ├── ConditionBuilder.tsx
│   │   ├── LoopConfig.tsx
│   │   ├── BranchEditor.tsx
│   │   ├── HeadersEditor.tsx
│   │   ├── BodyEditor.tsx
│   │   └── ParameterSchemaEditor.tsx
│   │
│   ├── execution/           # Execution mode components
│   │   ├── ExecutionPanel.tsx
│   │   ├── ParameterInput.tsx
│   │   ├── SequenceDiagram.tsx
│   │   ├── LogViewer.tsx
│   │   └── ResultDetail.tsx
│   │
│   ├── layout/              # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── AppBar.tsx
│   │   └── MainContent.tsx
│   │
│   └── dialogs/             # Modal dialogs
│       ├── ImportExportDialog.tsx
│       └── TemplateDialog.tsx
│
├── engine/                  # Execution engine
│   ├── executor.ts
│   ├── variableResolver.ts
│   ├── conditionEvaluator.ts
│   ├── loopHandler.ts
│   └── httpClient.ts
│
├── services/                # External services
│   ├── storageService.ts
│   └── serializationService.ts
│
├── store/                   # Redux store
│   ├── index.ts
│   ├── hooks.ts
│   └── slices/
│       ├── serversSlice.ts
│       ├── scenariosSlice.ts
│       ├── executionSlice.ts
│       ├── uiSlice.ts
│       └── templatesSlice.ts
│
├── types/                   # TypeScript types
│   ├── server.ts
│   ├── scenario.ts
│   ├── condition.ts
│   ├── loop.ts
│   └── execution.ts
│
├── validation/              # Validation logic
│   ├── schemas.ts
│   └── validationService.ts
│
├── utils/                   # Utility functions
│   ├── idGenerator.ts
│   └── formatters.ts
│
├── App.tsx
└── main.tsx
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Vite + React + TypeScript)
- [ ] Redux store configuration with persistence
- [ ] Basic type definitions
- [ ] Storage service (IndexedDB)
- [ ] Server CRUD operations

### Phase 2: Scenario Editor (Week 3-4)
- [ ] React Flow integration
- [ ] Step nodes (all types)
- [ ] Edge connections
- [ ] Step editor forms
- [ ] Condition builder UI
- [ ] Loop configuration UI

### Phase 3: Execution Engine (Week 5-6)
- [ ] Variable resolver
- [ ] Condition evaluator
- [ ] Loop handler
- [ ] HTTP client
- [ ] Main executor
- [ ] Execution UI panel

### Phase 4: Polish & Integration (Week 7-8)
- [ ] JSON/YAML editors
- [ ] Import/Export functionality
- [ ] Validation with error display
- [ ] Template system
- [ ] Sequence diagram visualization
- [ ] Testing and bug fixes

---

## 12. Summary

This architecture provides a comprehensive foundation for building the no-code scenario testing tool. Key design decisions:

1. **Type Safety**: Complete TypeScript interfaces ensure compile-time safety and excellent IDE support.

2. **State Management**: Redux Toolkit with entity adapters provides normalized, efficient state management with persistence.

3. **Execution Engine**: Clean separation of concerns with dedicated handlers for conditions, loops, and variable resolution.

4. **Validation**: Multi-layer validation (schema, reference, runtime) catches errors early and provides clear feedback.

5. **Extensibility**: Template system and modular design allow easy addition of new features.

6. **Performance**: Strategies for handling large scenarios including virtualization, memoization, and lazy loading.

The architecture balances flexibility (any server, any API) with structure (typed interfaces, validation) to create a robust yet user-friendly tool.
