# Basic Tools Implementation Todo List

## Implementation Tasks

### Code Changes
- [ ] Add 6 tool cases to `executeSingleTool()` switch statement in `src/services/aiService.ts`
  - [ ] Add `moveShape` case
  - [ ] Add `resizeShape` case (with circle/rectangle logic)
  - [ ] Add `rotateShape` case
  - [ ] Add `duplicateShape` case
  - [ ] Add `deleteShape` case
  - [ ] Add `getCanvasState` case
- [ ] Add 6 new tool definitions to `getToolDefinitions()` in `src/services/aiService.ts`
  - [ ] Add `moveShape` tool definition
  - [ ] Add `resizeShape` tool definition
  - [ ] Add `rotateShape` tool definition
  - [ ] Add `duplicateShape` tool definition
  - [ ] Add `deleteShape` tool definition
  - [ ] Add `getCanvasState` tool definition
- [ ] Update `generateSuccessMessage()` method in `src/services/aiService.ts` to handle all 6 new tools
- [ ] Replace entire `src/utils/aiPrompts.ts` file with expanded version including manipulation examples

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
- [ ] Test 1: Move shape
  - Command: `testAI("create a blue rectangle at 500, 500")`
  - Command: `testAI("move the blue rectangle to the center")`
  - Expected: Rectangle moves to (2400, 2425)
  - Expected output: "✓ Moved shape to new position"

- [ ] Test 2: Resize rectangle
  - Command: `testAI("make it twice as big")`
  - Expected: Rectangle becomes 400×300 (from 200×150)
  - Expected output: "✓ Resized shape"

- [ ] Test 3: Resize circle
  - Command: `testAI("create a red circle at 1000, 1000")`
  - Command: `testAI("make the circle bigger")`
  - Expected: Circle radius increases to ~112 (1.5x from 75)
  - Expected output: "✓ Resized shape"

- [ ] Test 4: Rotate shape
  - Command: `testAI("rotate it 45 degrees")`
  - Expected: Circle rotates 45 degrees
  - Expected output: "✓ Rotated shape"

- [ ] Test 5: Duplicate shape
  - Command: `testAI("duplicate the red circle")`
  - Expected: Copy appears with 20px offset
  - Expected output: "✓ Duplicated shape"

- [ ] Test 6: Delete shape
  - Command: `testAI("delete the blue rectangle")`
  - Expected: Blue rectangle disappears
  - Expected output: "✓ Deleted shape"

### Context Awareness Tests (Tests 7-9)
- [ ] Test 7: "it" reference
  - Command: `testAI("create a green triangle at 1500, 1500")`
  - Command: `testAI("rotate it 90 degrees")`
  - Command: `testAI("duplicate it")`
  - Expected: Triangle rotates, then duplicates
  - Expected outputs: "✓ Rotated shape" → "✓ Duplicated shape"

- [ ] Test 8: Identify by color
  - Command: `testAI("create a yellow rectangle and a yellow circle")`
  - Command: `testAI("move the yellow rectangle to the top")`
  - Expected: Only rectangle moves (not circle)
  - Expected output: "✓ Moved shape to new position"

- [ ] Test 9: Multiple operations in sequence
  - Command: `testAI("create a blue circle at 2000, 2000")`
  - Command: `testAI("make it smaller")`
  - Command: `testAI("move it to the bottom-right")`
  - Command: `testAI("rotate it 180 degrees")`
  - Expected: Circle shrinks → moves → rotates
  - Expected outputs: 3 success messages

### Error Handling Tests (Tests 10-11)
- [ ] Test 10: Shape not found
  - Command: `testAI("move the purple hexagon to the left")`
  - Expected: AI responds that it can't find purple hexagon
  - Expected: Should not crash

- [ ] Test 11: Ambiguous reference with fallback
  - Command: `testAI("create 3 blue rectangles at random positions")`
  - Command: `testAI("move the blue rectangle to the center")`
  - Expected: AI picks most recent blue rectangle
  - Expected output: "✓ Moved shape to new position"

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
