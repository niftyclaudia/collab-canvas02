# Text Functionality Backlog

## Overview

This document contains all text-related functionality that was removed from the basic manipulation tools PR. This will be implemented separately once the text shape functionality is ready.

---

## Text Creation Tool

### Tool Definition (for `getToolDefinitions()`)

```typescript
{
  type: "function",
  function: {
    name: "createText",
    description: "Creates a text layer at specified position with optional fontSize, color, and formatting.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to display" },
        x: { type: "number", description: "X position in pixels" },
        y: { type: "number", description: "Y position in pixels" },
        fontSize: { type: "number", description: "Font size in pixels (default 16)" },
        color: { type: "string", description: "Text color hex code (default #000000)" },
        fontWeight: { 
          type: "string", 
          enum: ["normal", "bold"], 
          description: "Font weight (default normal)" 
        },
        fontStyle: { 
          type: "string", 
          enum: ["normal", "italic"], 
          description: "Font style (default normal)" 
        },
        textDecoration: { 
          type: "string", 
          enum: ["none", "underline"], 
          description: "Text decoration (default none)" 
        }
      },
      required: ["text", "x", "y"]
    }
  }
}
```

### Tool Implementation (for `executeSingleTool()`)

```typescript
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
```

### Success Message (for `generateSuccessMessage()`)

```typescript
case 'createText': return '✓ Created text layer';
```

---

## Text Manipulation Examples

### System Prompt Additions

Add these to the system prompt when text functionality is ready:

#### Text Creation Examples:
```
User: "Add text that says Hello World at the top"
→ createText(text: "Hello World", x: 2450, y: 150, fontSize: 16, color: "#000000")
```

#### Text Identification:
```
- "the text saying Hello" → find shape with type="text" and text containing "Hello"
```

#### Text Manipulation Examples:
```
User: "Delete the text saying Hello"
→ getCanvasState()
→ [find text containing "Hello"]
→ deleteShape(shapeId: "shape_789")

User: "Create text saying TITLE at the center"
User: "Move it to the top"
→ getCanvasState()
→ [find text with "TITLE"]
→ moveShape(shapeId: "shape_789", x: 2450, y: 100)
```

---

## Text Testing Commands

### Test 9: Identify by text
```javascript
testAI("create text saying Hello at 1000, 1000");
testAI("move the text saying Hello to the center");
// Expected: Text moves to center
// Expected output: "✓ Moved shape to new position"
```

### Additional Text Tests

```javascript
// ========================================
// TEXT CREATION TESTS
// ========================================

// Test: Basic text creation
testAI("create text saying Welcome at 2000, 2000");
// Expected: Text appears at specified position
// Expected output: "✓ Created text layer"

// Test: Text with formatting
testAI("create bold text saying TITLE at the center");
// Expected: Bold text appears centered
// Expected output: "✓ Created text layer"

// Test: Text with custom color
testAI("create red text saying Error at 1000, 1000");
// Expected: Red text appears
// Expected output: "✓ Created text layer"

// ========================================
// TEXT MANIPULATION TESTS
// ========================================

// Test: Move text by content
testAI("create text saying Hello at 1000, 1000");
testAI("move the text saying Hello to the top");
// Expected: Text moves to top
// Expected output: "✓ Moved shape to new position"

// Test: Delete text by content
testAI("create text saying Delete Me at 1500, 1500");
testAI("delete the text saying Delete Me");
// Expected: Text disappears
// Expected output: "✓ Deleted shape"

// Test: Duplicate text
testAI("create text saying Copy Me at 2000, 2000");
testAI("duplicate the text saying Copy Me");
// Expected: Copy appears with offset
// Expected output: "✓ Duplicated shape"

// ========================================
// TEXT CONTEXT AWARENESS TESTS
// ========================================

// Test: Multiple text elements
testAI("create text saying First at 1000, 1000");
testAI("create text saying Second at 2000, 2000");
testAI("move the text saying First to the left");
// Expected: Only "First" text moves
// Expected output: "✓ Moved shape to new position"

// Test: Text with shapes
testAI("create a blue rectangle at 1000, 1000");
testAI("create text saying Label at 1000, 1000");
testAI("move the text saying Label to the center");
// Expected: Only text moves (not rectangle)
// Expected output: "✓ Moved shape to new position"

// ========================================
// TEXT ERROR HANDLING TESTS
// ========================================

// Test: Text not found
testAI("move the text saying NonExistent to the left");
// Expected: AI responds that it can't find text
// Should not crash

// Test: Ambiguous text reference
testAI("create text saying Hello at 1000, 1000");
testAI("create text saying Hello at 2000, 2000");
testAI("move the text saying Hello to the center");
// Expected: AI picks most recent "Hello" text
// Expected output: "✓ Moved shape to new position"
```

---

## Text Success Criteria

### Must Pass:
- ✅ createText tool added to `executeSingleTool()` switch
- ✅ createText tool definition added to `getToolDefinitions()`
- ✅ System prompt includes text creation examples
- ✅ System prompt includes text identification rules
- ✅ System prompt includes text manipulation examples
- ✅ `generateSuccessMessage()` handles createText tool
- ✅ Can create text with basic content
- ✅ Can create text with formatting (bold, italic, underline)
- ✅ Can create text with custom colors
- ✅ Can identify text by content ("text saying Hello")
- ✅ Can move text by content reference
- ✅ Can delete text by content reference
- ✅ Can duplicate text
- ✅ AI calls `getCanvasState()` before text manipulation
- ✅ Text context awareness works with shapes
- ✅ All text test commands pass

### Quality Checks:
- ✅ Text positioning accurate
- ✅ Text formatting works correctly
- ✅ Text identification by content works
- ✅ Text manipulation doesn't affect other shapes
- ✅ Error handling graceful (text not found doesn't crash)
- ✅ Text commands complete in <2 seconds

---

## Implementation Notes

### When to Implement:
- After basic shape manipulation tools are complete and tested
- When text shape rendering is implemented in the canvas
- When text editing capabilities are ready

### Dependencies:
- Text shape creation in canvasService
- Text rendering in Canvas component
- Text editing UI (if needed)

### Integration Points:
- Add createText case to executeSingleTool()
- Add createText definition to getToolDefinitions()
- Update system prompt with text examples
- Add createText success message
- Update shape identification logic for text content

---

## Text-Specific Features

### Text Formatting Options:
- **fontSize**: Number (default 16)
- **color**: Hex color code (default #000000)
- **fontWeight**: "normal" | "bold"
- **fontStyle**: "normal" | "italic"
- **textDecoration**: "none" | "underline"

### Text Identification:
- By content: "text saying Hello"
- By position: "text at the center"
- By formatting: "bold text"
- By color: "red text"

### Text Manipulation:
- Move text to new positions
- Delete text by content reference
- Duplicate text with offset
- Resize text (fontSize changes)
- Rotate text (if supported)

---

## Future Enhancements

### Advanced Text Features:
- Multi-line text support
- Text alignment (left, center, right)
- Text wrapping
- Rich text formatting
- Text effects (shadow, outline)
- Font family selection
- Text editing in-place

### Text Layout Tools:
- Text alignment tools
- Text spacing controls
- Text flow around shapes
- Text on paths
- Text in shapes

---

## Testing Checklist

### Text Creation:
- [ ] Basic text creation works
- [ ] Text with custom fontSize works
- [ ] Text with custom color works
- [ ] Text with bold formatting works
- [ ] Text with italic formatting works
- [ ] Text with underline works
- [ ] Text positioning is accurate

### Text Manipulation:
- [ ] Move text by content reference works
- [ ] Delete text by content reference works
- [ ] Duplicate text works
- [ ] Text identification is accurate
- [ ] Text manipulation doesn't affect other shapes

### Text Context Awareness:
- [ ] Multiple text elements handled correctly
- [ ] Text with shapes handled correctly
- [ ] Ambiguous text references resolved
- [ ] Most recent text logic works

### Error Handling:
- [ ] Text not found handled gracefully
- [ ] Invalid text parameters handled
- [ ] Text manipulation errors don't crash system
