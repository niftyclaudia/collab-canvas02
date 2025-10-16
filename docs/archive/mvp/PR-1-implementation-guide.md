# PR #1 Implementation Guide: Resize Shapes + Additional Shape Types

**Branch:** `feature/resize-and-shape-types`  
**Time Estimate:** 5 hours  
**Goal:** Add 8-handle resize system for all shapes + Circle and Triangle creation

---

## 📋 Overview

This PR combines two related features:
1. **Resize System**: 8-handle resize UI (corners for proportional, edges for single-dimension)
2. **Additional Shapes**: Circle and Triangle shape types with creation tools

**Why combine these?** Both features extend the shape system and share common infrastructure. Circles need special resize handling (radius), so implementing the resize system alongside additional shapes is efficient.

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ 8 resize handles appear on locked shapes (4 corners + 4 edges)
- ✅ Corner handles resize proportionally (maintain aspect ratio)
- ✅ Edge handles resize single dimension only
- ✅ Dimension tooltip shows "W × H" during resize
- ✅ Minimum size validation (10×10 for rectangles/triangles, 5px radius for circles)
- ✅ Circles can be created by click-and-drag (shows radius preview)
- ✅ Triangles can be created by click-and-drag (bounding box method)
- ✅ All shapes render correctly with Konva
- ✅ Real-time sync: User B sees User A's resizes and new shapes in <100ms

### Performance Requirements
- ✅ 60 FPS during resize operations
- ✅ Handles render smoothly without lag
- ✅ Works with 20+ shapes on canvas

---

## 🏗️ Architecture Overview

### Files to Modify
1. `app/src/services/canvasService.ts` - Add resize methods and new shape creation
2. `app/src/components/Canvas/Canvas.tsx` - Add Konva rendering for circles/triangles
3. `app/src/components/Canvas/ColorToolbar.tsx` - Add circle/triangle buttons
4. `app/src/contexts/CanvasContext.tsx` - Update activeTool type

### Files to Create
1. `app/src/components/Canvas/ResizeHandles.tsx` - New component for resize UI
2. `app/src/components/Canvas/RotationHandle.tsx` - Placeholder for PR #2 (optional)

### Data Model Changes

**Update Shape interface:**
```typescript
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';  // UPDATED: Add circle and triangle
  x: number;
  y: number;
  // Rectangle and Triangle fields
  width?: number;
  height?: number;
  // Circle fields
  radius?: number;
  // Common fields
  color: string;
  createdBy: string;
  createdAt: Timestamp;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
  updatedAt: Timestamp;
}
```

---

## 📝 Step-by-Step Implementation

### PART 1: Extend CanvasService for Resize (1.5 hours)

#### Step 1.1: Add resizeShape() method

**Location:** `app/src/services/canvasService.ts`

Add this method to the `CanvasService` class:

```typescript
/**
 * Resize a shape (rectangles and triangles)
 * @param shapeId - ID of the shape to resize
 * @param width - New width in pixels
 * @param height - New height in pixels
 */
async resizeShape(shapeId: string, width: number, height: number): Promise<void> {
  try {
    // Validate minimum size
    if (width < 10 || height < 10) {
      throw new Error('Minimum size is 10×10 pixels');
    }

    const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
    
    await updateDoc(shapeDocRef, {
      width: width,
      height: height,
      updatedAt: serverTimestamp() as Timestamp,
    });

    console.log('✅ Shape resized successfully:', shapeId, `to ${width}×${height}`);
  } catch (error) {
    console.error('❌ Error resizing shape:', error);
    throw error;
  }
}
```

**Testing Step 1.1:**
```javascript
// In browser console:
import { canvasService } from './services/canvasService';

// Test 1: Valid resize
await canvasService.resizeShape("shape_1760571825183_vr0o43kjm", 200, 150);
// → Check Firestore: width=200, height=150, updatedAt updated

// Test 2: Minimum size validation
await canvasService.resizeShape('shape-id-here', 5, 5);
// → Should throw error: "Minimum size is 10×10 pixels"
```

#### Step 1.2: Add resizeCircle() method

```typescript
/**
 * Resize a circle by changing its radius
 * @param shapeId - ID of the circle to resize
 * @param radius - New radius in pixels
 */
async resizeCircle(shapeId: string, radius: number): Promise<void> {
  try {
    // Validate minimum radius
    if (radius < 5) {
      throw new Error('Minimum radius is 5 pixels');
    }

    const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
    
    await updateDoc(shapeDocRef, {
      radius: radius,
      updatedAt: serverTimestamp() as Timestamp,
    });

    console.log('✅ Circle resized successfully:', shapeId, `to radius ${radius}`);
  } catch (error) {
    console.error('❌ Error resizing circle:', error);
    throw error;
  }
}
```

#### Step 1.3: Add createCircle() method

```typescript
/**
 * Create a new circle on the canvas
 */
async createCircle(circleData: {
  x: number;
  y: number;
  radius: number;
  color: string;
  createdBy: string;
}): Promise<Shape> {
  try {
    const shapeId = this.generateShapeId();
    const now = serverTimestamp() as Timestamp;
    
    const circle: Omit<Shape, 'id'> = {
      type: 'circle',
      x: circleData.x,
      y: circleData.y,
      radius: circleData.radius,
      color: circleData.color,
      createdBy: circleData.createdBy,
      createdAt: now,
      updatedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await setDoc(shapeDocRef, circle);

    console.log('✅ Circle created successfully:', shapeId);

    return {
      id: shapeId,
      ...circle,
    } as Shape;
  } catch (error) {
    console.error('❌ Error creating circle:', error);
    throw error;
  }
}
```

**Testing Step 1.3:**
```javascript
// Test circle creation
await canvasService.createCircle({
  x: 500,
  y: 500,
  radius: 50,
  color: '#3b82f6',
  createdBy: 'user-id-here'
});
// → Check Firestore: Circle document created with type='circle', radius=50
```

#### Step 1.4: Add createTriangle() method

```typescript
/**
 * Create a new triangle on the canvas
 */
async createTriangle(triangleData: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
}): Promise<Shape> {
  try {
    const shapeId = this.generateShapeId();
    const now = serverTimestamp() as Timestamp;
    
    const triangle: Omit<Shape, 'id'> = {
      type: 'triangle',
      x: triangleData.x,
      y: triangleData.y,
      width: triangleData.width,
      height: triangleData.height,
      color: triangleData.color,
      createdBy: triangleData.createdBy,
      createdAt: now,
      updatedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await setDoc(shapeDocRef, triangle);

    console.log('✅ Triangle created successfully:', shapeId);

    return {
      id: shapeId,
      ...triangle,
    } as Shape;
  } catch (error) {
    console.error('❌ Error creating triangle:', error);
    throw error;
  }
}
```

**Testing Step 1.4:**
```javascript
// Test triangle creation
await canvasService.createTriangle({
  x: 700,
  y: 300,
  width: 100,
  height: 100,
  color: '#ef4444',
  createdBy: 'user-id-here'
});
// → Check Firestore: Triangle document created with type='triangle'
```

---

### PART 2: Build Resize Handle System (2 hours)

#### Step 2.1: Create ResizeHandles component

**Create file:** `app/src/components/Canvas/ResizeHandles.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { Shape } from '../../services/canvasService';

interface ResizeHandlesProps {
  shape: Shape;
  onResize: (width: number, height: number) => void;
  onResizeEnd: (width: number, height: number) => void;
}

export function ResizeHandles({ shape, onResize, onResizeEnd }: ResizeHandlesProps) {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSize, setCurrentSize] = useState({ width: shape.width || 0, height: shape.height || 0 });

  // Handle positions for rectangles and triangles
  const handleSize = 8;
  const hoveredHandleSize = 10;

  // Only show handles for shapes with width/height (not circles)
  if (shape.type === 'circle') {
    return null; // Circle handles implemented separately
  }

  const width = shape.width || 0;
  const height = shape.height || 0;

  // Calculate handle positions
  const handles = [
    { id: 'tl', x: shape.x, y: shape.y, cursor: 'nwse-resize' },
    { id: 't', x: shape.x + width / 2, y: shape.y, cursor: 'ns-resize' },
    { id: 'tr', x: shape.x + width, y: shape.y, cursor: 'nesw-resize' },
    { id: 'l', x: shape.x, y: shape.y + height / 2, cursor: 'ew-resize' },
    { id: 'r', x: shape.x + width, y: shape.y + height / 2, cursor: 'ew-resize' },
    { id: 'bl', x: shape.x, y: shape.y + height, cursor: 'nesw-resize' },
    { id: 'b', x: shape.x + width / 2, y: shape.y + height, cursor: 'ns-resize' },
    { id: 'br', x: shape.x + width, y: shape.y + height, cursor: 'nwse-resize' },
  ];

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: any, handleId: string) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    let newWidth = width;
    let newHeight = height;

    // Calculate new dimensions based on handle position
    switch (handleId) {
      case 'tl': // Top-left corner (proportional)
        newWidth = shape.x + width - newX;
        newHeight = shape.y + height - newY;
        break;
      case 't': // Top edge (height only)
        newHeight = shape.y + height - newY;
        break;
      case 'tr': // Top-right corner (proportional)
        newWidth = newX - shape.x;
        newHeight = shape.y + height - newY;
        break;
      case 'l': // Left edge (width only)
        newWidth = shape.x + width - newX;
        break;
      case 'r': // Right edge (width only)
        newWidth = newX - shape.x;
        break;
      case 'bl': // Bottom-left corner (proportional)
        newWidth = shape.x + width - newX;
        newHeight = newY - shape.y;
        break;
      case 'b': // Bottom edge (height only)
        newHeight = newY - shape.y;
        break;
      case 'br': // Bottom-right corner (proportional)
        newWidth = newX - shape.x;
        newHeight = newY - shape.y;
        break;
    }

    // Enforce minimum size
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);

    setCurrentSize({ width: newWidth, height: newHeight });
    onResize(newWidth, newHeight);
  }, [shape, width, height, onResize]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onResizeEnd(currentSize.width, currentSize.height);
  }, [currentSize, onResizeEnd]);

  return (
    <Group>
      {/* Render resize handles */}
      {handles.map((handle) => {
        const isHovered = hoveredHandle === handle.id;
        const size = isHovered ? hoveredHandleSize : handleSize;
        
        return (
          <Rect
            key={handle.id}
            x={handle.x - size / 2}
            y={handle.y - size / 2}
            width={size}
            height={size}
            fill={isHovered ? '#3b82f6' : 'white'}
            stroke="#666"
            strokeWidth={2}
            draggable
            onMouseEnter={() => setHoveredHandle(handle.id)}
            onMouseLeave={() => setHoveredHandle(null)}
            onDragStart={handleDragStart}
            onDragMove={(e) => handleDragMove(e, handle.id)}
            onDragEnd={handleDragEnd}
          />
        );
      })}

      {/* Dimension tooltip during resize */}
      {isDragging && (
        <Text
          x={shape.x + width / 2 - 30}
          y={shape.y - 25}
          text={`${Math.round(currentSize.width)} × ${Math.round(currentSize.height)}`}
          fontSize={14}
          fill="black"
          padding={5}
          align="center"
        />
      )}
    </Group>
  );
}
```

**Testing Step 2.1:**
1. Import ResizeHandles in Canvas.tsx
2. Add `<ResizeHandles>` when shape is locked by current user
3. Lock a shape → 8 handles should appear at corners and edges
4. Hover over handle → Should scale to 10×10px and turn blue
5. Drag corner handle → Shape should resize proportionally
6. Drag edge handle → Only one dimension should change
7. Tooltip should show "W × H" during drag

---

### PART 3: Add Circle and Triangle Rendering (1.5 hours)

#### Step 3.1: Update Canvas.tsx rendering

**Location:** `app/src/components/Canvas/Canvas.tsx`

First, add Circle and Line imports:
```typescript
import { Stage, Layer, Rect, Line, Text, Circle } from 'react-konva';
```

Then, update the shape rendering logic (around line 560):

```typescript
{shapes.map((shape) => {
  const lockStatus = getShapeLockStatus(shape);
  
  // Visual styling based on lock status
  let strokeColor = shape.color;
  let strokeWidth = 2;
  let opacity = 1;
  let isDraggable = false;
  
  if (lockStatus === 'locked-by-me') {
    strokeColor = '#10b981'; // Green border
    strokeWidth = 3;
    isDraggable = true;
  } else if (lockStatus === 'locked-by-other') {
    strokeColor = '#ef4444'; // Red border
    strokeWidth = 3;
    opacity = 0.5;
  }
  
  return (
    <React.Fragment key={shape.id}>
      {/* Render based on shape type */}
      {shape.type === 'rectangle' && (
        <Rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          draggable={isDraggable}
          onClick={(e) => handleShapeClick(e, shape)}
          onDragMove={(e) => handleShapeDragMove(e, shape)}
          onDragEnd={(e) => handleShapeDragEnd(e, shape)}
          listening={lockStatus !== 'locked-by-other'}
        />
      )}
      
      {/* Render Circle */}
      {shape.type === 'circle' && (
        <Circle
          x={shape.x}
          y={shape.y}
          radius={shape.radius || 50}
          fill={shape.color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          draggable={isDraggable}
          onClick={(e) => handleShapeClick(e, shape)}
          onDragMove={(e) => handleShapeDragMove(e, shape)}
          onDragEnd={(e) => handleShapeDragEnd(e, shape)}
          listening={lockStatus !== 'locked-by-other'}
        />
      )}
      
      {/* Render Triangle */}
      {shape.type === 'triangle' && (() => {
        // Calculate triangle points from bounding box
        const topX = shape.x + (shape.width || 0) / 2;
        const topY = shape.y;
        const bottomLeftX = shape.x;
        const bottomLeftY = shape.y + (shape.height || 0);
        const bottomRightX = shape.x + (shape.width || 0);
        const bottomRightY = shape.y + (shape.height || 0);
        
        return (
          <Line
            points={[topX, topY, bottomLeftX, bottomLeftY, bottomRightX, bottomRightY]}
            closed
            fill={shape.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            draggable={isDraggable}
            onClick={(e) => handleShapeClick(e, shape)}
            onDragMove={(e) => handleShapeDragMove(e, shape)}
            onDragEnd={(e) => handleShapeDragEnd(e, shape)}
            listening={lockStatus !== 'locked-by-other'}
          />
        );
      })()}
      
      {/* Lock icon for shapes locked by others */}
      {lockStatus === 'locked-by-other' && (
        <Text
          x={shape.x + (shape.width || shape.radius || 50) - 20}
          y={shape.y + 5}
          text="🔒"
          fontSize={16}
          listening={false}
        />
      )}
      
      {/* Resize handles for locked shapes */}
      {lockStatus === 'locked-by-me' && shape.type !== 'circle' && (
        <ResizeHandles
          shape={shape}
          onResize={(width, height) => {
            // Update local preview (optional - can skip for simplicity)
          }}
          onResizeEnd={async (width, height) => {
            try {
              await canvasService.resizeShape(shape.id, width, height);
            } catch (error) {
              console.error('Failed to resize shape:', error);
            }
          }}
        />
      )}
    </React.Fragment>
  );
})}
```

**Testing Step 3.1:**
1. Manually create a circle in Firestore with type='circle', x=500, y=500, radius=50
2. Circle should render on canvas
3. Create a triangle with type='triangle', x=700, y=300, width=100, height=100
4. Triangle should render pointing upward
5. Both shapes should be draggable when locked

#### Step 3.2: Add Shape Creation Buttons to Toolbar

**Location:** `app/src/components/Canvas/ColorToolbar.tsx`

Add circle and triangle buttons:

```typescript
// Add to toolbar (before color buttons)
<div className="shape-tools">
  <button
    className={`tool-button ${activeTool === 'rectangle' ? 'active' : ''}`}
    onClick={() => setActiveTool('rectangle')}
    title="Rectangle"
  >
    ⬜
  </button>
  
  <button
    className={`tool-button ${activeTool === 'circle' ? 'active' : ''}`}
    onClick={() => setActiveTool('circle')}
    title="Circle"
  >
    ⭕
  </button>
  
  <button
    className={`tool-button ${activeTool === 'triangle' ? 'active' : ''}`}
    onClick={() => setActiveTool('triangle')}
    title="Triangle"
  >
    🔺
  </button>
</div>
```

Update CanvasContext to include circle and triangle in activeTool type:

```typescript
// In CanvasContext.tsx
type ActiveTool = 'rectangle' | 'circle' | 'triangle' | 'text' | 'pan';
```

#### Step 3.3: Implement Circle Creation (Click & Drag)

**Location:** `app/src/hooks/useCanvas.ts` or Canvas.tsx

Add circle creation logic:

```typescript
// When activeTool === 'circle', handle mousedown differently
if (mode === 'create' && activeTool === 'circle') {
  const handleCircleDrag = (currentPos: { x: number; y: number }) => {
    // Calculate radius from start point to current mouse
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update preview
    setPreviewCircle({ 
      x: startPos.x, 
      y: startPos.y, 
      radius: Math.max(5, radius) 
    });
  };
  
  const handleCircleEnd = async () => {
    if (previewCircle && previewCircle.radius >= 5) {
      await canvasService.createCircle({
        x: previewCircle.x,
        y: previewCircle.y,
        radius: previewCircle.radius,
        color: selectedColor,
        createdBy: currentUserId,
      });
    }
  };
}
```

**Testing Step 3.3:**
1. Click Circle button in toolbar
2. Click and drag on canvas
3. Green outline circle should appear and grow with mouse
4. Release → Circle should persist
5. Check Firestore → Circle document created

#### Step 3.4: Implement Triangle Creation (Bounding Box)

Similar to rectangle creation, but create triangle shape:

```typescript
// When activeTool === 'triangle'
const handleTriangleEnd = async (startPos, endPos) => {
  const rect = canvasService.normalizeRectangle(startPos.x, startPos.y, endPos.x, endPos.y);
  
  if (rect.width >= 10 && rect.height >= 10) {
    await canvasService.createTriangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: selectedColor,
      createdBy: currentUserId,
    });
  }
};
```

**Testing Step 3.4:**
1. Click Triangle button
2. Click and drag bounding box
3. Preview triangle should appear
4. Release → Triangle persists
5. Check Firestore → Triangle document created

---

## 🧪 Testing Guide (Gatekeeper Section)

### Pre-Deployment Testing (Local)

#### Test 1: Resize Handles
1. Create a rectangle
2. Click to lock it
3. ✅ Verify 8 handles appear (4 corners + 4 edges)
4. Hover over handle → ✅ Should scale to 10×10px and turn blue
5. Drag bottom-right corner → ✅ Shape resizes proportionally
6. Drag right edge → ✅ Only width changes
7. Drag bottom edge → ✅ Only height changes
8. During drag → ✅ Tooltip shows "W × H"
9. Try to resize below 10×10 → ✅ Should enforce minimum and show error

#### Test 2: Circle Creation
1. Click Circle button in toolbar → ✅ Button highlights
2. Click on canvas and drag
3. ✅ Green outline circle appears
4. ✅ Circle grows from center point as you drag
5. Release mouse → ✅ Circle persists
6. Open Firestore console → ✅ Circle document exists with type='circle', radius field
7. Try creating tiny circle (< 5px radius) → ✅ Should enforce minimum

#### Test 3: Triangle Creation
1. Click Triangle button → ✅ Button highlights
2. Click and drag bounding box
3. ✅ Green outline triangle appears pointing upward
4. Release → ✅ Triangle persists
5. Firestore → ✅ Triangle document exists with type='triangle', width, height

#### Test 4: All Shape Types Render
1. Create 1 rectangle, 1 circle, 1 triangle manually in Firestore
2. ✅ All 3 shapes render correctly on canvas
3. Lock each shape → ✅ Lock icon and borders work
4. Drag each shape → ✅ All draggable

### Multi-User Real-Time Testing (Deploy)

**Setup:** Open 2 browsers, different users

#### Test 5: Real-Time Resize Sync
1. User A creates rectangle
2. User A locks and resizes to 200×300
3. ✅ User B sees resize happen in real-time (<100ms)
4. User B locks different rectangle and resizes
5. ✅ User A sees User B's resize

#### Test 6: Real-Time Shape Creation Sync
1. User A creates blue circle
2. ✅ User B sees circle appear instantly
3. User B creates red triangle
4. ✅ User A sees triangle appear instantly
5. Both users create shapes simultaneously → ✅ No conflicts

#### Test 7: Mixed Operations
1. User A resizes rectangle while User B creates circle
2. ✅ Both operations succeed without interference
3. User A creates triangle while User B drags circle
4. ✅ All changes sync correctly

### Performance Testing

#### Test 8: Handle Performance
1. Create 20 rectangles on canvas
2. Lock one rectangle → ✅ Handles appear instantly
3. Drag resize handle → ✅ Smooth 60 FPS
4. Create 50 shapes → ✅ Still performant

#### Test 9: Shape Rendering Performance
1. Create 10 of each shape type (30 total)
2. ✅ All render smoothly
3. Zoom in/out → ✅ No lag
4. Pan around → ✅ Smooth scrolling

---

## 🐛 Common Issues & Debugging

### Issue 1: Handles Don't Appear
**Symptom:** Lock shape but no resize handles show  
**Debug Steps:**
1. Check if shape is actually locked by current user (check `lockedBy` field)
2. Verify ResizeHandles component is imported and rendered
3. Check console for React errors
4. Verify shape has width/height fields (not circle)

**Solution:** Make sure `lockStatus === 'locked-by-me'` condition is met

### Issue 2: Circle Doesn't Render
**Symptom:** Circle created in Firestore but doesn't appear on canvas  
**Debug Steps:**
1. Check Firestore document has `type: 'circle'`
2. Verify `radius` field exists
3. Check Canvas.tsx has Circle rendering case
4. Look for console errors

**Solution:** Ensure Circle component is imported from react-konva and render case exists

### Issue 3: Triangle Points Are Wrong
**Symptom:** Triangle renders but looks distorted  
**Debug Steps:**
1. Log triangle point calculations
2. Verify width and height are positive
3. Check point order (should be: top, bottom-left, bottom-right)

**Solution:** Triangle vertices formula:
- Top: `(x + width/2, y)`
- Bottom-left: `(x, y + height)`
- Bottom-right: `(x + width, y + height)`

### Issue 4: Resize Below Minimum Size
**Symptom:** Can drag handle to create tiny shapes  
**Debug Steps:**
1. Check if validation is enforced in handleDragMove
2. Verify Math.max(10, newWidth) logic

**Solution:** Always clamp dimensions: `newWidth = Math.max(10, newWidth)`

### Issue 5: Real-Time Sync Delay
**Symptom:** User B sees changes after >200ms  
**Debug Steps:**
1. Check network tab for Firestore response times
2. Verify onSnapshot subscription is active
3. Check if Firebase emulators are running (slower than production)

**Solution:** Deploy to production Firebase for true latency testing

---

## ✅ Definition of Done

### Code Checklist
- [ ] All TypeScript types updated (Shape interface includes circle/triangle)
- [ ] ResizeHandles component created and functional
- [ ] CanvasService has resizeShape(), resizeCircle(), createCircle(), createTriangle()
- [ ] Canvas.tsx renders all 3 shape types correctly
- [ ] Toolbar has circle and triangle buttons
- [ ] CanvasContext supports 'circle' and 'triangle' in activeTool
- [ ] All functions have proper error handling and logging
- [ ] No TypeScript errors
- [ ] No console errors during normal operation

### Testing Checklist
- [ ] All 9 Gatekeeper tests pass locally
- [ ] Deployed to staging/production
- [ ] Multi-user testing with 2 browsers complete
- [ ] Performance testing with 50+ shapes passes
- [ ] Real-time sync <100ms verified

### Documentation Checklist
- [ ] Code comments added for complex logic
- [ ] Console logs provide helpful debugging info
- [ ] This implementation guide referenced during build

---

## 🎯 Ready to Proceed?

**Before starting implementation:**
1. ✅ Read this entire guide
2. ✅ Ask any clarifying questions
3. ✅ Confirm you understand the architecture
4. ✅ Give GREEN LIGHT to proceed

**Estimated Timeline:**
- Part 1 (CanvasService): 1.5 hours
- Part 2 (Resize Handles): 2 hours
- Part 3 (Circle/Triangle): 1.5 hours
- Testing: 30 minutes

**Total: 5.5 hours**

---

## 🚀 Next Steps After PR #1

Once all tests pass and PR #1 is deployed:
1. Merge to main branch
2. Tag release: `v2.1-resize-shapes`
3. Update task.md with completion status
4. Proceed to PR #2: Rotate Shapes

---

**Questions or issues during implementation?** Refer back to this guide or ask for help!

**GREEN LIGHT TO PROCEED?** 🟢

