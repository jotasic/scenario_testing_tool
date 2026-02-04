---
name: orchestrate
description: Automatically orchestrate multiple specialized agents for complex features
argument-hint: <feature-description>
allowed-tools: Task, TodoWrite, Bash
model: sonnet
category: workflow
---

# Orchestrator

Automatically coordinate multiple specialized agents for complex features.

## When to Use

- Full-stack implementation requiring multiple domains
- User requests "auto execute" or "parallel processing"

**Don't use for:** Single domain tasks, manual control (use `/workflow-guide`)

## Execution Flow

```
Plan → Setup → Execute (parallel) → Verify → Review
```

1. **Plan**: Use pm-agent to create task board for `$ARGUMENTS`
2. **Execute**: Launch agents by priority (max 3 parallel)
3. **Verify**: Run `/code-quality` after each phase
4. **Review**: Use code-reviewer for final review

## Rules

- Max 3 concurrent agents
- Verification gate after each phase
- Max 2 retries per failed task

## References

- [Execution Protocol](resources/execution-protocol.md)
- [Output Format](resources/output-format.md)
- [Agent Routing](../_shared/skill-routing.md)
- [Verification](../_shared/verification-protocol.md)

## Related

`/workflow-guide` | `/full-dev` | `/plan`
