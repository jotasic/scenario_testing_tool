---
name: mcp-demo
description: MCP server usage demo and guide
argument-hint: [server-name]
allowed-tools: Read, Bash
model: haiku
category: understanding
---

# MCP (Model Context Protocol) Demo

MCP 서버 연동 방법과 예제를 설명합니다.

## Triggers (사용 조건)

- "MCP 사용법", "MCP 설정"
- "서버 연동 방법", "how to use MCP"
- MCP 서버 설정 필요시

## Arguments

- `$ARGUMENTS`: 특정 MCP 서버 이름 (선택)
  - `filesystem`, `github`, `postgres`, `memory`, `puppeteer`

## Available Servers

| Server | Purpose |
|--------|---------|
| `filesystem` | 파일시스템 접근 |
| `github` | GitHub API |
| `postgres` | DB 쿼리 |
| `memory` | 지식 그래프 |
| `puppeteer` | 브라우저 자동화 |
| `sequential-thinking` | 단계별 추론 |

## Setup

### Project Level (권장)
`.claude/mcp.json`:
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-github"],
    "env": { "GITHUB_TOKEN": "..." }
  }
}
```

### Verify
```bash
/mcp  # 연결된 서버 확인
```

## Agent Integration

**MCP 서버 설정 도움:**
```
Use the devops-specialist agent to configure MCP server for [purpose]
```

## Output Format

```
MCP Server: [name]
═══════════════════════════════════════
Status: Connected

Available Tools:
  - tool_1: [description]
  - tool_2: [description]

Example Usage:
  [usage example]

Config:
  [json config]
═══════════════════════════════════════
```

## Examples

```bash
/mcp-demo                # 전체 가이드
/mcp-demo github         # GitHub 서버 설정
/mcp-demo postgres       # PostgreSQL 연동
```

## Related Skills

- `/setup-env`: 환경 설정
- `/architecture-review`: 시스템 분석
