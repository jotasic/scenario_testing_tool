# Skill Routing Map

## Agent Assignment by Domain

| Domain | Primary Agent | Backup Agent |
|--------|--------------|--------------|
| Backend API | `backend-developer` | `general-developer` |
| Frontend UI | `frontend-developer` | `general-developer` |
| Database | `database-specialist` | `backend-developer` |
| DevOps/CI | `devops-specialist` | `general-developer` |
| Architecture | `architect` | - |
| Security | `security-auditor` | `code-reviewer` |
| Testing | `test-writer` | `e2e-tester` |
| E2E Testing | `e2e-tester` | `test-writer` |
| Documentation | `doc-writer` | `general-developer` |
| Performance | `performance-optimizer` | `backend-developer` |
| API Design | `api-designer` | `architect` |
| Refactoring | `refactorer` | `code-reviewer` |

## Task Type Routing

| Task Type | Recommended Agent |
|-----------|------------------|
| REST endpoint | `backend-developer` |
| GraphQL resolver | `backend-developer` |
| React component | `frontend-developer` |
| Vue component | `frontend-developer` |
| DB migration | `database-specialist` |
| Docker setup | `devops-specialist` |
| Unit tests | `test-writer` |
| Browser tests | `e2e-tester` |
| Bug fix | `debugger` |
| Code review | `code-reviewer` |
| System design | `architect` |

## Priority Assignment

| Priority | Criteria |
|----------|----------|
| P0 | Blocking other tasks, critical path |
| P1 | Important but not blocking |
| P2 | Nice to have, polish |
