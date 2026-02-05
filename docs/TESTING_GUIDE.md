# Container Management - Testing Guide

## Test Environment Setup

1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Load the sample scenario or create a new one

## Test Cases

### Test Case 1: Visual Verification - No Duplicate Nodes

**Objective**: Verify that steps inside containers don't appear as duplicate nodes

**Steps**:
1. Open a scenario that has a Loop or Group with steps inside
2. Observe the flow canvas

**Expected Result**:
- Steps inside Loop/Group appear ONLY inside the container node
- No duplicate standalone nodes for contained steps
- Container node shows the correct count of internal steps

**Status**: 🔴 TO TEST

---

### Test Case 2: Move Step into Loop

**Objective**: Add a standalone step to a Loop container

**Setup**:
1. Create a new scenario
2. Add a Loop step (name: "Test Loop")
3. Add a Request step (name: "API Call 1")

**Steps**:
1. Click on "API Call 1" step in the flow
2. In Step Editor, find "Container Management" section
3. From dropdown, select "Test Loop"
4. Observe the flow canvas

**Expected Result**:
- "API Call 1" disappears from main canvas
- "Test Loop" node now shows "1 step in loop"
- Clicking "Test Loop" shows "API Call 1" inside
- Loop editor shows "API Call 1" in its step list

**Status**: 🔴 TO TEST

---

### Test Case 3: Move Step into Group

**Objective**: Add a standalone step to a Group container

**Setup**:
1. Create a Group step (name: "Setup Group")
2. Create a Request step (name: "Init Request")

**Steps**:
1. Select "Init Request"
2. In Container Management, select "Setup Group"
3. Observe changes

**Expected Result**:
- "Init Request" moves inside "Setup Group"
- Group node displays the step internally
- Group footer shows correct step count

**Status**: 🔴 TO TEST

---

### Test Case 4: Remove Step from Loop (Step Editor Method)

**Objective**: Extract a step from a Loop using the Step Editor

**Setup**:
1. Create a Loop with at least one step inside

**Steps**:
1. Click on the step inside the loop
2. In Step Editor, observe "Container Management" section
3. Verify alert shows "This step is currently inside: [Loop Name]"
4. Click "Remove from loop" button
5. Confirm in the dialog

**Expected Result**:
- Confirmation dialog appears with clear message
- After confirming, step appears as standalone node in canvas
- Loop's step count decreases
- Step retains its position (or appears near loop)

**Status**: 🔴 TO TEST

---

### Test Case 5: Remove Step from Loop (Container Editor Method)

**Objective**: Extract a step from a Loop using the Loop Editor

**Setup**:
1. Create a Loop with 2+ steps inside

**Steps**:
1. Click on the Loop container
2. In Loop Editor, find the step list
3. Click the warning-colored delete icon next to a step
4. Confirm in the dialog

**Expected Result**:
- Confirmation dialog appears
- Step becomes standalone after confirmation
- Step appears in main canvas
- Remaining steps stay in loop

**Status**: 🔴 TO TEST

---

### Test Case 6: Remove Step from Group (Both Methods)

**Objective**: Verify removal works for Group containers

**Steps**: Same as Test Cases 4 & 5, but with Group instead of Loop

**Expected Result**:
- Same behavior as Loop removal
- Confirmation messages mention "group" instead of "loop"

**Status**: 🔴 TO TEST

---

### Test Case 7: No Available Containers Message

**Objective**: Verify helpful message when no containers exist

**Setup**:
1. Create a scenario with only Request and Condition steps
2. No Loop or Group steps

**Steps**:
1. Select any step
2. Look at Container Management section

**Expected Result**:
- Dropdown shows "No available containers"
- Alert message: "Create a Loop or Group step first..."

**Status**: 🔴 TO TEST

---

### Test Case 8: Move Step Between Containers

**Objective**: Move a step from one container to another

**Setup**:
1. Create Loop A with Request Step 1 inside
2. Create Group B (empty)

**Steps**:
1. Select Request Step 1 (inside Loop A)
2. Click "Remove from loop", confirm
3. With step still selected, use dropdown to select "Group B"
4. Observe changes

**Expected Result**:
- Step moves from Loop A to Group B
- Loop A step count decreases
- Group B step count increases
- Step appears inside Group B

**Status**: 🔴 TO TEST

---

### Test Case 9: Edge Preservation

**Objective**: Verify edges remain connected when moving steps

**Setup**:
1. Create: Request A → Request B → Request C
2. Create Loop D (empty)

**Steps**:
1. Move Request B into Loop D
2. Observe edges

**Expected Result**:
- Edge from A to B remains (A connects to Loop D)
- Edge from B to C remains (Loop D connects to C)
- No broken edges

**Status**: 🔴 TO TEST

---

### Test Case 10: Parent Container Detection

**Objective**: Verify system correctly identifies parent container

**Setup**:
1. Create nested structure:
   - Loop X contains Request A
   - Group Y contains Request B
   - Request C is standalone

**Steps**:
1. Select Request A → verify shows "inside: Loop X"
2. Select Request B → verify shows "inside: Group Y"
3. Select Request C → verify shows move dropdown (no parent)

**Expected Result**:
- Each step correctly shows its parent (or none)
- Alert messages display correct container names

**Status**: 🔴 TO TEST

---

### Test Case 11: Self-Reference Prevention

**Objective**: Verify containers can't be moved into themselves

**Setup**:
1. Create Loop A
2. Create Group B

**Steps**:
1. Select Loop A
2. Check if Container Management section appears

**Expected Result**:
- Container Management section does NOT appear for Loop/Group steps
- Only Request and Condition steps can be moved

**Status**: 🔴 TO TEST

---

### Test Case 12: Multiple Steps in Same Container

**Objective**: Verify multiple steps can exist in one container

**Setup**:
1. Create Loop A
2. Create Request 1, Request 2, Request 3

**Steps**:
1. Move all three requests into Loop A one by one
2. Observe Loop A

**Expected Result**:
- All three steps appear inside Loop A
- Correct execution order shown
- Footer shows "3 steps in loop"

**Status**: 🔴 TO TEST

---

### Test Case 13: Confirmation Dialog Cancellation

**Objective**: Verify cancel action in confirmation dialog

**Setup**:
1. Create Loop with Request inside

**Steps**:
1. Select Request
2. Click "Remove from loop"
3. Click "Cancel" in confirmation dialog

**Expected Result**:
- Dialog closes
- No changes to container
- Step remains inside Loop

**Status**: 🔴 TO TEST

---

### Test Case 14: Step Reordering Within Container

**Objective**: Verify step order controls still work

**Setup**:
1. Create Loop with 3 steps inside

**Steps**:
1. Select Loop
2. Use up/down arrows to reorder steps
3. Observe changes

**Expected Result**:
- Steps reorder correctly
- Execution order updates
- No side effects on container membership

**Status**: 🔴 TO TEST

---

### Test Case 15: Complex Scenario - Mixed Containers

**Objective**: Test realistic complex scenario

**Setup**:
1. Create structure:
   ```
   Request A (standalone)
   → Loop B (contains: Request C, Condition D)
   → Group E (contains: Request F, Request G)
   → Request H (standalone)
   ```

**Steps**:
1. Verify visual display is correct
2. Move Request C out of Loop B
3. Move Request A into Loop B
4. Remove Request F from Group E
5. Move Request H into Group E

**Expected Result**:
- All operations succeed
- No duplicate nodes at any point
- Container counts update correctly
- Edges remain connected
- Final structure is correct

**Status**: 🔴 TO TEST

---

## Performance Tests

### Test Case P1: Large Number of Steps

**Objective**: Verify performance with many steps

**Setup**:
1. Create Loop with 50 steps inside

**Steps**:
1. Measure page load time
2. Measure time to add one more step to loop
3. Observe UI responsiveness

**Expected Result**:
- Page loads in < 3 seconds
- Adding step takes < 500ms
- UI remains responsive

**Status**: 🔴 TO TEST

---

### Test Case P2: Many Containers

**Objective**: Verify performance with many containers

**Setup**:
1. Create 20 Loop containers, each with 5 steps

**Steps**:
1. Observe canvas rendering
2. Try moving a step between containers
3. Measure operation time

**Expected Result**:
- Canvas renders smoothly
- Move operation completes in < 1 second
- No lag when selecting steps

**Status**: 🔴 TO TEST

---

## Browser Compatibility Tests

Test all cases on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Regression Tests

Verify existing functionality still works:
- [ ] Creating steps
- [ ] Deleting steps
- [ ] Connecting steps with edges
- [ ] Editing step properties
- [ ] Executing scenarios
- [ ] Saving/loading scenarios

---

## Bug Report Template

```markdown
**Test Case**: [Number and name]
**Browser**: [Browser name and version]
**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:

**Actual Result**:

**Screenshots**: [If applicable]

**Console Errors**: [If any]
```

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1 - No Duplicates | 🔴 TO TEST | |
| TC2 - Move to Loop | 🔴 TO TEST | |
| TC3 - Move to Group | 🔴 TO TEST | |
| TC4 - Remove (Editor) | 🔴 TO TEST | |
| TC5 - Remove (Container) | 🔴 TO TEST | |
| TC6 - Remove Group | 🔴 TO TEST | |
| TC7 - No Containers | 🔴 TO TEST | |
| TC8 - Between Containers | 🔴 TO TEST | |
| TC9 - Edge Preservation | 🔴 TO TEST | |
| TC10 - Parent Detection | 🔴 TO TEST | |
| TC11 - Self-Reference | 🔴 TO TEST | |
| TC12 - Multiple Steps | 🔴 TO TEST | |
| TC13 - Cancel Dialog | 🔴 TO TEST | |
| TC14 - Reordering | 🔴 TO TEST | |
| TC15 - Complex Scenario | 🔴 TO TEST | |
| P1 - Large Number | 🔴 TO TEST | |
| P2 - Many Containers | 🔴 TO TEST | |

Legend:
- 🔴 TO TEST - Not yet tested
- 🟡 IN PROGRESS - Currently testing
- 🟢 PASSED - Test passed
- 🔴 FAILED - Test failed
