# PRD 3: Advanced Shape Types (Circles & Triangles)

**Feature:** Circle and Triangle Shape Types with Full Manipulation
**Version:** 2.0 (Phase 2 - Essential Features)
**Status:** Ready for Development
**Estimated Effort:** 10-15 hours

-----

## Overview

This feature introduces two new geometric shapes, **Circles** and **Triangles**, to the collaborative canvas. Both new shapes must support the full suite of existing canvas manipulation features, including **moving**, **resizing** (via an 8-handle system), **locking**, and **rotating**. This is a P0 requirement for rubric scoring and moves the product from a basic rectangle editor to a more versatile design tool.

-----

## Goals

1.  **New Shape Types:** Implement services and rendering for `circle` and `triangle` shapes.
2.  **Feature Parity:** Circles and triangles must support all existing core canvas interactions: **drag-to-create**, **move**, **resize**, **rotate**, and **lock**.
3.  **Optimized Resize:** Implement proportional resize for circles (radius-only) and a standard 8-handle bounding box resize for triangles.
4.  **Improved UX:** Add intuitive toolbar buttons for selecting the new shape tools.

-----

## User Stories

### As a User

  - I want to select a **Circle** tool so I can draw perfect circles on the canvas.
  - I want to select a **Triangle** tool so I can quickly create triangular shapes for flowcharts and design elements.
  - I want to **resize** a circle by dragging its handles, and have the resize maintain a perfect radius.
  - I want to **resize** a triangle by dragging its handles to change its bounding box.
  - I want to be able to **move**, **rotate**, and **lock** circles and triangles just like I can with rectangles.

-----

## Data Model

The existing `shapes` collection schema must be extended to accommodate the new shapes.

### `shapes` Collection Updates

**Path:** `projects/{projectId}/canvases/main/shapes/{shapeId}`

| Field | Type | Rectangle | **Circle (NEW)** | **Triangle (NEW)** | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `type` | `string` | `'rectangle'` | **`'circle'`** | **`'triangle'`** | Required for rendering and manipulation logic |
| `x` | `number` | Center-X | Center-X | Center-X | Center coordinate on canvas |
| `y` | `number` | Center-Y | Center-Y | Center-Y | Center coordinate on canvas |
| `width` | `number` | Bounding Box W | N/A | Bounding Box W | Used for bounding box and resizing |
| `height` | `number` | Bounding Box H | N/A | Bounding Box H | Used for bounding box and resizing |
| **`radius`** | `number` | N/A | **Radius** | N/A | The circle's dimension property |
| `rotation` | `number` | Degrees | Degrees | Degrees | Existing property, must work for new shapes |

-----

## API Specification

### `canvasService.ts` Updates

Extend `canvasService` with dedicated creation and resizing methods.

```typescript
// --- Creation Methods ---

// Create a new circle
createCircle(projectId: string, x: number, y: number, radius: number, color: string, createdBy: string): Promise<string>

// Create a new triangle (based on bounding box)
createTriangle(projectId: string, x: number, y: number, width: number, height: number, color: string, createdBy: string): Promise<string>


// --- Resizing Methods (Existing updateShape will handle general resize for Rect/Tri) ---

// Specific method for circle resize (updates only radius)
resizeCircle(projectId: string, shapeId: string, radius: number): Promise<void>

// For Rectangle and Triangle, the existing updateShape will be used:
// updateShape(projectId: string, shapeId: string, updates: {width?: number, height?: number, radius?: number, ...}): Promise<void>
```

-----

## UI Components

### 1\. `ShapeToolbar.tsx` (NEW/UPDATE)

The main toolbar needs buttons to activate the new creation tools.

**Features:**

  - Add a dedicated **Circle** button and **Triangle** button next to the existing Rectangle button.
  - On click, these buttons must update the `activeTool` in `CanvasContext`.
  - Visual state (highlight/active) must indicate the currently selected tool.

**Layout (Conceptual):**
`[Rectangle] [Circle] [Triangle] [Text] [Color Picker...]`

### 2\. `Canvas.tsx` (Rendering Updates)

**Features:**

  - Update the main canvas rendering loop to handle shapes with `type: 'circle'` and `type: 'triangle'`.
  - Use the **Konva `<Circle>`** component for rendering circles.
  - Use the **Konva `<Line>`** component with `closed={true}` for rendering triangles.
      - **Triangle Vertex Calculation:** Vertices should be calculated from the `x`, `y` (center), `width`, and `height` (bounding box) to form an equilateral triangle pointing upwards by default.

### 3\. `ResizeHandles.tsx` (Logic Updates)

The component responsible for displaying and handling resize interactions.

**Features:**

  - **Rectangle & Triangle:** Continue to use the **8-handle** system (corners and edges). Dragging a corner should maintain the aspect ratio for triangles, and dragging an edge should change only one dimension.
  - **Circle:** Implement a **4-handle** system (Top, Bottom, Left, Right). Dragging *any* of these handles must calculate the new radius based on the distance from the center and update the shape proportionally (to ensure it remains a circle).

-----

## UX and Interaction Details

### Shape Creation (Drag-to-Create)

| Shape | Interaction | Dimension Calculation | Minimum Size |
| :--- | :--- | :--- | :--- |
| **Circle** | Click and drag from center to edge. | Radius is the distance from start (center) to mouse-up position. | 5px radius |
| **Triangle** | Click and drag to define a bounding box. | `width` and `height` are the dimensions of the bounding box. | 10px width/height |

### Resize Behavior

| Shape | Handles | Corner Drag | Edge Drag |
| :--- | :--- | :--- | :--- |
| **Rectangle** | 8 | Proportional | Single Dimension |
| **Triangle** | 8 | Proportional | Single Dimension |
| **Circle** | 4 (T, B, L, R) | N/A | **Always proportional** (updates radius) |

### Other Manipulations

The existing logic for **move** (`updateShape` to change `x`, `y`), **rotate** (`updateShape` to change `rotation`), and **lock** (`updateShape` to change `isLocked`) must be tested and confirmed to work correctly with the new `circle` and `triangle` types.

-----

## Testing Scenarios

All tests should be performed in a **multiplayer environment** with at least two authenticated users.

### Scenario 1: Circle Creation & Resize

1.  **User A** selects the Circle tool and drags on the canvas to create a circle.
2.  **User B** sees the circle appear in real-time.
3.  **User A** locks the circle.
4.  **User A** sees 4 resize handles.
5.  **User A** drags the right-side handle. The circle resizes proportionally (radius changes), and the aspect ratio remains 1:1.
6.  **User B** sees the proportional resize in real-time.
7.  **User A** tries to create a circle with a radius smaller than 5px. Creation is prevented, and an error toast is shown.

### Scenario 2: Triangle Creation & Manipulation

1.  **User A** selects the Triangle tool and drags to create a triangle bounding box.
2.  **User B** sees the triangle appear in real-time.
3.  **User A** locks the triangle.
4.  **User A** sees 8 resize handles.
5.  **User A** drags a corner handle. The triangle resizes proportionally.
6.  **User A** drags a side handle. Only the width or height of the bounding box changes.
7.  **User B** sees the non-proportional resize in real-time.
8.  **User A** rotates the triangle. **User B** sees the rotation in real-time.

### Scenario 3: Minimum Size Validation

1.  Attempt to resize a rectangle, circle, or triangle below its minimum dimensions (10x10 for Rect/Tri, 5px radius for Circle).
2.  The resize action must be prevented, the shape must revert to the last valid size, and an error toast must appear.

-----

## Success Criteria

The feature is complete when:

1.  ✅ **Circle** and **Triangle** creation buttons are present in the toolbar.
2.  ✅ Users can successfully create both shapes via click-and-drag.
3.  ✅ Both shapes are correctly rendered in `Canvas.tsx` for all users.
4.  ✅ **Circles** have 4 handles and only allow proportional (radius) resize.
5.  ✅ **Triangles** have 8 handles and support both proportional (corner) and non-proportional (edge) resize.
6.  ✅ Both shapes support **move**, **rotate**, and **lock** functions.
7.  ✅ All manipulation is reflected in real-time for collaborators.
8.  ✅ Minimum size validations are correctly enforced on creation and resize.