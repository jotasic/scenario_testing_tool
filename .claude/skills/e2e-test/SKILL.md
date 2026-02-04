---
name: e2e-test
description: Run E2E tests and verify browser state
argument-hint: <url-or-test-description>
allowed-tools: Task, Bash, Read, Write
model: sonnet
category: testing
---

# E2E Test

## ⚡ Immediate Execution

**Call the agent below immediately:**

```
Use the e2e-tester agent to test: $ARGUMENTS
```

## What the Agent Does

1. **Launch browser** - Control browser with Playwright MCP
2. **Navigate pages** - Go to URL and interact with elements
3. **Capture screenshots** - Verify visual state
4. **Analyze results** - Check errors, console logs, network status
5. **Fix bugs** - Attempt to auto-fix discovered issues

## Playwright MCP Tools

| Tool | Description |
|------|-------------|
| `playwright_navigate` | Navigate to URL |
| `playwright_screenshot` | Capture screenshot |
| `playwright_click` | Click element |
| `playwright_fill` | Fill input field |
| `playwright_evaluate` | Execute JavaScript |
| `playwright_get_visible_text` | Extract visible text |

## Usage Examples

```bash
/e2e-test http://localhost:3000 test login functionality
/e2e-test verify signup form validation
/e2e-test shopping cart add/remove flow
```

## Related Skills

- `/run-tests`: Unit/integration tests
- `/fix-issue`: Bug fixing
- `/code-quality`: Full quality check
