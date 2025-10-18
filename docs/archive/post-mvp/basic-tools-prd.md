# PR #2A: AI Manipulation Tools

## Overview

**Goal:** Add 5 manipulation tools so AI can move, resize, rotate, duplicate, and delete existing shapes.

**Timeline:** 25 minutes  
**Complexity:** Medium (5 new tools, context awareness)  
**Depends On:** PR #1 must be complete and tested

---

## What Gets Built

### 5 Manipulation Tools

1. **moveShape** - Move existing shapes to new positions
2. **resizeShape** - Change dimensions of shapes
3. **rotateShape** - Rotate shapes by degrees
4. **duplicateShape** - Create copies with offset
5. **deleteShape** - Remove shapes from canvas

### Key New Capability

After this PR, AI will understand contextual commands like:
- "Move the blue rectangle to the center"
- "Make it twice as big"
- "Rotate that 45 degrees"
- "Duplicate the circle"
- "Delete the red one"

---

## Files to Modify

```
src/services/aiService.ts          (UPDATE - add 5 tools to switch statement)
src/utils/aiPrompts.ts             (UPDATE - add manipulation examples)
```

---

## Implementation Details

### 1. Update `src/services/aiService.ts`

#### A. Add 5 New Tool Cases to `executeSingleTool()`

Find the `executeSingleTool()` method and add these 5 cases **after the existing 4 creation tools**:

```typescript
private async executeSingleTool(call: any, userId: string) {
  const { name, arguments: argsStr } = call.function;
  const args = JSON.parse(argsStr);
  
  switch (name) {
    // EXISTING 4 CREATION TOOLS (from PR #1 - leave these unchanged)
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
      
    
    // NEW MANIPULATION TOOLS (add these 5 cases)
    case 'moveShape':
      return await this.canvasService.updateShape(args.shapeId, {
        x: args.x,
        y: args.y
      });
      
    case 'resizeShape':
      if (args.radius !== undefined) {
        // Circle resize
        return await this.canvasService.resizeCircle(args.shapeId, args.radius);
      } else {
        // Rectangle/Triangle resize
        return await this.canvasService.resizeShape(
          args.shapeId,
          args.width,
          args.height
        );
      }
      
    case 'rotateShape':
      return await this.canvasService.rotateShape(
        args.shapeId,
        args.rotation
      );
      
    case 'duplicateShape':
      return await this.canvasService.duplicateShape(args.shapeId, userId);
      
    case 'deleteShape':
      return await this.canvasService.deleteShape(args.shapeId);
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

#### B. Add `getCanvasState` Tool (Required for Context Awareness)

Add this one additional tool case (needed for AI to identify shapes):

```typescript
case 'getCanvasState':
  return await this.canvasService.getShapes();
```

So the total is **6 new cases** (5 manipulation + 1 helper).

#### C. Update `generateSuccessMessage()` Method

Replace the existing `generateSuccessMessage()` method with this expanded version:

```typescript
private generateSuccessMessage(results: any[]): string {
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  if (failCount > 0) {
    const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
    return `⚠️ Completed ${successCount} actions, but ${failCount} failed: ${errors}`;
  }
  
  const toolNames = results.map(r => r.tool);
  
  // Single tool messages
  if (toolNames.length === 1) {
    const tool = toolNames[0];
    switch (tool) {
      case 'createRectangle': return '✓ Created 1 rectangle';
      case 'createCircle': return '✓ Created 1 circle';
      case 'createTriangle': return '✓ Created 1 triangle';
      case 'moveShape': return '✓ Moved shape to new position';
      case 'resizeShape': return '✓ Resized shape';
      case 'rotateShape': return '✓ Rotated shape';
      case 'duplicateShape': return '✓ Duplicated shape';
      case 'deleteShape': return '✓ Deleted shape';
      case 'getCanvasState': return '✓ Retrieved canvas state';
      default: return '✓ Action completed';
    }
  }
  
  // Multi-step operations
  const creationCount = toolNames.filter(t => 
    ['createRectangle', 'createCircle', 'createTriangle', 'createText'].includes(t)
  ).length;
  
  if (creationCount > 1) {
    return `✓ Created ${creationCount} elements`;
  }
  
  return `✓ Completed ${successCount} actions`;
}
```

#### D. Add 6 New Tool Definitions to `getToolDefinitions()`

Add these tool definitions **after the existing 4 creation tools**:

```typescript
private getToolDefinitions() {
  return [
    // EXISTING 4 CREATION TOOLS (from PR #1 - leave unchanged)
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
    
    // NEW MANIPULATION TOOLS (add these 5)
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
        description: "Changes the dimensions of a shape. For rectangles/triangles use width/height, for circles use radius. MUST call getCanvasState first to find the shapeId.",
        parameters: {
          type: "object",
          properties: {
            shapeId: { type: "string", description: "ID of the shape to resize" },
            width: { type: "number", description: "New width in pixels (for rectangles/triangles)" },
            height: { type: "number", description: "New height in pixels (for rectangles/triangles)" },
            radius: { type: "number", description: "New radius in pixels (for circles)" }
          },
          required: ["shapeId"]
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
    
    // CANVAS STATE TOOL (add this 1 helper)
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

---

### 2. Update `src/utils/aiPrompts.ts`

Replace the **entire file** with this expanded version that includes manipulation examples:

```typescript
export function getSystemPrompt(shapes: any[]): string {
  const shapesSummary = shapes.length > 0 
    ? `\n\nCURRENT CANVAS STATE:\n${shapes.slice(0, 20).map(s => 
        `- ${s.type} (id: ${s.id}): ${s.color || 'text'} at (${s.x}, ${s.y})${
          s.width ? `, size ${s.width}×${s.height}` : ''
        }${s.radius ? `, radius ${s.radius}` : ''
        }${s.text ? `, text: "${s.text}"` : ''}`
      ).join('\n')}${shapes.length > 20 ? `\n... and ${shapes.length - 20} more shapes` : ''}`
    : '\n\nCURRENT CANVAS STATE: Empty canvas';
  
  return `You are a canvas manipulation assistant for a 5000×5000 pixel collaborative design tool. Users give you natural language commands to create and modify shapes.

CRITICAL RULES:
1. ALWAYS call getCanvasState() FIRST before manipulating existing shapes (move, resize, rotate, duplicate, delete)
2. Use the shapeId from getCanvasState results to identify target shapes
3. Identify shapes by their color, position, type, or text content when user references them
4. Canvas coordinates: (0,0) is top-left, (5000,5000) is bottom-right
5. Canvas center is at (2500, 2500)
6. Default rectangle size is 200×150 if user doesn't specify
7. For vague positions like "center", "top", calculate actual coordinates

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
- "these shapes" or "it" → identify by context (most recently created or mentioned)
- If multiple matches, pick the most recently created one (highest createdAt timestamp)
- If no match found, tell user clearly what you couldn't find

CREATION EXAMPLES:

User: "Create a blue rectangle in the center"
→ createRectangle(x: 2400, y: 2425, width: 200, height: 150, color: "#3b82f6")

User: "Add a red circle at the top"
→ createCircle(x: 2500, y: 100, radius: 75, color: "#ef4444")

User: "Make a green triangle in the bottom-left"
→ createTriangle(x: 100, y: 4670, width: 150, height: 130, color: "#10b981")


MANIPULATION EXAMPLES (ALWAYS CALL getCanvasState FIRST):

User: "Move the blue rectangle to the center"
→ getCanvasState()
→ [find blue rectangle, get its ID and dimensions]
→ moveShape(shapeId: "shape_123", x: 2400, y: 2425)  // Centered accounting for width/height

User: "Move it to the top-left"
→ getCanvasState()
→ [find most recent shape or contextually referenced shape]
→ moveShape(shapeId: "shape_123", x: 100, y: 100)

User: "Make it twice as big"
→ getCanvasState()
→ [find most recent shape, get current dimensions]
→ resizeShape(shapeId: "shape_123", width: 400, height: 300)  // Doubled from 200×150

User: "Make the circle bigger"
→ getCanvasState()
→ [find circle, get current radius]
→ resizeShape(shapeId: "shape_456", radius: 112)  // 1.5x bigger

User: "Rotate it 45 degrees"
→ getCanvasState()
→ [find most recent/contextual shape]
→ rotateShape(shapeId: "shape_123", rotation: 45)

User: "Rotate the blue rectangle 90 degrees"
→ getCanvasState()
→ [find blue rectangle]
→ rotateShape(shapeId: "shape_123", rotation: 90)

User: "Duplicate the blue rectangle"
→ getCanvasState()
→ [find blue rectangle]
→ duplicateShape(shapeId: "shape_123")

User: "Duplicate it"
→ getCanvasState()
→ [find most recent/contextual shape]
→ duplicateShape(shapeId: "shape_123")

User: "Delete the red square"
→ getCanvasState()
→ [find red rectangle - users often say "square" for rectangles]
→ deleteShape(shapeId: "shape_456")

User: "Delete that"
→ getCanvasState()
→ [find most recent/contextual shape]
→ deleteShape(shapeId: "shape_456")


CONTEXT AWARENESS:

User: "Create a yellow rectangle at 1000, 1000"
User: "Make it bigger"
→ getCanvasState()
→ [find yellow rectangle - it's the most recent]
→ resizeShape(shapeId: "shape_123", width: 300, height: 225)

User: "Create a blue circle and a red triangle"
User: "Rotate the blue one 45 degrees"
→ getCanvasState()
→ [find blue circle - specified by color]
→ rotateShape(shapeId: "shape_456", rotation: 45)


Be helpful, accurate, and execute commands precisely. Always validate parameters are within bounds before executing.${shapesSummary}`;
}
```

---

## Testing Commands

Test these commands in browser console after implementing:

```javascript
// ========================================
// BASIC MANIPULATION TESTS
// ========================================

// Test 1: Move shape
testAI("create a blue rectangle at 500, 500");
testAI("move the blue rectangle to the center");
// Expected: Rectangle moves to (2400, 2425)
// Expected output: "✓ Moved shape to new position"

// Test 2: Resize rectangle
testAI("make it twice as big");
// Expected: Rectangle becomes 400×300 (from 200×150)
// Expected output: "✓ Resized shape"

// Test 3: Resize circle
testAI("create a red circle at 1000, 1000");
testAI("make the circle bigger");
// Expected: Circle radius increases to ~112 (1.5x from 75)
// Expected output: "✓ Resized shape"

// Test 4: Rotate shape
testAI("rotate it 45 degrees");
// Expected: Circle rotates 45 degrees
// Expected output: "✓ Rotated shape"

// Test 5: Duplicate shape
testAI("duplicate the red circle");
// Expected: Copy appears with 20px offset
// Expected output: "✓ Duplicated shape"

// Test 6: Delete shape
testAI("delete the blue rectangle");
// Expected: Blue rectangle disappears
// Expected output: "✓ Deleted shape"

// ========================================
// CONTEXT AWARENESS TESTS
// ========================================

// Test 7: "it" reference
testAI("create a green triangle at 1500, 1500");
testAI("rotate it 90 degrees");
testAI("duplicate it");
// Expected: Triangle rotates, then duplicates
// Expected outputs: "✓ Rotated shape" → "✓ Duplicated shape"

// Test 8: Identify by color
testAI("create a yellow rectangle and a yellow circle");
testAI("move the yellow rectangle to the top");
// Expected: Only rectangle moves (not circle)
// Expected output: "✓ Moved shape to new position"


// Test 9: Multiple operations in sequence
testAI("create a blue circle at 2000, 2000");
testAI("make it smaller");
testAI("move it to the bottom-right");
testAI("rotate it 180 degrees");
// Expected: Circle shrinks → moves → rotates
// Expected outputs: 3 success messages

// ========================================
// ERROR HANDLING TESTS
// ========================================

// Test 10: Shape not found
testAI("move the purple hexagon to the left");
// Expected: AI responds that it can't find purple hexagon
// Should not crash

// Test 11: Ambiguous reference with fallback
testAI("create 3 blue rectangles at random positions");
testAI("move the blue rectangle to the center");
// Expected: AI picks most recent blue rectangle
// Expected output: "✓ Moved shape to new position"
```

---

## Success Criteria

### Must Pass:
- ✅ All 6 new tools added to `executeSingleTool()` switch
- ✅ All 6 new tool definitions added to `getToolDefinitions()`
- ✅ System prompt updated with manipulation examples
- ✅ `generateSuccessMessage()` handles manipulation tools
- ✅ Can move shapes by color ("move the blue rectangle")
- ✅ Can resize shapes with size helpers ("twice as big")
- ✅ Can rotate shapes by degrees
- ✅ Can duplicate shapes
- ✅ Can delete shapes by identifier
- ✅ AI calls `getCanvasState()` before manipulation
- ✅ Context awareness works ("it", "that", color/type references)
- ✅ All 11 test commands pass

### Quality Checks:
- ✅ Position calculations accurate (centered shapes truly centered)
- ✅ Size calculations correct (2x, 0.5x, 1.5x)
- ✅ Rotation works for all shape types
- ✅ Duplicate offset is consistent (20px)
- ✅ Error handling graceful (shape not found doesn't crash)
- ✅ Commands complete in <2 seconds

---

## Common Issues & Debugging

### Issue 1: "Shape not found" on manipulation commands
**Cause:** AI not calling `getCanvasState()` first  
**Solution:** Check system prompt has "ALWAYS call getCanvasState FIRST" emphasized multiple times

### Issue 2: Wrong shape manipulated
**Cause:** Color matching incorrect (e.g., "#3b82f6" vs "blue")  
**Solution:** Verify system prompt has exact hex codes in COLOR CODES section

### Issue 3: Size calculations wrong
**Cause:** Math in prompt examples incorrect  
**Solution:** Check SIZE HELPERS section (2x means multiply by 2, not add)

### Issue 4: "it" reference doesn't work
**Cause:** AI can't determine context  
**Solution:** Review CONTEXT AWARENESS examples in prompt

### Issue 5: Resize fails for circles
**Cause:** Using width/height instead of radius  
**Solution:** Check `resizeShape` tool handles both cases (radius vs width/height)

---

## Time Estimate

- Add 6 tool cases: 8 min
- Add 6 tool definitions: 7 min
- Update system prompt: 10 min
- Testing (11 commands): 15 min
- Bug fixes: 5 min

**Total: ~25 minutes**

---

## What's Next (PR #2B)

After this PR is complete and tested:
- **PR #2B** will add 6 advanced tools (group, align, **arrange in row**, z-index, comment)
- **PR #2B** will add complex multi-step commands (login form, grid)
- **PR #2B** contains the CRITICAL layout command for rubric scoring

**Do not implement PR #2B features yet.** This PR focuses only on basic manipulation.

---

## Final Checklist

Before marking PR #2A complete:

### Implementation:
- [ ] 6 tool cases added to `executeSingleTool()`
- [ ] 6 tool definitions added to `getToolDefinitions()`
- [ ] System prompt updated with manipulation examples
- [ ] `generateSuccessMessage()` handles all 6 new tools

### Core Testing:
- [ ] moveShape works (by color, by type)
- [ ] resizeShape works (rectangles, circles, with size helpers)
- [ ] rotateShape works (all shape types)
- [ ] duplicateShape works (correct offset)
- [ ] deleteShape works (by identifier)
- [ ] getCanvasState returns shapes correctly

### Context Awareness:
- [ ] "it"/"that" references work
- [ ] Color identification works ("the blue one")
- [ ] Type identification works ("the circle")
- [ ] Most recent shape logic works when ambiguous

### All 12 Test Commands:
- [ ] Tests 1-6 pass (basic manipulation)
- [ ] Tests 7-9 pass (context awareness)
- [ ] Tests 10-11 pass (error handling)