import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../../src/services/aiService';
import { CanvasService } from '../../../src/services/canvasService';

// Mock the CanvasService
vi.mock('../../../src/services/canvasService');

describe('AIService Complex Commands', () => {
  let aiService: AIService;
  let mockCanvasService: any;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock CanvasService
    mockCanvasService = {
      createText: vi.fn(),
      createRectangle: vi.fn(),
      createCircle: vi.fn(),
      createTriangle: vi.fn(),
      getShapes: vi.fn(),
      deleteShape: vi.fn()
    };

    // Mock the CanvasService constructor
    vi.mocked(CanvasService).mockImplementation(() => mockCanvasService as any);

    aiService = new AIService();
  });

  describe('executeComplexCommand', () => {
    it('should execute login form command', async () => {
      // Mock successful shape creation
      mockCanvasService.createText.mockResolvedValue({ id: 'text-1' });
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.executeComplexCommand('create login form', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(6);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(6);
      expect(result.message).toContain('Login form created');
    });

    it('should execute 3x3 grid command', async () => {
      // Mock successful shape creation
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.executeComplexCommand('make 3x3 grid', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(9);
      expect(result.totalSteps).toBe(9);
      expect(result.createdShapes).toHaveLength(9);
      expect(result.message).toContain('3x3 grid created');
    });

    it('should execute 4x4 grid command', async () => {
      // Mock successful shape creation
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.executeComplexCommand('create 4x4 grid', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(16);
      expect(result.totalSteps).toBe(16);
      expect(result.createdShapes).toHaveLength(16);
      expect(result.message).toContain('4x4 grid created');
    });

    it('should execute 4x4 grid with random colors command', async () => {
      // Mock successful shape creation
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.executeComplexCommand('create 4x4 grid with random colors', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(16);
      expect(result.totalSteps).toBe(16);
      expect(result.createdShapes).toHaveLength(16);
      expect(result.message).toContain('4x4 grid created');
    });

    it('should execute 3x3 grid with random colors command', async () => {
      // Mock successful shape creation
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.executeComplexCommand('make 3x3 grid with random colors', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(9);
      expect(result.totalSteps).toBe(9);
      expect(result.createdShapes).toHaveLength(9);
      expect(result.message).toContain('3x3 grid created');
    });

    it('should fallback to regular command for non-complex commands', async () => {
      // Mock the regular executeCommand method
      const mockExecuteCommand = vi.spyOn(aiService as any, 'executeCommand');
      mockExecuteCommand.mockResolvedValue({
        success: true,
        message: 'Regular command executed',
        toolCalls: [{ success: true, result: { id: 'shape-1' } }]
      });

      const result = await aiService.executeComplexCommand('create a blue rectangle', testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(1);
      expect(result.totalSteps).toBe(1);
      expect(result.createdShapes).toHaveLength(1);
      expect(result.message).toBe('Regular command executed');
    });

    it('should handle errors gracefully', async () => {
      // Mock a failure scenario
      mockCanvasService.createText.mockRejectedValue(new Error('Network error'));

      const result = await aiService.executeComplexCommand('create login form', testUserId);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(0);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('Failed to create login form');
    });
  });

  describe('createLoginForm', () => {
    it('should create all 6 elements successfully', async () => {
      // Mock successful shape creation
      mockCanvasService.createText.mockResolvedValue({ id: 'text-1' });
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.createLoginForm(testUserId);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(6);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(6);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('Login form created with 6 elements');

      // Verify createText was called 3 times (title, username label, password label)
      expect(mockCanvasService.createText).toHaveBeenCalledTimes(3);
      
      // Verify createRectangle was called 3 times (username input, password input, login button)
      expect(mockCanvasService.createRectangle).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      // Mock some failures
      mockCanvasService.createText
        .mockResolvedValueOnce({ id: 'text-1' }) // title succeeds
        .mockRejectedValueOnce(new Error('Network error')) // username label fails
        .mockResolvedValueOnce({ id: 'text-2' }); // password label succeeds
      
      mockCanvasService.createRectangle
        .mockResolvedValueOnce({ id: 'rect-1' }) // username input succeeds
        .mockRejectedValueOnce(new Error('Network error')) // password input fails
        .mockResolvedValueOnce({ id: 'rect-2' }); // login button succeeds

      const result = await aiService.createLoginForm(testUserId);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(4); // 4 out of 6 succeeded
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(4);
      expect(result.errors).toHaveLength(2);
      expect(result.message).toContain('partially created');
    });

    it('should use custom position when provided', async () => {
      const customPosition = { x: 1000, y: 1000 };
      mockCanvasService.createText.mockResolvedValue({ id: 'text-1' });
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      await aiService.createLoginForm(testUserId, customPosition);

      // Verify createText was called with custom position
      expect(mockCanvasService.createText).toHaveBeenCalledWith(
        'Login Form',
        customPosition.x,
        customPosition.y,
        24,
        '#000000',
        'bold',
        'normal',
        'none',
        testUserId
      );
    });
  });

  describe('createGrid', () => {
    it('should create 3x3 grid successfully', async () => {
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.createGrid(testUserId, 3, 3, 50);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(9);
      expect(result.totalSteps).toBe(9);
      expect(result.createdShapes).toHaveLength(9);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('3x3 grid created with 9 shapes');

      // Verify createRectangle was called 9 times
      expect(mockCanvasService.createRectangle).toHaveBeenCalledTimes(9);
    });

    it('should create 4x4 grid successfully', async () => {
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      const result = await aiService.createGrid(testUserId, 4, 4, 50);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(16);
      expect(result.totalSteps).toBe(16);
      expect(result.createdShapes).toHaveLength(16);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('4x4 grid created with 16 shapes');

      // Verify createRectangle was called 16 times
      expect(mockCanvasService.createRectangle).toHaveBeenCalledTimes(16);
    });

    it('should handle partial failures in grid creation', async () => {
      // Mock some failures
      mockCanvasService.createRectangle
        .mockResolvedValueOnce({ id: 'rect-1' })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'rect-2' })
        .mockResolvedValueOnce({ id: 'rect-3' });

      const result = await aiService.createGrid(testUserId, 2, 2, 50);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(3); // 3 out of 4 succeeded
      expect(result.totalSteps).toBe(4);
      expect(result.createdShapes).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.message).toContain('partially created');
    });

    it('should use custom position when provided', async () => {
      const customPosition = { x: 1000, y: 1000 };
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      await aiService.createGrid(testUserId, 2, 2, 50, customPosition);

      // Verify createRectangle was called with custom position
      expect(mockCanvasService.createRectangle).toHaveBeenCalledWith(
        customPosition.x,
        customPosition.y,
        60, // shapeSize
        60, // shapeSize
        expect.any(String), // color
        testUserId
      );
    });

    it('should use different colors for each shape when useRandomColors is true', async () => {
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      await aiService.createGrid(testUserId, 2, 2, 50, undefined, true);

      // Verify createRectangle was called with different colors
      const calls = mockCanvasService.createRectangle.mock.calls;
      const colors = calls.map(call => call[4]); // color is the 5th parameter
      
      // Should have different colors
      expect(new Set(colors).size).toBeGreaterThan(1);
    });

    it('should use same color for all shapes when useRandomColors is false', async () => {
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      await aiService.createGrid(testUserId, 2, 2, 50, undefined, false);

      // Verify createRectangle was called with same color
      const calls = mockCanvasService.createRectangle.mock.calls;
      const colors = calls.map(call => call[4]); // color is the 5th parameter
      
      // Should have same color for all shapes
      expect(new Set(colors).size).toBe(1);
      expect(colors[0]).toBe('#3b82f6'); // default color
    });

    it('should use same color by default (useRandomColors defaults to false)', async () => {
      mockCanvasService.createRectangle.mockResolvedValue({ id: 'rect-1' });

      await aiService.createGrid(testUserId, 2, 2, 50);

      // Verify createRectangle was called with same color
      const calls = mockCanvasService.createRectangle.mock.calls;
      const colors = calls.map(call => call[4]); // color is the 5th parameter
      
      // Should have same color for all shapes
      expect(new Set(colors).size).toBe(1);
      expect(colors[0]).toBe('#3b82f6'); // default color
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in login form creation', async () => {
      mockCanvasService.createText.mockRejectedValue(new Error('Network error'));

      const result = await aiService.createLoginForm(testUserId);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(0);
      expect(result.totalSteps).toBe(6);
      expect(result.createdShapes).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('Failed to create login form');
    });

    it('should handle network errors in grid creation', async () => {
      mockCanvasService.createRectangle.mockRejectedValue(new Error('Network error'));

      const result = await aiService.createGrid(testUserId, 2, 2, 50);

      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBe(0);
      expect(result.totalSteps).toBe(4);
      expect(result.createdShapes).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('Failed to create grid');
    });

    it('should preserve successful steps when some steps fail', async () => {
      // Mock partial failures
      mockCanvasService.createText
        .mockResolvedValueOnce({ id: 'text-1' }) // title succeeds
        .mockRejectedValueOnce(new Error('Network error')) // username label fails
        .mockResolvedValueOnce({ id: 'text-2' }); // password label succeeds
      
      mockCanvasService.createRectangle
        .mockResolvedValueOnce({ id: 'rect-1' }) // username input succeeds
        .mockRejectedValueOnce(new Error('Network error')) // password input fails
        .mockResolvedValueOnce({ id: 'rect-2' }); // login button succeeds

      const result = await aiService.createLoginForm(testUserId);

      // Should preserve successful steps
      expect(result.stepsCompleted).toBe(4);
      expect(result.createdShapes).toHaveLength(4);
      expect(result.errors.length).toBe(2);
    });
  });
});
