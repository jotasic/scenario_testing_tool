---
name: architecture-review
description: Analyze and review current system architecture
argument-hint: [area] [--deep]
allowed-tools: Task
model: haiku
category: understanding
---

# Architecture Review

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the architect agent to analyze and review the architecture of: $ARGUMENTS
```

## 에이전트 완료 후

분석 완료 시 사용자에게 안내:

```
아키텍처 분석 완료.
- 개선 필요시: Use the refactorer agent to...
- 성능 이슈: /performance-profile
- 보안 이슈: Use the security-auditor agent to...
```

## Related Skills

- `/full-dev`: 전체 개발 플로우
- `/performance-profile`: 성능 분석
- `/explain-code`: 코드 설명
