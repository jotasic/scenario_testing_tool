# How to Use the Technical Debt Documentation

**Created:** 2026-02-14
**For:** All developers working with the scenario tool

## Quick Navigation

### I'm new to the project, where do I start?
1. Read: `docs/adr/0001-defer-edges-normalization.md` - **Context** section
2. Then read: `TECHNICAL_DEBT.md` - **Problem Description** section
3. Ask yourself: Do I need deeper details?
   - If YES: Continue with TECHNICAL_DEBT.md sections
   - If NO: Use IDE hover to see JSDoc comments

### I'm working on the edges/branches code, what should I know?
1. Read: `src/store/scenariosSlice.ts` lines 171-213 (addEdge JSDoc)
2. Read: `src/store/scenariosSlice.ts` lines 275-308 (deleteEdge JSDoc)
3. If still unclear, read: `TECHNICAL_DEBT.md` - **Current Synchronization** section

### I found a bug related to edge/branch sync
1. Check: `TECHNICAL_DEBT.md` - **Known Issues and Risks** section
2. Check: `TECHNICAL_DEBT.md` - **Example Problematic Scenarios** section
3. Reference: `ADR 0001` - **When to Revisit This Decision** section

### I'm asked to refactor the edge/branch code
1. Read: `ADR 0001` - Full document
2. Study: `TECHNICAL_DEBT.md` - **Future Migration Path** section
3. Reference: `TECHNICAL_DEBT.md` - **Phase 1/2/3** for detailed steps
4. Plan: Use 16-32 hour estimate from documentation

### I'm reviewing code that touches edges or branches
1. Check: JSDoc comments in `scenariosSlice.ts`
2. Verify: Edge is added/deleted properly
3. Verify: Corresponding step property is synced
4. Reference: `TECHNICAL_DEBT.md` - **Current Synchronization** section

## Document Structure

### TECHNICAL_DEBT.md
**Best for:** Deep technical understanding

- **Problem Description** - What is the issue?
- **Why It Exists** - Why is there duplication?
- **Current Synchronization Mechanism** - How does it work now?
- **Known Issues and Risks** - What can go wrong?
- **Example Problematic Scenarios** - Show real failures
- **Future Migration Path** - How to fix it?
- **When to Address This** - Should we fix it now?

**Read time:** 15-20 minutes
**Depth:** Technical
**Audience:** Developers, architects

### ADR 0001
**Best for:** Understanding the decision and rationale

- **Context** - What's the situation?
- **Decision** - What did we decide?
- **Rationale** - Why this decision?
- **Consequences** - What are the impacts?
- **Alternatives Considered** - Why not other options?
- **When to Revisit** - What triggers revisiting?
- **Implementation** - What changed?

**Read time:** 10-15 minutes
**Depth:** Strategic
**Audience:** Architects, leads, team members

### scenariosSlice.ts JSDoc
**Best for:** Quick reference while coding

- **addEdge** (lines 171-213)
  - Explains dual source pattern
  - Lists handle types
  - Documents risks
  - References deeper documentation

- **deleteEdge** (lines 275-308)
  - Explains complementary cleanup
  - Shows failure scenario
  - Explains why order matters
  - References deeper documentation

**Read time:** 2-3 minutes
**Depth:** Quick reference
**Audience:** Developers using these functions

## Common Scenarios

### Scenario 1: Adding a new edge type
1. Check JSDoc in `scenariosSlice.ts` for handle types
2. Understand sync requirement from `TECHNICAL_DEBT.md`
3. Implement both edge addition AND step property update
4. Add test case for the new handle type

### Scenario 2: Debugging sync divergence
1. Check "Known Issues and Risks" in `TECHNICAL_DEBT.md`
2. Check "Example Problematic Scenarios" for similar case
3. Look for the missing sync in either:
   - Edge was added but step property wasn't updated
   - Step property was updated but edge wasn't synced
   - Edge was deleted but step property wasn't cleared
4. Reference "Current Synchronization Mechanism" to fix

### Scenario 3: Planning refactor
1. Read full `ADR 0001` for context
2. Study "Future Migration Path" in `TECHNICAL_DEBT.md`
3. Choose Phase 1/2/3 approach
4. Review "When to Revisit" triggers to assess if now is right time
5. Plan using the 16-32 hour estimate
6. Timeline: Refer to `ADR 0001` for Q1-Q4 2026 suggestions

### Scenario 4: Onboarding new team member
1. Give them `ADR 0001` Context section
2. Have them read `TECHNICAL_DEBT.md` Problem section
3. Show them JSDoc comments in `scenariosSlice.ts`
4. Pair program on a sync operation to see it in action
5. Answer questions with reference to documentation

## Key Takeaways

### The Pattern
- Flow topology is stored in TWO places
- They MUST stay synchronized
- Sync happens in reducers (addEdge, deleteEdge, deleteStep)

### The Tradeoff
- React Flow needs edges in separate array
- Execution engine uses branch.nextStepId directly
- Refactoring either would be expensive
- Current sync is working and well-documented

### The Risk
- If sync is incomplete, divergence occurs
- No runtime validation to catch it
- Can cause confusing bugs
- But documented so you know what to look for

### The Path Forward
- Not refactoring now (ROI too low)
- Will revisit if certain triggers occur
- When refactoring, use Phase 1-3 plan
- Timeline flexibility (Q1-Q4 2026)

## Tips for Using Documentation

### When You're Confused
1. Start with the JSDoc in the code you're looking at
2. If that's not enough, read the relevant TECHNICAL_DEBT.md section
3. If still unclear, read the ADR 0001 Context section
4. Ask your team lead, referencing the docs

### When You're Making Changes
1. Check the relevant JSDoc before changing code
2. Verify your change maintains sync
3. If adding new code path, document it like existing code
4. Reference TECHNICAL_DEBT.md if your change is risky

### When You're Reviewing Code
1. Check reviewer checklist:
   - Does edge addition include step property update?
   - Does edge deletion include step property cleanup?
   - Are all handle types handled?
   - Is the order correct (find before delete)?
2. Reference TECHNICAL_DEBT.md in code review comments
3. Point to specific line numbers in sync code

### When You're Debugging
1. Get the exact error/symptom
2. Check "Example Problematic Scenarios" in TECHNICAL_DEBT.md
3. Look for which part of sync failed:
   - Edge exists but step property doesn't?
   - Step property exists but edge doesn't?
   - Order of operations wrong?
4. Fix the specific sync operation
5. Prevent regression with test case

## Document Hierarchy

```
ADR 0001 (Strategic)
   ↓
   Explains the big picture decision
   When you should ask "why are we doing this?"

TECHNICAL_DEBT.md (Tactical)
   ↓
   Details the current implementation
   When you're asking "how does this work?"

scenariosSlice.ts JSDoc (Reference)
   ↓
   Quick explanation of specific functions
   When you're working on the code
```

## Checklist for Using Documentation Correctly

When touching edge/branch code:
- [ ] Read the relevant JSDoc first
- [ ] Understand the sync requirement
- [ ] Verify you're updating both representations
- [ ] Check the example sync patterns
- [ ] Test both add and delete operations
- [ ] Reference TECHNICAL_DEBT.md if uncertain

When reviewing code:
- [ ] Check for sync completeness
- [ ] Verify handle type handling
- [ ] Confirm operation order
- [ ] Reference documentation in comments
- [ ] Request test cases for sync

When debugging sync issues:
- [ ] Identify which representation is wrong
- [ ] Check for incomplete sync
- [ ] Review Current Synchronization section
- [ ] Look for similar patterns in Examples section
- [ ] Check for race conditions or undo/redo issues

## Questions and Answers

### Q: Why do we have this dual representation?
**A:** Read `TECHNICAL_DEBT.md` - **Why It Exists** section

### Q: What happens if sync fails?
**A:** Read `TECHNICAL_DEBT.md` - **Known Issues and Risks** section

### Q: Should we refactor this now?
**A:** Read `ADR 0001` - **Decision** and **Rationale** sections

### Q: When should we refactor?
**A:** Read `ADR 0001` - **When to Revisit** section

### Q: How do we refactor?
**A:** Read `TECHNICAL_DEBT.md` - **Future Migration Path** sections

### Q: What's the effort to refactor?
**A:** Read `TECHNICAL_DEBT.md` - **When to Address This** section (16-32 hours)

### Q: How do I use branches correctly?
**A:** Read `scenariosSlice.ts` JSDoc comments + `TECHNICAL_DEBT.md` sync section

## Getting Help

1. **Quick question while coding?** → Check JSDoc comments
2. **Need context?** → Read ADR 0001 Context section
3. **Need technical details?** → Read TECHNICAL_DEBT.md
4. **Can't find answer?** → Ask team lead, reference the docs
5. **Found a bug?** → Check Example Problematic Scenarios first

## Feedback and Updates

If documentation needs updates:
1. Check if it's still accurate (it should be for Phase 5)
2. Note what's confusing or incomplete
3. Create an issue: `technical-debt/documentation`
4. Reference the specific section that needs updating
5. Suggest improvement if you have one

---

**Remember:** Good documentation is a gift to your future self and your teammates. Use it. Respect it. Update it if needed.
