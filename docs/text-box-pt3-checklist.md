# Text Formatting Toolbar – Implementation Checklist

## Phase 1: Schema & State
- [x] Add formatting properties to Firestore schema
- [x] Add `selectedTextFormatting` state to `CanvasContext`
- [x] Implement `toggleBold()`, `toggleItalic()`, `toggleUnderline()`, `setFontSize()`
- [x] Test state updates when text is selected

## Phase 2: Canvas Service
- [x] Add `toggleTextBold()` method
- [x] Add `toggleTextItalic()` method
- [x] Add `toggleTextUnderline()` method
- [x] Add `updateTextFontSize()` with validation (1-500px)
- [x] Test Firestore writes and real-time sync

## Phase 3: Formatting Toolbar
- [x] Create `FormattingToolbar` component (integrated into left sidebar)
- [x] Build Bold, Italic, Underline buttons with active states
- [x] Build font-size preset dropdown (12, 16, 20, 24, 32, 40, 48px)
- [x] Build custom font-size input with validation
- [x] Implement toolbar positioning algorithm (in left sidebar)
- [x] Add visibility logic (show on select, persist during edit)
- [x] Style toolbar (shadows, borders, active states)

## Phase 4: Konva Rendering
- [x] Update Konva Text to apply `fontWeight` (via fontFamily prefix)
- [x] Apply `fontStyle` and `textDecoration`
- [x] Test rendering at multiple font sizes
- [x] Test formatting persistence during text editing

## Phase 5: Keyboard Shortcuts
- [x] Add global keyboard listener
- [x] Implement Cmd+B/Ctrl+B, Cmd+I/Ctrl+I, Cmd+U/Ctrl+U
- [x] Prevent shortcuts during text editing
- [x] Cross-platform testing (Mac/Windows)

## Phase 6: Testing & QA
- [x] Test all formatting controls
- [x] Test keyboard shortcuts
- [x] Test at multiple zoom levels (50%, 100%, 200%)
- [X] Test collaboration (multi-user formatting)
- [x] Test lock system (cannot format locked text)
- [x] Cross-browser testing (Chrome, Safari, Firefox)

---

## Detailed Testing Checklist

### Functional Tests
- [x] Create text → select → toolbar appears
- [x] Click Bold → text becomes bold
- [x] Click Bold again → text returns to normal
- [x] Apply Bold + Italic + Underline → all render correctly
- [x] Change font size via dropdown → updates immediately
- [x] Enter custom font size → validates and updates
- [x] Enter invalid size (0, 501) → error shown
- [x] Edit text content → formatting persists
- [x] Deselect text → toolbar disappears

### Keyboard Tests
- [x] Cmd+B toggles bold (Mac)
- [x] Ctrl+B toggles bold (Windows/Linux)
- [x] Cmd+I toggles italic
- [x] Cmd+U toggles underline
- [x] Shortcuts don't work during text editing

### Collaboration Tests
- [x] User A applies bold → User B sees bold text
- [x] User A changes font size → User B sees new size
- [x] User A locks text → User B can't format

### Visual Tests (All Browsers)
- [x] Bold renders correctly in Chrome, Safari, Firefox
- [x] Italic renders correctly
- [x] Underline renders correctly
- [x] Toolbar positions correctly at 50%, 100%, 200% zoom
