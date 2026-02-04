---
name: new-feature
description: Implement new feature
argument-hint: [feature description]
allowed-tools: Task, Bash, Read
model: haiku
category: development
---

# Implement New Feature

## ⚡ 즉시 실행

**프로젝트 타입 확인 후 적절한 에이전트 호출:**

### 프론트엔드 기능인 경우:
```
Use the frontend-developer agent to implement: $ARGUMENTS
```

### 백엔드/API 기능인 경우:
```
Use the backend-developer agent to implement: $ARGUMENTS
```

### 스크립트/CLI/유틸리티인 경우:
```
Use the general-developer agent to implement: $ARGUMENTS
```

### 판단 기준:
- UI, 컴포넌트, 스타일링 → frontend-developer
- API, DB, 서버 로직 → backend-developer
- 스크립트, 봇, CLI → general-developer

## 에이전트 완료 후

구현 완료 시 안내:

```
구현 완료.
- /run-tests 로 테스트 확인
- /lint --fix 로 린트 수정
- /commit 으로 커밋
```

## Related Skills

- `/full-dev`: 기획부터 전체 플로우
- `/run-tests`: 테스트 실행
