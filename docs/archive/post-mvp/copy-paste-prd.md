# PRD: Keyboard Shortcuts for Copy and Paste Objects

**Feature:** Keyboard Shortcuts for Copy and Paste Operations

**Version:** 1.0

**Status:** Ready for Development

**Estimated Effort:** 3-4 hours

---

## Overview

This PRD adds keyboard shortcuts for copying and pasting objects on the collaborative canvas. Users will be able to use standard keyboard shortcuts (Ctrl+C/Cmd+C to copy, Ctrl+V/Cmd+V to paste) to duplicate shapes quickly without using the UI buttons.

### Current State ✅

- Duplicate functionality exists via UI button in ShapeControls
- `canvasService.duplicateShape()` method is implemented
- Shape locking system prevents conflicts
- Real-time Firestore sync works for all operations

### What This PRD Adds 🎯

- **Ctrl+C/Cmd+C**: Copy selected shape to clipboard
- **Ctrl+V/Cmd+V**: Paste copied shape with offset
- **Ctrl+A/Cmd+A**: Select all shapes (bonus feature)
- **Delete/Backspace**: Delete selected shape
- **Escape**: Deselect all shapes
- Visual feedback for copy/paste operations
- Support for multiple shape types (rectangle, circle, triangle, text)

---

## Technical Architecture

### 1. Clipboard State Management

**File:** `app/src/components/Canvas/Canvas.tsx`

Add clipboard state to track copied shapes:

```typescript
// Clipboard state
const [clipboard, setClipboard] = useState<{
  shapes: Shape[];
  copiedAt: number;
} | null>(null);

// Paste offset to prevent overlapping
const PASTE_OFFSET = 20;
```

### 2. Keyboard Event Handling

**Enhanced Keyboard Handler:**

```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  
  // Prevent default browser behavior for our shortcuts
  if (isCtrlOrCmd && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
    e.preventDefault();
  }
  
  // Copy: Ctrl+C or Cmd+C
  if (isCtrlOrCmd && e.key === 'c' && selectedShapeId) {
    handleCopyShape();
  }
  
  // Paste: Ctrl+V or Cmd+V
  if (isCtrlOrCmd && e.key === 'v' && clipboard) {
    handlePasteShape();
  }
  
  // Select All: Ctrl+A or Cmd+A
  if (isCtrlOrCmd && e.key === 'a') {
    handleSelectAll();
  }
  
  // Delete: Delete or Backspace
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
    handleDeleteSelected();
  }
  
  // Escape: Deselect
  if (e.key === 'Escape') {
    setSelectedShapeId(null);
  }
  
  // Cancel drawing on Escape (existing)
  if (e.key === 'Escape' && drawingState.isDrawing) {
    cancelDrawing();
  }
}, [selectedShapeId, clipboard, handleCopyShape, handlePasteShape, handleSelectAll, handleDeleteSelected, drawingState.isDrawing, cancelDrawing]);
```

### 3. Copy Operation

**Copy Handler:**

```typescript
const handleCopyShape = useCallback(async () => {
  if (!selectedShapeId) return;
  
  const shape = shapes.find(s => s.id === selectedShapeId);
  if (!shape) return;
  
  // Store in clipboard
  setClipboard({
    shapes: [shape],
    copiedAt: Date.now()
  });
  
  showToast('Shape copied to clipboard', 'success');
}, [selectedShapeId, shapes, showToast]);
```

### 4. Paste Operation

**Paste Handler:**

```typescript
const handlePasteShape = useCallback(async () => {
  if (!clipboard || !user) return;
  
  try {
    for (const shape of clipboard.shapes) {
      // Calculate paste position with offset
      const offsetX = shape.x + PASTE_OFFSET;
      const offsetY = shape.y + PASTE_OFFSET;
      
      // Create new shape data
      const pasteData: CreateShapeData = {
        type: shape.type,
        x: offsetX,
        y: offsetY,
        width: shape.width,
        height: shape.height,
        color: shape.color,
        rotation: shape.rotation || 0
      };
      
      // Add type-specific properties
      if (shape.type === 'circle' && shape.radius !== undefined) {
        pasteData.radius = shape.radius;
      }
      if (shape.type === 'text') {
        if (shape.text !== undefined) pasteData.text = shape.text;
        if (shape.fontSize !== undefined) pasteData.fontSize = shape.fontSize;
        if (shape.fontWeight !== undefined) pasteData.fontWeight = shape.fontWeight;
        if (shape.fontStyle !== undefined) pasteData.fontStyle = shape.fontStyle;
        if (shape.textDecoration !== undefined) pasteData.textDecoration = shape.textDecoration;
      }
      
      // Create the pasted shape
      const newShape = await canvasService.createShape(pasteData);
      
      // Select the newly pasted shape
      setSelectedShapeId(newShape.id);
    }
    
    showToast(`Pasted ${clipboard.shapes.length} shape(s)`, 'success');
  } catch (error) {
    console.error('Failed to paste shape:', error);
    showToast('Failed to paste shape', 'error');
  }
}, [clipboard, user, canvasService, showToast]);
```

### 5. Select All Operation

**Select All Handler:**

```typescript
const handleSelectAll = useCallback(() => {
  if (shapes.length === 0) return;
  
  // For now, select the first shape (future: multi-select)
  setSelectedShapeId(shapes[0].id);
  showToast('Selected shape', 'info');
}, [shapes]);
```

### 6. Delete Operation

**Delete Handler:**

```typescript
const handleDeleteSelected = useCallback(async () => {
  if (!selectedShapeId) return;
  
  try {
    await canvasService.deleteShape(selectedShapeId);
    setSelectedShapeId(null);
    showToast('Shape deleted', 'success');
  } catch (error) {
    console.error('Failed to delete shape:', error);
    showToast('Failed to delete shape', 'error');
  }
}, [selectedShapeId, canvasService, showToast]);
```

---

## Implementation Steps

### Phase 1: Clipboard State Management (30 min)

**File:** `app/src/components/Canvas/Canvas.tsx`

1. Add clipboard state variables
2. Add paste offset constant
3. Update keyboard event listener to handle new shortcuts

### Phase 2: Copy Functionality (45 min)

1. Implement `handleCopyShape` function
2. Add visual feedback for copy operation
3. Test copy with different shape types

### Phase 3: Paste Functionality (60 min)

1. Implement `handlePasteShape` function
2. Handle position offset calculation
3. Support all shape types (rectangle, circle, triangle, text)
4. Select pasted shape automatically

### Phase 4: Additional Shortcuts (45 min)

1. Implement Select All (Ctrl+A/Cmd+A)
2. Implement Delete (Delete/Backspace keys)
3. Implement Deselect (Escape key)
4. Update existing Escape handler for drawing cancellation

### Phase 5: Integration & Testing (30 min)

1. Test all keyboard shortcuts
2. Verify real-time sync works
3. Test with multiple users
4. Verify clipboard persistence across operations

---

## Success Criteria

The feature is complete when:

1. ✅ **Ctrl+C/Cmd+C** copies selected shape to clipboard
2. ✅ **Ctrl+V/Cmd+V** pastes copied shape with offset
3. ✅ **Ctrl+A/Cmd+A** selects first available shape
4. ✅ **Delete/Backspace** deletes selected shape
5. ✅ **Escape** deselects current shape
6. ✅ Copy operation shows success toast
7. ✅ Paste operation shows success toast with count
8. ✅ Pasted shapes appear with 20px offset
9. ✅ Pasted shape is automatically selected
10. ✅ All shape types support copy/paste (rectangle, circle, triangle, text)
11. ✅ Real-time sync works for all operations (<100ms)
12. ✅ Keyboard shortcuts work when canvas is focused
13. ✅ No conflicts with existing Escape handler for drawing
14. ✅ Clipboard persists during session
15. ✅ Multi-user scenarios work correctly

---

## Testing Scenarios

### Test 1: Basic Copy and Paste

1. Create a rectangle and select it
2. Press **Ctrl+C** → see "Shape copied to clipboard" toast
3. Press **Ctrl+V** → rectangle duplicates with offset
4. Verify pasted rectangle is selected
5. Verify both shapes sync to other users

### Test 2: Multiple Shape Types

1. Create rectangle, circle, triangle, and text shape
2. Select each shape and test **Ctrl+C** → **Ctrl+V**
3. Verify all shape types copy/paste correctly
4. Verify text formatting is preserved

### Test 3: Keyboard Shortcuts

1. Select any shape
2. Press **Delete** → shape deleted, selection cleared
3. Press **Escape** → selection cleared
4. Press **Ctrl+A** → first shape selected
5. Verify all shortcuts work as expected

### Test 4: Multi-User Copy/Paste

1. User A creates and copies a shape
2. User A pastes the shape
3. User B sees both original and pasted shape
4. User B can copy and paste shapes independently
5. No conflicts between users

### Test 5: Clipboard Persistence

1. Copy a shape
2. Create new shapes, delete others
3. Paste → original copied shape should paste
4. Copy different shape
5. Paste → new shape should paste

---

## Edge Cases & Error Handling

### 1. No Shape Selected

- Copy: Show "No shape selected" toast
- Delete: No action (already handled by condition)

### 2. Empty Clipboard

- Paste: Show "Nothing to paste" toast

### 3. Shape Deleted During Copy

- Handle gracefully: Clear clipboard, show error toast

### 4. Canvas Not Focused

- Shortcuts only work when canvas has focus
- Add focus management if needed

### 5. Lock Conflicts

- Copy: Works on any shape (read-only operation)
- Paste: Creates new shape (no lock conflicts)
- Delete: Only works on shapes locked by current user

---

## File Changes Summary

### Modified Files

- `Canvas.tsx`: Add clipboard state, keyboard handlers, copy/paste logic
- No new files needed
- No service layer changes needed (uses existing `duplicateShape` and `deleteShape`)

### New State Variables

- `clipboard`: Stores copied shapes and timestamp
- `PASTE_OFFSET`: Constant for paste position offset

### New Functions

- `handleCopyShape()`: Copy selected shape to clipboard
- `handlePasteShape()`: Paste clipboard shapes with offset
- `handleSelectAll()`: Select first available shape
- `handleDeleteSelected()`: Delete selected shape

---

## Future Enhancements

### Multi-Select Support (Future PR)

- **Ctrl+Click**: Add/remove shapes from selection
- **Shift+Click**: Select range of shapes
- **Ctrl+A**: Select all shapes (not just first)
- Copy/paste multiple shapes at once

### Advanced Clipboard Features

- **Ctrl+X**: Cut shape (copy + delete)
- **Ctrl+Shift+V**: Paste in place (no offset)
- Clipboard history (multiple copied items)
- Cross-session clipboard persistence

### Visual Feedback

- Highlight copied shapes briefly
- Show paste preview before placing
- Animate paste operation

---

## Notes

**Integration Points:**
- Uses existing `canvasService.duplicateShape()` method
- Uses existing `canvasService.deleteShape()` method
- Integrates with existing lock system
- Works with all existing shape types

**Keyboard Shortcuts:**
- Standard shortcuts (Ctrl+C/V/A) for familiarity
- Escape for deselect (common UX pattern)
- Delete/Backspace for deletion (intuitive)

**Performance:**
- Clipboard stored in component state (lightweight)
- No additional Firestore operations
- Minimal impact on existing functionality

**Accessibility:**
- All operations have visual feedback via toasts
- Keyboard shortcuts documented in UI
- Works with screen readers

---

## Ready to Proceed?

This PRD provides a complete implementation plan for keyboard shortcuts to copy and paste objects. The approach:

1. ✅ Builds on existing duplicate functionality
2. ✅ Uses standard keyboard shortcuts
3. ✅ Maintains real-time sync
4. ✅ Supports all shape types
5. ✅ Includes comprehensive testing
6. ✅ Estimated 3-4 hours implementation time

The implementation is ready to begin with Phase 1 (clipboard state management) and proceed through all phases systematically. 🚀