# Task Schema

## Task Definition

```yaml
Task:
  id: "TASK-001"
  title: "Implement user authentication API"
  agent: backend-developer
  priority: P0  # P0=critical, P1=important, P2=nice-to-have
  dependencies: []  # List of task IDs this depends on
  acceptance_criteria:
    - "POST /auth/login returns JWT token"
    - "Token validation middleware implemented"
    - "Error responses follow API spec"
  estimated_complexity: medium  # low, medium, high
```

## Priority Levels

| Priority | Description | Example |
|----------|-------------|---------|
| P0 | Critical path, blocks others | API contracts, DB schema |
| P1 | Important, not blocking | Core features |
| P2 | Nice to have | Polish, optimization |

## Complexity Estimation

| Level | Criteria |
|-------|----------|
| Low | Single file, <50 lines change |
| Medium | Multiple files, 50-200 lines |
| High | Architectural change, >200 lines |

## Dependency Rules

1. Tasks with no dependencies can run in parallel
2. P0 tasks typically have no dependencies
3. Minimize dependencies to maximize parallelization
4. Circular dependencies are not allowed
