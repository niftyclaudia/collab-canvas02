import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIService } from '../../../src/services/aiService';
import { ChatMessage } from '../../../src/types/chat';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

// Mock CanvasService
const mockCanvasService = {
  getShapes: vi.fn(),
  createShape: vi.fn(),
  createCircle: vi.fn(),
  createTriangle: vi.fn(),
  createText: vi.fn()
};

vi.mock('../../../src/services/canvasService', () => ({
  CanvasService: vi.fn(() => mockCanvasService)
}));

// Mock AI prompts
vi.mock('../../../src/utils/aiPrompts', () => ({
  getSystemPrompt: vi.fn(() => 'Mock system prompt')
}));

describe('AIService Chat Tests', () => {
  let aiService: AIService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return AI response', async () => {
      const mockCommandResult = {
        success: true,
        message: 'Created a blue rectangle',
        toolCalls: []
      };

      // Mock the executeCommand method
      const executeCommandSpy = vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      const result = await aiService.sendMessage('create a blue rectangle', mockUserId);

      expect(executeCommandSpy).toHaveBeenCalledWith('create a blue rectangle', mockUserId);
      expect(result).toEqual({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
        type: 'ai',
        content: 'Created a blue rectangle',
        timestamp: expect.any(Date),
        status: 'success'
      });
    });

    it('should handle AI service errors', async () => {
      const mockError = new Error('AI service error');
      
      const executeCommandSpy = vi.spyOn(aiService, 'executeCommand')
        .mockRejectedValue(mockError);

      const result = await aiService.sendMessage('invalid command', mockUserId);

      expect(executeCommandSpy).toHaveBeenCalledWith('invalid command', mockUserId);
      expect(result).toEqual({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
        type: 'ai',
        content: '⚠️ AI service error. Please try again.',
        timestamp: expect.any(Date),
        status: 'error'
      });
    });

    it('should handle failed AI commands', async () => {
      const mockCommandResult = {
        success: false,
        message: 'I could not understand that command',
        toolCalls: []
      };

      const executeCommandSpy = vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      const result = await aiService.sendMessage('invalid command', mockUserId);

      expect(executeCommandSpy).toHaveBeenCalledWith('invalid command', mockUserId);
      expect(result).toEqual({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
        type: 'ai',
        content: 'I could not understand that command',
        timestamp: expect.any(Date),
        status: 'error'
      });
    });

    it('should generate unique message IDs', async () => {
      const mockCommandResult = {
        success: true,
        message: 'Test message',
        toolCalls: []
      };

      vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      const result1 = await aiService.sendMessage('test 1', mockUserId);
      const result2 = await aiService.sendMessage('test 2', mockUserId);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(result2.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });
  });

  describe('generateMessageId', () => {
    it('should generate unique IDs with correct format', () => {
      const id1 = (aiService as any).generateMessageId();
      const id2 = (aiService as any).generateMessageId();

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('integration with executeCommand', () => {
    it('should call executeCommand with correct parameters', async () => {
      const mockCommandResult = {
        success: true,
        message: 'Test result',
        toolCalls: []
      };

      const executeCommandSpy = vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      await aiService.sendMessage('test command', mockUserId);

      expect(executeCommandSpy).toHaveBeenCalledTimes(1);
      expect(executeCommandSpy).toHaveBeenCalledWith('test command', mockUserId);
    });

    it('should handle executeCommand errors gracefully', async () => {
      const mockError = new Error('Network error');
      
      const executeCommandSpy = vi.spyOn(aiService, 'executeCommand')
        .mockRejectedValue(mockError);

      const result = await aiService.sendMessage('test command', mockUserId);

      expect(executeCommandSpy).toHaveBeenCalledWith('test command', mockUserId);
      expect(result.status).toBe('error');
      expect(result.content).toContain('AI service error');
    });
  });

  describe('message status handling', () => {
    it('should set success status for successful commands', async () => {
      const mockCommandResult = {
        success: true,
        message: 'Success message',
        toolCalls: []
      };

      vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      const result = await aiService.sendMessage('successful command', mockUserId);

      expect(result.status).toBe('success');
    });

    it('should set error status for failed commands', async () => {
      const mockCommandResult = {
        success: false,
        message: 'Error message',
        toolCalls: []
      };

      vi.spyOn(aiService, 'executeCommand')
        .mockResolvedValue(mockCommandResult);

      const result = await aiService.sendMessage('failed command', mockUserId);

      expect(result.status).toBe('error');
    });

    it('should set error status for thrown exceptions', async () => {
      vi.spyOn(aiService, 'executeCommand')
        .mockRejectedValue(new Error('Exception'));

      const result = await aiService.sendMessage('exception command', mockUserId);

      expect(result.status).toBe('error');
    });
  });
});
