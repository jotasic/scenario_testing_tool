---
name: dependency-audit
description: Audit dependency security and compatibility
argument-hint: [--fix] [--report]
allowed-tools: Task, Bash
model: haiku
category: infrastructure
---

# Dependency Audit

## ⚡ 즉시 실행

**아래 에이전트를 즉시 호출하세요:**

```
Use the security-auditor agent to audit dependencies and check for vulnerabilities: $ARGUMENTS
```

## 에이전트 완료 후

감사 완료 시 안내:

```
의존성 감사 완료.
- 취약점 수정: Use the dependency-manager agent to fix vulnerabilities
- 업데이트: npm update / pip install --upgrade
```

## Related Skills

- `/setup-env`: 환경 설정
- `/code-quality`: 품질 검사
