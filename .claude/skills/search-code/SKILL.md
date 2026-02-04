---
name: search-code
description: Search codebase for specific patterns or functions
argument-hint: <query> [--type=<file-type>]
allowed-tools: Read, Grep, Glob, Bash
model: haiku
category: understanding
agent: Explore
---

# Search Code

코드베이스에서 원하는 코드를 효과적으로 찾습니다.

## Triggers (사용 조건)

- "이거 어디 있어?", "search for"
- "함수 찾아줘", "find where"
- 특정 코드 위치 확인 필요시

## Arguments

- `$ARGUMENTS`: 검색 패턴 또는 설명
- `--type=<ext>`: 파일 타입 필터 (ts, py, go)

## Workflow

```
┌─────────────────────────────────────┐
│  1. Analyze search query            │
│  2. Choose search strategy          │
│  3. Execute search                  │
│  4. Filter & rank results           │
│  5. Show context                    │
└─────────────────────────────────────┘
```

## Search Strategies

| Strategy | Use Case | Example |
|----------|----------|---------|
| Text | 정확한 텍스트 | `"handleLogin"` |
| Regex | 패턴 매칭 | `"use.*Hook"` |
| Symbol | 함수/클래스 | `"function auth"` |
| Git | 히스토리 | `"who changed auth"` |

## Agent Integration

**코드 이해:**
```
Use the explain-code skill to understand the found code
```

**관련 코드 분석:**
```
Use the architect agent to analyze dependencies of [found-file]
```

## Output Format

```
Search: "[query]"
═══════════════════════════════════════
Found 5 matches:

src/auth/login.ts:23
  → function handleLogin(credentials) {

src/hooks/useAuth.ts:45
  → const login = async (data) => {

Related files:
  - src/types/auth.ts
  - src/api/auth.ts
═══════════════════════════════════════
```

## Examples

```bash
/search-code handleLogin
/search-code "async function" --type=ts
/search-code authentication logic
```

## Related Skills

- `/explain-code`: 찾은 코드 설명
- `/architecture-review`: 구조 분석
