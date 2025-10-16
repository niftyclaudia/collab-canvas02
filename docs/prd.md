# PRD: Resize Shapes + Additional Shape Types

| Field | Value |
|:---|:---|
| **Feature** | Resize Shapes + Additional Shape Types (Circles & Triangles) |
| **Version** | Phase 2, PR #1 |
| **Status** | Ready for Development |
| **Estimated Effort** | 5 hours |
| **Branch** | `feature/resize-and-shape-types` |

---

## 1. Overview

Add an **8-handle resize system** for all shapes and **Circle and Triangle** shape types. This feature is critical for basic canvas manipulation and required for grading rubric compliance.

---

## 2. Goals

1. **Universal Resize System** - 8-handle resize (4 corners + 4 edges) for rectangles and triangles
2. **Circle Resize** - 4-handle resize system that adjusts radius while allowing position changes
3. **Additional Shape Types** - Circle and Triangle creation tools with click-and-drag interaction
4. **Visual Feedback** - Real-time dimension tooltips and handle hover states
5. **Performance** - Maintain 60 FPS during resize operations with <100ms real-time sync

---

## 3. User Stories

### As a User
- I want an **8-handle resize system** on all shapes so I can precisely control their width and height
- I want corner handles to resize **proportionally** and edge handles to resize **single dimensions**
- I want to **create circles and triangles** so I have more geometric options for my designs
- I want to see **dimension tooltips** while resizing so I can achieve precise sizing

---

## 4. Data Model Changes

**Path:** `/projects/{projectId}/canvases/main/shapes/{shapeId}`

```typescript
interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle'; // ← UPDATED: added circle/triangle
  x: number;
  y: number;
  
  // Rectangle/Triangle
  width?: number;
  height?: number;
  
  // Circle
  radius?: number;
  
  color: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp; // ← NEW: for resize tracking
  lockedBy?: string | null;
}
```

**No database migrations needed** - changes are additive only.

---

## 5. Implementation Guide

### Prerequisites
- MVP Phase 1 is complete and deployed
- `Canvas.tsx` renders rectangles with drag capabilities
- `CanvasService` has a `createShape()` method
- Firebase emulators are running

### Task 1: Canvas Service Extensions (1.5 hours)

**1.1 Add resizeShape() method**

```typescript
// CanvasService.ts
async resizeShape(
  projectId: string,
  shapeId: string,
  width: number,
  height: number
): Promise<void> {
  // Validate minimum size
  if (width < 10 || height < 10) {
    throw new Error("Shape cannot be smaller than 10×10 pixels");
  }
  
  // Update Firestore
  await updateDoc(
    doc(db, `projects/${projectId}/canvases/main/shapes/${shapeId}`),
    {
      width,
      height,
      updatedAt: serverTimestamp()
    }
  );
}
```

**Test:** Console run `canvasService.resizeShape('test-id', 200, 150)` → Firestore updates

**1.2 Add Circle methods**

```typescript
async createCircle(
  projectId: string,
  x: number,
  y: number,
  radius: number,
  color: string,
  createdBy: string
): Promise<string> {
  if (radius < 5) {
    throw new Error("Circle radius must be at least 5 pixels");
  }
  
  const shapeRef = doc(collection(db, `projects/${projectId}/canvases/main/shapes`));
  await setDoc(shapeRef, {
    id: shapeRef.id,
    type: 'circle',
    x,
    y,
    radius,
    color,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return shapeRef.id;
}

async resizeCircle(
  projectId: string,
  shapeId: string,
  x: number,
  y: number,
  radius: number
): Promise<void> {
  if (radius < 5) {
    throw new Error("Circle radius must be at least 5 pixels");
  }
  
  await updateDoc(
    doc(db, `projects/${projectId}/canvases/main/shapes/${shapeId}`),
    {
      x,
      y,
      radius,
      updatedAt: serverTimestamp()
    }
  );
}
```

**Test:** Console run `canvasService.createCircle(...)` → Circle document created in Firestore

**1.3 Add Triangle method**

```typescript
async createTriangle(
  projectId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  createdBy: string
): Promise<string> {
  if (width < 10 || height < 10) {
    throw new Error("Triangle cannot be smaller than 10×10 pixels");
  }
  
  const shapeRef = doc(collection(db, `projects/${projectId}/canvases/main/shapes`));
  await setDoc(shapeRef, {
    id: shapeRef.id,
    type: 'triangle',
    x,
    y,
    width,
    height,
    color,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return shapeRef.id;
}
```

**Test:** Console run `canvasService.createTriangle(...)` → Triangle document created in Firestore

---

### Task 2: Resize Handle System (2 hours)

**2.1 Create ResizeHandles.tsx**

Create `src/components/Canvas/ResizeHandles.tsx`:

```typescript
interface ResizeHandlesProps {
  shape: Shape;
  onResize?: (width: number, height: number) => void; // For rect/triangle
  onResizeCircle?: (x: number, y: number, radius: number) => void; // For circles
  onResizeEnd: () => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ shape, onResize, onResizeCircle, onResizeEnd }) => {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Handle positions for rectangles/triangles
  const handles = [
    { name: 'tl', cursor: 'nwse-resize', x: 0, y: 0 },
    { name: 't', cursor: 'ns-resize', x: shape.width/2, y: 0 },
    { name: 'tr', cursor: 'nesw-resize', x: shape.width, y: 0 },
    { name: 'r', cursor: 'ew-resize', x: shape.width, y: shape.height/2 },
    { name: 'br', cursor: 'nwse-resize', x: shape.width, y: shape.height },
    { name: 'b', cursor: 'ns-resize', x: shape.width/2, y: shape.height },
    { name: 'bl', cursor: 'nesw-resize', x: 0, y: shape.height },
    { name: 'l', cursor: 'ew-resize', x: 0, y: shape.height/2 }
  ];
  
  // For circles, only show 4 handles
  const circleHandles = [
    { name: 't', cursor: 'ns-resize', x: 0, y: -shape.radius },
    { name: 'r', cursor: 'ew-resize', x: shape.radius, y: 0 },
    { name: 'b', cursor: 'ns-resize', x: 0, y: shape.radius },
    { name: 'l', cursor: 'ew-resize', x: -shape.radius, y: 0 }
  ];
  
  const activeHandles = shape.type === 'circle' ? circleHandles : handles;
  
  return (
    <Group>
      {activeHandles.map((handle) => (
        <Rect
          key={handle.name}
          x={shape.x + handle.x - (hoveredHandle === handle.name ? 5 : 4)}
          y={shape.y + handle.y - (hoveredHandle === handle.name ? 5 : 4)}
          width={hoveredHandle === handle.name ? 10 : 8}
          height={hoveredHandle === handle.name ? 10 : 8}
          fill={hoveredHandle === handle.name ? '#3b82f6' : 'white'}
          stroke="#666"
          strokeWidth={1}
          draggable
          onMouseEnter={() => setHoveredHandle(handle.name)}
          onMouseLeave={() => setHoveredHandle(null)}
          onDragMove={(e) => handleDrag(handle.name, e)}
          onDragEnd={onResizeEnd}
          cursor={handle.cursor}
        />
      ))}
    </Group>
  );
};
```

**Test:** Lock a rectangle → 8 white squares appear at corners and edges

**2.2 Implement corner handle logic (proportional resize)**

```typescript
const handleCornerDrag = (handleName: string, deltaX: number, deltaY: number) => {
  const aspectRatio = shape.width / shape.height;
  
  // Use the larger delta to determine new size
  const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  
  let newWidth = shape.width;
  let newHeight = shape.height;
  
  switch(handleName) {
    case 'br':
      newWidth = shape.width + deltaX;
      newHeight = newWidth / aspectRatio;
      break;
    case 'bl':
      newWidth = shape.width - deltaX;
      newHeight = newWidth / aspectRatio;
      break;
    case 'tr':
      newWidth = shape.width + deltaX;
      newHeight = newWidth / aspectRatio;
      break;
    case 'tl':
      newWidth = shape.width - deltaX;
      newHeight = newWidth / aspectRatio;
      break;
  }
  
  // Enforce minimum size
  newWidth = Math.max(10, newWidth);
  newHeight = Math.max(10, newHeight);
  
  onResize?.(newWidth, newHeight);
};
```

**Test:** Drag bottom-right corner → Shape grows proportionally, aspect ratio maintained

**2.3 Implement edge handle logic (single dimension)**

```typescript
const handleEdgeDrag = (handleName: string, deltaX: number, deltaY: number) => {
  let newWidth = shape.width;
  let newHeight = shape.height;
  
  switch(handleName) {
    case 'r':
    case 'l':
      newWidth = handleName === 'r' ? shape.width + deltaX : shape.width - deltaX;
      newWidth = Math.max(10, newWidth);
      onResize?.(newWidth, shape.height);
      break;
    case 't':
    case 'b':
      newHeight = handleName === 'b' ? shape.height + deltaY : shape.height - deltaY;
      newHeight = Math.max(10, newHeight);
      onResize?.(shape.width, newHeight);
      break;
  }
};
```

**Test:** Drag right edge → Only width changes. Drag bottom edge → Only height changes

**2.4 Add dimension tooltip**

```typescript
const DimensionTooltip: React.FC<{ shape: Shape; visible: boolean }> = ({ shape, visible }) => {
  if (!visible) return null;
  
  const text = shape.type === 'circle'
    ? `${Math.round(shape.radius * 2)}px`
    : `${Math.round(shape.width)} × ${Math.round(shape.height)}`;
  
  return (
    <Text
      x={shape.x + (shape.width || shape.radius) / 2}
      y={shape.y - 30}
      text={text}
      fontSize={14}
      fill="#000"
      align="center"
    />
  );
};
```

**Test:** Start dragging any handle → Tooltip appears and values update in real-time

**2.5 Connect to CanvasService**

```typescript
const handleResizeEnd = async () => {
  try {
    if (shape.type === 'circle') {
      await canvasService.resizeCircle(projectId, shape.id, shape.x, shape.y, shape.radius);
    } else {
      await canvasService.resizeShape(projectId, shape.id, shape.width, shape.height);
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

**Test:** Try to resize below 10×10 → Error toast appears, resize prevented

---

### Task 3: Shape Creation & Rendering (1.5 hours)

**3.1 Update Toolbar**

Add Circle and Triangle buttons:

```typescript
// Toolbar.tsx
<button onClick={() => setActiveTool('circle')}>Circle</button>
<button onClick={() => setActiveTool('triangle')}>Triangle</button>
```

**Test:** Click buttons → Button highlights and `context.activeTool` shows correct value

**3.2 Implement circle creation**

```typescript
// Canvas.tsx
const handleCircleCreation = (startPoint: Point) => {
  const [preview, setPreview] = useState<Circle | null>(null);
  
  const onMouseMove = (e: KonvaEvent) => {
    const currentPos = e.target.getStage()?.getPointerPosition();
    const radius = Math.sqrt(
      Math.pow(currentPos.x - startPoint.x, 2) +
      Math.pow(currentPos.y - startPoint.y, 2)
    );
    
    setPreview({
      x: startPoint.x,
      y: startPoint.y,
      radius,
      color: selectedColor
    });
  };
  
  const onMouseUp = async () => {
    if (preview && preview.radius >= 5) {
      await canvasService.createCircle(
        projectId, 
        preview.x, 
        preview.y, 
        preview.radius, 
        preview.color, 
        user.uid
      );
    }
    setPreview(null);
  };
};
```

**Test:** Drag on canvas → Green outline preview circle appears. Release → Circle persists

**3.3 Implement triangle creation**

```typescript
// Canvas.tsx
const handleTriangleCreation = (startPoint: Point) => {
  const [preview, setPreview] = useState<Triangle | null>(null);
  
  const onMouseMove = (e: KonvaEvent) => {
    const currentPos = e.target.getStage()?.getPointerPosition();
    const width = currentPos.x - startPoint.x;
    const height = currentPos.y - startPoint.y;
    
    setPreview({
      x: startPoint.x,
      y: startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
      color: selectedColor
    });
  };
  
  const onMouseUp = async () => {
    if (preview && preview.width >= 10 && preview.height >= 10) {
      await canvasService.createTriangle(
        projectId,
        preview.x,
        preview.y,
        preview.width,
        preview.height,
        preview.color,
        user.uid
      );
    }
    setPreview(null);
  };
};
```

**Test:** Drag on canvas → Green outline preview triangle appears. Release → Triangle persists

**3.4 Add rendering for new shapes**

```typescript
// Canvas.tsx
const calculateTrianglePoints = (shape: Shape): number[] => {
  const { x, y, width, height } = shape;
  return [
    x + width / 2, y,        // Center-top
    x, y + height,           // Bottom-left
    x + width, y + height    // Bottom-right
  ];
};

// In render:
{shape.type === 'circle' && (
  <Circle
    x={shape.x}
    y={shape.y}
    radius={shape.radius}
    fill={shape.color}
    draggable={!shape.lockedBy}
    onDragEnd={handleDragEnd}
  />
)}

{shape.type === 'triangle' && (
  <Line
    points={calculateTrianglePoints(shape)}
    fill={shape.color}
    closed={true}
    draggable={!shape.lockedBy}
    onDragEnd={handleDragEnd}
  />
)}
```

**Test:** Manually create Circle/Triangle in Firestore → Renders correctly on canvas

---

## 6. Testing Checklist

Test with 2 users in separate browsers:

### Resize Tests
- [ ] User A locks rectangle → 8 handles appear
- [ ] User A drags corner handle → shape resizes proportionally
- [ ] User A drags edge handle → only width or height changes
- [ ] Dimension tooltip shows during drag
- [ ] User B sees resize in <100ms
- [ ] Trying to resize below 10×10 → error toast, resize prevented
- [ ] Resize works for circles and triangles

### Shape Creation Tests
- [ ] Circle: Click tool → drag → green preview → release → circle persists
- [ ] Triangle: Click tool → drag → green preview → release → triangle persists
- [ ] User B sees new shapes in <100ms
- [ ] All shapes can be dragged, locked, and resized

### Performance Tests
- [ ] 60 FPS maintained during resize (Chrome DevTools)
- [ ] Works smoothly with 20+ shapes on canvas

---

## 7. Success Criteria

- ✅ All shapes can be resized using corner handles (proportional) and edge handles (single-dimension)
- ✅ Real-time dimension tooltip appears during drag
- ✅ Circle and Triangle tools work with click-and-drag
- ✅ Minimum size validation enforced (10×10 for rect/triangle, 5px radius for circle)
- ✅ Real-time sync works (<100ms latency between users)
- ✅ Performance maintains 60 FPS with 20+ shapes
- ✅ All manual tests pass with 2+ users

---

## 8. Out of Scope

- ❌ Shape rotation (PR #2)
- ❌ Multi-selection, copy/paste, undo/redo
- ❌ Advanced styling, smart guides
- ❌ Shape grouping, export

---

## 9. Visual Design

**Handles:**
- Default: 8×8px, white fill, gray (#666) border
- Hover: 10×10px, blue (#3b82f6) fill
- Cursor: Changes per handle (nwse-resize, ns-resize, ew-resize, nesw-resize)

**Tooltip:**
- Format: "W × H" or "Ø Xpx"
- Position: Centered above shape, 30px offset
- Style: Black text, white background

**Preview:**
- Green outline during creation
- No fill, 2px stroke

---

## 10. Performance Requirements

| Metric | Requirement |
|:---|:---|
| Frame Rate | 60 FPS during resize |
| Sync Latency | <100ms between users |
| Shape Count | No degradation with 20+ shapes |

---

**Ready for Development** ✅