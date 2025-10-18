# PRD: Keyboard Shortcuts for Copy and Paste Objects

**Feature:** Keyboard Shortcuts for Copy and Paste Operations

**Version:** 1.0

**Status:** Ready for Development

**Estimated Effort:** 3-4 hours

---

## 📋 Action Plan / Todo List

### Phase 1: Clipboard State Management (30 min)
- [ ] **Task 1.1**: Add clipboard state to Canvas.tsx
  - [ ] Add `clipboard` state variable
  - [ ] Add `PASTE_OFFSET` constant (20px)
  - [ ] Import necessary types
- [ ] **Task 1.2**: Update keyboard event listener
  - [ ] Enhance existing `handleKeyDown` function
  - [ ] Add preventDefault for Ctrl+C/V/A
  - [ ] Add dependency array updates
- [ ] **Task 1.3**: Test state management
  - [ ] Verify clipboard state updates
  - [ ] Check TypeScript compilation
  - [ ] Console log clipboard changes

### Phase 2: Copy Functionality (45 min)
- [ ] **Task 2.1**: Implement `handleCopyShape` function
  - [ ] Add function with proper dependencies
  - [ ] Find selected shape from shapes array
  - [ ] Store shape in clipboard state
  - [ ] Add error handling for missing shape
- [ ] **Task 2.2**: Add copy keyboard shortcut
  - [ ] Add Ctrl+C/Cmd+C detection
  - [ ] Call `handleCopyShape` when shortcut pressed
  - [ ] Prevent default browser copy behavior
- [ ] **Task 2.3**: Add visual feedback
  - [ ] Show "Shape copied to clipboard" toast
  - [ ] Test with different shape types
  - [ ] Verify clipboard state updates
- [ ] **Task 2.4**: Test copy functionality
  - [ ] Test copy with rectangle
  - [ ] Test copy with circle
  - [ ] Test copy with triangle
  - [ ] Test copy with text shape
  - [ ] Verify no shape selected shows appropriate message

### Phase 3: Paste Functionality (60 min)
- [ ] **Task 3.1**: Implement `handlePasteShape` function
  - [ ] Add function with proper dependencies
  - [ ] Check clipboard exists
  - [ ] Calculate paste position with offset
  - [ ] Create shape data for each clipboard shape
- [ ] **Task 3.2**: Handle all shape types in paste
  - [ ] Rectangle: basic properties
  - [ ] Circle: include radius property
  - [ ] Triangle: include triangle-specific properties
  - [ ] Text: include text, fontSize, fontWeight, fontStyle, textDecoration
- [ ] **Task 3.3**: Add paste keyboard shortcut
  - [ ] Add Ctrl+V/Cmd+V detection
  - [ ] Call `handlePasteShape` when shortcut pressed
  - [ ] Prevent default browser paste behavior
- [ ] **Task 3.4**: Auto-select pasted shape
  - [ ] Set `selectedShapeId` to new shape ID
  - [ ] Show success toast with count
  - [ ] Handle multiple shapes in clipboard
- [ ] **Task 3.5**: Test paste functionality
  - [ ] Test paste with rectangle
  - [ ] Test paste with circle
  - [ ] Test paste with triangle
  - [ ] Test paste with text (verify formatting preserved)
  - [ ] Test empty clipboard shows appropriate message
  - [ ] Verify pasted shape is selected
  - [ ] Verify 20px offset applied

### Phase 4: Additional Shortcuts (45 min)
- [ ] **Task 4.1**: Implement Select All (Ctrl+A/Cmd+A)
  - [ ] Add `handleSelectAll` function
  - [ ] Select first available shape
  - [ ] Show "Selected shape" toast
  - [ ] Handle empty canvas gracefully
- [ ] **Task 4.2**: Implement Delete (Delete/Backspace)
  - [ ] Add `handleDeleteSelected` function
  - [ ] Use existing `canvasService.deleteShape`
  - [ ] Clear selection after delete
  - [ ] Show "Shape deleted" toast
- [ ] **Task 4.3**: Implement Deselect (Escape)
  - [ ] Clear `selectedShapeId` on Escape
  - [ ] Maintain existing Escape behavior for drawing
  - [ ] Handle both cases properly
- [ ] **Task 4.4**: Test additional shortcuts
  - [ ] Test Ctrl+A selects first shape
  - [ ] Test Delete removes selected shape
  - [ ] Test Escape deselects shape
  - [ ] Test Escape still cancels drawing
  - [ ] Test shortcuts work when canvas focused

### Phase 5: Integration & Testing (30 min)
- [ ] **Task 5.1**: Multi-user testing
  - [ ] Open 2+ browser windows
  - [ ] User A copies shape → User B sees no change (clipboard local)
  - [ ] User A pastes shape → User B sees new shape
  - [ ] User B copies different shape → independent clipboard
  - [ ] Test concurrent operations
- [ ] **Task 5.2**: Clipboard persistence testing
  - [ ] Copy shape, create other shapes, paste original
  - [ ] Copy different shape, verify new shape pastes
  - [ ] Test clipboard survives shape deletions
- [ ] **Task 5.3**: Real-time sync verification
  - [ ] Measure sync latency with DevTools
  - [ ] Verify all operations sync <100ms
  - [ ] Test with multiple users simultaneously
- [ ] **Task 5.4**: Edge case testing
  - [ ] Test with no shapes on canvas
  - [ ] Test with shapes locked by other users
  - [ ] Test keyboard shortcuts when canvas not focused
  - [ ] Test rapid copy/paste operations
- [ ] **Task 5.5**: Performance testing
  - [ ] Create 20+ shapes, test shortcuts
  - [ ] Verify 60 FPS maintained
  - [ ] Check for memory leaks
  - [ ] Test with large text shapes

### Phase 6: Final Verification & Documentation (15 min)
- [ ] **Task 6.1**: Complete functionality checklist
  - [ ] ✅ Ctrl+C/Cmd+C copies selected shape
  - [ ] ✅ Ctrl+V/Cmd+V pastes with offset
  - [ ] ✅ Ctrl+A/Cmd+A selects first shape
  - [ ] ✅ Delete/Backspace removes selected shape
  - [ ] ✅ Escape deselects shape
  - [ ] ✅ All shape types supported
  - [ ] ✅ Real-time sync works
  - [ ] ✅ Visual feedback provided
- [ ] **Task 6.2**: Code quality check
  - [ ] TypeScript compilation successful
  - [ ] No console errors
  - [ ] Code follows existing patterns
  - [ ] Functions properly documented
- [ ] **Task 6.3**: Final testing
  - [ ] Run full test suite
  - [ ] Test in production build
  - [ ] Verify all success criteria met
  - [ ] Document any issues found

---

## 🎯 Success Criteria Checklist

### Core Functionality
- [ ] **Ctrl+C/Cmd+C** copies selected shape to clipboard
- [ ] **Ctrl+V/Cmd+V** pastes copied shape with offset
- [ ] **Ctrl+A/Cmd+A** selects first available shape
- [ ] **Delete/Backspace** deletes selected shape
- [ ] **Escape** deselects current shape

### User Experience
- [ ] Copy operation shows success toast
- [ ] Paste operation shows success toast with count
- [ ] Pasted shapes appear with 20px offset
- [ ] Pasted shape is automatically selected
- [ ] Keyboard shortcuts work when canvas is focused

### Technical Requirements
- [ ] All shape types support copy/paste (rectangle, circle, triangle, text)
- [ ] Real-time sync works for all operations (<100ms)
- [ ] No conflicts with existing Escape handler for drawing
- [ ] Clipboard persists during session
- [ ] Multi-user scenarios work correctly

### Quality Assurance
- [ ] No TypeScript compilation errors
- [ ] No console errors during operations
- [ ] 60 FPS maintained with multiple shapes
- [ ] Memory usage stable during extended use
- [ ] All edge cases handled gracefully

---

## 🧪 Testing Scenarios Checklist

### Basic Functionality
- [ ] **Test 1**: Create rectangle → Ctrl+C → Ctrl+V → verify duplicate with offset
- [ ] **Test 2**: Create circle → copy/paste → verify perfect circle maintained
- [ ] **Test 3**: Create triangle → copy/paste → verify triangle properties preserved
- [ ] **Test 4**: Create text → copy/paste → verify formatting preserved

### Keyboard Shortcuts
- [ ] **Test 5**: Select shape → Delete → verify shape removed
- [ ] **Test 6**: Select shape → Escape → verify deselected
- [ ] **Test 7**: Ctrl+A → verify first shape selected
- [ ] **Test 8**: No shape selected → Ctrl+C → verify appropriate message

### Multi-User Testing
- [ ] **Test 9**: User A copies → User B sees no change (clipboard local)
- [ ] **Test 10**: User A pastes → User B sees new shape
- [ ] **Test 11**: Both users copy/paste independently → no conflicts
- [ ] **Test 12**: Concurrent operations → no race conditions

### Edge Cases
- [ ] **Test 13**: Empty canvas → Ctrl+A → verify no selection
- [ ] **Test 14**: No clipboard → Ctrl+V → verify appropriate message
- [ ] **Test 15**: Shape deleted during copy → handle gracefully
- [ ] **Test 16**: Canvas not focused → shortcuts don't interfere

---

## 📝 Implementation Notes

### Code Changes Required
- **File**: `app/src/components/Canvas/Canvas.tsx`
- **New State**: `clipboard`, `PASTE_OFFSET`
- **New Functions**: `handleCopyShape`, `handlePasteShape`, `handleSelectAll`, `handleDeleteSelected`
- **Modified**: Enhanced `handleKeyDown` function

### Dependencies
- Uses existing `canvasService.duplicateShape()` method
- Uses existing `canvasService.deleteShape()` method
- Integrates with existing lock system
- Works with all existing shape types

### Performance Considerations
- Clipboard stored in component state (lightweight)
- No additional Firestore operations
- Minimal impact on existing functionality
- Real-time sync maintained

---

## 🚀 Ready to Start?

**Prerequisites:**
- [ ] Canvas component is working
- [ ] Shape creation/selection works
- [ ] Toast system is functional
- [ ] Real-time sync is operational

**First Task:**
Start with **Task 1.1** - Add clipboard state to Canvas.tsx

**Estimated Timeline:**
- Phase 1: 30 minutes
- Phase 2: 45 minutes  
- Phase 3: 60 minutes
- Phase 4: 45 minutes
- Phase 5: 30 minutes
- Phase 6: 15 minutes
- **Total: ~3.5 hours**

**Success Metrics:**
- All checkboxes completed ✅
- All success criteria met ✅
- All test scenarios pass ✅
- No regressions in existing functionality ✅

---

*This action plan provides a systematic approach to implementing keyboard shortcuts for copy and paste operations. Each task is designed to be completed in sequence, with clear success criteria and testing steps.*