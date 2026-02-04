---
name: estimate-effort
description: Analyze code change scope and impact
argument-hint: <task-description>
allowed-tools: Task
model: haiku
category: understanding
---

# Estimate Effort

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the architect agent to analyze effort and impact for: $ARGUMENTS
```

## 에이전트 완료 후

분석 완료 시 안내:

```
규모 분석 완료.
- 상세 설계: Use the architect agent to create technical design
- 구현 시작: /new-feature 또는 /full-dev
```

## Related Skills

- `/architecture-review`: 시스템 구조 파악
- `/full-dev`: 전체 개발 플로우
- `/new-feature`: 기능 구현
