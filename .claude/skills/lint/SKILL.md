---
name: lint
description: Run code linting and formatting
argument-hint: [path] [--fix]
allowed-tools: Bash, Read, Grep, Glob
model: haiku
category: workflow
---

# Lint & Format

코드 스타일을 검사하고 자동 수정합니다.

## Triggers (사용 조건)

- "린트해줘", "lint", "포맷팅"
- "코드 스타일 검사", "eslint 돌려줘"
- 커밋 전 코드 정리 필요시

## Arguments

- `$ARGUMENTS`: 대상 파일/경로
- `--fix`: 자동 수정 적용

## Workflow

```
┌─────────────────────────────────────┐
│  1. Detect linter config            │
│  2. Run linter                      │
│  3. Run formatter                   │
│  4. Report issues                   │
└─────────────────────────────────────┘
```

## Lint Commands

| Tool | Check | Fix |
|------|-------|-----|
| ESLint | `npx eslint .` | `npx eslint . --fix` |
| Prettier | `npx prettier --check .` | `npx prettier --write .` |
| Ruff | `ruff check .` | `ruff check . --fix` |
| Black | `black --check .` | `black .` |
| golangci-lint | `golangci-lint run` | `golangci-lint run --fix` |

## Agent Integration

**자동 수정 불가 이슈:**
```
Use the refactorer agent to fix lint issues that cannot be auto-fixed
```

**코드 품질 개선:**
```
Use the code-reviewer agent to review code quality beyond lint rules
```

## Output Format

```
Lint Results
═══════════════════════════════════════
Errors: 3
Warnings: 7
Auto-fixable: 8

Issues:
  src/App.tsx:15 [no-unused-vars] 'x' is unused
  src/utils.ts:23 [prefer-const] Use const

To auto-fix: /lint --fix
═══════════════════════════════════════
```

## Examples

```bash
/lint                  # 전체 검사
/lint --fix            # 자동 수정
/lint src/components   # 특정 경로
```

## Related Skills

- `/build`: 빌드
- `/code-quality`: 전체 품질 파이프라인
- `/commit`: 커밋 (린트 후)
