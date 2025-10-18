# Text Formatting Implementation Tasks

**Feature:** Text Formatting Controls (Bold, Italic, Underline, Font Size)  
**Total Estimated Time:** 8 hours  
**Status:** Ready for Implementation

---

## Overview

This document tracks all implementation tasks for adding text formatting functionality to the collaborative canvas. Users will be able to apply bold, italic, underline formatting and change font sizes through a floating toolbar.

**Current State:**
- ✅ Text shapes can be created and edited
- ✅ Lock system and real-time sync work
- ❌ **No formatting controls exist**

**Goal:** Enable users to apply professional text formatting with a floating toolbar.

---

## Implementation Phases

### Phase 1: Schema & State (1.5 hours)

**Files to Modify:**
- `app/src/contexts/CanvasContext.tsx`
- `app/src/hooks/useCanvas.ts`

**Tasks:**
- [x] Add formatting properties to Firestore schema
  - [x] Add `fontWeight: 'normal' | 'bold'` to TextShape interface
  - [x] Add `fontStyle: 'normal' | 'italic'` to TextShape interface  
  - [x] Add `textDecoration: 'none' | 'underline'` to TextShape interface
  - [x] Verify `fontSize: number` exists (already implemented)
- [x] Add `selectedTextFormatting` state to CanvasContext
  - [x] Define interface for selected text formatting state
  - [x] Add state property to CanvasContextType
  - [x] Initialize as null when no text selected
- [x] Implement formatting toggle methods
  - [x] Add `toggleBold: () => Promise<void>` method
  - [x] Add `toggleItalic: () => Promise<void>` method
  - [x] Add `toggleUnderline: () => Promise<void>` method
  - [x] Add `setFontSize: (size: number) => Promise<void>` method
- [x] Test state updates when text is selected
  - [x] Verify `selectedTextFormatting` populates when text shape selected
  - [x] Verify state clears when text deselected
  - [x] Test state updates during real-time sync

**Dependencies:** None  
**Critical Path:** Yes - Required for all other phases

---

### Phase 2: Canvas Service (1.5 hours)

**Files to Modify:**
- `app/src/services/canvasService.ts`

**Tasks:**
- [x] Add `toggleTextBold()` method
  - [x] Accept `shapeId: string` and `currentWeight: 'normal' | 'bold'` parameters
  - [x] Toggle weight between 'normal' and 'bold'
  - [x] Update Firestore with `fontWeight` and `updatedAt: serverTimestamp()`
  - [x] Handle errors gracefully
- [x] Add `toggleTextItalic()` method
  - [x] Accept `shapeId: string` and `currentStyle: 'normal' | 'italic'` parameters
  - [x] Toggle style between 'normal' and 'italic'
  - [x] Update Firestore with `fontStyle` and `updatedAt: serverTimestamp()`
  - [x] Handle errors gracefully
- [x] Add `toggleTextUnderline()` method
  - [x] Accept `shapeId: string` and `currentDecoration: 'none' | 'underline'` parameters
  - [x] Toggle decoration between 'none' and 'underline'
  - [x] Update Firestore with `textDecoration` and `updatedAt: serverTimestamp()`
  - [x] Handle errors gracefully
- [x] Add `updateTextFontSize()` method with validation
  - [x] Accept `shapeId: string` and `size: number` parameters
  - [x] Validate size is between 1 and 500
  - [x] Throw error for invalid sizes
  - [x] Update Firestore with `fontSize` and `updatedAt: serverTimestamp()`
  - [x] Handle errors gracefully
- [x] Test Firestore writes and real-time sync
  - [x] Test all methods write to Firestore correctly
  - [x] Test real-time updates appear for other users
  - [x] Test error handling for invalid operations

**Dependencies:** Phase 1 (Schema & State)  
**Critical Path:** Yes - Required for toolbar functionality

---

### Phase 3: Formatting Toolbar (2.5 hours)

**Files to Create:**
- `app/src/components/Canvas/FormattingToolbar.tsx`

**Files to Modify:**
- `app/src/components/Canvas/Canvas.tsx`
- `app/src/contexts/CanvasContext.tsx`

**Tasks:**
- [x] Create FormattingToolbar component
  - [x] Define `FormattingToolbarProps` interface
  - [x] Accept `targetShapeId`, `currentFormatting`, `position` props
  - [x] Accept callback props: `onToggleBold`, `onToggleItalic`, `onToggleUnderline`, `onChangeFontSize`
- [x] Build Bold, Italic, Underline buttons with active states
  - [x] Create button components with proper styling
  - [x] Show active state when formatting is applied
  - [x] Add hover and focus states
  - [x] Implement click handlers
- [x] Build font size preset dropdown
  - [x] Create dropdown with presets: 12, 16, 20, 24, 32, 40, 48px
  - [x] Show current font size as selected
  - [x] Handle selection changes
- [x] Build custom font size input with validation
  - [x] Create number input field
  - [x] Validate input (1-500px range)
  - [x] Show error states for invalid input
  - [x] Handle Enter key submission
- [x] Implement toolbar positioning algorithm
  - [x] Create `calculateToolbarPosition()` function
  - [x] Position toolbar above selected text with 10px gap
  - [x] Account for stage position and zoom level
  - [x] Handle edge cases (text near canvas edges)
- [x] Add visibility logic
  - [x] Show when text shape is selected
  - [x] Persist during text editing
  - [x] Hide when text is deselected
  - [x] Hide when non-text shape is selected
- [x] Style toolbar (shadows, borders, active states)
  - [x] Add drop shadow and border styling
  - [x] Style active button states
  - [x] Ensure WCAG AA color contrast compliance
  - [x] Add responsive design for different screen sizes

**Dependencies:** Phase 1 (Schema & State), Phase 2 (Canvas Service)  
**Critical Path:** Yes - Core user interface

---

### Phase 4: Konva Rendering (1 hour)

**Files to Modify:**
- `app/src/components/Canvas/Canvas.tsx`

**Tasks:**
- [x] Update Konva Text to apply `fontWeight` (via fontFamily prefix)
  - [x] Create `getFontFamily()` helper function
  - [x] Use `"bold Arial"` instead of `fontWeight: 'bold'`
  - [x] Apply to Konva Text component
- [x] Apply `fontStyle` and `textDecoration`
  - [x] Set `fontStyle` property on Konva Text
  - [x] Set `textDecoration` property on Konva Text
  - [x] Test rendering with all combinations
- [x] Test rendering at multiple font sizes
  - [x] Test 12px, 16px, 24px, 48px rendering
  - [x] Verify text positioning remains correct
  - [x] Test at different zoom levels
- [x] Test formatting persistence during text editing
  - [x] Apply formatting → edit text → verify formatting persists
  - [x] Test with multiple formatting combinations
  - [x] Verify real-time sync maintains formatting

**Dependencies:** Phase 1 (Schema & State)  
**Critical Path:** Yes - Required for visual formatting

---

### Phase 5: Keyboard Shortcuts (1 hour)

**Files to Modify:**
- `app/src/components/Canvas/Canvas.tsx`
- `app/src/contexts/CanvasContext.tsx`

**Tasks:**
- [x] Add global keyboard listener
  - [x] Add `handleKeyDown` event listener
  - [x] Listen for Cmd/Ctrl + B, I, U combinations
  - [x] Prevent default browser behavior
- [x] Implement Cmd+B/Ctrl+B, Cmd+I/Ctrl+I, Cmd+U/Ctrl+U
  - [x] Map keyboard combinations to formatting functions
  - [x] Call appropriate toggle methods from context
  - [x] Show visual feedback for shortcuts
- [x] Prevent shortcuts during text editing
  - [x] Check `editingTextId !== null` before processing
  - [x] Only process shortcuts when text is selected (not editing)
  - [x] Ensure shortcuts work when text is selected but not editing
- [x] Cross-platform testing (Mac/Windows)
  - [x] Test Cmd+B on Mac
  - [x] Test Ctrl+B on Windows/Linux
  - [x] Test all three shortcuts on both platforms
  - [x] Verify consistent behavior across platforms

**Dependencies:** Phase 1 (Schema & State), Phase 2 (Canvas Service)  
**Critical Path:** No - Enhancement feature

---

### Phase 6: Testing & QA (1.5 hours)

**Files to Test:**
- All modified files from previous phases
- Cross-browser testing required

**Tasks:**
- [ ] Test all formatting controls
  - [ ] Bold button toggles correctly
  - [ ] Italic button toggles correctly
  - [ ] Underline button toggles correctly
  - [ ] Font size dropdown works
  - [ ] Custom font size input works
- [ ] Test keyboard shortcuts
  - [ ] Cmd+B toggles bold (Mac)
  - [ ] Ctrl+B toggles bold (Windows/Linux)
  - [ ] Cmd+I toggles italic
  - [ ] Cmd+U toggles underline
  - [ ] Shortcuts don't work during text editing
- [ ] Test at multiple zoom levels
  - [ ] Test at 50% zoom
  - [ ] Test at 100% zoom
  - [ ] Test at 200% zoom
  - [ ] Verify toolbar positioning at all zoom levels
- [ ] Test collaboration (multi-user formatting)
  - [ ] User A applies bold → User B sees bold text
  - [ ] User A changes font size → User B sees new size
  - [ ] Test real-time sync for all formatting changes
- [ ] Test lock system (can't format locked text)
  - [ ] Lock text shape
  - [ ] Verify formatting buttons are disabled
  - [ ] Verify keyboard shortcuts don't work
  - [ ] Test unlock allows formatting again
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
  - [ ] Test in Chrome
  - [ ] Test in Safari
  - [ ] Test in Firefox
  - [ ] Verify consistent rendering across browsers

**Dependencies:** All previous phases  
**Critical Path:** Yes - Required for release

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

## Success Criteria

### Functional Requirements
- [ ] Bold, italic, underline buttons toggle formatting
- [ ] Font size dropdown and custom input work correctly
- [ ] Toolbar appears when text is selected
- [ ] Toolbar persists during text editing
- [ ] Keyboard shortcuts toggle formatting
- [ ] Formatting persists after text editing
- [ ] Real-time sync works for all formatting
- [ ] Lock system prevents unauthorized formatting

### Performance Requirements
- [ ] Format toggle < 100ms response time
- [ ] Font size change < 150ms response time
- [ ] Toolbar render < 50ms
- [ ] Real-time sync < 100ms for other users

### Accessibility Requirements
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader support for all buttons
- [ ] WCAG AA color contrast compliance
- [ ] Visible focus indicators

---

## Risk Items

### 🟡 Konva Bold Rendering
**Risk:** Konva may not support `fontWeight` directly  
**Mitigation:** Use `fontFamily` prefix: `"bold Arial"` instead of `fontWeight: 'bold'`  
**Action Items:**
- [ ] Test bold rendering with fontFamily prefix
- [ ] Verify consistent rendering across browsers
- [ ] Document workaround in code comments

### 🟡 Underline Positioning
**Risk:** Underline position varies by font/size  
**Mitigation:** Test with multiple fonts; consider custom Line component if needed  
**Action Items:**
- [ ] Test underline at different font sizes
- [ ] Test with different font families
- [ ] Implement custom Line component if needed

### 🟢 Toolbar Overlap During Edit
**Risk:** Toolbar might overlap text editor overlay  
**Mitigation:** Adjust toolbar Y position when editing (move up 50px extra)  
**Action Items:**
- [ ] Test toolbar positioning during text editing
- [ ] Adjust Y position calculation for edit mode
- [ ] Verify no overlap with text editor

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

## Implementation Notes

### Critical Path Items
1. **Phase 1 (Schema & State)** - Must complete first
2. **Phase 2 (Canvas Service)** - Required for toolbar functionality
3. **Phase 3 (Formatting Toolbar)** - Core user interface
4. **Phase 4 (Konva Rendering)** - Required for visual formatting
5. **Phase 6 (Testing & QA)** - Required for release

### Parallel Work Opportunities
- Phase 4 (Konva Rendering) can start after Phase 1
- Phase 5 (Keyboard Shortcuts) can start after Phase 2
- Testing can begin as soon as individual components are complete

### File Organization
- New component: `app/src/components/Canvas/FormattingToolbar.tsx`
- Modified files: CanvasContext, canvasService, Canvas component
- All changes maintain existing architecture patterns

---

## Completion Criteria

The feature is complete when:
1. All implementation phases are finished
2. All functional tests pass
3. All performance requirements are met
4. All accessibility requirements are met
5. Cross-browser testing is complete
6. Collaboration testing is complete
7. All risk items are mitigated

**Estimated Total Time:** 8 hours  
**Target Completion:** Ready for user testing and feedback
