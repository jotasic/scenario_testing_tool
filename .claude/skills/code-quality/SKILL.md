---
name: code-quality
description: Run code quality pipeline (lint, test, type-check, security)
argument-hint: [--fix]
allowed-tools: Bash, Read, Grep, Glob
---

# Code Quality Pipeline

전체 코드 품질 검사를 순차적으로 실행합니다.

## Arguments

- `--fix`: 자동 수정 가능한 문제 수정

## Pipeline Steps

```
┌─────────────────────────────────────────────────────┐
│  1. Type Check    → 타입 에러 검사                    │
│  2. Lint          → 코드 스타일 검사                   │
│  3. Test          → 단위/통합 테스트                   │
│  4. Security      → 보안 취약점 스캔                   │
│  5. Build         → 빌드 검증                        │
└─────────────────────────────────────────────────────┘
```

## Step 1: Type Check

```bash
# TypeScript
npx tsc --noEmit

# Python (mypy)
mypy .

# Go
go vet ./...
```

## Step 2: Lint

```bash
# JavaScript/TypeScript
npx eslint . $FIX_FLAG
npx prettier --check . $FIX_FLAG

# Python
ruff check . $FIX_FLAG
black --check . $FIX_FLAG

# Go
golangci-lint run $FIX_FLAG
```

## Step 3: Test

```bash
# with coverage
npm test -- --coverage
pytest --cov
go test -cover ./...
```

## Step 4: Security Scan

```bash
# Dependencies
npm audit
pip-audit
cargo audit

# Secrets
git secrets --scan
gitleaks detect
```

## Step 5: Build Verification

```bash
npm run build
python -m build
go build ./...
cargo build --release
```

## Output Summary

```
Code Quality Report
═══════════════════════════════════════
✓ Type Check    : PASSED
✓ Lint          : PASSED (3 warnings)
✓ Tests         : PASSED (42/42)
✓ Security      : PASSED (0 vulnerabilities)
✓ Build         : PASSED
═══════════════════════════════════════
Overall: PASSED
```
