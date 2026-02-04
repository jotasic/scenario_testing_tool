---
name: setup-env
description: Auto-setup development environment
argument-hint: [--clean] [--skip-db]
allowed-tools: Bash, Read, Grep, Glob
model: haiku
category: infrastructure
---

# Setup Environment

프로젝트 개발 환경을 자동으로 설정합니다.

## Triggers (사용 조건)

- "환경 설정해줘", "setup", "install"
- "개발 환경 구성", "dependencies 설치"
- 프로젝트 클론 후 초기 설정시

## Arguments

- `--clean`: 클린 설치 (node_modules 삭제 후 재설치)
- `--skip-db`: DB 마이그레이션 스킵

## Workflow

```
┌─────────────────────────────────────┐
│  1. Detect project type             │
│  2. Install dependencies            │
│  3. Setup configuration             │
│  4. Database setup (optional)       │
│  5. Verify installation             │
└─────────────────────────────────────┘
```

## Install Commands

| Project | Command |
|---------|---------|
| Node.js | `npm install` / `yarn` / `pnpm install` |
| Python | `pip install -r requirements.txt` / `poetry install` |
| Go | `go mod download` |
| Rust | `cargo build` |

## Agent Integration

**환경 문제 해결:**
```
Use the devops-specialist agent to troubleshoot environment setup issues
```

**DB 설정:**
```
Use the database-specialist agent to setup database schema and migrations
```

## Output Format

```
Environment Setup Complete
═══════════════════════════════════════
Installed:
  - Node.js dependencies: 342 packages
  - Python dependencies: 28 packages

Configured:
  ✓ .env file created
  ✓ Git hooks installed
  ✓ Database migrated

Next Steps:
  1. Update .env with your credentials
  2. Run `npm run dev` to start
═══════════════════════════════════════
```

## Examples

```bash
/setup-env                # 기본 설정
/setup-env --clean        # 클린 설치
/setup-env --skip-db      # DB 스킵
```

## Related Skills

- `/db-migrate`: DB 마이그레이션
- `/dependency-audit`: 의존성 보안 검사
- `/build`: 빌드 확인
