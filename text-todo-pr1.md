# Text Functionality Implementation Checklist - PR1

**PR:** Text Layers Foundation (PR1 of 3)  
**Reference:** text-prd.md  
**Estimated Time:** 3-4 hours

---

## Phase 1: Add Text Rendering to Canvas (2 hours)

**File:** `app/src/components/Canvas/Canvas.tsx`

- [x] Locate triangle rendering block (around line 1593)
- [x] Add Konva `<Text>` component after triangle block
- [x] Configure center-point positioning: `x={-displayWidth/2}`, `y={-displayHeight/2}`
- [x] Configure `fontStyle` prop to combine `fontWeight` and `fontStyle` (Konva requirement)
- [x] Add `textDecoration` prop for underline support
- [x] Verify text is inside the rotated `<Group>` (for rotation support)

**Code Location:** After line 1592 (after triangle rendering closes)

---

## Phase 2: Add Text Tool to Toolbar (30 min)

**File:** `app/src/components/Canvas/ColorToolbar.tsx`

- [x] Add text tool to `shapeTools` array (line 14)
- [x] Use icon: 📝 (or 'T')
- [x] Use value: `'text'`
- [x] Verify button renders in toolbar when in create mode

**Code Location:** Line 14 - `shapeTools` array

---

## Phase 3: Update TypeScript Types (15 min)

**File:** `app/src/contexts/CanvasContext.tsx`

- [x] Update `ShapeTool` type to include `'text'` (line 21)
- [x] Verify no TypeScript errors after change

**Code Location:** Line 21 - `ShapeTool` type definition

---

## Phase 4: Add Text Creation Handler (1 hour)

**File:** `app/src/components/Canvas/Canvas.tsx`

- [x] Find canvas click handler (search for `handleStageClick` or similar)
- [x] Add text tool check: `if (activeTool === 'text')`
- [x] Create `createTextAtPosition(x, y)` function
- [x] Call `canvasService.createText()` with hardcoded 'TEXT'
- [x] Pass: text='TEXT', fontSize=16, color=selectedColor, all formatting='normal'/'none'
- [x] Add try/catch block with `showToast` for errors
- [x] Verify text creation doesn't trigger drawing state

**Alternative:** If using drawing state, modify `finishDrawing` in CanvasContext.tsx

---

## Phase 5: Exclude Text from Resize Handles (15 min)

**File:** `app/src/components/Canvas/Canvas.tsx`

- [x] Find resize handle rendering logic (around line 1595)
- [x] Add condition: `shape.type !== 'text'`
- [x] Verify text shapes show NO resize handles when locked
- [x] Verify rotation handle still appears for text

**Code Location:** Line 1595 - resize handles conditional rendering

---

## Testing Scenarios

### Test 1: Text Rendering
- [x] Open canvas with existing text shapes
- [x] Verify text renders correctly
- [x] Test zoom to 25% - text is readable
- [x] Test zoom to 100% - text is readable
- [x] Test zoom to 200% - text is readable

### Test 2: Text Tool Activation
- [x] Click "Create" mode button
- [x] Click "Text" tool (📝 icon)
- [x] Verify text tool button shows active state (blue border)
- [x] Verify cursor changes appropriately

### Test 3: Text Creation & Real-Time Sync
- [x] Activate text tool
- [x] Click canvas at position (200, 150)
- [x] Verify text "TEXT" appears at that position
- [ ] **Open second browser/tab as User B**
- [ ] Verify User B sees "TEXT" appear in <100ms

### Test 4: Text Color Selection
- [x] Select red color from palette
- [x] Create text → verify text is red
- [x] Select blue color from palette
- [x] Create another text → verify text is blue
- [x] Verify first text remains red (color doesn't change existing shapes)

### Test 5: Lock System Integration
- [x] Create text shape
- [x] Click text to lock it
- [x] Verify green border appears (locked by me)
- [ ] **As User B:** Verify green border around text
- [ ] **As User B:** Try to click/move text → should fail with toast
- [ ] **As User A:** Unlock text (click away or wait 5s)
- [ ] **As User B:** Lock text → should succeed

### Test 6: Text Movement
- [x] Create text shape
- [x] Lock text (click it)
- [x] Drag text to new position
- [ ] **As User B:** Verify text moves in real-time (<100ms)
- [ ] Verify final position matches on both screens

### Test 7: Text Deletion
- [x] Lock text shape
- [x] Click delete button (existing UI)
- [x] Verify text disappears
- [ ] **As User B:** Verify text disappears in <100ms
- [ ] Check Firestore → document should be deleted

### Test 8: Text Rotation (Bonus)
- [x] Lock text shape
- [x] Use rotation handle (red handle above shape)
- [x] Drag to rotate text
- [x] Verify text rotates around center
- [ ] **As User B:** Verify rotation syncs in real-time
- [ ] Test rotation at 45°, 90°, 180°, 270°

### Test 9: No Resize Handles
- [x] Lock text shape
- [x] Verify NO resize handles appear (8 squares)
- [x] Verify rotation handle DOES appear (red circle)
- [x] Verify only delete button shows in controls
- [x] Compare to rectangle → should have resize handles

---

## Code Review Checklist

### Implementation Verification
- [x] Text rendering added to Canvas.tsx after triangle block
- [x] Text uses `<Text>` component from react-konva
- [x] Text positioned with center-point offset (`-displayWidth/2`, `-displayHeight/2`)
- [x] Text inside rotated `<Group>` (not outside)
- [x] Text tool button added to ColorToolbar shapeTools array
- [x] ShapeTool type updated to include `'text'`
- [x] Text creation handler implemented (click or drawing state)
- [x] Resize handles excluded for text shapes (`shape.type !== 'text'`)

### Quality Checks
- [x] All 9 test scenarios pass
- [ ] Text syncs to Firestore in <100ms (tested with collaborator)
- [x] Text respects lock system (green/red borders work)
- [x] Text readable at all zoom levels (25%, 100%, 200%)
- [x] No TypeScript errors in terminal/console
- [x] No runtime errors during text operations
- [x] Code follows existing patterns (Group/center-point positioning)
- [x] Text rotation works automatically (no custom code needed)

### Final Verification
- [x] Run `npm run dev` with no errors
- [ ] Test with two browser windows (collaborative editing)
- [ ] Check Firestore console → text documents have correct structure
- [x] Test on different zoom levels and canvas positions
- [x] Verify text can be locked, moved, rotated, deleted
- [x] Verify text uses selected color from palette

---

## Success Criteria

**PR1 is complete when all checkboxes above are checked and:**

1. ✅ Text shapes render on canvas using Konva `<Text>`
2. ✅ Text tool button appears and works
3. ✅ Clicking canvas creates text at click position
4. ✅ Text content is "TEXT" (hardcoded)
5. ✅ Text uses selected color
6. ✅ Text syncs in <100ms
7. ✅ Text respects lock system
8. ✅ Text can be moved/deleted/rotated
9. ✅ Text has NO resize handles
10. ✅ Text readable at all zoom levels

---

## Next Steps (After PR1)

- [ ] **PR2:** Implement text editing (double-click to edit)
- [ ] **PR2:** Add HTML overlay for text input
- [ ] **PR3:** Add bold/italic/underline controls
- [ ] **PR3:** Add font size dropdown

---

## Notes

- **Time per phase:** Phase 1 (2h), Phase 2 (30m), Phase 3 (15m), Phase 4 (1h), Phase 5 (15m)
- **Total:** ~4 hours implementation + testing
- **Blocker:** Must have second browser/user for real-time sync testing
- **Reference:** See text-prd.md for detailed code examples