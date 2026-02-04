---
name: type-check-improve
description: Improve TypeScript/Python type checking
argument-hint: [path] [--strict]
allowed-tools: Task, Bash
model: haiku
category: development
---

# Type Check & Improve

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the refactorer agent to analyze and improve type coverage for: $ARGUMENTS
```

## 에이전트 완료 후

검사 완료 시 안내:

```
타입 검사 완료.
- 타입 에러 수정: Use the debugger agent to fix type errors
- 린트 검사: /lint --fix
```

## Related Skills

- `/lint`: 코드 스타일 검사
- `/code-quality`: 전체 품질 검사
