---
name: fix-issue
description: Analyze GitHub issue and implement fix
argument-hint: [issue-number]
allowed-tools: Task, Bash
model: haiku
category: development
---

# Fix GitHub Issue

## ⚡ 즉시 실행

**1. 이슈 정보 조회:**
```bash
gh issue view $ARGUMENTS
```

**2. 디버거 에이전트 호출:**
```
Use the debugger agent to analyze and fix issue #$ARGUMENTS
```

## 에이전트 완료 후

수정 완료 시 사용자에게 안내:

```
이슈 수정 완료.
- /run-tests 로 테스트 확인
- /commit 으로 커밋
```

## Related Skills

- `/run-tests`: 테스트 실행
- `/commit`: 커밋 생성
