import React, { useEffect, useRef, useMemo } from 'react';
import type { ChatMessage } from '../../types/chat';
import MessageBubble from './MessageBubble';

interface MessageHistoryProps {
  messages: ChatMessage[];
}

const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize message bubbles to prevent unnecessary re-renders
  const messageBubbles = useMemo(() => {
    return messages.map((message) => (
      <MessageBubble key={message.id} message={message} />
    ));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive (with smooth scrolling)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="message-history" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>Start a conversation with the AI assistant!</p>
          <p className="ai-suggestions">
            Try: "Create a blue rectangle" or "Make a red circle"
          </p>
        </div>
      ) : (
        messageBubbles
      )}
    </div>
  );
};

export default MessageHistory;
