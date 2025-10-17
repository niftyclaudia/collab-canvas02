import OpenAI from 'openai';
import { CanvasService } from './canvasService';
import { getSystemPrompt } from '../utils/aiPrompts';
import { logger, LogCategory } from '../utils/logger';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

interface AIServiceOptions {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export class AIService {
  private openai: OpenAI;
  private canvasService: CanvasService;
  private onError?: (message: string) => void;
  private onSuccess?: (message: string) => void;
  
  constructor(options?: AIServiceOptions) {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.canvasService = new CanvasService();
    this.onError = options?.onError;
    this.onSuccess = options?.onSuccess;
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
        tool_choice: "required", // Force the AI to use tools
        temperature: 0.1,
        max_tokens: 500
      });
      
      const message = response.choices[0].message;
      
      // 3. Execute tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const results = await this.executeToolCalls(message.tool_calls, userId);
        
        // Check if only getCanvasState was called (indicates shape not found)
        const onlyGetCanvasState = results.length === 1 && results[0].tool === 'getCanvasState';
        if (onlyGetCanvasState) {
          const notFoundMessage = message.content || "I couldn't find the requested shape on the canvas.";
          
          // Show toast notification for shape not found
          if (this.onError) {
            this.onError(`⚠️ ${notFoundMessage}`);
          }
          
          return {
            success: false,
            message: notFoundMessage,
            toolCalls: results
          };
        }
        
        const successMessage = this.generateSuccessMessage(results);
        
        // Show success toast for object modifications
        if (this.onSuccess && this.hasObjectModifications(results)) {
          this.onSuccess(successMessage);
        }
        
        return {
          success: true,
          message: successMessage,
          toolCalls: results
        };
      } else {
        const notUnderstoodMessage = message.content || "I couldn't understand that command.";
        
        // Show toast notification for commands that couldn't be understood
        if (this.onError) {
          this.onError(`⚠️ ${notUnderstoodMessage}`);
        }
        
        return {
          success: false,
          message: notUnderstoodMessage,
          toolCalls: []
        };
      }
    } catch (error: any) {
      console.error('AI execution error:', error);
      
      // Show toast notification for general AI service errors
      if (this.onError) {
        let errorMessage = "⚠️ AI service error. Please try again.";
        
        if (error.message && error.message.includes('API key')) {
          errorMessage = "⚠️ AI service not configured. Please check API key.";
        } else if (error.message && error.message.includes('network')) {
          errorMessage = "⚠️ Network error. Please check your connection.";
        } else if (error.message && error.message.includes('quota')) {
          errorMessage = "⚠️ AI service quota exceeded. Please try again later.";
        }
        
        this.onError(errorMessage);
      }
      
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
        // Show toast notification for any object creation/modification error
        if (this.onError && this.isObjectModificationTool(call.function.name)) {
          let errorMessage = error.message || 'Unknown error occurred';
          
          // Format error message for better user experience
          if (error.message && error.message.includes('outside canvas bounds')) {
            errorMessage = `⚠️ Cannot create shape: ${error.message}`;
          } else if (error.message && error.message.includes('Firebase')) {
            errorMessage = `⚠️ Database error: Unable to save shape`;
          } else if (error.message && error.message.includes('network')) {
            errorMessage = `⚠️ Network error: Unable to create shape`;
          } else {
            errorMessage = `⚠️ Cannot ${this.getActionName(call.function.name)}: ${error.message}`;
          }
          
          this.onError(errorMessage);
        }
        
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
    logger.debug(LogCategory.AI, `Parsing tool call: ${name} with args: ${argsStr}`);
    const args = JSON.parse(argsStr);
    logger.debug(LogCategory.AI, `Parsed args: ${JSON.stringify(args)}`);
    
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
          createdBy: userId
        });
        
      case 'createCircle':
        console.log(`🤖 AI calling createCircle with args:`, args);
        return await this.canvasService.createCircle(
          args.x,
          args.y,
          args.radius * 2, // width (diameter)
          args.radius * 2, // height (diameter)
          args.color,
          userId
        );
        
      case 'createTriangle':
        return await this.canvasService.createTriangle(
          args.x,
          args.y,
          args.width,
          args.height,
          args.color,
          userId
        );
        
      case 'createText':
        return await this.canvasService.createText(
          args.text,
          args.x,
          args.y,
          args.fontSize || 16,
          args.color || '#000000',
          args.fontWeight || 'normal',
          args.fontStyle || 'normal',
          args.textDecoration || 'none',
          userId
        );
        
      // NEW MANIPULATION TOOLS
      case 'moveShape':
        // Get the current shape to determine its type and dimensions
        const shapes = await this.canvasService.getShapes();
        const targetShape = shapes.find(s => s.id === args.shapeId);
        
        if (!targetShape) {
          throw new Error(`Shape with ID ${args.shapeId} not found`);
        }
        
        let finalX = args.x;
        let finalY = args.y;
        
        // For rectangles and triangles, convert center coordinates to top-left coordinates
        if (targetShape.type === 'rectangle' || targetShape.type === 'triangle') {
          finalX = args.x - targetShape.width / 2;
          finalY = args.y - targetShape.height / 2;
          console.log(`🔧 [AI] Converting center (${args.x}, ${args.y}) to top-left (${finalX}, ${finalY}) for ${targetShape.type} ${targetShape.width}×${targetShape.height}`);
        } else {
          console.log(`🔧 [AI] Using center coordinates (${args.x}, ${args.y}) directly for ${targetShape.type}`);
        }
        
        return await this.canvasService.updateShape(args.shapeId, {
          x: finalX,
          y: finalY
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
        
      case 'getCanvasState':
        return await this.canvasService.getShapes();
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  private isObjectModificationTool(toolName: string): boolean {
    // Check if the tool modifies objects (not just getCanvasState)
    return ['createRectangle', 'createCircle', 'createTriangle', 'createText', 
            'moveShape', 'resizeShape', 'rotateShape', 'duplicateShape', 'deleteShape'].includes(toolName);
  }
  
  private getActionName(toolName: string): string {
    const actionMap: { [key: string]: string } = {
      'createRectangle': 'create rectangle',
      'createCircle': 'create circle', 
      'createTriangle': 'create triangle',
      'createText': 'create text',
      'moveShape': 'move shape',
      'resizeShape': 'resize shape',
      'rotateShape': 'rotate shape',
      'duplicateShape': 'duplicate shape',
      'deleteShape': 'delete shape'
    };
    return actionMap[toolName] || 'perform action';
  }
  
  private hasObjectModifications(results: any[]): boolean {
    // Check if any tool calls actually modified objects (not just getCanvasState)
    return results.some(result => 
      result.success && 
      result.tool !== 'getCanvasState' &&
      this.isObjectModificationTool(result.tool)
    );
  }
  
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
        case 'createText': return '✓ Created text layer';
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
  
  private getToolDefinitions() {
    return [
      {
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
        function: {
          name: "createTriangle",
          description: "Creates a triangle on the canvas at specified position with given dimensions and color.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "Top-left X position of bounding box in pixels (0-5000)" },
              y: { type: "number", description: "Top-left Y position of bounding box in pixels (0-5000)" },
              width: { type: "number", description: "Base width in pixels (minimum 10)" },
              height: { type: "number", description: "Height in pixels (minimum 10)" },
              color: { type: "string", description: "Hex color code like #10b981" }
            },
            required: ["x", "y", "width", "height", "color"]
          }
        }
      },
      {
        type: "function" as const,
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
      },
      
      // NEW MANIPULATION TOOLS
      {
        type: "function" as const,
        function: {
          name: "moveShape",
          description: "Moves an existing shape to a new position. For center positioning, use (2500, 2500). The system handles coordinate conversion automatically.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to move" },
              x: { type: "number", description: "New X position (center coordinates for all shapes)" },
              y: { type: "number", description: "New Y position (center coordinates for all shapes)" }
            },
            required: ["shapeId", "x", "y"]
          }
        }
      },
      {
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
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
      
      // CANVAS STATE TOOL
      {
        type: "function" as const,
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
}
