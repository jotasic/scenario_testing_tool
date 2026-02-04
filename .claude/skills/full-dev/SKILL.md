---
name: full-dev
description: Run full development flow from requirements to completion
argument-hint: <feature-description>
allowed-tools: Task
model: haiku
category: workflow
---

# Full Development Flow

Requirements: $ARGUMENTS

## ⚡ Immediate Execution - Start from Phase 1

**Phase 1: Planning** (Start immediately)
```
Use the spec-writer agent to create PRD for: $ARGUMENTS
```

After PRD completion → Phase 2

**Phase 2: Design**
```
Use the architect agent to design system based on the PRD
```

After design completion → Phase 3

**Phase 3: Implementation** (Select based on project type)
```
Use the backend-developer agent to implement the backend
Use the frontend-developer agent to implement the frontend
```

After implementation → Phase 4

**Phase 4: Quality**
```
Use the test-writer agent to write tests
Use the code-reviewer agent to review the code
```

## Related Skills

- `/write-spec`: Create PRD only
- `/new-feature`: Implementation only (without design)
- `/architecture-review`: Analyze existing architecture
