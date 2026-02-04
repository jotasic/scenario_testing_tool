---
name: explain-code
description: Explain code using visual diagrams and analogies
argument-hint: <file|function> [--detail]
allowed-tools: Task, Read
model: haiku
category: understanding
---

# Code Explanation

## ⚡ 즉시 실행

**1. 코드 읽기:**
대상 파일/함수를 Read 도구로 읽은 후

**2. 에이전트 호출:**
```
Use the architect agent to explain the code with diagrams and analogies: $ARGUMENTS
```

## 에이전트 완료 후

설명 완료 시 안내:

```
코드 설명 완료.
- 개선 필요시: Use the refactorer agent to suggest improvements
- 전체 구조: /architecture-review
```

## Related Skills

- `/search-code`: 관련 코드 찾기
- `/architecture-review`: 전체 아키텍처 이해
