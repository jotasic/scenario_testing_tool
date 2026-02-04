# Output Templates

## Project Plan Template

```
Project Plan: [Feature Name]
═══════════════════════════════════════

## Overview
[Brief description of what we're building]

## Task Board

### Phase 1: Foundation (P0)
| ID | Task | Agent | Dependencies | Status |
|----|------|-------|--------------|--------|
| T-001 | [task] | [agent] | - | pending |

### Phase 2: Core Features (P0/P1)
| ID | Task | Agent | Dependencies | Status |
|----|------|-------|--------------|--------|
| T-002 | [task] | [agent] | T-001 | pending |

### Phase 3: Polish (P2)
| ID | Task | Agent | Dependencies | Status |
|----|------|-------|--------------|--------|

## Execution Order
1. T-001 (no dependencies)
2. T-002, T-003 (parallel, depend on T-001)
3. T-004 (depends on T-002, T-003)

## Next Steps
Use `/orchestrate` or `/workflow-guide` to execute.
═══════════════════════════════════════
```

## Task Update Template

```
Task Update: T-001
──────────────────
Status: in_progress → completed
Agent: backend-developer
Result: ✅ Success

Changes:
- src/api/auth.ts (new)
- src/middleware/jwt.ts (new)

Verification: Build ✅ | Tests ✅
```
