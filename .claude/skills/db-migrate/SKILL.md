---
name: db-migrate
description: Create and run database migrations
argument-hint: <create|run|rollback|status> [name]
allowed-tools: Task, Bash
model: haiku
category: infrastructure
---

# Database Migration

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the database-specialist agent to handle database migration: $ARGUMENTS
```

## 에이전트 완료 후

마이그레이션 완료 시 안내:

```
마이그레이션 완료.
- 상태 확인: /db-migrate status
- 롤백 필요시: /db-migrate rollback
```

## Related Skills

- `/setup-env`: 환경 설정
- `/full-dev`: 전체 개발 플로우
