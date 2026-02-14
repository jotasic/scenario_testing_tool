# ADR 0001: Defer Edges/Branches Data Model Normalization

**Date:** 2026-02-14
**Status:** Accepted
**Author:** Development Team
**Version:** 1.0

## Context

The scenario flow graph topology is currently stored in two separate data structures that must be kept synchronized bidirectionally:

1. **`scenario.edges[]`** - React Flow's visualization data model
2. **`branch.nextStepId` and `step.stepIds`** - Execution engine's control flow data model

### Current Data Structure

```
Scenario
├── edges: ScenarioEdge[]
│   ├── id: "edge_1"
│   ├── sourceStepId: "step_1"
│   ├── targetStepId: "step_2"
│   └── sourceHandle: "branch_abc"
│
└── steps: Step[]
    └── Step (ConditionStep)
        ├── id: "step_1"
        └── branches: Branch[]
            └── Branch
                ├── id: "branch_abc"
                └── nextStepId: "step_2"  <-- DUPLICATE OF edge.targetStepId
```

### Synchronization Points

The dual representation is currently synchronized bidirectionally in `src/store/scenariosSlice.ts`:

- **Line 216-240:** `addEdge` reducer - Adds edge AND updates `branch.nextStepId`
- **Line 280-321:** `deleteEdge` reducer - Removes edge AND clears `branch.nextStepId`
- **Line 117-127:** `deleteStep` reducer - Clears dangling references when step is deleted

### Why Two Representations?

**React Flow Requirement:**
- React Flow's internal API expects edges in a separate array
- Standard practice in graph visualization libraries
- Simplifies edge rendering, styling, and manipulation

**Execution Engine Requirement:**
- `src/engine/scenarioExecutor.ts` (lines 783, 787, 794, 798) directly reads `branch.nextStepId`
- More convenient for sequential control flow logic
- Would require significant refactoring of execution engine to use edges instead

## Decision

**We defer normalizing the data model to a single source of truth.**

Instead of refactoring immediately, we:

1. **Maintain the current dual representation** with proper bidirectional sync
2. **Add comprehensive documentation** explaining the trade-offs (TECHNICAL_DEBT.md, inline JSDoc)
3. **Establish a clear migration path** for future refactoring (3 phases: validation, normalization, testing)
4. **Mark as technical debt** to be addressed in a future sprint when:
   - Edge manipulation becomes more complex
   - Team size or codebase grows
   - New features require frequent topology changes

## Rationale

### Why Not Refactor Now?

**Risk vs. Benefit:**
- **Risk:** High - Execution engine touches many parts, easy to introduce bugs
- **Benefit:** Medium - Current sync works, no urgent failures
- **Effort:** 16-32 hours of development and testing
- **ROI:** Low in short term, medium in long term

**Current Solution is Adequate:**
- Sync logic is well-centralized in one file (`scenariosSlice.ts`)
- Bidirectional sync covers all cases (add, delete, step deletion)
- No known bugs or user-facing issues from dual representation
- Code is documented with clear comments on why both exist

**Refactoring Requires Coordination:**
- Must carefully refactor execution engine
- Requires comprehensive test coverage
- Risk of regression in execution logic
- Better to do incrementally with clear phases

### Phases for Future Refactoring

**Phase 1: Validation (2-4 hours)**
- Add runtime validation to detect sync divergence
- Instrument scenario loading to catch corruption
- Create diagnostic tools for debugging inconsistencies

**Phase 2: Normalize (8-16 hours)**
- Choose single source of truth (edges or step properties)
- Create conversion layer from chosen source to derived representation
- Remove dual sync from reducers
- Add derived data computation to selectors

**Phase 3: Testing (4-8 hours)**
- Comprehensive unit tests for edge sync
- Integration tests with execution engine
- Performance benchmarks to ensure no regression

## Consequences

### Short Term (Current)
**Positive:**
- Stability - No risky refactor needed for current features
- Clarity - Documentation makes the tradeoff explicit for new developers
- Maintainability - Clear JSDoc in reducers explains why sync is needed

**Negative:**
- Code Complexity - Must maintain sync in two places
- Cognitive Load - Developers must understand dual representation
- Technical Debt - Known issue that should be tracked

### Medium Term (1-2 Quarters)
**Positive:**
- Foundation - Documentation provides clear path forward
- Low Risk - No changes to working execution logic
- Flexibility - Can prioritize based on actual pain points

**Negative:**
- Deferred Work - Doesn't address the root issue
- Potential Bugs - If sync logic has gaps, issues compound
- Onboarding Cost - New developers need education on dual model

### Long Term (3+ Quarters)
**Positive:**
- Cleaner Codebase - Eventually refactored to single source
- Better Testing - Phase 3 adds comprehensive test coverage
- Improved Performance - Potential for optimization once normalized

**Negative:**
- Technical Debt Compounds - More code built on unstable foundation
- Larger Refactor - If issues occur, fixes become more complex
- Opportunity Cost - Team time spent maintaining rather than innovating

## Alternatives Considered

### Alternative 1: Normalize to Edges-Only

**Approach:** Keep `scenario.edges` as single source, derive step properties at runtime

**Pros:**
- Cleaner data model - Single truth
- Better for UI - React Flow naturally works with edges
- Prevents divergence - No sync needed

**Cons:**
- Breaking change - Requires rewriting execution engine
- Performance - Must compute step properties on every access
- Caching complexity - Need memoization for performance

**Effort:** 12-20 hours

### Alternative 2: Normalize to Step Properties-Only

**Approach:** Keep `branch.nextStepId` as source, generate edges for React Flow

**Pros:**
- Simpler for execution - Engine already uses this model
- Better semantics - Steps own their outgoing connections
- Consistent with intent - Control flow defined in steps

**Cons:**
- Breaking change - React Flow integration layer needed
- Conversion overhead - Must generate edges before rendering
- Graph operations harder - Can't easily manipulate edges

**Effort:** 12-20 hours

### Alternative 3: Refactor Now

**Approach:** Choose one source immediately and implement Phase 2

**Pros:**
- Eliminates debt - Cleaner long-term codebase
- Prevents divergence - Single source guarantees consistency
- Faster in future - No sync overhead

**Cons:**
- High risk - Large refactor of execution engine
- High effort - 16-32 hours with full testing
- High opportunity cost - Blocks other features
- Uncertain outcome - May discover hidden issues

**Why Not Chosen:** Risk/reward ratio not favorable for current project state

## When to Revisit This Decision

### Conditions That Would Trigger Refactoring

1. **Stability Issues (CRITICAL)**
   - Edge and branch sync diverge in production
   - Users report unexplained execution errors
   - Multiple sync-related bugs in single sprint

2. **Feature Complexity (HIGH)**
   - New features require frequent edge mutations
   - UI enhancements for graph editing (reordering, reconnecting)
   - Need for real-time graph analysis/validation
   - Plans to add visual graph transformations

3. **Team Growth (MEDIUM)**
   - Team size >5 developers
   - Onboarding cost becomes significant
   - Multiple bugs from misunderstanding dual model

4. **Architecture Evolution (MEDIUM)**
   - Plan to support multiple execution engines
   - Need to optimize execution performance
   - Integration with external graph libraries

### Timeline

- **Q1 2026:** Monitor for issues, gather feedback
- **Q2 2026:** If no critical issues, prioritize Phase 1 (validation)
- **Q3 2026:** Phase 2 (normalization) if Phase 1 reveals problems
- **Q4 2026+:** Full normalization with Phase 3 (testing)

### How to Track

1. **Monitor sync bugs** - Tag issues with `technical-debt/dual-source`
2. **Track divergence** - Add error tracking for validation failures
3. **Developer feedback** - Collect feedback from team on complexity
4. **Effort tracking** - Log time spent on sync-related work

## Implementation

### Changes Made (This Decision)

1. **Documentation**
   - `TECHNICAL_DEBT.md` - Detailed analysis of problem and solutions
   - `src/store/scenariosSlice.ts` - JSDoc comments on `addEdge` and `deleteEdge`
   - This ADR - Decision rationale

2. **No Code Changes**
   - Existing sync logic remains unchanged
   - No refactoring at this time
   - Clear path documented for future

### Future Implementation (When Revisited)

See Phase 1-3 in TECHNICAL_DEBT.md for detailed implementation plans:
- Validation layer for detecting divergence
- Conversion functions for chosen single source
- Comprehensive test suite

## References

- **TECHNICAL_DEBT.md** - Detailed technical analysis
- **src/store/scenariosSlice.ts:171-271** - Sync implementation
- **src/engine/scenarioExecutor.ts:783-798** - Where step properties are used
- **src/types/scenario.ts** - ScenarioEdge definition
- **src/types/step.ts** - Step and Branch definitions
- **src/types/branch.ts** - Branch definition

## Approval

- **Reviewed by:** (Development Team)
- **Approved by:** (Technical Lead)
- **Date:** 2026-02-14

## Comments

This decision reflects a pragmatic approach: document the technical debt, establish a clear migration path, and defer refactoring until the cost/benefit ratio is more favorable. The dual representation is a known tradeoff, not a hidden problem. Future developers will understand the reasoning and have a clear roadmap for improvement.
