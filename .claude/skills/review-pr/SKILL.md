---
name: review-pr
description: Analyze and review GitHub Pull Request
argument-hint: [pr-number]
allowed-tools: Task, Bash
model: haiku
category: development
---

# Pull Request Review

## ⚡ 즉시 실행

**1. PR 정보 조회:**
```bash
gh pr view $ARGUMENTS
gh pr diff $ARGUMENTS
```

**2. 코드 리뷰 에이전트 호출:**
```
Use the code-reviewer agent to review PR $ARGUMENTS with security and test coverage check
```

## 에이전트 완료 후

리뷰 결과 요약 후 사용자에게 안내:

```
PR 리뷰 완료.
- Approve / Request Changes / Comment 중 선택
- gh pr review $ARGUMENTS --approve (또는 --request-changes)
```

## Related Skills

- `/fix-issue`: 이슈 수정
- `/code-quality`: 품질 검사
