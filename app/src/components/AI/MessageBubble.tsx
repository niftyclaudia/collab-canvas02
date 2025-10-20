import React from 'react';
import type { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'processing':
        return '⚡';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return null;
    }
  };

  const isUser = message.type === 'user';
  const statusIcon = getStatusIcon(message.status);

  return (
    <div className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">
        <div className="message-text">
          {message.content}
        </div>
        {statusIcon && (
          <div className="message-status">
            {statusIcon}
          </div>
        )}
      </div>
      <div className="message-meta">
        <span className="message-time">
          {formatTime(message.timestamp)}
        </span>
        {isUser && (
          <span className="message-sender">You</span>
        )}
        {!isUser && (
          <span className="message-sender">AI Assistant</span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
