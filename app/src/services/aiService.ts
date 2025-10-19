import OpenAI from 'openai';
import { CanvasService } from './canvasService';
import { getSystemPrompt } from '../utils/aiPrompts';
import { logger, LogCategory } from '../utils/logger';
import { calculateRowLayout, calculateAlignment, calculateEvenSpacing } from '../utils/layoutCalculator';
import type { ChatMessage } from '../types/chat';

interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

interface ComplexCommandResult {
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  createdShapes: string[];
  errors: string[];
  message: string;
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
      // Check for random shapes requests and handle them specially
      const isRandomShapesRequest = prompt.toLowerCase().includes('random shapes');
      const shapeCountMatch = prompt.match(/(\d+)\s+random\s+shapes/);
      
      console.log(`🔍 Checking for random shapes: isRandomShapesRequest=${isRandomShapesRequest}, shapeCountMatch=${shapeCountMatch}`);
      
      if (isRandomShapesRequest && shapeCountMatch) {
        const totalCount = parseInt(shapeCountMatch[1]);
        const countPerType = Math.floor(totalCount / 3);
        
        console.log(`🎲 Detected random shapes request: ${totalCount} shapes (${countPerType} per type)`);
        
        // Create the 3 different shape types directly
        const results = await this.createRandomShapesDirectly(countPerType, userId);
        
        const successMessage = `✓ Created ${totalCount} random shapes (${countPerType} rectangles, ${countPerType} circles, ${countPerType} triangles)`;
        
        if (this.onSuccess) {
          this.onSuccess(successMessage);
        }
        
        return {
          success: true,
          message: successMessage,
          toolCalls: results
        };
      }
      
      // 1. Get current canvas state for context
      const shapes = await this.canvasService.getShapes();
      const groups = await this.canvasService.getGroups();
      
      // 2. Call OpenAI with function tools
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: getSystemPrompt(shapes, groups) },
          { role: "user", content: prompt }
        ],
        tools: this.getToolDefinitions(),
        tool_choice: "required", // Force the AI to use tools
        temperature: 0.1,
        max_tokens: 2000
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
        
        // Check for random shapes validation
        const multipleShapesCalls = results.filter(r => r.tool === 'createMultipleShapes' && r.success);
        
        if (isRandomShapesRequest && multipleShapesCalls.length === 1) {
          console.warn('⚠️ AI only created one type of shapes for random shapes request');
          // Don't fail the request, but log the issue
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

  /**
   * Send a message through the AI chat interface
   * @param content The message content from the user
   * @param userId The user ID
   * @returns Promise<ChatMessage> The AI response message
   */
  async sendMessage(content: string, userId: string): Promise<ChatMessage> {
    try {
      // Create user message
      // const userMessage: ChatMessage = {
      //   id: this.generateMessageId(),
      //   type: 'user',
      //   content,
      //   timestamp: new Date(),
      //   status: 'processing'
      // };

      // Execute the AI command
      const result = await this.executeCommand(content, userId);

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: this.generateMessageId(),
        type: 'ai',
        content: result.message,
        timestamp: new Date(),
        status: result.success ? 'success' : 'error'
      };

      return aiMessage;
    } catch (error: any) {
      console.error('Chat message error:', error);
      
      // Return error message
      return {
        id: this.generateMessageId(),
        type: 'ai',
        content: "⚠️ AI service error. Please try again.",
        timestamp: new Date(),
        status: 'error'
      };
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute complex multi-step AI commands with progress feedback
   * @param command The complex command to execute
   * @param userId The user ID
   * @param context Optional canvas state context
   * @returns Promise<ComplexCommandResult>
   */
  async executeComplexCommand(
    command: string, 
    userId: string
  ): Promise<ComplexCommandResult> {
    try {
      const lowerCommand = command.toLowerCase();
      console.log(`🔍 [Complex Command] Processing: "${command}"`);
      console.log(`🔍 [Complex Command] Lower: "${lowerCommand}"`);
      
      // Check for specific complex commands
      if (lowerCommand.includes('create login form') || lowerCommand.includes('login form')) {
        return await this.createLoginForm(userId);
      }
      
      // Check for specific grid patterns
      if (lowerCommand.includes('3x3 grid') || lowerCommand.includes('create 3x3 grid') || 
          lowerCommand.includes('make 3x3 grid')) {
        const useRandomColors = lowerCommand.includes('random') && lowerCommand.includes('color');
        return await this.createGrid(userId, 3, 3, 50, undefined, useRandomColors);
      }
      
      if (lowerCommand.includes('4x4 grid') || lowerCommand.includes('create 4x4 grid') || 
          lowerCommand.includes('make 4x4 grid')) {
        const useRandomColors = lowerCommand.includes('random') && lowerCommand.includes('color');
        console.log(`🔍 [Complex Command] 4x4 grid detected, useRandomColors: ${useRandomColors}`);
        return await this.createGrid(userId, 4, 4, 50, undefined, useRandomColors);
      }
      
      // Generic grid pattern matching
      if ((lowerCommand.includes('make') || lowerCommand.includes('create')) && lowerCommand.includes('grid')) {
        // Parse grid dimensions from command
        const gridMatch = command.match(/(\d+)x(\d+)\s+grid/);
        if (gridMatch) {
          const rows = parseInt(gridMatch[1]);
          const cols = parseInt(gridMatch[2]);
          const useRandomColors = lowerCommand.includes('random') && lowerCommand.includes('color');
          return await this.createGrid(userId, rows, cols, 50, undefined, useRandomColors);
        }
      }
      
      // Fallback to regular command execution
      const result = await this.executeCommand(command, userId);
      return {
        success: result.success,
        stepsCompleted: result.success ? 1 : 0,
        totalSteps: 1,
        createdShapes: result.toolCalls.filter(tc => tc.success).map(tc => tc.result?.id).filter(Boolean),
        errors: result.success ? [] : [result.message],
        message: result.message
      };
    } catch (error: any) {
      console.error('Complex command execution error:', error);
      return {
        success: false,
        stepsCompleted: 0,
        totalSteps: 1,
        createdShapes: [],
        errors: [error.message || 'Unknown error'],
        message: `❌ Failed to execute complex command: ${error.message}`
      };
    }
  }

  /**
   * Create a login form with 6 properly positioned elements
   * @param userId The user ID
   * @param position Optional position for the form
   * @returns Promise<ComplexCommandResult>
   */
  async createLoginForm(userId: string, position?: {x: number, y: number}): Promise<ComplexCommandResult> {
    const startX = position?.x || 2000;
    const startY = position?.y || 2000;
    const createdShapes: string[] = [];
    const errors: string[] = [];
    let stepsCompleted = 0;
    const totalSteps = 11; // 1 background + 1 title + 2 labels + 2 inputs + 2 placeholders + 1 button + 1 button text + 1 grouping

    try {
      // Step 1: Create form background (clean, minimal design)
      try {
        const background = await this.canvasService.createShape({
          type: 'rectangle',
          x: startX,
          y: startY - 25,
          width: 260,
          height: 290,
          color: '#f8f9fa',
          createdBy: userId
        });
        createdShapes.push(background.id);
        stepsCompleted++;
        console.log('✅ Step 1: Created clean form background');
      } catch (error: any) {
        errors.push(`Failed to create form background: ${error.message}`);
        console.error('❌ Step 1 failed:', error);
      }

      // Step 2: Create title (properly centered)
      try {
        const title = await this.canvasService.createText(
          'Login Form',
          startX + 50, // True center: startX + (260/2) - (textWidth/2) = startX + 130 - 80 = startX + 50
          startY,
          24,
          '#000000',
          'bold',
          'normal',
          'none',
          userId
        );
        createdShapes.push(title.id);
        stepsCompleted++;
        console.log('✅ Step 2: Created properly centered title');
      } catch (error: any) {
        errors.push(`Failed to create title: ${error.message}`);
        console.error('❌ Step 2 failed:', error);
      }

      // Step 3: Create username label
      try {
        const usernameLabel = await this.canvasService.createText(
          'Username:',
          startX + 25,
          startY + 50,
          16,
          '#000000',
          'normal',
          'normal',
          'none',
          userId
        );
        createdShapes.push(usernameLabel.id);
        stepsCompleted++;
        console.log('✅ Step 3: Created username label');
      } catch (error: any) {
        errors.push(`Failed to create username label: ${error.message}`);
        console.error('❌ Step 3 failed:', error);
      }

      // Step 4: Create username input
      try {
        const usernameInput = await this.canvasService.createShape({
          type: 'rectangle',
          x: startX + 25,
          y: startY + 70,
          width: 200,
          height: 30,
          color: '#ffffff',
          createdBy: userId
        });
        createdShapes.push(usernameInput.id);
        stepsCompleted++;
        console.log('✅ Step 4: Created username input');
      } catch (error: any) {
        errors.push(`Failed to create username input: ${error.message}`);
        console.error('❌ Step 4 failed:', error);
      }

      // Step 5: Add username placeholder text (left-aligned with input)
      try {
        const usernamePlaceholder = await this.canvasService.createText(
          'Enter username',
          startX + 30, // Left-aligned with input field (input starts at startX + 25, so +5 for padding)
          startY + 80, // Center vertically: startY + 70 (input top) + 15 (half of 30px height) - 5 (text height offset for true center)
          12,
          '#999999',
          'normal',
          'normal',
          'none',
          userId
        );
        createdShapes.push(usernamePlaceholder.id);
        stepsCompleted++;
        console.log('✅ Step 5: Added username placeholder text (left-aligned)');
      } catch (error: any) {
        errors.push(`Failed to create username placeholder: ${error.message}`);
        console.error('❌ Step 5 failed:', error);
      }

      // Step 6: Create password label
      try {
        const passwordLabel = await this.canvasService.createText(
          'Password:',
          startX + 25,
          startY + 120,
          16,
          '#000000',
          'normal',
          'normal',
          'none',
          userId
        );
        createdShapes.push(passwordLabel.id);
        stepsCompleted++;
        console.log('✅ Step 6: Created password label');
      } catch (error: any) {
        errors.push(`Failed to create password label: ${error.message}`);
        console.error('❌ Step 6 failed:', error);
      }

      // Step 7: Create password input
      try {
        const passwordInput = await this.canvasService.createShape({
          type: 'rectangle',
          x: startX + 25,
          y: startY + 140,
          width: 200,
          height: 30,
          color: '#ffffff',
          createdBy: userId
        });
        createdShapes.push(passwordInput.id);
        stepsCompleted++;
        console.log('✅ Step 7: Created password input');
      } catch (error: any) {
        errors.push(`Failed to create password input: ${error.message}`);
        console.error('❌ Step 7 failed:', error);
      }

      // Step 8: Add password placeholder text (left-aligned with input)
      try {
        const passwordPlaceholder = await this.canvasService.createText(
          'Enter password',
          startX + 30, // Left-aligned with input field (input starts at startX + 25, so +5 for padding)
          startY + 150, // Center vertically: startY + 140 (input top) + 15 (half of 30px height) - 5 (text height offset for true center)
          12,
          '#999999',
          'normal',
          'normal',
          'none',
          userId
        );
        createdShapes.push(passwordPlaceholder.id);
        stepsCompleted++;
        console.log('✅ Step 8: Added password placeholder text (left-aligned)');
      } catch (error: any) {
        errors.push(`Failed to create password placeholder: ${error.message}`);
        console.error('❌ Step 8 failed:', error);
      }

      // Step 9: Create login button (properly centered)
      try {
        const loginButton = await this.canvasService.createShape({
          type: 'rectangle',
          x: startX + 80, // True center: startX + (260-100)/2 = startX + 80
          y: startY + 200,
          width: 100,
          height: 40,
          color: '#2563eb', // Darker blue for better contrast
          createdBy: userId
        });
        createdShapes.push(loginButton.id);
        stepsCompleted++;
        console.log('✅ Step 9: Created properly centered login button');
      } catch (error: any) {
        errors.push(`Failed to create login button: ${error.message}`);
        console.error('❌ Step 9 failed:', error);
      }

      // Step 10: Add "Submit" text to button (center-aligned)
      try {
        const buttonText = await this.canvasService.createText(
          'Submit',
          startX + 102, // True center: button center (startX + 130) - (textWidth/2) = startX + 130 - 28 = startX + 102
          startY + 213, // Center vertically: startY + 200 (button top) + 20 (half of 40px height) - 7 (text height offset)
          14,
          '#ffffff',
          'bold',
          'normal',
          'none',
          userId
        );
        createdShapes.push(buttonText.id);
        stepsCompleted++;
        console.log('✅ Step 10: Added center-aligned button text');
      } catch (error: any) {
        errors.push(`Failed to create button text: ${error.message}`);
        console.error('❌ Step 10 failed:', error);
      }

      // Step 11: Group all form elements together
      try {
        if (createdShapes.length > 0) {
          await this.canvasService.groupShapes(createdShapes, userId);
          stepsCompleted++;
          console.log('✅ Step 11: Grouped all form elements together');
        }
      } catch (error: any) {
        errors.push(`Failed to group form elements: ${error.message}`);
        console.error('❌ Step 11 failed:', error);
      }

      const success = stepsCompleted === totalSteps;
      const message = success 
        ? `✅ Login form created with ${stepsCompleted} elements`
        : `⚠️ Login form partially created: ${stepsCompleted}/${totalSteps} elements (${errors.length} errors)`;

      return {
        success,
        stepsCompleted,
        totalSteps,
        createdShapes,
        errors,
        message
      };

    } catch (error: any) {
      console.error('❌ Login form creation failed:', error);
      return {
        success: false,
        stepsCompleted,
        totalSteps,
        createdShapes,
        errors: [...errors, `Login form creation failed: ${error.message}`],
        message: `❌ Failed to create login form: ${error.message}`
      };
    }
  }

  /**
   * Create a grid of shapes
   * @param userId The user ID
   * @param rows Number of rows
   * @param cols Number of columns
   * @param spacing Spacing between shapes
   * @param position Optional position for the grid
   * @returns Promise<ComplexCommandResult>
   */
  async createGrid(
    userId: string, 
    rows: number, 
    cols: number, 
    spacing: number,
    position?: {x: number, y: number},
    useRandomColors: boolean = false
  ): Promise<ComplexCommandResult> {
    const startX = position?.x || 2000;
    const startY = position?.y || 2000;
    const createdShapes: string[] = [];
    const errors: string[] = [];
    let stepsCompleted = 0;
    const totalSteps = rows * cols;

    try {
      const shapeSize = 60;
      const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];
      const defaultColor = '#3b82f6'; // Single color for grids without random colors
      
      console.log(`🔍 [createGrid] Creating ${rows}x${cols} grid, useRandomColors: ${useRandomColors}`);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          try {
            const x = startX + (col * (shapeSize + spacing));
            const y = startY + (row * (shapeSize + spacing));
            const color = useRandomColors ? colors[(row * cols + col) % colors.length] : defaultColor;
            console.log(`🔍 [createGrid] Shape at (${x}, ${y}) using color: ${color}`);

            const shape = await this.canvasService.createShape({
              type: 'rectangle',
              x,
              y,
              width: shapeSize,
              height: shapeSize,
              color,
              createdBy: userId
            });
            
            createdShapes.push(shape.id);
            stepsCompleted++;
            console.log(`✅ Step ${stepsCompleted}: Created shape at (${x}, ${y})`);
          } catch (error: any) {
            errors.push(`Failed to create shape at row ${row}, col ${col}: ${error.message}`);
            console.error(`❌ Step ${stepsCompleted + 1} failed:`, error);
          }
        }
      }

      const success = stepsCompleted === totalSteps;
      const message = success 
        ? `✅ ${rows}x${cols} grid created with ${stepsCompleted} shapes`
        : `⚠️ Grid partially created: ${stepsCompleted}/${totalSteps} shapes (${errors.length} errors)`;

      return {
        success,
        stepsCompleted,
        totalSteps,
        createdShapes,
        errors,
        message
      };

    } catch (error: any) {
      console.error('❌ Grid creation failed:', error);
      return {
        success: false,
        stepsCompleted,
        totalSteps,
        createdShapes,
        errors: [...errors, `Grid creation failed: ${error.message}`],
        message: `❌ Failed to create grid: ${error.message}`
      };
    }
  }
  
  private async executeToolCalls(toolCalls: any[], userId: string): Promise<any[]> {
    // Check if we have multiple shape creation calls that can be batched
    const createShapeCalls = toolCalls.filter(call => 
      ['createRectangle', 'createCircle', 'createTriangle'].includes(call.function.name)
    );
    
    if (createShapeCalls.length > 1) {
      // Use batch creation for multiple shapes
      return await this.executeBatchShapeCreation(createShapeCalls, toolCalls, userId);
    }
    
    // Execute tool calls in parallel for better performance
    const promises = toolCalls.map(async (call) => {
      try {
        const result = await this.executeSingleTool(call, userId);
        return {
          tool: call.function.name,
          success: true,
          result: result
        };
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
        
        return {
          tool: call.function.name,
          success: false,
          error: error.message
        };
      }
    });
    
    // Wait for all tool calls to complete in parallel
    const results = await Promise.all(promises);
    return results;
  }
  
  private async executeBatchShapeCreation(createShapeCalls: any[], allToolCalls: any[], userId: string): Promise<any[]> {
    try {
      // Convert tool calls to shape data
      const shapesData = createShapeCalls.map(call => {
        const args = JSON.parse(call.function.arguments);
        const { name } = call.function;
        
        if (name === 'createRectangle') {
          return {
            type: 'rectangle' as const,
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            color: args.color,
            rotation: 0,
            createdBy: userId
          };
        } else if (name === 'createCircle') {
          return {
            type: 'circle' as const,
            x: args.x,
            y: args.y,
            width: args.radius * 2,
            height: args.radius * 2,
            radius: args.radius,
            color: args.color,
            rotation: 0,
            createdBy: userId
          };
        } else if (name === 'createTriangle') {
          return {
            type: 'triangle' as const,
            x: args.x,
            y: args.y,
            width: args.width,
            height: args.height,
            color: args.color,
            rotation: 0,
            createdBy: userId
          };
        }
        return null;
      }).filter((shape): shape is NonNullable<typeof shape> => shape !== null);
      
      // Create all shapes in a single batch operation
      const createdShapes = await this.canvasService.createShapesBatch(shapesData);
      
      // Execute remaining tool calls in parallel
      const otherCalls = allToolCalls.filter(call => 
        !['createRectangle', 'createCircle', 'createTriangle'].includes(call.function.name)
      );
      
      const otherResults = otherCalls.length > 0 
        ? await Promise.all(otherCalls.map(async (call) => {
            try {
              const result = await this.executeSingleTool(call, userId);
              return {
                tool: call.function.name,
                success: true,
                result: result
              };
            } catch (error: any) {
              return {
                tool: call.function.name,
                success: false,
                error: error.message
              };
            }
          }))
        : [];
      
      // Combine results
      const batchResults = createShapeCalls.map((call, index) => ({
        tool: call.function.name,
        success: true,
        result: createdShapes[index]
      }));
      
      return [...batchResults, ...otherResults];
    } catch (error: any) {
      // If batch fails, fall back to individual creation
      console.warn('Batch creation failed, falling back to individual creation:', error);
      return await this.executeToolCalls(allToolCalls, userId);
    }
  }
  
  private async createMultipleShapes(args: any, userId: string) {
    const { count, shapeType, startX, startY, gridColumns, spacing, shapeWidth, shapeHeight, colors } = args;
    
    console.log(`🤖 AI creating ${count} ${shapeType} shapes at (${startX}, ${startY}) with ${colors.length} colors`);
    
    // Calculate grid positions with proper spacing to prevent overlap
    const shapesData = [];
    const canvasWidth = 5000;
    const canvasHeight = 5000;
    
    // Calculate cell dimensions to ensure no overlap
    const cellWidth = shapeWidth + spacing;
    const cellHeight = shapeHeight + spacing;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridColumns);
      const col = i % gridColumns;
      
      // Use cell-based positioning to ensure proper spacing
      const x = startX + (col * cellWidth);
      const y = startY + (row * cellHeight);
      
      // Debug first few shapes to see positioning
      if (i < 5) {
        console.log(`🔍 Shape ${i}: row=${row}, col=${col}, x=${x}, y=${y}, cellWidth=${cellWidth}, cellHeight=${cellHeight}`);
      }
      
      // Check bounds to ensure shapes stay within canvas
      const maxX = x + shapeWidth;
      const maxY = y + shapeHeight;
      
      if (maxX > canvasWidth || maxY > canvasHeight) {
        console.warn(`⚠️ Shape ${i} would be outside canvas bounds: (${x}, ${y}) to (${maxX}, ${maxY})`);
        // Skip this shape to avoid bounds errors
        continue;
      }
      
      const color = colors[i % colors.length];
      
      const shapeData: any = {
        type: shapeType,
        x,
        y,
        width: shapeWidth,
        height: shapeHeight,
        color,
        rotation: 0,
        createdBy: userId
      };
      
      // Add radius for circles
      if (shapeType === 'circle') {
        shapeData.radius = shapeWidth / 2;
      }
      
      shapesData.push(shapeData);
    }
    
    console.log(`🤖 AI prepared ${shapesData.length} ${shapeType} shapes for batch creation (${count - shapesData.length} skipped due to bounds)`);
    
    // Create all shapes in a single batch operation
    const result = await this.canvasService.createShapesBatch(shapesData);
    console.log(`🤖 AI successfully created ${result.length} ${shapeType} shapes`);
    return result;
  }
  
  /**
   * Create random shapes directly without relying on AI tool calls
   */
  private async createRandomShapesDirectly(countPerType: number, userId: string): Promise<any[]> {
    console.log(`🎲 Creating ${countPerType} random shapes of each type directly`);
    
    const results = [];
    
    try {
      // Create rectangles - Top-left area with balanced spacing
      console.log(`🎲 Step 1: Creating ${countPerType} rectangles...`);
      const rectangleArgs = {
        count: countPerType,
        shapeType: 'rectangle',
        startX: 100,
        startY: 100,
        gridColumns: 10, // 10 columns for better density
        spacing: 20, // Proper spacing to prevent overlap
        shapeWidth: 80, // Good size for visibility
        shapeHeight: 60,
        colors: ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899']
      };
      
      const rectangles = await this.createMultipleShapes(rectangleArgs, userId);
      console.log(`🎲 Step 1 Complete: Created ${rectangles.length} rectangles`);
      results.push({
        tool: 'createMultipleShapes',
        success: true,
        result: rectangles
      });
      
      // Create circles - Top-right area with balanced spacing
      console.log(`🎲 Step 2: Creating ${countPerType} circles...`);
      const circleArgs = {
        count: countPerType,
        shapeType: 'circle',
        startX: 2000, // Adjusted position for better balance
        startY: 100,
        gridColumns: 10, // 10 columns for better density
        spacing: 20, // Proper spacing to prevent overlap
        shapeWidth: 80, // Good size for visibility
        shapeHeight: 60,
        colors: ['#ef4444', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6']
      };
      
      const circles = await this.createMultipleShapes(circleArgs, userId);
      console.log(`🎲 Step 2 Complete: Created ${circles.length} circles`);
      results.push({
        tool: 'createMultipleShapes',
        success: true,
        result: circles
      });
      
      // Create triangles - Bottom area with balanced spacing
      console.log(`🎲 Step 3: Creating ${countPerType} triangles...`);
      const triangleArgs = {
        count: countPerType,
        shapeType: 'triangle',
        startX: 100,
        startY: 2000, // Adjusted position for better balance
        gridColumns: 10, // 10 columns for better density
        spacing: 20, // Proper spacing to prevent overlap
        shapeWidth: 80, // Good size for visibility
        shapeHeight: 60,
        colors: ['#22c55e', '#6366f1', '#ec4899', '#f97316', '#3b82f6']
      };
      
      const triangles = await this.createMultipleShapes(triangleArgs, userId);
      console.log(`🎲 Step 3 Complete: Created ${triangles.length} triangles`);
      results.push({
        tool: 'createMultipleShapes',
        success: true,
        result: triangles
      });
      
      console.log(`🎲 Successfully created ${countPerType} rectangles, ${countPerType} circles, and ${countPerType} triangles`);
      
    } catch (error) {
      console.error('❌ Error creating random shapes directly:', error);
      throw error;
    }
    
    return results;
  }
  
  private async executeSingleTool(call: any, userId: string) {
    const { name, arguments: argsStr } = call.function;
    logger.debug(LogCategory.AI, `Parsing tool call: ${name} with args: ${argsStr}`);
    const args = JSON.parse(argsStr);
    logger.debug(LogCategory.AI, `Parsed args: ${JSON.stringify(args)}`);
    
    switch (name) {
      case 'createMultipleShapes':
        return await this.createMultipleShapes(args, userId);
        
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
        const moveShapes = await this.canvasService.getShapes();
        const targetShape = moveShapes.find(s => s.id === args.shapeId);
        
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
        const canvasShapes = await this.canvasService.getShapes();
        const canvasGroups = await this.canvasService.getGroups();
        return { shapes: canvasShapes, groups: canvasGroups };
        
      // NEW LAYOUT TOOLS
      case 'groupShapes':
        return await this.canvasService.groupShapes(args.shapeIds, userId, args.name);
        
      case 'ungroupShapes':
        return await this.canvasService.ungroupShapes(args.groupId);
        
      case 'alignShapes':
        return await this.alignShapes(args.shapeIds, args.alignment);
        
      case 'arrangeShapesInRow':
        return await this.arrangeShapesInRow(args.shapeIds, args.spacing);
        
      case 'spaceShapesEvenly':
        return await this.spaceShapesEvenly(args.shapeIds, args.direction);
        
      case 'bringToFront':
        return await this.canvasService.bringToFront(args.shapeId);
        
      case 'sendToBack':
        return await this.canvasService.sendToBack(args.shapeId);
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  /**
   * Align multiple shapes to a common edge or center
   * @param shapeIds - Array of shape IDs to align
   * @param alignment - Alignment type: 'left', 'center', 'right', 'top', 'middle', 'bottom'
   */
  private async alignShapes(shapeIds: string[], alignment: string): Promise<void> {
    try {
      // Validate input
      if (!shapeIds || shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required for alignment');
      }

      // Get all shapes
      const shapes = await this.canvasService.getShapes();
      const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
      
      if (targetShapes.length !== shapeIds.length) {
        throw new Error('One or more shapes not found');
      }

      // Calculate alignment positions
      const positions = calculateAlignment(shapeIds, shapes, alignment);
      
      // Update shapes with batch operation
      await this.canvasService.updateShapePositions(positions);
    } catch (error) {
      console.error('❌ Error aligning shapes:', error);
      throw error;
    }
  }

  /**
   * Arrange shapes in a horizontal row with equal spacing
   * @param shapeIds - Array of shape IDs to arrange
   * @param spacing - Spacing between shapes (default 20px)
   */
  private async arrangeShapesInRow(shapeIds: string[], spacing: number = 20): Promise<void> {
    try {
      // Validate input
      if (!shapeIds || shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required for row arrangement');
      }

      // Get all shapes
      const shapes = await this.canvasService.getShapes();
      const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
      
      if (targetShapes.length !== shapeIds.length) {
        throw new Error('One or more shapes not found');
      }

      // Calculate row layout positions
      const positions = calculateRowLayout(shapeIds, shapes, spacing);
      
      // Update shapes with batch operation
      await this.canvasService.updateShapePositions(positions);
    } catch (error) {
      console.error('❌ Error arranging shapes in row:', error);
      throw error;
    }
  }

  /**
   * Space shapes evenly in a specified direction
   * @param shapeIds - Array of shape IDs to space
   * @param direction - Direction of spacing: 'horizontal' or 'vertical'
   */
  private async spaceShapesEvenly(shapeIds: string[], direction: 'horizontal' | 'vertical'): Promise<void> {
    try {
      // Validate input
      if (!shapeIds || shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required for even spacing');
      }

      // Get all shapes
      const shapes = await this.canvasService.getShapes();
      const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
      
      if (targetShapes.length !== shapeIds.length) {
        throw new Error('One or more shapes not found');
      }

      // Calculate even spacing positions
      const positions = calculateEvenSpacing(shapeIds, shapes, direction);
      
      // Update shapes with batch operation
      await this.canvasService.updateShapePositions(positions);
    } catch (error) {
      console.error('❌ Error spacing shapes evenly:', error);
      throw error;
    }
  }
  
  private isObjectModificationTool(toolName: string): boolean {
    // Check if the tool modifies objects (not just getCanvasState)
    return ['createRectangle', 'createCircle', 'createTriangle', 'createText', 
            'moveShape', 'resizeShape', 'rotateShape', 'duplicateShape', 'deleteShape',
            'groupShapes', 'ungroupShapes', 'alignShapes', 'arrangeShapesInRow', 'spaceShapesEvenly', 'bringToFront', 'sendToBack'].includes(toolName);
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
      'deleteShape': 'delete shape',
      'groupShapes': 'group shapes',
      'ungroupShapes': 'ungroup shapes',
      'alignShapes': 'align shapes',
      'arrangeShapesInRow': 'arrange shapes in row',
      'spaceShapesEvenly': 'space shapes evenly',
      'bringToFront': 'bring to front',
      'sendToBack': 'send to back'
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
    
    // Check for createMultipleShapes operations
    const multipleShapesCalls = results.filter(r => r.tool === 'createMultipleShapes' && r.success);
    if (multipleShapesCalls.length > 0) {
      const totalShapes = multipleShapesCalls.reduce((sum, call) => {
        const result = call.result;
        return sum + (Array.isArray(result) ? result.length : 0);
      }, 0);
      
      if (multipleShapesCalls.length === 3) {
        return `✓ Created ${totalShapes} random shapes (rectangles, circles, and triangles)`;
      } else if (multipleShapesCalls.length > 1) {
        return `✓ Created ${totalShapes} shapes in ${multipleShapesCalls.length} batches`;
      } else {
        return `✓ Created ${totalShapes} shapes`;
      }
    }
    
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
        case 'groupShapes': return '✓ Grouped shapes';
        case 'ungroupShapes': return '✓ Ungrouped shapes';
        case 'alignShapes': return '✓ Aligned shapes';
        case 'arrangeShapesInRow': return '✓ Arranged shapes in row';
        case 'spaceShapesEvenly': return '✓ Spaced shapes evenly';
        case 'bringToFront': return '✓ Brought shape to front';
        case 'sendToBack': return '✓ Sent shape to back';
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
          name: "createMultipleShapes",
          description: "Creates multiple shapes efficiently in a single operation. Use this for creating 5+ shapes at once.",
          parameters: {
            type: "object",
            properties: {
              count: { type: "number", description: "Number of shapes to create" },
              shapeType: { type: "string", enum: ["rectangle", "circle", "triangle"], description: "Type of shapes to create" },
              startX: { type: "number", description: "Starting X position for grid layout" },
              startY: { type: "number", description: "Starting Y position for grid layout" },
              gridColumns: { type: "number", description: "Number of columns in grid layout" },
              spacing: { type: "number", description: "Spacing between shapes in pixels" },
              shapeWidth: { type: "number", description: "Width of each shape" },
              shapeHeight: { type: "number", description: "Height of each shape" },
              colors: { type: "array", items: { type: "string" }, description: "Array of colors to use (will cycle through)" }
            },
            required: ["count", "shapeType", "startX", "startY", "gridColumns", "spacing", "shapeWidth", "shapeHeight", "colors"]
          }
        }
      },
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
      
      // NEW LAYOUT TOOLS
      {
        type: "function" as const,
        function: {
          name: "groupShapes",
          description: "Groups multiple shapes together for collective operations. MUST call getCanvasState first to find shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to group" },
              name: { type: "string", description: "Optional group name" }
            },
            required: ["shapeIds"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "ungroupShapes",
          description: "Ungroups shapes by removing them from their group. MUST call getCanvasState first to find groupId.",
          parameters: {
            type: "object",
            properties: {
              groupId: { type: "string", description: "ID of the group to ungroup" }
            },
            required: ["groupId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "alignShapes",
          description: "Aligns multiple shapes to a common edge or center. MUST call getCanvasState first to find shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to align" },
              alignment: { 
                type: "string", 
                enum: ["left", "center", "right", "top", "middle", "bottom"],
                description: "Alignment type: left, center, right, top, middle, bottom"
              }
            },
            required: ["shapeIds", "alignment"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "arrangeShapesInRow",
          description: "Arranges selected shapes in a horizontal row with equal spacing. MUST call getCanvasState first to find shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to arrange" },
              spacing: { type: "number", description: "Spacing between shapes in pixels (default 20)" }
            },
            required: ["shapeIds"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "spaceShapesEvenly",
          description: "Spaces selected shapes evenly in a specified direction. MUST call getCanvasState first to find shapeIds.",
          parameters: {
            type: "object",
            properties: {
              shapeIds: { type: "array", items: { type: "string" }, description: "Array of shape IDs to space" },
              direction: { 
                type: "string", 
                enum: ["horizontal", "vertical"],
                description: "Direction of spacing: horizontal or vertical"
              }
            },
            required: ["shapeIds", "direction"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "bringToFront",
          description: "Brings a shape to the front (highest z-index). MUST call getCanvasState first to find shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to bring to front" }
            },
            required: ["shapeId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "sendToBack",
          description: "Sends a shape to the back (lowest z-index). MUST call getCanvasState first to find shapeId.",
          parameters: {
            type: "object",
            properties: {
              shapeId: { type: "string", description: "ID of the shape to send to back" }
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
