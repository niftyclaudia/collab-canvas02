import React, { useCallback } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useAI } from '../../hooks/useAI';
import MessageHistory from './MessageHistory';
import ChatInput from './ChatInput';

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ 
  isOpen, 
  onToggle
}) => {
  const { 
    chatMessages, 
    isChatProcessing, 
    clearChatMessages,
    selectedShapes
  } = useCanvas();
  const { sendMessage } = useAI();

  const handleSendMessage = useCallback(async (content: string) => {
    await sendMessage(content, selectedShapes);
  }, [sendMessage, selectedShapes]);

  const handleClearMessages = useCallback(() => {
    clearChatMessages();
  }, [clearChatMessages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onToggle();
    }
  }, [isOpen, onToggle]);

  if (!isOpen) {
    return (
      <div className="ai-chat-closed">
        <button 
          onClick={onToggle}
          className="ai-chat-toggle-btn"
          aria-label="Open AI Chat"
        >
          ✨
        </button>
      </div>
    );
  }

  return (
    <div className="ai-chat-drawer" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="ai-chat-header">
        <h3>AI Assistant</h3>
        <div className="ai-chat-controls">
          <button 
            onClick={handleClearMessages}
            className="ai-chat-clear-btn"
            aria-label="Clear messages"
          >
            🗑️
          </button>
          <button 
            onClick={onToggle}
            className="ai-chat-close-btn"
            aria-label="Close AI Chat"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="ai-chat-content">
        <MessageHistory messages={chatMessages} />
        <ChatInput 
          onSendMessage={handleSendMessage}
          isProcessing={isChatProcessing}
        />
      </div>
    </div>
  );
};

export default AIChat;
