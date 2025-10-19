# CollabCanvas Phase 2 - Product Requirements Document

## Project Overview

Phase 2 transforms the MVP into a **production-ready collaborative design tool with AI assistance**. Building on the solid multiplayer foundation from Phase 1, we add essential canvas manipulation features (resize, rotate, text), advanced Figma-inspired capabilities (multi-select, grouping, alignment, z-index, comments), keyboard shortcuts for power users, and an AI Canvas Agent that provides natural language access to all features.

**Timeline:** 72 hours from MVP completion to final submission  
**Success Criteria:** 
- Manual UI controls for all core and advanced operations
- AI agent executes 8+ command types including layout operations
- Multi-select and grouping enable professional workflows
- Score 92-98 points on project rubric (strong A)

**Philosophy:** Build deterministic, testable functions first, then add AI wrapper. Maximize rubric score by strategically implementing high-value features.

---

## Phase 2 Goals

### Primary Objectives

1. **Extend Canvas Capabilities:** Add resize, rotate, text, delete, duplicate with manual UI controls
2. **Advanced Features:** Multi-select, grouping, z-index management, alignment tools, collaborative comments
3. **Power User Features:** Keyboard shortcuts, copy/paste for efficient workflows
4. **AI Natural Language Interface:** Enable manipulation through conversational commands including layout operations
5. **Professional Polish:** Deliver production-ready tool that scores 92-98 on rubric

### Key Principles

1. **Functions First, AI Second:** Build deterministic canvas operations, then add AI wrapper
2. **Leverage Existing Infrastructure:** All features use the same `CanvasService` layer
3. **Rubric-Driven Development:** Prioritize features that maximize scoring potential
4. **Incremental Value:** Each feature works standalone before moving to next
5. **Professional UX:** Keyboard shortcuts, visual feedback, smooth interactions

---

## User Stories

### As a Designer (Manual Controls)

- I want to click a shape and resize it using handles so that I can adjust proportions
- I want to rotate a shape using a rotation handle so that I can create angled layouts
- I want to click a "Text" button and type to create text layers so that I can add labels
- I want to change the font size of text after creating it so that I can adjust emphasis
- I want to select multiple shapes with shift-click so that I can operate on them together
- I want to drag a selection box to select multiple shapes so that I can quickly grab groups
- I want to group selected shapes so that they move together as one unit
- I want to align selected shapes (left, center, right, top, middle, bottom) so that I can create clean layouts
- I want to bring shapes to front or send to back so that I can control layering
- I want to use keyboard shortcuts (Delete, Duplicate, Arrow keys) so that I can work efficiently
- I want to copy and paste shapes so that I can quickly replicate elements
- I want to add comments to shapes so that I can communicate with teammates
- I want to see all these actions from other users in real-time so that we stay coordinated

### As a Designer (AI Interface)

- I want to type "create a blue rectangle in the center" and see it appear instantly
- I want to say "arrange these shapes in a horizontal row" and watch them organize
- I want to tell the AI "make a login form" and see organized elements appear
- I want to ask for "a 3x3 grid of squares" and see it created
- I want to type "group the blue shapes" and have them grouped automatically
- I want to say "align these shapes to the left" and see them align
- I want to manually adjust AI-generated content so that I maintain creative control
- I want to tell ask for "create 500 squares, select 15 and move them to the left"

### As a Collaborative Team Member

- I want to see my teammate's multi-select and group operations in real-time
- I want to see AI-generated content from my teammate appear instantly
- I want to manually edit shapes that AI created
- I want to use AI simultaneously with my teammate without conflicts

---

## Phase 2 Feature Requirements

### Part A: Core Manual Features (Critical Path)

These features establish the foundation for advanced capabilities and AI integration.

---

### 1. Resize Shapes (P0 - Critical)

#### CanvasService Extension

```typescript
// Add to services/canvasService.ts
async resizeShape(shapeId: string, width: number, height: number): Promise<void> {
  // Validate dimensions
  if (width < 10 || height < 10) {
    throw new Error('Minimum size is 10×10 pixels');
  }
  
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    width: width,
    height: height,
    updatedAt: serverTimestamp()
  });
}
```

#### UI Implementation

**Resize Handles:**
- Show 8 resize handles when shape is locked by current user
- Corner handles (4): Proportional resize (maintain aspect ratio)
- Edge handles (4): Resize single dimension (width or height only)
- Handle positions: TL, T, TR, L, R, BL, B, BR
- Real-time visual feedback during resize

**Visual Design:**
- Handles: 8×8px white squares with 1px gray border
- Hover state: Handle scales to 10×10px, changes to blue
- Active drag: Show dimension tooltip "200 × 150" above shape
- Minimum size: 10×10px (enforced, show error toast if violated)

**Gate:** User A resizes rectangle → User B sees resize in <100ms

---

### 2. Rotate Shapes (P0 - Critical)

#### CanvasService Extension

```typescript
async rotateShape(shapeId: string, rotation: number): Promise<void> {
  const normalizedRotation = rotation % 360;
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    rotation: normalizedRotation,
    updatedAt: serverTimestamp()
  });
}
```

#### Data Model Update

Add `rotation` field to all shape documents:

```typescript
{
  id: "shape_123",
  type: "rectangle | text | circle | triangle",
  rotation: 0,       // Degrees (0-360), default 0
  // ... rest of fields
}
```

#### UI Implementation

**Rotation Handle:**
- Single circular handle appears 30px above shape center when locked
- Visual: 12px diameter circle with "↻" rotation icon
- Connected to shape with thin gray line (visual guide)
- Cursor changes to rotation cursor on hover

**Konva Implementation:**

```typescript
<Rect
  x={shape.x + shape.width / 2}  // Adjusted for offset
  y={shape.y + shape.height / 2}
  width={shape.width}
  height={shape.height}
  fill={shape.color}
  rotation={shape.rotation || 0}
  offsetX={shape.width / 2}   // Rotate around center
  offsetY={shape.height / 2}
  draggable={isLockedByMe}
/>
```

**Gate:** User A rotates rectangle 45° → User B sees rotation in <100ms

---

### 3. Text Layers (P0 - Critical)

#### Data Model

Text shapes in `canvases/main/shapes` collection:

```typescript
{
  id: "shape_456",
  type: "text",      // Type can be: "rectangle" | "text" | "circle" | "triangle"
  text: "Hello World",
  x: 500,
  y: 300,
  fontSize: 16,      // px (12-48 range)
  color: "#000000",  // Text color (default black)
  fontWeight: "normal" | "bold",           // NEW: Text formatting
  fontStyle: "normal" | "italic",          // NEW: Text formatting
  textDecoration: "none" | "underline",    // NEW: Text formatting
  rotation: 0,
  zIndex: 0,
  groupId: null,
  createdBy: "user_abc",
  createdAt: "timestamp",
  lockedBy: null,
  lockedAt: null,
  updatedAt: "timestamp"
}
```

#### CanvasService Extension

```typescript
async createText(textData: {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight?: "normal" | "bold";           // NEW: Optional formatting
  fontStyle?: "normal" | "italic";          // NEW: Optional formatting
  textDecoration?: "none" | "underline";    // NEW: Optional formatting
  createdBy: string;
}): Promise<string> {
  const textRef = doc(collection(firestore, 'canvases/main/shapes'));
  await setDoc(textRef, {
    id: textRef.id,
    type: 'text',
    text: textData.text,
    x: textData.x,
    y: textData.y,
    fontSize: textData.fontSize,
    color: textData.color,
    fontWeight: textData.fontWeight || "normal",      // NEW
    fontStyle: textData.fontStyle || "normal",        // NEW
    textDecoration: textData.textDecoration || "none", // NEW
    rotation: 0,
    zIndex: await this.getNextZIndex(),
    groupId: null,
    createdBy: textData.createdBy,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  return textRef.id;
}

async updateText(shapeId: string, text: string): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    text: text,
    updatedAt: serverTimestamp()
  });
}

async updateTextFontSize(shapeId: string, fontSize: number): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    fontSize: fontSize,
    updatedAt: serverTimestamp()
  });
}

async updateTextFormatting(shapeId: string, formatting: {
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
}): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    ...formatting,
    updatedAt: serverTimestamp()
  });
}
```

#### UI Implementation

**Text Tool:**
- Add "Text" button to toolbar (next to shape buttons)
- Layout: `[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`
- Click activates text placement mode
- User clicks on canvas → text input appears
- Enter creates text, Escape cancels
- Double-click existing text to edit

**Font Size Control:**
- Dropdown in controls panel: 12, 14, 16, 18, 20, 24, 32, 48 px
- Default: 16px
- Changes sync in real-time

**Text Formatting Controls (Bold, Italic, Underline):**
- When text shape is locked by current user, show formatting buttons in controls panel
- Button layout: `[B] [I] [U̲] | Font Size: [16px ▼]`
- Buttons:
  - **[B]** Bold toggle
  - **[I]** Italic toggle  
  - **[U̲]** Underline toggle
- Active state: Blue background (#3b82f6), white text
- Inactive state: Gray background, dark text
- Multiple formats can be active simultaneously (e.g., bold + italic)

**Formatting Implementation:**

```typescript
// Toggle handlers in Canvas component
const toggleBold = () => {
  const newWeight = selectedShape.fontWeight === 'bold' ? 'normal' : 'bold';
  canvasService.updateTextFormatting(selectedShape.id, { fontWeight: newWeight });
};

const toggleItalic = () => {
  const newStyle = selectedShape.fontStyle === 'italic' ? 'normal' : 'italic';
  canvasService.updateTextFormatting(selectedShape.id, { fontStyle: newStyle });
};

const toggleUnderline = () => {
  const newDecoration = selectedShape.textDecoration === 'underline' ? 'none' : 'underline';
  canvasService.updateTextFormatting(selectedShape.id, { textDecoration: newDecoration });
};
```

**Konva Text Rendering:**

```typescript
<Text
  text={shape.text}
  x={shape.x}
  y={shape.y}
  fontSize={shape.fontSize}
  fill={shape.color}
  fontStyle={
    shape.fontWeight === 'bold' && shape.fontStyle === 'italic' ? 'bold italic' : 
    shape.fontWeight === 'bold' ? 'bold' : 
    shape.fontStyle === 'italic' ? 'italic' : 
    'normal'
  }
  textDecoration={shape.textDecoration || 'none'}
  rotation={shape.rotation || 0}
  draggable={isLockedByMe}
  onClick={handleTextClick}
  onDblClick={handleTextEdit}
/>
```

**Controls Panel for Text:**
```
┌──────────────────────────────────┐
│ Text                             │
├──────────────────────────────────┤
│ [🗑️ Delete]  [📋 Duplicate]     │
├──────────────────────────────────┤
│ [B] [I] [U̲] | Font: [16px ▼]   │
└──────────────────────────────────┘
```

**Gate:** 
- User A creates text "Hello" → User B sees it in <100ms
- User A edits to "Hello World" → User B sees update in <100ms
- User A makes text bold → User B sees bold text in <100ms
- User A adds italic + underline → User B sees all formatting in <100ms

---

### 4. Delete & Duplicate (P0 - Critical)

#### CanvasService Extension

```typescript
async deleteShape(shapeId: string): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await deleteDoc(shapeRef);
}

async duplicateShape(shapeId: string, userId: string): Promise<string> {
  const shapeDoc = await getDoc(doc(firestore, `canvases/main/shapes/${shapeId}`));
  if (!shapeDoc.exists()) throw new Error('Shape not found');
  
  const original = shapeDoc.data();
  const duplicateRef = doc(collection(firestore, 'canvases/main/shapes'));
  
  const newX = original.x + 20 > 4980 ? 50 : original.x + 20;
  const newY = original.y + 20 > 4980 ? 50 : original.y + 20;
  
  await setDoc(duplicateRef, {
    ...original,
    id: duplicateRef.id,
    x: newX,
    y: newY,
    createdBy: userId,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  
  return duplicateRef.id;
}
```

#### UI Implementation

**Controls Panel:**
- Appears when shape is locked by current user
- Buttons: [🗑️ Delete] [📋 Duplicate]
- Position: Floating near shape or fixed in corner
- For text shapes, add fontSize dropdown

**Gate:** User A deletes/duplicates → User B sees in <100ms

---

### 5. Additional Shape Types - Circles & Triangles (P0 - Critical for Rubric)

#### Data Model Updates

Add shape type variants to Firestore documents:

```typescript
// Circle shape
{
  id: "shape_123",
  type: "circle",
  x: 500,          // Center X
  y: 300,          // Center Y
  radius: 75,      // Radius in pixels
  color: "#3b82f6",
  rotation: 0,     // Circles can rotate if they have patterns (future)
  zIndex: 5,
  groupId: null,
  createdBy: "user_abc",
  createdAt: timestamp,
  lockedBy: null,
  lockedAt: null,
  updatedAt: timestamp
}

// Triangle shape
{
  id: "shape_456",
  type: "triangle",
  x: 1000,         // Top vertex X
  y: 500,          // Top vertex Y
  width: 150,      // Base width
  height: 130,     // Height from top to base
  color: "#ef4444",
  rotation: 0,
  zIndex: 3,
  groupId: null,
  createdBy: "user_abc",
  createdAt: timestamp,
  lockedBy: null,
  lockedAt: null,
  updatedAt: timestamp
}
```

#### CanvasService Extension

```typescript
async createCircle(circleData: {
  x: number;
  y: number;
  radius: number;
  color: string;
  createdBy: string;
}): Promise<string> {
  const circleRef = doc(collection(firestore, 'canvases/main/shapes'));
  await setDoc(circleRef, {
    id: circleRef.id,
    type: 'circle',
    x: circleData.x,
    y: circleData.y,
    radius: circleData.radius,
    color: circleData.color,
    rotation: 0,
    zIndex: await this.getNextZIndex(),
    groupId: null,
    createdBy: circleData.createdBy,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  return circleRef.id;
}

async createTriangle(triangleData: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
}): Promise<string> {
  const triangleRef = doc(collection(firestore, 'canvases/main/shapes'));
  await setDoc(triangleRef, {
    id: triangleRef.id,
    type: 'triangle',
    x: triangleData.x,
    y: triangleData.y,
    width: triangleData.width,
    height: triangleData.height,
    color: triangleData.color,
    rotation: 0,
    zIndex: await this.getNextZIndex(),
    groupId: null,
    createdBy: triangleData.createdBy,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  return triangleRef.id;
}

async resizeCircle(shapeId: string, radius: number): Promise<void> {
  if (radius < 5) {
    throw new Error('Minimum radius is 5 pixels');
  }
  
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    radius: radius,
    updatedAt: serverTimestamp()
  });
}
```

#### UI Implementation

**Toolbar Updates:**
- Add "Circle" and "Triangle" buttons to toolbar
- Layout: `[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`
- Active tool highlighted with blue border
- Store active tool in CanvasContext: `'rectangle' | 'circle' | 'triangle' | 'text'`

**Circle Creation Flow:**
1. User clicks Circle tool → activates circle mode
2. User clicks on canvas (mousedown) → records center position
3. User drags (mousemove) → calculates radius as distance from center to cursor
   ```typescript
   const radius = Math.sqrt(
     Math.pow(currentX - startX, 2) + 
     Math.pow(currentY - startY, 2)
   );
   ```
4. Show preview circle with dashed border during drag
5. User releases (mouseup) → if radius ≥ 5px, create circle
6. Minimum size: 5px radius (prevent accidental tiny circles)

**Triangle Creation Flow:**
1. User clicks Triangle tool → activates triangle mode
2. User clicks and drags like rectangle (defines bounding box)
3. Show preview triangle (equilateral or isosceles) during drag
4. User releases → if width ≥ 10 and height ≥ 10, create triangle
5. Triangle points calculated from bounding box:
   ```typescript
   // Top vertex: (x + width/2, y)
   // Bottom-left: (x, y + height)
   // Bottom-right: (x + width, y + height)
   ```

**Resize Handles for Circles:**
- Show 4 handles (top, bottom, left, right) when circle locked
- Dragging any handle changes radius
- All handles maintain circular shape (proportional)
- Show radius tooltip: "Radius: 75px"

**Resize Handles for Triangles:**
- Show 8 handles like rectangles
- Corner handles resize proportionally
- Edge handles resize single dimension
- Triangle shape recalculates based on bounding box

**Rendering with Konva:**

```typescript
// Circle rendering
{shape.type === 'circle' && (
  <Circle
    x={shape.x}
    y={shape.y}
    radius={shape.radius}
    fill={shape.color}
    rotation={shape.rotation || 0}
    draggable={isLockedByMe}
    onClick={handleShapeClick}
  />
)}

// Triangle rendering
{shape.type === 'triangle' && (
  <Line
    points={[
      shape.width / 2, 0,              // Top vertex
      0, shape.height,                 // Bottom-left
      shape.width, shape.height,       // Bottom-right
      shape.width / 2, 0               // Close path
    ]}
    x={shape.x}
    y={shape.y}
    fill={shape.color}
    closed={true}
    rotation={shape.rotation || 0}
    offsetX={shape.width / 2}         // Rotate around center
    offsetY={shape.height / 2}
    draggable={isLockedByMe}
    onClick={handleShapeClick}
  />
)}
```

**Controls Panel Updates:**
- For circles: Show radius input field (editable)
- For triangles: Same controls as rectangles (width, height)
- Delete and Duplicate buttons work for all shape types

**Gate:** User A creates circle → User B sees it. User A creates triangle → User B sees it. Resize/rotate work for all shapes. All sync in <100ms.

---

### Part B: Advanced Features (Rubric-Driven)

These features are strategically selected to maximize rubric scoring.

---

### 6. Multi-Select (P0 - Critical for Rubric)

**Why Critical:** Required for "Excellent" (7-8 points) in Canvas Functionality (Section 2)

#### Selection State Management

```typescript
// Add to CanvasContext
const [selectedShapes, setSelectedShapes] = useState<string[]>([]);

// Multi-select modes:
// 1. Shift+click: Add shape to selection
// 2. Marquee: Drag rectangle to select all inside
```

#### UI Implementation

**Shift+Click Selection:**
- Click shape while holding Shift → add to selection (if not already selected)
- Click again while holding Shift → remove from selection
- Visual: All selected shapes show blue border (3px)
- Click background (no Shift) → clear selection

**Marquee Selection:**
- Click and drag on canvas background → show selection rectangle
- Visual: Dashed blue border, semi-transparent blue fill (20% opacity)
- On release: Select all shapes whose bounding boxes intersect marquee
- Shapes added to current selection if Shift held, otherwise replace selection

**Multi-Select Operations:**
- **Move:** Drag any selected shape → all selected shapes move together (maintain relative positions)
- **Delete:** Delete button → deletes all selected shapes
- **Duplicate:** Duplicate button → duplicates all selected shapes with 20px offset
- **Group:** Group button appears in controls panel
- **Align:** Alignment tools appear in controls panel

**Implementation Details:**

```typescript
// In Canvas.tsx
const handleShapeClick = (shapeId: string, e: any) => {
  if (e.evt.shiftKey) {
    // Add/remove from selection
    setSelectedShapes(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    );
  } else {
    // Replace selection
    setSelectedShapes([shapeId]);
  }
};

// Marquee selection
const [marquee, setMarquee] = useState(null);

const handleMarqueeDrag = (e: any) => {
  // Calculate marquee bounds
  // Find shapes intersecting marquee
  // Update selection
};
```

**Gate:** User A shift-clicks 3 shapes → all show blue border. User A drags one → all 3 move together. User B sees all movements in real-time.

---

### 7. Object Grouping (P0 - Tier 1 Feature)

**Why Critical:** Tier 1 feature (2 points), enables multi-shape operations, foundation for advanced workflows

#### Data Model

```typescript
// Add to Firestore shape documents
{
  id: "shape_123",
  groupId: "group_abc" | null,  // NEW: Reference to group
  // ... existing fields
}

// New Firestore collection: groups
{
  id: "group_abc",
  name: "Login Form",  // Optional user-defined name
  shapeIds: ["shape_123", "shape_456", "shape_789"],
  createdBy: "user_abc",
  createdAt: "timestamp"
}
```

#### CanvasService Extension

```typescript
async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string> {
  const groupRef = doc(collection(firestore, 'canvases/main/groups'));
  
  await setDoc(groupRef, {
    id: groupRef.id,
    name: name || `Group ${Date.now()}`,
    shapeIds: shapeIds,
    createdBy: userId,
    createdAt: serverTimestamp()
  });
  
  // Update all shapes with groupId
  const batch = writeBatch(firestore);
  for (const shapeId of shapeIds) {
    const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
    batch.update(shapeRef, { groupId: groupRef.id });
  }
  await batch.commit();
  
  return groupRef.id;
}

async ungroupShapes(groupId: string): Promise<void> {
  const groupDoc = await getDoc(doc(firestore, `canvases/main/groups/${groupId}`));
  if (!groupDoc.exists()) throw new Error('Group not found');
  
  const { shapeIds } = groupDoc.data();
  
  // Remove groupId from all shapes
  const batch = writeBatch(firestore);
  for (const shapeId of shapeIds) {
    const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
    batch.update(shapeRef, { groupId: null });
  }
  await batch.commit();
  
  // Delete group document
  await deleteDoc(doc(firestore, `canvases/main/groups/${groupId}`));
}
```

#### UI Implementation

**Grouping:**
- Select 2+ shapes (multi-select)
- "Group" button appears in controls panel
- Click Group → shapes are grouped
- Visual: Grouped shapes show shared dashed border when any member selected
- Click any shape in group → selects entire group

**Ungrouping:**
- Select grouped shapes
- "Ungroup" button appears in controls panel
- Click Ungroup → shapes are ungrouped, individually selectable

**Group Operations:**
- **Move:** Drag any group member → entire group moves
- **Delete:** Delete group → deletes all member shapes
- **Duplicate:** Duplicate group → duplicates all members with shared offset
- **Lock:** Lock group → locks all member shapes
- **Transform:** Resize/rotate group → applies to bounding box (Phase 3 enhancement)

**Gate:** User A selects 3 shapes, clicks Group → they move together. User B sees grouped behavior in real-time.

---

### 8. Z-Index Management (P0 - Tier 2 Feature)

**Why Critical:** Tier 2 feature (3 points), addresses "Layer management" requirement in Canvas Functionality

#### Data Model

```typescript
// Add to Firestore shape documents
{
  id: "shape_123",
  zIndex: 5,  // NEW: Stacking order (higher = on top)
  // ... existing fields
}
```

#### CanvasService Extension

```typescript
async bringToFront(shapeId: string): Promise<void> {
  const shapes = await this.getShapes();
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
  
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    zIndex: maxZIndex + 1,
    updatedAt: serverTimestamp()
  });
}

async sendToBack(shapeId: string): Promise<void> {
  const shapes = await this.getShapes();
  const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
  
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    zIndex: minZIndex - 1,
    updatedAt: serverTimestamp()
  });
}

async bringForward(shapeId: string): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  const shapeDoc = await getDoc(shapeRef);
  const currentZIndex = shapeDoc.data()?.zIndex || 0;
  
  await updateDoc(shapeRef, {
    zIndex: currentZIndex + 1,
    updatedAt: serverTimestamp()
  });
}

async sendBackward(shapeId: string): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  const shapeDoc = await getDoc(shapeRef);
  const currentZIndex = shapeDoc.data()?.zIndex || 0;
  
  await updateDoc(shapeRef, {
    zIndex: currentZIndex - 1,
    updatedAt: serverTimestamp()
  });
}
```

#### UI Implementation

**Controls Panel Buttons:**
- When shape(s) selected, show 4 buttons:
  - ⬆️🔝 To Front (Cmd+Shift+])
  - ⬇️⬇️ To Back (Cmd+Shift+[)
  - ⬆️ Forward (Cmd+])
  - ⬇️ Backward (Cmd+[)

**Rendering:**

```typescript
// In Canvas.tsx
const sortedShapes = shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

{sortedShapes.map(shape => (
  <Rect key={shape.id} {...shape} />
))}
```

**Gate:** User A brings blue rectangle to front → it appears on top of red rectangle. User B sees layer change in real-time.

---

### 9. Alignment Tools (P0 - Tier 2 Feature)

**Why Critical:** Tier 2 feature (3 points), professional design tool requirement, enables precise layouts

#### CanvasService Extension

```typescript
async alignShapes(
  shapeIds: string[], 
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Promise<void> {
  const shapes = await Promise.all(
    shapeIds.map(id => getDoc(doc(firestore, `canvases/main/shapes/${id}`)))
  );
  
  const shapesData = shapes.map(s => s.data());
  
  let targetValue: number;
  
  switch (alignment) {
    case 'left':
      targetValue = Math.min(...shapesData.map(s => s.x));
      break;
    case 'center':
      const avgX = shapesData.reduce((sum, s) => sum + s.x + s.width / 2, 0) / shapesData.length;
      targetValue = avgX;
      break;
    case 'right':
      targetValue = Math.max(...shapesData.map(s => s.x + s.width));
      break;
    case 'top':
      targetValue = Math.min(...shapesData.map(s => s.y));
      break;
    case 'middle':
      const avgY = shapesData.reduce((sum, s) => sum + s.y + s.height / 2, 0) / shapesData.length;
      targetValue = avgY;
      break;
    case 'bottom':
      targetValue = Math.max(...shapesData.map(s => s.y + s.height));
      break;
  }
  
  // Update shapes with batch write
  const batch = writeBatch(firestore);
  shapesData.forEach((shape, i) => {
    const shapeRef = doc(firestore, `canvases/main/shapes/${shape.id}`);
    const updates: any = { updatedAt: serverTimestamp() };
    
    if (['left', 'center', 'right'].includes(alignment)) {
      if (alignment === 'left') updates.x = targetValue;
      else if (alignment === 'center') updates.x = targetValue - shape.width / 2;
      else if (alignment === 'right') updates.x = targetValue - shape.width;
    } else {
      if (alignment === 'top') updates.y = targetValue;
      else if (alignment === 'middle') updates.y = targetValue - shape.height / 2;
      else if (alignment === 'bottom') updates.y = targetValue - shape.height;
    }
    
    batch.update(shapeRef, updates);
  });
  
  await batch.commit();
}

async distributeShapes(
  shapeIds: string[], 
  direction: 'horizontal' | 'vertical'
): Promise<void> {
  const shapes = await Promise.all(
    shapeIds.map(id => getDoc(doc(firestore, `canvases/main/shapes/${id}`)))
  );
  
  const shapesData = shapes.map(s => s.data());
  
  if (direction === 'horizontal') {
    // Sort by x position
    shapesData.sort((a, b) => a.x - b.x);
    const minX = shapesData[0].x;
    const maxX = shapesData[shapesData.length - 1].x + shapesData[shapesData.length - 1].width;
    const totalWidth = shapesData.reduce((sum, s) => sum + s.width, 0);
    const spacing = (maxX - minX - totalWidth) / (shapesData.length - 1);
    
    let currentX = minX;
    const batch = writeBatch(firestore);
    shapesData.forEach(shape => {
      const shapeRef = doc(firestore, `canvases/main/shapes/${shape.id}`);
      batch.update(shapeRef, { 
        x: currentX,
        updatedAt: serverTimestamp()
      });
      currentX += shape.width + spacing;
    });
    await batch.commit();
  } else {
    // Similar logic for vertical distribution
  }
}
```

#### UI Implementation

**Alignment Toolbar:**
- Appears when 2+ shapes selected
- Two rows of buttons:

```
Row 1: [⬅️ Left] [↔️ Center] [➡️ Right] | [⬆️ Top] [↕️ Middle] [⬇️ Bottom]
Row 2: [↔️ Distribute H] [↕️ Distribute V]
```

**Tooltips:**
- Align Left: "Align left edges (Cmd+Shift+L)"
- Align Center: "Align horizontal centers"
- Distribute Horizontally: "Space evenly left to right"

**Gate:** User A selects 4 shapes, clicks "Align Left" → all shapes align to leftmost edge. User B sees alignment in real-time.

---

### 10. Keyboard Shortcuts (P0 - Tier 1 Feature)

**Why Critical:** Tier 1 feature (2 points), essential for power users, quick implementation

#### Shortcuts to Implement

**Shape Operations:**
- `Delete` or `Backspace`: Delete selected shape(s)
- `Cmd/Ctrl + D`: Duplicate selected shape(s)
- `Cmd/Ctrl + C`: Copy selected shape(s)
- `Cmd/Ctrl + V`: Paste from clipboard
- `Cmd/Ctrl + G`: Group selected shapes
- `Cmd/Ctrl + Shift + G`: Ungroup selected group

**Movement:**
- `Arrow Up/Down/Left/Right`: Nudge selected shape(s) by 10px
- `Shift + Arrow`: Nudge by 1px (fine control)

**Z-Index:**
- `Cmd/Ctrl + ]`: Bring forward
- `Cmd/Ctrl + [`: Send backward
- `Cmd/Ctrl + Shift + ]`: Bring to front
- `Cmd/Ctrl + Shift + [`: Send to back

**Selection:**
- `Cmd/Ctrl + A`: Select all shapes
- `Escape`: Clear selection

**Canvas:**
- `Space + Drag`: Pan canvas (alternative to default drag)
- `Cmd/Ctrl + 0`: Reset zoom to 100%

#### Implementation

```typescript
// In Canvas.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextArea) {
      return;
    }
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    
    if (!selectedShapes.length) return;
    
    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      selectedShapes.forEach(id => canvasService.deleteShape(id));
      setSelectedShapes([]);
    }
    
    // Duplicate
    if (cmdKey && e.key === 'd') {
      e.preventDefault();
      selectedShapes.forEach(id => canvasService.duplicateShape(id, user.uid));
    }
    
    // Copy
    if (cmdKey && e.key === 'c') {
      e.preventDefault();
      setClipboard(selectedShapes.map(id => shapes.find(s => s.id === id)));
    }
    
    // Paste
    if (cmdKey && e.key === 'v') {
      e.preventDefault();
      clipboard?.forEach(shape => canvasService.duplicateShape(shape.id, user.uid));
    }
    
    // Group
    if (cmdKey && e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      if (selectedShapes.length >= 2) {
        canvasService.groupShapes(selectedShapes, user.uid);
      }
    }
    
    // Ungroup
    if (cmdKey && e.shiftKey && e.key === 'g') {
      e.preventDefault();
      // Ungroup logic
    }
    
    // Arrow keys for nudging
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const distance = e.shiftKey ? 1 : 10;
      const dx = e.key === 'ArrowLeft' ? -distance : e.key === 'ArrowRight' ? distance : 0;
      const dy = e.key === 'ArrowUp' ? -distance : e.key === 'ArrowDown' ? distance : 0;
      
      selectedShapes.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          canvasService.updateShape(id, {
            x: shape.x + dx,
            y: shape.y + dy
          });
        }
      });
    }
    
    // Z-index controls
    if (cmdKey && e.key === ']' && !e.shiftKey) {
      e.preventDefault();
      selectedShapes.forEach(id => canvasService.bringForward(id));
    }
    
    // ... other shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedShapes, clipboard]);
```

**Visual Feedback:**
- Show toast on action: "Duplicated 3 shapes" (brief, 1 second)
- Keyboard shortcut hints in tooltips

**Gate:** User A presses Delete → shape disappears. User A presses Cmd+D → shape duplicates. User B sees all actions in real-time.

---

### 11. Copy/Paste (P0 - Tier 1 Feature)

**Why Critical:** Tier 1 feature (2 points), complements keyboard shortcuts, natural pairing

#### Implementation

**State Management:**

```typescript
// Add to CanvasContext
const [clipboard, setClipboard] = useState<Shape[] | null>(null);

const handleCopy = () => {
  if (selectedShapes.length === 0) return;
  const shapesToCopy = selectedShapes.map(id => 
    shapes.find(s => s.id === id)
  ).filter(Boolean);
  setClipboard(shapesToCopy);
  toast.success(`Copied ${shapesToCopy.length} shape(s)`);
};

const handlePaste = async () => {
  if (!clipboard || clipboard.length === 0) return;
  
  const newShapeIds: string[] = [];
  for (const shape of clipboard) {
    const newId = await canvasService.duplicateShape(shape.id, user.uid);
    newShapeIds.push(newId);
  }
  
  setSelectedShapes(newShapeIds);
  toast.success(`Pasted ${clipboard.length} shape(s)`);
};
```

**Keyboard Integration:**
- Cmd/Ctrl+C: Copy selected shapes to clipboard
- Cmd/Ctrl+V: Paste shapes from clipboard with 20px offset

**Visual Feedback:**
- Copy: Brief toast "Copied 2 shapes"
- Paste: Toast "Pasted 2 shapes" + auto-select pasted shapes

**Gate:** User A selects shape, presses Cmd+C, presses Cmd+V → duplicate appears. User B sees pasted shape in real-time.

---

### 12. Collaborative Comments (P0 - Tier 3 Feature)

**Why Critical:** Tier 3 feature (3 points), leverages existing real-time infrastructure, unique collaborative value

#### Data Model

```typescript
// New Firestore collection: canvases/main/comments
{
  id: "comment_123",
  shapeId: "shape_456",        // Shape this comment is attached to
  userId: "user_abc",
  username: "Alice",
  text: "This needs to be bigger",
  x: 100,                      // Pin position on canvas (optional)
  y: 200,
  createdAt: "timestamp",
  resolved: false,
  replies: [                   // Optional: nested replies
    {
      userId: "user_def",
      username: "Bob",
      text: "I agree, let's make it 300px",
      createdAt: "timestamp"
    }
  ]
}
```

#### CanvasService Extension

```typescript
async addComment(
  shapeId: string, 
  text: string, 
  userId: string, 
  username: string,
  x?: number,
  y?: number
): Promise<string> {
  const commentRef = doc(collection(firestore, 'canvases/main/comments'));
  await setDoc(commentRef, {
    id: commentRef.id,
    shapeId: shapeId,
    userId: userId,
    username: username,
    text: text,
    x: x || null,
    y: y || null,
    createdAt: serverTimestamp(),
    resolved: false,
    replies: []
  });
  return commentRef.id;
}

async resolveComment(commentId: string): Promise<void> {
  const commentRef = doc(firestore, `canvases/main/comments/${commentId}`);
  await updateDoc(commentRef, {
    resolved: true,
    updatedAt: serverTimestamp()
  });
}

async addReply(
  commentId: string,
  userId: string,
  username: string,
  text: string
): Promise<void> {
  const commentRef = doc(firestore, `canvases/main/comments/${commentId}`);
  const commentDoc = await getDoc(commentRef);
  const currentReplies = commentDoc.data()?.replies || [];
  
  await updateDoc(commentRef, {
    replies: [
      ...currentReplies,
      {
        userId: userId,
        username: username,
        text: text,
        createdAt: serverTimestamp()
      }
    ],
    updatedAt: serverTimestamp()
  });
}

async subscribeToComments(callback: (comments: Comment[]) => void): Unsubscribe {
  const q = query(
    collection(firestore, 'canvases/main/comments'),
    where('resolved', '==', false)
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => doc.data() as Comment);
    callback(comments);
  });
}

async deleteComment(commentId: string): Promise<void> {
  const commentRef = doc(firestore, `canvases/main/comments/${commentId}`);
  await deleteDoc(commentRef);
}
```

#### UI Implementation

**Comment Indicators:**
- Shapes with comments show small comment icon (💬) in top-right corner
- Badge shows number of unresolved comments: "💬 3"
- Icon pulses when new comment added (animation)

**Comment Panel:**
- Click comment icon → opens floating comment panel
- Panel positioned near shape (doesn't block canvas)
- Panel dimensions: 300px wide, max 400px tall, scrollable
- White background, shadow for elevation

**Panel Contents:**
```
┌─────────────────────────────────────┐
│ Comments (3)              [×]       │
├─────────────────────────────────────┤
│ Alice • 2 min ago                   │
│ This needs to be bigger             │
│   Bob • 1 min ago                   │
│   I agree, let's make it 300px      │
│ [Reply...]                          │
│ [✓ Resolve]                         │
├─────────────────────────────────────┤
│ Carol • 5 min ago                   │
│ Change color to blue?               │
│ [Reply...]                          │
│ [✓ Resolve]                         │
├─────────────────────────────────────┤
│ [Add comment...]                    │
└─────────────────────────────────────┘
```

**Adding Comments:**
- Controls panel shows "💬 Add Comment" button when shape selected
- Click → opens comment input in panel
- Textarea with "Type comment..." placeholder
- Send button or Enter to post
- Escape to cancel

**Comment Thread:**
- Main comment by author with timestamp
- Nested replies indented with slight gray background
- Each comment shows username and relative time ("2 min ago")
- Reply button under each comment
- Resolve button (only for comment author or shape owner)

**Resolved Comments:**
- Resolved comments hide from panel by default
- "Show resolved (5)" toggle at bottom of panel
- Resolved comments shown with strikethrough and green checkmark

**Real-Time Updates:**
- New comments appear instantly for all users
- Comment count badge updates in real-time
- Panel auto-scrolls to newest comment
- Visual indicator when someone is typing (optional)

**Comment Rendering on Canvas:**

```typescript
// In Canvas.tsx
{comments.filter(c => !c.resolved).map(comment => {
  const shape = shapes.find(s => s.id === comment.shapeId);
  if (!shape) return null;
  
  return (
    <Group
      key={comment.id}
      x={shape.x + shape.width - 20}
      y={shape.y - 10}
    >
      {/* Comment icon badge */}
      <Circle
        radius={12}
        fill="#3b82f6"
        stroke="white"
        strokeWidth={2}
      />
      <Text
        text="💬"
        fontSize={16}
        x={-8}
        y={-8}
      />
      {/* Count badge if multiple comments */}
      {commentCount > 1 && (
        <Circle
          x={8}
          y={-8}
          radius={8}
          fill="#ef4444"
        />
        <Text
          text={commentCount.toString()}
          fontSize={10}
          fill="white"
          x={5}
          y={-11}
        />
      )}
    </Group>
  );
})}
```

**Gate:** User A adds comment "Make this bigger" to blue rectangle → User B sees comment icon appear, clicks it, reads comment, replies "Done". User A sees reply in real-time.

---

### Part C: AI Canvas Agent

The AI layer provides natural language access to all manual features.

---

### 13. AI Service Layer (P0 - Critical)

#### Architecture

```typescript
// services/aiService.ts
import OpenAI from 'openai';
import { CanvasService } from './canvasService';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

class AIService {
  private openai: OpenAI;
  private canvasService: CanvasService;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.canvasService = new CanvasService();
  }
  
  async executeCommand(prompt: string, userId: string): Promise<CommandResult> {
    try {
      // 1. Get canvas context
      const shapes = await this.canvasService.getShapes();
      
      // 2. Call OpenAI with function tools
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: this.getSystemPrompt(shapes) },
          { role: "user", content: prompt }
        ],
        tools: this.getToolDefinitions(),
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 500
      });
      
      const message = response.choices[0].message;
      
      // 3. Execute tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const results = await this.executeToolCalls(message.tool_calls, userId);
        return {
          success: true,
          message: this.generateSuccessMessage(results),
          toolCalls: results
        };
      } else {
        return {
          success: false,
          message: message.content || "I couldn't understand that command.",
          toolCalls: []
        };
      }
    } catch (error) {
      console.error('AI execution error:', error);
      return {
        success: false,
        message: "⚠️ AI service error. Please try again.",
        toolCalls: []
      };
    }
  }
  
  private async executeToolCalls(toolCalls: any[], userId: string) {
    const results = [];
    for (const call of toolCalls) {
      try {
        const result = await this.executeSingleTool(call, userId);
        results.push({
          tool: call.function.name,
          success: true,
          result: result
        });
      } catch (error) {
        results.push({
          tool: call.function.name,
          success: false,
          error: error.message
        });
      }
    }
    return results;
  }
  
private async executeSingleTool(call: any, userId: string) {
    const { name, arguments: argsStr } = call.function;
    const args = JSON.parse(argsStr);
    
    switch (name) {
        case 'createRectangle':
        return await this.canvasService.createShape({
            type: 'rectangle',
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            color: args.color,
            rotation: 0,
            zIndex: 0,
            groupId: null,
            createdBy: userId,
            createdAt: Date.now(),
            lockedBy: null,
            lockedAt: null
        });
        
        case 'createCircle':
        return await this.canvasService.createCircle({
            x: args.x,
            y: args.y,
            radius: args.radius,
            color: args.color,
            createdBy: userId
        });
        
        case 'createTriangle':
        return await this.canvasService.createTriangle({
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            color: args.color,
            createdBy: userId
        });
        
        case 'createText':
        return await this.canvasService.createText({
            text: args.text,
            x: args.x,
            y: args.y,
            fontSize: args.fontSize || 16,
            color: args.color || '#000000',
            fontWeight: args.fontWeight || 'normal',
            fontStyle: args.fontStyle || 'normal',
            textDecoration: args.textDecoration || 'none',
            createdBy: userId
        });
        
        case 'moveShape':
        return await this.canvasService.updateShape(args.shapeId, {
            x: args.x,
            y: args.y
        });
        
        case 'resizeShape':
        return await this.canvasService.resizeShape(
            args.shapeId,
            args.width,
            args.height
        );
        
        case 'rotateShape':
        return await this.canvasService.rotateShape(
            args.shapeId,
            args.rotation
        );
        
        case 'duplicateShape':
        return await this.canvasService.duplicateShape(args.shapeId, userId);
        
        case 'deleteShape':
        return await this.canvasService.deleteShape(args.shapeId);
        
        case 'groupShapes':
        return await this.canvasService.groupShapes(args.shapeIds, userId, args.name);
        
        case 'alignShapes':
        return await this.canvasService.alignShapes(args.shapeIds, args.alignment);
        
        case 'arrangeShapesInRow':
        return await this.arrangeInRow(args.shapeIds, args.spacing || 50);
        
        case 'bringToFront':
        return await this.canvasService.bringToFront(args.shapeId);
        
        case 'addComment':
        return await this.canvasService.addComment(
            args.shapeId,
            args.text,
            userId,
            args.username
        );
        
        case 'getCanvasState':
        return await this.canvasService.getShapes();
        
        default:
        throw new Error(`Unknown tool: ${name}`);
    }
    }
  }
  
  private async arrangeInRow(shapeIds: string[], spacing: number): Promise<void> {
    const shapes = await Promise.all(
      shapeIds.map(id => this.canvasService.getShape(id))
    );
    
    // Sort by current x position
    shapes.sort((a, b) => a.x - b.x);
    
    // Calculate positions with even spacing
    let currentX = shapes[0].x;
    const batch = writeBatch(firestore);
    
    for (const shape of shapes) {
      const shapeRef = doc(firestore, `canvases/main/shapes/${shape.id}`);
      batch.update(shapeRef, {
        x: currentX,
        updatedAt: serverTimestamp()
      });
      currentX += shape.width + spacing;
    }
    
    await batch.commit();
  }
  
  private generateSuccessMessage(results: any[]): string {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (failCount > 0) {
      const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
      return `⚠️ Completed ${successCount} actions, but ${failCount} failed: ${errors}`;
    }
    
    const toolNames = results.map(r => r.tool);
    
    // Generate specific messages based on tools used
    if (toolNames.includes('createRectangle') && toolNames.length === 1) {
      return '✓ Created 1 rectangle';
    }
    
    if (toolNames.includes('createText') && toolNames.length === 1) {
      return '✓ Created text layer';
    }
    
    if (toolNames.includes('moveShape')) {
      return '✓ Moved shape to new position';
    }
    
    if (toolNames.includes('resizeShape')) {
      return '✓ Resized shape';
    }
    
    if (toolNames.includes('rotateShape')) {
      return '✓ Rotated shape';
    }
    
    if (toolNames.includes('duplicateShape')) {
      return '✓ Duplicated shape';
    }
    
    if (toolNames.includes('deleteShape')) {
      return '✓ Deleted shape';
    }
    
    if (toolNames.includes('groupShapes')) {
      return `✓ Grouped ${toolNames.filter(t => t === 'groupShapes').length} shapes`;
    }
    
    if (toolNames.includes('alignShapes')) {
      return '✓ Aligned shapes';
    }
    
    if (toolNames.includes('arrangeShapesInRow')) {
      return '✓ Arranged shapes in horizontal row';
    }
    
    if (toolNames.includes('bringToFront')) {
      return '✓ Brought shape to front';
    }
    
    if (toolNames.includes('addComment')) {
      return '✓ Added comment';
    }
    
    // Multi-step operations
    const shapeCount = toolNames.filter(t => t === 'createRectangle').length;
    const textCount = toolNames.filter(t => t === 'createText').length;
    
    if (shapeCount > 1 || textCount > 1) {
      return `✓ Created ${shapeCount + textCount} elements`;
    }
    
    return `✓ Completed ${successCount} actions`;
  }
  
  private getToolDefinitions() {
    // See next section
  }
  
  private getSystemPrompt(shapes: any[]): string {
    // See System Prompt section
  }
}

export default AIService;
```

---

### 14. Tool Definitions (P0 - Critical)

Complete set of 15 tools for comprehensive AI functionality:

```typescript
private getToolDefinitions() {
  return [
    // CREATION (4 tools)
    {
      type: "function",
      function: {
        name: "createRectangle",
        description: "Creates a rectangle on the canvas at specified position with given dimensions and color.",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position in pixels (0-5000)" },
            y: { type: "number", description: "Y position in pixels (0-5000)" },
            width: { type: "number", description: "Width in pixels (minimum 10)" },
            height: { type: "number", description: "Height in pixels (minimum 10)" },
            color: { type: "string", description: "Hex color code like #3b82f6" }
          },
          required: ["x", "y", "width", "height", "color"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "createCircle",
        description: "Creates a circle on the canvas at specified center position with given radius and color.",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "Center X position in pixels (0-5000)" },
            y: { type: "number", description: "Center Y position in pixels (0-5000)" },
            radius: { type: "number", description: "Radius in pixels (minimum 5)" },
            color: { type: "string", description: "Hex color code like #ef4444" }
          },
          required: ["x", "y", "radius", "color"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "createTriangle",
        description: "Creates a triangle on the canvas at specified position with given dimensions and color.",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "Top vertex X position in pixels (0-5000)" },
            y: { type: "number", description: "Top vertex Y position in pixels (0-5000)" },
            width: { type: "number", description: "Base width in pixels (minimum 10)" },
            height: { type: "number", description: "Height in pixels (minimum 10)" },
            color: { type: "string", description: "Hex color code like #10b981" }
          },
          required: ["x", "y", "width", "height", "color"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "createText",
        description: "Creates a text layer at specified position with optional fontSize, color, and formatting (bold, italic, underline).",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text content to display" },
            x: { type: "number", description: "X position in pixels" },
            y: { type: "number", description: "Y position in pixels" },
            fontSize: { type: "number", description: "Font size in pixels (default 16)" },
            color: { type: "string", description: "Text color hex code (default #000000)" },
            fontWeight: { type: "string", enum: ["normal", "bold"], description: "Font weight (default normal)" },
            fontStyle: { type: "string", enum: ["normal", "italic"], description: "Font style (default normal)" },
            textDecoration: { type: "string", enum: ["none", "underline"], description: "Text decoration (default none)" }
          },
          required: ["text", "x", "y"]
        }
      }
    },
    
    // MANIPULATION (5 tools)
    {
      type: "function",
      function: {
        name: "moveShape",
        description: "Moves an existing shape to a new position. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to move" },
            x: { type: "number", description: "New X position" },
            y: { type: "number", description: "New Y position" }
          },
          required: ["shapeId", "x", "y"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "resizeShape",
        description: "Changes the dimensions of a shape (rectangles/triangles use width/height, circles use radius). MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to resize" },
            width: { type: "number", description: "New width in pixels (minimum 10, for rectangles/triangles)" },
            height: { type: "number", description: "New height in pixels (minimum 10, for rectangles/triangles)" },
            radius: { type: "number", description: "New radius in pixels (minimum 5, for circles)" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "rotateShape",
        description: "Rotates a shape by specified degrees. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to rotate" },
            rotation: { type: "number", description: "Rotation angle in degrees (0-360)" }
          },
          required: ["shapeId", "rotation"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "duplicateShape",
        description: "Creates a copy of an existing shape with a small offset. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to duplicate" }
          },
          required: ["shapeId"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "deleteShape",
        description: "Deletes a shape from the canvas. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to delete" }
          },
          required: ["shapeId"]
        }
      }
    },
    
    // GROUPING (1 tool)
    {
      type: "function",
      function: {
        name: "groupShapes",
        description: "Groups multiple shapes together so they move as one unit. MUST call getCanvasState first to find shapeIds.",
        parameters: {
          type: "object",
          properties: {
            shapeIds: { 
              type: "array", 
              items: { type: "string" },
              description: "Array of shape IDs to group together" 
            },
            name: { type: "string", description: "Optional name for the group" }
          },
          required: ["shapeIds"]
        }
      }
    },
    
    // ALIGNMENT (2 tools)
    {
      type: "function",
      function: {
        name: "alignShapes",
        description: "Aligns multiple shapes to the same edge or center. MUST call getCanvasState first to find shapeIds.",
        parameters: {
          type: "object",
          properties: {
            shapeIds: { 
              type: "array", 
              items: { type: "string" },
              description: "Array of shape IDs to align" 
            },
            alignment: { 
              type: "string", 
              enum: ["left", "center", "right", "top", "middle", "bottom"],
              description: "How to align the shapes" 
            }
          },
          required: ["shapeIds", "alignment"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "arrangeShapesInRow",
        description: "Arranges multiple shapes in a horizontal row with even spacing. MUST call getCanvasState first to find shapeIds. This is a LAYOUT command.",
        parameters: {
          type: "object",
          properties: {
            shapeIds: { 
              type: "array", 
              items: { type: "string" },
              description: "Array of shape IDs to arrange" 
            },
            spacing: { 
              type: "number", 
              description: "Space between shapes in pixels (default 50)" 
            }
          },
          required: ["shapeIds"]
        }
      }
    },
    
    // Z-INDEX (1 tool)
    {
      type: "function",
      function: {
        name: "bringToFront",
        description: "Brings a shape to the front (highest z-index). MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to bring to front" }
          },
          required: ["shapeId"]
        }
      }
    },
    
    // COMMENTS (1 tool)
    {
      type: "function",
      function: {
        name: "addComment",
        description: "Adds a comment to a shape for team collaboration. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to comment on" },
            text: { type: "string", description: "Comment text" },
            username: { type: "string", description: "Name of user adding comment" }
          },
          required: ["shapeId", "text", "username"]
        }
      }
    },
    
    // CANVAS STATE (1 tool)
    {
      type: "function",
      function: {
        name: "getCanvasState",
        description: "Returns all shapes currently on canvas. ALWAYS call this FIRST before manipulating existing shapes to get their IDs and properties.",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    }
  ];
}
```

**Total: 15 tools across all categories**
1. createRectangle
2. createCircle
3. createTriangle
4. createText
5. moveShape
6. resizeShape
7. rotateShape
8. duplicateShape
9. deleteShape
10. groupShapes
11. alignShapes
12. arrangeShapesInRow
13. bringToFront
14. addComment
15. getCanvasState

---

### 15. System Prompt (P0 - Critical)

Create `src/utils/aiPrompts.ts`:

```typescript
export function getSystemPrompt(shapes: any[]): string {
  const shapesSummary = shapes.length > 0 
    ? `\n\nCURRENT CANVAS STATE:\n${shapes.slice(0, 20).map(s => 
        `- ${s.type} (id: ${s.id}): ${s.color || 'text'} at (${s.x}, ${s.y})${
          s.width ? `, size ${s.width}×${s.height}` : ''
        }${s.groupId ? `, grouped` : ''}`
      ).join('\n')}${shapes.length > 20 ? `\n... and ${shapes.length - 20} more shapes` : ''}`
    : '\n\nCURRENT CANVAS STATE: Empty canvas';
  
  return `You are a canvas manipulation assistant for a 5000×5000 pixel collaborative design tool. Users give you natural language commands to create and modify shapes.

CRITICAL RULES:
1. ALWAYS call getCanvasState() FIRST before manipulating existing shapes (move, resize, rotate, duplicate, delete, group, align, arrange, comment)
2. Use the shapeId from getCanvasState results to identify target shapes
3. Identify shapes by their color, position, type, or grouping when user references them
4. Canvas coordinates: (0,0) is top-left, (5000,5000) is bottom-right
5. Canvas center is at (2500, 2500)
6. Default rectangle size is 200×150 if user doesn't specify
7. Default text fontSize is 16, color is black (#000000)
8. For vague positions like "center", "top", calculate actual coordinates

POSITION HELPERS:
- "center" → (2500, 2500) - adjust for shape width/height to truly center it
- "top-left" → (100, 100)
- "top" → (2500, 100)
- "top-right" → (4800, 100)
- "left" → (100, 2500)
- "right" → (4800, 2500)
- "bottom-left" → (100, 4800)
- "bottom" → (2500, 4800)
- "bottom-right" → (4800, 4800)

COLOR CODES (always use these exact hex values):
- red → #ef4444
- blue → #3b82f6
- green → #10b981
- yellow → #f59e0b
- black → #000000
- white → #ffffff

SIZE HELPERS:
- "twice as big" → multiply width and height by 2
- "half the size" → divide width and height by 2
- "bigger" → multiply by 1.5
- "smaller" → divide by 1.5

SHAPE IDENTIFICATION:
- "the blue rectangle" → call getCanvasState, find shape with type="rectangle" and color="#3b82f6"
- "these shapes" or "those shapes" → identify by context (recent, selected, or multiple matches)
- If multiple matches, pick the most recently created one (highest timestamp)
- If no match found, tell user clearly what you couldn't find

MULTI-STEP OPERATIONS:

**Login Form:**
User: "create a login form"
→ createText(text: "Username", x: 2400, y: 2200, fontSize: 14, color: "#000000")
→ createRectangle(x: 2300, y: 2225, width: 300, height: 40, color: "#ffffff")
→ createText(text: "Password", x: 2400, y: 2290, fontSize: 14, color: "#000000")
→ createRectangle(x: 2300, y: 2315, width: 300, height: 40, color: "#ffffff")
→ createText(text: "Submit", x: 2450, y: 2385, fontSize: 16, color: "#ffffff")
→ createRectangle(x: 2350, y: 2375, width: 200, height: 50, color: "#3b82f6")

**Grid Creation:**
User: "make a 3x3 grid of red squares"
→ Calculate: spacing = 110px, start position centered at (2200, 2200)
→ createRectangle(x: 2200, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2200, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2200, y: 2420, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2420, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2420, width: 80, height: 80, color: "#ef4444")

LAYOUT COMMANDS (CRITICAL - REQUIRED FOR RUBRIC):
User: "arrange these shapes in a horizontal row"
→ getCanvasState()
→ [identify shapes by context - recently created, selected, or all visible]
→ arrangeShapesInRow(shapeIds: ["shape_1", "shape_2", "shape_3"], spacing: 50)

User: "space these elements evenly"
→ getCanvasState()
→ arrangeShapesInRow(shapeIds: [...], spacing: 100)

GROUPING COMMANDS:
User: "group the blue shapes"
→ getCanvasState()
→ [find all shapes with color="#3b82f6"]
→ groupShapes(shapeIds: ["shape_1", "shape_2"], name: "Blue Group")

ALIGNMENT COMMANDS:
User: "align these shapes to the left"
→ getCanvasState()
→ [identify shapes]
→ alignShapes(shapeIds: [...], alignment: "left")

User: "center these vertically"
→ alignShapes(shapeIds: [...], alignment: "middle")

Z-INDEX COMMANDS:
User: "bring the blue rectangle to the front"
→ getCanvasState()
→ [find blue rectangle]
→ bringToFront(shapeId: "shape_123")

COMMENT COMMANDS:
User: "add a comment 'needs review' to the blue rectangle"
→ getCanvasState()
→ [find blue rectangle]
→ addComment(shapeId: "shape_123", text: "needs review", username: "[current user]")

EXAMPLES:

User: "Create a blue rectangle in the center"
→ createRectangle(x: 2400, y: 2425, width: 200, height: 150, color: "#3b82f6")

User: "Add text that says Hello World at the top"
→ createText(text: "Hello World", x: 2500, y: 150, fontSize: 16, color: "#000000")

User: "Move the blue rectangle to the top-left"
→ getCanvasState() 
→ [find blue rectangle, get its ID]
→ moveShape(shapeId: "shape_123", x: 100, y: 100)

User: "Make it twice as big"
→ getCanvasState()
→ [find most recent shape]
→ resizeShape(shapeId: "shape_123", width: 400, height: 300)

User: "Rotate that 45 degrees"
→ getCanvasState()
→ [find most recent/contextual shape]
→ rotateShape(shapeId: "shape_123", rotation: 45)

User: "Duplicate the blue rectangle"
→ getCanvasState()
→ [find blue rectangle]
→ duplicateShape(shapeId: "shape_123")

User: "Delete the red square"
→ getCanvasState()
→ [find red rectangle]
→ deleteShape(shapeId: "shape_456")

User: "Group these shapes"
→ getCanvasState()
→ [identify shapes by context]
→ groupShapes(shapeIds: ["shape_1", "shape_2", "shape_3"], name: "New Group")

User: "Arrange the rectangles in a row"
→ getCanvasState()
→ [find all rectangles]
→ arrangeShapesInRow(shapeIds: ["shape_1", "shape_2", "shape_3"], spacing: 50)

Be helpful, accurate, and execute commands precisely. Always validate parameters are within bounds before executing.${shapesSummary}`;
}
```

**Key additions for rubric:**
- ✅ Layout commands (arrangeShapesInRow) - **CRITICAL for AI scoring**
-✅ Grouping commands
- ✅ Alignment commands
- ✅ Z-index commands
- ✅ Comment commands
- ✅ Comprehensive examples for all 15 tools

---

### 16. AI Chat Interface (P0 - Critical)

#### Component Structure

```typescript
// components/AI/AIChat.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'success' | 'error';
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const aiService = new AIService();
  
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      const result = await aiService.executeCommand(input, user.uid);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        status: result.success ? 'success' : 'error'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date(),
        status: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={`ai-chat-drawer ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="ai-chat-header">
        <h3>AI Assistant</h3>
        <div className="header-controls">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '─' : '□'}
          </button>
          <button onClick={() => setIsOpen(false)}>×</button>
        </div>
      </div>
      
      {isOpen && (
        <>
          <MessageHistory messages={messages} />
          <ChatInput 
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isProcessing}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
};
```

#### UI Design

**Bottom Drawer Layout:**
```
┌────────────────────────────────────────┐
│         CANVAS AREA                    │
│                                        │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐  ← Drawer
│ AI Assistant          [─] [×]          │  ← Header
├────────────────────────────────────────┤
│ [Scrollable Message History]          │  ← 10 messages max
│                                        │
│ You: Create a blue rectangle           │
│ AI: ✓ Created 1 rectangle              │
│                                        │
│ You: Arrange them in a row             │
│ AI: ✓ Arranged 3 shapes in row        │
├────────────────────────────────────────┤
│ [Ask AI.....................] [Send ↑] │  ← Input
│ ⚡ AI is thinking...                    │  ← Status
└────────────────────────────────────────┘
```

**Visual Specifications:**
- Initial height: 300px
- Collapsed height: 50px (header only)
- Max height: 500px (resizable by dragging header)
- Slide animation: 300ms ease-out
- Background: White with shadow for elevation

**Gate:** User types "create a blue rectangle" → AI processes → shape appears → success message shows in chat

---

### 17. Demo Video (P0 - CRITICAL - Pass/Fail)

**Why Critical:** Missing demo video = -10 points penalty (Section 8 rubric)

#### Requirements

**Video Duration:** 3-5 minutes

**Required Content:**
1. **Real-time Collaboration (1 min)**
   - Split-screen showing 2 users (or picture-in-picture)
   - User A creates shapes → User B sees instantly
   - User A resizes/rotates → User B sees real-time
   - Show multi-select, grouping operations syncing
   - Show comments appearing for both users

2. **AI Command Demonstrations (1.5 min)**
   - Simple creation: "Create a blue rectangle in the center"
   - Manipulation: "Make it twice as big", "Rotate 45 degrees"
   - Layout: "Arrange these shapes in a horizontal row" (**CRITICAL**)
   - Complex: "Create a login form" (show 6 elements appearing)
   - Grouping: "Group the blue shapes"
   - Alignment: "Align these to the left"
   - Comments: "Add comment 'needs review' to this shape"

3. **Advanced Features Walkthrough (1 min)**
   - Multi-select with shift-click and marquee
   - Keyboard shortcuts (Delete, Duplicate, Arrow nudge)
   - Copy/paste demonstration
   - Z-index management (bring to front/back)
   - Collaborative comments with reply

4. **Architecture Explanation (0.5-1 min)**
   - Service layer architecture diagram
   - Hybrid database (Firestore + RTDB) rationale
   - AI integration (same CanvasService methods)
   - Real-time sync flow

**Technical Requirements:**
- Clear audio (microphone, no background noise)
- Clear video (1080p minimum, screen recording + webcam optional)
- Smooth playback (no lag or stuttering)
- Professional presentation (rehearse, edit out mistakes)

#### Recording Setup

**Tools:**
- Screen recording: OBS Studio, Loom, or QuickTime
- Split-screen: OBS scenes or video editing software
- Audio: Clear narration explaining what's happening
- Editing: DaVinci Resolve (free) or iMovie

**Recording Workflow:**
1. Script narration for each section
2. Record screen separately for each segment
3. Record separate browser windows for collaboration demo
4. Edit together with transitions
5. Add on-screen text for key points
6. Export at 1080p, upload to YouTube (unlisted or public)

**Submission:**
- Upload to YouTube/Vimeo
- Add link to README.md
- Include in project submission

---

## Data Models (Complete)

### Firestore Collections

#### `users` Collection (Unchanged from MVP)

```typescript
{
  uid: "user_abc",
  username: "Alice",
  email: "alice@example.com",
  cursorColor: "#ef4444",
  createdAt: timestamp
}
```

#### `canvases/main/shapes` Collection (Updated)

```typescript
{
  id: "shape_123",
  type: "rectangle | text | circle | triangle",
  
  // Position & Transform
  x: 100,
  y: 200,
  rotation: 0,              // Degrees (0-360)
  
  // Rectangle-specific
  width: 200,               // For rectangles
  height: 150,              // For rectangles
  color: "#3b82f6",         // Fill color for rectangles
  
  // Text-specific
  text: "Hello World",      // For text
  fontSize: 16,             // For text
  color: "#000000",         // Text color (for text)

  fontWeight: "normal" | "bold",           // NEW: Text formatting
  fontStyle: "normal" | "italic",          // NEW: Text formatting
  textDecoration: "none" | "underline",    // NEW: Text formatting
  
  // Advanced features
  zIndex: 5,                // NEW: Stacking order
  groupId: "group_abc" | null,  // NEW: Group membership
  
  // Metadata
  createdBy: "user_abc",
  createdAt: timestamp,
  lockedBy: "user_abc" | null,
  lockedAt: timestamp | null,
  updatedAt: timestamp
}
```

#### `canvases/main/groups` Collection (NEW)

```typescript
{
  id: "group_abc",
  name: "Login Form",
  shapeIds: ["shape_123", "shape_456", "shape_789"],
  createdBy: "user_abc",
  createdAt: timestamp
}
```

#### `canvases/main/comments` Collection (NEW)

```typescript
{
  id: "comment_123",
  shapeId: "shape_456",
  userId: "user_abc",
  username: "Alice",
  text: "This needs to be bigger",
  x: 100,                   // Pin position (optional)
  y: 200,
  createdAt: timestamp,
  resolved: false,
  replies: [
    {
      userId: "user_def",
      username: "Bob",
      text: "I agree",
      createdAt: timestamp
    }
  ]
}
```

### RTDB Paths (Unchanged from MVP)

```json
{
  "sessions": {
    "main": {
      "users": {
        "user_abc": {
          "cursor": {
            "x": 450,
            "y": 300,
            "username": "Alice",
            "color": "#ef4444",
            "timestamp": "timestamp"
          },
          "presence": {
            "online": true,
            "lastSeen": "timestamp",
            "username": "Alice"
          }
        }
      }
    }
  }
}
```

---

## Tech Stack (Updated)

### Frontend
- React + TypeScript + Vite
- Konva.js + react-konva (canvas rendering)
- React Context (state management)
- React Hot Toast (notifications)

### Backend
- Firebase Authentication (email/password)
- Cloud Firestore (shapes, groups, comments)
- Firebase Realtime Database (cursors, presence)

### AI
- OpenAI GPT-4-turbo (function calling)

### Deployment
- Vercel (frontend hosting)

### Additional Libraries
- Lodash (throttle, debounce)

---

## Build Sequence & Task Breakdown

The complete task list with 17 PRs is detailed in `task-phase2.md`. Key milestones:

**Part 1: Core Manual Features (PRs #8-11, ~20 hours)**
- Resize, Rotate, Text, Delete, Duplicate

**Part 2: Advanced Features (PRs #12-15, ~25 hours)**
- Multi-select, Grouping, Z-index, Alignment, Keyboard shortcuts, Copy/paste, Comments

**Part 3: AI Integration (PRs #16-18, ~15 hours)**
- AI Service, Tool definitions, Chat UI, Context awareness, Layout commands

**Part 4: Testing & Deployment (PRs #19-20, ~8 hours)**
- Integration testing, Bug fixes, Polish, Demo video, Deployment

**Total estimated time:** 68-78 hours (fits within 72-hour window)

---

## Testing Checklist

### Core Manual Features ✅

**Resize:**
- [ ] 8 handles appear when shape locked
- [ ] Corner handles resize proportionally
- [ ] Edge handles resize single dimension
- [ ] Minimum 10×10 enforced
- [ ] User A resizes → User B sees in <100ms

**Rotate:**
- [ ] Rotation handle appears above locked shape
- [ ] Angle tooltip shows during drag
- [ ] Shape rotates around center
- [ ] User A rotates → User B sees in <100ms

**Text:**
- [ ] Text tool activates click-to-place mode
- [ ] Double-click opens edit mode
- [ ] Font size changes sync
- [ ] User A creates/edits → User B sees in <100ms

**Delete/Duplicate:**
- [ ] Delete button removes shape
- [ ] Duplicate creates copy with offset
- [ ] User A deletes/duplicates → User B sees in <100ms

### Advanced Features ✅

**Multi-select:**
- [ ] Shift+click adds to selection
- [ ] Marquee selection works (drag rectangle)
- [ ] All selected shapes show blue border
- [ ] Group operations work (move all, delete all)

**Grouping:**
- [ ] Can group 2+ selected shapes
- [ ] Grouped shapes move together
- [ ] Can ungroup shapes
- [ ] User A groups → User B sees group behavior

**Z-index:**
- [ ] Bring to front/back buttons work
- [ ] Shapes render in correct order
- [ ] User A changes z-index → User B sees layer change

**Alignment:**
- [ ] Align left/center/right works
- [ ] Align top/middle/bottom works
- [ ] Distribute horizontally/vertically works
- [ ] User A aligns → User B sees alignment

**Keyboard Shortcuts:**
- [ ] Delete key removes shape
- [ ] Cmd/Ctrl+D duplicates
- [ ] Cmd/Ctrl+C/V copy/paste
- [ ] Arrow keys nudge shapes
- [ ] Cmd/Ctrl+G groups shapes
- [ ] Z-index shortcuts work

**Comments:**
- [ ] Can add comment to shape
- [ ] Comment icon appears on shape
- [ ] Comment panel shows threads
- [ ] Can reply to comments
- [ ] User A adds comment → User B sees in real-time

### AI Features ✅

**AI Service:**
- [ ] Can initialize OpenAI client
- [ ] All 15 tool definitions valid
- [ ] executeCommand calls correct tools
- [ ] Error handling works

**Command Types:**
- [ ] Creation: "Create blue rectangle"
- [ ] Manipulation: "Move it to center", "Make it bigger", "Rotate 45 degrees"
- [ ] Layout: "Arrange in a row" (**CRITICAL**)
- [ ] Grouping: "Group these shapes"
- [ ] Alignment: "Align to the left"
- [ ] Z-index: "Bring to front"
- [ ] Comments: "Add comment 'needs review'"
- [ ] Complex: "Create login form" (6 elements)
- [ ] Complex: "Make 3×3 grid" (9 shapes)

**AI Performance:**
- [ ] Single-step commands <2s latency
- [ ] Multi-step commands <5s latency
- [ ] 90%+ accuracy on valid commands
- [ ] Context awareness works ("the blue rectangle")

**Multi-user AI:**
- [ ] User A's AI command visible to User B
- [ ] Concurrent AI commands work
- [ ] AI respects locked shapes

### Performance ✅

- [ ] 60 FPS maintained with 50+ shapes
- [ ] Canvas works with 500+ shapes
- [ ] 5+ concurrent users without degradation
- [ ] All sync operations <100ms
- [ ] AI commands meet latency targets

### Deployment ✅

- [ ] App deployed to production URL
- [ ] All features work on deployed version
- [ ] 5+ users tested on production
- [ ] Demo video recorded and submitted
- [ ] README updated with setup and demo link

---

## Rubric Scoring Projection

Based on Phase 2 features:

| Section | Max Points | Phase 2 Score | Notes |
|---------|------------|---------------|-------|
| **1. Collaborative Infrastructure** | 30 | 28-30 | ✅ Excellent - all targets met |
| **2. Canvas Features & Performance** | 20 | 18-20 | ✅ Excellent - multi-select, transforms, text |
| **3. Advanced Figma Features** | 15 | 13-15 | ✅ Excellent - 3 Tier 1 + 2 Tier 2 + 1 Tier 3 |
| **4. AI Canvas Agent** | 25 | 23-25 | ✅ Excellent - 15 tools, layout commands included |
| **5. Technical Implementation** | 10 | 9-10 | ✅ Excellent - clean architecture |
| **6. Documentation** | 5 | 5 | ✅ Excellent - comprehensive |
| **7. AI Dev Log** | Pass/Fail | PASS | ✅ All sections included |
| **8. Demo Video** | -10 if fail | PASS | ✅ All requirements met |
| **TOTAL** | **100** | **96-105** | **A+ (with bonus)** |

### Bonus Points Potential (+5 max)

- **Innovation (+2):** Collaborative comments on shapes (unique feature)
- **Polish (+2):** Professional UI, smooth animations, keyboard shortcuts
- **Scale (+1):** 500+ shapes at 60 FPS, 5+ users

**Final projected score: 96-100 points (A+)**

---

## Explicitly Out of Scope

### Features NOT in Phase 2

**Canvas Features:**
- Custom fonts or font families
- Shape fill patterns or gradients
- Shape stroke styles (dashed, dotted)
- Shadow or blur effects
- Opacity control
- Image uploads or embedding

**Advanced Features:**
- Undo/redo functionality
- Version history with restore
- Export to PNG/SVG
- Import from other tools
- Snap-to-grid with visual guides
- Ruler or measurement tools
- Component system (reusable symbols)
- Design tokens/styles system
- Canvas frames/artboards
- Auto-layout (flexbox-like)
- Plugins/extensions system
- Vector path editing (pen tool)
- Prototyping/interaction modes

**Collaboration Features:**
- Voice/video chat
- Cursor chat (typing indicators)
- User permissions (view-only, edit)
- Workspace management
- Project folders
- Team management

**AI Features:**
- AI design suggestions
- AI-powered auto-layout
- AI image generation
- AI style transfer
- Streaming AI responses
- AI conversation history
- Custom AI behavior settings

**Technical Features:**
- Offline mode support
- Mobile responsive design
- Touch/pen input support
- Firestore transactions (documented limitation)
- Optimistic UI updates
- Advanced caching strategies
- Analytics or monitoring

---

## Known Limitations

### Phase 2 Limitations

#### 1. **Lock Race Condition (~50ms window)**
- **Current:** If two users click shape within ~50ms, last write wins
- **Impact:** Low (rare with 2-5 users)
- **Mitigation:** Documented limitation
- **Future:** Upgrade to Firestore transactions

#### 2. **Shape Types Limited**
- **Current:** Only rectangles and text
- **Impact:** Medium (limits design options)
- **Future:** Add circles, lines, polygons

#### 3. **No Undo/Redo**
- **Current:** Manual corrections only
- **Impact:** Medium (professional tools have this)
- **Mitigation:** Keyboard shortcuts make corrections fast
- **Future:** Implement operation history

#### 4. **Marquee Selection Performance**
- **Current:** Checks all shapes on every mousemove
- **Impact:** Low (works fine with <500 shapes)
- **Future:** Spatial indexing for >1000 shapes

#### 5. **Group Transform**
- **Current:** Group moves together, but resize/rotate apply to individual shapes
- **Impact:** Low (acceptable for MVP)
- **Future:** Unified bounding box transform

#### 6. **Comment Notifications**
- **Current:** No push notifications for new comments
- **Impact:** Low (users see comments in real-time if on canvas)
- **Future:** Toast notifications or email alerts

---

## Success Metrics

### Phase 2 Completion Criteria

**MUST PASS (Critical):**
- [ ] All core manual features working (resize, rotate, text, delete, duplicate)
- [ ] Multi-select with shift-click and marquee
- [ ] Grouping and ungrouping
- [ ] Z-index management (4 buttons)
- [ ] Alignment tools (6 alignment types + distribute)
- [ ] Keyboard shortcuts (10+ shortcuts)
- [ ] Copy/paste functionality
- [ ] Collaborative comments
- [ ] AI agent with 15 tools
- [ ] AI layout command ("arrange in a row")
- [ ] AI complex commands (login form, grid)
- [ ] Demo video (3-5 min, all requirements)
- [ ] Deployed to production URL
- [ ] 5+ concurrent users tested
- [ ] All features sync <100ms
- [ ] AI commands <2s single, <5s multi-step
- [ ] 60 FPS performance maintained

**Scoring Targets:**
- Collaborative Infrastructure: 28-30/30 ✅
- Canvas Features: 18-20/20 ✅
- Advanced Features: 13-15/15 ✅
- AI Agent: 23-25/25 ✅
- Technical: 9-10/10 ✅
- Documentation: 5/5 ✅
- AI Dev Log: PASS ✅
- Demo Video: PASS ✅

**Total Target: 96-100 points (A+)**

---

## Risk Mitigation

### High-Risk Areas

#### 1. **Time Management**
- **Risk:** 68-78 hour estimate might be tight
- **Mitigation:**
  - Start with highest-value features (multi-select, AI layout)
  - Cut lower-priority features if needed (comments can be simplified)
  - Use AI coding assistants aggressively
  - Work in parallel where possible (AI while testing manual features)

#### 2. **AI Layout Command Complexity**
- **Risk:** "Arrange in a row" algorithm might be tricky
- **Mitigation:**
  - Simple sorting + spacing algorithm (not complex)
  - Test with 3-4 shapes first
  - Fallback: Manual spacing if auto-spacing fails

#### 3. **Multi-Select Performance**
- **Risk:** Marquee selection with 500+ shapes might lag
- **Mitigation:**
  - Throttle mousemove to 60 FPS
  - Use bounding box intersection (fast)
  - Profile early, optimize if needed

#### 4. **Demo Video Quality**
- **Risk:** Video production takes longer than expected
- **Mitigation:**
  - Record segments separately (easier to edit)
  - Use script to stay on track
  - Keep it simple (no fancy editing needed)
  - Budget 2 hours for recording + editing

#### 5. **OpenAI API Costs**
- **Risk:** High costs during development/testing
- **Mitigation:**
  - Use GPT-3.5-turbo for development testing
  - Switch to GPT-4-turbo for final version
  - Set budget alerts in OpenAI dashboard
  - Limit prompt length (500 tokens max)

---

## Development Strategy

### Phase 2 Execution Plan

**Week 1 (Days 1-3): Core Features**
- Focus: Get manual features working first
- Priorities: Resize, Rotate, Text (these enable everything else)
- Gate: Can manually create, resize, rotate, edit text

**Week 1 (Days 3-5): Advanced Features**
- Focus: Multi-select, Grouping, Z-index, Alignment
- These are high-value rubric features
- Gate: Can select multiple, group, align, layer

**Week 1 (Days 5-6): Power User Features**
- Focus: Keyboard shortcuts, Copy/paste
- Quick wins for rubric points
- Gate: All shortcuts work smoothly

**Week 1 (Day 6): Comments**
- Focus: Collaborative comments (Tier 3 feature)
- Can be simplified if time tight
- Gate: Can add/view/reply to comments

**Week 1 (Days 6-7): AI Integration**
- Focus: AI service, tools, chat UI
- Critical: Include layout command
- Gate: AI executes all 15 tool types

**Week 1 (Day 7): Polish & Deploy**
- Focus: Testing, bug fixes, demo video
- Critical: Record video early (leaves time for reshoots)
- Gate: Deployed, tested with 5+ users, video submitted

---

## Final Checklist Before Starting

### Setup
- [ ] MVP fully working and deployed
- [ ] Firebase project configured
- [ ] OpenAI API key obtained
- [ ] Vercel account ready
- [ ] Video recording software installed

### Knowledge
- [ ] Reviewed rubric thoroughly
- [ ] Understand scoring breakdown
- [ ] Know which features are critical vs nice-to-have
- [ ] Understand 15 AI tools and their categories
- [ ] Reviewed demo video requirements

### Planning
- [ ] Task list prioritized
- [ ] Time estimates validated
- [ ] Risk mitigation strategies ready
- [ ] Fallback plans for each high-risk area

### Execution
- [ ] AI coding assistants ready (Cursor, Copilot, etc.)
- [ ] Development environment optimized
- [ ] Firebase emulators running
- [ ] Multiple browser windows for testing

---

## Questions for Alignment

Before proceeding to task list:

1. **Confirmed scope:** All 9 features + AI + demo video?
2. **Timeline:** 72 hours realistic for this scope?
3. **AI provider:** OpenAI GPT-4-turbo confirmed?
4. **Priority adjustments:** Any features to deprioritize if time runs short?
5. **Demo video:** Comfortable with recording requirements?