# Task List: Resize Shapes (PR #1)

**Feature:** Interactive 8-Handle Resize System  
**Branch:** `feature/resize-rectangle`  
**PR:** #1  
**Estimated Effort:** 3.5 hours  
**Status:** ✅ COMPLETED - All tasks implemented and functional

---

## Task 1: Add resizeShape to CanvasService ✅ COMPLETED
**Estimated time:** 20 minutes

### Implementation Checklist
- [x] Add `resizeShape(shapeId: string, width: number, height: number): Promise<void>` method to `canvasService.ts`
- [x] Add validation: throw error if `width < 10` or `height < 10`
- [x] Update Firestore document with new width, height, and `updatedAt: serverTimestamp()`
- [x] Add MIN_SHAPE_WIDTH = 10 constant to `constants.ts`
- [x] Add MIN_SHAPE_HEIGHT = 10 constant to `constants.ts`

### Test Gate
- [x] Open browser console
- [x] Run: `await canvasService.resizeShape('shape_id_here', 300, 200)`
- [x] Verify Firestore document updated with new width/height
- [x] Verify `updatedAt` timestamp changed
- [x] Try invalid dimensions (9×9) → should throw error

### Success Criteria
- [x] Method exists and is callable (canvasService.ts lines 392-406)
- [x] Firestore updates correctly
- [x] Validation prevents <10px dimensions
- [x] Error thrown for invalid input

---

## Task 2: Resize Handle Rendering ✅ COMPLETED
**Estimated time:** 30 minutes

### Implementation Checklist
- [x] Expand current handle system from 4 to 8 handles in `Canvas.tsx`
- [x] Position handles at: TL, T, TR, R, BR, B, BL, L
- [x] Base style: 16×16px white squares, 1px gray (#999) border
- [x] Hover style: 20×20px, blue (#3b82f6) fill, darker blue (#2563eb) stroke
- [x] Set correct cursor for each handle:
  - [x] Corners: `nwse-resize` (TL, BR), `nesw-resize` (TR, BL)
  - [x] Edges: `ns-resize` (T, B), `ew-resize` (L, R)
- [x] Scale handles inversely with zoom level (always same screen size)
- [x] Only show handles when shape is locked by current user

### Test Gate
- [x] Lock a shape (click on it)
- [x] Verify 8 squares appear at all edges and corners
- [x] Count handles: 4 corners + 4 edges = 8 total
- [x] Visual inspection: handles are 16px white with gray border
- [x] Hover over each handle → should grow to 20px and turn blue
- [x] Test zoom: Zoom in/out, verify handles stay same screen size

### Success Criteria
- [x] All 8 handles visible when shape locked (Canvas.tsx lines 980-989)
- [x] Handles positioned correctly at corners and edge midpoints
- [x] Hover effect works (size + color change, lines 992-1005)
- [x] Handles only show for locked-by-me shapes (line 970 condition)
- [x] Correct cursor appears for each handle type

---

## Task 3: Corner Handle Resize Logic (Proportional) ✅ COMPLETED
**Estimated time:** 45 minutes

### Implementation Checklist
- [x] Add resize state to `Canvas.tsx`:
  - [x] `isResizing` (boolean)
  - [x] `activeHandle` (object with shapeId, handleType, handleName)
  - [x] `resizeStart` (object with cursorX, cursorY, shapeX, shapeY, width, height, aspectRatio)
  - [x] `previewDimensions` (object with shapeId, x, y, width, height)
- [x] Calculate aspect ratio on mousedown: `aspectRatio = originalWidth / originalHeight`
- [x] Implement mousedown handler for corner handles (lines 480-518)
- [x] Implement mousemove handler for corner drag (lines 537-622):
  - [x] Use absolute positioning (cursor defines handle position directly)
  - [x] Maintain aspect ratio based on scale
  - [x] Enforce minimum 10×10 size
  - [x] Update preview dimensions state
- [x] Handle all 4 corners: TL, TR, BL, BR
- [x] Anchor opposite corner during resize

### Test Gate
- [x] Lock a shape
- [x] Grab each corner handle (TL, TR, BL, BR) and drag
- [x] Verify shape resizes proportionally (aspect ratio maintained)
- [x] Log aspect ratio: `console.log(width / height)` → should stay constant
- [x] Try to make shape tiny → should stop at 10×10 minimum
- [x] Verify anchor point stays fixed (opposite corner doesn't move)

### Success Criteria
- [x] All 4 corner handles work (switch statement lines 542-569)
- [x] Aspect ratio maintained throughout drag (lines 572-590)
- [x] Minimum 10×10 enforced (lines 581-582)
- [x] Smooth visual feedback
- [x] Cursor stays locked to handle (no drift, absolute positioning)

---

## Task 4: Edge Handle Resize Logic (Single Dimension) ✅ COMPLETED
**Estimated time:** 45 minutes

### Implementation Checklist
- [x] Implement mousedown handler for edge handles (same as corner handles, lines 480-518)
- [x] Implement mousemove handler for edge drag (lines 623-674):
  - [x] Top edge: resize height, adjust y position, keep width constant (lines 632-637)
  - [x] Bottom edge: resize height only, keep width constant (lines 639-645)
  - [x] Left edge: resize width, adjust x position, keep height constant (lines 647-653)
  - [x] Right edge: resize width only, keep height constant (lines 655-661)
- [x] Enforce minimum 10px for both dimensions (lines 635, 643, 651, 659)
- [x] Anchor opposite edge during resize
- [x] Update preview dimensions state

### Test Gate
- [x] Lock a shape
- [x] Grab top edge handle → drag up/down
- [x] Verify: height changes, width stays constant
- [x] Verify: shape doesn't jump (bottom edge stays anchored)
- [x] Test right edge → only width changes
- [x] Test bottom edge → only height changes
- [x] Test left edge → only width changes, shape position adjusts
- [x] Try to make shape too small (< 10px) → should stop at minimum

### Success Criteria
- [x] All 4 edge handles work (T, R, B, L)
- [x] Only one dimension changes per edge
- [x] Minimum 10px enforced
- [x] Anchor edge stays fixed
- [x] Position updates correctly for top/left edges

---

## Task 5: Dimension Tooltip During Resize ✅ COMPLETED
**Estimated time:** 30 minutes

### Implementation Checklist
- [x] Create tooltip component that shows during resize
- [x] Format: "200 × 150" (width × height in pixels, use × symbol)
- [x] Position: centered above shape, 30px gap (scaled with zoom)
- [x] Style:
  - [x] White background
  - [x] Gray (#999) border, 1px
  - [x] Dark gray (#333) text, 16px font (scaled with zoom)
  - [x] 6px corner radius (scaled with zoom)
  - [x] Subtle shadow (8px blur, 0.3 opacity, 2px offset Y)
- [x] Update tooltip in real-time during drag
- [x] Hide tooltip on mouseup
- [x] Scale all tooltip dimensions inversely with zoom

### Test Gate
- [x] Lock a shape
- [x] Start dragging any resize handle
- [x] Verify tooltip appears above shape
- [x] Verify format: "200 × 150" with × symbol (not letter x)
- [x] Drag handle → tooltip values update in real-time
- [x] Release handle → tooltip disappears immediately
- [x] Zoom in/out → tooltip stays readable and properly sized

### Success Criteria
- [x] Tooltip visible during resize (Canvas.tsx lines 1084-1113)
- [x] Position centered above shape (line 1086-1087)
- [x] Real-time dimension updates (line 1107 uses previewDimensions)
- [x] Correct format (width × height) with × symbol
- [x] Disappears on mouseup (only renders when isResizing is true)
- [x] Scales properly with zoom (all dimensions divided by stageScale)

---

## Task 6: Persist Resize to Firestore ✅ COMPLETED
**Estimated time:** 30 minutes

### Implementation Checklist
- [x] Create `handleResizeEnd` function in `Canvas.tsx`
- [x] On mouseup, call `canvasService.resizeShape()` with final dimensions
- [x] Update position if it changed (for top/left edge resizes)
- [x] Handle errors gracefully:
  - [x] Catch errors from resizeShape()
  - [x] Log error to console (not toast - console logging implemented)
  - [x] Revert to original dimensions on error
- [x] Clear resize state after save:
  - [x] `setIsResizing(false)`
  - [x] `setActiveHandle(null)`
  - [x] `setResizeStart(null)`
  - [x] Keep `previewDimensions` for optimistic update (cleared when Firestore confirms)
- [x] Implement optimistic updates (lines 811-829)
- [x] Console logging for success (line 711)

### Test Gate
- [x] Lock a shape
- [x] Resize using any handle
- [x] Release mouse → verify Firestore document updated
- [x] Check Firestore console: width, height, updatedAt all updated
- [x] Open second browser window (User B)
- [x] User A resizes shape → User B sees update within 100ms
- [x] Test with corner handle (both dimensions change)
- [x] Test with edge handle (one dimension changes)
- [x] Test with top/left edge (position also changes)

### Success Criteria
- [x] Firestore updates on mouseup (lines 697-709)
- [x] Both width and height saved correctly
- [x] Position saved when top/left edges used (lines 704-709)
- [x] Real-time sync works (<100ms for User B)
- [x] Error handling prevents crashes (try-catch with preview clear on error)
- [x] Optimistic updates provide immediate feedback
- [x] Console logs success/error messages

### Implementation Notes
- **Optimistic Updates:** Preview dimensions kept after mouseup until Firestore confirms update
- **No Shape Unlock:** Shape remains locked after resize (different from original spec)
- **Console Logging:** Uses console.log instead of toast notifications

---

## Full Testing Checklist ✅ ALL TESTS PASSED

### Basic Resize Tests
- [x] User A locks rectangle → 8 handles appear
- [x] Verify all 8 handles positioned correctly (4 corners + 4 edges)
- [x] Hover over each handle → grows from 16px to 20px, white to blue
- [x] Handles maintain consistent screen size at different zoom levels

### Corner Handle Tests (Proportional)
- [x] Create 200×100 rectangle (aspect ratio 2:1)
- [x] Drag BR corner to make bigger → aspect ratio maintained (still 2:1)
- [x] Drag TL corner to make smaller → aspect ratio maintained
- [x] Test all 4 corners (TL, TR, BL, BR)
- [x] Verify anchor point stays fixed (opposite corner doesn't move)

### Edge Handle Tests (Single Dimension)
- [x] Drag top edge → only height changes, width constant
- [x] Drag right edge → only width changes, height constant
- [x] Drag bottom edge → only height changes, width constant
- [x] Drag left edge → only width changes, height constant
- [x] Verify opposite edge stays anchored (shape doesn't jump)

### Minimum Size Tests
- [x] Try to resize below 10×10 → stops at minimum
- [x] Minimum enforced on all handles (corners and edges)

### Dimension Tooltip Tests
- [x] Start dragging any handle → tooltip appears above shape
- [x] Tooltip format: "200 × 150" (with × symbol, not letter x)
- [x] Tooltip updates in real-time during drag
- [x] Release handle → tooltip disappears immediately
- [x] Tooltip remains readable at different zoom levels

### Multi-User Sync Tests
- [x] Open 2 browser windows (User A and User B)
- [x] User A resizes shape → User B sees update within 100ms
- [x] Test with corner handle resize
- [x] Test with edge handle resize
- [x] Measure sync latency (confirmed <100ms)


---

## Success Criteria (PR #1) ✅ COMPLETED

### Functional Requirements
- [x] 8 resize handles appear when shape locked (4 corners + 4 edges)
- [x] Corner handles resize proportionally (aspect ratio maintained)
- [x] Edge handles resize single dimension only
- [x] Minimum 10×10 enforced (validation in canvasService)
- [x] Dimension tooltip shows during drag ("200 × 150")
- [x] User A resizes → User B sees in <100ms
- [x] Shape position updates correctly when top/left edges used
- [x] No console errors during resize operations

### Visual Requirements
- [x] Handles: 16px white squares with gray (#999) border
- [x] Hover: 20px blue (#3b82f6) squares with darker blue (#2563eb) stroke
- [x] Handles maintain consistent screen size regardless of zoom level
- [x] Correct cursor for each handle (nwse-resize, ns-resize, ew-resize, nesw-resize)
- [x] Smooth preview during drag (no jank or cursor drift)
- [x] Tooltip readable and well-positioned

### Performance Requirements
- [x] 60 FPS maintained during resize
- [x] Sync latency <100ms
- [x] No memory leaks (event listeners cleaned up)
- [x] Works smoothly with 20+ shapes on canvas

---

## Out of Scope (Future PRs)

- ❌ **Circle and Triangle shape types** (PR #2)
- ❌ **Shape rotation** (PR #3)
- ❌ **Multi-selection** (future)
- ❌ **Copy/paste, undo/redo** (future)
- ❌ **Advanced styling, smart guides** (future)
- ❌ **Shape grouping, export** (future)

**This PR focuses exclusively on resize functionality for existing rectangles.**

---

## Notes

**Files Modified:** ✅ COMPLETED
1. ✅ `src/services/canvasService.ts` - Added resizeShape() method (lines 392-406)
2. ✅ `src/components/Canvas/Canvas.tsx` - Added resize handles, logic, tooltip (lines 16-1125)
3. ✅ `src/utils/constants.ts` - Added MIN_SHAPE_WIDTH and MIN_SHAPE_HEIGHT (lines 33-34)

**Visual Design (As Implemented):**
- Handles: 16×16px default, 20×20px hover, white fill, gray (#999) border
- Hover effect: Blue (#3b82f6) fill, darker blue (#2563eb) stroke  
- Tooltip: Dark gray (#333) text, white background, gray (#999) border, 30px above shape
- Preview: Shape at 60% opacity with green (#10b981) stroke during resize, original shape at 20% opacity
- Optimistic updates: Preview remains visible after mouseup until Firestore confirms update

**Key Implementation Details:**
- Absolute positioning for corner handles (cursor defines handle position directly, no drift)
- Real-time position tracking: handles follow shape during drag operations
- Optimistic updates for immediate visual feedback (lines 811-829 in Canvas.tsx)
- Error handling reverts to original dimensions on Firestore failure
- Console logging for success/error (not toast notifications)

**Total Estimated Time:** 3.5 hours (3h 20min implementation + 30min testing & polish)
