---
name: write-spec
description: Convert user requirements to PRD
argument-hint: <feature-description>
allowed-tools: Task
model: haiku
category: documentation
---

# Write Specification (PRD)

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the spec-writer agent to create PRD for: $ARGUMENTS
```

## 에이전트 완료 후

PRD 작성이 완료되면 사용자에게 다음 단계 안내:

```
PRD 작성 완료. 다음 단계:
/architecture-review 또는
"Use the architect agent to design system based on [PRD 경로]"
```

## Related Skills

- `/full-dev`: 전체 개발 플로우 (기획→설계→구현)
- `/architecture-review`: 아키텍처 분석
