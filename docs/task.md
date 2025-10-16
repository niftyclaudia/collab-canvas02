# Task List: Resize Shapes + Additional Shape Types

**Feature:** Resize Shapes + Additional Shape Types (Circles & Triangles)  
**Branch:** `feature/resize-and-shape-types`  
**Estimated Effort:** 5 hours

---

## Task 1: Canvas Service Extensions (1.5 hours)

### 1.1 Add resizeShape() Method
- [ ] Create `resizeShape()` method in `canvasService.ts`
- [ ] Add validation for minimum size (10×10 pixels)
- [ ] Update Firestore document with width, height, and updatedAt timestamp
- [ ] Test: Console run `canvasService.resizeShape()` → Firestore updates

### 1.2 Add Circle Methods
- [ ] Create `createCircle()` method in `canvasService.ts`
- [ ] Add validation for minimum radius (5 pixels)
- [ ] Create Firestore document with type 'circle', x, y, radius, color, timestamps
- [ ] Create `resizeCircle()` method in `canvasService.ts`
- [ ] Add validation for minimum radius in resize method
- [ ] Update Firestore document with x, y, radius, and updatedAt
- [ ] Test: Console run `canvasService.createCircle()` → Circle document created

### 1.3 Add Triangle Method
- [ ] Create `createTriangle()` method in `canvasService.ts`
- [ ] Add validation for minimum size (10×10 pixels)
- [ ] Create Firestore document with type 'triangle', x, y, width, height, color, timestamps
- [ ] Test: Console run `canvasService.createTriangle()` → Triangle document created

---

## Task 2: Resize Handle System (2 hours)

### 2.1 Create ResizeHandles Component
- [ ] Create new file `src/components/Canvas/ResizeHandles.tsx`
- [ ] Define `ResizeHandlesProps` interface with onResize callbacks
- [ ] Create handle positions array for 8-handle system (4 corners + 4 edges)
- [ ] Create handle positions array for circles (4 handles)
- [ ] Implement hover state for handles (8×8px default, 10×10px hover)
- [ ] Style handles (white fill, gray border, blue on hover)
- [ ] Set appropriate cursor styles for each handle type
- [ ] Test: Lock a rectangle → 8 white squares appear at corners and edges

### 2.2 Implement Corner Handle Logic
- [ ] Create `handleCornerDrag()` function for proportional resize
- [ ] Calculate and maintain aspect ratio during corner drag
- [ ] Handle all 4 corner cases (tl, tr, bl, br)
- [ ] Enforce minimum size constraints (10×10 pixels)
- [ ] Test: Drag bottom-right corner → Shape grows proportionally

### 2.3 Implement Edge Handle Logic
- [ ] Create `handleEdgeDrag()` function for single-dimension resize
- [ ] Handle horizontal edges (t, b) - adjust height only
- [ ] Handle vertical edges (l, r) - adjust width only
- [ ] Enforce minimum size constraints
- [ ] Test: Drag right edge → Only width changes

### 2.4 Add Dimension Tooltip
- [ ] Create `DimensionTooltip` component
- [ ] Display "W × H" format for rectangles/triangles
- [ ] Display "Ø Xpx" format for circles
- [ ] Position tooltip centered above shape (30px offset)
- [ ] Style tooltip (black text, white background)
- [ ] Update values in real-time during drag
- [ ] Test: Start dragging handle → Tooltip appears with live dimensions

### 2.5 Connect to CanvasService
- [ ] Create `handleResizeEnd` function
- [ ] Call `resizeCircle()` for circle shapes
- [ ] Call `resizeShape()` for rectangle/triangle shapes
- [ ] Add error handling with toast notifications
- [ ] Test: Resize below 10×10 → Error toast, resize prevented

### 2.6 Integrate ResizeHandles into Canvas
- [ ] Import `ResizeHandles` component in `Canvas.tsx`
- [ ] Show handles only when shape is locked by current user
- [ ] Pass shape data and callbacks to ResizeHandles
- [ ] Test: Lock shape → handles appear, unlock → handles disappear

---

## Task 3: Shape Creation & Rendering (1.5 hours)

### 3.1 Update Toolbar
- [ ] Add Circle button to toolbar in `ColorToolbar.tsx` or appropriate component
- [ ] Add Triangle button to toolbar
- [ ] Update `setActiveTool()` to handle 'circle' and 'triangle' types
- [ ] Add visual highlighting for active tool
- [ ] Test: Click buttons → Button highlights, activeTool updates

### 3.2 Implement Circle Creation
- [ ] Create `handleCircleCreation()` function in `Canvas.tsx`
- [ ] Track mouse down position as circle center
- [ ] Calculate radius based on distance from center during mouse move
- [ ] Show green outline preview during drag
- [ ] Call `canvasService.createCircle()` on mouse up
- [ ] Only create if radius ≥ 5 pixels
- [ ] Test: Drag on canvas → Green preview → Release → Circle persists

### 3.3 Implement Triangle Creation
- [ ] Create `handleTriangleCreation()` function in `Canvas.tsx`
- [ ] Track mouse down position as triangle origin
- [ ] Calculate width/height during mouse move
- [ ] Show green outline preview during drag
- [ ] Call `canvasService.createTriangle()` on mouse up
- [ ] Only create if dimensions ≥ 10×10 pixels
- [ ] Test: Drag on canvas → Green preview → Release → Triangle persists

### 3.4 Add Shape Rendering
- [ ] Create `calculateTrianglePoints()` helper function
- [ ] Add Circle rendering with Konva Circle component
- [ ] Add Triangle rendering with Konva Line component (closed)
- [ ] Ensure draggable property respects lockedBy state
- [ ] Connect onDragEnd handlers
- [ ] Test: Create circle/triangle in Firestore → Renders on canvas

### 3.5 Wire Up Canvas Event Handlers
- [ ] Update `onMouseDown` to check activeTool
- [ ] Route to `handleCircleCreation()` when tool is 'circle'
- [ ] Route to `handleTriangleCreation()` when tool is 'triangle'
- [ ] Ensure existing rectangle creation still works
- [ ] Test: Switch between tools → Correct shape created

---

## Testing Checklist

### Resize Tests
- [ ] User A locks rectangle → 8 handles appear
- [ ] User A drags corner handle → shape resizes proportionally
- [ ] User A drags edge handle → only width or height changes
- [ ] Dimension tooltip shows during drag with correct values
- [ ] User B sees resize in <100ms
- [ ] Trying to resize below 10×10 → error toast, resize prevented
- [ ] Resize works for circles (4 handles, radius adjustment)
- [ ] Resize works for triangles (8 handles)

### Shape Creation Tests
- [ ] Circle: Click tool → drag → green preview → release → circle persists
- [ ] Triangle: Click tool → drag → green preview → release → triangle persists
- [ ] User B sees new shapes in <100ms
- [ ] All shapes can be dragged after creation
- [ ] All shapes can be locked and resized

### Performance Tests
- [ ] 60 FPS maintained during resize (check Chrome DevTools)
- [ ] Works smoothly with 20+ shapes on canvas
- [ ] No lag during real-time sync between users

### Edge Cases
- [ ] Cannot resize below minimum dimensions
- [ ] Handles appear/disappear based on lock state
- [ ] Multiple users can create shapes simultaneously
- [ ] Shape selection works correctly for all types

---

## Success Criteria

- [ ] All shapes can be resized using corner handles (proportional)
- [ ] All shapes can be resized using edge handles (single-dimension)
- [ ] Real-time dimension tooltip appears during drag
- [ ] Circle and Triangle tools work with click-and-drag
- [ ] Minimum size validation enforced (10×10 for rect/triangle, 5px radius for circle)
- [ ] Real-time sync works (<100ms latency between users)
- [ ] Performance maintains 60 FPS with 20+ shapes
- [ ] All manual tests pass with 2+ users

---

## Notes

**Data Model:**
- Shape type: `'rectangle' | 'circle' | 'triangle'`
- Rectangle/Triangle: x, y, width, height
- Circle: x, y, radius
- All shapes: color, createdBy, createdAt, updatedAt, lockedBy

**Visual Design:**
- Handles: 8×8px default, 10×10px hover, white fill, gray border, blue hover
- Tooltip: Black text, white background, 30px above shape
- Preview: Green outline, 2px stroke, no fill

**Out of Scope:**
- Shape rotation (PR #2)
- Multi-selection, copy/paste, undo/redo
- Advanced styling, smart guides
- Shape grouping, export

