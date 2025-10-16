# CollabCanvas Phase 2 - Development Task List
**Building on MVP - Adding Advanced Features + AI Integration**  
**Timeline:** 72 hours across 4 development parts  
**Total PRs:** 14 (PR #1 through PR #14)

---

## 📋 Overview

Phase 2 transforms the MVP into a production-ready collaborative design tool with AI assistance. We're building on the solid multiplayer foundation from Phase 1.

**What We're Adding:**
- **Manual canvas controls** (resize, rotate, text, delete, duplicate, circles, triangles)
- **Advanced Figma-inspired features** (multi-select, grouping, z-index, alignment)
- **Power user tools** (keyboard shortcuts, copy/paste)
- **Collaborative features** (comments on shapes)
- **AI natural language interface** (15 tools, layout commands)

**Success Criteria:**
- All manual features work with real-time sync (<100ms)
- AI executes 15 command types including layout operations
- Multi-select and grouping enable professional workflows
- Demo video showcasing all features
- Target score: 96-100 points (A+)

---

## 🚨 CRITICAL: Implementation Guide Workflow

**BEFORE CODING ANYTHING IN EACH PR:**

1. User says: **"I'm ready to begin PR #X"**
2. Agent creates implementation guide: `/docs/implementation-guides/PR-X-implementation-guide.md`
3. Implementation guide MUST include:
   - **Detailed build plan** with step-by-step instructions
   - **Code snippets** (reference PRD.md for examples)
   - **Testing guide** with specific test scenarios (Gatekeeper section)
   - **Debugging guide** (if needed for complex features)
4. User reviews guide and asks questions
5. User gives **GREEN LIGHT** to proceed
6. Agent begins implementation

**DO NOT CODE WITHOUT GREEN LIGHT!**

---

## 📁 Project Structure Reference

```
collab-canvas02/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/           # Canvas, ColorToolbar
│   │   │   ├── Collaboration/    # Cursors, Presence
│   │   │   ├── AI/               # NEW: AIChat, MessageHistory
│   │   │   └── UI/               # ErrorBoundary, Toasts
│   │   ├── services/
│   │   │   ├── canvasService.ts  # EXTEND: Add new methods
│   │   │   ├── aiService.ts      # NEW: AI integration
│   │   │   └── ...existing
│   │   └── utils/
│   │       ├── constants.ts      # EXTEND: New colors, sizes
│   │       └── aiPrompts.ts      # NEW: System prompts
│   └── tests/
│       ├── unit/
│       └── integration/
├── docs/
│   ├── implementation-guides/    # NEW: PR-specific guides
│   ├── prd.md                    # Reference for all code examples
│   └── task.md                   # This file
└── README.md
```

---

# 🎯 PART 1: Core Manual Features (PRs #1-4, ~20 hours)

These features establish the foundation for advanced capabilities and AI integration.

---

## PR #1: Resize Shapes + Additional Shape Types (Circles & Triangles)
**Branch:** `feature/resize-and-shape-types`  
**Goal:** Add 8-handle resize system for all shapes + Circle and Triangle creation  
**Time Estimate:** 5 hours

### Why This PR?
- Resize is P0 critical for canvas manipulation
- Additional shape types required for rubric scoring
- Combines two related features for efficiency
- Sets up transform system for rotation (next PR)

### Prerequisites
- ✅ MVP Phase 1 complete and deployed
- ✅ Canvas.tsx renders rectangles with drag
- ✅ CanvasService has createShape() method
- ✅ Firebase emulators running

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-1-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 1.1 Extend CanvasService for Resize (1.5 hours)

**Sub-task 1.1a: Add resizeShape() method skeleton**
- [ ] Add `resizeShape(shapeId: string, width: number, height: number): Promise<void>` to CanvasService
- [ ] Add basic Firestore update logic (no validation yet)

**🧪 TEST 1.1a:**
```
✅ PASS: Open browser console → Run: canvasService.resizeShape('test-id', 200, 150)
         → Check Firestore console → Document updates with new width/height
❌ FAIL: Method doesn't exist, throws error, or Firestore not updated
```

**Sub-task 1.1b: Add validation logic**
- [ ] Add minimum size validation: 10×10 for rectangles/triangles
- [ ] Add error handling for shape not found
- [ ] Return error or throw for invalid dimensions

**🧪 TEST 1.1b:**
```
✅ PASS: Console → canvasService.resizeShape('test-id', 5, 5)
         → Error returned/thrown with message about minimum size
❌ FAIL: Invalid resize succeeds without error
```

**Sub-task 1.1c: Add updatedAt timestamp**
- [ ] Add `updatedAt: serverTimestamp()` to Firestore update

**🧪 TEST 1.1c:**
```
✅ PASS: Resize a shape → Check Firestore console
         → 'updatedAt' field exists with recent timestamp
❌ FAIL: updatedAt missing or not updated
```

#### 1.2 Build Resize Handle System (2 hours)

**Sub-task 1.2a: Create ResizeHandles component skeleton**
- [ ] Create `src/components/Canvas/ResizeHandles.tsx`
- [ ] Accept props: `shape`, `onResize`, `onResizeEnd`
- [ ] Render 8 Konva `<Rect>` elements at handle positions
- [ ] Basic positioning: corners and edges

**🧪 TEST 1.2a:**
```
✅ PASS: Lock a rectangle → 8 small white squares appear at corners and edges
❌ FAIL: Handles don't appear or positioned incorrectly
```

**Sub-task 1.2b: Add handle styling and hover states**
- [ ] Default: 8×8px white squares, gray (#666) border, 2px stroke
- [ ] Hover: scale to 10×10px, blue (#3b82f6) fill
- [ ] Implement onMouseEnter/onMouseLeave handlers

**🧪 TEST 1.2b:**
```
✅ PASS: Hover over any handle → Grows to 10×10px and turns blue
❌ FAIL: No visual change on hover
```

**Sub-task 1.2c: Implement corner handle dragging (proportional resize)**
- [ ] Add drag handlers for TL, TR, BL, BR handles
- [ ] Calculate new dimensions maintaining aspect ratio
- [ ] Update shape preview during drag (local state)

**🧪 TEST 1.2c:**
```
✅ PASS: Drag bottom-right corner handle outward
         → Shape grows proportionally (width and height scale together)
         → Aspect ratio maintained
❌ FAIL: Only one dimension changes, or aspect ratio breaks
```

**Sub-task 1.2d: Implement edge handle dragging (single dimension)**
- [ ] Add drag handlers for T, B, L, R handles
- [ ] T/B handles: only change height
- [ ] L/R handles: only change width

**🧪 TEST 1.2d:**
```
✅ PASS: Drag right edge handle → Only width changes, height stays same
         Drag bottom edge handle → Only height changes, width stays same
❌ FAIL: Both dimensions change, or wrong dimension changes
```

**Sub-task 1.2e: Add dimension tooltip during drag**
- [ ] Show floating tooltip above shape during drag
- [ ] Format: "200 × 150" (width × height)
- [ ] Position: centered above shape

**🧪 TEST 1.2e:**
```
✅ PASS: Start dragging any handle → Tooltip appears showing "W × H"
         → Values update in real-time as you drag
❌ FAIL: No tooltip, or values don't update
```

**Sub-task 1.2f: Wire up to CanvasService and add validation**
- [ ] On drag end: call `canvasService.resizeShape()`
- [ ] Check minimum size before calling service
- [ ] Show error toast if minimum violated

**🧪 TEST 1.2f:**
```
✅ PASS: Drag handle, release → Shape size persists after release
         → Check Firestore → Dimensions updated
         Try to resize below 10×10 → Error toast appears, resize prevented
❌ FAIL: Size reverts after release, or Firestore not updated, or no validation
```

#### 1.3 Add Circle and Triangle Shape Types (1.5 hours)

**Sub-task 1.3a: Add Circle service methods**
- [ ] Add `createCircle(x, y, radius, color, createdBy)` to CanvasService
- [ ] Add `resizeCircle(shapeId, radius)` method
- [ ] Update shape type to include `'circle'`

**🧪 TEST 1.3a:**
```
✅ PASS: Console → canvasService.createCircle(500, 500, 50, '#3b82f6', 'user-id')
         → Check Firestore → Circle document created with correct fields
❌ FAIL: Method error or document not created
```

**Sub-task 1.3b: Add Triangle service methods**
- [ ] Add `createTriangle(x, y, width, height, color, createdBy)` to CanvasService
- [ ] Store triangle data with width/height (bounding box)

**🧪 TEST 1.3b:**
```
✅ PASS: Console → canvasService.createTriangle(500, 500, 100, 100, '#ef4444', 'user-id')
         → Check Firestore → Triangle document created
❌ FAIL: Method error or document not created
```

**Sub-task 1.3c: Add Circle and Triangle buttons to toolbar**
- [ ] Add two buttons to ColorToolbar (or create new ShapeToolbar)
- [ ] Layout: `[Rectangle] [Circle] [Triangle]` before color buttons
- [ ] Update CanvasContext: `activeTool: 'rectangle' | 'circle' | 'triangle' | 'text'`
- [ ] Click handlers set activeTool

**🧪 TEST 1.3c:**
```
✅ PASS: Click Circle button → Button highlights/activates
         Click Triangle button → Button highlights/activates
         Console → Check context.activeTool → Shows correct value
❌ FAIL: Buttons don't appear or don't change activeTool
```

**Sub-task 1.3d: Implement circle creation (click & drag)**
- [ ] On canvas mousedown (when activeTool='circle'): start circle creation
- [ ] Calculate radius from distance between start point and current mouse
- [ ] Show preview circle during drag
- [ ] On mouseup: call createCircle if radius ≥ 5px

**🧪 TEST 1.3d:**
```
✅ PASS: Activate Circle tool → Click and drag on canvas
         → Green outline circle appears and grows with mouse
         → Release → Circle persists on canvas
         → Check Firestore → Circle document exists
❌ FAIL: No preview, or final circle not created, or wrong radius
```

**Sub-task 1.3e: Implement triangle creation (bounding box)**
- [ ] On canvas mousedown (when activeTool='triangle'): start triangle creation
- [ ] Calculate bounding box from start to current mouse position
- [ ] Calculate triangle vertices from bounding box (center-top, bottom-left, bottom-right)
- [ ] Show preview triangle during drag
- [ ] On mouseup: call createTriangle if ≥ 10×10

**🧪 TEST 1.3e:**
```
✅ PASS: Activate Triangle tool → Click and drag on canvas
         → Green outline triangle appears (pointing up)
         → Release → Triangle persists
         → Check Firestore → Triangle document exists
❌ FAIL: No preview, wrong shape, or not created
```

**Sub-task 1.3f: Add Konva rendering for circles and triangles**
- [ ] In Canvas.tsx: add `<Circle>` rendering for type='circle'
- [ ] Add `<Line>` with closed path for type='triangle'
- [ ] Calculate triangle points from x, y, width, height

**🧪 TEST 1.3f:**
```
✅ PASS: Manually create circle in Firestore → Circle renders on canvas
         Manually create triangle in Firestore → Triangle renders on canvas
❌ FAIL: Shapes don't render or render incorrectly
```

**Sub-task 1.3g: Add resize handles for circles**
- [ ] Modify ResizeHandles to detect circle type
- [ ] Show 4 handles for circles (T, B, L, R)
- [ ] All handles change radius (distance from center)

**🧪 TEST 1.3g:**
```
✅ PASS: Lock a circle → 4 handles appear (top, bottom, left, right)
         Drag any handle → Circle radius changes
         → Check Firestore → radius field updated
❌ FAIL: Handles don't appear or radius doesn't change
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users in separate browsers:**

#### Resize Tests
- [ ] User A locks rectangle → 8 handles appear
- [ ] User A drags corner handle → shape resizes proportionally
- [ ] User A drags edge handle → only width or height changes
- [ ] Dimension tooltip shows during drag
- [ ] User B sees resize in real-time (<100ms)
- [ ] Try to resize below 10×10 → error toast appears, prevents resize
- [ ] Resize works for circles and triangles

#### Circle Tests
- [ ] User A clicks Circle button → tool activates
- [ ] User A clicks and drags → preview circle appears
- [ ] Preview shows radius growing from center
- [ ] Release creates circle (minimum 5px radius)
- [ ] User B sees circle appear in <100ms
- [ ] Circle can be dragged, locked, resized

#### Triangle Tests
- [ ] User A clicks Triangle button → tool activates
- [ ] User A drags bounding box → preview triangle appears
- [ ] Release creates triangle (minimum 10×10)
- [ ] User B sees triangle appear in <100ms
- [ ] Triangle can be dragged, locked, resized

**Performance:**
- [ ] 60 FPS maintained during resize operations
- [ ] Handles render smoothly without lag
- [ ] Works with 20+ shapes on canvas

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #2

---

## PR #2: Rotate Shapes
**Branch:** `feature/rotate-shapes`  
**Goal:** Add rotation handle and transform all shapes  
**Time Estimate:** 4 hours

### Why This PR?
- Rotation is P0 critical for canvas manipulation
- Completes transform system (move, resize, rotate)
- Required for professional design tool

### Prerequisites
- ✅ PR #1 merged and deployed
- ✅ Resize system working for all shape types
- ✅ Shapes can be locked and dragged

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-2-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 2.1 Add rotation field to data model (0.5 hours)

**Sub-task 2.1a: Update TypeScript interfaces**
- [ ] Add `rotation?: number` field to Shape interface
- [ ] Update all createShape methods to include `rotation: 0` default

**🧪 TEST 2.1a:**
```
✅ PASS: Check TypeScript compilation → No errors
         Create new shape → Check Firestore → 'rotation: 0' field exists
❌ FAIL: TypeScript errors or rotation field missing
```

#### 2.2 Extend CanvasService for Rotation (1 hour)

**Sub-task 2.2a: Add rotateShape() method skeleton**
- [ ] Add `rotateShape(shapeId: string, rotation: number): Promise<void>`
- [ ] Update Firestore document with rotation value
- [ ] Add `updatedAt: serverTimestamp()`

**🧪 TEST 2.2a:**
```
✅ PASS: Console → canvasService.rotateShape('shape-id', 45)
         → Check Firestore → rotation field updated to 45
❌ FAIL: Method error or Firestore not updated
```

**Sub-task 2.2b: Add rotation normalization**
- [ ] Normalize rotation: `rotation % 360`
- [ ] Handle negative angles: if negative, add 360

**🧪 TEST 2.2b:**
```
✅ PASS: Console → rotateShape('id', 405) → Firestore shows 45
         rotateShape('id', -45) → Firestore shows 315
❌ FAIL: Rotation values not normalized correctly
```

#### 2.3 Build Rotation Handle UI (2 hours)

**Sub-task 2.3a: Create RotationHandle component skeleton**
- [ ] Create `src/components/Canvas/RotationHandle.tsx`
- [ ] Accept props: `shape`, `onRotate`, `onRotateEnd`
- [ ] Render circular handle 30px above shape center
- [ ] Draw connecting line from shape to handle

**🧪 TEST 2.3a:**
```
✅ PASS: Lock a shape → Circular handle appears 30px above center
         → Thin gray line connects shape to handle
❌ FAIL: Handle doesn't appear or positioned wrong
```

**Sub-task 2.3b: Style rotation handle**
- [ ] Handle: 12px diameter circle, white fill, gray border
- [ ] Add "↻" icon or rotation symbol inside
- [ ] Hover: cursor changes to rotation cursor

**🧪 TEST 2.3b:**
```
✅ PASS: Hover over rotation handle → Cursor changes to rotation cursor
         → Handle is clearly visible with rotation icon
❌ FAIL: No cursor change or handle not styled
```

**Sub-task 2.3c: Implement rotation calculation during drag**
- [ ] On drag: calculate angle from shape center to current mouse position
- [ ] Use Math.atan2() for angle calculation
- [ ] Update local rotation preview in real-time

**🧪 TEST 2.3c:**
```
✅ PASS: Drag rotation handle in circle around shape
         → Shape rotates smoothly following mouse
         → Visual preview updates in real-time
❌ FAIL: Shape doesn't rotate or rotates incorrectly
```

**Sub-task 2.3d: Add angle tooltip**
- [ ] Show tooltip near handle during drag
- [ ] Format: "45°" (rounded to nearest degree)

**🧪 TEST 2.3d:**
```
✅ PASS: Start dragging rotation handle → Tooltip appears showing angle
         → Angle updates in real-time as you rotate
❌ FAIL: No tooltip or values don't update
```

**Sub-task 2.3e: Wire up to CanvasService**
- [ ] On drag end: call `canvasService.rotateShape()`
- [ ] Pass final calculated angle

**🧪 TEST 2.3e:**
```
✅ PASS: Drag rotation handle, release → Rotation persists
         → Check Firestore → rotation field updated
         → Refresh page → Shape still rotated
❌ FAIL: Rotation reverts or not saved to Firestore
```

#### 2.4 Update Konva Rendering (0.5 hours)

**Sub-task 2.4a: Apply rotation to shape rendering**
- [ ] Add `rotation={shape.rotation || 0}` prop to all Konva shapes
- [ ] Set `offsetX` and `offsetY` for center-point rotation
- [ ] Adjust positioning calculations

**🧪 TEST 2.4a:**
```
✅ PASS: Manually set rotation in Firestore (e.g., 45)
         → Shape renders rotated around its center
         → All shape types rotate correctly (rect, circle, triangle, text)
❌ FAIL: Shape doesn't rotate or rotates around wrong point
```

**Sub-task 2.4b: Ensure dragging works with rotated shapes**
- [ ] Test drag handlers with rotated shapes
- [ ] Verify position updates correctly

**🧪 TEST 2.4b:**
```
✅ PASS: Rotate a shape to 45° → Lock and drag it
         → Shape moves smoothly in canvas coordinates (not rotated coordinates)
❌ FAIL: Dragging broken or shape jumps
```

**Sub-task 2.4c: Ensure resize handles align with rotated shapes**
- [ ] Verify resize handles appear correctly on rotated shapes
- [ ] Handles should rotate with shape

**🧪 TEST 2.4c:**
```
✅ PASS: Rotate a shape to 45° → Resize handles appear aligned with rotated edges
         → Can still resize correctly
❌ FAIL: Handles misaligned or resize doesn't work
```

**Code Reference:** See PRD.md lines 160-174 for Konva rotation implementation

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Rotation Tests
- [ ] User A locks rectangle → rotation handle appears 30px above center
- [ ] Connecting line visible from shape to handle
- [ ] User A drags handle → shape rotates around center point
- [ ] Angle tooltip shows current rotation (e.g., "45°")
- [ ] User B sees rotation in real-time (<100ms)
- [ ] Rotation works for all shape types (rectangles, circles, triangles)
- [ ] Dragging rotated shape still works correctly
- [ ] Resize handles align with rotated shape orientation

#### Edge Cases
- [ ] Rotate beyond 360° → normalizes correctly (e.g., 405° becomes 45°)
- [ ] Rotate negative → converts to positive (e.g., -45° becomes 315°)
- [ ] Multiple rotations compound correctly

**Performance:**
- [ ] Rotation feels smooth and responsive
- [ ] No lag with 20+ shapes
- [ ] Handles render correctly at all angles

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #3

---

## PR #3: Text Layers with Formatting (Bold, Italic, Underline)
**Branch:** `feature/text-layers`  
**Goal:** Add text creation, editing, font size control, and text formatting  
**Time Estimate:** 5 hours

### Why This PR?
- Text is P0 critical for design tool
- Required for AI commands (login forms, labels)
- Text formatting adds professional polish
- Combines creation + formatting for efficiency

### Prerequisites
- ✅ PR #2 merged and deployed
- ✅ Shapes can be created, resized, rotated
- ✅ Toolbar has space for Text button

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-3-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 3.1 Extend Data Model for Text (0.5 hours)

**Sub-task 3.1a: Update TypeScript interfaces**
- [ ] Add `'text'` to shape type union
- [ ] Add text-specific fields: `text?`, `fontSize?`, `fontWeight?`, `fontStyle?`, `textDecoration?`

**🧪 TEST 3.1a:**
```
✅ PASS: TypeScript compiles without errors
         Type checking accepts text shape with all fields
❌ FAIL: TypeScript errors
```

#### 3.2 Extend CanvasService for Text (1.5 hours)

**Sub-task 3.2a: Add createText() method**
- [ ] Add `createText(text, x, y, fontSize, color, fontWeight, fontStyle, textDecoration, createdBy)`
- [ ] Defaults: fontSize=16, color=#000000, fontWeight='normal', fontStyle='normal', textDecoration='none'
- [ ] Create Firestore document with type='text'

**🧪 TEST 3.2a:**
```
✅ PASS: Console → canvasService.createText('Hello', 500, 500, 16, '#000000', 'normal', 'normal', 'none', 'user-id')
         → Check Firestore → Text document created with all fields
❌ FAIL: Method error or document missing fields
```

**Sub-task 3.2b: Add updateText() method**
- [ ] Add `updateText(shapeId, text): Promise<void>`
- [ ] Update only the text content field
- [ ] Add `updatedAt` timestamp

**🧪 TEST 3.2b:**
```
✅ PASS: Console → updateText('text-id', 'Updated text')
         → Check Firestore → 'text' field updated, updatedAt changed
❌ FAIL: Text not updated or timestamp missing
```

**Sub-task 3.2c: Add updateTextFontSize() method**
- [ ] Add `updateTextFontSize(shapeId, fontSize): Promise<void>`
- [ ] Validate fontSize range (12-48px)
- [ ] Show error if out of range

**🧪 TEST 3.2c:**
```
✅ PASS: Console → updateTextFontSize('text-id', 24)
         → Check Firestore → fontSize updated to 24
         Try updateTextFontSize('text-id', 100) → Error returned
❌ FAIL: Invalid fontSize accepted or validation missing
```

**Sub-task 3.2d: Add updateTextFormatting() method**
- [ ] Add `updateTextFormatting(shapeId, { fontWeight?, fontStyle?, textDecoration? })`
- [ ] Accept partial updates (only changed fields)
- [ ] Update Firestore with provided fields

**🧪 TEST 3.2d:**
```
✅ PASS: Console → updateTextFormatting('text-id', { fontWeight: 'bold' })
         → Check Firestore → fontWeight='bold', other fields unchanged
❌ FAIL: All fields reset or update fails
```

#### 3.3 Build Text Creation UI (1.5 hours)

**Sub-task 3.3a: Add Text button to toolbar**
- [ ] Add "Text" button after shape buttons
- [ ] Button activates text placement mode
- [ ] Update CanvasContext activeTool to include 'text'

**🧪 TEST 3.3a:**
```
✅ PASS: Click Text button → Button highlights
         → Console → context.activeTool shows 'text'
❌ FAIL: Button doesn't work or activeTool not set
```

**Sub-task 3.3b: Implement text placement mode**
- [ ] When activeTool='text', change cursor to text cursor
- [ ] Click on canvas → capture position
- [ ] Show input field (HTML input or Konva Text) at clicked position

**🧪 TEST 3.3b:**
```
✅ PASS: Activate Text tool → Cursor changes to text cursor (I-beam)
         Click on canvas → Input field appears at exact click position
❌ FAIL: Cursor doesn't change or input doesn't appear
```

**Sub-task 3.3c: Wire up text input to createText()**
- [ ] Auto-focus input field when it appears
- [ ] Enter key → call createText() with input value
- [ ] Escape key → cancel and hide input
- [ ] Use current selected color from toolbar

**🧪 TEST 3.3c:**
```
✅ PASS: Input appears → Type "Hello World" → Press Enter
         → Input disappears, text appears on canvas
         → Check Firestore → Text document created
         Press Escape during input → Input disappears, no shape created
❌ FAIL: Text not created or input doesn't disappear
```

#### 3.4 Build Text Editing UI (1 hour)

**Sub-task 3.4a: Implement double-click edit mode**
- [ ] Add double-click handler to text shapes
- [ ] Show input field at text position with current text value
- [ ] Pre-populate input with existing text

**🧪 TEST 3.4a:**
```
✅ PASS: Double-click text shape → Input field appears at same position
         → Input shows current text value
         → Input is focused and selected
❌ FAIL: Input doesn't appear or shows wrong value
```

**Sub-task 3.4b: Wire up edit save/cancel**
- [ ] Enter key → call updateText() with new value
- [ ] Escape key → cancel and revert to original
- [ ] Update canvas rendering after save

**🧪 TEST 3.4b:**
```
✅ PASS: Edit text, press Enter → Text updates on canvas
         → Check Firestore → text field updated
         Edit text, press Escape → Text reverts to original
❌ FAIL: Updates don't save or revert doesn't work
```

#### 3.5 Build Text Formatting Controls (0.5 hours)

**Sub-task 3.5a: Add formatting panel to controls**
- [ ] When text shape locked, show formatting controls
- [ ] Three toggle buttons: [B] [I] [U̲]
- [ ] Font size dropdown with values: 12, 14, 16, 18, 20, 24, 32, 48
- [ ] Show current state (active buttons highlighted)

**🧪 TEST 3.5a:**
```
✅ PASS: Lock text shape → Formatting panel appears
         → Shows 3 toggle buttons + font size dropdown
         → Current formats highlighted (e.g., if bold, [B] is blue)
❌ FAIL: Panel doesn't appear or current state not shown
```

**Sub-task 3.5b: Wire up formatting buttons**
- [ ] Bold [B]: toggle between 'normal' and 'bold'
- [ ] Italic [I]: toggle between 'normal' and 'italic'  
- [ ] Underline [U̲]: toggle between 'none' and 'underline'
- [ ] Each calls updateTextFormatting()

**🧪 TEST 3.5b:**
```
✅ PASS: Click [B] button → Text becomes bold on canvas
         → Check Firestore → fontWeight='bold'
         Click [B] again → Text returns to normal
         → Check Firestore → fontWeight='normal'
❌ FAIL: Formatting doesn't apply or doesn't persist
```

**Sub-task 3.5c: Wire up font size dropdown**
- [ ] Dropdown onChange → call updateTextFontSize()
- [ ] Text size updates on canvas immediately

**🧪 TEST 3.5c:**
```
✅ PASS: Select 24 from dropdown → Text grows to 24px on canvas
         → Check Firestore → fontSize=24
❌ FAIL: Size doesn't change or not saved
```

#### 3.6 Render Text with Konva (0.5 hours)

**Sub-task 3.6a: Add Konva Text rendering**
- [ ] In Canvas.tsx, add case for type='text'
- [ ] Render Konva `<Text>` component
- [ ] Apply fontSize, fill (color), text content
- [ ] Make draggable like other shapes

**🧪 TEST 3.6a:**
```
✅ PASS: Manually create text in Firestore → Text renders on canvas
         → Text is correct size, color, and content
         → Can lock and drag text shape
❌ FAIL: Text doesn't render or properties wrong
```

**Sub-task 3.6b: Apply text formatting to rendering**
- [ ] Combine fontWeight and fontStyle: if bold → "bold 16px", if italic → "italic 16px", if both → "bold italic 16px"
- [ ] Apply textDecoration prop
- [ ] Support rotation like other shapes

**🧪 TEST 3.6b:**
```
✅ PASS: Create text with bold, italic, underline → All formatting visible
         Rotate text to 45° → Text rotates correctly
❌ FAIL: Formatting not visible or rotation broken
```

**Code Reference:** See PRD.md lines 322-343 for Konva rendering

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Text Creation
- [ ] User A clicks Text button → mode activates
- [ ] User A clicks canvas → input field appears at position
- [ ] User A types "Hello World" → Enter creates text
- [ ] User B sees text appear in <100ms
- [ ] Text displays at correct position with default fontSize (16)
- [ ] Escape cancels text creation

#### Text Editing
- [ ] User A double-clicks text → edit mode activates
- [ ] Input shows current text value
- [ ] User A edits to "Hello Universe" → Enter saves
- [ ] User B sees update in <100ms
- [ ] User A presses Escape → cancels edit, reverts to original

#### Text Formatting
- [ ] User A locks text → formatting panel appears
- [ ] Click **[B]** → text becomes bold
- [ ] User B sees bold text in <100ms
- [ ] Click **[I]** while bold → text is bold + italic
- [ ] Click **[U̲]** → text is bold + italic + underline
- [ ] User B sees all formatting in real-time
- [ ] Change font size to 24 → text grows
- [ ] User B sees size change in <100ms

#### Text Transforms
- [ ] Text can be dragged like shapes
- [ ] Text can be rotated (rotation handle appears)
- [ ] Text can be locked/unlocked
- [ ] Formatted text maintains formatting during all operations

**Performance:**
- [ ] Text rendering is smooth
- [ ] No lag with 10+ text layers
- [ ] Formatting toggles respond instantly

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #4

---

## PR #4: Delete & Duplicate
**Branch:** `feature/delete-duplicate`  
**Goal:** Add delete and duplicate operations with UI controls  
**Time Estimate:** 3 hours

### Why This PR?
- Delete/Duplicate are essential operations
- Quick implementation (leverages existing locking)
- Enables testing workflows (create, duplicate, delete)
- Required for keyboard shortcuts (next part)

### Prerequisites
- ✅ PR #3 merged and deployed
- ✅ All shape types can be created and locked
- ✅ Controls panel framework exists

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-4-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 4.1 Extend CanvasService (1 hour)

**Sub-task 4.1a: Add deleteShape() method**
- [ ] Add `deleteShape(shapeId: string): Promise<void>`
- [ ] Use Firestore `deleteDoc()` to remove document
- [ ] Handle shape not found gracefully (no error if already deleted)

**🧪 TEST 4.1a:**
```
✅ PASS: Console → canvasService.deleteShape('shape-id')
         → Check Firestore → Document deleted
         Call deleteShape() on non-existent ID → No error thrown
❌ FAIL: Document not deleted or error on missing shape
```

**Sub-task 4.1b: Add duplicateShape() method skeleton**
- [ ] Add `duplicateShape(shapeId: string, userId: string): Promise<string>`
- [ ] Fetch original shape data from Firestore
- [ ] Return error if shape not found

**🧪 TEST 4.1b:**
```
✅ PASS: Console → canvasService.duplicateShape('shape-id', 'user-id')
         → Returns promise (no error yet if not fully implemented)
❌ FAIL: Method doesn't exist or immediate error
```

**Sub-task 4.1c: Implement duplicate logic with offset**
- [ ] Create new shape with same properties
- [ ] Apply 20px offset: `{ x: original.x + 20, y: original.y + 20 }`
- [ ] Handle canvas edge: if x > 4980 or y > 4980, wrap to (50, 50)
- [ ] Return new shape ID

**🧪 TEST 4.1c:**
```
✅ PASS: Create shape at (500, 500) → Duplicate it
         → Check Firestore → New shape at (520, 520) exists
         Create shape at (4990, 4990) → Duplicate it
         → New shape at (50, 50) (wrapped)
❌ FAIL: Duplicate has wrong position or edge case broken
```

#### 4.2 Build Controls Panel UI (1.5 hours)

**Sub-task 4.2a: Create ShapeControls component**
- [ ] Create `src/components/Canvas/ShapeControls.tsx`
- [ ] Accept props: `shape`, `onDelete`, `onDuplicate`
- [ ] Show only when shape is locked by current user
- [ ] Render container with two buttons

**🧪 TEST 4.2a:**
```
✅ PASS: Lock a shape → Controls panel appears
         Unlock shape → Controls panel disappears
❌ FAIL: Panel doesn't appear or doesn't hide
```

**Sub-task 4.2b: Add Delete and Duplicate buttons**
- [ ] Delete button: 🗑️ icon + "Delete" text
- [ ] Duplicate button: 📋 icon + "Duplicate" text
- [ ] Style: white background, border, hover states
- [ ] Position: floating near selected shape or fixed in corner

**🧪 TEST 4.2b:**
```
✅ PASS: Controls panel shows two clearly visible buttons
         → Buttons have icons and text
         → Hover changes appearance (color/background)
❌ FAIL: Buttons not visible or no hover effect
```

**Sub-task 4.2c: Wire up button handlers**
- [ ] Delete button onClick → call `onDelete()` prop
- [ ] Duplicate button onClick → call `onDuplicate()` prop
- [ ] Buttons are enabled and clickable

**🧪 TEST 4.2c:**
```
✅ PASS: Click Delete button → Console log verifies onClick fires
         Click Duplicate button → Console log verifies onClick fires
❌ FAIL: Buttons don't respond to clicks
```

#### 4.3 Wire Up Operations (0.5 hours)

**Sub-task 4.3a: Connect Delete to CanvasService**
- [ ] In Canvas.tsx (or parent), handle onDelete callback
- [ ] Call `canvasService.deleteShape(shapeId)`
- [ ] Show toast: "Shape deleted"
- [ ] Clear selection/unlock after delete

**🧪 TEST 4.3a:**
```
✅ PASS: Lock shape → Click Delete → Shape disappears from canvas
         → Toast "Shape deleted" appears
         → Check Firestore → Shape document deleted
❌ FAIL: Shape not deleted or toast not shown
```

**Sub-task 4.3b: Connect Duplicate to CanvasService**
- [ ] Handle onDuplicate callback
- [ ] Call `canvasService.duplicateShape(shapeId, userId)`
- [ ] Show toast: "Shape duplicated"
- [ ] Optionally auto-select new shape

**🧪 TEST 4.3b:**
```
✅ PASS: Lock blue rectangle → Click Duplicate
         → New blue rectangle appears 20px offset
         → Toast "Shape duplicated" appears
         → Check Firestore → Two shape documents exist
❌ FAIL: Duplicate not created or wrong position
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Delete Tests
- [ ] User A locks rectangle → controls panel appears
- [ ] User A clicks Delete → shape disappears
- [ ] User B sees deletion in <100ms
- [ ] Toast shows "Shape deleted"
- [ ] Can delete all shape types (rectangle, circle, triangle, text)
- [ ] Can delete rotated and formatted shapes

#### Duplicate Tests
- [ ] User A locks blue rectangle → clicks Duplicate
- [ ] New blue rectangle appears 20px offset from original
- [ ] User B sees duplicate in <100ms
- [ ] Toast shows "Shape duplicated"
- [ ] Duplicate preserves all properties (color, size, rotation, formatting)
- [ ] Can duplicate all shape types
- [ ] Duplicate text preserves formatting (bold, italic, underline)

#### Edge Cases
- [ ] Duplicate shape near canvas edge (x=4900, y=4900) → wraps correctly
- [ ] Delete shape while another user viewing → smooth removal
- [ ] Rapid duplicate clicks → creates multiple copies correctly

**Performance:**
- [ ] Operations feel instant (<50ms)
- [ ] Works smoothly with 30+ shapes

**✅ CHECKPOINT:** All tests pass → Deploy to production → **END OF PART 1**

---

# 🎯 PART 2: Advanced Features (PRs #5-9, ~25 hours)

Strategic rubric-driven features for professional design tool capabilities.

---

## PR #5: Multi-Select (Shift+Click & Marquee Selection)
**Branch:** `feature/multi-select`  
**Goal:** Enable selecting multiple shapes for group operations  
**Time Estimate:** 5 hours

### Why This PR?
- **CRITICAL for rubric:** Required for "Excellent" score in Canvas Functionality
- Foundation for grouping, alignment, batch operations
- High user value for professional workflows

### Prerequisites
- ✅ Part 1 complete (all shape types, delete, duplicate working)
- ✅ Selection state exists (single shape selection)
- ✅ Canvas context manages selected shapes

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-5-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 5.1 Update Selection State (1 hour)

**Sub-task 5.1a: Change selection state to array**
- [ ] In CanvasContext, change `selectedShape: string | null` to `selectedShapes: string[]`
- [ ] Update initial state to empty array: `[]`
- [ ] Update TypeScript types

**🧪 TEST 5.1a:**
```
✅ PASS: Check TypeScript compilation → No errors
         Console → Check context.selectedShapes → Shows [] (empty array)
❌ FAIL: TypeScript errors or state not array
```

**Sub-task 5.1b: Update all components using selection**
- [ ] Find all usages of `selectedShape` in components
- [ ] Update to use `selectedShapes` array
- [ ] Single selection: `selectedShapes[0]`
- [ ] Check if selected: `selectedShapes.includes(shapeId)`

**🧪 TEST 5.1b:**
```
✅ PASS: Click a shape → selectedShapes contains that shape ID
         Click background → selectedShapes becomes []
         No console errors
❌ FAIL: Selection broken or console errors
```

**Sub-task 5.1c: Add selection helper functions**
- [ ] Add `toggleSelection(shapeId)`: add if not present, remove if present
- [ ] Add `setSelection(shapeIds)`: replace entire selection
- [ ] Add `clearSelection()`: set to []

**🧪 TEST 5.1c:**
```
✅ PASS: Console → context.toggleSelection('shape-1')
         → selectedShapes includes 'shape-1'
         Call again → selectedShapes doesn't include 'shape-1'
❌ FAIL: Helper functions don't work correctly
```

#### 5.2 Implement Shift+Click Selection (1.5 hours)

**Sub-task 5.2a: Add Shift key detection**
- [ ] In shape click handler, check `event.shiftKey`
- [ ] If Shift held: call `toggleSelection(shapeId)`
- [ ] If Shift not held: call `setSelection([shapeId])`

**🧪 TEST 5.2a:**
```
✅ PASS: Click shape → Only that shape selected
         Shift+Click another shape → Both shapes selected
         Shift+Click first shape again → Only second shape selected
❌ FAIL: Shift key not detected or selection logic broken
```

**Sub-task 5.2b: Add multi-select visual feedback**
- [ ] In Canvas.tsx rendering, check if shape is in selectedShapes array
- [ ] If selected: add blue border (3px, #3b82f6) to shape
- [ ] All selected shapes show blue border simultaneously

**🧪 TEST 5.2b:**
```
✅ PASS: Select 3 shapes with shift-click
         → All 3 shapes show blue border
         → Border clearly visible
❌ FAIL: Borders don't appear or only one shows
```

**Sub-task 5.2c: Update controls panel for multi-select**
- [ ] When selectedShapes.length > 1, show "X shapes selected"
- [ ] Show Delete and Duplicate buttons for multi-select
- [ ] Hide resize/rotate handles when multiple selected

**🧪 TEST 5.2c:**
```
✅ PASS: Select 3 shapes → Controls show "3 shapes selected"
         → Delete and Duplicate buttons visible
         → Resize handles hidden (only show for single shape)
❌ FAIL: Controls don't update or show wrong count
```

#### 5.3 Implement Marquee Selection (2 hours)

**Sub-task 5.3a: Add marquee state and mousedown handler**
- [ ] Add state: `marquee: { startX, startY, endX, endY } | null`
- [ ] On canvas background mousedown: set marquee start position
- [ ] Detect background vs shape click

**🧪 TEST 5.3a:**
```
✅ PASS: Click and hold on empty canvas area
         → Console log shows marquee state with startX, startY
         Click on a shape → Marquee doesn't start
❌ FAIL: Marquee starts when clicking shapes, or doesn't start at all
```

**Sub-task 5.3b: Implement marquee visual during drag**
- [ ] On mousemove (while marquee active): update endX, endY
- [ ] Render Konva rectangle showing marquee bounds
- [ ] Visual: dashed blue border (stroke), semi-transparent blue fill (opacity 0.2)

**🧪 TEST 5.3b:**
```
✅ PASS: Click and drag on canvas → Blue dashed rectangle appears
         → Rectangle grows/shrinks with mouse movement
         → Dashed border and transparent fill visible
❌ FAIL: Rectangle doesn't appear or wrong styling
```

**Sub-task 5.3c: Calculate intersecting shapes on mouseup**
- [ ] On mouseup: get marquee final bounds
- [ ] Loop through all shapes
- [ ] For each shape, check if bounding box intersects marquee rectangle
- [ ] Collect IDs of intersecting shapes

**🧪 TEST 5.3c:**
```
✅ PASS: Create 5 shapes on canvas
         → Draw marquee over 3 of them
         → Console log shows array of 3 shape IDs
❌ FAIL: Wrong shapes detected or intersection calculation broken
```

**Sub-task 5.3d: Update selection based on Shift key**
- [ ] If Shift held during mouseup: add intersecting shapes to current selection
- [ ] If Shift not held: replace selection with intersecting shapes
- [ ] Clear marquee state after selection

**🧪 TEST 5.3d:**
```
✅ PASS: Draw marquee over 2 shapes → 2 shapes selected
         Hold Shift, draw marquee over 2 more → All 4 selected
         Draw marquee without Shift → Only new marquee shapes selected
❌ FAIL: Selection doesn't update or Shift logic broken
```

#### 5.4 Multi-Shape Operations (0.5 hours)

**Sub-task 5.4a: Implement multi-shape drag**
- [ ] When dragging a selected shape, check if selectedShapes.length > 1
- [ ] Calculate offset from drag (deltaX, deltaY)
- [ ] Apply same offset to all selected shapes
- [ ] Maintain relative positions

**🧪 TEST 5.4a:**
```
✅ PASS: Select 3 shapes → Drag any one of them
         → All 3 shapes move together
         → Relative spacing maintained
         → Check Firestore → All 3 shapes' positions updated
❌ FAIL: Only one shape moves, or positions not updated
```

**Sub-task 5.4b: Implement multi-shape delete**
- [ ] When Delete button clicked with multiple selected
- [ ] Call `deleteShape()` for each selected shape
- [ ] Show toast: "Deleted X shapes"

**🧪 TEST 5.4b:**
```
✅ PASS: Select 4 shapes → Click Delete
         → All 4 shapes disappear
         → Toast "Deleted 4 shapes"
         → Check Firestore → All 4 documents deleted
❌ FAIL: Not all shapes deleted or toast wrong
```

**Sub-task 5.4c: Implement multi-shape duplicate**
- [ ] When Duplicate clicked with multiple selected
- [ ] Call `duplicateShape()` for each selected shape
- [ ] All duplicates share same 20px offset
- [ ] Show toast: "Duplicated X shapes"

**🧪 TEST 5.4c:**
```
✅ PASS: Select 3 shapes → Click Duplicate
         → 3 new shapes appear, all offset by 20px
         → Toast "Duplicated 3 shapes"
         → Check Firestore → 6 total shapes (3 original + 3 duplicates)
❌ FAIL: Duplicates not created or wrong positions
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Shift+Click Selection
- [ ] User A clicks rectangle → selected (blue border)
- [ ] User A shift-clicks circle → both selected (2 blue borders)
- [ ] User A shift-clicks triangle → all 3 selected
- [ ] User A shift-clicks rectangle again → deselects (only circle + triangle selected)
- [ ] User B sees selection borders in real-time
- [ ] Click background → clears all selections

#### Marquee Selection
- [ ] User A drags rectangle on empty canvas → marquee appears (dashed blue)
- [ ] Marquee follows mouse with semi-transparent fill
- [ ] Release → all shapes inside marquee selected
- [ ] User A shift-drags another marquee → adds to current selection
- [ ] User A drags marquee without Shift → replaces selection
- [ ] User B sees all selection changes

#### Multi-Shape Operations
- [ ] Select 3 shapes → drag one → all 3 move together
- [ ] User B sees all shapes moving in sync
- [ ] Select 3 shapes → click Delete → all deleted
- [ ] Select 3 shapes → click Duplicate → 3 new shapes appear with offset
- [ ] Controls panel shows "3 shapes selected"

**Performance:**
- [ ] Marquee drawing is smooth (60 FPS)
- [ ] Intersection calculation is fast (<16ms)
- [ ] Works with 50+ shapes on canvas

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #6

---

## PR #6: Object Grouping & Ungrouping
**Branch:** `feature/grouping`  
**Goal:** Group multiple shapes to move together as one unit  
**Time Estimate:** 5 hours

### Why This PR?
- **Tier 1 rubric feature:** Worth 2 points
- Essential for professional workflows
- Foundation for complex designs (forms, components)

### Prerequisites
- ✅ PR #5 complete (multi-select working)
- ✅ Can select 2+ shapes easily
- ✅ Firestore batch writes supported

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-6-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 6.1 Add Firestore Groups Collection (0.5 hours)

**Sub-task 6.1a: Add groupId field to shapes**
- [ ] Update Shape TypeScript interface: add `groupId?: string | null`
- [ ] Existing shapes work with undefined groupId (fallback to null)

**🧪 TEST 6.1a:**
```
✅ PASS: TypeScript compiles with no errors
         Existing shapes still render correctly
❌ FAIL: TypeScript errors
```

**Sub-task 6.1b: Define Group interface**
- [ ] Create Group interface: `{ id, name, shapeIds[], createdBy, createdAt }`
- [ ] Add to types file

**🧪 TEST 6.1b:**
```
✅ PASS: TypeScript recognizes Group type
         Can create test Group object without errors
❌ FAIL: Type errors
```

#### 6.2 Extend CanvasService for Grouping (2 hours)

**Sub-task 6.2a: Add groupShapes() method skeleton**
- [ ] Add `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>`
- [ ] Create group document in `canvases/main/groups` collection
- [ ] Return group ID

**🧪 TEST 6.2a:**
```
✅ PASS: Console → canvasService.groupShapes(['shape1', 'shape2'], 'user-id')
         → Check Firestore → Group document created with shapeIds array
❌ FAIL: Group document not created
```

**Sub-task 6.2b: Update shapes with groupId (batch write)**
- [ ] In groupShapes(), create Firestore batch
- [ ] For each shapeId, update shape document with groupId
- [ ] Commit batch write
- [ ] All shapes updated atomically

**🧪 TEST 6.2b:**
```
✅ PASS: Create 3 shapes → Group them
         → Check Firestore → All 3 shapes have same groupId
         → groupId matches the group document ID
❌ FAIL: Shapes missing groupId or values don't match
```

**Sub-task 6.2c: Add ungroupShapes() method**
- [ ] Add `ungroupShapes(groupId: string): Promise<void>`
- [ ] Fetch group document to get shapeIds
- [ ] Create batch write to remove groupId from all shapes (set to null)
- [ ] Delete group document
- [ ] Commit batch

**🧪 TEST 6.2c:**
```
✅ PASS: Group 3 shapes → Call ungroupShapes(groupId)
         → Check Firestore → All shapes have groupId = null
         → Group document deleted
❌ FAIL: groupId not cleared or group document still exists
```

**Sub-task 6.2d: Add subscribeToGroups() for real-time updates**
- [ ] Add `subscribeToGroups(callback): () => void`
- [ ] Subscribe to groups collection with onSnapshot
- [ ] Return unsubscribe function

**🧪 TEST 6.2d:**
```
✅ PASS: Call subscribeToGroups((groups) => console.log(groups))
         → Create a group in Firestore → Console logs new group
         → Delete group → Console logs updated list
❌ FAIL: Subscription doesn't fire or data wrong
```

#### 6.3 Build Grouping UI (1.5 hours)

**Sub-task 6.3a: Add Group button to controls**
- [ ] When selectedShapes.length >= 2, show "Group" button
- [ ] Button positioned in controls panel
- [ ] Styled consistently with other buttons

**🧪 TEST 6.3a:**
```
✅ PASS: Select 1 shape → Group button hidden
         Select 2+ shapes → Group button appears
❌ FAIL: Button doesn't appear or appears with wrong count
```

**Sub-task 6.3b: Wire up Group button**
- [ ] onClick → call `canvasService.groupShapes(selectedShapes, userId)`
- [ ] Show toast: "Grouped X shapes"
- [ ] Keep shapes selected after grouping

**🧪 TEST 6.3b:**
```
✅ PASS: Select 3 shapes → Click Group button
         → Toast "Grouped 3 shapes"
         → Check Firestore → Group created, shapes have groupId
❌ FAIL: Group not created or toast not shown
```

**Sub-task 6.3c: Implement group selection logic**
- [ ] When clicking a shape, check if it has groupId
- [ ] If groupId exists, fetch all shapes with same groupId
- [ ] Select entire group (set selectedShapes to all group members)

**🧪 TEST 6.3c:**
```
✅ PASS: Group 3 shapes → Click any one shape
         → All 3 shapes selected (blue borders on all)
❌ FAIL: Only one shape selected, or wrong shapes selected
```

**Sub-task 6.3d: Add Ungroup button**
- [ ] When all selectedShapes have same groupId, show "Ungroup" button
- [ ] onClick → call `canvasService.ungroupShapes(groupId)`
- [ ] Show toast: "Ungrouped X shapes"

**🧪 TEST 6.3d:**
```
✅ PASS: Select grouped shapes → Ungroup button appears
         Click Ungroup → Toast "Ungrouped X shapes"
         → Check Firestore → groupId removed, group deleted
❌ FAIL: Ungroup doesn't work or shapes still grouped
```

**Sub-task 6.3e: Add dashed border visual for groups**
- [ ] When grouped shapes selected, show dashed border instead of solid
- [ ] Dashed blue border indicates group membership

**🧪 TEST 6.3e:**
```
✅ PASS: Select grouped shapes → Dashed blue border appears
         Select non-grouped shapes → Solid blue border
❌ FAIL: No visual distinction or border style wrong
```

#### 6.4 Implement Group Operations (1 hour)

**Sub-task 6.4a: Group drag behavior**
- [ ] When dragging a grouped shape, detect if shape has groupId
- [ ] If grouped, apply drag offset to all shapes in group
- [ ] Use batch write to update all positions

**🧪 TEST 6.4a:**
```
✅ PASS: Group 3 shapes → Drag any one
         → All 3 move together maintaining relative positions
         → Check Firestore → All 3 positions updated
❌ FAIL: Only one moves or positions wrong
```

**Sub-task 6.4b: Group delete behavior**
- [ ] When deleting grouped shapes, delete entire group
- [ ] Delete all shapes in group + group document

**🧪 TEST 6.4b:**
```
✅ PASS: Select grouped shapes → Click Delete
         → All shapes disappear
         → Check Firestore → All shapes deleted + group document deleted
❌ FAIL: Some shapes remain or group document remains
```

**Sub-task 6.4c: Group duplicate behavior**
- [ ] When duplicating grouped shapes, duplicate entire group
- [ ] Create new group for duplicates
- [ ] All duplicates have same groupId (new group)

**🧪 TEST 6.4c:**
```
✅ PASS: Select grouped shapes (3) → Click Duplicate
         → 3 new shapes appear offset by 20px
         → Check Firestore → New group document + 6 shapes total (2 groups of 3)
❌ FAIL: Duplicates not grouped or counts wrong
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Grouping
- [ ] User A selects 3 rectangles (shift-click or marquee)
- [ ] "Group" button appears in controls
- [ ] User A clicks Group → shapes grouped
- [ ] Toast shows "Grouped 3 shapes"
- [ ] User B sees group created
- [ ] Click any shape in group → entire group selected (dashed border)
- [ ] User B clicks shape in group → entire group selected for User B too

#### Group Operations
- [ ] User A drags one shape in group → entire group moves together
- [ ] User B sees all shapes moving in sync
- [ ] User A clicks Delete → entire group deleted
- [ ] User B sees all shapes disappear
- [ ] User A groups 3 shapes, clicks Duplicate → 3 new grouped shapes appear
- [ ] New shapes are also grouped together

#### Ungrouping
- [ ] User A selects grouped shapes → "Ungroup" button appears
- [ ] User A clicks Ungroup → shapes ungrouped
- [ ] Toast shows "Ungrouped X shapes"
- [ ] Can now select shapes individually
- [ ] User B sees ungroup take effect

**Edge Cases:**
- [ ] Group with mixed shape types (rectangles, circles, text) works
- [ ] Group with rotated shapes maintains rotations
- [ ] Group with formatted text preserves formatting
- [ ] Cannot create nested groups (document limitation)

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #7

---

## PR #7: Z-Index Management (Layer Control)
**Branch:** `feature/z-index`  
**Goal:** Control stacking order with bring to front/back operations  
**Time Estimate:** 4 hours

### Why This PR?
- **Tier 2 rubric feature:** Worth 3 points
- Essential for overlapping shapes
- Professional design tool requirement

### Prerequisites
- ✅ PR #6 complete (grouping working)
- ✅ Shapes render in creation order currently
- ✅ Controls panel has space for new buttons

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-7-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 7.1 Add zIndex to Data Model (0.5 hours)

**Sub-task 7.1a: Update TypeScript interfaces**
- [ ] Add `zIndex?: number` field to Shape interface
- [ ] Default to 0 for new shapes
- [ ] Existing shapes fallback to 0 if undefined

**🧪 TEST 7.1a:**
```
✅ PASS: TypeScript compiles with no errors
         Create new shape → Check Firestore → zIndex: 0 exists
❌ FAIL: TypeScript errors or field missing
```

#### 7.2 Extend CanvasService for Z-Index (2 hours)

**Sub-task 7.2a: Add bringToFront() method**
- [ ] Add `bringToFront(shapeId: string): Promise<void>`
- [ ] Query all shapes to find max zIndex
- [ ] Set shape's zIndex to max + 1
- [ ] Update Firestore with new zIndex

**🧪 TEST 7.2a:**
```
✅ PASS: Create 3 shapes with zIndex 0, 1, 2
         → Console → bringToFront(shape with zIndex=0)
         → Check Firestore → That shape now has zIndex=3
❌ FAIL: zIndex not updated or wrong value
```

**Sub-task 7.2b: Add sendToBack() method**
- [ ] Add `sendToBack(shapeId: string): Promise<void>`
- [ ] Query all shapes to find min zIndex
- [ ] Set shape's zIndex to min - 1
- [ ] Update Firestore

**🧪 TEST 7.2b:**
```
✅ PASS: Create 3 shapes with zIndex 0, 1, 2
         → sendToBack(shape with zIndex=2)
         → Check Firestore → That shape now has zIndex=-1
❌ FAIL: zIndex not updated or wrong value
```

**Sub-task 7.2c: Add bringForward() and sendBackward() methods**
- [ ] Add `bringForward(shapeId)`: increment zIndex by 1
- [ ] Add `sendBackward(shapeId)`: decrement zIndex by 1
- [ ] Update Firestore for both

**🧪 TEST 7.2c:**
```
✅ PASS: Shape at zIndex=5 → bringForward() → zIndex=6
         Shape at zIndex=3 → sendBackward() → zIndex=2
         → Check Firestore → Values correct
❌ FAIL: zIndex not changed correctly
```

#### 7.3 Update Rendering for Z-Index (0.5 hours)

**Sub-task 7.3a: Sort shapes before rendering**
- [ ] In Canvas.tsx, before mapping shapes
- [ ] Sort: `shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))`
- [ ] Render sorted array

**🧪 TEST 7.3a:**
```
✅ PASS: Manually create 3 shapes in Firestore with zIndex 2, 0, 1
         → Canvas renders in order: 0, 1, 2 (visual stacking)
         → Shape with zIndex=2 appears on top
❌ FAIL: Shapes render in wrong order
```

#### 7.4 Build Z-Index Controls (1 hour)

**Sub-task 7.4a: Add z-index buttons to controls**
- [ ] When single shape selected, show 4 buttons
- [ ] Layout: [To Front] [Forward] [Backward] [To Back]
- [ ] Add icons: ⬆️🔝 ⬆️ ⬇️ ⬇️⬇️
- [ ] Style consistently with other controls

**🧪 TEST 7.4a:**
```
✅ PASS: Select a shape → 4 z-index buttons appear
         → Buttons have icons and labels
         Deselect → Buttons disappear
❌ FAIL: Buttons don't appear or wrong count
```

**Sub-task 7.4b: Wire up z-index button handlers**
- [ ] To Front → call `canvasService.bringToFront()`
- [ ] To Back → call `canvasService.sendToBack()`
- [ ] Forward → call `canvasService.bringForward()`
- [ ] Backward → call `canvasService.sendBackward()`
- [ ] Show toast after each action

**🧪 TEST 7.4b:**
```
✅ PASS: Create overlapping shapes → Select bottom one → Click "To Front"
         → Shape moves to top visually
         → Toast appears
         → Check Firestore → zIndex updated
❌ FAIL: Visual doesn't change or Firestore not updated
```

**Sub-task 7.4c: Add tooltips with keyboard shortcuts**
- [ ] To Front: tooltip "Bring to Front (Cmd+Shift+])"
- [ ] Forward: tooltip "Bring Forward (Cmd+])"
- [ ] Backward: tooltip "Send Backward (Cmd+[)"
- [ ] To Back: tooltip "Send to Back (Cmd+Shift+[)"

**🧪 TEST 7.4c:**
```
✅ PASS: Hover over each button → Tooltip appears with keyboard shortcut
❌ FAIL: Tooltips don't appear
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Layer Operations
- [ ] User A creates blue rectangle at (500, 500)
- [ ] User A creates red rectangle at (520, 520) → overlaps blue
- [ ] Red appears on top (higher zIndex)
- [ ] User A selects blue, clicks "To Front"
- [ ] Blue now appears on top of red
- [ ] User B sees layer change in real-time

#### All Z-Index Buttons
- [ ] Create 5 overlapping shapes
- [ ] Select middle shape (zIndex=2)
- [ ] Click Forward → moves up one layer (zIndex=3)
- [ ] Click Backward → moves down one layer (zIndex=2)
- [ ] Click To Front → moves to top (zIndex=5)
- [ ] Click To Back → moves to bottom (zIndex=0)
- [ ] User B sees all changes in real-time

#### Edge Cases
- [ ] Shape at top layer → "Forward" and "To Front" have same effect
- [ ] Shape at bottom layer → "Backward" and "To Back" have same effect
- [ ] Z-index changes persist after refresh
- [ ] Grouped shapes: changing one shape's z-index doesn't affect group integrity

**Performance:**
- [ ] Z-index operations feel instant
- [ ] Rendering order correct with 50+ shapes

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #8

---

## PR #8: Alignment Tools (Align & Distribute)
**Branch:** `feature/alignment`  
**Goal:** Align and distribute multiple shapes with 6 alignment types  
**Time Estimate:** 5 hours

### Why This PR?
- **Tier 2 rubric feature:** Worth 3 points
- Essential for precise layouts
- High user value for design work

### Prerequisites
- ✅ PR #7 complete (z-index working)
- ✅ Multi-select working (can select 2+ shapes)
- ✅ Firestore batch writes available

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-8-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 8.1 Extend CanvasService for Alignment (2.5 hours)

**Sub-task 8.1a: Add alignShapes() method skeleton**
- [ ] Add `alignShapes(shapeIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Promise<void>`
- [ ] Fetch all shape documents for given IDs
- [ ] Return early if less than 2 shapes

**🧪 TEST 8.1a:**
```
✅ PASS: Console → alignShapes(['id1', 'id2'], 'left')
         → No errors thrown
❌ FAIL: Method doesn't exist or immediate error
```

**Sub-task 8.1b: Implement horizontal alignment logic**
- [ ] Left: calculate `minX = Math.min(...shapes.map(s => s.x))`
         Update all shapes to minX
- [ ] Center: calculate average center X, align all to that
- [ ] Right: calculate maxX (rightmost edge), align all right edges
- [ ] Use Firestore batch write for all updates

**🧪 TEST 8.1b:**
```
✅ PASS: Create 3 shapes at x=100, x=200, x=300
         → alignShapes([ids], 'left')
         → Check Firestore → All shapes have x=100
         → alignShapes([ids], 'right')
         → All shapes' right edges aligned
❌ FAIL: Positions not updated or wrong calculations
```

**Sub-task 8.1c: Implement vertical alignment logic**
- [ ] Top: align to topmost y
- [ ] Middle: align to average center y
- [ ] Bottom: align bottom edges
- [ ] Use batch write

**🧪 TEST 8.1c:**
```
✅ PASS: Create 3 shapes at y=100, y=200, y=300
         → alignShapes([ids], 'top')
         → Check Firestore → All shapes have y=100
❌ FAIL: Positions not updated
```

**Sub-task 8.1d: Add distributeShapes() method**
- [ ] Add `distributeShapes(shapeIds: string[], direction: 'horizontal' | 'vertical'): Promise<void>`
- [ ] Horizontal: space shapes evenly between leftmost and rightmost
- [ ] Vertical: space shapes evenly between topmost and bottommost
- [ ] Calculate spacing = (totalSpan - totalWidth) / (count - 1)
- [ ] Update positions with batch write

**🧪 TEST 8.1d:**
```
✅ PASS: Create 5 shapes in horizontal line with uneven spacing
         → distributeShapes([ids], 'horizontal')
         → Check Firestore → Shapes have even spacing
❌ FAIL: Spacing not even or wrong calculations
```

#### 8.2 Build Alignment Toolbar (2 hours)

**Sub-task 8.2a: Create AlignmentToolbar component**
- [ ] Create `src/components/Canvas/AlignmentToolbar.tsx`
- [ ] Show when selectedShapes.length >= 2
- [ ] Layout: two rows of buttons
- [ ] Style: consistent with other toolbars

**🧪 TEST 8.2a:**
```
✅ PASS: Select 1 shape → Toolbar hidden
         Select 2+ shapes → Toolbar appears
❌ FAIL: Toolbar doesn't appear with multiple selection
```

**Sub-task 8.2b: Add alignment buttons (Row 1)**
- [ ] 6 buttons: Left, Center, Right, Top, Middle, Bottom
- [ ] Icons: ⬅️ ↔️ ➡️ ⬆️ ↕️ ⬇️
- [ ] Each button calls alignShapes with correct alignment type

**🧪 TEST 8.2b:**
```
✅ PASS: Alignment toolbar shows 6 buttons with icons
         Click any button → Console log verifies onClick fires
❌ FAIL: Buttons missing or onClick doesn't fire
```

**Sub-task 8.2c: Add distribution buttons (Row 2)**
- [ ] 2 buttons: Distribute Horizontally, Distribute Vertically
- [ ] Icons: ↔️ and ↕️
- [ ] Each calls distributeShapes with correct direction

**🧪 TEST 8.2c:**
```
✅ PASS: Toolbar shows 2 distribution buttons
         Click each → Console log verifies onClick
❌ FAIL: Buttons missing or not working
```

**Sub-task 8.2d: Wire up to CanvasService and add feedback**
- [ ] All button handlers call appropriate service method
- [ ] Show toast after each operation
- [ ] Toasts: "Aligned X shapes to left", "Distributed X shapes horizontally"

**🧪 TEST 8.2d:**
```
✅ PASS: Select 3 shapes → Click "Align Left"
         → Toast appears
         → Shapes visually align
         → Check Firestore → Positions updated
❌ FAIL: Service not called or toast missing
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Horizontal Alignment
- [ ] User A creates 4 rectangles at random x positions (same y)
- [ ] User A selects all 4, clicks "Align Left"
- [ ] All shapes align to leftmost shape's x position
- [ ] User B sees alignment in real-time
- [ ] Test "Align Center" → shapes align to average center x
- [ ] Test "Align Right" → shapes align to rightmost x

#### Vertical Alignment
- [ ] User A creates 4 rectangles at random y positions (same x)
- [ ] User A selects all 4, clicks "Align Top"
- [ ] All shapes align to topmost shape's y position
- [ ] Test "Align Middle" → shapes align to average center y
- [ ] Test "Align Bottom" → shapes align to bottommost y

#### Distribution
- [ ] User A creates 5 rectangles in horizontal line (uneven spacing)
- [ ] User A selects all 5, clicks "Distribute Horizontally"
- [ ] Shapes space evenly between leftmost and rightmost
- [ ] User B sees distribution in real-time
- [ ] Test "Distribute Vertically" with vertical line of shapes

#### Mixed Shapes
- [ ] Alignment works with mixed types (rectangles, circles, triangles, text)
- [ ] Alignment works with rotated shapes (uses bounding box)
- [ ] Alignment works with grouped shapes

**Performance:**
- [ ] Batch updates feel instant (<100ms)
- [ ] Works with 20+ shapes selected

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #9

---

## PR #9: Keyboard Shortcuts + Copy/Paste
**Branch:** `feature/keyboard-shortcuts`  
**Goal:** Add 15+ keyboard shortcuts for power users  
**Time Estimate:** 4 hours

### Why This PR?
- **Tier 1 rubric features:** Worth 4 points (2 for shortcuts, 2 for copy/paste)
- High value-to-effort ratio
- Essential for professional workflows
- Improves user efficiency dramatically

### Prerequisites
- ✅ Part 2 almost complete (all operations working)
- ✅ All manual operations available (delete, duplicate, group, align, z-index)
- ✅ Toast system for feedback

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-9-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 9.1 Implement Keyboard Event Handler (2 hours)

**Sub-task 9.1a: Add global keydown listener**
- [ ] In Canvas.tsx or App.tsx, add `useEffect` with keydown listener
- [ ] Detect if focus is in input/textarea (ignore keyboard shortcuts if typing)
- [ ] Detect platform: Mac (metaKey) vs Windows/Linux (ctrlKey)

**🧪 TEST 9.1a:**
```
✅ PASS: Press any key → Console log shows keydown event
         Type in text input → Console log shows "ignored, typing in input"
❌ FAIL: Listener not firing or input detection broken
```

**Sub-task 9.1b: Implement basic operation shortcuts**
- [ ] Delete/Backspace → delete selected shapes
- [ ] Cmd/Ctrl+D → duplicate selected shapes
- [ ] Escape → clear selection
- [ ] Cmd/Ctrl+A → select all shapes

**🧪 TEST 9.1b:**
```
✅ PASS: Select shape → Press Delete → Shape deleted
         Select shape → Press Cmd+D → Shape duplicated
         Shapes selected → Press Escape → Selection cleared
         Press Cmd+A → All shapes selected
❌ FAIL: Shortcuts don't fire or wrong behavior
```

**Sub-task 9.1c: Implement grouping shortcuts**
- [ ] Cmd/Ctrl+G → group selected shapes (if 2+)
- [ ] Cmd/Ctrl+Shift+G → ungroup selected shapes

**🧪 TEST 9.1c:**
```
✅ PASS: Select 3 shapes → Press Cmd+G → Grouped
         → Toast "Grouped 3 shapes"
         Select grouped shapes → Press Cmd+Shift+G → Ungrouped
❌ FAIL: Shortcuts don't work or toast missing
```

**Sub-task 9.1d: Implement z-index shortcuts**
- [ ] Cmd/Ctrl+] → bring forward
- [ ] Cmd/Ctrl+[ → send backward
- [ ] Cmd/Ctrl+Shift+] → bring to front
- [ ] Cmd/Ctrl+Shift+[ → send to back

**🧪 TEST 9.1d:**
```
✅ PASS: Select overlapping shape → Press Cmd+] → Moves forward one layer
         Press Cmd+Shift+] → Moves to top
         → Visual stacking updates correctly
❌ FAIL: Z-index shortcuts don't work
```

**Sub-task 9.1e: Implement nudge shortcuts**
- [ ] Arrow keys → move selected shapes 10px in direction
- [ ] Shift+Arrow → move selected shapes 1px (fine control)
- [ ] Update Firestore positions after nudge

**🧪 TEST 9.1e:**
```
✅ PASS: Select shape → Press Arrow Right → Moves 10px right
         Hold Shift → Press Arrow Down → Moves 1px down
         → Check Firestore → Positions updated
❌ FAIL: Nudge doesn't work or wrong distance
```

#### 9.2 Implement Copy/Paste (1.5 hours)

**Sub-task 9.2a: Add clipboard state**
- [ ] In CanvasContext, add `clipboard: Shape[] | null`
- [ ] Add `setClipboard` function
- [ ] Initialize to null

**🧪 TEST 9.2a:**
```
✅ PASS: Console → Check context.clipboard → Shows null initially
         TypeScript compiles with no errors
❌ FAIL: State doesn't exist or type errors
```

**Sub-task 9.2b: Implement Copy (Cmd/Ctrl+C)**
- [ ] On Cmd+C, store selectedShapes data in clipboard
- [ ] Fetch full shape data for selected IDs
- [ ] Show toast: "Copied X shapes"

**🧪 TEST 9.2b:**
```
✅ PASS: Select 2 shapes → Press Cmd+C
         → Toast "Copied 2 shapes"
         → Console → context.clipboard contains 2 shape objects
❌ FAIL: Clipboard not populated or toast missing
```

**Sub-task 9.2c: Implement Paste (Cmd/Ctrl+V)**
- [ ] On Cmd+V, check if clipboard has shapes
- [ ] For each shape in clipboard, call duplicateShape
- [ ] All pasted shapes offset by 20px
- [ ] Auto-select pasted shapes
- [ ] Show toast: "Pasted X shapes"

**🧪 TEST 9.2c:**
```
✅ PASS: Copy 3 shapes → Press Cmd+V
         → 3 new shapes appear offset by 20px
         → New shapes auto-selected (blue borders)
         → Toast "Pasted 3 shapes"
         → Check Firestore → 6 total shapes
❌ FAIL: Paste doesn't work or shapes not created
```

**Sub-task 9.2d: Handle edge cases**
- [ ] Paste with empty clipboard → show toast "Nothing to paste"
- [ ] Paste multiple times → creates new copies each time
- [ ] Clipboard persists during session (lost on refresh is OK)

**🧪 TEST 9.2d:**
```
✅ PASS: Press Cmd+V without copying → Toast "Nothing to paste"
         Copy shape → Paste → Paste again → Two sets of copies created
❌ FAIL: Edge cases not handled
```

#### 9.3 Add Visual Feedback (0.5 hours)

**Sub-task 9.3a: Add toasts for all keyboard actions**
- [ ] Delete → "Deleted X shape(s)"
- [ ] Duplicate → "Duplicated X shape(s)"
- [ ] Copy → "Copied X shapes"
- [ ] Paste → "Pasted X shapes"
- [ ] Group → "Grouped X shapes"
- [ ] Ungroup → "Ungrouped X shapes"
- [ ] Nudge → "Moved shapes" (optional)
- [ ] Z-index → "Brought forward", etc.

**🧪 TEST 9.3a:**
```
✅ PASS: Test each keyboard shortcut → Toast appears with correct message
         → Toast disappears after 3-4 seconds
❌ FAIL: Some toasts missing or messages wrong
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Basic Shortcuts
- [ ] User A selects rectangle, presses Delete → shape deleted
- [ ] User A selects rectangle, presses Cmd+D → shape duplicated
- [ ] User A selects 3 shapes, presses Delete → all deleted
- [ ] Toast appears for each action
- [ ] User B sees all changes in real-time

#### Copy/Paste
- [ ] User A selects blue rectangle, presses Cmd+C
- [ ] Toast: "Copied 1 shape"
- [ ] User A presses Cmd+V → duplicate appears 20px offset
- [ ] Toast: "Pasted 1 shape"
- [ ] Pasted shape auto-selected
- [ ] User A selects 3 shapes, Cmd+C, Cmd+V → 3 pasted shapes
- [ ] User B sees pasted shapes in real-time

#### Grouping Shortcuts
- [ ] User A selects 3 shapes, presses Cmd+G → grouped
- [ ] Toast: "Grouped 3 shapes"
- [ ] User A presses Cmd+Shift+G → ungrouped
- [ ] User B sees grouping changes

#### Nudging
- [ ] User A selects shape, presses Arrow Right → moves 10px right
- [ ] User A holds Shift, presses Arrow Down → moves 1px down (fine control)
- [ ] Works for multiple selected shapes (all move together)
- [ ] User B sees movements in real-time

#### Z-Index Shortcuts
- [ ] User A selects shape, presses Cmd+] → moves forward
- [ ] User A presses Cmd+Shift+] → moves to front
- [ ] User A presses Cmd+[ → moves backward
- [ ] User A presses Cmd+Shift+[ → moves to back
- [ ] User B sees layer changes

#### Selection Shortcuts
- [ ] User A presses Cmd+A → all shapes selected
- [ ] User A presses Escape → selection cleared

#### Input Field Handling
- [ ] User A double-clicks text to edit
- [ ] User A types text, presses Delete key → deletes character (NOT shape)
- [ ] Shortcuts correctly ignored when typing in inputs

**Performance:**
- [ ] Keyboard responses feel instant (<16ms)
- [ ] No lag even with 50+ shapes

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR #10 (PART 3)

---

# 🎯 PART 3: AI Integration (PRs #10-12, ~15 hours)

Natural language interface to all canvas features.

---

## PR #10: AI Service Layer + Tool Definitions
**Branch:** `feature/ai-service`  
**Goal:** Build AI service with 15 OpenAI function tools  
**Time Estimate:** 6 hours

### Why This PR?
- **CRITICAL for rubric:** AI worth 25 points (25% of total)
- Foundation for all AI functionality
- Must include layout commands for full points

### Prerequisites
- ✅ Part 2 complete (all manual features working)
- ✅ OpenAI API key obtained
- ✅ CanvasService has all methods (create, move, resize, rotate, delete, etc.)

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-10-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 10.1 Install OpenAI SDK (0.5 hours)

**Sub-task 10.1a: Install package and setup env**
- [ ] Run `npm install openai` in app directory
- [ ] Create `.env` file (if not exists) with `VITE_OPENAI_API_KEY=your-key-here`
- [ ] Add `.env` to `.gitignore`
- [ ] Create `.env.example` with `VITE_OPENAI_API_KEY=sk-...`

**🧪 TEST 10.1a:**
```
✅ PASS: Check package.json → openai listed in dependencies
         .env file exists with API key
         .env.example exists with placeholder
❌ FAIL: Package not installed or env not configured
```

**Sub-task 10.1b: Test basic OpenAI connection**
- [ ] Create test file to import OpenAI
- [ ] Initialize client with API key from env
- [ ] Make simple API call to verify connection

**🧪 TEST 10.1b:**
```
✅ PASS: Console → Test OpenAI call → Receives response (no auth error)
❌ FAIL: Auth error or connection fails
```

#### 10.2 Create AI Service Architecture (2 hours)

**Sub-task 10.2a: Create AIService file and initialize client**
- [ ] Create `src/services/aiService.ts`
- [ ] Import OpenAI SDK
- [ ] Initialize OpenAI client with `import.meta.env.VITE_OPENAI_API_KEY`
- [ ] Export aiService singleton

**🧪 TEST 10.2a:**
```
✅ PASS: Import aiService in another file → No errors
         TypeScript compiles successfully
❌ FAIL: Import errors or compilation fails
```

**Sub-task 10.2b: Define interfaces**
- [ ] Define `CommandResult` interface: `{ success: boolean, message: string, toolCalls?: any[] }`
- [ ] Define `ToolCall` interface for OpenAI function calls
- [ ] Export interfaces

**🧪 TEST 10.2b:**
```
✅ PASS: TypeScript recognizes CommandResult type
         Can create test CommandResult object
❌ FAIL: Type errors
```

**Sub-task 10.2c: Create executeCommand() skeleton**
- [ ] Add `executeCommand(prompt: string, userId: string): Promise<CommandResult>`
- [ ] Basic structure: accept prompt, return dummy CommandResult
- [ ] Log prompt to console

**🧪 TEST 10.2c:**
```
✅ PASS: Console → aiService.executeCommand('test', 'user-id')
         → Returns { success: true, message: 'test' }
         → Console logs the prompt
❌ FAIL: Method doesn't exist or errors
```

**Sub-task 10.2d: Implement OpenAI API call (no tools yet)**
- [ ] Inside executeCommand(), call OpenAI chat completions
- [ ] Model: 'gpt-4-turbo' or 'gpt-4'
- [ ] Pass prompt as user message
- [ ] Return AI response as message

**🧪 TEST 10.2d:**
```
✅ PASS: Call executeCommand('What is 2+2?')
         → Returns CommandResult with AI's answer
         → No errors thrown
❌ FAIL: API call fails or returns error
```

**Sub-task 10.2e: Add error handling**
- [ ] Wrap API call in try/catch
- [ ] On error, return `{ success: false, message: 'Error: ...' }`
- [ ] Log errors to console

**🧪 TEST 10.2e:**
```
✅ PASS: Test with invalid API key → Returns error CommandResult (doesn't crash)
❌ FAIL: Unhandled error crashes app
```

#### 10.3 Define 15 OpenAI Tools (2.5 hours)

**Sub-task 10.3a: Create getToolDefinitions() function**
- [ ] Add `getToolDefinitions()` function
- [ ] Returns array of OpenAI function tool definitions
- [ ] Start with 1-2 simple tools to test structure

**🧪 TEST 10.3a:**
```
✅ PASS: Call getToolDefinitions() → Returns array
         Array has valid OpenAI tool format
❌ FAIL: Function doesn't exist or wrong format
```

**Sub-task 10.3b: Add Creation Tools (4 tools)**
- [ ] `createRectangle`: params (x, y, width, height, color)
- [ ] `createCircle`: params (x, y, radius, color)
- [ ] `createTriangle`: params (x, y, width, height, color)
- [ ] `createText`: params (text, x, y, fontSize, color)
- [ ] Each with proper JSON schema for parameters

**🧪 TEST 10.3b:**
```
✅ PASS: getToolDefinitions() → Contains 4 creation tools
         Each tool has name, description, parameters schema
❌ FAIL: Tools missing or invalid schema
```

**Sub-task 10.3c: Add Manipulation Tools (5 tools)**
- [ ] `moveShape`: params (shapeId, x, y)
- [ ] `resizeShape`: params (shapeId, width, height)
- [ ] `rotateShape`: params (shapeId, rotation)
- [ ] `duplicateShape`: params (shapeId)
- [ ] `deleteShape`: params (shapeId)

**🧪 TEST 10.3c:**
```
✅ PASS: getToolDefinitions() → Contains 9 total tools (4 creation + 5 manipulation)
❌ FAIL: Count wrong or schemas invalid
```

**Sub-task 10.3d: Add remaining tools (6 tools)**
- [ ] `groupShapes`: params (shapeIds array)
- [ ] `alignShapes`: params (shapeIds array, alignment type)
- [ ] `arrangeShapesInRow`: params (shapeIds array, spacing) ⭐ CRITICAL
- [ ] `bringToFront`: params (shapeId)
- [ ] `addComment`: params (shapeId, text) (optional if no comments PR)
- [ ] `getCanvasState`: no params (returns all shapes)

**🧪 TEST 10.3d:**
```
✅ PASS: getToolDefinitions() → Contains 15 total tools
         All tools have valid OpenAI function format
         arrangeShapesInRow tool exists (CRITICAL for rubric)
❌ FAIL: Missing tools or arrangeShapesInRow missing
```

#### 10.4 Implement Tool Execution Router (1 hour)

**Sub-task 10.4a: Add tools to OpenAI call**
- [ ] In executeCommand(), pass tools parameter to OpenAI
- [ ] `tools: getToolDefinitions()`
- [ ] Enable function calling in API call

**🧪 TEST 10.4a:**
```
✅ PASS: Call executeCommand('Create a blue rectangle')
         → OpenAI response includes tool_calls
         → Console log shows function call data
❌ FAIL: No tool_calls in response
```

**Sub-task 10.4b: Create executeSingleTool() helper**
- [ ] Add `executeSingleTool(toolCall, userId): Promise<any>`
- [ ] Parse tool name and arguments from toolCall
- [ ] Add switch statement for tool names
- [ ] Implement first 2-3 tools to test

**🧪 TEST 10.4b:**
```
✅ PASS: Mock tool call → executeSingleTool({ name: 'createRectangle', arguments: {...} })
         → Calls canvasService.createShape()
         → Returns result
❌ FAIL: Tool not executed or errors
```

**Sub-task 10.4c: Implement all 15 tool cases**
- [ ] Add case for each of the 15 tools
- [ ] Each case calls appropriate CanvasService method
- [ ] Handle getCanvasState specially (fetches data, doesn't modify)
- [ ] Return result for each tool

**🧪 TEST 10.4c:**
```
✅ PASS: Test each tool type manually → All 15 tools execute without errors
❌ FAIL: Some tools missing or throw errors
```

**Sub-task 10.4d: Wire up tool execution in executeCommand()**
- [ ] After OpenAI responds with tool_calls
- [ ] Loop through each tool_call
- [ ] Call executeSingleTool() for each
- [ ] Collect results
- [ ] Generate success message from results

**🧪 TEST 10.4d:**
```
✅ PASS: executeCommand('Create a blue rectangle at 500, 500')
         → Tool executed
         → Rectangle appears in Firestore
         → Returns success message
❌ FAIL: Tool not executed or shape not created
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test AI service directly (no UI yet):**

#### Creation Commands
- [ ] Call `executeCommand("Create a blue rectangle at (500, 500)")` 
- [ ] Verify shape appears on canvas
- [ ] Call `executeCommand("Create a circle at center with radius 50")`
- [ ] Verify circle appears
- [ ] Call `executeCommand("Add text 'Hello' at (1000, 1000)")`
- [ ] Verify text appears

#### Manipulation Commands
- [ ] Create blue rectangle
- [ ] Call `executeCommand("Move the blue rectangle to (1000, 1000)")`
- [ ] Verify shape moves
- [ ] Call `executeCommand("Make it twice as big")`
- [ ] Verify resize
- [ ] Call `executeCommand("Rotate it 45 degrees")`
- [ ] Verify rotation

#### Layout Command (CRITICAL)
- [ ] Create 3 rectangles
- [ ] Call `executeCommand("Arrange these shapes in a horizontal row")`
- [ ] Verify shapes arranged with even spacing
- [ ] This command MUST work for rubric

#### Error Handling
- [ ] Call with invalid command → returns error message
- [ ] Call manipulation without getCanvasState → AI should call it first
- [ ] API key missing → graceful error

**Performance:**
- [ ] Single-step commands < 2s latency
- [ ] Multi-step commands < 5s latency

**✅ CHECKPOINT:** All AI tools working via direct service calls → Move to PR #11

---

## PR #11: System Prompt + Context Awareness
**Branch:** `feature/ai-prompt`  
**Goal:** Craft comprehensive system prompt for AI accuracy  
**Time Estimate:** 4 hours

### Why This PR?
- System prompt directly impacts AI accuracy (90%+ target)
- Enables context awareness ("the blue rectangle")
- Teaches AI complex commands (login form, grid)

### Prerequisites
- ✅ PR #10 complete (all tools working)
- ✅ AI service can execute commands
- ✅ Ready to add sophisticated prompting

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-11-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 11.1 Create AI Prompt Utilities (1 hour)

**Sub-task 11.1a: Create prompt utils file**
- [ ] Create `src/utils/aiPrompts.ts`
- [ ] Export `getSystemPrompt(shapes: Shape[]): string` function
- [ ] Return basic system prompt string (placeholder initially)

**🧪 TEST 11.1a:**
```
✅ PASS: Import getSystemPrompt → No errors
         Call getSystemPrompt([]) → Returns string
❌ FAIL: Import errors or function doesn't exist
```

**Sub-task 11.1b: Add canvas state formatting**
- [ ] In getSystemPrompt, take first 20 shapes from array
- [ ] Format each shape: "Rectangle at (x,y), size WxH, color: #xxx, id: ..."
- [ ] Include in system prompt section "Current Canvas State:"

**🧪 TEST 11.1b:**
```
✅ PASS: Create 5 shapes → Call getSystemPrompt(shapes)
         → Returned prompt includes "Current Canvas State:"
         → Lists all 5 shapes with details
❌ FAIL: Canvas state not included or formatting wrong
```

#### 11.2 Write Comprehensive System Prompt (2 hours)

**Sub-task 11.2a: Add critical rules and coordinate system**
- [ ] CRITICAL RULE: "ALWAYS call getCanvasState() FIRST before manipulating existing shapes"
- [ ] Canvas coordinate system: (0,0 = top-left, 5000×5000 max)
- [ ] Position helpers: center=(2500,2500), corners, edges
- [ ] Default sizes: rectangles 100×100, circles radius=50, fontSize=16

**🧪 TEST 11.2a:**
```
✅ PASS: getSystemPrompt() includes "ALWAYS call getCanvasState() FIRST"
         Includes coordinate system explanation
❌ FAIL: Critical rules missing
```

**Sub-task 11.2b: Add color codes and shape identification**
- [ ] Color codes: red=#ef4444, blue=#3b82f6, green=#10b981, yellow=#f59e0b
- [ ] Shape identification rules: "the blue rectangle" → find by type + color
- [ ] If multiple matches → pick most recent (highest createdAt)

**🧪 TEST 11.2b:**
```
✅ PASS: Prompt includes all color codes
         Includes shape identification instructions
❌ FAIL: Missing color codes or identification rules
```

**Sub-task 11.2c: Add complex command examples**
- [ ] Login form example: 2 labels + 2 input rectangles + 1 button
- [ ] Grid example: N×M grid with calculated positions
- [ ] **CRITICAL:** Layout command example: "arrange in a horizontal row" → arrangeShapesInRow tool
- [ ] Include expected tool calls for each example

**🧪 TEST 11.2c:**
```
✅ PASS: Prompt includes login form example
         Includes arrangeShapesInRow example (CRITICAL for rubric)
         All examples show tool calls
❌ FAIL: arrangeShapesInRow example missing
```

**Sub-task 11.2d: Add tool examples for all 15 tools**
- [ ] For each of 15 tools, add usage example
- [ ] Show example command → expected tool call
- [ ] Include context awareness examples

**🧪 TEST 11.2d:**
```
✅ PASS: Prompt includes examples for all 15 tools
         Examples show proper JSON format for parameters
❌ FAIL: Some tool examples missing
```

#### 11.3 Integrate Prompt into AI Service (0.5 hours)

**Sub-task 11.3a: Wire up getSystemPrompt in AIService**
- [ ] In executeCommand(), fetch current canvas shapes
- [ ] Call `getSystemPrompt(shapes)` to generate system message
- [ ] Pass as messages array: `[{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]`

**🧪 TEST 11.3a:**
```
✅ PASS: Execute AI command → Console log shows system prompt being used
         System prompt includes current canvas state
❌ FAIL: System prompt not passed to OpenAI
```

#### 11.4 Test Context Awareness (0.5 hours)

**Sub-task 11.4a: Test shape identification**
- [ ] Create blue rectangle and red circle
- [ ] Command: "Move the blue rectangle to center"
- [ ] Verify AI calls getCanvasState, identifies correct shape, calls moveShape

**🧪 TEST 11.4a:**
```
✅ PASS: AI identifies "the blue rectangle" correctly
         Moves correct shape
         → Check Firestore → Blue rectangle at center position
❌ FAIL: AI confused or moves wrong shape
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test context-aware commands:**

#### Shape Identification
- [ ] Create blue rectangle and red circle
- [ ] Command: "Move the blue rectangle to center"
- [ ] Verify: AI calls getCanvasState, identifies blue rectangle, moves it
- [ ] Command: "Make the red circle bigger"
- [ ] Verify: AI identifies red circle, resizes it

#### Vague References
- [ ] Create 3 rectangles
- [ ] Command: "Delete that rectangle"
- [ ] Verify: AI picks most recent rectangle
- [ ] Command: "Rotate it 45 degrees"
- [ ] Verify: AI rotates the last created/manipulated shape

#### Multi-Step Commands
- [ ] Command: "Create a login form"
- [ ] Verify: AI creates 6 elements:
  - 2 text labels ("Username", "Password")
  - 2 white input rectangles
  - 1 text label ("Submit")
  - 1 blue button rectangle
- [ ] All positioned correctly

#### Grid Commands
- [ ] Command: "Make a 3x3 grid of red squares"
- [ ] Verify: AI creates 9 red rectangles in grid pattern
- [ ] Even spacing between all squares

#### Layout Commands (CRITICAL)
- [ ] Create 4 random rectangles
- [ ] Command: "Arrange these shapes in a horizontal row"
- [ ] Verify: AI calls getCanvasState, identifies shapes, calls arrangeShapesInRow
- [ ] Shapes arranged with even spacing

#### Grouping Commands
- [ ] Create 3 blue rectangles
- [ ] Command: "Group the blue shapes"
- [ ] Verify: AI identifies all blue shapes, calls groupShapes

#### Alignment Commands
- [ ] Create 4 rectangles at random positions
- [ ] Command: "Align these to the left"
- [ ] Verify: AI calls alignShapes with alignment="left"

**Accuracy Testing:**
- [ ] Test 20 diverse commands
- [ ] Track success rate (target: 90%+ accuracy)
- [ ] Document any failures for prompt iteration

**✅ CHECKPOINT:** 90%+ command accuracy → Deploy → Move to PR #12

---

## PR #12: AI Chat Interface (Bottom Drawer UI)
**Branch:** `feature/ai-chat-ui`  
**Goal:** Build chat drawer for AI interaction  
**Time Estimate:** 5 hours

### Why This PR?
- User-facing AI interface
- Completes AI integration
- Professional chat experience

### Prerequisites
- ✅ PR #11 complete (AI working with high accuracy)
- ✅ AI service returns formatted messages
- ✅ Ready to build UI

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-12-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 12.1 Create Chat UI Components (2 hours)

**Sub-task 12.1a: Create component files and Message interface**
- [ ] Create `src/components/AI/AIChat.tsx` (main chat drawer)
- [ ] Define `Message` interface: `{ id: string, role: 'user' | 'ai', content: string, timestamp: number, status?: 'success' | 'error' }`
- [ ] Export interface

**🧪 TEST 12.1a:**
```
✅ PASS: Files exist, TypeScript compiles
         Can create test Message object
❌ FAIL: Import errors or type errors
```

**Sub-task 12.1b: Build AIChat component skeleton**
- [ ] State: `messages: Message[]`, `input: string`, `isProcessing: boolean`, `isOpen: boolean`
- [ ] Render basic div with "AI Chat" header
- [ ] Render at bottom of screen

**🧪 TEST 12.1b:**
```
✅ PASS: AIChat component renders on page
         Positioned at bottom of viewport
❌ FAIL: Component doesn't render or position wrong
```

#### 12.2 Build Chat Drawer Layout (1.5 hours)

**Sub-task 12.2a: Create collapsible drawer**
- [ ] Header: "AI Assistant" title + minimize button
- [ ] Collapsed height: 50px, Expanded height: 300px
- [ ] Toggle isOpen on minimize click
- [ ] Slide animation: 300ms ease-out transition

**🧪 TEST 12.2a:**
```
✅ PASS: Drawer starts collapsed (50px height)
         Click minimize button → Drawer expands to 300px with animation
         Click again → Collapses smoothly
❌ FAIL: Animation broken or doesn't toggle
```

**Sub-task 12.2b: Add message area**
- [ ] Scrollable message container (between header and input)
- [ ] Auto-scroll to bottom when new message added
- [ ] Shows last 10 messages visibly

**🧪 TEST 12.2b:**
```
✅ PASS: Add 15 test messages → Scroll container scrollable
         Automatically scrolled to bottom message
❌ FAIL: Not scrollable or doesn't auto-scroll
```

**Sub-task 12.2c: Add input area**
- [ ] Textarea for user input
- [ ] Send button (blue, right side)
- [ ] Enter key sends message, Shift+Enter adds newline
- [ ] Input clears after send

**🧪 TEST 12.2c:**
```
✅ PASS: Type in textarea → Text appears
         Press Enter → Calls send handler
         Input clears after send
❌ FAIL: Input doesn't work or Enter doesn't send
```

#### 12.3 Implement Chat Functionality (1 hour)

**Sub-task 12.3a: Implement send message handler**
- [ ] On send: add user message to messages array
- [ ] Set isProcessing = true
- [ ] Call `aiService.executeCommand(input, userId)`
- [ ] Add AI response to messages array
- [ ] Set isProcessing = false

**🧪 TEST 12.3a:**
```
✅ PASS: Type "Create a blue rectangle" → Click Send
         → User message appears in chat
         → "⚡ AI is thinking..." appears
         → AI response appears after 1-2 seconds
         → Blue rectangle appears on canvas
❌ FAIL: Message not sent or AI doesn't respond
```

**Sub-task 12.3b: Add loading and error states**
- [ ] While isProcessing, show "⚡ AI is thinking..."
- [ ] On error, add error message with red icon
- [ ] Handle API errors gracefully

**🧪 TEST 12.3b:**
```
✅ PASS: Send message → Loading indicator shows
         Test with invalid command → Error message appears (doesn't crash)
❌ FAIL: No loading state or errors crash app
```

#### 12.4 Style Chat Interface (0.5 hours)

**Sub-task 12.4a: Style messages**
- [ ] User messages: right-aligned, blue background (#3b82f6), white text
- [ ] AI messages: left-aligned, gray background (#f3f4f6), black text
- [ ] Success icon (✓) for successful AI responses
- [ ] Error icon (⚠️) for error messages
- [ ] Timestamps: "2 min ago" format

**🧪 TEST 12.4a:**
```
✅ PASS: Send message → User message appears right-aligned with blue background
         AI response appears left-aligned with gray background
         Timestamp shows relative time
❌ FAIL: Styling broken or messages not differentiated
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Basic Chat
- [ ] User A opens chat drawer → slides up from bottom
- [ ] User A types "Create a blue rectangle" → sends
- [ ] Message appears in chat (right-aligned)
- [ ] "⚡ AI is thinking..." appears
- [ ] AI response appears: "✓ Created 1 rectangle"
- [ ] Blue rectangle appears on canvas
- [ ] User B sees rectangle appear in real-time

#### Multi-User AI
- [ ] User A: "Create a red circle"
- [ ] User B: "Create a green triangle" (simultaneous)
- [ ] Both commands execute successfully
- [ ] Both users see both shapes appear
- [ ] No conflicts or errors

#### Complex Commands
- [ ] User A: "Create a login form"
- [ ] AI responds: "✓ Created 6 elements"
- [ ] Login form appears on canvas (2 labels, 2 inputs, 1 button)
- [ ] User B sees entire form in real-time

#### Layout Commands
- [ ] User A creates 4 rectangles manually
- [ ] User A: "Arrange these shapes in a horizontal row"
- [ ] AI responds: "✓ Arranged 4 shapes in row"
- [ ] Shapes rearrange with even spacing
- [ ] User B sees layout change in real-time

#### Error Handling
- [ ] User A: "Gibberish nonsense command"
- [ ] AI responds: "⚠️ I couldn't understand that command"
- [ ] No errors thrown
- [ ] User A: "Move the purple shape" (no purple shape exists)
- [ ] AI responds: "⚠️ I couldn't find a purple shape"

#### Chat Persistence
- [ ] Chat history persists during session
- [ ] Can scroll through past messages
- [ ] Can minimize/maximize drawer
- [ ] Can close and reopen drawer

**Performance:**
- [ ] Single commands < 2s response time
- [ ] Multi-step commands < 5s response time
- [ ] Chat UI feels responsive
- [ ] No lag in message rendering

**✅ CHECKPOINT:** All AI features working end-to-end → Deploy → **END OF PART 3**

---

# 🎯 PART 4: Testing, Polish & Deployment (PRs #13-14, ~8 hours)

Final testing, bug fixes, demo video, and deployment.

---

## PR #13: Collaborative Comments (Optional - Tier 3 Feature)
**Branch:** `feature/comments`  
**Goal:** Add collaborative comments on shapes  
**Time Estimate:** 5 hours (OPTIONAL - skip if time tight)

### Why This PR?
- **Tier 3 rubric feature:** Worth 3 points
- Unique collaborative value
- Can be simplified or skipped if time constrained

### Prerequisites
- ✅ Part 3 complete (AI working)
- ✅ All other features stable
- ✅ Sufficient time remaining

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-13-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding
- [ ] **SKIP IF TIME TIGHT** - other features are higher priority

### Task Breakdown

#### 13.1 Add Comments Collection to Firestore (0.5 hours)
- [ ] Define `canvases/main/comments` collection
- [ ] Fields: `id`, `shapeId`, `userId`, `username`, `text`, `x`, `y`, `createdAt`, `resolved`, `replies[]`

#### 13.2 Extend CanvasService for Comments (1.5 hours)
- [ ] Add `addComment(shapeId, text, userId, username)` method
- [ ] Add `resolveComment(commentId)` method
- [ ] Add `addReply(commentId, userId, username, text)` method
- [ ] Add `subscribeToComments(callback)` for real-time updates
- [ ] Add `deleteComment(commentId)` method

**Code Reference:** See PRD.md lines 1199-1273 for service methods

#### 13.3 Build Comment UI (2 hours)
- [ ] Comment icon (💬) appears on shapes with comments
- [ ] Badge shows comment count: "💬 3"
- [ ] Click icon → opens comment panel
- [ ] Panel positioned near shape (floating)
- [ ] Panel dimensions: 300px wide, scrollable
- [ ] Show all comments and replies in thread
- [ ] Input field to add new comment
- [ ] Reply button under each comment
- [ ] Resolve button (marks comment as resolved)

#### 13.4 Render Comment Indicators (1 hour)
- [ ] Konva `<Circle>` for comment icon badge
- [ ] Position at top-right of shape
- [ ] Blue background, white icon
- [ ] Count badge if multiple comments
- [ ] Click handler opens comment panel

**Code Reference:** See PRD.md lines 1329-1381 for rendering

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Basic Comments
- [ ] User A creates rectangle
- [ ] User A clicks "Add Comment" → panel opens
- [ ] User A types "This needs to be bigger" → sends
- [ ] Comment icon appears on rectangle
- [ ] User B sees comment icon appear
- [ ] User B clicks icon → reads comment

#### Comment Threads
- [ ] User B clicks "Reply"
- [ ] User B types "I agree" → sends reply
- [ ] User A sees reply appear in real-time
- [ ] Thread shows both messages with timestamps

#### Resolve Comments
- [ ] User A clicks "Resolve" on comment
- [ ] Comment disappears from panel (filtered)
- [ ] "Show resolved (1)" toggle appears
- [ ] Toggle shows resolved comments with strikethrough

**✅ CHECKPOINT:** Comments working OR SKIPPED if time tight → Deploy → Move to PR #14

---

## PR #14: Integration Testing, Demo Video & Final Deployment
**Branch:** `release/phase2-final`  
**Goal:** Comprehensive testing, demo video, production deployment  
**Time Estimate:** 8 hours

### Why This PR?
- **CRITICAL:** Demo video is pass/fail (missing = -10 points)
- Final QA before submission
- Ensures production readiness

### Prerequisites
- ✅ All features from Parts 1-3 complete
- ✅ Application stable on staging
- ✅ Ready to record and deploy

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-14-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before final testing

### Task Breakdown

#### 14.1 Comprehensive Integration Testing (3 hours)

**Sub-task 14.1a: Multi-user real-time sync test**
- [ ] Open 3 browsers (Chrome, Chrome Incognito, Firefox)
- [ ] Log in as 3 different users
- [ ] User A creates rectangle → User B and C see it instantly
- [ ] User B moves shape → User A and C see movement in real-time
- [ ] All cursors visible and smooth (20-30 FPS)

**🧪 TEST 14.1a:**
```
✅ PASS: All 3 users see shapes appear instantly (<100ms)
         Cursors move smoothly for all users
         Presence list shows all 3 users online
❌ FAIL: Lag > 100ms or sync issues
```

**Sub-task 14.1b: Test all manual features**
- [ ] Create all 4 shape types (rectangle, circle, triangle, text)
- [ ] Resize, rotate each shape type
- [ ] Multi-select (shift-click and marquee)
- [ ] Group 3 shapes, ungroup
- [ ] Align shapes (test left, center, top)
- [ ] Z-index (bring to front, send to back)
- [ ] Keyboard shortcuts (Delete, Cmd+D, Cmd+G, arrows)
- [ ] Copy/paste
- [ ] All sync in real-time to other users

**🧪 TEST 14.1b:**
```
✅ PASS: All features work without errors
         All changes sync to all users in <100ms
❌ FAIL: Any feature broken or sync issues
```

**Sub-task 14.1c: Test AI commands (CRITICAL)**
- [ ] Simple creation: "Create a blue rectangle"
- [ ] Manipulation: "Move it to center", "Make it bigger", "Rotate 45 degrees"
- [ ] **CRITICAL:** "Arrange these shapes in a horizontal row"
- [ ] Complex: "Create a login form"
- [ ] Grid: "Make a 3x3 grid of red squares"
- [ ] Grouping: "Group the blue shapes"
- [ ] Track success rate (should be 90%+)

**🧪 TEST 14.1c:**
```
✅ PASS: All AI commands execute successfully
         arrangeShapesInRow command works (CRITICAL for rubric)
         Shapes appear on canvas correctly
         Success rate ≥ 90%
❌ FAIL: arrangeShapesInRow broken or success rate < 90%
```

**Sub-task 14.1d: Performance testing**
- [ ] Create 50 shapes → Check FPS (should stay at 60)
- [ ] Create 100+ shapes → Check performance (should be acceptable)
- [ ] 5 users simultaneous → No degradation

**🧪 TEST 14.1d:**
```
✅ PASS: 50 shapes → 60 FPS maintained
         100+ shapes → Usable performance
         5 users → No lag or crashes
❌ FAIL: Performance degrades significantly
```

#### 14.2 Bug Fixes & Polish (1.5 hours)

**Sub-task 14.2a: Fix discovered bugs**
- [ ] Document all bugs found in testing
- [ ] Fix critical bugs (anything that breaks core functionality)
- [ ] Fix visual bugs (misalignments, styling issues)

**🧪 TEST 14.2a:**
```
✅ PASS: All critical bugs fixed
         All features working smoothly
❌ FAIL: Critical bugs remain
```

**Sub-task 14.2b: Polish UI and UX**
- [ ] Add missing loading states
- [ ] Improve error messages (make them user-friendly)
- [ ] Fix any styling inconsistencies
- [ ] Add helpful tooltips

**🧪 TEST 14.2b:**
```
✅ PASS: UI feels polished and professional
         Error messages are clear
         Loading states visible
❌ FAIL: UI feels rough or confusing
```

#### 14.3 Record Demo Video (2 hours)

**CRITICAL: Missing demo = -10 points**

**Sub-task 14.3a: Script and plan video**
- [ ] Write narration script covering all 4 sections
- [ ] Plan what to show in each section (2-3 min total runtime)
- [ ] Prepare demo canvas with test shapes
- [ ] Test screen recording software (OBS, Loom, or QuickTime)

**🧪 TEST 14.3a:**
```
✅ PASS: Script complete covering all required sections
         Recording software tested and working
❌ FAIL: Missing script or can't record
```

**Sub-task 14.3b: Record Section 1 - Real-Time Collaboration (1 min)**
- [ ] Show 2 browsers side-by-side
- [ ] User A creates shape → User B sees instantly
- [ ] User A resizes/rotates → User B sees in real-time
- [ ] Show cursors moving smoothly
- [ ] Show multi-select and grouping syncing

**🧪 TEST 14.3b:**
```
✅ PASS: Recording shows real-time sync clearly
         Both users visible
         All sync < 100ms visible
❌ FAIL: Sync not visible or looks laggy
```

**Sub-task 14.3c: Record Section 2 - AI Commands (1.5 min) ⭐ CRITICAL**
- [ ] Simple: "Create a blue rectangle in the center" → Works
- [ ] Manipulation: "Make it twice as big" → Works
- [ ] **CRITICAL:** "Arrange these shapes in a horizontal row" → Works perfectly
- [ ] Complex: "Create a login form" → 6 elements appear
- [ ] Show AI chat interface and responses
- [ ] **arrangeShapesInRow MUST work for full AI points**

**🧪 TEST 14.3c:**
```
✅ PASS: All AI commands demonstrated successfully
         arrangeShapesInRow shown working (CRITICAL!)
         Video clearly shows AI creating shapes
❌ FAIL: arrangeShapesInRow not shown or broken
```

**Sub-task 14.3d: Record Section 3 - Advanced Features (1 min)**
- [ ] Multi-select with shift-click
- [ ] Marquee selection
- [ ] Keyboard shortcuts (Delete, Cmd+D, arrows)
- [ ] Copy/paste
- [ ] Z-index (bring to front)

**🧪 TEST 14.3d:**
```
✅ PASS: All features demonstrated clearly
         Shortcuts shown on screen
❌ FAIL: Features not clear or missing
```

**Sub-task 14.3e: Edit and export final video**
- [ ] Combine all sections with transitions
- [ ] Add title card and section labels
- [ ] Add on-screen text highlighting key features
- [ ] Ensure audio is clear (no background noise)
- [ ] Export at 1080p, 3-5 minutes total
- [ ] Upload to YouTube or Vimeo

**🧪 TEST 14.3e:**
```
✅ PASS: Video is 3-5 minutes, 1080p quality
         Audio clear, all sections included
         arrangeShapesInRow clearly demonstrated
         Uploaded with public link
❌ FAIL: Video missing sections or poor quality
```

#### 14.4 Production Deployment (1 hour)

**Sub-task 14.4a: Build and test locally**
- [ ] Run `npm run build` in app directory
- [ ] Test built files with `npm run preview`
- [ ] Verify all features work in production build

**🧪 TEST 14.4a:**
```
✅ PASS: Build completes without errors
         Preview shows all features working
❌ FAIL: Build errors or features broken in build
```

**Sub-task 14.4b: Deploy to Vercel**
- [ ] Deploy dist folder to Vercel
- [ ] Note production URL
- [ ] Add production URL to Firebase authorized domains
- [ ] Deploy Firestore and RTDB security rules to production

**🧪 TEST 14.4b:**
```
✅ PASS: App loads at production URL
         Can create account and login
         Firebase connected (no CORS errors)
❌ FAIL: Deploy fails or Firebase not connected
```

**Sub-task 14.4c: Production smoke test**
- [ ] Open production URL in 3 browsers
- [ ] Test real-time sync works
- [ ] Test AI commands work (especially arrangeShapesInRow)
- [ ] Test all manual features

**🧪 TEST 14.4c:**
```
✅ PASS: All features work on production
         Real-time sync < 100ms
         AI commands execute successfully
         5+ concurrent users work
❌ FAIL: Any critical feature broken in production
```

#### 14.5 Documentation Updates (0.5 hours)

**Sub-task 14.5a: Update README.md**
- [ ] Add production URL link at top
- [ ] Add demo video link (YouTube/Vimeo embed)
- [ ] Update feature list with all Phase 2 features
- [ ] Add setup instructions for local development
- [ ] List tech stack (React, Firebase, OpenAI, Konva)

**🧪 TEST 14.5a:**
```
✅ PASS: README has production URL, video link, complete feature list
         Setup instructions are clear
❌ FAIL: Missing information or broken links
```

### Final Gatekeeper Testing (Production)

**Test on deployed URL:**

#### Core Functionality
- [ ] Sign up and log in works
- [ ] All shape types can be created
- [ ] Resize, rotate, text editing work
- [ ] Multi-select, grouping work
- [ ] Alignment and z-index work
- [ ] Keyboard shortcuts work
- [ ] Copy/paste works
- [ ] Delete works

#### AI Functionality
- [ ] Chat interface opens
- [ ] All command types work
- [ ] Layout command works
- [ ] Complex commands work
- [ ] Context awareness works
- [ ] Error handling works

#### Real-Time Collaboration
- [ ] Cursors sync smoothly
- [ ] Presence list accurate
- [ ] All operations sync <100ms
- [ ] Comments work (if implemented)

#### Multi-User Production Test
- [ ] 5+ users on production simultaneously
- [ ] All features work
- [ ] No performance degradation
- [ ] No errors or crashes

**Demo Video Checklist:**
- [ ] Video recorded
- [ ] Video edited (3-5 min)
- [ ] All required sections included
- [ ] Audio clear
- [ ] Quality 1080p
- [ ] Uploaded to YouTube/Vimeo
- [ ] Link added to README

**✅ FINAL CHECKPOINT:** All tests pass + demo video complete → **PHASE 2 COMPLETE!**

---

## 🎯 Phase 2 Success Criteria

### Feature Completeness
- [ ] All core manual features (resize, rotate, text, delete, duplicate)
- [ ] All shape types (rectangles, circles, triangles, text)
- [ ] Multi-select (shift-click + marquee)
- [ ] Grouping and ungrouping
- [ ] Z-index management (4 operations)
- [ ] Alignment tools (6 alignments + distribute)
- [ ] Keyboard shortcuts (15+ shortcuts)
- [ ] Copy/paste
- [ ] Collaborative comments (optional)
- [ ] AI agent with 15 tools
- [ ] AI layout command
- [ ] AI complex commands
- [ ] Demo video (3-5 min)

### Performance Targets
- [ ] Real-time sync <100ms
- [ ] AI single-step <2s
- [ ] AI multi-step <5s
- [ ] 60 FPS with 50+ shapes
- [ ] 5+ concurrent users

### Deployment
- [ ] Deployed to production URL
- [ ] 5+ users tested successfully
- [ ] Demo video uploaded and linked
- [ ] All documentation complete

### Rubric Projection
- Collaborative Infrastructure: 28-30/30 ✅
- Canvas Features: 18-20/20 ✅
- Advanced Features: 13-15/15 ✅
- AI Agent: 23-25/25 ✅
- Technical: 9-10/10 ✅
- Documentation: 5/5 ✅
- AI Dev Log: PASS ✅
- Demo Video: PASS ✅

**Target Score: 96-100 points (A+)**

---

## 📋 Quick Reference

### When You're Ready to Start a PR:

1. **Say:** "I'm ready to begin PR #X"
2. **Agent creates:** `/docs/implementation-guides/PR-X-implementation-guide.md`
3. **You review** the guide and ask questions
4. **You give:** GREEN LIGHT to proceed
5. **Agent implements** the features
6. **You test** using Gatekeeper section
7. **Deploy** to production and verify
8. **Move to next PR**

### Time Budget Overview

- **Part 1 (PRs #1-4):** ~20 hours - Core manual features
- **Part 2 (PRs #5-9):** ~25 hours - Advanced features
- **Part 3 (PRs #10-12):** ~15 hours - AI integration
- **Part 4 (PRs #13-14):** ~8 hours - Testing, video, deploy

**Total: ~68 hours (fits in 72-hour window with 4-hour buffer)**

### Priority Tiers

**P0 (Must Have):**
- All of Part 1 (core features)
- All of Part 2 except PR #13 (comments)
- All of Part 3 (AI is 25% of grade)
- PR #14 (demo video is pass/fail)

**P1 (Nice to Have):**
- PR #13 (comments) - 3 bonus points but can skip if time tight

### Risk Mitigation

If running behind schedule:
1. Simplify or skip PR #13 (comments)
2. Reduce testing time (but still test core flows)
3. Keep demo video simple (no fancy editing)
4. Focus on layout command (critical for AI points)

---

## 🚀 Ready to Begin!

When you're ready to start Part 1, say:

**"I'm ready to begin PR #1"**

And I'll create the detailed implementation guide for Resize & Additional Shape Types!

