/**
 * Integration tests for AI layout commands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../src/services/aiService';
import { CanvasService } from '../../src/services/canvasService';
import type { Shape } from '../../src/services/canvasService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  firestore: {}
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    __esModule: true,
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('AI Layout Commands Integration', () => {
  let aiService: AIService;
  let canvasService: CanvasService;

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
    
    // Mock environment variables
    process.env.VITE_OPENAI_API_KEY = 'test-api-key';
    
    aiService = new AIService();
    canvasService = new CanvasService();
  });

  describe('End-to-End Layout Commands', () => {
    beforeEach(() => {
      // Mock OpenAI response for layout commands
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'arrangeShapesInRow',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  spacing: 20
                })
              }
            }]
          }
        }]
      });
    });

    it('should execute "arrange these shapes in a row" command', async () => {
      // Mock canvas service methods
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockResolvedValue();

      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('✓ Arranged shapes in row');
    });

    it('should execute "space these elements evenly" command', async () => {
      // Mock OpenAI response for space evenly command
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'spaceShapesEvenly',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  direction: 'horizontal'
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockResolvedValue();

      const result = await aiService.executeCommand('space these elements evenly', 'user1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('✓ Spaced shapes evenly');
    });

    it('should execute "align these shapes to the left" command', async () => {
      // Mock OpenAI response for align command
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'alignShapes',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  alignment: 'left'
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockResolvedValue();

      const result = await aiService.executeCommand('align these shapes to the left', 'user1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('✓ Aligned shapes');
    });

    it('should execute "group these shapes" command', async () => {
      // Mock OpenAI response for group command
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'groupShapes',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  name: 'Group 3'
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'groupShapes').mockResolvedValue('group_123');

      const result = await aiService.executeCommand('group these shapes', 'user1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('✓ Grouped shapes');
    });

    it('should execute "bring the blue rectangle to the front" command', async () => {
      // Mock OpenAI response for bring to front command
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'bringToFront',
                arguments: JSON.stringify({
                  shapeId: 'shape1'
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'bringToFront').mockResolvedValue();

      const result = await aiService.executeCommand('bring the blue rectangle to the front', 'user1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('✓ Brought shape to front');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid shape selection gracefully', async () => {
      // Mock OpenAI response that returns error
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: "I couldn't find the requested shapes on the canvas.",
            tool_calls: [{
              function: {
                name: 'getCanvasState',
                arguments: JSON.stringify({})
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue([]);

      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');

      expect(result.success).toBe(false);
      expect(result.message).toContain("I couldn't find the requested shapes on the canvas.");
    });

    it('should handle OpenAI API errors', async () => {
      // Mock OpenAI API error
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('⚠️ AI service error. Please try again.');
    });

    it('should handle canvas service errors', async () => {
      // Mock OpenAI response
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'arrangeShapesInRow',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  spacing: 20
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockRejectedValue(new Error('Database connection failed'));

      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('⚠️ AI service error. Please try again.');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete layout commands within 2 seconds', async () => {
      const startTime = Date.now();

      // Mock OpenAI response
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'arrangeShapesInRow',
                arguments: JSON.stringify({
                  shapeIds: ['shape1', 'shape2', 'shape3'],
                  spacing: 20
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockResolvedValue();

      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(2000); // 2 seconds
    });

    it('should handle large numbers of shapes efficiently', async () => {
      // Create 20 shapes for performance test
      const manyShapes: Shape[] = Array.from({ length: 20 }, (_, i) => ({
        id: `shape${i}`,
        type: 'rectangle' as const,
        x: i * 50,
        y: 200,
        width: 40,
        height: 30,
        color: '#3b82f6',
        zIndex: i,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Mock OpenAI response
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              function: {
                name: 'arrangeShapesInRow',
                arguments: JSON.stringify({
                  shapeIds: manyShapes.map(s => s.id),
                  spacing: 20
                })
              }
            }]
          }
        }]
      });

      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(manyShapes);
      vi.spyOn(canvasService, 'updateShapePositions').mockResolvedValue();

      const startTime = Date.now();
      const result = await aiService.executeCommand('arrange these shapes in a row', 'user1');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
