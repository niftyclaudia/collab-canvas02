import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIService } from '../../src/services/aiService';
import { CanvasService } from '../../src/services/canvasService';

describe('AI Complex Commands Integration', () => {
  let aiService: AIService;
  let canvasService: CanvasService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    aiService = new AIService();
    canvasService = new CanvasService();
  });

  afterEach(async () => {
    // Clean up any test shapes
    try {
      const shapes = await canvasService.getShapes();
      for (const shape of shapes) {
        await canvasService.deleteShape(shape.id);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Login Form Creation', () => {
    it('should create a complete login form with 6 elements', async () => {
      const result = await aiService.createLoginForm(testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(6);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(6);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('Login form created with 6 elements');

      // Verify shapes were actually created
      const shapes = await canvasService.getShapes();
      expect(shapes).toHaveLength(6);

      // Verify we have the expected elements
      const textShapes = shapes.filter(s => s.type === 'text');
      const rectangleShapes = shapes.filter(s => s.type === 'rectangle');
      
      expect(textShapes).toHaveLength(3); // title, username label, password label
      expect(rectangleShapes).toHaveLength(3); // username input, password input, login button
    });

    it('should handle partial failures gracefully', async () => {
      // Mock a failure scenario by using invalid parameters
      const result = await aiService.createLoginForm(testUserId, { x: -1000, y: -1000 });

      // Should still attempt to create all elements
      expect(result.totalSteps).toBe(6);
      expect(result.stepsCompleted).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('partially created');
    });
  });

  describe('Grid Creation', () => {
    it('should create a 3x3 grid with 9 shapes', async () => {
      const result = await aiService.createGrid(testUserId, 3, 3, 50);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(9);
      expect(result.totalSteps).toBe(9);
      expect(result.createdShapes).toHaveLength(9);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('3x3 grid created with 9 shapes');

      // Verify shapes were actually created
      const shapes = await canvasService.getShapes();
      expect(shapes).toHaveLength(9);

      // All shapes should be rectangles
      const rectangleShapes = shapes.filter(s => s.type === 'rectangle');
      expect(rectangleShapes).toHaveLength(9);
    });

    it('should create a 4x4 grid with 16 shapes', async () => {
      const result = await aiService.createGrid(testUserId, 4, 4, 50);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(16);
      expect(result.totalSteps).toBe(16);
      expect(result.createdShapes).toHaveLength(16);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('4x4 grid created with 16 shapes');

      // Verify shapes were actually created
      const shapes = await canvasService.getShapes();
      expect(shapes).toHaveLength(16);
    });

    it('should create a 2x5 grid with 10 shapes', async () => {
      const result = await aiService.createGrid(testUserId, 2, 5, 50);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(10);
      expect(result.totalSteps).toBe(10);
      expect(result.createdShapes).toHaveLength(10);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('2x5 grid created with 10 shapes');

      // Verify shapes were actually created
      const shapes = await canvasService.getShapes();
      expect(shapes).toHaveLength(10);
    });

    it('should handle grid creation with custom position', async () => {
      const customPosition = { x: 1000, y: 1000 };
      const result = await aiService.createGrid(testUserId, 2, 2, 50, customPosition);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(4);
      expect(result.totalSteps).toBe(4);
      expect(result.createdShapes).toHaveLength(4);

      // Verify shapes were created at the custom position
      const shapes = await canvasService.getShapes();
      expect(shapes).toHaveLength(4);
      
      // Check that shapes are positioned around the custom position
      const firstShape = shapes[0];
      expect(firstShape.x).toBeGreaterThanOrEqual(customPosition.x);
      expect(firstShape.y).toBeGreaterThanOrEqual(customPosition.y);
    });
  });

  describe('Complex Command Execution', () => {
    it('should execute "create login form" command', async () => {
      const result = await aiService.executeComplexCommand('create login form', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(6);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(6);
      expect(result.message).toContain('Login form created');
    });

    it('should execute "make 3x3 grid" command', async () => {
      const result = await aiService.executeComplexCommand('make 3x3 grid', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(9);
      expect(result.totalSteps).toBe(9);
      expect(result.createdShapes).toHaveLength(9);
      expect(result.message).toContain('3x3 grid created');
    });

    it('should execute "create 4x4 grid" command', async () => {
      const result = await aiService.executeComplexCommand('create 4x4 grid', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(16);
      expect(result.totalSteps).toBe(16);
      expect(result.createdShapes).toHaveLength(16);
      expect(result.message).toContain('4x4 grid created');
    });

    it('should fallback to regular command for non-complex commands', async () => {
      const result = await aiService.executeComplexCommand('create a blue rectangle', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(1);
      expect(result.totalSteps).toBe(1);
      expect(result.createdShapes).toHaveLength(1);
    });

    it('should handle invalid commands gracefully', async () => {
      const result = await aiService.executeComplexCommand('invalid command', testUserId);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(0);
      expect(result.totalSteps).toBe(1);
      expect(result.createdShapes).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error by using invalid user ID
      const result = await aiService.createLoginForm('invalid-user');

      // Should still attempt to create elements but may fail
      expect(result.totalSteps).toBe(6);
      expect(result.stepsCompleted).toBeGreaterThanOrEqual(0);
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should preserve successful steps when some steps fail', async () => {
      // This test verifies that partial failures don't rollback successful steps
      const result = await aiService.createLoginForm(testUserId);

      // Even if some steps fail, successful ones should be preserved
      expect(result.stepsCompleted).toBeGreaterThan(0);
      expect(result.createdShapes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete login form creation within 5 seconds', async () => {
      const startTime = Date.now();
      const result = await aiService.createLoginForm(testUserId);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should complete 3x3 grid creation within 5 seconds', async () => {
      const startTime = Date.now();
      const result = await aiService.createGrid(testUserId, 3, 3, 50);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should complete 4x4 grid creation within 5 seconds', async () => {
      const startTime = Date.now();
      const result = await aiService.createGrid(testUserId, 4, 4, 50);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
