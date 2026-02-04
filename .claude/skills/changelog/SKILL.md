---
name: changelog
description: Auto-generate CHANGELOG from commit logs
argument-hint: [version] [--since=<tag>]
allowed-tools: Bash, Read, Write
model: haiku
category: documentation
---

# Changelog Generator

Git 커밋 히스토리에서 CHANGELOG를 자동 생성합니다.

## Triggers (사용 조건)

- "체인지로그 만들어줘", "generate changelog"
- "릴리즈 노트", "release notes"
- 버전 릴리즈 준비시

## Arguments

- `$ARGUMENTS`: 버전 번호 (예: 1.2.0)
- `--since=<tag>`: 시작 태그 지정

## Workflow

```
┌─────────────────────────────────────┐
│  1. Analyze commits since last tag  │
│  2. Categorize by type              │
│  3. Generate changelog entry        │
│  4. Update CHANGELOG.md             │
└─────────────────────────────────────┘
```

## Commit Categories

| Type | Section |
|------|---------|
| feat | Features |
| fix | Bug Fixes |
| perf | Performance |
| docs | Documentation |
| BREAKING | Breaking Changes |

## Agent Integration

**릴리즈 문서:**
```
Use the doc-writer agent to expand changelog into release notes
```

## Version Suggestion

Based on changes:
- Breaking changes → **Major** (1.0.0 → 2.0.0)
- Features → **Minor** (1.0.0 → 1.1.0)
- Fixes only → **Patch** (1.0.0 → 1.0.1)

## Output Format

```
Changelog: v[version]
═══════════════════════════════════════
## [1.2.0] - 2024-01-15

### Breaking Changes
- Removed deprecated `oldAPI()` (#123)

### Features
- Add user authentication (#145)
- Implement dark mode (#156)

### Bug Fixes
- Fix memory leak (#162)

### Performance
- Optimize queries (30% faster)
═══════════════════════════════════════
Updated: CHANGELOG.md
```

## Examples

```bash
/changelog 1.2.0              # 버전 지정
/changelog                    # 자동 버전 추천
/changelog --since=v1.0.0     # 특정 태그 이후
```

## Related Skills

- `/commit`: 커밋 (Conventional Commits)
- `/git-workflow`: 브랜치 관리
