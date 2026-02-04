---
name: workflow-guide
description: Guide for coordinating multiple specialized agents in complex projects
argument-hint: <feature-description>
allowed-tools: Task, TodoWrite
model: sonnet
category: workflow
---

# Multi-Agent Workflow Guide

## When to Use

Use this workflow when:
- Features span multiple technical domains (backend + frontend + DB)
- Need structured task decomposition and sequential execution
- Want manual control over each step

**Don't use when:**
- Single domain tasks (use domain agent directly)
- Want fully automated execution (use `/orchestrate` instead)
- Minor bug fixes (use `/fix-issue` instead)

## Workflow Phases

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Planning                                           │
│  Use the pm-agent to decompose: $ARGUMENTS                   │
│  Output: Task board with priorities and dependencies         │
├─────────────────────────────────────────────────────────────┤
│  PHASE 2: Parallel Execution                                 │
│  Execute tasks by priority:                                  │
│  - P0 tasks first (blocking)                                 │
│  - Same-priority tasks can run in parallel                   │
│  - Respect dependency order                                  │
├─────────────────────────────────────────────────────────────┤
│  PHASE 3: Coordination                                       │
│  Monitor progress via TodoWrite                              │
│  Validate API contracts between components                   │
│  Handle blockers and adjust plan if needed                   │
├─────────────────────────────────────────────────────────────┤
│  PHASE 4: Review & Integration                               │
│  Use code-reviewer agent to review all changes               │
│  Run tests to validate integration                           │
│  Fix any issues found                                        │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Execution

### Step 1: Planning
```
Use the pm-agent to create task board for: $ARGUMENTS
```

### Step 2: Execute P0 Tasks
For each P0 task, call the assigned agent:
```
Use the [agent-name] agent to [task description]
```

### Step 3: Execute P1 Tasks (after P0 complete)
Continue with P1 tasks, respecting dependencies.

### Step 4: Final Review
```
Use the code-reviewer agent to review all changes
```

### Step 5: Run Tests
```
/run-tests
```

## Agent Mapping

| Domain | Agent Command |
|--------|---------------|
| Backend | `Use the backend-developer agent to...` |
| Frontend | `Use the frontend-developer agent to...` |
| Database | `Use the database-specialist agent to...` |
| General | `Use the general-developer agent to...` |
| Testing | `Use the test-writer agent to...` |
| Review | `Use the code-reviewer agent to...` |

## Rules

1. **Always start with PM Agent** - Get task board first
2. **Never skip steps** - Follow each phase sequentially
3. **Respect dependencies** - Don't start task before its dependencies complete
4. **Update progress** - Mark tasks complete as you go
5. **Review before merge** - Always run code review at the end

## Related Skills

- `/orchestrate`: Automated multi-agent execution
- `/full-dev`: Full development flow
- `/plan`: Quick planning without execution
