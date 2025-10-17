# PR 3 Action Plan: Add Circle & Triangle Shapes

## Phase 1: Data Model & Service Layer
- [x] Update `Shape` interface in `canvasService.ts` to support `type: 'circle' | 'rectangle' | 'triangle'`
- [x] Add optional `radius` field to Shape interface for circles
- [x] Update `CreateShapeData` interface to include new shape types
- [x] Add `createCircle(projectId, x, y, radius, color, createdBy)` method
- [x] Add `createTriangle(projectId, x, y, width, height, color, createdBy)` method
- [x] Add `resizeCircle(projectId, shapeId, radius)` method
- [x] Update `validateShapeBounds()` to handle circle radius validation
- [x] Update `clampShapeToCanvas()` to handle circle radius clamping
- [x] Add minimum size validation (5px radius for circles, 10x10 for triangles)

## Phase 2: Context & State Management
- [x] Add `activeTool` state to `CanvasContext.tsx`: `'rectangle' | 'circle' | 'triangle'`
- [x] Add `setActiveTool` function to context API
- [x] Update `finishDrawing()` to create shapes based on active tool
- [x] Update drawing logic to calculate circle radius from drag distance
- [x] Update drawing logic to calculate triangle bounding box from drag
- [x] Add circle radius calculation utility function
- [x] Add triangle vertex calculation utility function

## Phase 3: Toolbar UI
- [x] Add Rectangle tool button to `ColorToolbar.tsx`
- [x] Add Circle tool button to `ColorToolbar.tsx`
- [x] Add Triangle tool button to `ColorToolbar.tsx`
- [x] Add active state styling for selected tool
- [x] Show shape tools only when in "Create" mode
- [x] Add tool icons/emojis for visual clarity
- [x] Add tooltips for each shape tool

## Phase 4: Canvas Rendering
- [x] Import Konva `Circle` component in `Canvas.tsx`
- [x] Update shape rendering loop to handle all 3 types
- [x] Implement rectangle rendering (existing logic)
- [x] Implement circle rendering with `<Circle>` component
- [x] Implement triangle rendering with `<Line>` component and closed path
- [x] Add triangle vertex calculation (equilateral, pointing upward)
- [x] Update resize handle logic for different shape types
- [x] Implement 8-handle system for rectangles and triangles
- [x] Implement 4-handle system for circles (T, B, L, R)
- [x] Update resize preview rendering for all shape types
- [x] Update dimension tooltip to show radius for circles
- [x] Update dimension tooltip to show width×height for triangles

## Phase 5: Resize Logic Implementation
- [x] Update `handleResizeStart()` to detect shape type
- [x] Implement circle resize logic (radius-based, proportional)
- [x] Update triangle resize logic (8-handle system)
- [x] Maintain existing rectangle resize logic
- [x] Add minimum size enforcement for all shape types
- [x] Update resize preview for circles (show radius change)
- [x] Update resize preview for triangles (show dimension change)
- [x] Handle edge cases (very small shapes, canvas boundaries)

## Phase 6: Rotation & Movement
- [x] Test rotation with circles (should work with existing logic)
- [x] Test rotation with triangles (should work with existing logic)
- [x] Update rotation handle positioning for all shape types
- [x] Test movement/dragging for all shape types
- [x] Update boundary clamping for circles (radius-based)
- [x] Update boundary clamping for triangles (bounding box-based)

## Phase 7: Locking & Collaboration
- [x] Test shape locking for all shape types
- [x] Test real-time collaboration for circles
- [x] Test real-time collaboration for triangles
- [x] Verify lock status indicators work for new shapes
- [x] Test lock timeout behavior for new shapes
- [x] Test unlock functionality for new shapes

## Phase 8: Testing & Validation
- [x] Test circle creation with minimum radius (5px)
- [x] Test triangle creation with minimum size (10x10)
- [x] Test resize for all shape types with lock/unlock
- [x] Test rotation for circles and triangles
- [x] Test boundary constraints for all shapes
- [x] Test very small shape creation (edge cases)
- [x] Test shape creation at canvas boundaries
- [x] Test multi-user collaboration with new shapes
- [x] Test shape deletion and canvas clearing
- [x] Test undo/redo functionality (if applicable)

## Phase 9: Error Handling & Polish
- [x] Add error handling for invalid shape creation
- [x] Add error handling for resize operations
- [x] Add user feedback for minimum size violations
- [x] Add user feedback for boundary violations
- [x] Test error recovery scenarios
- [x] Add console logging for debugging
- [x] Verify all shapes render correctly at all zoom levels
- [x] Test performance with many shapes of different types

## Phase 10: Documentation & Cleanup
- [x] Update code comments for new shape types
- [x] Add JSDoc comments for new methods
- [x] Update type definitions if needed
- [x] Remove any unused code or imports
- [x] Verify TypeScript compilation without errors
- [x] Test in different browsers
- [x] Update any relevant documentation

## Success Criteria Checklist
- [x] Users can select Circle and Triangle tools from toolbar
- [x] Drag-to-create works for all 3 shape types
- [x] Circles resize proportionally with 4 handles
- [x] Triangles resize with 8 handles (proportional corners, single-dimension edges)
- [x] All shapes support move, rotate, and lock operations
- [x] Real-time collaboration works for new shape types
- [x] Minimum size validation enforced (5px radius for circles, 10x10 for triangles)
- [x] Shapes render correctly at all rotation angles
- [x] No TypeScript errors
- [x] No console errors during normal operation
- [x] All existing functionality still works
