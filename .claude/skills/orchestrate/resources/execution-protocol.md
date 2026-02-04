# Execution Protocol

## Phase 1: Planning

```
Use the pm-agent to create task board for: [feature]
```

Wait for task board output before proceeding.

## Phase 2: Task Board Setup

Record all tasks in TodoWrite:
- Set priorities (P0 → P1 → P2)
- Mark dependencies
- Assign agents

## Phase 3: Parallel Execution

### Execution Rules
- Max 3 concurrent agents
- Execute by priority order
- Same-priority tasks run in parallel

### Launch Pattern
```
Use the Task tool to launch multiple agents in parallel:
- backend-developer for T-001
- frontend-developer for T-002
- database-specialist for T-003
```

## Phase 4: Verification

After each phase:
```
/code-quality
```

If fails:
1. Identify failing task
2. Retry with error context (max 2 retries)
3. If still fails, mark as blocked and continue

## Phase 5: Review

```
Use the code-reviewer agent to review all changes
```

Generate completion summary.
