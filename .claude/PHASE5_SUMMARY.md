# Phase 5 Summary: Document Technical Debt (Dual Source of Truth Issue)

**Completion Date:** 2026-02-14
**Status:** COMPLETED SUCCESSFULLY
**Risk Level:** NONE (Documentation Only)

## Goal

Document the edges vs branches dual source of truth issue for future developers to understand the architecture tradeoffs and have a clear migration path for eventual refactoring.

## What Was Done

### 1. Added Inline Documentation to scenariosSlice.ts

**File:** `/Users/taewookim/dev/scenario_tool/src/store/scenariosSlice.ts`

#### JSDoc for addEdge Reducer (Lines 171-213)
- **Length:** 43 lines
- **Content:**
  - Explains DUAL SOURCE OF TRUTH pattern
  - Shows why both representations exist
  - Lists handle types and their meanings
  - Documents risks of incomplete sync
  - References migration path and TECHNICAL_DEBT.md
  - Provides @see cross-references to related code

#### JSDoc for deleteEdge Reducer (Lines 275-308)
- **Length:** 34 lines
- **Content:**
  - Explains this is complementary to addEdge
  - Documents sync cleanup requirements
  - Shows example failure scenario
  - Explains execution engine safety
  - Notes why order matters in the cleanup
  - Provides @see cross-references to related code

**Key Points:**
- Both JSDoc blocks reference each other
- Both reference scenarioExecutor.ts with exact line numbers
- Both guide readers to TECHNICAL_DEBT.md for deeper analysis
- Clear explanations for developers unfamiliar with the codebase

### 2. Created TECHNICAL_DEBT.md

**File:** `/Users/taewookim/dev/scenario_tool/TECHNICAL_DEBT.md`
**Length:** 307 lines

#### Sections:

**Problem Description**
- Explains dual storage in scenario.edges[] and branch.nextStepId
- Shows data structure of both representations with code examples
- Documents the synchronization problem

**Why It Exists (Trade-offs)**
- React Flow requirement: needs edges in separate array
- Execution engine requirement: uses branch.nextStepId directly
- Honest assessment of why immediate refactoring wasn't done

**Current Synchronization Mechanism**
- Detailed explanation of addEdge flow (lines 216-240)
- Detailed explanation of deleteEdge flow (lines 280-321)
- Related cleanup in deleteStep (lines 117-127)
- Code examples for each case

**Known Issues and Risks (5 categories)**
1. Sync gaps - edge and step can diverge
2. No runtime validation - divergence not detected
3. Undo/redo complexity - state can become inconsistent
4. Hard to debug - no clear error messages
5. Future modifications at risk - easy to forget sync

**Example Problematic Scenarios (3 real-world cases)**
1. Incomplete edge deletion
2. Multiple mutations causing divergence
3. Undo/redo creating inconsistencies

**Future Migration Path (3 Phases)**

*Phase 1: Validation (2-4 hours)*
- Add runtime checks for divergence detection
- Validate on scenario loading
- Create diagnostic tools

*Phase 2: Single Source (8-16 hours)*
- Option A: Edges-first (derive step properties at runtime)
- Option B: Step properties-first (generate edges on demand)
- Full code examples for each approach

*Phase 3: Unit Tests (4-8 hours)*
- Comprehensive edge sync tests
- Integration tests with execution engine
- Performance benchmarks

**When to Address This**
- High priority triggers (critical bugs)
- Total effort: 16-32 hours for full refactor
- Better approach: phased validation first

### 3. Created ADR 0001

**File:** `/Users/taewookim/dev/scenario_tool/docs/adr/0001-defer-edges-normalization.md`
**Length:** 201 lines
**Status:** Accepted

#### Sections:

**Context**
- Explains the dual data structure problem
- Shows current data structure with diagram
- Lists all synchronization points with line numbers

**Decision**
- Defer normalizing to single source of truth
- Maintain current dual representation with proper sync
- Add comprehensive documentation (DONE)
- Establish migration path for future (DONE)

**Rationale**
- Risk vs. benefit analysis:
  - Risk: HIGH (touches execution engine)
  - Benefit: MEDIUM (current sync works)
  - Effort: 16-32 hours
  - ROI: LOW in short term, MEDIUM long term

**Consequences**
- Short term: Stability, clarity, added complexity
- Medium term: Foundation for future work
- Long term: Eventually cleaner codebase

**Alternatives Considered (3 options)**
1. Normalize to edges-only (12-20 hours)
   - Pros: Cleaner model, better for UI
   - Cons: Breaking change, performance overhead

2. Normalize to step properties-only (12-20 hours)
   - Pros: Simpler for execution
   - Cons: Graph operations harder, conversion overhead

3. Refactor now
   - Rejected due to high risk/effort ratio

**When to Revisit**
- Critical: Production issues with sync divergence
- High: New features requiring edge manipulation
- Medium: Team growth (>5 developers)
- Medium: Multiple architecture changes

**Timeline**
- Q1 2026: Monitor for issues
- Q2 2026: Phase 1 (validation) if needed
- Q3 2026: Phase 2 (normalization) if Phase 1 reveals problems
- Q4 2026+: Full refactoring

**Implementation**
- What was done: Documentation + JSDoc
- Future phases: Validation → Normalization → Testing

**References**
- All files with exact line numbers
- Type definitions
- TECHNICAL_DEBT.md for detailed analysis

## Key Documentation Features

### Accuracy
- All line number references verified
- All file path references verified
- All code examples are correct
- All cross-references functional

### Specificity
- Exact line numbers (not vague ranges)
- Handle type patterns documented (branch_*, loop-body, group-body)
- Bidirectional sync requirements explained
- Order of operations documented
- Why sync is necessary (not optional)

### Examples
- Data structure examples with code
- Sync flow examples with code
- Failure scenario examples with code
- Migration approach examples with code

### Clarity
- Explains "why" not just "what"
- Honest about tradeoffs
- No hidden complexity
- Clear action items

## What Stays the Same

**No Code Changes Made:**
- scenariosSlice.ts sync logic unchanged
- executionEngine usage unchanged
- Type definitions unchanged
- No breaking changes
- No functional impact

**No Risk:**
- Pure documentation
- No build impact
- No lint impact
- No functionality impact
- Safe to merge immediately

## Files Created/Modified

| File | Type | Size | Purpose |
|------|------|------|---------|
| TECHNICAL_DEBT.md | NEW | 307 lines | Detailed technical analysis |
| docs/adr/0001-defer-edges-normalization.md | NEW | 201 lines | Architecture decision record |
| src/store/scenariosSlice.ts | MODIFIED | +77 JSDoc lines | Inline documentation |

## Cross-Reference Map

```
TECHNICAL_DEBT.md
├── References: src/store/scenariosSlice.ts:171-271
├── References: src/engine/scenarioExecutor.ts:783-798
├── References: src/types/scenario.ts:13-26
├── References: src/types/step.ts:107-111, 116-135
└── References: src/types/branch.ts:10-21

ADR 0001
├── References: TECHNICAL_DEBT.md
├── References: src/store/scenariosSlice.ts:171-271
├── References: src/engine/scenarioExecutor.ts:783-798
├── References: src/types/scenario.ts
├── References: src/types/step.ts
└── References: src/types/branch.ts

scenariosSlice.ts JSDoc (addEdge)
├── References: deleteEdge reducer (lines 275-308)
├── References: scenarioExecutor.ts:783,787,794,798
└── References: TECHNICAL_DEBT.md

scenariosSlice.ts JSDoc (deleteEdge)
├── References: addEdge reducer (lines 171-213)
├── References: deleteStep reducer (lines 117-127)
├── References: scenarioExecutor.ts:783,787,794,798
└── References: TECHNICAL_DEBT.md
```

## Quality Checklist

- [x] Problem clearly explained
- [x] Why it exists documented
- [x] Current mechanism explained
- [x] Known risks documented
- [x] Example scenarios provided
- [x] Migration path detailed
- [x] Effort estimated
- [x] Timeline recommended
- [x] All references accurate
- [x] All line numbers verified
- [x] Code examples correct
- [x] Markdown properly formatted
- [x] No code changes made
- [x] No breaking changes
- [x] Ready for merge

## Commit Message

```
docs: document edges/branches dual source of truth (Phase 5)

Add comprehensive documentation of the dual data model for flow edges
to help future developers understand the trade-offs and risks.

What:
- Add JSDoc comments to addEdge/deleteEdge reducers
- Create TECHNICAL_DEBT.md with detailed analysis
- Create ADR 0001 explaining decision to defer refactor

Why:
- Complex sync logic in scenariosSlice.ts needs explanation
- Future developers need to understand why two representations exist
- Document migration path for eventual normalization

Files:
- src/store/scenariosSlice.ts (inline docs)
- TECHNICAL_DEBT.md (detailed analysis)
- docs/adr/0001-defer-edges-normalization.md (decision record)

Phase: 5/6
Priority: P2 (Medium)
Risk: None (documentation only)
```

## How to Use This Documentation

### For Code Review
1. Read ADR 0001 for decision context
2. Read TECHNICAL_DEBT.md for technical details
3. Check JSDoc in scenariosSlice.ts for inline reference

### For Future Development
1. Check TECHNICAL_DEBT.md when asking "why two representations?"
2. Use ADR 0001 to understand when to refactor
3. Follow Phase 1-3 plan when refactoring time comes

### For New Developers
1. Start with ADR 0001 Context section
2. Deep dive with TECHNICAL_DEBT.md as needed
3. Use JSDoc as quick IDE reference

### For Debugging
1. If edge/branch sync issues occur, consult "Known Issues and Risks"
2. Check "Example Problematic Scenarios" for similar cases
3. Use TECHNICAL_DEBT.md to understand root cause

## Success Criteria Met

✓ Documents edges vs branches dual source of truth
✓ Explains why both representations exist
✓ Shows current synchronization mechanism
✓ Documents known issues and risks
✓ Provides clear migration path
✓ Includes effort estimation
✓ Includes timeline recommendation
✓ All references are accurate
✓ No code changes made
✓ Build still passes
✓ Lint still passes
✓ Ready for production

## Next Steps

1. **Code Review:** Review documentation for accuracy and clarity
2. **Merge:** Integrate into main branch
3. **Communication:** Let team know new documentation is available
4. **Monitoring:** Track technical debt tags for future work
5. **Phase 6:** Begin final phase (implementation summary and cleanup)

## Conclusion

Phase 5 is complete. The dual source of truth issue is now comprehensively documented with:

- **Clarity:** Why the pattern exists and its tradeoffs
- **Safety:** Understanding prevents misuse and divergence
- **Guidance:** Clear 3-phase migration path with effort estimates
- **Accountability:** Decision is formally recorded in ADR

The documentation will help the team make informed decisions about when and how to refactor this architecture in the future.
