# Basic Tools Implementation Todo List

## Implementation Tasks

### Code Changes
- [x] Add 6 tool cases to `executeSingleTool()` switch statement in `src/services/aiService.ts`
  - [x] Add `moveShape` case
  - [x] Add `resizeShape` case (with circle/rectangle logic)
  - [x] Add `rotateShape` case
  - [x] Add `duplicateShape` case
  - [x] Add `deleteShape` case
  - [x] Add `getCanvasState` case
- [x] Add 6 new tool definitions to `getToolDefinitions()` in `src/services/aiService.ts`
  - [x] Add `moveShape` tool definition
  - [x] Add `resizeShape` tool definition
  - [x] Add `rotateShape` tool definition
  - [x] Add `duplicateShape` tool definition
  - [x] Add `deleteShape` tool definition
  - [x] Add `getCanvasState` tool definition
- [x] Update `generateSuccessMessage()` method in `src/services/aiService.ts` to handle all 6 new tools
- [x] Replace entire `src/utils/aiPrompts.ts` file with expanded version including manipulation examples
- [x] Add missing `duplicateShape` and `deleteShape` methods to `src/services/canvasService.ts`

## Core Testing Tasks

### Functional Verification
- [ ] Verify `moveShape` works (by color, by type)
- [ ] Verify `resizeShape` works (rectangles, circles, with size helpers)
- [ ] Verify `rotateShape` works (all shape types)
- [ ] Verify `duplicateShape` works (correct offset)
- [ ] Verify `deleteShape` works (by identifier)
- [ ] Verify `getCanvasState` returns shapes correctly

## Context Awareness Testing

### Reference Resolution
- [ ] Test "it"/"that" references work
- [ ] Test color identification works ("the blue one")
- [ ] Test type identification works ("the circle")
- [ ] Test most recent shape logic works when ambiguous

## Test Command Verification

### Basic Manipulation Tests (Tests 1-6)
- [x] Test 1: Move shape
  - [x] Command: `testAI("create a blue rectangle at 500, 500")` ✅ PASSED
  - [x] Command: `testAI("move the blue rectangle to the center")` ✅ PASSED
  - Expected: Rectangle moves to (2400, 2425) ✅ ACHIEVED
  - Expected output: "✓ Moved shape to new position" ✅ ACHIEVED

- [x] Test 2: Resize rectangle
  - [x] Command: `testAI("make it twice as big")` ✅ PASSED
  - Expected: Rectangle becomes 400×300 (from 200×150) ✅ ACHIEVED
  - Expected output: "✓ Resized shape" ✅ ACHIEVED

- [x] Test 3: Resize circle ✅ PASSED
  - [x] Command: `testAI("create a red circle at 1000, 1000")` ✅ PASSED
  - [x] Command: `testAI("make the circle bigger")` ✅ PASSED
  - Expected: Circle radius increases to ~112 (1.5x from 75) ✅ ACHIEVED
  - Expected output: "✓ Resized shape" ✅ ACHIEVED
  - Fix: Updated system prompt with explicit circle resizing instructions ✅ WORKED

- [x] Test 4: Rotate shape ✅ PASSED
  - [x] Command: `testAI("rotate it 45 degrees")` ✅ PASSED
  - Expected: Circle rotates 45 degrees ✅ ACHIEVED
  - Expected output: "✓ Rotated shape" ✅ ACHIEVED
  - Fix 1: Changed offsetX/offsetY from 0 to -displayWidth/2, -displayHeight/2 for proper center rotation
  - Fix 2: Updated system prompt to use RELATIVE rotation (add to current rotation) instead of absolute
  - Fix 3: Added rotation values to canvas state summary so AI can see current rotation ✅ WORKING! ✅ WORKED

<!-- - [ ] Test 5: Duplicate shape
  - Command: `testAI("duplicate the red circle")`
  - Expected: Copy appears with 20px offset
  - Expected output: "✓ Duplicated shape"

- [ ] Test 6: Delete shape
  - Command: `testAI("delete the blue rectangle")`
  - Expected: Blue rectangle disappears
  - Expected output: "✓ Deleted shape" -->

### Context Awareness Tests (Tests 7-9)
- [ ] Test 7: "it" reference (PARTIAL - 2/3 commands tested)
  - [x] Command: `testAI("create a green triangle at 1500, 1500")` ✅ PASSED
  - [x] Command: `testAI("rotate it 90 degrees")` ✅ PASSED
  - [ ] Command: `testAI("duplicate it")` ⏳ PENDING (duplicate function not ready yet)
  - Expected: Triangle rotates, then duplicates
  - Expected outputs: "✓ Rotated shape" → "✓ Duplicated shape"

- [x] Test 8: Identify by color ✅ PASSED
  - [x] Command: `testAI("create a yellow rectangle and a yellow circle")` ✅ PASSED
  - [x] Command: `testAI("move the yellow rectangle to the top")` ✅ PASSED
  - Expected: Only rectangle moves (not circle) ✅ ACHIEVED
  - Expected output: "✓ Moved shape to new position" ✅ ACHIEVED

- [x] Test 9: Multiple operations in sequence ✅ PASSED
  - [x] Command: `testAI("create a blue circle at 2000, 2000")` ✅ PASSED
  - [x] Command: `testAI("make it smaller")` ✅ PASSED
  - [x] Command: `testAI("move it to the bottom-right")` ✅ PASSED
  - [x] Command: `testAI("rotate it 180 degrees")` ✅ PASSED
  - Expected: Circle shrinks → moves → rotates ✅ ACHIEVED
  - Expected outputs: 3 success messages ✅ ACHIEVED

### Error Handling Tests (Tests 10-11)
- [x] Test 10: Shape not found ✅ PASSED
  - [x] Command: `testAI("move the purple hexagon to the left")` ✅ PASSED
  - Expected: AI responds that it can't find purple hexagon ✅ ACHIEVED
  - Expected: Should not crash ✅ ACHIEVED
  - Result: Returns success: false with clear error message "I couldn't find the requested shape on the canvas." ✅ ACHIEVED

- [x] Test 11: Ambiguous reference with fallback ✅ PASSED
  - [x] Command: `testAI("create 3 blue rectangles at random positions")` ✅ PASSED
  - [x] Command: `testAI("move the blue rectangle to the center")` ✅ PASSED
  - Expected: AI picks most recent blue rectangle ✅ ACHIEVED
  - Expected output: "✓ Moved shape to new position" ✅ ACHIEVED

## Quality Checks

### Accuracy Verification
- [ ] Position calculations accurate (centered shapes truly centered)
- [ ] Size calculations correct (2x, 0.5x, 1.5x)
- [ ] Rotation works for all shape types
- [ ] Duplicate offset is consistent (20px)
- [ ] Error handling graceful (shape not found doesn't crash)
- [ ] Commands complete in <2 seconds

## Success Criteria Summary

### Must Pass
- [ ] All 6 new tools added to `executeSingleTool()` switch
- [ ] All 6 new tool definitions added to `getToolDefinitions()`
- [ ] System prompt updated with manipulation examples
- [ ] `generateSuccessMessage()` handles manipulation tools
- [ ] Can move shapes by color ("move the blue rectangle")
- [ ] Can resize shapes with size helpers ("twice as big")
- [ ] Can rotate shapes by degrees
- [ ] Can duplicate shapes
- [ ] Can delete shapes by identifier
- [ ] AI calls `getCanvasState()` before manipulation
- [ ] Context awareness works ("it", "that", color/type references)
- [ ] All 11 test commands pass
