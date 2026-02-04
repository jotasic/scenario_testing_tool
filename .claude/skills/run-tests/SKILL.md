---
name: run-tests
description: Run project tests
argument-hint: [path] [--coverage] [--watch]
allowed-tools: Bash, Read, Grep, Glob
model: haiku
category: testing
---

# Run Tests

테스트를 실행하고 결과를 분석합니다.

## Triggers (사용 조건)

- "테스트 돌려줘", "run tests"
- "테스트 실패 확인", "커버리지 확인"
- 코드 변경 후 테스트 검증 필요시

## Arguments

- `$ARGUMENTS`: 특정 테스트 파일/패턴
- `--coverage`: 커버리지 리포트 생성
- `--watch`: 파일 변경 감지 모드

## Workflow

```
┌─────────────────────────────────────┐
│  1. Detect test framework           │
│  2. Run tests                       │
│  3. Analyze failures                │
│  4. Generate coverage (optional)    │
└─────────────────────────────────────┘
```

## Test Commands

| Framework | Command |
|-----------|---------|
| Jest | `npm test` or `npx jest` |
| Vitest | `npx vitest` |
| Pytest | `pytest` |
| Go | `go test ./...` |
| Cargo | `cargo test` |

## Agent Integration

**테스트 실패 수정:**
```
Use the debugger agent to fix failing test in [file]
```

**테스트 추가:**
```
Use the test-writer agent to add tests for [component]
```

**커버리지 개선:**
```
Use the test-writer agent to improve coverage for [file]
```

## Output Format

```
Test Results
═══════════════════════════════════════
✓ Passed: 42
✗ Failed: 2
○ Skipped: 1

Failed Tests:
  - [test name]: [error summary]

Coverage: 85%
═══════════════════════════════════════
```

## Examples

```bash
/run-tests                       # 전체 테스트
/run-tests src/auth              # 특정 경로
/run-tests --coverage            # 커버리지 포함
/run-tests LoginScreen.test.tsx  # 특정 파일
```

## Related Skills

- `/build`: 빌드 확인
- `/code-quality`: 전체 품질 검사
- `/fix-issue`: 테스트 실패 수정
