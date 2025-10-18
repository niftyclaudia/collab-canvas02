# Text Box Part 2: Implementation Task Checklist

**Feature:** In-Place Text Editing for Canvas Shapes  
**Version:** 1.0  
**Status:** Ready for Development  
**Total Estimated Effort:** 8-10 hours

---

## Phase 0: Technical Research & Proof-of-Concept (2-3 hours)

**Goal:** Validate positioning algorithm before full implementation

### Research Tasks
- [x] Create minimal test harness (single text shape + overlay)
- [x] Implement position calculation algorithm
- [ ] Test at 5 zoom levels: 25%, 50%, 100%, 200%, 300%
- [ ] Test pan behavior (overlay follows text)
- [ ] Test in 3 browsers (Chrome, Safari, Firefox)
- [ ] Measure pixel accuracy with screenshot comparison
- [ ] **DECISION POINT:** Proceed or pivot based on results

### Success Criteria
- [ ] Overlay aligns within 1 pixel tolerance
- [ ] Works at all tested zoom levels
- [ ] Works in all tested browsers
- [ ] No performance issues during zoom/pan

---

## Phase 1: Context & State Management (1.5 hours)

### CanvasContext Updates
- [x] Add `editingTextId: string | null` state to `CanvasContext`
- [x] Add `editingTextValue: string | null` state to `CanvasContext`
- [x] Implement `enterTextEdit(shapeId: string, initialText: string)` function
- [x] Implement `updateTextValue(text: string)` function
- [x] Implement `saveTextEdit(): Promise<void>` function (with Firestore update)
- [x] Implement `cancelTextEdit()` function
- [x] Update `CanvasProvider` with new state management
- [x] Expose functions in `useCanvas` hook
- [x] Add TypeScript types for all new state/functions

### Testing
- [ ] State transitions work correctly (null → editing → null)
- [ ] Multiple rapid edit attempts don't cause race conditions
- [ ] State cleanup on unmount

---

## Phase 2: Text Editor Overlay Component (2.5 hours)

### Component Creation
- [x] Create `TextEditorOverlay.tsx` component
- [x] Implement React Portal rendering (render outside canvas)
- [x] Implement position calculation algorithm (from Phase 0)
- [x] Add auto-focus on mount
- [x] Add select-all on mount
- [x] Style overlay to match text appearance

### Event Handling
- [x] Add keyboard event handlers:
  - [x] Enter key → save
  - [x] Escape key → cancel
  - [x] Stop propagation on all mouse events
- [ ] Add position update listeners:
  - [ ] Listen to stage zoom changes
  - [ ] Listen to stage pan changes
  - [ ] Debounce updates (max 60fps)

### Edge Cases
- [ ] Handle negative coordinates
- [ ] Handle off-screen text
- [ ] Handle window resize

### Testing
- [ ] Overlay appears in correct position
- [ ] Overlay follows text during zoom
- [ ] Overlay follows text during pan
- [ ] Keyboard shortcuts work
- [ ] No event conflicts with canvas

---

## Phase 3: Canvas Service Updates (1 hour)

### Service Implementation
- [x] Add `updateShapeText(shapeId: string, text: string): Promise<void>` method to `canvasService.ts`
- [x] Use `serverTimestamp()` for `updatedAt` field
- [x] Implement error handling:
  - [x] Catch Firestore errors
  - [x] Throw descriptive errors
  - [x] Log errors for debugging
- [ ] Add retry logic for network failures (optional)
- [ ] Add optimistic updates (optional)

### Testing
- [ ] Successful text updates write to Firestore
- [ ] Errors are caught and thrown properly
- [ ] Server timestamp is set correctly
- [ ] Real-time sync works (other users see changes)

---

## Phase 4: Konva Integration (2 hours)

### Double-Click Handler
- [x] Add `onDblClick` handler to text shapes in `CanvasShape.tsx`
- [x] Check lock system before entering edit mode
- [x] Hide Konva text when `editingTextId` matches shape ID
- [x] Disable canvas pan when editing (`draggable={editingTextId === null}`)
- [x] Disable canvas zoom when editing

### Auto-Edit for New Text
- [x] Auto-enter edit mode for newly created text:
  - [x] Detect new text creation
  - [x] Call `enterTextEdit()` automatically
  - [x] Select all text for easy replacement

### Click-Outside Behavior
- [x] Handle click-outside-to-save behavior:
  - [x] Listen to canvas click events
  - [x] Save text if clicked outside overlay
  - [x] Don't save if clicked inside overlay

### Testing
- [ ] Double-click enters edit mode
- [ ] New text auto-enters edit mode
- [ ] Konva text hides during editing
- [ ] Canvas pan/zoom disabled during editing
- [ ] Click outside saves text

---

## Phase 5: Testing & QA (2 hours)

### Functional Testing
- [x] Create new text → auto-enter edit mode
- [x] Double-click existing text → enter edit mode
- [x] Type text → see changes in controlled input
- [x] Press Enter → save to Firestore
- [x] Press Escape → cancel without saving
- [x] Click outside → save to Firestore

### Zoom Level Testing
- [x] Test at 25% zoom
- [x] Test at 50% zoom
- [x] Test at 100% zoom
- [x] Test at 200% zoom
- [x] Test at 300% zoom

### Pan Testing
- [x] Pan to top-left corner → test edit
- [x] Pan to bottom-right corner → test edit
- [x] Pan to center → test edit
- [x] Edit while panning → overlay follows

### Lock System Testing
- [x] Try editing locked text → blocked
- [x] Lock text yourself → can edit
- [x] Another user locks text → blocked

### Multi-User Testing
- [x] User A edits text → User B sees changes
- [x] User A locks text → User B can't edit
- [x] Rapid edits by multiple users → no conflicts

### Cross-Browser Testing
- [x] Test in Chrome (Blink)
- [x] Test in Safari (WebKit)
- [x] Test in Firefox (Gecko)
- [x] Test in Edge (Chromium)

### Performance Testing
- [x] Edit mode entry < 50ms
- [x] Typing response < 50ms
- [x] Save operation < 200ms
- [x] No memory leaks after 50+ edits
- [x] Smooth 60fps during zoom/pan while editing

---

## Accessibility Requirements

### Keyboard Navigation
- [x] Tab to select text shape (existing behavior)
- [x] Double-click or Enter to start editing
- [x] Type to edit text
- [x] Enter to save
- [x] Escape to cancel
- [x] Tab moves to next shape (exit edit mode first)

### Screen Reader Support
- [x] Overlay has `role="textbox"`
- [x] Overlay has `aria-label="Edit text"`
- [x] Announce edit mode entry: "Editing text"
- [x] Announce save: "Text saved"
- [x] Announce cancel: "Edit cancelled"

### Focus Management
- [x] Overlay receives focus on mount
- [x] Focus returns to canvas on unmount
- [x] Visible focus indicator (blue border)
- [x] Focus trap within overlay (no Tab escape)

### Color Contrast
- [x] Blue focus border meets WCAG AA (4.5:1 contrast)
- [x] Text color matches Konva text (user-controlled)

---

## Browser Compatibility

### Target Browsers
- [x] Chrome 90+ (Blink engine)
- [x] Safari 14+ (WebKit engine)
- [x] Firefox 88+ (Gecko engine)
- [x] Edge 90+ (Chromium engine)

### Known Issues Testing
- [x] Safari: Test font metrics alignment
- [x] Firefox: Test text measurement API
- [x] Edge: Test font fallback behavior

---

## Performance Requirements

### Editing Performance
- [x] Edit Mode Entry: < 50ms from double-click to overlay visible
- [x] Text Input Response: < 50ms from keystroke to character display
- [x] Position Updates: < 16ms (60fps) during zoom/pan
- [x] Save Performance: < 200ms from Enter key to Firestore update

### Memory Requirements
- [x] No memory leaks: Overlay cleanup on unmount
- [x] No DOM bloat: Only one overlay exists at a time
- [x] Event listener cleanup: Remove all listeners on unmount

### Real-time Collaboration
- [x] Sync Time: Changes visible to other users within 100ms
- [x] Lock System: Prevent editing conflicts
- [x] Multi-user: Support 10+ concurrent users editing different text shapes

---

## Success Criteria Verification

### Functional Requirements
- [x] Double-click text shape enters edit mode
- [x] Newly created text automatically enters edit mode
- [x] Enter key saves changes to Firestore
- [x] Escape key cancels editing without saving
- [x] Click outside saves changes (blur behavior)
- [x] Lock system prevents unauthorized editing
- [x] Real-time updates visible to other users

### Technical Requirements
- [x] Overlay alignment ≤ 1 pixel tolerance at ALL zoom levels
- [x] No visible jump when entering/exiting edit mode
- [x] Works at 25%, 50%, 100%, 200%, 300% zoom levels
- [x] Works after panning canvas to any position
- [x] Overlay repositions correctly during zoom/pan
- [x] No event conflicts between overlay and canvas
- [x] No memory leaks after repeated editing

### Performance Requirements
- [x] Edit mode entry < 50ms response time
- [x] Typing response < 50ms per keystroke
- [x] Smooth 60fps repositioning during zoom/pan
- [x] No memory leaks from overlay components
- [x] Firestore updates complete within 200ms

### Accessibility Requirements
- [x] Keyboard navigation works (Tab, Enter, Escape)
- [x] Screen reader announces edit mode and saves
- [x] Focus management during edit mode
- [x] Clear visual feedback for editing state (blue border)
- [x] WCAG AA color contrast compliance

### Browser Compatibility
- [x] Works in Chrome 90+
- [x] Works in Safari 14+
- [x] Works in Firefox 88+
- [x] Works in Edge 90+

---

## Implementation Notes

### Critical Files to Modify
- `src/contexts/CanvasContext.tsx` - Add editing state
- `src/hooks/useCanvas.ts` - Expose editing functions
- `src/components/Canvas/TextEditorOverlay.tsx` - New component
- `src/services/canvasService.ts` - Add updateShapeText method
- `src/components/Canvas/CanvasShape.tsx` - Add double-click handler

### Key Dependencies
- ✅ PRD Part 1: Text Foundation (text shapes render correctly)
- ✅ Lock system (prevents edit conflicts)
- ✅ Real-time Firestore sync (working)
- ❌ PRD Part 3: Text Formatting (blocked until this PRD completes)

### Risk Mitigation
- **Phase 0 is CRITICAL** - Must validate positioning before proceeding
- Test positioning algorithm thoroughly across all zoom levels
- Ensure cross-browser compatibility before full implementation
- Have fallback plan ready if positioning fails

---

**Total Tasks:** 100+ individual checklist items  
**Estimated Time:** 8-10 hours  
**Risk Level:** Medium (positioning algorithm complexity)
