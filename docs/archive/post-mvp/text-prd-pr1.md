# PRD: Text Layers Foundation (PR1 of 3)

**Feature:** Text Layer Support - Rendering & Creation  
**Version:** 2.0 (Revamped Foundation)  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 hours

---

## Overview

This is **PR1 of 3** for text layer support. This foundational PR adds text rendering to the canvas and enables basic text creation. The backend service layer is already complete - this PR focuses on the **missing frontend rendering** and UI integration.

### What's Already Done ✅
- `canvasService.createText()` method with full formatting support
- Complete text data model in Firestore
- Text shape type in TypeScript interfaces
- Delete and duplicate work for text shapes

### What PR1 Adds 🎯
- Text rendering in Canvas component using Konva `<Text>`
- Text tool button in ColorToolbar
- Click-to-create text placement
- Hardcoded "TEXT" placeholder content
- Lock system integration (green/red borders)
- Real-time Firestore sync

### What's Coming Later 📋
- **PR2:** Text editing (double-click to edit content, HTML overlay)
- **PR3:** Format controls (bold, italic, underline, font size dropdown)

---

## Current State Analysis

### Backend Service Layer (Complete ✅)

Your `canvasService.ts` already has:

```typescript
async createText(
  text: string,
  x: number,
  y: number,
  fontSize: number = 16,
  color: string = '#000000',
  fontWeight: string = 'normal',
  fontStyle: string = 'normal',
  textDecoration: string = 'none',
  createdBy: string
): Promise<Shape>
```

**Note:** Don't modify this method! It's already correct and will be used for editing in PR2.

### Frontend Rendering (Missing ❌)

Your `Canvas.tsx` renders:
- ✅ Rectangles (lines 1550-1562)
- ✅ Circles (lines 1564-1575)
- ✅ Triangles (lines 1577-1592)
- ❌ **Text (not implemented)**

This is the critical gap PR1 must fix.

---

## Technical Architecture

### Rendering Strategy: Center-Point with Groups

All your shapes use a **center-point positioning system** with Konva Groups:

```typescript
<Group
  x={shape.x + shape.width / 2}      // Center X
  y={shape.y + shape.height / 2}     // Center Y
  rotation={shape.rotation}
>
  <Rect
    x={-displayWidth / 2}             // Offset from center
    y={-displayHeight / 2}
    width={displayWidth}
    height={displayHeight}
  />
</Group>
```

**Text must follow the same pattern** for consistency with rotation and transforms.

### Why Konva Native (Not HTML Overlay)

**Konva `<Text>` Benefits:**
- Integrates with canvas coordinate system
- Handles zoom/pan automatically
- No positioning bugs with transforms
- Consistent with other shapes
- Supports rotation out of the box

**HTML Overlay for Editing (PR2 Only):**
- Will be used temporarily during edit mode
- Positioned over canvas at text location
- Hidden when not editing
- Better keyboard input handling

### Text Width/Height Estimation

Your service already estimates text bounds:

```typescript
const estimatedWidth = text.length * fontSize * 0.6;
const estimatedHeight = fontSize * 1.2;
```

**For PR1:** This estimation is sufficient. Konva will render text at actual size.

**For PR2+:** Consider using Konva's `getTextWidth()` for precise selection borders.

---

## Data Model

### Firestore Path

**Path:** `canvases/main/shapes/{shapeId}`

**Important:** No `projectId` in path - uses hardcoded `'canvases/main/shapes'`

### Text Shape Structure

```typescript
{
  id: string,                    // Auto-generated
  type: "text",                  // Shape type
  text: "TEXT",                  // Content (hardcoded in PR1)
  x: number,                     // Top-left X (converted to center in rendering)
  y: number,                     // Top-left Y (converted to center in rendering)
  width: number,                 // Estimated width
  height: number,                // Estimated height
  fontSize: 16,                  // Default font size (fixed in PR1)
  color: string,                 // From color palette
  fontWeight: "normal",          // Fixed in PR1
  fontStyle: "normal",           // Fixed in PR1
  textDecoration: "none",        // Fixed in PR1
  rotation: 0,                   // Rotation in degrees (works automatically)
  zIndex: number,                // Auto-assigned
  createdBy: string,             // Creator UID
  createdAt: Timestamp,
  lockedBy: string | null,       // Lock system
  lockedAt: Timestamp | null,
  updatedAt: Timestamp
}
```

**TypeScript Type:** Already defined in `Shape` interface - no changes needed!

---

## Implementation Guide

### Phase 1: Add Text Rendering to Canvas (2 hours)

**File:** `app/src/components/Canvas/Canvas.tsx`

**Location:** After triangle rendering (around line 1593)

```typescript
{shape.type === 'text' && (
  <Text
    text={shape.text || 'TEXT'}
    x={-displayWidth / 2}              // Offset from center (like other shapes)
    y={-displayHeight / 2}
    width={displayWidth}               // Constrain text to estimated width
    fontSize={shape.fontSize || 16}
    fill={shape.color}
    fontStyle={
      shape.fontWeight === 'bold' && shape.fontStyle === 'italic' 
        ? 'bold italic' 
        : shape.fontWeight === 'bold' 
          ? 'bold' 
          : shape.fontStyle === 'italic' 
            ? 'italic' 
            : 'normal'
    }
    textDecoration={shape.textDecoration || 'none'}
    listening={true}
  />
)}
```

**Key Points:**
- Use `x={-displayWidth / 2}` to match center-point positioning
- Text is inside the same `<Group>` as other shapes, so rotation works automatically
- `fontStyle` combines `fontWeight` and `fontStyle` (Konva requirement)
- `textDecoration` handles underline
- All properties already exist in your Shape interface

### Phase 2: Add Text Tool to Toolbar (30 min)

**File:** `app/src/components/Canvas/ColorToolbar.tsx`

**Update `shapeTools` array (line 14):**

```typescript
const shapeTools = [
  { name: 'Rectangle', value: 'rectangle', icon: '🟥' },
  { name: 'Circle', value: 'circle', icon: '🔴' },
  { name: 'Triangle', value: 'triangle', icon: '🔺' },
  { name: 'Text', value: 'text', icon: '📝' },  // NEW
];
```

**That's it!** The existing map/render logic handles the rest.

### Phase 3: Update TypeScript Types (15 min)

**File:** `app/src/contexts/CanvasContext.tsx`

**Update `ShapeTool` type (line 21):**

```typescript
export type ShapeTool = 'rectangle' | 'circle' | 'triangle' | 'text';
```

### Phase 4: Add Text Creation Handler (1 hour)

**File:** `app/src/components/Canvas/Canvas.tsx`

**Find the canvas click handler** (search for `handleStageClick` or canvas click logic)

**Add text creation logic:**

```typescript
const handleStageClick = (e: any) => {
  if (mode !== 'create') return;
  
  // Get click position on canvas
  const stage = e.target.getStage();
  const pointerPos = stage.getPointerPosition();
  const stageAttrs = stage.attrs;
  const scale = stageAttrs.scaleX || 1;
  const x = (pointerPos.x - stageAttrs.x) / scale;
  const y = (pointerPos.y - stageAttrs.y) / scale;
  
  // Handle text tool click
  if (activeTool === 'text') {
    createTextAtPosition(x, y);
    return;
  }
  
  // Existing drawing logic for other shapes...
};

const createTextAtPosition = async (x: number, y: number) => {
  if (!user) return;
  
  try {
    await canvasService.createText(
      'TEXT',                    // Hardcoded placeholder
      x,
      y,
      16,                        // Default fontSize
      selectedColor,
      'normal',                  // fontWeight
      'normal',                  // fontStyle
      'none',                    // textDecoration
      user.uid
    );
  } catch (error) {
    console.error('Failed to create text:', error);
    showToast('Failed to create text', 'error');
  }
};
```

**Alternative (if using drawing state):**

If your canvas uses `startDrawing/finishDrawing` for all shapes, modify `finishDrawing` in `CanvasContext.tsx`:

```typescript
const finishDrawing = useCallback(async () => {
  // ... existing code ...
  
  if (activeTool === 'text') {
    // For text, just place at start point (no drag needed)
    const { x, y } = drawingState.startPoint!;
    
    await canvasService.createText(
      'TEXT',
      x,
      y,
      16,
      selectedColor,
      'normal',
      'normal',
      'none',
      user!.uid
    );
  }
  // ... rest of existing code ...
}, [/* deps */]);
```

### Phase 5: Exclude Text from Resize Handles (15 min)

**File:** `app/src/components/Canvas/Canvas.tsx`

**Find resize handle rendering** (around line 1595)

**Update condition:**

```typescript
{effectiveLockStatus === 'locked-by-me' && 
 !isBeingResized && 
 !hasOptimisticUpdate && 
 !hiddenSelectors.has(shape.id) && 
 shape.type !== 'text' &&  // NEW: Exclude text from resize handles
 (() => {
  // ... resize handles code ...
})()}
```

**Why:** Text should be resized via font size dropdown (PR3), not drag handles.

---

## Testing Scenarios

### Test 1: Text Rendering
1. User A opens canvas
2. Verify existing text shapes render (if any exist in Firestore)
3. Text should be readable at all zoom levels (25%, 100%, 200%)

### Test 2: Text Tool Activation
1. User A clicks "Create" mode button
2. User A clicks "Text" tool (📝 icon)
3. Verify text tool button shows active state (blue border)

### Test 3: Text Creation
1. User A activates text tool
2. User A clicks canvas at position (200, 150)
3. Text "TEXT" appears at (200, 150)
4. **User B sees "TEXT" in <100ms** ✅ Real-time sync

### Test 4: Text with Color
1. User A selects red color
2. User A creates text → text is red
3. User A selects blue color
4. User A creates another text → text is blue
5. First text remains red, second is blue ✅

### Test 5: Lock System
1. User A creates text "TEXT"
2. User A clicks text → locks it (green border)
3. User B sees green border around text
4. User B cannot move text
5. User A unlocks → User B can now lock it ✅

### Test 6: Text Movement
1. User A creates text
2. User A locks text (click it)
3. User A drags text to new position
4. User B sees movement in real-time <100ms ✅

### Test 7: Text Deletion
1. User A locks text
2. User A clicks delete button (existing UI)
3. Text disappears
4. User B sees deletion in <100ms ✅

### Test 8: Text Rotation (Bonus)
1. User A locks text
2. User A uses rotation handle
3. Text rotates around center
4. User B sees rotation in real-time ✅

**Note:** Rotation should work automatically since text is inside the rotated `<Group>`.

### Test 9: No Resize Handles
1. User A locks text
2. Verify NO resize handles appear (unlike rectangles/circles)
3. Only rotation handle and delete button should show ✅

---

## Success Criteria

PR1 is complete when:

1. ✅ Text shapes render on canvas using Konva `<Text>`
2. ✅ Text tool button appears in toolbar (📝 icon)
3. ✅ Clicking text tool activates text creation mode
4. ✅ Clicking canvas creates text at click position
5. ✅ Text content is "TEXT" (hardcoded)
6. ✅ Text uses selected color from palette
7. ✅ Text syncs to Firestore in <100ms
8. ✅ Text respects lock system (green/red borders)
9. ✅ Text can be moved when locked
10. ✅ Text can be deleted using existing controls
11. ✅ Text rotation works (inherits from Group)
12. ✅ Text has NO resize handles (unlike other shapes)
13. ✅ Text is readable at all zoom levels (25%-200%)

---

## Explicitly Out of Scope (Coming in PR2/PR3)

**Not in PR1:**

- ❌ Text editing (double-click to change content) → **PR2**
- ❌ HTML input overlay for editing → **PR2**
- ❌ Bold/italic/underline buttons → **PR3**
- ❌ Font size dropdown → **PR3**
- ❌ Font family selection → Future
- ❌ Text alignment (left/center/right) → Future
- ❌ Multi-line text → Future
- ❌ Resize handles that change font size → Future

---

## Error Handling

### Validation (Already in Service)

Your `createText()` method already validates:
- ✅ Non-empty text content
- ✅ Font size range (8-200px)
- ✅ Canvas bounds

### UI Error Handling

```typescript
try {
  await canvasService.createText(/* ... */);
} catch (error) {
  console.error('Failed to create text:', error);
  showToast('Failed to create text', 'error');
}
```

Use existing `showToast` from `useToast` hook.

---

## Implementation Notes

### Path Pattern (Critical!)

Always use hardcoded path:

```typescript
const path = 'canvases/main/shapes';
```

**Do NOT use `projectId`** - your codebase doesn't support it yet.

### Type Guards

For rendering logic:

```typescript
if (shape.type === 'text') {
  // Text-specific rendering
}
```

TypeScript will narrow the type to include text properties.

### Default Values for PR1

All text shapes use:
- `text: "TEXT"` (hardcoded)
- `fontSize: 16` (default)
- `fontWeight: "normal"`
- `fontStyle: "normal"`
- `textDecoration: "none"`
- `rotation: 0` (can be changed via rotation handle)
- `color: selectedColor` (from palette)

### Lock System Integration

Text uses **existing lock system** - no new code needed:
- Green border: Locked by me
- Red border: Locked by other
- No border: Unlocked

Rendering logic already handles this via `effectiveLockStatus`.

### Konva Text Width (Future Enhancement)

For precise selection borders in PR2+:

```typescript
const textNode = textRef.current;
if (textNode) {
  const actualWidth = textNode.getTextWidth();
  const actualHeight = textNode.getTextHeight();
}
```

Not needed in PR1 since we use estimated bounds.

---

## PR2 Preview: Text Editing Strategy

**Why Konva `<Text>` for PR1, HTML for PR2 editing:**

1. **Display (PR1):** Konva `<Text>` handles rendering, zoom, rotation perfectly
2. **Editing (PR2):** HTML `<input>` or `<textarea>` overlay provides:
   - Better keyboard input
   - Native text selection
   - Copy/paste support
   - IME (international input) support

**Approach for PR2:**
- Double-click text → show HTML input overlay at text position
- Input positioned using absolute positioning + canvas transform
- Enter saves → update Firestore → hide input
- Escape cancels → hide input
- Blur saves automatically

This hybrid approach combines the best of both worlds.

---

## Lessons from Figma Clone Analysis

### What We Adopted ✅

1. **Center-Point Positioning:** Text follows your existing Group/center-point architecture
2. **Konva for Display:** Use Konva `<Text>` for rendering (not HTML)
3. **HTML for Editing:** Plan for HTML overlay in PR2 for better input UX
4. **Rotation Support:** Text rotation works automatically via Group transforms
5. **No Resize Handles:** Text uses font size changes, not drag-to-resize

### What We Kept Simple 🎯

1. **Text Measurement:** Estimation is fine for MVP, not worth complex canvas measurement
2. **Single Line Only:** Multi-line text deferred to future (adds significant complexity)
3. **No Alignment Controls:** Left-align only for PR1-3 (simplifies implementation)
4. **Fixed Font Family:** System default for now (font picker is complex UI)

---

## Questions & Troubleshooting

### Q: Text not appearing after creation?

**Check:**
1. Is `shape.type === 'text'` rendering block added to Canvas.tsx?
2. Is text rendering inside the `<Group>` (not outside)?
3. Does Firestore show the text document with correct `type: "text"`?
4. Are there console errors about missing properties?

### Q: Text position wrong after zoom/pan?

**Fix:** Ensure text uses `x={-displayWidth / 2}` (center offset), not `x={shape.x}` (absolute).

### Q: Text doesn't rotate?

**Check:** Text must be inside the `<Group>` with rotation. If outside, it won't rotate.

### Q: Resize handles appearing on text?

**Fix:** Add `shape.type !== 'text'` condition to resize handle rendering logic.

### Q: Tool button not working?

**Check:**
1. Did you add `'text'` to `ShapeTool` TypeScript type?
2. Is the icon added to `shapeTools` array in ColorToolbar?
3. Are there TypeScript errors about invalid tool type?

---

## Code Review Checklist

Before submitting PR:

- [ ] Text rendering added to Canvas.tsx (after triangle block)
- [ ] Text tool button added to ColorToolbar
- [ ] `ShapeTool` type updated to include `'text'`
- [ ] Text creation handler implemented
- [ ] Resize handles excluded for text shapes (`shape.type !== 'text'`)
- [ ] All 9 test scenarios pass
- [ ] Text syncs in <100ms (tested with collaborator)
- [ ] Text respects lock system (green/red borders)
- [ ] Text is readable at 25%, 100%, 200% zoom
- [ ] No TypeScript errors
- [ ] No console errors during text operations
- [ ] Code follows existing patterns (Group/center-point positioning)

---

## Next Steps (After PR1)

### PR2: Text Editing (Coming Next)
- Double-click handler on text shapes
- HTML overlay input positioned at text location
- Save on Enter, cancel on Escape
- Update text content in Firestore
- Real-time sync of edits

### PR3: Text Formatting (Final PR)
- Bold, italic, underline toggle buttons
- Font size dropdown (12, 14, 16, 18, 20, 24, 32, 48px)
- Controls panel when text is locked
- Real-time formatting sync

---

## Summary

**This PR is laser-focused:** Add text rendering and basic creation. Nothing more.

**Key Insight:** Your backend is ready - we just need to show text on the canvas and let users create it.

**Time Estimate:** 3-4 hours if you follow this guide step-by-step.

**Success Looks Like:** User clicks text tool → clicks canvas → "TEXT" appears → collaborator sees it instantly. That's it!

---
