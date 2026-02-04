---
name: commit
description: Commit changes (Conventional Commits)
argument-hint: [message] [--amend]
disable-model-invocation: true
allowed-tools: Bash, Read, Grep
model: haiku
category: workflow
---

# Git Commit

변경사항을 Conventional Commits 형식으로 커밋합니다.

## Triggers (사용 조건)

- "커밋해줘", "commit"
- "변경사항 저장", "git commit"
- 코드 작업 완료 후

## Arguments

- `$ARGUMENTS`: 커밋 메시지
- `--amend`: 이전 커밋 수정

## Workflow

```
┌─────────────────────────────────────┐
│  1. Check status & diff             │
│  2. Stage changes                   │
│  3. Create commit                   │
│  4. Verify commit                   │
└─────────────────────────────────────┘
```

## Conventional Commits Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| style | 코드 스타일 (포맷팅) |
| refactor | 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 빌드, 설정 등 |
| perf | 성능 개선 |

## Output Format

```
Commit Created
═══════════════════════════════════════
Hash: abc1234
Type: feat
Scope: auth
Message: add OAuth2 login support

Files: 3 changed, 45 insertions(+), 12 deletions(-)
═══════════════════════════════════════
```

## Examples

```bash
/commit feat(auth): add OAuth2 login
/commit fix(api): handle null response
/commit --amend
```

## Guidelines

- 제목 50자 이내
- 본문 72자에서 줄바꿈
- 명령형 현재시제 (Add, not Added)

## Related Skills

- `/lint`: 커밋 전 린트
- `/code-quality`: 품질 검사 후 커밋
- `/git-workflow`: 브랜치 워크플로우
