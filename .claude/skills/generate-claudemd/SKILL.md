---
name: generate-claudemd
description: Auto-generate CLAUDE.md from session history and project analysis
argument-hint: [--full] [--minimal] [--append]
allowed-tools: Task
model: haiku
category: documentation
---

# Generate CLAUDE.md

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the claudemd-generator agent to create CLAUDE.md documentation: $ARGUMENTS
```

## 에이전트 완료 후

생성 완료 시 안내:

```
CLAUDE.md 생성 완료.
- 아키텍처 추가: Use the architect agent to document architecture
- 환경 설정: /setup-env
```

## Related Skills

- `/architecture-review`: 구조 분석
- `/setup-env`: 환경 설정
