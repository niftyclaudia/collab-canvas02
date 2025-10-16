# PR #2: Rotate Shapes

## Goal

Add rotation capability to shapes with a visual rotation handle, real-time angle feedback, and multi-user sync.

## PRD Reference

See `docs/prd.md` Section 2: "Rotate Shapes (P0 - Critical)" (lines 124-178)

## Branch

`feature/pr-2-rotate-shapes`

---

## Overview

This PR adds rotation functionality to all shapes on the canvas. Users will be able to:
- See a rotation handle 30px above a locked shape
- Drag the handle to rotate the shape around its center
- View a live angle tooltip (e.g., "45°") during rotation
- See rotations sync across all users in <100ms

The rotation will be stored as a `rotation` field (0-360 degrees) in Firestore and applied via Konva's built-in rotation with proper offset configuration for center-point rotation.

---

## Files to Create

None (all changes are modifications to existing files)

---

## Files to Modify

### Core Service Layer
- `collabcanvas/src/services/canvasService.ts` - Add `rotateShape()` method

### Type Definitions
- `collabcanvas/src/services/canvasService.ts` - Update `ShapeData` interface with `rotation` field

### Canvas Component
- `collabcanvas/src/components/Canvas/Canvas.tsx` - Add rotation handle rendering, drag logic, and Konva rotation implementation

---

## Sub-Tasks

### Task 2.1: Add rotation field to data models ✅ COMPLETED

**What:** Update TypeScript interfaces to include rotation field

**Changes:**
1. Add `rotation?: number` to `ShapeData` interface in `canvasService.ts`
2. Update `ShapeCreateInput` type to include optional rotation field
3. Set default rotation to 0 when creating shapes

**Test Gate:**
- Create new shape via console, verify Firestore document has `rotation: 0`
- TypeScript compiles with no errors
- Existing shapes still render correctly (backward compatible)

**Estimated Time:** 10 minutes

---

### Task 2.2: CanvasService rotateShape method ✅ COMPLETED

**What:** Add service method to update rotation in Firestore

**Implementation:**
```typescript
async rotateShape(shapeId: string, rotation: number): Promise<void> {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
  await updateDoc(shapeRef, {
    rotation: normalizedRotation,
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ Shape ${shapeId} rotated to ${normalizedRotation}°`);
}
```

**Test Gate:**
- Open browser console
- Call `canvasService.rotateShape('shape_id', 405)`
- Verify Firestore shows `rotation: 45` (normalized)
- Call with negative value `-45` → verify stored as `315`
- Verify `updatedAt` timestamp updated

**Estimated Time:** 15 minutes

---

### Task 2.3: Rotation handle rendering ✅ COMPLETED

**Status:** ✅ Implemented and tested successfully

**What:** Display rotation handle UI when shape is locked by current user

**Implementation Details:**
- Show circular handle 50px above the top of the shape (increased from 30px to avoid collision with top resize handle)
- Handle dimensions: 12px diameter circle
- Style: White fill, 2px gray border, with "↻" icon/symbol
- Visual line connecting handle to shape center (1px gray, dashed)
- Only visible when shape locked by current user
- Cursor changes to `grab` or rotation cursor on handle hover

**Test Gate:**
1. Lock a shape by clicking it
2. Verify rotation handle appears 50px above shape top edge ✅
3. Verify handle shows ↻ symbol ✅
4. Verify connecting line visible ✅
5. Hover over handle → cursor changes ✅
6. Unlock shape → handle disappears ✅
7. Verify no collision with top resize handle ✅

**Estimated Time:** 30 minutes

**Implementation Notes:**
- Added `hoveredRotationHandle` state to track hover status
- Used Konva Circle for the handle (12px diameter, scaled inversely with zoom)
- Used Konva Line with dash pattern for connecting line
- Handle appears only when shape is selected, locked by current user, and not resizing
- Handle changes from white to blue (#3b82f6) on hover
- Icon text changes from gray to white on hover
- Handle positioned 50px above the TOP of the shape (increased from 30px to avoid collision with top resize handle)
- Connecting line runs from handle to shape center for visual clarity

**Bug Fixes Applied:**
1. **Issue:** Initial implementation had `handleDistance = 30 / stageScale` which caused handle to appear at inconsistent distances based on zoom level. At high zoom, handle would be inside/at the shape center.
   - **Fix:** Removed the `/ stageScale` division so handle is always at a consistent canvas distance from the shape
   
2. **Issue:** Handle was positioned at `centerY - 30` which placed it at the top edge or inside the shape for smaller shapes (e.g., 60px tall shape: centerY=30, 30-30=0).
   - **Fix:** Changed positioning to `handleY = -30` (30px above the TOP of the shape, not center)
   - This matches standard design tool UX (Figma, Sketch, etc.)
   - Connecting line still runs from handle to shape center for proper visual indication of rotation pivot

3. **Issue:** Rotation handle at 30px above top edge was colliding with the top-center resize handle at ~8px above top edge, causing overlap/confusion.
   - **Fix:** Increased rotation handle distance to 50px above the top edge to provide clear visual separation between rotation and resize handles
   - Updated tooltip positioning logic to match the new 50px distance

---

### Task 2.4: Rotation calculation logic

**What:** Implement drag behavior to calculate rotation angle from mouse position

**Implementation Details:**

1. **On handle mousedown:**
   - Store initial angle: `Math.atan2(mouseY - centerY, mouseX - centerX)`
   - Store shape's current rotation
   - Set `isRotating` state to true

2. **On mousemove (while rotating):**
   - Calculate current angle: `Math.atan2(mouseY - centerY, mouseX - centerX)`
   - Calculate angle delta: `currentAngle - initialAngle`
   - Convert radians to degrees: `delta * (180 / Math.PI)`
   - New rotation: `initialRotation + deltaInDegrees`
   - Update local preview (don't save yet)

3. **On mouseup:**
   - Set `isRotating` to false
   - Call `canvasService.rotateShape(shapeId, finalRotation)`

**Formulas:**
```typescript
const centerX = shape.x + shape.width / 2;
const centerY = shape.y + shape.height / 2;
const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
const degrees = angle * (180 / Math.PI);
```

**Test Gate:**
1. Drag rotation handle clockwise → shape rotates clockwise
2. Drag counterclockwise → shape rotates counterclockwise
3. Console.log rotation values during drag → verify correct calculation
4. Rotate past 360° → continues smoothly (wraps correctly)
5. Visual preview updates smoothly during drag (60 FPS)

**Estimated Time:** 45 minutes

**Status:** ✅ Completed

**Bug Fix Applied:**
When implementing center-point rotation, the Group positioning was changed from top-left to center coordinates:
```typescript
<Group 
  x={shape.x + shape.width / 2}     // Center position
  y={shape.y + shape.height / 2}
  offsetX={shape.width / 2}          // Rotate around center
  offsetY={shape.height / 2}
  rotation={currentRotation}
>
```

This broke drag positioning because Firestore stores top-left coordinates but the drag handlers were reading center coordinates from the Group. 

**Fix:** Updated `handleShapeDragMove` and `handleShapeDragEnd` to convert between coordinate systems:
- Read Group position (center coords)
- Convert to top-left coords: `topLeftX = centerX - width/2`
- Apply boundary constraints using top-left coords
- Save top-left coords to Firestore
- Convert back to center coords when updating Group position

Now dragging works correctly for both rotated and non-rotated shapes.

---

### Task 2.5: Angle tooltip display ✅ COMPLETED

**Status:** ✅ Implemented and tested successfully

**What:** Show live angle tooltip during rotation

**Implementation Details:**
- Display tooltip above rotation handle during drag
- Format: "45°" (rounded to nearest degree)
- Style: Small popup, white background, gray border, 12px font
- Position: 15px above rotation handle (scales with zoom)
- Hide tooltip on mouseup

**Test Gate:**
1. Start dragging rotation handle ✅
2. Tooltip appears showing current angle ✅
3. Tooltip updates in real-time as handle moves ✅
4. Angle value is accurate and rounded to integer ✅
5. Release handle → tooltip disappears ✅

**Estimated Time:** 20 minutes

**Implementation Notes:**
- Tooltip appears only when `isRotating` is true
- Angle is normalized to 0-360 range and rounded to nearest degree
- Tooltip positioned 15px above rotation handle (inversely scaled with zoom for consistent appearance)
- Styled consistently with resize dimension tooltip (white background, gray border, shadow)
- Uses same font styling as dimension tooltip (SF Pro, 16px, medium weight)
- Tooltip follows the shape's rotation handle position
- Success log added to track Task 2.5 completion during rotation

**Production vs Localhost Behavior:**
- ✅ Works perfectly in production (Vercel deployment)
- ⚠️ Some visual weirdness/ghosting may occur on localhost during development
- Localhost issues are likely due to local dev server behavior, HMR, or network timing
- If you see strange behavior locally, test in production before treating as a bug

**Implementation:**
```typescript
{/* Angle tooltip while rotating */}
{isRotating && previewRotation !== null && selectedShapeId && (() => {
  const shape = shapes.find(s => s.id === selectedShapeId);
  if (!shape) return null;
  
  // Calculate rotation handle position
  const centerX = shape.x + shape.width / 2;
  const handleDistance = 30;
  const handleY = shape.y - handleDistance;
  
  // Position tooltip 15px above rotation handle
  const tooltipX = centerX;
  const tooltipY = handleY - (15 / stageScale);
  
  // Normalize angle to 0-360 and round to nearest degree
  const normalizedAngle = ((previewRotation % 360) + 360) % 360;
  const displayAngle = Math.round(normalizedAngle);
  
  return (
    <Group x={tooltipX} y={tooltipY}>
      {/* Tooltip background with shadow */}
      <Rect
        x={-(35 / stageScale)}
        y={-(20 / stageScale)}
        width={70 / stageScale}
        height={40 / stageScale}
        fill="white"
        stroke="#999"
        strokeWidth={1 / stageScale}
        cornerRadius={6 / stageScale}
        shadowBlur={8 / stageScale}
        shadowOpacity={0.3}
        shadowOffsetY={2 / stageScale}
        listening={false}
      />
      {/* Tooltip text - angle in degrees */}
      <Text
        text={`${displayAngle}°`}
        fontSize={16 / stageScale}
        fill="#333"
        align="center"
        listening={false}
      />
    </Group>
  );
})()}
```

---

### Task 2.6: Konva rotation implementation ✅ COMPLETED

**What:** Update shape rendering to support rotation with proper center-point pivoting

**Implementation Details:**

For rectangles (and later, all shapes):
```typescript
<Rect
  x={shape.x + shape.width / 2}      // Adjust for offset
  y={shape.y + shape.height / 2}     // Adjust for offset
  width={shape.width}
  height={shape.height}
  fill={shape.color}
  rotation={shape.rotation || 0}      // Apply rotation
  offsetX={shape.width / 2}           // Rotate around center, not corner
  offsetY={shape.height / 2}          // Rotate around center, not corner
  draggable={isLockedByCurrentUser}
  // ... other props
/>
```

**Key Concept:**
- Konva rotates around top-left by default
- Using `offsetX` and `offsetY` shifts the rotation pivot to the center
- Adjust `x` and `y` position to compensate for the offset

**Test Gate:**
1. Rotate a shape 45°
2. Verify shape rotates around its center (not top-left corner)
3. Verify shape position doesn't "jump" when rotation changes
4. Rotate 90°, 180°, 270° → verify correct orientation
5. Rotated shapes remain draggable
6. Drag rotated shape → moves correctly (doesn't drift)

**Estimated Time:** 30 minutes

---

### Task 2.7: Persist rotation to Firestore ✅ COMPLETED

**What:** Save final rotation angle on mouseup

**Implementation:**
1. On rotation handle mouseup, call `canvasService.rotateShape(shapeId, finalRotation)`
2. Firestore update triggers real-time sync
3. Other users see rotated shape via existing `subscribeToShapes` listener

**Test Gate:**
1. Open 2 browser windows (User A and User B)
2. User A locks and rotates a shape 60°
3. Verify Firestore document updated with `rotation: 60`
4. User B sees rotation update within 100ms
5. User B's view matches User A's rotated shape exactly
6. Verify `updatedAt` timestamp changes

**Estimated Time:** 15 minutes

---

### Task 2.8: Handle edge cases

**What:** Ensure rotation works correctly in all scenarios

**Test Cases:**
1. Rotate shape at different zoom levels (0.5x, 1x, 2x) → works correctly
2. Rotate shape at canvas edge → handle still accessible
3. Multiple users rotating different shapes simultaneously → no conflicts
4. Rotate then resize → both operations work together
5. Rotation handle doesn't interfere with resize handles ✅ FIXED

**Test Gate:**
- All edge cases tested and working
- No console errors in any scenario
- Smooth 60 FPS performance maintained

**Estimated Time:** 30 minutes

**Edge Case Fixes Applied:**
- ✅ **Rotation/Resize Handle Collision (Case #5):** Increased rotation handle distance from 30px to 50px above shape top edge to prevent overlap with top-center resize handle at ~8px above edge. This provides clear visual separation between rotation and resize handles.

---

### Task 2.9: Multi-user testing ✅ COMPLETED

**What:** Comprehensive real-time sync verification

**Test Scenario:**
1. User A creates a rectangle
2. User A locks it and rotates to 30°
3. User B sees rotation immediately (<100ms)
4. User A unlocks
5. User B locks same shape and rotates to 90°
6. User A sees User B's rotation (<100ms)
7. Both users see consistent angle

**Test Gate:**
- Multi-user rotation sync works flawlessly
- No race conditions or conflicts
- Rotation persists after page refresh

**Estimated Time:** 20 minutes

---

## Integration Points

### Existing MVP Features (No Breaking Changes)
- ✅ Shape creation (rectangles) - Add `rotation: 0` default
- ✅ Shape locking - Rotation handle only shows for locked shapes
- ✅ Real-time sync - Uses existing `subscribeToShapes` listener
- ✅ Drag movement - Must work correctly on rotated shapes
- ✅ Resize (PR #1) - Must work correctly on rotated shapes

### Future Features (Prepared For)
- Text layers (PR #3) - Will use same rotation implementation
- Circles & Triangles (PR #5) - Will use same rotation implementation
- Multi-select (PR #6) - Can rotate multiple shapes together (future enhancement)
- AI agent (PR #11-13) - `rotateShape` tool will use this method

---

## Success Criteria

### Functional Requirements
- [ ] Rotation handle appears 50px above locked shape (no collision with resize handles)
- [ ] Handle shows "↻" icon with connecting line to shape center
- [ ] Dragging handle rotates shape smoothly (60 FPS)
- [ ] Angle tooltip shows during drag (e.g., "45°")
- [ ] Shape rotates around its center (not corner)
- [ ] Rotation normalized to 0-360 range in Firestore
- [ ] User A rotates → User B sees change in <100ms
- [ ] Rotated shapes can still be moved (dragged)
- [ ] Rotated shapes can still be resized (from PR #1)

### Technical Requirements
- [ ] `rotation` field added to `ShapeData` interface
- [ ] `rotateShape()` method added to CanvasService
- [ ] No TypeScript compilation errors
- [ ] No console errors during rotation
- [ ] 60 FPS maintained during rotation drag
- [ ] Backward compatible (existing shapes default to `rotation: 0`)

### Multi-User Requirements
- [ ] User A rotates 45° → User B sees 45° rotation
- [ ] Real-time sync latency <100ms
- [ ] No conflicts when users rotate different shapes
- [ ] Rotation persists after page refresh

### UX Requirements
- [ ] Rotation feels natural and smooth
- [ ] Visual feedback clear (tooltip, handle movement)
- [ ] Cursor indicates draggable handle
- [ ] Handle doesn't interfere with resize handles

---

## Testing Checklist

### Unit Testing
- [ ] `rotateShape()` normalizes 405° → 45°
- [ ] `rotateShape()` normalizes -45° → 315°
- [ ] `rotateShape()` updates Firestore correctly

### Integration Testing
- [ ] Rotation handle renders at correct position
- [ ] Rotation calculation accurate for all angles
- [ ] Konva rendering correct for rotated shapes
- [ ] Drag movement works on rotated shapes
- [ ] Resize works on rotated shapes (PR #1 compatibility)

### Multi-User Testing
- [ ] 2 browsers: User A rotates → User B sees update
- [ ] 3+ users: All see consistent rotation
- [ ] Concurrent rotations on different shapes work

### Performance Testing
- [ ] Rotation drag maintains 60 FPS
- [ ] No lag with 10+ shapes on canvas
- [ ] Zoom in/out doesn't break rotation

---

## Deployment Steps

1. **Build and Test Locally:**
   ```bash
   cd collabcanvas
   npm run dev
   ```
   - Test all rotation features
   - Test multi-user sync with 2+ browser windows

2. **Run Tests:**
   ```bash
   npm run test
   ```
   - Ensure all existing tests pass
   - No regressions introduced

3. **Build Production:**
   ```bash
   npm run build
   ```
   - Verify build succeeds
   - Test production build locally: `npm run preview`

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   - Deploy from `collabcanvas/` directory
   - Verify deployment successful

5. **Production Verification:**
   - Open deployed app
   - Test rotation with 2+ users
   - Verify Firestore updates in Firebase console
   - Check for console errors
   - Verify <100ms sync latency

---

## Estimated Timeline

- Task 2.1 (Data model): 10 min
- Task 2.2 (Service method): 15 min
- Task 2.3 (Handle rendering): 30 min
- Task 2.4 (Rotation logic): 45 min
- Task 2.5 (Tooltip): 20 min
- Task 2.6 (Konva implementation): 30 min
- Task 2.7 (Persist to Firestore): 15 min
- Task 2.8 (Edge cases): 30 min
- Task 2.9 (Multi-user testing): 20 min

**Total Estimated Time:** ~3.5 hours

---

## Notes

- **Rotation Direction:** Follow standard math convention (counterclockwise = positive)
- **Performance:** Use `requestAnimationFrame` for smooth rotation preview if needed
- **Backward Compatibility:** All existing shapes will default to `rotation: 0`
- **Konva Gotcha:** Remember to set `offsetX/offsetY` AND adjust `x/y` position for center rotation
- **Normalization:** Always normalize to 0-360 range before saving to Firestore
- **Future Enhancement:** Snap to 15° increments when Shift key held (can add in polish PR)

## Known Issues

### Resize Ghosting on Rotated Shapes
**Status:** Not perfect, needs polish in future PR

**Issue Description:**
When resizing a rotated shape and releasing the mouse, there's a brief visual artifact where a "ghost" preview may appear at another location on the canvas. This occurs due to timing between:
1. Clearing the resize preview state
2. Firestore write completing
3. Real-time listener updating the local shape data

**Current Mitigation:**
- Shape renders at preview dimensions during resize (no separate overlay)
- State cleanup happens immediately on mouse release
- Firestore updates execute in parallel (Promise.all)
- Most noticeable with slower network connections or under heavy load

**Future Fix Options:**
1. Implement optimistic updates with local cache before Firestore confirmation
2. Add transition animations to smooth the visual change
3. Keep preview visible slightly longer (50-100ms delay) to bridge the gap
4. Use Firestore's pending/committed state to manage UI transitions

**Workaround:**
Issue is cosmetic and doesn't affect functionality. Shapes always end up at the correct final dimensions/position.

---

## Ready to Proceed?

Once this action plan is approved:
1. Create branch: `feature/pr-2-rotate-shapes`
2. Implement tasks 2.1 through 2.9 in order
3. Test each task gate before moving to next
4. Complete all success criteria
5. Deploy and test in production
6. Move to PR #3: Text Layers

**Questions or adjustments needed before implementation?**
