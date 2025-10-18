# PR #1: AI Service Foundation + Creation Tools

## Overview

**Goal:** Build the AI infrastructure that can execute natural language commands to create shapes on the canvas.

**Timeline:** 45 minutes  
**Complexity:** Medium (new service, OpenAI integration)

---

## What Gets Built

### Core Components

1. **AIService Class** - Handles OpenAI communication and command execution
2. **4 Creation Tools** - Rectangle, Circle, Triangle, Text
3. **System Prompt** - Instructions for AI behavior (creation-focused)
4. **Error Handling** - Graceful failures and user feedback

### Testing Method

Console-based testing (no UI yet):
```typescript
const ai = new AIService();
await ai.executeCommand("create a blue rectangle at 100, 200", userId);
// Expected: Rectangle appears on canvas
```

---

## Files to Create/Modify

```
src/services/aiService.ts          (NEW - 200 lines)
src/utils/aiPrompts.ts             (NEW - 100 lines)
.env.example                       (UPDATE - add VITE_OPENAI_API_KEY)
package.json                       (UPDATE - add openai dependency)
```

---

## Implementation Details

### 1. Install Dependencies

```bash
npm install openai
```

Update `package.json`:
```json
{
  "dependencies": {
    "openai": "^4.20.0"
  }
}
```

### 2. Environment Setup

Add to `.env.example` and `.env`:
```bash
VITE_OPENAI_API_KEY=sk-...your-key-here
```

---

### 3. Create `src/services/aiService.ts`

```typescript
import OpenAI from 'openai';
import { CanvasService } from './canvasService';
import { getSystemPrompt } from '../utils/aiPrompts';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

export class AIService {
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
      // 1. Get current canvas state for context
      const shapes = await this.canvasService.getShapes();
      
      // 2. Call OpenAI with function tools
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: getSystemPrompt(shapes) },
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
      } catch (error: any) {
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
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
    
    if (toolNames.includes('createCircle') && toolNames.length === 1) {
      return '✓ Created 1 circle';
    }
    
    if (toolNames.includes('createTriangle') && toolNames.length === 1) {
      return '✓ Created 1 triangle';
    }
    
    if (toolNames.includes('createText') && toolNames.length === 1) {
      return '✓ Created text layer';
    }
    
    // Multi-step operations
    const shapeCount = toolNames.filter(t => 
      ['createRectangle', 'createCircle', 'createTriangle'].includes(t)
    ).length;
    const textCount = toolNames.filter(t => t === 'createText').length;
    
    if (shapeCount > 1 || textCount > 1) {
      return `✓ Created ${shapeCount + textCount} elements`;
    }
    
    return `✓ Completed ${successCount} actions`;
  }
  
  private getToolDefinitions() {
    return [
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
    ];
  }
}
```

---

### 4. Create `src/utils/aiPrompts.ts`

```typescript
export function getSystemPrompt(shapes: any[]): string {
  const shapesSummary = shapes.length > 0 
    ? `\n\nCURRENT CANVAS STATE:\n${shapes.slice(0, 20).map(s => 
        `- ${s.type} (id: ${s.id}): ${s.color || 'text'} at (${s.x}, ${s.y})${
          s.width ? `, size ${s.width}×${s.height}` : ''
        }${s.radius ? `, radius ${s.radius}` : ''}`
      ).join('\n')}${shapes.length > 20 ? `\n... and ${shapes.length - 20} more shapes` : ''}`
    : '\n\nCURRENT CANVAS STATE: Empty canvas';
  
  return `You are a canvas creation assistant for a 5000×5000 pixel collaborative design tool. Users give you natural language commands to create shapes.

CRITICAL RULES:
1. Canvas coordinates: (0,0) is top-left, (5000,5000) is bottom-right
2. Canvas center is at (2500, 2500)
3. Default rectangle size is 200×150 if user doesn't specify
4. Default circle radius is 75 if user doesn't specify
5. Default triangle size is 150×130 if user doesn't specify
6. Default text fontSize is 16, color is black (#000000)
7. For vague positions like "center", "top", calculate actual coordinates
8. Always center shapes properly by accounting for their dimensions

POSITION HELPERS:
- "center" → For rectangles: x = 2500 - width/2, y = 2500 - height/2
- "center" → For circles: x = 2500, y = 2500 (circles use center point)
- "center" → For text: x = 2500 - (approximate text width/2), y = 2500
- "top-left" → (100, 100)
- "top" → x = 2500 (centered horizontally), y = 100
- "top-right" → (4800, 100)
- "left" → x = 100, y = 2500 (centered vertically)
- "right" → x = 4800, y = 2500 (centered vertically)
- "bottom-left" → (100, 4800)
- "bottom" → x = 2500 (centered horizontally), y = 4800
- "bottom-right" → (4800, 4800)

COLOR CODES (always use these exact hex values):
- red → #ef4444
- blue → #3b82f6
- green → #10b981
- yellow → #f59e0b
- black → #000000
- white → #ffffff

EXAMPLES:

User: "Create a blue rectangle in the center"
→ createRectangle(x: 2400, y: 2425, width: 200, height: 150, color: "#3b82f6")
  // 2400 = 2500 - 100 (half of default 200 width)
  // 2425 = 2500 - 75 (half of default 150 height)

User: "Add a red circle at the top"
→ createCircle(x: 2500, y: 100, radius: 75, color: "#ef4444")

User: "Make a green triangle in the bottom-left"
→ createTriangle(x: 100, y: 4670, width: 150, height: 130, color: "#10b981")
  // y = 4800 - 130 (triangle height)

User: "Add text that says Hello World at the top"
→ createText(text: "Hello World", x: 2450, y: 150, fontSize: 16, color: "#000000")

User: "Create a yellow square with 100px sides at 500, 600"
→ createRectangle(x: 500, y: 600, width: 100, height: 100, color: "#f59e0b")

User: "Make bold text saying TITLE at the center"
→ createText(text: "TITLE", x: 2475, y: 2500, fontSize: 16, color: "#000000", fontWeight: "bold")

Be helpful, accurate, and execute commands precisely. Always validate parameters are within bounds before executing.${shapesSummary}`;
}
```

---

## Testing Commands

After implementing, test in the browser console:

```typescript
// 1. Initialize the service
const ai = new AIService();
const userId = "test_user_123"; // Replace with actual user ID from auth

// 2. Test simple rectangle creation
await ai.executeCommand("create a blue rectangle at 500, 500", userId);
// Expected: Blue rectangle appears at (500, 500)
// Expected console output: "✓ Created 1 rectangle"

// 3. Test centered rectangle
await ai.executeCommand("create a red rectangle in the center", userId);
// Expected: Red rectangle appears centered on canvas
// Expected console output: "✓ Created 1 rectangle"

// 4. Test circle creation
await ai.executeCommand("add a green circle at the top", userId);
// Expected: Green circle appears at top center
// Expected console output: "✓ Created 1 circle"

// 5. Test triangle creation
await ai.executeCommand("make a yellow triangle in the bottom-left", userId);
// Expected: Yellow triangle appears in bottom-left area
// Expected console output: "✓ Created 1 triangle"

// 6. Test text creation
await ai.executeCommand("add text that says Hello World", userId);
// Expected: "Hello World" text appears on canvas
// Expected console output: "✓ Created text layer"

// 7. Test text with formatting
await ai.executeCommand("create bold italic text saying TITLE at the center", userId);
// Expected: Bold, italic "TITLE" text appears centered
// Expected console output: "✓ Created text layer"

// 8. Test error handling
await ai.executeCommand("create a rectangle at 10000, 10000", userId);
// Expected: Graceful error message (position out of bounds handled by AI or service)

// 9. Test multi-shape command
await ai.executeCommand("create 3 blue rectangles at 100, 200", userId);
// Expected: 3 blue rectangles appear (AI should call createRectangle 3 times)
// Expected console output: "✓ Created 3 elements"
```

---

## Success Criteria

### Must Pass:
- ✅ `npm install openai` completes without errors
- ✅ Environment variable `VITE_OPENAI_API_KEY` is set
- ✅ Can import `AIService` class
- ✅ Can call `ai.executeCommand()` without errors
- ✅ AI creates rectangles on command
- ✅ AI creates circles on command
- ✅ AI creates triangles on command
- ✅ AI creates text on command
- ✅ Created shapes appear on canvas in real-time
- ✅ Success messages are returned ("✓ Created 1 rectangle")
- ✅ Error messages are returned when something fails
- ✅ All 9 testing commands above work

### Quality Checks:
- ✅ Position calculations are accurate (centered shapes are truly centered)
- ✅ Color codes match exactly (#3b82f6 for blue, etc.)
- ✅ Text formatting works (bold, italic, underline)
- ✅ AI understands vague commands ("at the center", "at the top")
- ✅ No console errors during execution
- ✅ API calls complete in <2 seconds for single commands

---

## Common Issues & Debugging

### Issue 1: "OpenAI API key not found"
**Solution:** Check `.env` file has `VITE_OPENAI_API_KEY=sk-...`

### Issue 2: AI creates shape but it doesn't appear
**Solution:** Check `canvasService.createShape()` is working manually first

### Issue 3: AI doesn't understand position commands
**Solution:** Review system prompt examples, ensure position helpers are clear

### Issue 4: "Tool call failed" errors
**Solution:** Check `executeSingleTool()` switch statement has correct cases

### Issue 5: Shapes created at wrong positions
**Solution:** Verify position calculations in system prompt (centering logic)

---

## What's Next (PR #2)

After this PR is complete and tested:
- **PR #2** will add 11 more tools (move, resize, rotate, group, align, etc.)
- **PR #2** will expand the system prompt for manipulation commands
- **PR #2** will add layout commands ("arrange in a row")

**Do not implement PR #2 features yet.** This PR should only focus on creation tools.

---

## Time Estimate

- OpenAI setup: 5 min
- AIService implementation: 20 min
- System prompt: 10 min
- Testing: 10 min

**Total: ~45 minutes**