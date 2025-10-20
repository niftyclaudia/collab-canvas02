import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIChat from '../../../src/components/AI/AIChat';
import MessageHistory from '../../../src/components/AI/MessageHistory';
import ChatInput from '../../../src/components/AI/ChatInput';
import MessageBubble from '../../../src/components/AI/MessageBubble';
import { ChatMessage } from '../../../src/types/chat';

// Mock the hooks
const mockUseCanvas = {
  chatMessages: [],
  isChatProcessing: false,
  clearChatMessages: vi.fn()
};

const mockUseAI = {
  sendMessage: vi.fn()
};

vi.mock('../../../src/hooks/useCanvas', () => ({
  useCanvas: () => mockUseCanvas
}));

vi.mock('../../../src/hooks/useAI', () => ({
  useAI: () => mockUseAI
}));

describe('AIChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle button when closed', () => {
    render(
      <AIChat 
        isOpen={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('🤖 AI Chat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
  });

  it('should render chat interface when open', () => {
    render(
      <AIChat 
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close ai chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear messages/i })).toBeInTheDocument();
  });

  it('should call onToggle when toggle button is clicked', () => {
    const mockOnToggle = vi.fn();
    
    render(
      <AIChat 
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /open ai chat/i }));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should call clearChatMessages when clear button is clicked', () => {
    render(
      <AIChat 
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear messages/i }));
    expect(mockUseCanvas.clearChatMessages).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to MessageHistory', () => {
    const testMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
        status: 'success'
      }
    ];

    mockUseCanvas.chatMessages = testMessages;

    render(
      <AIChat 
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    // MessageHistory component should receive the messages
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should pass correct props to ChatInput', () => {
    mockUseCanvas.isChatProcessing = true;

    render(
      <AIChat 
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/ai is thinking/i)).toBeInTheDocument();
  });
});

describe('MessageHistory Component', () => {
  it('should render empty state when no messages', () => {
    render(<MessageHistory messages={[]} />);

    expect(screen.getByText('Start a conversation with the AI assistant!')).toBeInTheDocument();
    expect(screen.getByText(/try: "create a blue rectangle"/i)).toBeInTheDocument();
  });

  it('should render messages when provided', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
        status: 'success'
      },
      {
        id: '2',
        type: 'ai',
        content: 'Hi there!',
        timestamp: new Date(),
        status: 'success'
      }
    ];

    render(<MessageHistory messages={messages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});

describe('ChatInput Component', () => {
  it('should render input field and send button', () => {
    render(
      <ChatInput 
        onSendMessage={vi.fn()}
        isProcessing={false}
      />
    );

    expect(screen.getByPlaceholderText(/type your command/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should show processing state when isProcessing is true', () => {
    render(
      <ChatInput 
        onSendMessage={vi.fn()}
        isProcessing={true}
      />
    );

    expect(screen.getByPlaceholderText(/ai is thinking/i)).toBeInTheDocument();
    expect(screen.getByText('⚡ AI is thinking...')).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted', () => {
    const mockOnSendMessage = vi.fn();
    
    render(
      <ChatInput 
        onSendMessage={mockOnSendMessage}
        isProcessing={false}
      />
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.submit(input);

    expect(mockOnSendMessage).toHaveBeenCalledWith('test message');
  });

  it('should call onSendMessage when Enter key is pressed', () => {
    const mockOnSendMessage = vi.fn();
    
    render(
      <ChatInput 
        onSendMessage={mockOnSendMessage}
        isProcessing={false}
      />
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSendMessage).toHaveBeenCalledWith('test message');
  });

  it('should not send empty messages', () => {
    const mockOnSendMessage = vi.fn();
    
    render(
      <ChatInput 
        onSendMessage={mockOnSendMessage}
        isProcessing={false}
      />
    );

    const input = screen.getByPlaceholderText(/type your command/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should disable input when processing', () => {
    render(
      <ChatInput 
        onSendMessage={vi.fn()}
        isProcessing={true}
      />
    );

    const input = screen.getByPlaceholderText(/ai is thinking/i);
    expect(input).toBeDisabled();
  });
});

describe('MessageBubble Component', () => {
  it('should render user message correctly', () => {
    const message: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      status: 'success'
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should render AI message correctly', () => {
    const message: ChatMessage = {
      id: '2',
      type: 'ai',
      content: 'Hi there!',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      status: 'success'
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should show processing status', () => {
    const message: ChatMessage = {
      id: '3',
      type: 'ai',
      content: 'Processing...',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      status: 'processing'
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('should show error status', () => {
    const message: ChatMessage = {
      id: '4',
      type: 'ai',
      content: 'Error occurred',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      status: 'error'
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should format time correctly', () => {
    const message: ChatMessage = {
      id: '5',
      type: 'user',
      content: 'Test',
      timestamp: new Date('2023-01-01T12:30:00Z'),
      status: 'success'
    };

    render(<MessageBubble message={message} />);

    // Time format may vary by locale, so we just check it exists
    expect(screen.getByText(/12:30/)).toBeInTheDocument();
  });
});
