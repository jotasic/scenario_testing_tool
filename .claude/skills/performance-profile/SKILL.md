---
name: performance-profile
description: Run performance profiling and benchmarks
argument-hint: [target] [--report]
allowed-tools: Task, Bash
model: haiku
category: infrastructure
---

# Performance Profile

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the performance-optimizer agent to profile and analyze performance of: $ARGUMENTS
```

## 에이전트 완료 후

분석 완료 시 안내:

```
성능 분석 완료.
- 코드 최적화: Use the refactorer agent to optimize slow functions
- DB 최적화: Use the database-specialist agent to optimize queries
```

## Related Skills

- `/architecture-review`: 구조 분석
- `/code-quality`: 품질 검사
