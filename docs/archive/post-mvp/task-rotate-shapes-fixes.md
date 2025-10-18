# Rotate Shapes Bug Fixes

## Overview

This document outlines critical bugs identified in PR #21 (Rotate Shapes feature) and provides detailed implementation tasks for fixing them. The original implementation can be found in `task-rotate-shapes.md`.

**PR Reference:** [PR #21 - Rotate Shapes](https://github.com/finessevanes/gauntlet-01/pull/21/)

## Bug Summary

9 critical bugs identified in the rotation feature implementation:

1. **Rotation Handle Positioning Bug** - Handle doesn't follow shape during drag
2. **Coordinate System Inconsistency** - Uses Firestore coords instead of visual coords
3. **Tooltip Positioning with Zoom** - Incorrect scaling at different zoom levels
4. **Race Condition Prevention** - Simultaneous rotation/resize operations
5. **Memory Leak in Shape References** - shapeNodesRef not cleaned up
6. **Inconsistent Handle Distance Constants** - Hardcoded values in multiple places
7. **Missing Error Handling** - No network error recovery
8. **Performance Issues** - Excessive forceUpdate calls
9. **Complex State Management** - Multiple useState calls for rotation state

## Priority Matrix

| Priority | Bug | Impact | Effort | Dependencies |
|----------|-----|--------|--------|--------------|
| **Critical** | #2 Coordinate System | High | Medium | None |
| **Critical** | #1 Handle Positioning | High | Low | #2 |
| **High** | #3 Tooltip Positioning | Medium | Low | #1 |
| **High** | #4 Race Conditions | Medium | Medium | None |
| **Medium** | #7 Error Handling | Medium | Low | None |
| **Medium** | #5 Memory Leak | Low | Low | None |
| **Low** | #6 Constants | Low | Low | None |
| **Low** | #8 Performance | Low | Medium | None |
| **Low** | #9 State Management | Low | High | None |

---

## Bug Documentation

### Bug 1: Rotation Handle Positioning Bug

**Location:** `Canvas.tsx` lines 1165-1226

**Description:** The rotation handle position is calculated using static shape coordinates but doesn't account for real-time shape movement during drag operations.

**Root Cause:** Uses `displayX`, `displayY` instead of real-time node position from `shapeNodesRef`.

**Impact:** Visual disconnect between handle and shape during drag operations.

**Code Snippet:**
```typescript
// BUG: Uses static coordinates, not real-time position
const centerX = displayX + displayWidth / 2;
const centerY = displayY + displayHeight / 2;
const handleY = displayY - handleDistance;
```

### Bug 2: Coordinate System Inconsistency

**Location:** `Canvas.tsx` lines 801-802 in `handleRotationMove`

**Description:** Rotation calculation uses Firestore coordinates instead of current visual position of the shape.

**Root Cause:** Uses `shape.x`, `shape.y` from Firestore instead of real-time node position.

**Impact:** Shape "jumps" or rotates around wrong point during drag operations.

**Code Snippet:**
```typescript
// BUG: Uses Firestore coordinates instead of current visual position
const centerX = shape.x + shape.width / 2;
const centerY = shape.y + shape.height / 2;
```

### Bug 3: Tooltip Positioning with Zoom

**Location:** `Canvas.tsx` lines 1340-1347

**Description:** Tooltip position calculation doesn't properly account for zoom scaling.

**Root Cause:** Inconsistent scaling factor application.

**Impact:** Tooltip appears at incorrect positions at different zoom levels.

**Code Snippet:**
```typescript
// BUG: Inconsistent scaling
const tooltipY = handleY - (15 / stageScale);
```

### Bug 4: Race Condition Between Operations

**Location:** Multiple locations in state management

**Description:** No prevention of simultaneous rotation and resize operations.

**Root Cause:** Missing state guards and operation locks.

**Impact:** State conflicts leading to visual artifacts or crashes.

### Bug 5: Memory Leak in Shape References

**Location:** `Canvas.tsx` lines 1077-1083

**Description:** `shapeNodesRef` Map is not properly cleaned up when shapes are deleted.

**Root Cause:** No cleanup effect or garbage collection.

**Impact:** Memory leaks over time with shape creation/deletion.

**Code Snippet:**
```typescript
// BUG: No cleanup when shapes are deleted
ref={(node) => {
  if (node) {
    shapeNodesRef.current.set(shape.id, node);
  } else {
    shapeNodesRef.current.delete(shape.id);
  }
}}
```

### Bug 6: Inconsistent Handle Distance Constants

**Location:** `Canvas.tsx` lines 1174 and 1342

**Description:** Handle distance is hardcoded in two places with same value (50px) but not synchronized.

**Root Cause:** Magic numbers instead of centralized constants.

**Impact:** Maintenance issues and potential inconsistencies.

### Bug 7: Missing Error Handling

**Location:** `Canvas.tsx` lines 821-842 in `handleRotationEnd`

**Description:** No error handling for network failures or Firestore errors during rotation.

**Root Cause:** Missing try-catch blocks and error recovery.

**Impact:** Silent failures and poor user experience.

### Bug 8: Performance Issues with Force Updates

**Location:** Multiple locations calling `forceUpdate()`

**Description:** `forceUpdate()` called too frequently during rotation operations.

**Root Cause:** No throttling or optimization of re-renders.

**Impact:** Performance issues on slower devices.

### Bug 9: Complex State Management

**Location:** `Canvas.tsx` lines 18-26

**Description:** Rotation state management is complex with multiple useState calls.

**Root Cause:** Not using consolidated state management pattern.

**Impact:** Harder to maintain and debug.

---

## Implementation Tasks

### Bug 1: Rotation Handle Positioning (4 subtasks)

- [ ] **Task 1.1:** Update handle position calculation to use real-time coordinates
  - **File:** `Canvas.tsx` lines 1165-1226
  - **Change:** Replace `displayX`, `displayY` with `shapeNode.x()`, `shapeNode.y()`
  - **Test:** Drag shape and verify handle follows in real-time
  - **Time:** 15 minutes

- [ ] **Task 1.2:** Add shapeNode position fallback logic
  - **File:** `Canvas.tsx` lines 1169-1172
  - **Change:** Add fallback to Firestore coordinates if node not available
  - **Test:** Test with newly created shapes before node ref is set
  - **Time:** 10 minutes

- [ ] **Task 1.3:** Test with drag + rotation combinations
  - **File:** Manual testing
  - **Change:** Verify handle stays connected during drag operations
  - **Test:** Drag shape while rotation handle is visible
  - **Time:** 20 minutes

- [ ] **Task 1.4:** Verify at different zoom levels
  - **File:** Manual testing
  - **Change:** Test handle positioning at MIN_ZOOM and MAX_ZOOM
  - **Test:** Zoom in/out and verify handle positioning
  - **Time:** 15 minutes

### Bug 2: Coordinate System Inconsistency (5 subtasks)

- [ ] **Task 2.1:** Refactor rotation calculation to use visual coordinates
  - **File:** `Canvas.tsx` lines 801-802
  - **Change:** Use `shapeNode.x()`, `shapeNode.y()` instead of `shape.x`, `shape.y`
  - **Test:** Rotate shape during active drag
  - **Time:** 20 minutes

- [ ] **Task 2.2:** Update center point calculation in handleRotationMove
  - **File:** `Canvas.tsx` lines 800-802
  - **Change:** Get real-time center from node position
  - **Test:** Verify rotation center stays consistent during drag
  - **Time:** 15 minutes

- [ ] **Task 2.3:** Ensure consistency between drag and rotation states
  - **File:** `Canvas.tsx` lines 429-505
  - **Change:** Use same coordinate system for both operations
  - **Test:** Switch between drag and rotation smoothly
  - **Time:** 25 minutes

- [ ] **Task 2.4:** Add coordinate system validation
  - **File:** `Canvas.tsx` new function
  - **Change:** Add validation to ensure coordinates are valid
  - **Test:** Test with edge cases (negative coordinates, etc.)
  - **Time:** 20 minutes

- [ ] **Task 2.5:** Test rotation during active drag
  - **File:** Manual testing
  - **Change:** Comprehensive testing of coordinate consistency
  - **Test:** Start drag, then rotate, verify no jumping
  - **Time:** 30 minutes

### Bug 3: Tooltip Positioning with Zoom (3 subtasks)

- [ ] **Task 3.1:** Fix tooltip scaling calculations
  - **File:** `Canvas.tsx` lines 1346-1347
  - **Change:** Apply consistent scaling factor to tooltip distance
  - **Test:** Verify tooltip distance at different zoom levels
  - **Time:** 15 minutes

- [ ] **Task 3.2:** Make tooltip distance responsive to zoom
  - **File:** `Canvas.tsx` lines 1357-1360
  - **Change:** Scale tooltip size and position with zoom
  - **Test:** Test tooltip appearance at 0.5x and 2x zoom
  - **Time:** 20 minutes

- [ ] **Task 3.3:** Test at MIN_ZOOM and MAX_ZOOM levels
  - **File:** Manual testing
  - **Change:** Verify tooltip positioning at zoom limits
  - **Test:** Test at 0.1x and 3x zoom levels
  - **Time:** 15 minutes

### Bug 4: Race Condition Prevention (4 subtasks)

- [ ] **Task 4.1:** Add state guards to prevent simultaneous operations
  - **File:** `Canvas.tsx` lines 748, 508
  - **Change:** Add checks for `isRotating` and `isResizing` states
  - **Test:** Try to start rotation while resizing
  - **Time:** 20 minutes

- [ ] **Task 4.2:** Implement operation lock mechanism
  - **File:** `Canvas.tsx` new state variable
  - **Change:** Add `activeOperation` state to track current operation
  - **Test:** Verify only one operation can be active
  - **Time:** 25 minutes

- [ ] **Task 4.3:** Add warning logs for state conflicts
  - **File:** `Canvas.tsx` multiple locations
  - **Change:** Add console.warn when conflicts detected
  - **Test:** Check console for conflict warnings
  - **Time:** 10 minutes

- [ ] **Task 4.4:** Test rapid switching between rotation/resize
  - **File:** Manual testing
  - **Change:** Stress test rapid operation switching
  - **Test:** Rapidly click between rotation and resize handles
  - **Time:** 20 minutes

### Bug 5: Memory Leak Fix (3 subtasks)

- [ ] **Task 5.1:** Add cleanup effect for shapeNodesRef
  - **File:** `Canvas.tsx` new useEffect
  - **Change:** Add cleanup on component unmount
  - **Test:** Verify no memory leaks in dev tools
  - **Time:** 15 minutes

- [ ] **Task 5.2:** Implement periodic garbage collection check
  - **File:** `Canvas.tsx` new function
  - **Change:** Remove references to deleted shapes
  - **Test:** Create/delete many shapes and check memory
  - **Time:** 20 minutes

- [ ] **Task 5.3:** Add deleted shapes cleanup logic
  - **File:** `Canvas.tsx` lines 1077-1083
  - **Change:** Clean up refs when shapes are removed
  - **Test:** Delete shapes and verify refs are cleaned
  - **Time:** 15 minutes

### Bug 6: Centralize Constants (2 subtasks)

- [ ] **Task 6.1:** Extract ROTATION_HANDLE_DISTANCE constant
  - **File:** `Canvas.tsx` top of component
  - **Change:** Add `const ROTATION_HANDLE_DISTANCE = 50;`
  - **Test:** Verify constant is used consistently
  - **Time:** 10 minutes

- [ ] **Task 6.2:** Update all references to use constant
  - **File:** `Canvas.tsx` lines 1174, 1342
  - **Change:** Replace hardcoded 50 with constant
  - **Test:** Verify no hardcoded values remain
  - **Time:** 5 minutes

### Bug 7: Error Handling (4 subtasks)

- [ ] **Task 7.1:** Add try-catch to handleRotationEnd
  - **File:** `Canvas.tsx` lines 821-842
  - **Change:** Wrap Firestore call in try-catch
  - **Test:** Simulate network failure during rotation
  - **Time:** 15 minutes

- [ ] **Task 7.2:** Implement network error recovery
  - **File:** `Canvas.tsx` error handling
  - **Change:** Retry logic for failed rotation updates
  - **Test:** Test with slow/unstable network
  - **Time:** 25 minutes

- [ ] **Task 7.3:** Add user-facing error messages
  - **File:** `Canvas.tsx` error handling
  - **Change:** Show toast notifications for errors
  - **Test:** Verify error messages appear to user
  - **Time:** 20 minutes

- [ ] **Task 7.4:** Test with offline/slow network
  - **File:** Manual testing
  - **Change:** Test error handling scenarios
  - **Test:** Disable network during rotation
  - **Time:** 20 minutes

### Bug 8: Performance Optimization (3 subtasks)

- [ ] **Task 8.1:** Throttle forceUpdate calls during rotation
  - **File:** `Canvas.tsx` lines 817, 302
  - **Change:** Use requestAnimationFrame for forceUpdate
  - **Test:** Monitor performance during rotation
  - **Time:** 20 minutes

- [ ] **Task 8.2:** Use requestAnimationFrame for smooth updates
  - **File:** `Canvas.tsx` rotation handlers
  - **Change:** Batch updates using RAF
  - **Test:** Verify smooth 60fps rotation
  - **Time:** 25 minutes

- [ ] **Task 8.3:** Add performance monitoring
  - **File:** `Canvas.tsx` new function
  - **Change:** Add performance metrics logging
  - **Test:** Monitor frame rate during operations
  - **Time:** 15 minutes

### Bug 9: State Management Simplification (4 subtasks)

- [ ] **Task 9.1:** Consolidate rotation state into single object
  - **File:** `Canvas.tsx` lines 18-26
  - **Change:** Combine rotation states into one object
  - **Test:** Verify all rotation functionality works
  - **Time:** 30 minutes

- [ ] **Task 9.2:** Reduce number of useState calls
  - **File:** `Canvas.tsx` state declarations
  - **Change:** Merge related states
  - **Test:** Verify state updates work correctly
  - **Time:** 25 minutes

- [ ] **Task 9.3:** Implement useReducer pattern
  - **File:** `Canvas.tsx` state management
  - **Change:** Use useReducer for complex state
  - **Test:** Verify state transitions work
  - **Time:** 40 minutes

- [ ] **Task 9.4:** Refactor for better maintainability
  - **File:** `Canvas.tsx` overall structure
  - **Change:** Extract rotation logic into custom hook
  - **Test:** Verify no regressions
  - **Time:** 45 minutes

---

## Testing Checklist

### Unit Tests
- [ ] Test rotation handle positioning with real-time coordinates
- [ ] Test coordinate system consistency during drag operations
- [ ] Test tooltip positioning at different zoom levels
- [ ] Test state conflict prevention
- [ ] Test memory cleanup on shape deletion
- [ ] Test error handling for network failures
- [ ] Test performance optimization effectiveness

### Integration Tests
- [ ] Test rotation + drag combination
- [ ] Test rotation + resize combination
- [ ] Test multi-user rotation sync
- [ ] Test rotation at canvas boundaries
- [ ] Test rotation with different shape sizes
- [ ] Test rotation with rapid user interactions

### Multi-User Scenarios
- [ ] User A rotates while User B drags same shape
- [ ] Multiple users rotating different shapes simultaneously
- [ ] User rotates shape while another user resizes it
- [ ] Network interruption during rotation
- [ ] User joins during active rotation

### Edge Cases
- [ ] Rotate shape at canvas edge
- [ ] Rotate very small shapes (10x10px)
- [ ] Rotate very large shapes (near canvas size)
- [ ] Rotate at maximum zoom level
- [ ] Rotate at minimum zoom level
- [ ] Rapid rotation direction changes
- [ ] Rotation with locked shapes
- [ ] Rotation during shape creation

---

## Deployment Strategy

### Implementation Order
1. **Phase 1 (Critical):** Bugs #2, #1 - Coordinate system and handle positioning
2. **Phase 2 (High):** Bugs #3, #4 - Tooltip positioning and race conditions
3. **Phase 3 (Medium):** Bugs #7, #5 - Error handling and memory leaks
4. **Phase 4 (Low):** Bugs #6, #8, #9 - Constants, performance, state management

### Regression Testing
- [ ] Test all existing shape operations (create, drag, resize, lock)
- [ ] Test multi-user collaboration features
- [ ] Test zoom and pan functionality
- [ ] Test shape selection and locking
- [ ] Test canvas boundary constraints

### Rollback Plan
- [ ] Keep original rotation implementation as backup branch
- [ ] Implement feature flags for rotation functionality
- [ ] Monitor error rates and performance metrics
- [ ] Have quick rollback procedure documented
- [ ] Test rollback procedure in staging environment

### Success Metrics
- [ ] Zero visual artifacts during rotation
- [ ] <100ms rotation sync latency between users
- [ ] 60fps performance during rotation operations
- [ ] No memory leaks after extended use
- [ ] <1% error rate for rotation operations
- [ ] All existing functionality remains intact

---

## Notes

- **Total Estimated Time:** ~15-20 hours across all tasks
- **Critical Path:** Bugs #2 → #1 → #3 (coordinate system fixes)
- **Risk Areas:** State management changes (#9) and performance optimization (#8)
- **Testing Focus:** Multi-user scenarios and edge cases
- **Documentation:** Update original task document after fixes are complete
