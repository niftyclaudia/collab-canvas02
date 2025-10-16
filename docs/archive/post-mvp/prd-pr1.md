# PRD: Resize Shapes (PR #1)

| Field | Value |
|:---|:---|
| **Feature** | Interactive 8-Handle Resize System |
| **Version** | Phase 2, PR #1 |
| **Status** | ✅ COMPLETED |
| **Actual Effort** | 3.5 hours |
| **Branch** | `feature/resize-rectangle` |

---

## 1. Overview

Transform the current visual-only resize handles into **fully functional interactive handles**. Users will be able to click and drag 8 handles (4 corners + 4 edges) to resize existing rectangles with real-time preview and sync.

This PR focuses exclusively on resize functionality - no new shape types.

---

## 2. Goals

1. **8-Handle Resize System** - 4 corner handles (proportional) + 4 edge handles (single dimension)
2. **Real-time Visual Feedback** - Dimension tooltips and smooth preview during drag
3. **Minimum Size Validation** - Enforce 10×10px minimum with error handling
4. **Real-time Sync** - <100ms latency between users
5. **Performance** - Maintain 60 FPS during resize operations

---

## 3. User Stories

### As a User
- I want to **resize rectangles using 8 handles** so I can precisely control width and height
- I want **corner handles to resize proportionally** so aspect ratio is maintained
- I want **edge handles to resize single dimensions** so I can adjust width or height independently
- I want to see **dimension tooltips** while resizing so I can achieve precise sizing
- I want **other users to see my resizes in real-time** so we can collaborate effectively

---

## 4. Data Model Changes

**Path:** `/projects/{projectId}/canvases/main/shapes/{shapeId}`

```typescript
interface Shape {
  id: string;
  type: 'rectangle';  // Only rectangles in this PR
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp; // ← UPDATED: will be modified on resize
  lockedBy?: string | null;
}
```

**No database migrations needed** - `updatedAt` field already exists, just being updated during resize operations.

---

## 5. Files to Modify

### 1. `src/services/canvasService.ts`
**Changes:**
- Add `resizeShape(shapeId: string, width: number, height: number): Promise<void>` method
- Validate minimum dimensions (10×10px)
- Update Firestore with new dimensions + timestamp

### 2. `src/components/Canvas/Canvas.tsx`
**Changes:**
- Add resize state management (activeHandle, resizeStart, previewDimensions)
- Implement 8 interactive resize handles (expand existing 4 visual handles)
- Add handle hover effects (16px → 20px, color change)
- Implement corner resize logic (proportional, maintains aspect ratio)
- Implement edge resize logic (single dimension)
- Add dimension tooltip component (shows during resize)
- Wire up mousedown/mousemove/mouseup handlers for resize
- Call canvasService.resizeShape() on mouseup

### 3. `src/utils/constants.ts`
**Changes:**
- Add `MIN_SHAPE_WIDTH = 10` constant
- Add `MIN_SHAPE_HEIGHT = 10` constant

---

## 6. Implementation Tasks

### Task 1: Add resizeShape to CanvasService
**Estimated time:** 20 minutes

**Implementation:**
```typescript
// src/services/canvasService.ts
async resizeShape(shapeId: string, width: number, height: number): Promise<void> {
  // Validate minimum dimensions
  if (width < 10 || height < 10) {
    throw new Error('Minimum size is 10×10 pixels');
  }
  
  const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
  await updateDoc(shapeRef, {
    width: width,
    height: height,
    updatedAt: serverTimestamp()
  });
}
```

**Test Gate:**
1. Open browser console
2. Run: `await canvasService.resizeShape('shape_id_here', 300, 200)`
3. Verify Firestore document updated with new width/height
4. Verify `updatedAt` timestamp changed
5. Try invalid dimensions (9×9) → should throw error

**Success Criteria:**
- Method exists and is callable
- Firestore updates correctly
- Validation prevents <10px dimensions
- Error thrown for invalid input

---

### Task 2: Resize Handle Rendering
**Estimated time:** 30 minutes

**Implementation:**
- Expand current 4-handle system to 8 handles
- Handle positions: TL, T, TR, R, BR, B, BL, L
- Base style: 16px white squares, 1px gray border
- Hover style: 20px blue squares
- Handles scale inversely with zoom level
- Only show when shape is locked by current user

**Handle position calculations:**
```typescript
const handles = [
  { x: -8, y: -8, cursor: 'nwse-resize', type: 'corner', name: 'tl' },
  { x: shape.width / 2 - 8, y: -8, cursor: 'ns-resize', type: 'edge', name: 't' },
  { x: shape.width - 8, y: -8, cursor: 'nesw-resize', type: 'corner', name: 'tr' },
  { x: -8, y: shape.height / 2 - 8, cursor: 'ew-resize', type: 'edge', name: 'l' },
  { x: shape.width - 8, y: shape.height / 2 - 8, cursor: 'ew-resize', type: 'edge', name: 'r' },
  { x: -8, y: shape.height - 8, cursor: 'nesw-resize', type: 'corner', name: 'bl' },
  { x: shape.width / 2 - 8, y: shape.height - 8, cursor: 'ns-resize', type: 'edge', name: 'b' },
  { x: shape.width - 8, y: shape.height - 8, cursor: 'nwse-resize', type: 'corner', name: 'br' },
];
```

**Test Gate:**
1. Lock a shape (click on it)
2. Verify 8 squares appear at all edges and corners
3. Count handles: 4 corners + 4 edges = 8 total
4. Visual inspection: handles are 16px white with gray border
5. Hover over each handle → should grow to 20px and change to blue
6. Test zoom: Zoom in/out and verify handles stay same screen size

**Success Criteria:**
- All 8 handles visible when shape locked
- Handles positioned correctly at corners and edge midpoints
- Hover effect works (size + color change)
- Handles only show for locked-by-me shapes

---

### Task 3: Corner Handle Resize Logic (Proportional)
**Estimated time:** 45 minutes

**Implementation:**
- Calculate aspect ratio on mousedown: `aspectRatio = originalWidth / originalHeight`
- During drag, maintain aspect ratio based on which corner is being dragged
- Handle all 4 corners: TL, TR, BL, BR
- Different corners require different calculations (anchor opposite corner)

**State needed:**
```typescript
const [isResizing, setIsResizing] = useState(false);
const [activeHandle, setActiveHandle] = useState<string | null>(null);
const [resizeStart, setResizeStart] = useState<{
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
} | null>(null);
const [previewDimensions, setPreviewDimensions] = useState<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);
```

**Key Implementation Detail:**
Use absolute positioning (cursor defines handle position directly), not delta-based calculations. This prevents cursor drift.

```typescript
// Example for BR (bottom-right) corner:
const anchorX = resizeStart.shapeX;  // Anchor at top-left
const anchorY = resizeStart.shapeY;

let rawWidth = canvasX - anchorX;   // Cursor defines the corner directly
let rawHeight = canvasY - anchorY;

// Maintain aspect ratio
const scale = Math.max(rawWidth / resizeStart.width, rawHeight / resizeStart.height);
const newWidth = Math.max(10, resizeStart.width * scale);
const newHeight = Math.max(10, resizeStart.height * scale);
```

**Test Gate:**
1. Lock a shape
2. Grab each corner handle and drag
3. Verify shape resizes proportionally (aspect ratio maintained)
4. Log aspect ratio: `console.log(width / height)` → should stay constant
5. Try to make shape tiny → should stop at 10×10 minimum
6. Verify anchor point stays fixed (opposite corner doesn't move)

**Success Criteria:**
- All 4 corner handles work
- Aspect ratio maintained throughout drag
- Minimum 10×10 enforced
- Smooth visual feedback
- Cursor stays locked to handle (no drift)

---

### Task 4: Edge Handle Resize Logic (Single Dimension)
**Estimated time:** 45 minutes

**Implementation:**
- Top/Bottom handles: resize height only, keep width constant
- Left/Right handles: resize width only, keep height constant
- Update x/y position when resizing from top/left (anchor opposite edge)

**Resize calculation examples:**
```typescript
// Top edge: resize height, adjust y position
const dy = currentY - resizeStart.y;
const newHeight = Math.max(10, resizeStart.height - dy);
const newY = resizeStart.y + (resizeStart.height - newHeight);
const newWidth = resizeStart.width; // unchanged

// Right edge: resize width only
const dx = currentX - resizeStart.x;
const newWidth = Math.max(10, resizeStart.width + dx);
const newHeight = resizeStart.height; // unchanged
```

**Test Gate:**
1. Lock a shape
2. Grab top edge handle → drag up/down
3. Verify: height changes, width stays constant
4. Verify: shape doesn't jump (bottom edge stays anchored)
5. Test all 4 edges independently
6. Try to make shape too small (< 10px) → should stop at minimum

**Success Criteria:**
- All 4 edge handles work
- Only one dimension changes
- Minimum 10px enforced
- Anchor edge stays fixed

---

### Task 5: Dimension Tooltip During Resize
**Estimated time:** 30 minutes

**Implementation:**
- Show tooltip above shape during resize
- Format: "200 × 150" (width × height in pixels)
- Position: centered above shape, 30px gap
- Style: white background, gray border, rounded corners, shadow
- Update in real-time during drag
- Hide on mouseup
- All dimensions scale inversely with zoom

**Tooltip component:**
```typescript
{isResizing && previewDimensions && (
  <Group
    x={previewDimensions.x + previewDimensions.width / 2}
    y={previewDimensions.y - (30 / stageScale)}
  >
    <Rect
      x={-(60 / stageScale)}
      y={-(20 / stageScale)}
      width={120 / stageScale}
      height={40 / stageScale}
      fill="white"
      stroke="#999"
      strokeWidth={1 / stageScale}
      cornerRadius={6 / stageScale}
      shadowBlur={8 / stageScale}
      shadowOpacity={0.3}
      shadowOffsetY={2 / stageScale}
    />
    <Text
      text={`${Math.round(previewDimensions.width)} × ${Math.round(previewDimensions.height)}`}
      fontSize={16 / stageScale}
      fill="#333"
      align="center"
    />
  </Group>
)}
```

**Test Gate:**
1. Lock a shape
2. Start dragging any resize handle
3. Verify tooltip appears above shape
4. Verify format: "200 × 150" with × symbol
5. Drag handle → tooltip values update in real-time
6. Release handle → tooltip disappears immediately

**Success Criteria:**
- Tooltip visible during resize
- Position centered above shape
- Real-time dimension updates
- Correct format (width × height)
- Disappears on mouseup

---

### Task 6: Persist Resize to Firestore
**Estimated time:** 30 minutes

**Implementation:**
- On mouseup, call `canvasService.resizeShape()` with final dimensions
- Handle errors gracefully (console logging)
- Clear resize state after successful save
- Use optimistic updates for immediate visual feedback

**Handler implementation:**
```typescript
const handleResizeEnd = async () => {
  if (!isResizing || !previewDimensions || !activeHandle) {
    setIsResizing(false);
    setActiveHandle(null);
    setResizeStart(null);
    setPreviewDimensions(null);
    return;
  }

  // Stop interactive resizing but keep preview dimensions for optimistic update
  setIsResizing(false);
  setActiveHandle(null);
  setResizeStart(null);

  try {
    // Save resize to Firestore
    await canvasService.resizeShape(
      activeHandle.shapeId,
      previewDimensions.width,
      previewDimensions.height
    );
    
    // Also update position if it changed (for top/left edge resizes)
    if (resizeStart && (previewDimensions.x !== resizeStart.shapeX || previewDimensions.y !== resizeStart.shapeY)) {
      await updateShape(activeHandle.shapeId, {
        x: previewDimensions.x,
        y: previewDimensions.y
      });
    }
    
    console.log('✅ Shape resized successfully');
  } catch (error) {
    console.error('❌ Failed to resize shape:', error);
    // Clear preview on error so shape reverts to original
    setPreviewDimensions(null);
  }
  // Note: previewDimensions will be cleared when we detect the shape update from Firestore
};
```

**Optimistic Updates:**
The implementation includes sophisticated optimistic update logic that:
- Keeps `previewDimensions` after mouseup for immediate visual feedback
- Clears preview dimensions automatically when Firestore confirms the update (lines 811-829 in Canvas.tsx)
- Prevents interaction with shapes during optimistic update period
- Reverts to original dimensions if Firestore update fails

**Test Gate:**
1. Lock a shape
2. Resize using any handle
3. Release mouse → verify Firestore document updated
4. Check Firestore console: width, height, updatedAt all updated
5. Open second browser window (User B)
6. User A resizes shape → User B sees update within 100ms
7. Test with corner handle (both dimensions change)
8. Test with edge handle (one dimension changes)
9. Test with top/left edge (position also changes)

**Success Criteria:**
- Firestore updates on mouseup
- Both width and height saved correctly
- Position saved when top/left edges used
- Real-time sync works (<100ms for User B)
- Error handling prevents crashes
- Optimistic updates provide immediate visual feedback
- Console logs success/error messages

---

## 7. Testing Checklist ✅ ALL TESTS PASSED

Test with 2 users in separate browsers:

### Basic Resize Tests
- [x] User A locks rectangle → 8 handles appear
- [x] Verify all 8 handles positioned correctly (4 corners + 4 edges)
- [x] Hover over each handle → grows from 16px to 20px, white to blue
- [x] Handles maintain consistent screen size at different zoom levels

### Corner Handle Tests (Proportional)
- [x] Create 200×100 rectangle (aspect ratio 2:1)
- [x] Drag BR corner to make bigger → aspect ratio maintained (still 2:1)
- [x] Drag TL corner to make smaller → aspect ratio maintained
- [x] Test all 4 corners (TL, TR, BL, BR)
- [x] Verify anchor point stays fixed (opposite corner doesn't move)

### Edge Handle Tests (Single Dimension)
- [x] Drag top edge → only height changes, width constant
- [x] Drag right edge → only width changes, height constant
- [x] Drag bottom edge → only height changes, width constant
- [x] Drag left edge → only width changes, height constant
- [x] Verify opposite edge stays anchored (shape doesn't jump)

### Minimum Size Tests
- [x] Try to resize below 10×10 → stops at minimum
- [x] Minimum enforced on all handles (corners and edges)

### Dimension Tooltip Tests
- [x] Start dragging any handle → tooltip appears above shape
- [x] Tooltip format: "200 × 150" (with × symbol, not letter x)
- [x] Tooltip updates in real-time during drag
- [x] Release handle → tooltip disappears immediately
- [x] Tooltip remains readable at different zoom levels

### Multi-User Sync Tests
- [x] Open 2 browser windows (User A and User B)
- [x] User A resizes shape → User B sees update within 100ms
- [x] Test with corner handle resize
- [x] Test with edge handle resize
- [x] Measure sync latency (confirmed <100ms)

### Performance Tests
- [x] Drag handles rapidly → maintains 60 FPS (check Chrome DevTools)
- [x] Test with 20+ shapes on canvas → no degradation
- [x] No memory leaks (event listeners cleaned up)
- [x] No console errors during any resize operation

### Edge Cases
- [x] Resize while other user has shape locked → lock system prevents conflicts
- [x] Resize near canvas edge → shape boundary constraints work correctly
- [x] Very small starting size → minimum enforced
- [x] Very large resize → works up to canvas limits

---

## 8. Success Criteria

### Functional Requirements ✅ COMPLETED
- ✅ 8 resize handles appear when shape locked (4 corners + 4 edges)
- ✅ Corner handles resize proportionally (aspect ratio maintained)
- ✅ Edge handles resize single dimension only
- ✅ Minimum 10×10 enforced (validation in canvasService.resizeShape)
- ✅ Dimension tooltip shows during drag ("200 × 150")
- ✅ User A resizes → User B sees in <100ms (real-time Firestore sync)
- ✅ Shape position updates correctly when top/left edges used
- ✅ No console errors during resize operations
- ✅ Optimistic updates provide immediate visual feedback

### Visual Requirements ✅ COMPLETED
- ✅ Handles: 16px white squares with gray (#999) border
- ✅ Hover: 20px blue (#3b82f6) squares with darker blue (#2563eb) stroke
- ✅ Handles maintain consistent screen size regardless of zoom level
- ✅ Correct cursor for each handle (nwse-resize, ns-resize, ew-resize, nesw-resize)
- ✅ Smooth preview during drag (no jank or cursor drift)
- ✅ Tooltip readable and well-positioned
- ✅ Preview shape at 60% opacity with green stroke during resize
- ✅ Original shape at 20% opacity during active resize

### Performance Requirements ✅ COMPLETED
- ✅ 60 FPS maintained during resize
- ✅ Sync latency <100ms
- ✅ No memory leaks (event listeners cleaned up)
- ✅ Works smoothly with 20+ shapes on canvas

### Implementation Details
- **Optimistic Updates:** Shape displays with new dimensions immediately after mouseup, confirmed when Firestore update arrives
- **Real-time Position Tracking:** Handles follow shape position during drag operations
- **Error Handling:** Failed resizes revert to original dimensions via console logging
- **Boundary Validation:** Shape positions clamped to canvas bounds during drag

---

## 9. Out of Scope

Items deferred to future PRs:

- ❌ **Circle and Triangle shape types** (PR #2)
- ❌ **Shape rotation** (PR #3)
- ❌ **Multi-selection** (future)
- ❌ **Copy/paste, undo/redo** (future)
- ❌ **Advanced styling, smart guides** (future)
- ❌ **Shape grouping, export** (future)

This PR focuses exclusively on resize functionality for existing rectangles.

---

## 10. Visual Design Specifications

**Resize Handles:**
- Default: 16×16px, white fill, 1px gray (#999) border
- Hover: 20×20px, blue (#3b82f6) fill, darker blue (#2563eb) stroke
- Scale inversely with zoom (always appear same size on screen)
- Cursor changes per handle:
  - Corners: `nwse-resize` (TL, BR), `nesw-resize` (TR, BL)
  - Edges: `ns-resize` (T, B), `ew-resize` (L, R)

**Dimension Tooltip:**
- Format: "200 × 150" (width × height with multiplication symbol)
- Position: Centered above shape, 30px gap (scaled with zoom)
- Background: White with gray (#999) border
- Text: Dark gray (#333), 16px font size (scaled with zoom)
- Corners: 6px radius, subtle shadow for depth

**Resize Preview:**
- Original shape: 20% opacity during active resize
- Preview: 60% opacity with shape's color, green stroke (#10b981)
- Preview handles: All 8 handles shown on preview shape during drag
- Optimistic updates: Preview remains visible after mouseup until Firestore confirms update

---

## 11. Performance Requirements

| Metric | Requirement | Verification Method |
|:---|:---|:---|
| Frame Rate | 60 FPS during resize | Chrome DevTools Performance tab |
| Sync Latency | <100ms between users | Stopwatch + 2 browser windows |
| Shape Count | No degradation with 20+ shapes | Manual testing with multiple shapes |
| Handle Responsiveness | Immediate hover/cursor feedback | Visual inspection |

---

## 12. Estimated Timeline

| Task | Time | Cumulative |
|:---|:---:|:---:|
| Task 1: CanvasService method | 20 min | 20 min |
| Task 2: Render 8 handles | 30 min | 50 min |
| Task 3: Corner resize logic | 45 min | 1h 35min |
| Task 4: Edge resize logic | 45 min | 2h 20min |
| Task 5: Dimension tooltip | 30 min | 2h 50min |
| Task 6: Persist to Firestore | 30 min | 3h 20min |
| Testing & Polish | 30 min | 3h 50min |
| **TOTAL** | **~3.5 hours** | **Single focused PR** |

---

**✅ IMPLEMENTATION COMPLETE** - All features implemented and functional