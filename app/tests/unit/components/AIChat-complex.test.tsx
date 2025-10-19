import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChat } from '../../../src/components/AI/AIChat';
import { useCanvas } from '../../../src/hooks/useCanvas';
import { useAI } from '../../../src/hooks/useAI';

// Mock the hooks
vi.mock('../../../src/hooks/useCanvas');
vi.mock('../../../src/hooks/useAI');

describe('AIChat Complex Commands', () => {
  const mockOnToggle = vi.fn();
  const mockSendMessage = vi.fn();
  const mockAddChatMessage = vi.fn();
  const mockClearChatMessages = vi.fn();
  const mockSetChatProcessing = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useCanvas hook
    vi.mocked(useCanvas).mockReturnValue({
      chatMessages: [],
      isChatProcessing: false,
      clearChatMessages: mockClearChatMessages,
      addChatMessage: mockAddChatMessage,
      setChatProcessing: mockSetChatProcessing
    } as any);

    // Mock useAI hook
    vi.mocked(useAI).mockReturnValue({
      sendMessage: mockSendMessage
    });
  });

  describe('Complex Command Detection', () => {
    it('should detect login form commands', async () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: 'create login form' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('create login form');
    });

    it('should detect 3x3 grid commands', async () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: 'make 3x3 grid' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('make 3x3 grid');
    });

    it('should detect 4x4 grid commands', async () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: 'create 4x4 grid' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('create 4x4 grid');
    });

    it('should detect 2x5 grid commands', async () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: 'make 2x5 grid' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('make 2x5 grid');
    });
  });

  describe('Progress Indicators', () => {
    it('should show processing state during complex commands', () => {
      // Mock processing state
      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: [],
        isChatProcessing: true,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByPlaceholderText('AI is thinking...')).toBeInTheDocument();
      expect(screen.getByText('⚡ AI is thinking...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    });

    it('should show progress messages for complex commands', () => {
      const progressMessages = [
        {
          id: 'progress-1',
          type: 'ai',
          content: '⚡ Step 1/6: Creating title...',
          timestamp: new Date(),
          status: 'processing'
        },
        {
          id: 'progress-2',
          type: 'ai',
          content: '⚡ Step 2/6: Adding username label...',
          timestamp: new Date(),
          status: 'processing'
        }
      ];

      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: progressMessages,
        isChatProcessing: true,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByText('⚡ Step 1/6: Creating title...')).toBeInTheDocument();
      expect(screen.getByText('⚡ Step 2/6: Adding username label...')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display complex command results', () => {
      const resultMessages = [
        {
          id: 'user-1',
          type: 'user',
          content: 'create login form',
          timestamp: new Date(),
          status: 'success'
        },
        {
          id: 'result-1',
          type: 'ai',
          content: '✅ Login form created with 6 elements',
          timestamp: new Date(),
          status: 'success'
        }
      ];

      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: resultMessages,
        isChatProcessing: false,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByText('create login form')).toBeInTheDocument();
      expect(screen.getByText('✅ Login form created with 6 elements')).toBeInTheDocument();
    });

    it('should display error messages for failed complex commands', () => {
      const errorMessages = [
        {
          id: 'user-1',
          type: 'user',
          content: 'create login form',
          timestamp: new Date(),
          status: 'success'
        },
        {
          id: 'result-1',
          type: 'ai',
          content: '❌ Failed to create login form: Network error',
          timestamp: new Date(),
          status: 'error'
        }
      ];

      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: errorMessages,
        isChatProcessing: false,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByText('❌ Failed to create login form: Network error')).toBeInTheDocument();
    });

    it('should display partial success messages', () => {
      const partialSuccessMessages = [
        {
          id: 'user-1',
          type: 'user',
          content: 'make 3x3 grid',
          timestamp: new Date(),
          status: 'success'
        },
        {
          id: 'result-1',
          type: 'ai',
          content: '⚠️ Grid partially created: 7/9 shapes (2 errors)',
          timestamp: new Date(),
          status: 'error'
        }
      ];

      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: partialSuccessMessages,
        isChatProcessing: false,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByText('⚠️ Grid partially created: 7/9 shapes (2 errors)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle Enter key for complex commands', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      
      fireEvent.change(input, { target: { value: 'create login form' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockSendMessage).toHaveBeenCalledWith('create login form');
    });

    it('should not send empty messages', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(sendButton).toBeDisabled();
    });

    it('should not send messages while processing', () => {
      vi.mocked(useCanvas).mockReturnValue({
        chatMessages: [],
        isChatProcessing: true,
        clearChatMessages: mockClearChatMessages,
        addChatMessage: mockAddChatMessage,
        setChatProcessing: mockSetChatProcessing
      } as any);

      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('AI is thinking...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });
      
      fireEvent.change(input, { target: { value: 'create login form' } });
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByLabelText('AI command input')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const input = screen.getByPlaceholderText('Type your command...');
      
      // Test Escape key
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should show clear messages button', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByLabelText('Clear messages')).toBeInTheDocument();
    });

    it('should clear messages when clear button is clicked', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const clearButton = screen.getByLabelText('Clear messages');
      fireEvent.click(clearButton);
      
      expect(mockClearChatMessages).toHaveBeenCalled();
    });
  });

  describe('Chat State Management', () => {
    it('should show closed state when not open', () => {
      render(<AIChat isOpen={false} onToggle={mockOnToggle} />);
      
      expect(screen.getByLabelText('Open AI Chat')).toBeInTheDocument();
      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    });

    it('should show open state when open', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByLabelText('Open AI Chat')).not.toBeInTheDocument();
    });

    it('should toggle chat when toggle button is clicked', () => {
      render(<AIChat isOpen={false} onToggle={mockOnToggle} />);
      
      const toggleButton = screen.getByLabelText('Open AI Chat');
      fireEvent.click(toggleButton);
      
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should close chat when close button is clicked', () => {
      render(<AIChat isOpen={true} onToggle={mockOnToggle} />);
      
      const closeButton = screen.getByLabelText('Close AI Chat');
      fireEvent.click(closeButton);
      
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });
});
