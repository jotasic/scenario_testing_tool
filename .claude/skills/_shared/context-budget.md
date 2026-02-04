# Context Budget Guide

## Token Optimization

### SKILL.md Size
- Target: ~40 lines
- Max: 100 lines
- Move details to resources/

### Resource Loading
- Load on-demand, not upfront
- Reference with markdown links
- Claude loads when needed

## Structure Pattern

```
skill-name/
├── SKILL.md           # Core logic only (~40 lines)
└── resources/
    ├── examples.md    # Load when examples needed
    ├── protocol.md    # Load for detailed steps
    └── format.md      # Load for output formatting
```

## When to Split

| Content Type | Location |
|--------------|----------|
| Core workflow | SKILL.md |
| Detailed steps | resources/execution-protocol.md |
| Output templates | resources/output-format.md |
| Examples | resources/examples.md |
| Shared logic | ../_shared/ |

## Anti-Patterns

- ❌ 200+ line SKILL.md
- ❌ Duplicate content across skills
- ❌ Inline examples in main file
- ❌ Full output templates in SKILL.md
