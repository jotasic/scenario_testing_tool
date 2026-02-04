---
name: api-docs-generate
description: Auto-generate OpenAPI/Swagger API documentation
argument-hint: [path] [--format=<yaml|json>]
allowed-tools: Task
model: haiku
category: documentation
---

# API Documentation Generator

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the doc-writer agent to generate OpenAPI documentation for: $ARGUMENTS
```

## 에이전트 완료 후

문서 생성 완료 시 안내:

```
API 문서 생성 완료.
- API 설계 리뷰: Use the api-designer agent to review API design
- 문서 보강: Use the doc-writer agent to add examples
```

## Related Skills

- `/architecture-review`: API 구조 분석
- `/full-dev`: 전체 개발 플로우
