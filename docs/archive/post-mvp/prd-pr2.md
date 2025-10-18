# PR #2: Add Circle and Triangle Shapes

## Goal

Expand the shape library by adding circles and triangles to the canvas, with full support for creation, selection, locking, dragging, resizing, and rotation.

**Branch:** `feature/pr2-circles-triangles`

---

## Overview

Add two new shape types: **Circle** and **Triangle**

**Features:**
- New toolbar buttons (Circle ○, Triangle △)
- Support all existing interactions: select, lock, drag, resize, rotate
- Real-time sync across users (<100ms)
- Store as `type: 'rectangle' | 'circle' | 'triangle'` in Firestore
- Render using Konva's `Circle` and `RegularPolygon` components

**Design Decisions:**
- **Circles:** Maintain aspect ratio during resize (perfect circles)
- **Triangles:** Allow independent width/height scaling, point upward by default
- **Storage:** Use `width`/`height` bounding box for consistency with rectangles

---

## Files to Create

None - all modifications to existing files

## Files to Modify

### 1. `app/src/services/canvasService.ts`
**Changes:**
- Add `type` field to `ShapeData` interface: `'rectangle' | 'circle' | 'triangle'`
- Add `type` field to `ShapeCreateInput` interface
- Update default handling to treat missing `type` as `'rectangle'` (backward compatibility)

### 2. `app/src/components/Canvas/Canvas.tsx`
**Changes:**
- Add toolbar state: `activeTool` with 'select' | 'rectangle' | 'circle' | 'triangle'
- Add three shape tool buttons to toolbar UI
- Update `handleStageClick` to create shapes based on `activeTool`
- Add conditional rendering for circles using Konva's `<Circle>` component
- Add conditional rendering for triangles using Konva's `<RegularPolygon>` component
- Update resize logic to maintain aspect ratio for circles
- Verify rotation handles work for all shape types

---

## Implementation Tasks

### Task 2.1: Add type field to data models (15 min)

**Changes:**

```typescript
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';  // NEW
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  lockedBy?: string | null;
  lockedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShapeCreateInput {
  type: 'rectangle' | 'circle' | 'triangle';  // NEW
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
}
```

**Test Gate:**
1. Update interfaces in `canvasService.ts`
2. Run TypeScript compiler: `npm run type-check`
3. Verify no compilation errors
4. Open browser console
5. Create test shape: `await canvasService.createShape({ type: 'rectangle', x: 100, y: 100, width: 100, height: 100, color: '#3b82f6' })`
6. Open Firestore console → verify `type` field exists in document
7. Check existing shapes → verify app still renders them (defaults to 'rectangle')
8. Log success: `console.log('✅ SUCCESS TASK 2.1')`

**Success Criteria:**
- TypeScript compiles with no errors
- Existing rectangles still render correctly
- New shapes can be created with `type` field
- Backward compatible (missing type defaults to 'rectangle')

---

### Task 2.2: Add toolbar buttons (20 min)

```typescript
const [activeTool, setActiveTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle'>('select');
```

Add four buttons to toolbar: Select ↖, Rectangle □, Circle ○, Triangle △

**Test Gate:**
1. Add toolbar buttons to Canvas.tsx
2. Run dev server: `npm run dev`
3. Open browser → verify 4 buttons visible
4. Click Rectangle button → verify blue highlight appears
5. Verify cursor changes to crosshair (inspect cursor CSS)
6. Click Circle button → Rectangle unhighlights, Circle highlights
7. Click Triangle button → verify highlight moves
8. Click Select → all shape buttons unhighlight, cursor returns to default
9. Console log: `console.log('Active tool:', activeTool)` → verify state changes
10. Log success: `console.log('✅ SUCCESS TASK 2.2')`

**Success Criteria:**
- All 4 buttons visible and clickable
- Active tool shows visual highlight (blue background)
- Only one tool active at a time
- Cursor changes to crosshair when shape tool selected
- Clicking "Select" returns to default cursor

---

### Task 2.3: Update shape creation logic
**Estimated time:** 25 minutes  
**Status:** ⬜ Not started

**Implementation:**

```typescript
const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
  if (e.target === e.target.getStage() && activeTool !== 'select') {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const newShape = {
      type: activeTool, // 'rectangle', 'circle', or 'triangle'
      x: pos.x - 50,
      y: pos.y - 50,
      width: 100,
      height: 100,
      color: '#3b82f6',
      rotation: 0
    };

    await canvasService.createShape(newShape);
    setActiveTool('select'); // Return to select tool
  }
};
```

**Test Gate:**
1. Click Rectangle tool
2. Click on canvas → verify rectangle created at click point
3. Verify tool returns to "Select" automatically
4. Open Firestore console → verify document has `type: 'rectangle'`
5. Click Circle tool
6. Click on canvas → verify circle appears (will look like rectangle until Task 2.4)
7. Check Firestore → verify `type: 'circle'`
8. Click Triangle tool
9. Click on canvas → verify triangle appears (will look like rectangle until Task 2.5)
10. Check Firestore → verify `type: 'triangle'`
11. Open second browser → verify shapes appear within 100ms
12. Log success: `console.log('✅ SUCCESS TASK 2.3')`

**Success Criteria:**
- Each tool creates shape with correct `type` value
- Shape centered on click point
- Tool returns to "Select" after creation
- Real-time sync works across browsers (<100ms)

---

### Task 2.4: Implement Circle rendering
**Estimated time:** 30 minutes  
**Status:** ⬜ Not started

**Implementation:**

```typescript
if (shape.type === 'circle') {
  const radius = Math.min(shape.width, shape.height) / 2;
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  return (
    <Group key={shape.id} x={centerX} y={centerY} rotation={currentRotation}>
      <Circle
        radius={radius}
        fill={shape.color}
        stroke={selectedShapeId === shape.id ? '#3b82f6' : undefined}
        strokeWidth={selectedShapeId === shape.id ? 2 / stageScale : 0}
        draggable={isLockedByCurrentUser}
        onClick={() => handleShapeSelect(shape.id)}
        onDragStart={() => handleShapeDragStart(shape.id)}
        onDragMove={(e) => handleShapeDragMove(e, shape)}
        onDragEnd={(e) => handleShapeDragEnd(e, shape)}
      />
    </Group>
  );
}
```

**Key Concepts:**
- Circles positioned by center point, not top-left
- Radius = `Math.min(width, height) / 2` for perfect circles
- Use `<Group>` for rotation around center

**Test Gate:**
1. Create a circle using Circle tool
2. Visual inspection: verify it's perfectly round (not ellipse)
3. Measure aspect ratio: width should equal height
4. Click circle → verify blue selection stroke appears
5. Lock circle → verify it can be dragged
6. Drag circle to new position → verify smooth movement
7. Release → check Firestore for updated position
8. Create multiple circles → verify all render correctly
9. Second browser → verify circles sync in real-time
10. Zoom in/out → verify circles stay perfectly round at all zoom levels
11. Log success: `console.log('✅ SUCCESS TASK 2.4')`

**Success Criteria:**
- Circle renders as perfect circle (not ellipse)
- Selectable (blue stroke on click)
- Draggable when locked
- Rotates around center
- Multiple circles can coexist
- Real-time sync works

---

### Task 2.5: Implement Triangle rendering
**Estimated time:** 30 minutes  
**Status:** ⬜ Not started

**Implementation:**

```typescript
if (shape.type === 'triangle') {
  const radius = Math.min(shape.width, shape.height) / 2;
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  return (
    <Group key={shape.id} x={centerX} y={centerY} rotation={currentRotation}>
      <RegularPolygon
        sides={3}
        radius={radius}
        fill={shape.color}
        stroke={selectedShapeId === shape.id ? '#3b82f6' : undefined}
        strokeWidth={selectedShapeId === shape.id ? 2 / stageScale : 0}
        draggable={isLockedByCurrentUser}
        onClick={() => handleShapeSelect(shape.id)}
        onDragStart={() => handleShapeDragStart(shape.id)}
        onDragMove={(e) => handleShapeDragMove(e, shape)}
        onDragEnd={(e) => handleShapeDragEnd(e, shape)}
        rotation={-90} // Point upward (default points right)
      />
    </Group>
  );
}
```

**Test Gate:**
1. Create a triangle using Triangle tool
2. Visual inspection: verify it points upward (△ not ▷)
3. Verify all three sides appear equal length (equilateral)
4. Click triangle → verify blue selection stroke appears
5. Lock triangle → verify draggable
6. Drag to new position → smooth movement
7. Create multiple triangles → all render correctly
8. Test rotation: lock triangle, rotate 90° → should point right
9. Rotate 180° → points down
10. Second browser → verify triangles sync
11. Zoom in/out → verify triangles render crisply
12. Log success: `console.log('✅ SUCCESS TASK 2.5')`

**Success Criteria:**
- Triangle points upward by default
- Equilateral (equal sides)
- Selectable and draggable
- Rotates around center
- Multiple triangles work
- Real-time sync functional

---

### Task 2.6: Update resize handles for all shapes
**Estimated time:** 45 minutes  
**Status:** ⬜ Not started

**Implementation:**

**For Circles:** Maintain aspect ratio (force square bounding box)

```typescript
const handleResizeDragMove = (e: KonvaEventObject<MouseEvent>, corner: string, shape: ShapeData) => {
  // ... existing resize logic to calculate newWidth, newHeight ...

  if (shape.type === 'circle') {
    // Force square bounding box for perfect circles
    const size = Math.min(newWidth, newHeight);
    newWidth = size;
    newHeight = size;
  }

  setPreviewDimensions({ x: newX, y: newY, width: newWidth, height: newHeight });
};
```

**For Triangles:** Allow independent width/height scaling (existing logic works)

**Test Gate:**
1. Create a rectangle → lock → drag corner handle
2. Verify width and height change independently
3. Create a circle → lock → drag BR corner handle diagonally
4. Verify circle maintains perfect circular shape (no ellipse)
5. Measure: width should always equal height during resize
6. Try all 8 resize handles on circle → all maintain circular shape
7. Create triangle → lock → drag corner handle
8. Verify triangle can stretch (tall/wide variations allowed)
9. Drag top edge of triangle → height changes, width stays constant
10. Second browser → User A resizes circle → User B sees circular resize in real-time
11. No console errors during any resize operation
12. Check Firestore after resize → width/height values correct
13. Log success: `console.log('✅ SUCCESS TASK 2.6')`

**Success Criteria:**
- Rectangle resizes independently (width/height separate)
- Circle always maintains perfect circular shape
- Circle resize handles scale uniformly
- Triangle allows stretching (arbitrary width/height ratios)
- All 8 resize handles work for all shape types
- Real-time sync works for all resize operations

---

### Task 2.7: Verify rotation handles work for all shapes
**Estimated time:** 15 minutes  
**Status:** ⬜ Not started

**Implementation:**

Existing rotation implementation should work without modification because:
- Rotation handle positioned relative to bounding box (50px above top edge)
- All shapes rotate around center point via `<Group>` rotation
- Rotation angle stored in `shape.rotation` field

**Test Gate:**
1. Create and lock a circle
2. Verify rotation handle appears 50px above circle
3. Drag rotation handle → circle rotates smoothly
4. Verify angle tooltip displays (e.g., "45°")
5. Rotate to 90° → verify circle still perfectly round
6. Create and lock a triangle
7. Drag rotation handle → triangle rotates
8. Rotate triangle to 90° → should point right (▷)
9. Rotate to 180° → points down (▽)
10. Rotate to 270° → points left (◁)
11. Second browser → verify rotation syncs in real-time
12. Check Firestore → `rotation` field updates correctly
13. Log success: `console.log('✅ SUCCESS TASK 2.7')`

**Success Criteria:**
- Rotation handle appears for all shape types
- All shapes rotate smoothly around center
- Angle tooltip displays during rotation
- Correct orientations at 90°, 180°, 270°
- Real-time sync works

---

### Task 2.8: Edge case testing
**Estimated time:** 45 minutes  
**Status:** ⬜ Not started

**Test Scenarios:**

#### 1. Mixed Shape Selection
1. Create rectangle, circle, and triangle on canvas
2. Click rectangle → verify selection highlight
3. Click circle → rectangle deselects, circle selects
4. Click triangle → circle deselects, triangle selects
5. Verify only one shape selected at a time

#### 2. Shape Overlap
1. Create overlapping shapes of different types
2. Click on overlap area → verify top-most shape selected
3. Drag overlapping shapes → no z-index issues
4. Verify shapes maintain proper layering

#### 3. Zoom Compatibility
1. Test all three shape types at 0.5x zoom
2. Verify shapes render correctly, handles visible
3. Test at 1x (default) zoom
4. Test at 2x zoom
5. Resize handles should stay same screen size at all zoom levels
6. Shapes render crisply (no pixelation)

#### 4. Boundary Constraints
1. Drag circle to left edge → should stop at boundary
2. Drag triangle to canvas edge → stays within bounds
3. Resize circle at edge → handles collision properly
4. No shapes escape canvas boundaries

#### 5. Rotation + Resize Interaction
1. Rotate circle to 45°
2. Resize → verify maintains circular shape during and after
3. Rotate triangle to 60°
4. Resize → scales correctly, no visual artifacts
5. Verify handles oriented correctly at all angles

#### 6. Multi-User Scenarios
1. User A creates circle → User B sees within 100ms
2. User B locks and rotates circle → User A sees rotation
3. User A resizes triangle → User B sees resize
4. No conflicts during concurrent operations
5. Both users can create shapes simultaneously

**Test Gate:**
1. Complete all 6 test scenarios above
2. No console errors during any operation
3. Performance check: Open DevTools → Performance tab
4. Perform rapid operations → verify 60 FPS maintained
5. Create 20+ mixed shapes → verify no lag
6. Log success: `console.log('✅ SUCCESS TASK 2.8')`

**Success Criteria:**
- All edge cases tested and working
- No console errors
- 60 FPS maintained with mixed shapes
- No visual artifacts
- Real-time sync works in all scenarios

---

### Task 2.9: Multi-user testing with all shape types

**Test Scenario:**

**Setup:** Open 3 browser windows (User A, User B, User C)

**User A (Browser 1):**
1. Create a rectangle at (100, 100)
2. Create a circle at (300, 100)
3. Create a triangle at (500, 100)

**User B (Browser 2):**
1. Verify all 3 shapes appear within 100ms
2. Start timer → lock the circle → measure lock time (<100ms?)
3. Rotate circle to 45°
4. Resize circle to 150×150
5. Note timestamps for each operation

**User A (Browser 1):**
1. Verify circle rotation visible within 100ms of User B's action
2. Verify circle resize visible within 100ms
3. Lock the triangle
4. Rotate triangle to 90° (should point right)
5. Resize triangle to 120×80 (wide triangle)

**User C (Browser 3):**
1. Verify all shapes and all transformations visible
2. Lock rectangle
3. Move rectangle to (200, 300)
4. User A and User B verify rectangle movement

**All Users:**
1. Refresh browsers (Ctrl+R or Cmd+R)
2. Verify all shapes persist with correct:
   - Type (rectangle, circle, triangle)
   - Position (x, y coordinates)
   - Dimensions (width, height)
   - Rotation angle
   - Color

**Test Gate:**
1. Complete all test steps above
2. Measure sync latency with DevTools Network tab
3. Verify all sync operations <100ms
4. Check Firestore console → all fields correct for all shapes
5. No race conditions (shapes don't flicker or conflict)
6. All 3 users see identical canvas state
7. Persistence works (refresh doesn't lose data)
8. Log success: `console.log('✅ SUCCESS TASK 2.9')`

**Success Criteria:**
- All shape types sync across 3+ users
- Sync latency <100ms for all operations
- No race conditions or conflicts
- Shapes persist correctly after refresh
- All transformations (create, move, resize, rotate) work

---

## Integration Points

### Existing Features Used:
1. **Locking System** - All shapes use existing lock mechanism
2. **Canvas Context** - Uses existing shape state management
3. **Konva Rendering** - Leverages Konva's built-in shape components
4. **CanvasService** - Type field integrates with existing CRUD methods
5. **Real-time Sync** - Firestore `onSnapshot` automatically syncs all shape types

### Future Features Prepared:
- **Text layers (PR #3)** - Will add `'text'` to type union
- **Multi-select (PR #6)** - Will work with mixed shape selections
- **Shape styling (PR #7)** - Will apply to all shape types
- **AI agent (PR #11-13)** - Can create any shape type via tools

---

## Testing Plan

### Manual Testing Steps:


#### Resize Testing
1. Create circle → resize with corner handles → verify stays circular
2. Create triangle → resize with edge handles → verify stretches correctly
3. Create rectangle → verify resize works as before

#### Rotation Testing
1. Test rotating circle to 45°, 90°, 180°
2. Test rotating triangle to all angles
3. Verify rotation handle positioning

#### Multi-User Testing
1. Open 2+ browser windows
2. User A creates shapes → User B sees them
3. User B manipulates shapes → User A sees updates
4. Test concurrent operations

### Edge Cases:
1. Very small shapes (near minimum size)
2. Shapes at canvas boundaries
3. Overlapping shapes of different types
4. Rapid tool switching
5. Zoom in/out with all shape types

### Performance Testing:
1. Create 20+ mixed shapes on canvas
2. Verify 60 FPS during interactions
3. No memory leaks (check DevTools Memory tab)
4. Sync latency stays <100ms with many shapes

---

## Deployment Checklist

Before merging:
- [ ] All 9 sub-tasks completed (2.1 - 2.9)
- [ ] All test gates passed
- [ ] TypeScript compilation successful (no errors)
- [ ] Manual testing passed (all shape types)
- [ ] Multi-user testing passed (3+ browsers)
- [ ] Performance verified (60 FPS with 20+ shapes)
- [ ] No console errors in any scenario
- [ ] Backward compatibility verified (existing rectangles work)
- [ ] Firestore documents have correct `type` field
- [ ] Code reviewed for quality
- [ ] Git branch created: `feature/pr2-circles-triangles`
- [ ] All changes committed with clear messages
- [ ] Branch merged to develop
- [ ] Deployed to production (Vercel)
- [ ] Production smoke test completed

---

## Success Criteria

### Functional Requirements:
- ✅ Three shape type buttons visible in toolbar (Rectangle, Circle, Triangle)
- ✅ Active tool shows visual highlight
- ✅ Click with shape tool creates shape at cursor position
- ✅ Circles render as perfect circles (not ellipses)
- ✅ Triangles render as equilateral triangles pointing upward
- ✅ All shapes support select, lock, drag, resize, rotate
- ✅ Circle resize maintains circular shape (uniform scaling)
- ✅ Triangle resize allows width/height stretching
- ✅ Tool returns to "Select" after creating shape
- ✅ Shape type stored in Firestore (type field)

### Technical Requirements:
- ✅ `type` field added to `ShapeData` interface
- ✅ No TypeScript compilation errors
- ✅ No console errors when creating/manipulating shapes
- ✅ 60 FPS maintained with 20+ shapes of mixed types
- ✅ Backward compatible (existing rectangles still work)
- ✅ All existing rectangles default to `type: 'rectangle'`

### Multi-User Requirements:
- ✅ User A creates circle → User B sees circle in <100ms
- ✅ User A creates triangle → User B sees triangle in <100ms
- ✅ Real-time sync works for all shape types
- ✅ No conflicts when users manipulate different shape types
- ✅ Mixed shapes (rectangle, circle, triangle) sync correctly
- ✅ All shape transformations sync across users

### Visual/UX Requirements:
- ✅ Shape creation feels intuitive and responsive
- ✅ Circles look perfectly round at all zoom levels
- ✅ Triangles point upward by default
- ✅ Resize behavior appropriate for each shape type
- ✅ Cursor changes indicate current tool/action
- ✅ No visual artifacts during shape manipulation

---

## Deployment Steps

```bash
# 1. Local Development & Testing
cd app
npm run dev  # Test all shape types + multi-user (2+ browser windows)

# 2. Run Tests
npm run test  # Ensure all tests pass
npm run type-check  # No TypeScript errors

# 3. Build Production
npm run build  # Verify build succeeds
npm run preview  # Test production build locally

# 4. Deploy
vercel --prod  # Deploy from app/ directory

# 5. Production Verification
# - Open deployed app
# - Create rectangle, circle, and triangle
# - Test all interactions (select, lock, drag, resize, rotate)
# - Test with 2+ users in different browsers
# - Verify Firestore updates in Firebase console
# - Check for console errors
# - Verify <100ms sync latency
# - Test at different zoom levels
# - Verify backward compatibility (existing rectangles work)
```




---

## Notes

**Integration Points:**
- Works with existing: shape creation, locking, sync, drag, resize, rotate
- Prepares for: text layers, multi-select, styling, AI agent

**Future Enhancements:**
- More shapes (pentagon, hexagon, star)
- Shift key to maintain equilateral triangles during resize
- "Stay in tool mode" preference for creating multiple shapes
- Custom handle positioning for circles (N, S, E, W directions)

**Backward Compatibility:**
- Existing rectangles continue to work
- Shapes without `type` default to `'rectangle'`
- No Firestore migration needed

**Design Philosophy:**
- Use Konva's native components for performance
- Center-point positioning for consistent rotation
- Bounding box storage for consistency with rectangles
- Type-specific resize behavior for better UX

---

## Ready to Proceed?

Review this action plan and confirm:
1. ✅ Approach makes sense for adding circle and triangle shapes?
2. ✅ Time estimate realistic (~4 hours)?
3. ✅ Any concerns with rendering strategy (Konva Circle/RegularPolygon)?
4. ✅ Test gates comprehensive enough?
5. ✅ Ready to start implementation?

If approved, begin with Task 2.1 (data models) and work through tasks 2.1-2.9 systematically, testing each gate before proceeding. 🚀
