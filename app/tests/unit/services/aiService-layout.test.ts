/**
 * Unit tests for AI service layout functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../../src/services/aiService';
import { CanvasService } from '../../../src/services/canvasService';
import type { Shape } from '../../../src/services/canvasService';
import { Timestamp } from 'firebase/firestore';

// Mock the CanvasService
vi.mock('../../../src/services/canvasService');
const MockedCanvasService = CanvasService as any;

describe('AI Service Layout Functions', () => {
  let aiService: AIService;
  let mockCanvasService: any;

  const mockShapes: Shape[] = [
    {
      id: 'shape1',
      type: 'rectangle',
      x: 100,
      y: 200,
      width: 100,
      height: 80,
      color: '#3b82f6',
      zIndex: 1,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'shape2',
      type: 'circle',
      x: 300,
      y: 200,
      width: 80,
      height: 80,
      radius: 40,
      color: '#ef4444',
      zIndex: 2,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'shape3',
      type: 'triangle',
      x: 500,
      y: 200,
      width: 120,
      height: 100,
      color: '#10b981',
      zIndex: 3,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock CanvasService instance
    mockCanvasService = {
      getShapes: vi.fn(),
      updateShapePositions: vi.fn(),
      groupShapes: vi.fn(),
      ungroupShapes: vi.fn(),
      bringToFront: vi.fn(),
      sendToBack: vi.fn(),
    };

    // Mock the CanvasService constructor
    MockedCanvasService.mockImplementation(() => mockCanvasService);

    aiService = new AIService();
  });

  describe('Layout Tool Execution', () => {
    beforeEach(() => {
      mockCanvasService.getShapes.mockResolvedValue(mockShapes);
    });

    it('should execute arrangeShapesInRow tool', async () => {
      const toolCall = {
        function: {
          name: 'arrangeShapesInRow',
          arguments: JSON.stringify({
            shapeIds: ['shape1', 'shape2', 'shape3'],
            spacing: 20
          })
        }
      };

      mockCanvasService.updateShapePositions.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.getShapes).toHaveBeenCalled();
      expect(mockCanvasService.updateShapePositions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'shape1' }),
          expect.objectContaining({ id: 'shape2' }),
          expect.objectContaining({ id: 'shape3' })
        ])
      );
    });

    it('should execute spaceShapesEvenly tool', async () => {
      const toolCall = {
        function: {
          name: 'spaceShapesEvenly',
          arguments: JSON.stringify({
            shapeIds: ['shape1', 'shape2', 'shape3'],
            direction: 'horizontal'
          })
        }
      };

      mockCanvasService.updateShapePositions.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.getShapes).toHaveBeenCalled();
      expect(mockCanvasService.updateShapePositions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'shape1' }),
          expect.objectContaining({ id: 'shape2' }),
          expect.objectContaining({ id: 'shape3' })
        ])
      );
    });

    it('should execute alignShapes tool', async () => {
      const toolCall = {
        function: {
          name: 'alignShapes',
          arguments: JSON.stringify({
            shapeIds: ['shape1', 'shape2', 'shape3'],
            alignment: 'left'
          })
        }
      };

      mockCanvasService.updateShapePositions.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.getShapes).toHaveBeenCalled();
      expect(mockCanvasService.updateShapePositions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'shape1' }),
          expect.objectContaining({ id: 'shape2' }),
          expect.objectContaining({ id: 'shape3' })
        ])
      );
    });

    it('should execute groupShapes tool', async () => {
      const toolCall = {
        function: {
          name: 'groupShapes',
          arguments: JSON.stringify({
            shapeIds: ['shape1', 'shape2', 'shape3'],
            name: 'Test Group'
          })
        }
      };

      mockCanvasService.groupShapes.mockResolvedValue('group_123');

      const result = await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.groupShapes).toHaveBeenCalledWith(
        ['shape1', 'shape2', 'shape3'],
        'user1',
        'Test Group'
      );
      expect(result).toBe('group_123');
    });

    it('should execute ungroupShapes tool', async () => {
      const toolCall = {
        function: {
          name: 'ungroupShapes',
          arguments: JSON.stringify({
            groupId: 'group_123'
          })
        }
      };

      mockCanvasService.ungroupShapes.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.ungroupShapes).toHaveBeenCalledWith('group_123');
    });

    it('should execute bringToFront tool', async () => {
      const toolCall = {
        function: {
          name: 'bringToFront',
          arguments: JSON.stringify({
            shapeId: 'shape1'
          })
        }
      };

      mockCanvasService.bringToFront.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.bringToFront).toHaveBeenCalledWith('shape1');
    });

    it('should execute sendToBack tool', async () => {
      const toolCall = {
        function: {
          name: 'sendToBack',
          arguments: JSON.stringify({
            shapeId: 'shape1'
          })
        }
      };

      mockCanvasService.sendToBack.mockResolvedValue();

      await (aiService as any).executeSingleTool(toolCall, 'user1');

      expect(mockCanvasService.sendToBack).toHaveBeenCalledWith('shape1');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid shape IDs in layout commands', async () => {
      const toolCall = {
        function: {
          name: 'arrangeShapesInRow',
          arguments: JSON.stringify({
            shapeIds: ['nonexistent1', 'nonexistent2'],
            spacing: 20
          })
        }
      };

      mockCanvasService.getShapes.mockResolvedValue(mockShapes);

      await expect((aiService as any).executeSingleTool(toolCall, 'user1'))
        .rejects.toThrow('One or more shapes not found');
    });

    it('should handle insufficient shapes for layout commands', async () => {
      const toolCall = {
        function: {
          name: 'arrangeShapesInRow',
          arguments: JSON.stringify({
            shapeIds: ['shape1'],
            spacing: 20
          })
        }
      };

      mockCanvasService.getShapes.mockResolvedValue(mockShapes);

      await expect((aiService as any).executeSingleTool(toolCall, 'user1'))
        .rejects.toThrow('At least 2 shapes are required for row arrangement');
    });

    it('should handle canvas service errors', async () => {
      const toolCall = {
        function: {
          name: 'arrangeShapesInRow',
          arguments: JSON.stringify({
            shapeIds: ['shape1', 'shape2'],
            spacing: 20
          })
        }
      };

      mockCanvasService.getShapes.mockResolvedValue(mockShapes);
      mockCanvasService.updateShapePositions.mockRejectedValue(new Error('Database error'));

      await expect((aiService as any).executeSingleTool(toolCall, 'user1'))
        .rejects.toThrow('Database error');
    });
  });

  describe('Tool Definitions', () => {
    it('should include all layout tools in tool definitions', () => {
      const toolDefinitions = (aiService as any).getToolDefinitions();
      const toolNames = toolDefinitions.map((tool: any) => tool.function.name);

      expect(toolNames).toContain('groupShapes');
      expect(toolNames).toContain('ungroupShapes');
      expect(toolNames).toContain('alignShapes');
      expect(toolNames).toContain('arrangeShapesInRow');
      expect(toolNames).toContain('spaceShapesEvenly');
      expect(toolNames).toContain('bringToFront');
      expect(toolNames).toContain('sendToBack');
    });

    it('should have correct parameters for layout tools', () => {
      const toolDefinitions = (aiService as any).getToolDefinitions();
      
      const arrangeTool = toolDefinitions.find((tool: any) => tool.function.name === 'arrangeShapesInRow');
      expect(arrangeTool.function.parameters.properties).toHaveProperty('shapeIds');
      expect(arrangeTool.function.parameters.properties).toHaveProperty('spacing');
      expect(arrangeTool.function.parameters.required).toContain('shapeIds');

      const alignTool = toolDefinitions.find((tool: any) => tool.function.name === 'alignShapes');
      expect(alignTool.function.parameters.properties).toHaveProperty('shapeIds');
      expect(alignTool.function.parameters.properties).toHaveProperty('alignment');
      expect(alignTool.function.parameters.required).toContain('shapeIds');
      expect(alignTool.function.parameters.required).toContain('alignment');
    });
  });

  describe('Success Messages', () => {
    it('should generate correct success messages for layout tools', () => {
      const generateSuccessMessage = (aiService as any).generateSuccessMessage;

      expect(generateSuccessMessage([{ tool: 'arrangeShapesInRow', success: true }]))
        .toBe('✓ Arranged shapes in row');

      expect(generateSuccessMessage([{ tool: 'spaceShapesEvenly', success: true }]))
        .toBe('✓ Spaced shapes evenly');

      expect(generateSuccessMessage([{ tool: 'alignShapes', success: true }]))
        .toBe('✓ Aligned shapes');

      expect(generateSuccessMessage([{ tool: 'groupShapes', success: true }]))
        .toBe('✓ Grouped shapes');

      expect(generateSuccessMessage([{ tool: 'ungroupShapes', success: true }]))
        .toBe('✓ Ungrouped shapes');

      expect(generateSuccessMessage([{ tool: 'bringToFront', success: true }]))
        .toBe('✓ Brought shape to front');

      expect(generateSuccessMessage([{ tool: 'sendToBack', success: true }]))
        .toBe('✓ Sent shape to back');
    });
  });
});
