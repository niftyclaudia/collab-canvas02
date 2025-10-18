# PRD: Text Editing & Formatting (PR2 of 3)

**Feature:** Text Layer Support - Editing & Formatting

**Version:** 1.0

**Status:** Ready for Development

**Estimated Effort:** 4-5 hours

---

## Overview

This is **PR2 of 3** for text layer support. This PR adds text editing functionality (double-click to edit with HTML overlay) and formatting controls (bold, italic, underline, font size dropdown) that appear in the ShapeControls panel when a text shape is locked.

### What PR1 Delivered ✅

- Text rendering using Konva `<Text>` component
- Text tool button in ColorToolbar
- Click-to-create text placement with hardcoded "TEXT" content
- Lock system integration (green/red borders)
- Real-time Firestore sync

### What PR2 Adds 🎯

- Double-click text to enter edit mode
- HTML textarea overlay for text editing
- Save on Enter/Blur, cancel on Escape
- Bold, Italic, Underline toggle buttons in ShapeControls
- Font size dropdown (12, 14, 16, 18, 20, 24, 32, 48px) in ShapeControls
- Automatic text dimension recalculation on font size change
- Real-time formatting sync

### What's Coming Later 📋

- **PR3:** Additional formatting (if needed) or text enhancements

---

## Technical Architecture

### 1. Text Editing Flow

**Trigger:** Double-click on text shape (when locked by current user)

**Flow:**

1. User locks text shape (click) → green border appears
2. User double-clicks text → HTML overlay appears
3. User edits text in overlay
4. User presses Enter or clicks outside → save to Firestore → hide overlay
5. User presses Escape → cancel → hide overlay

**State Management:**

- Add `editingTextId` state to Canvas component
- Track active textarea ref for focus management
- Handle keyboard events (Enter, Escape)

### 2. HTML Overlay Implementation

**Positioning Strategy:**

```typescript
// Convert canvas coordinates to screen coordinates
const stage = stageRef.current;
const stagePos = stage.getAbsolutePosition();
const stageScale = stage.scaleX();

const overlayX = (shape.x * stageScale) + stagePos.x;
const overlayY = (shape.y * stageScale) + stagePos.y;
const overlayWidth = shape.width * stageScale;
```

**Styling:**

- Match text shape's fontSize, color, fontWeight, fontStyle, textDecoration
- Transparent background
- Border: 2px solid #3b82f6 (blue, indicates edit mode)
- Auto-resize height based on content

### 3. Service Layer Extensions

**File:** `app/src/services/canvasService.ts`

Add these methods:

```typescript
/**
 * Update text content only
 */
async updateTextContent(shapeId: string, text: string): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text content cannot be empty');
  }
  
  const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
  const shapeDoc = await getDoc(shapeRef);
  
  if (!shapeDoc.exists()) {
    throw new Error('Shape not found');
  }
  
  const shape = shapeDoc.data() as Shape;
  const fontSize = shape.fontSize || 16;
  
  // Recalculate dimensions based on new text
  const estimatedWidth = text.length * fontSize * 0.6;
  const estimatedHeight = fontSize * 1.2;
  
  await updateDoc(shapeRef, {
    text: text,
    width: estimatedWidth,
    height: estimatedHeight,
    updatedAt: serverTimestamp()
  });
}

/**
 * Update text font size
 */
async updateTextFontSize(shapeId: string, fontSize: number): Promise<void> {
  if (fontSize < 8 || fontSize > 200) {
    throw new Error('Font size must be between 8 and 200 pixels');
  }
  
  const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
  const shapeDoc = await getDoc(shapeRef);
  
  if (!shapeDoc.exists()) {
    throw new Error('Shape not found');
  }
  
  const shape = shapeDoc.data() as Shape;
  const text = shape.text || 'TEXT';
  
  // Recalculate dimensions based on new font size
  const estimatedWidth = text.length * fontSize * 0.6;
  const estimatedHeight = fontSize * 1.2;
  
  await updateDoc(shapeRef, {
    fontSize: fontSize,
    width: estimatedWidth,
    height: estimatedHeight,
    updatedAt: serverTimestamp()
  });
}

/**
 * Update text formatting (bold, italic, underline)
 */
async updateTextFormatting(shapeId: string, formatting: {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}): Promise<void> {
  const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
  await updateDoc(shapeRef, {
    ...formatting,
    updatedAt: serverTimestamp()
  });
}
```

### 4. ShapeControls Enhancement

**File:** `app/src/components/Canvas/ShapeControls.tsx`

Update to show formatting controls when text shape is locked:

**Props Update:**

```typescript
interface ShapeControlsProps {
  shapeId: string;
  shape: Shape;  // NEW: Pass full shape object
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: (shapeId: string) => void;
  onDuplicate: (shapeId: string) => void;
}
```

**Layout for Text Shapes:**

```
┌─────────────────────────────────────────────┐
│ Text Controls                               │
├─────────────────────────────────────────────┤
│ [🗑️ Delete]  [📋 Duplicate]                │
├─────────────────────────────────────────────┤
│ [B] [I] [U̲]  Font Size: [16px ▼]          │
└─────────────────────────────────────────────┘
```

**Button Styles:**

- Active state: `background: #3b82f6`, `color: white`
- Inactive state: `background: #f3f4f6`, `color: #1f2937`
- Font size dropdown: Standard select element

### 5. Canvas Component Updates

**File:** `app/src/components/Canvas/Canvas.tsx`

**State Additions:**

```typescript
const [editingTextId, setEditingTextId] = useState<string | null>(null);
const textareaRef = useRef<HTMLTextAreaElement | null>(null);
```

**Double-Click Handler:**

```typescript
const handleTextDoubleClick = useCallback((e: KonvaEventObject<MouseEvent>, shape: Shape) => {
  e.cancelBubble = true;
  
  // Only allow editing if locked by me
  const lockStatus = getShapeLockStatus(shape);
  if (lockStatus !== 'locked-by-me') return;
  
  setEditingTextId(shape.id);
  
  // Focus textarea after render
  setTimeout(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, 0);
}, [getShapeLockStatus]);
```

**Text Save Handler:**

```typescript
const handleTextSave = useCallback(async (shapeId: string, newText: string) => {
  if (!newText.trim()) {
    showToast('Text cannot be empty', 'error');
    return;
  }
  
  try {
    await canvasService.updateTextContent(shapeId, newText.trim());
    setEditingTextId(null);
  } catch (error) {
    console.error('Failed to update text:', error);
    showToast('Failed to update text', 'error');
  }
}, [showToast]);
```

**Text Cancel Handler:**

```typescript
const handleTextCancel = useCallback(() => {
  setEditingTextId(null);
}, []);
```

**Konva Text Component Update:**

Add `onDblClick` handler:

```typescript
{shape.type === 'text' && (
  <Text
    text={shape.text || 'TEXT'}
    x={-displayWidth / 2}
    y={-displayHeight / 2}
    width={displayWidth}
    height={displayHeight}
    fontSize={shape.fontSize || 16}
    fontFamily="Arial"
    fontStyle={shape.fontStyle || 'normal'}
    fontWeight={shape.fontWeight || 'normal'}
    textDecoration={shape.textDecoration || 'none'}
    fill={shape.color}
    opacity={opacity}
    listening={true}
    align="center"
    verticalAlign="middle"
    onDblClick={(e) => handleTextDoubleClick(e, shape)}  // NEW
  />
)}
```

**HTML Overlay Rendering:**

```tsx
{/* Text editing overlay */}
{editingTextId && (() => {
  const editingShape = shapes.find(s => s.id === editingTextId);
  if (!editingShape || editingShape.type !== 'text') return null;
  
  const stage = stageRef.current;
  if (!stage) return null;
  
  const stagePos = stage.getAbsolutePosition();
  const stageScale = stage.scaleX();
  
  // Calculate screen position
  const overlayX = (editingShape.x * stageScale) + stagePos.x;
  const overlayY = (editingShape.y * stageScale) + stagePos.y;
  const overlayWidth = editingShape.width * stageScale;
  
  return (
    <textarea
      ref={textareaRef}
      defaultValue={editingShape.text || 'TEXT'}
      style={{
        position: 'absolute',
        left: `${overlayX}px`,
        top: `${overlayY}px`,
        width: `${overlayWidth}px`,
        minHeight: `${(editingShape.height || 20) * stageScale}px`,
        fontSize: `${(editingShape.fontSize || 16) * stageScale}px`,
        fontWeight: editingShape.fontWeight || 'normal',
        fontStyle: editingShape.fontStyle || 'normal',
        textDecoration: editingShape.textDecoration || 'none',
        color: editingShape.color,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        padding: '4px',
        fontFamily: 'Arial',
        resize: 'none',
        zIndex: 2000,
        overflow: 'hidden'
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleTextSave(editingTextId, e.currentTarget.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleTextCancel();
        }
      }}
      onBlur={(e) => {
        handleTextSave(editingTextId, e.currentTarget.value);
      }}
    />
  );
})()}
```

---

## Implementation Steps

### Phase 1: Service Layer (1 hour)

**File:** `app/src/services/canvasService.ts`

1. Add `updateTextContent()` method with dimension recalculation
2. Add `updateTextFontSize()` method with dimension recalculation
3. Add `updateTextFormatting()` method for bold/italic/underline

### Phase 2: Text Editing Overlay (2 hours)

**File:** `app/src/components/Canvas/Canvas.tsx`

1. Add `editingTextId` state and `textareaRef`
2. Add `handleTextDoubleClick` handler
3. Add `handleTextSave` handler
4. Add `handleTextCancel` handler
5. Add `onDblClick` to Konva Text component
6. Render HTML textarea overlay with proper positioning
7. Handle Enter (save), Escape (cancel), Blur (save) events

### Phase 3: Formatting Controls in ShapeControls (1.5 hours)

**File:** `app/src/components/Canvas/ShapeControls.tsx`

1. Update props to include full `shape` object
2. Detect if shape is text type
3. Render formatting buttons (Bold, Italic, Underline)
4. Render font size dropdown
5. Add toggle handlers for formatting
6. Add change handler for font size
7. Style active/inactive button states

**File:** `app/src/components/Canvas/Canvas.tsx`

1. Update `ShapeControls` usage to pass `shape` object
2. Import `canvasService` methods for formatting updates

### Phase 4: Integration & Testing (0.5 hours)

1. Test double-click edit mode
2. Test Enter/Escape/Blur behaviors
3. Test formatting toggles with real-time sync
4. Test font size changes with dimension recalculation
5. Verify multi-user sync (User A edits → User B sees update <100ms)

---

## Success Criteria

PR2 is complete when:

1. ✅ Double-clicking locked text shape enters edit mode
2. ✅ HTML textarea overlay appears at correct position
3. ✅ Textarea matches text formatting (size, color, bold, italic, underline)
4. ✅ Enter key saves text and exits edit mode
5. ✅ Escape key cancels edit and exits edit mode
6. ✅ Clicking outside (blur) saves text and exits edit mode
7. ✅ Bold, Italic, Underline buttons appear in ShapeControls for text shapes
8. ✅ Font size dropdown appears in ShapeControls for text shapes
9. ✅ Formatting toggles work and sync in <100ms
10. ✅ Font size changes recalculate text dimensions automatically
11. ✅ All changes sync to Firestore in <100ms
12. ✅ Collaborators see edits and formatting changes in real-time
13. ✅ Empty text is rejected with error message

---

## Testing Scenarios

### Test 1: Text Editing - Enter to Save

1. User A locks text shape
2. User A double-clicks text → overlay appears
3. User A types "Hello World"
4. User A presses Enter → text saved, overlay disappears
5. User B sees "Hello World" in <100ms ✅

### Test 2: Text Editing - Escape to Cancel

1. User A locks text shape showing "TEXT"
2. User A double-clicks → overlay appears
3. User A types "Changed"
4. User A presses Escape → overlay disappears, text still "TEXT"
5. User B sees no change ✅

### Test 3: Text Editing - Blur to Save

1. User A locks text, double-clicks, types "New Text"
2. User A clicks outside textarea
3. Text saves, overlay disappears
4. User B sees "New Text" in <100ms ✅

### Test 4: Bold Formatting

1. User A locks text shape
2. User A clicks Bold button → button turns blue (active)
3. Text becomes bold
4. User B sees bold text in <100ms ✅

### Test 5: Multiple Formatting (Bold + Italic + Underline)

1. User A locks text
2. User A clicks Bold → active
3. User A clicks Italic → active
4. User A clicks Underline → active
5. All three formats apply simultaneously
6. User B sees all formatting in <100ms ✅

### Test 6: Font Size Change

1. User A locks text showing "Hello" (16px)
2. User A selects 32px from dropdown
3. Text becomes 32px, dimensions automatically adjust
4. User B sees 32px text in <100ms ✅

### Test 7: Empty Text Rejection

1. User A locks text, double-clicks
2. User A deletes all text, presses Enter
3. Error toast: "Text cannot be empty"
4. Overlay remains open, original text preserved ✅

### Test 8: Double-Click Only When Locked

1. User A clicks text (unlocked) → locks it
2. User A can now double-click to edit
3. User B cannot double-click (text locked by User A) ✅

---

## File Changes Summary

### New Methods

- `canvasService.ts`: `updateTextContent()`, `updateTextFontSize()`, `updateTextFormatting()`

### Modified Files

- `Canvas.tsx`: Add edit state, overlay rendering, double-click handler
- `ShapeControls.tsx`: Add formatting buttons and font size dropdown for text shapes

### No Changes Needed

- `ColorToolbar.tsx`: Already has text tool from PR1
- `CanvasContext.tsx`: Existing update methods sufficient

---

## Edge Cases & Error Handling

### 1. Empty Text

- Reject with error toast: "Text cannot be empty"
- Keep overlay open, preserve original text

### 2. Text Too Long

- Textarea auto-expands vertically
- Width constrained to prevent overflow

### 3. Zoom/Pan During Edit

- Overlay position updates would be complex
- **Recommendation:** Cancel edit mode on zoom/pan events

### 4. Shape Deleted During Edit

- Handle gracefully: close overlay, show toast

### 5. Lock Lost During Edit

- Auto-save current text, close overlay

---

## Notes

- Konva `<Text>` continues to handle display (no changes to PR1 rendering)
- HTML overlay is temporary, only during edit mode
- Formatting controls are additive (can combine bold + italic + underline)
- Font size changes trigger automatic dimension recalculation
- All updates use existing lock system from PR1