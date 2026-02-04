# Agent Assignment Guide

## Domain to Agent Mapping

| Domain | Agent | Example Tasks |
|--------|-------|---------------|
| Backend API | `backend-developer` | REST endpoints, business logic |
| Frontend UI | `frontend-developer` | Components, state management |
| Scripts/CLI | `general-developer` | Automation, utilities |
| Database | `database-specialist` | Schema, migrations |
| Architecture | `architect` | System design, tech decisions |
| Testing | `test-writer` | Unit tests, integration tests |
| E2E Testing | `e2e-tester` | Browser automation tests |
| Code Review | `code-reviewer` | Quality review |
| Security | `security-auditor` | Security review |
| DevOps | `devops-specialist` | Docker, CI/CD, K8s |
| Performance | `performance-optimizer` | Profiling, optimization |
| API Design | `api-designer` | REST/GraphQL spec |
| Documentation | `doc-writer` | README, API docs |
| Refactoring | `refactorer` | Code restructuring |

## Selection Criteria

1. **Match domain expertise** - Backend task → backend-developer
2. **Consider complexity** - Simple → haiku agent, Complex → opus agent
3. **Check dependencies** - DB changes needed? Include database-specialist
4. **Plan verification** - Include test-writer or code-reviewer

## Anti-Patterns

- ❌ Assigning frontend task to backend-developer
- ❌ Skipping code-reviewer for critical changes
- ❌ Using architect for simple implementation
- ❌ Multiple agents for single atomic task
