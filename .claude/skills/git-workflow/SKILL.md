---
name: git-workflow
description: Manage Git branch workflow (feature branch, PR)
argument-hint: <start|finish|sync> [name]
disable-model-invocation: true
allowed-tools: Bash, Read
model: haiku
category: workflow
---

# Git Workflow

Git 브랜치 기반 워크플로우를 자동화합니다.

## Triggers (사용 조건)

- "브랜치 만들어줘", "feature 시작"
- "PR 준비", "finish feature"
- "main 동기화", "sync branch"

## Arguments

- `start [name]`: 새 feature 브랜치 생성
- `finish`: 현재 브랜치 PR 생성 준비
- `sync`: main 브랜치와 동기화

## Workflow

```
┌─────────────────────────────────────┐
│  start  → checkout main → pull     │
│         → create branch            │
├─────────────────────────────────────┤
│  finish → check status → push      │
│         → create PR                │
├─────────────────────────────────────┤
│  sync   → fetch main → rebase      │
│         → resolve conflicts        │
└─────────────────────────────────────┘
```

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/[name]` | `feature/user-auth` |
| Bugfix | `fix/[issue]` | `fix/login-error` |
| Hotfix | `hotfix/[name]` | `hotfix/security-patch` |
| Release | `release/[version]` | `release/v1.2.0` |

## Agent Integration

**충돌 해결:**
```
Use the debugger agent to resolve merge conflicts in [files]
```

**PR 리뷰:**
```
Use the code-reviewer agent to review changes before PR
```

## Output Format

```
Git Workflow: [action]
═══════════════════════════════════════
Branch: feature/user-auth
Base: main
Status: Ready for PR

Commands executed:
  ✓ git checkout main
  ✓ git pull origin main
  ✓ git checkout -b feature/user-auth
═══════════════════════════════════════
```

## Examples

```bash
/git-workflow start user-auth
/git-workflow finish
/git-workflow sync
```

## Related Skills

- `/commit`: 커밋
- `/review-pr`: PR 리뷰
- `/code-quality`: PR 전 품질 검사
