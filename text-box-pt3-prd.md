# PRD: Text Formatting Toolbar

**Feature:** Text Formatting Controls (Bold, Italic, Underline, Font Size)  

---

## Overview

This PRD implements **text formatting functionality** for text shapes on the collaborative canvas. Users can apply bold, italic, underline formatting and change font sizes through a floating toolbar that appears when text is selected.

**Current State:**
- ✅ Text shapes can be created and edited
- ✅ Lock system and real-time sync work
- ❌ **No formatting controls exist**

**Goal:** Enable users to apply professional text formatting with a floating toolbar.

---

## User Stories

- I want to select text and see a formatting toolbar appear
- I want to click **Bold/Italic/Underline** and see immediate visual changes
- I want to change font size using a dropdown (12-48px) or custom input (1-500px)
- I want formatting to persist when I edit text content
- I want keyboard shortcuts (Cmd+B/I/U) to toggle formatting
- I want the toolbar to stay visible while editing text
- I want to see other users' formatting changes in real-time

---

## Technical Requirements

### 1. Firestore Schema Extension

```typescript
interface TextShape {
  // Existing properties...
  
  // NEW: Formatting properties
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  fontSize: number; // Already exists, included for completeness
}
```

**Default Values:**
```typescript
{
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  fontSize: 16
}
```

---

### 2. State Management

**Add to CanvasContext:**
```typescript
interface CanvasContextType {
  // Existing...
  
  selectedTextFormatting: {
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    fontSize: number;
  } | null;
  
  toggleBold: () => Promise<void>;
  toggleItalic: () => Promise<void>;
  toggleUnderline: () => Promise<void>;
  setFontSize: (size: number) => Promise<void>;
}
```

**State Flow:**
- Formatting state is **derived from selected shape** (single source of truth)
- When text is selected → populate `selectedTextFormatting`
- When formatting changes → update Firestore → state updates automatically

---

### 3. Canvas Service Methods

```typescript
// services/canvasService.ts

async toggleTextBold(shapeId: string, currentWeight: 'normal' | 'bold'): Promise<void> {
  const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
  await updateDoc(shapeRef, {
    fontWeight: newWeight,
    updatedAt: serverTimestamp()
  });
}

async toggleTextItalic(shapeId: string, currentStyle: 'normal' | 'italic'): Promise<void> {
  const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
  await updateDoc(shapeRef, {
    fontStyle: newStyle,
    updatedAt: serverTimestamp()
  });
}

async toggleTextUnderline(shapeId: string, currentDecoration: 'none' | 'underline'): Promise<void> {
  const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
  await updateDoc(shapeRef, {
    textDecoration: newDecoration,
    updatedAt: serverTimestamp()
  });
}

async updateTextFontSize(shapeId: string, size: number): Promise<void> {
  if (size < 1 || size > 500) {
    throw new Error('Font size must be between 1 and 500');
  }
  await updateDoc(shapeRef, {
    fontSize: size,
    updatedAt: serverTimestamp()
  });
}
```

---

### 4. Formatting Toolbar Component

**Component Structure:**
```typescript
interface FormattingToolbarProps {
  targetShapeId: string;
  currentFormatting: {
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    fontSize: number;
  };
  position: { x: number; y: number };
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onChangeFontSize: (size: number) => void;
}
```

**Toolbar Layout:**
```
┌─────────────────────────────────────────┐
│  [B] [I] [U]  │  [16 ▼]  [Custom: __]  │
└─────────────────────────────────────────┘
```

**Visibility Rules:**
- Show when text shape is selected
- **Persist during text editing**
- Hide when text is deselected
- Hide when non-text shape is selected

**Positioning:**
```typescript
const calculateToolbarPosition = (
  textNode: Konva.Node,
  stage: Konva.Stage
): { x: number; y: number } => {
  const textBox = textNode.getClientRect();
  const { x: stageX, y: stageY } = stage.position();
  const zoom = stage.scaleX();
  
  // Center toolbar above text with 10px gap
  const toolbarX = textBox.x + (textBox.width / 2);
  const toolbarY = textBox.y - 50; // 40px toolbar height + 10px gap
  
  return {
    x: (toolbarX * zoom) + stageX,
    y: (toolbarY * zoom) + stageY
  };
};
```

---

### 5. Konva Rendering Integration

**Apply Formatting to Konva Text:**
```typescript
// IMPORTANT: Konva doesn't have fontWeight property
// Use fontFamily prefix for bold
const getFontFamily = (
  baseFontFamily: string,
  fontWeight: 'normal' | 'bold'
): string => {
  return fontWeight === 'bold' ? `bold ${baseFontFamily}` : baseFontFamily;
};

<Text
  text={shape.text}
  x={shape.x}
  y={shape.y}
  fontSize={shape.fontSize}
  fill={shape.color}
  fontFamily={getFontFamily('Arial', shape.fontWeight || 'normal')}
  fontStyle={shape.fontStyle || 'normal'}
  textDecoration={shape.textDecoration || 'none'}
/>
```

---

### 6. Keyboard Shortcuts

```typescript
const formattingShortcuts = {
  'b': toggleBold,    // Cmd+B or Ctrl+B
  'i': toggleItalic,  // Cmd+I or Ctrl+I
  'u': toggleUnderline // Cmd+U or Ctrl+U
};

const handleKeyDown = (e: KeyboardEvent) => {
  // Only when text is selected (not editing)
  if (editingTextId !== null) return;
  if (!selectedShapeId || selectedShape?.type !== 'text') return;
  
  if ((e.metaKey || e.ctrlKey) && formattingShortcuts[e.key]) {
    e.preventDefault();
    formattingShortcuts[e.key]();
  }
};
```

---

## Implementation Phases

### Phase 1: Schema & State (1.5 hours)
- [ ] Add formatting properties to Firestore schema
- [ ] Add `selectedTextFormatting` state to CanvasContext
- [ ] Implement `toggleBold()`, `toggleItalic()`, `toggleUnderline()`, `setFontSize()`
- [ ] Test state updates when text is selected

### Phase 2: Canvas Service (1.5 hours)
- [ ] Add `toggleTextBold()` method
- [ ] Add `toggleTextItalic()` method
- [ ] Add `toggleTextUnderline()` method
- [ ] Add `updateTextFontSize()` with validation (1-500px)
- [ ] Test Firestore writes and real-time sync

### Phase 3: Formatting Toolbar (2.5 hours)
- [ ] Create FormattingToolbar component
- [ ] Build Bold, Italic, Underline buttons with active states
- [ ] Build font size preset dropdown (12, 16, 20, 24, 32, 40, 48px)
- [ ] Build custom font size input with validation
- [ ] Implement toolbar positioning algorithm
- [ ] Add visibility logic (show on select, persist during edit)
- [ ] Style toolbar (shadows, borders, active states)

### Phase 4: Konva Rendering (1 hour)
- [ ] Update Konva Text to apply `fontWeight` (via fontFamily prefix)
- [ ] Apply `fontStyle` and `textDecoration`
- [ ] Test rendering at multiple font sizes
- [ ] Test formatting persistence during text editing

### Phase 5: Keyboard Shortcuts (1 hour)
- [ ] Add global keyboard listener
- [ ] Implement Cmd+B/Ctrl+B, Cmd+I/Ctrl+I, Cmd+U/Ctrl+U
- [ ] Prevent shortcuts during text editing
- [ ] Cross-platform testing (Mac/Windows)

### Phase 6: Testing & QA (1.5 hours)
- [ ] Test all formatting controls
- [ ] Test keyboard shortcuts
- [ ] Test at multiple zoom levels (50%, 100%, 200%)
- [ ] Test collaboration (multi-user formatting)
- [ ] Test lock system (can't format locked text)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

---

## Success Criteria

### Functional Requirements
- [x] Bold, italic, underline buttons toggle formatting
- [x] Font size dropdown and custom input work correctly
- [x] Toolbar appears when text is selected
- [x] Toolbar persists during text editing
- [x] Keyboard shortcuts toggle formatting
- [x] Formatting persists after text editing
- [x] Real-time sync works for all formatting
- [x] Lock system prevents unauthorized formatting

### Performance Requirements
- [x] Format toggle < 100ms response time
- [x] Font size change < 150ms response time
- [x] Toolbar render < 50ms
- [x] Real-time sync < 100ms for other users

### Accessibility Requirements
- [x] Keyboard navigation works (Tab, Enter, Space)
- [x] Screen reader support for all buttons
- [x] WCAG AA color contrast compliance
- [x] Visible focus indicators

---

## Risk Mitigation

### 🟡 Konva Bold Rendering
**Problem:** Konva may not support `fontWeight` directly  
**Solution:** Use `fontFamily` prefix: `"bold Arial"` instead of `fontWeight: 'bold'`

### 🟡 Underline Positioning
**Problem:** Underline position varies by font/size  
**Solution:** Test with multiple fonts; consider custom Line component if needed

### 🟢 Toolbar Overlap During Edit
**Problem:** Toolbar might overlap text editor overlay  
**Solution:** Adjust toolbar Y position when editing (move up 50px extra)

---

## Out of Scope

- ❌ Font family selection (Arial, Times, etc.)
- ❌ Text color picker (uses existing shape color)
- ❌ Text alignment (left, center, right)
- ❌ Line height / letter spacing
- ❌ Text effects (shadow, outline)
- ❌ Partial text formatting (format part of text)

---

## Testing Checklist

### Functional Tests
- [ ] Create text → select → toolbar appears
- [ ] Click Bold → text becomes bold
- [ ] Click Bold again → text returns to normal
- [ ] Apply Bold + Italic + Underline → all render correctly
- [ ] Change font size via dropdown → updates immediately
- [ ] Enter custom font size → validates and updates
- [ ] Enter invalid size (0, 501) → error shown
- [ ] Edit text content → formatting persists
- [ ] Deselect text → toolbar disappears

### Keyboard Tests
- [ ] Cmd+B toggles bold (Mac)
- [ ] Ctrl+B toggles bold (Windows/Linux)
- [ ] Cmd+I toggles italic
- [ ] Cmd+U toggles underline
- [ ] Shortcuts don't work during text editing

### Collaboration Tests
- [ ] User A applies bold → User B sees bold text
- [ ] User A changes font size → User B sees new size
- [ ] User A locks text → User B can't format

### Visual Tests (All Browsers)
- [ ] Bold renders correctly in Chrome, Safari, Firefox
- [ ] Italic renders correctly
- [ ] Underline renders correctly
- [ ] Toolbar positions correctly at 50%, 100%, 200% zoom

---

## Dependencies

**Prerequisites:**
- ✅ PRD Part 1: Text Foundation
- ✅ PRD Part 2: Text Editing
- ✅ Lock system
- ✅ Real-time Firestore sync

**External:**
- React 18+
- Konva 9+
- Firebase 9+
- TypeScript 4.5+

---

## Conclusion

This PRD completes the text editing feature set by adding professional formatting controls. Upon completion, users can:

1. ✅ Apply bold, italic, underline to text
2. ✅ Change font sizes (1-500px)
3. ✅ Use keyboard shortcuts (Cmd+B/I/U)
4. ✅ Format text that syncs in real-time
5. ✅ Edit formatted text seamlessly

**Next Steps:** Ship and gather user feedback for future enhancements (font family, alignment, effects).