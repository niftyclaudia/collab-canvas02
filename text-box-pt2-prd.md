# PRD: Text Editing Implementation

**Feature:** In-Place Text Editing for Canvas Shapes  
**Version:** 1.0  
**Status:** Ready for Development  
**Part:** 2 of 3 (Text Editing Feature)  
**Estimated Effort:** 8-10 hours

---

## Overview

This PRD implements **in-place text editing** for text shapes on the collaborative canvas. Users can double-click any text shape to enter edit mode, type directly, and save changes. The implementation provides a Figma-like editing experience with pixel-perfect HTML overlay positioning that works seamlessly across all zoom levels and pan positions.

**Dependencies:**
- ✅ PRD Part 1: Text Foundation (text shapes render correctly)
- ✅ Lock system (prevents edit conflicts)
- ✅ Real-time Firestore sync (working)
- ❌ PRD Part 3: Text Formatting (blocked until this PRD completes)

**Current State:**
- ✅ Text shapes can be created and displayed
- ✅ Lock system integration works
- ✅ Real-time Firestore sync works
- ❌ **Text editing is not implemented**

**Goal:** Enable users to edit text content with a seamless, professional editing experience that works at any zoom level.

---

## User Stories

### As a Designer
- I want to double-click a text shape and start typing immediately
- I want my cursor to appear **exactly where the text is**, without any visual jump
- I want to press **Enter** to save my changes quickly
- I want to press **Escape** to cancel if I change my mind
- I want the editing experience to work at any zoom level (50%, 100%, 200%)
- I want to pan the canvas while editing and see the input follow the text

### As a Collaborator
- I want to see text changes update in real-time when another user saves
- I want to be prevented from editing text that someone else is currently editing
- I want to see a visual indication when text is being edited by another user

---

## Technical Requirements

### 1. State Management

**Add to CanvasContext:**
```typescript
interface CanvasContextType {
  // Existing properties...
  
  // Text editing state
  editingTextId: string | null;
  editingTextValue: string | null;
  enterTextEdit: (shapeId: string, initialText: string) => void;
  updateTextValue: (text: string) => void;
  saveTextEdit: () => Promise<void>;
  cancelTextEdit: () => void;
}
```

**State Flow:**
```
editingTextId: null → shapeId → null (on save/cancel)
editingTextValue: null → text → updated text → null (on save/cancel)
```

**Implementation Notes:**
- `editingTextId`: Tracks which text shape is currently being edited
- `editingTextValue`: Stores the current text being edited (for controlled input)
- `enterTextEdit()`: Enters edit mode for a specific text shape
- `updateTextValue()`: Updates text as user types (controlled component)
- `saveTextEdit()`: Saves text changes to Firestore and exits edit mode
- `cancelTextEdit()`: Exits edit mode without saving changes

### 2. Text Editor Overlay Component

**Create `TextEditorOverlay.tsx`:**
```typescript
interface TextEditorOverlayProps {
  shapeId: string;
  initialText: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  zoom: number;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Component Requirements:**
- HTML `<input type="text">` element for single-line editing
- Positioned absolutely using React Portal
- Styled to match Konva text appearance exactly:
  - Same font family, size, color
  - Same padding/alignment
  - Transparent background
  - No border or outline (custom focus indicator)
- Auto-focus on mount
- Select all text on mount (for easy replacement)
- Controlled input (value from props)

**Styling Specifications:**
```css
.text-editor-overlay {
  position: absolute;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  background: transparent;
  border: 2px solid #4A90E2; /* Blue focus indicator */
  border-radius: 2px;
  padding: 2px 4px;
  outline: none;
  transform-origin: top left;
  transform: scale(var(--zoom));
  min-width: 100px;
  z-index: 1000;
}

.text-editor-overlay:focus {
  border-color: #2E6DB5; /* Darker blue on focus */
}
```

### 3. Position Calculation Algorithm

**Critical Requirement:** The HTML overlay must appear exactly where the Konva text is rendered, accounting for zoom and pan.

**Algorithm Implementation:**
```typescript
const calculateOverlayPosition = (
  textNode: Konva.Text,
  stage: Konva.Stage,
  container: HTMLElement
): { x: number; y: number; zoom: number } => {
  // Step 1: Get absolute position of text node in canvas coordinates
  const canvasPoint = textNode.getAbsolutePosition();
  
  // Step 2: Get stage transform properties
  const stagePosition = stage.position(); // { x, y } pan offset
  const zoom = stage.scaleX(); // scaleX === scaleY for uniform zoom
  
  // Step 3: Get container's screen position
  const containerRect = container.getBoundingClientRect();
  
  // Step 4: Transform canvas coordinates to screen coordinates
  // Formula: screen = (canvas - stagePan) * zoom + containerOffset
  const screenX = (canvasPoint.x * zoom) + stagePosition.x + containerRect.left;
  const screenY = (canvasPoint.y * zoom) + stagePosition.y + containerRect.top;
  
  return { x: screenX, y: screenY, zoom };
};
```

**Position Update Strategy:**
- Calculate position on mount
- Recalculate on zoom change (listen to stage `scaleChange` event)
- Recalculate on pan change (listen to stage `dragmove` event)
- Debounce updates to avoid performance issues (max 60fps)

**Edge Cases to Handle:**
- Container scrolling (rare but possible)
- Window resize during editing
- Stage transformations during editing
- Negative coordinates (text off-screen)

### 4. Canvas Service Integration

**Add to `canvasService.ts`:**
```typescript
/**
 * Updates the text content of a text shape
 * @param shapeId - The ID of the text shape to update
 * @param text - The new text content
 * @throws Error if update fails
 */
async updateShapeText(shapeId: string, text: string): Promise<void> {
  try {
    const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await updateDoc(shapeRef, {
      text: text,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Text updated:', shapeId, text);
  } catch (error) {
    console.error('❌ Error updating text:', error);
    throw new Error(`Failed to update text: ${error.message}`);
  }
}
```

**Error Handling:**
- Throw errors for Firestore failures
- Show user-friendly error message in UI
- Revert to previous text on error
- Log errors for debugging

### 5. Konva Integration

**Update `CanvasShape.tsx`:**

**Add Double-Click Handler:**
```typescript
const handleTextDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  e.cancelBubble = true; // Prevent canvas deselection
  
  // Check lock system
  if (shape.lockedBy && shape.lockedBy !== currentUserId) {
    console.log('❌ Text locked by another user');
    return;
  }
  
  // Enter edit mode
  enterTextEdit(shape.id, shape.text);
};
```

**Auto-Enter Edit Mode for New Text:**
```typescript
// In text creation logic
const createNewText = async (position: { x: number; y: number }) => {
  const newTextShape = {
    id: generateId(),
    type: 'text',
    text: 'New Text',
    x: position.x,
    y: position.y,
    fontSize: 16,
    // ... other properties
  };
  
  await canvasService.addShape(newTextShape);
  
  // Auto-enter edit mode
  enterTextEdit(newTextShape.id, 'New Text');
};
```

**Hide Konva Text During Editing:**
```typescript
<Text
  {...shapeProps}
  visible={editingTextId !== shape.id} // Hide when editing
  onDblClick={handleTextDoubleClick}
/>
```

**Disable Canvas Interactions During Editing:**
```typescript
// In Stage component
<Stage
  draggable={editingTextId === null} // Disable pan while editing
  onWheel={editingTextId === null ? handleZoom : undefined} // Disable zoom while editing
>
```

---

## High-Risk Technical Areas

### 🔴 **CRITICAL: Position Calculation Accuracy**

**Risk Level:** HIGH  
**Impact:** Feature will not work if overlay positioning fails  
**Mitigation Strategy:** Research phase BEFORE full implementation

**Phase 0: Positioning Research (2-3 hours)**
```markdown
## Research Tasks
- [ ] Build minimal proof-of-concept with single text + overlay
- [ ] Test positioning at zoom levels: 25%, 50%, 100%, 200%, 300%
- [ ] Test positioning after panning to various locations
- [ ] Test in Chrome, Safari, Firefox
- [ ] Measure pixel accuracy (must be ≤ 1px deviation)

## Success Criteria
- Overlay aligns within 1 pixel at ALL zoom levels
- Overlay follows text during pan operations
- Works in all major browsers
- No visual "jump" when entering edit mode

## Decision Point
- ✅ Proceed with implementation if all criteria met
- ❌ Pivot to alternative approach if positioning fails
  - Alternative 1: Transform Konva text to editable mode (complex)
  - Alternative 2: Modal-based editing (poor UX but reliable)
```

### 🟡 **Medium Risk: Event Handling Conflicts**

**Problem:** HTML input events may conflict with canvas interactions

**Mitigation:**
```typescript
// Stop all propagation from overlay
<input
  onMouseDown={(e) => e.stopPropagation()}
  onMouseMove={(e) => e.stopPropagation()}
  onMouseUp={(e) => e.stopPropagation()}
  onWheel={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
  onDoubleClick={(e) => e.stopPropagation()}
/>
```

**Testing:**
- Click overlay → should not trigger canvas selection
- Drag inside overlay → should not pan canvas
- Scroll over overlay → should not zoom canvas

### 🟡 **Medium Risk: Browser Font Rendering Differences**

**Problem:** Font metrics vary across browsers, causing alignment issues

**Mitigation:**
```typescript
// Use canvas-based text measurement for consistency
const measureText = (text: string, fontSize: number, fontFamily: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text);
};
```

**Testing:**
- Test in Chrome (Blink engine)
- Test in Safari (WebKit engine)
- Test in Firefox (Gecko engine)

---

## Implementation Phases

### Phase 0: Technical Research & Proof-of-Concept (2-3 hours)
**Goal:** Validate positioning algorithm before full implementation

- [ ] Create minimal test harness (single text shape + overlay)
- [ ] Implement position calculation algorithm
- [ ] Test at 5 zoom levels: 25%, 50%, 100%, 200%, 300%
- [ ] Test pan behavior (overlay follows text)
- [ ] Test in 3 browsers (Chrome, Safari, Firefox)
- [ ] Measure pixel accuracy with screenshot comparison
- [ ] **Decision:** Proceed or pivot based on results

**Acceptance Criteria:**
- Overlay aligns within 1 pixel tolerance
- Works at all tested zoom levels
- Works in all tested browsers
- No performance issues during zoom/pan

---

### Phase 1: Context & State Management (1.5 hours)

- [ ] Add `editingTextId` state to `CanvasContext`
- [ ] Add `editingTextValue` state to `CanvasContext`
- [ ] Implement `enterTextEdit()` function
- [ ] Implement `updateTextValue()` function
- [ ] Implement `saveTextEdit()` function (with Firestore update)
- [ ] Implement `cancelTextEdit()` function
- [ ] Update `CanvasProvider` with new state management
- [ ] Expose functions in `useCanvas` hook
- [ ] Add TypeScript types for all new state/functions

**Testing:**
- State transitions work correctly (null → editing → null)
- Multiple rapid edit attempts don't cause race conditions
- State cleanup on unmount

---

### Phase 2: Text Editor Overlay Component (2.5 hours)

- [ ] Create `TextEditorOverlay.tsx` component
- [ ] Implement React Portal rendering (render outside canvas)
- [ ] Implement position calculation algorithm (from Phase 0)
- [ ] Add auto-focus on mount
- [ ] Add select-all on mount
- [ ] Style overlay to match text appearance
- [ ] Add keyboard event handlers:
  - [ ] Enter key → save
  - [ ] Escape key → cancel
  - [ ] Stop propagation on all mouse events
- [ ] Add position update listeners:
  - [ ] Listen to stage zoom changes
  - [ ] Listen to stage pan changes
  - [ ] Debounce updates (max 60fps)
- [ ] Handle edge cases:
  - [ ] Negative coordinates
  - [ ] Off-screen text
  - [ ] Window resize

**Testing:**
- Overlay appears in correct position
- Overlay follows text during zoom
- Overlay follows text during pan
- Keyboard shortcuts work
- No event conflicts with canvas

---

### Phase 3: Canvas Service Updates (1 hour)

- [ ] Add `updateShapeText()` method to `canvasService.ts`
- [ ] Use `serverTimestamp()` for `updatedAt` field
- [ ] Implement error handling:
  - [ ] Catch Firestore errors
  - [ ] Throw descriptive errors
  - [ ] Log errors for debugging
- [ ] Add retry logic for network failures (optional)
- [ ] Add optimistic updates (optional)

**Testing:**
- Successful text updates write to Firestore
- Errors are caught and thrown properly
- Server timestamp is set correctly
- Real-time sync works (other users see changes)

---

### Phase 4: Konva Integration (2 hours)

- [ ] Add `onDblClick` handler to text shapes in `CanvasShape.tsx`
- [ ] Check lock system before entering edit mode
- [ ] Hide Konva text when `editingTextId` matches shape ID
- [ ] Disable canvas pan when editing (`draggable={editingTextId === null}`)
- [ ] Disable canvas zoom when editing
- [ ] Auto-enter edit mode for newly created text:
  - [ ] Detect new text creation
  - [ ] Call `enterTextEdit()` automatically
  - [ ] Select all text for easy replacement
- [ ] Handle click-outside-to-save behavior:
  - [ ] Listen to canvas click events
  - [ ] Save text if clicked outside overlay
  - [ ] Don't save if clicked inside overlay

**Testing:**
- Double-click enters edit mode
- New text auto-enters edit mode
- Konva text hides during editing
- Canvas pan/zoom disabled during editing
- Click outside saves text

---

### Phase 5: Testing & QA (2 hours)

**Functional Testing:**
- [ ] Create new text → auto-enter edit mode
- [ ] Double-click existing text → enter edit mode
- [ ] Type text → see changes in controlled input
- [ ] Press Enter → save to Firestore
- [ ] Press Escape → cancel without saving
- [ ] Click outside → save to Firestore

**Zoom Level Testing:**
- [ ] Test at 25% zoom
- [ ] Test at 50% zoom
- [ ] Test at 100% zoom
- [ ] Test at 200% zoom
- [ ] Test at 300% zoom

**Pan Testing:**
- [ ] Pan to top-left corner → test edit
- [ ] Pan to bottom-right corner → test edit
- [ ] Pan to center → test edit
- [ ] Edit while panning → overlay follows

**Lock System Testing:**
- [ ] Try editing locked text → blocked
- [ ] Lock text yourself → can edit
- [ ] Another user locks text → blocked

**Multi-User Testing:**
- [ ] User A edits text → User B sees changes
- [ ] User A locks text → User B can't edit
- [ ] Rapid edits by multiple users → no conflicts

**Cross-Browser Testing:**
- [ ] Test in Chrome (Blink)
- [ ] Test in Safari (WebKit)
- [ ] Test in Firefox (Gecko)
- [ ] Test in Edge (Chromium)

**Performance Testing:**
- [ ] Edit mode entry < 50ms
- [ ] Typing response < 50ms
- [ ] Save operation < 200ms
- [ ] No memory leaks after 50+ edits
- [ ] Smooth 60fps during zoom/pan while editing

---

## Performance Requirements

### Editing Performance
- **Edit Mode Entry:** < 50ms from double-click to overlay visible
- **Text Input Response:** < 50ms from keystroke to character display
- **Position Updates:** < 16ms (60fps) during zoom/pan
- **Save Performance:** < 200ms from Enter key to Firestore update

### Memory Requirements
- **No memory leaks:** Overlay cleanup on unmount
- **No DOM bloat:** Only one overlay exists at a time
- **Event listener cleanup:** Remove all listeners on unmount

### Real-time Collaboration
- **Sync Time:** Changes visible to other users within 100ms
- **Lock System:** Prevent editing conflicts
- **Multi-user:** Support 10+ concurrent users editing different text shapes

---

## Browser Compatibility

### Target Browsers
- Chrome 90+ (Blink engine)
- Safari 14+ (WebKit engine)
- Firefox 88+ (Gecko engine)
- Edge 90+ (Chromium engine)

### Known Issues
- **Safari:** Slightly different font metrics, test alignment carefully
- **Firefox:** Different text measurement API, use canvas-based fallback
- **Edge:** Different font fallback behavior, test with missing fonts

### Polyfills Required
- None (React 18+ handles all necessary polyfills)

---

## Accessibility Requirements

### Keyboard Navigation
- [ ] Tab to select text shape (existing behavior)
- [ ] Double-click or Enter to start editing
- [ ] Type to edit text
- [ ] Enter to save
- [ ] Escape to cancel
- [ ] Tab moves to next shape (exit edit mode first)

### Screen Reader Support
- [ ] Overlay has `role="textbox"`
- [ ] Overlay has `aria-label="Edit text"`
- [ ] Announce edit mode entry: "Editing text"
- [ ] Announce save: "Text saved"
- [ ] Announce cancel: "Edit cancelled"

### Focus Management
- [ ] Overlay receives focus on mount
- [ ] Focus returns to canvas on unmount
- [ ] Visible focus indicator (blue border)
- [ ] Focus trap within overlay (no Tab escape)

### Color Contrast
- [ ] Blue focus border meets WCAG AA (4.5:1 contrast)
- [ ] Text color matches Konva text (user-controlled)

---

## Out of Scope

The following features are explicitly **not included** in this PRD:

- ❌ **Text Formatting:** Bold, italic, underline (PRD Part 3)
- ❌ **Multi-line Text:** Line breaks and paragraph support
- ❌ **Font Selection:** Font family dropdown (PRD Part 3)
- ❌ **Text Alignment:** Left, center, right alignment
- ❌ **Rich Text:** HTML formatting or markdown support
- ❌ **Text Rotation:** Handled by existing rotation system
- ❌ **Mobile Editing:** Touch-optimized interface
- ❌ **Undo/Redo:** Will be added in future iteration
- ❌ **Text Selection:** Partial text selection within overlay

These features will be addressed in future PRDs.

---

## Success Criteria

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

## Implementation Checklist

### Phase 0: Research (2-3 hours)
- [ ] Build positioning proof-of-concept
- [ ] Test at 5 zoom levels
- [ ] Test in 3 browsers
- [ ] **DECISION POINT:** Proceed or pivot

### Phase 1: State (1.5 hours)
- [ ] Add editing state to CanvasContext
- [ ] Implement enter/update/save/cancel functions
- [ ] Update useCanvas hook

### Phase 2: Overlay (2.5 hours)
- [ ] Create TextEditorOverlay component
- [ ] Implement position calculation
- [ ] Add keyboard handlers
- [ ] Add position update listeners

### Phase 3: Service (1 hour)
- [ ] Add updateShapeText() to canvasService
- [ ] Implement error handling
- [ ] Test Firestore updates

### Phase 4: Konva (2 hours)
- [ ] Add double-click handler
- [ ] Auto-enter edit for new text
- [ ] Hide Konva text during editing
- [ ] Disable canvas interactions

### Phase 5: Testing (2 hours)
- [ ] Functional testing (all scenarios)
- [ ] Zoom level testing (5 levels)
- [ ] Pan testing (4 positions)
- [ ] Lock system testing
- [ ] Multi-user testing
- [ ] Cross-browser testing (4 browsers)
- [ ] Performance testing

---
