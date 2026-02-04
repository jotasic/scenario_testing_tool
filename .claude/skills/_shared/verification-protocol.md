# Verification Protocol

## Core Principle
**Never claim "done" without verification.**

## Verification Steps

### 1. Build Check
```bash
npm run build  # or equivalent
```
Exit code must be 0.

### 2. Test Check
```bash
npm run test   # or equivalent
```
All tests must pass.

### 3. Lint Check
```bash
npm run lint   # or equivalent
```
No errors (warnings acceptable).

### 4. Type Check (if applicable)
```bash
npm run typecheck  # or tsc --noEmit
```
No type errors.

## Failure Protocol

1. **Do NOT claim fixed** if verification fails
2. Analyze error output
3. Apply fix
4. Re-run verification
5. Repeat until all checks pass
6. Only then report success

## Verification Gate Template

```markdown
## Verification Results
- [ ] Build: [PASS/FAIL]
- [ ] Tests: [PASS/FAIL] (X passed, Y failed)
- [ ] Lint: [PASS/FAIL]
- [ ] Types: [PASS/FAIL]

Status: [VERIFIED / NEEDS FIX]
```
