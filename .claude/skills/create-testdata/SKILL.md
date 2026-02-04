---
name: create-testdata
description: Generate test data and fixtures
argument-hint: <model> [count] [--format=<json|sql|factory>]
allowed-tools: Task
model: haiku
category: testing
---

# Create Test Data

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the test-writer agent to create test fixtures and mock data for: $ARGUMENTS
```

## 에이전트 완료 후

데이터 생성 완료 시 안내:

```
테스트 데이터 생성 완료.
- 테스트 실행: /run-tests
- 스키마 확인: Use the database-specialist agent to verify schema
```

## Related Skills

- `/run-tests`: 테스트 실행
- `/db-migrate`: DB 마이그레이션
