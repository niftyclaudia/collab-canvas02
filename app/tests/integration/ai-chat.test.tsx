import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { CanvasProvider } from '../../src/contexts/CanvasContext';
import { ToastProvider } from '../../src/contexts/ToastContext';
import AIChat from '../../src/components/AI/AIChat';

// Mock Firebase
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockAuth = {
  currentUser: mockUser,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
};

vi.mock('../../src/firebase', () => ({
  auth: mockAuth
}));

// Mock AI Service
const mockAIService = {
  sendMessage: vi.fn()
};

vi.mock('../../src/services/aiService', () => ({
  AIService: vi.fn(() => mockAIService)
}));

describe('AI Chat Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render chat interface when open', () => {
    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your command/i)).toBeInTheDocument();
  });

  it('should show toggle button when closed', () => {
    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={false}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    expect(screen.getByText('🤖 AI Chat')).toBeInTheDocument();
  });

  it('should handle message sending', async () => {
    const mockResponse = {
      id: 'ai-123',
      type: 'ai' as const,
      content: 'Created a blue rectangle',
      timestamp: new Date(),
      status: 'success' as const
    };

    mockAIService.sendMessage.mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'create a blue rectangle' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockAIService.sendMessage).toHaveBeenCalledWith('create a blue rectangle', 'test-user-123');
    });
  });

  it('should show processing state during AI response', async () => {
    mockAIService.sendMessage.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        id: 'ai-123',
        type: 'ai' as const,
        content: 'Processing...',
        timestamp: new Date(),
        status: 'success' as const
      }), 100))
    );

    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    fireEvent.change(input, { target: { value: 'create a blue rectangle' } });
    fireEvent.submit(input);

    expect(screen.getByText('⚡ AI is thinking...')).toBeInTheDocument();
  });

  it('should handle keyboard input (Enter key)', async () => {
    const mockResponse = {
      id: 'ai-123',
      type: 'ai' as const,
      content: 'Created a blue rectangle',
      timestamp: new Date(),
      status: 'success' as const
    };

    mockAIService.sendMessage.mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    fireEvent.change(input, { target: { value: 'create a blue rectangle' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockAIService.sendMessage).toHaveBeenCalledWith('create a blue rectangle', 'test-user-123');
    });
  });

  it('should clear messages when clear button is clicked', () => {
    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    const clearButton = screen.getByRole('button', { name: /clear messages/i });
    fireEvent.click(clearButton);

    // Messages should be cleared (empty state should show)
    expect(screen.getByText('Start a conversation with the AI assistant!')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    render(
      <AuthProvider>
        <CanvasProvider>
          <ToastProvider>
            <AIChat 
              isOpen={true}
              onToggle={vi.fn()}
            />
          </ToastProvider>
        </CanvasProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Start a conversation with the AI assistant!')).toBeInTheDocument();
    expect(screen.getByText(/try: "create a blue rectangle"/i)).toBeInTheDocument();
  });
});
