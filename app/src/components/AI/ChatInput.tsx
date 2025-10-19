import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isProcessing) return;

    onSendMessage(inputValue);
    setInputValue('');
  }, [inputValue, onSendMessage, isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Stop propagation to prevent canvas from handling these events
    e.stopPropagation();
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    // Stop propagation to prevent canvas from handling these events
    e.stopPropagation();
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={isProcessing ? "AI is thinking..." : "Type your command..."}
          disabled={isProcessing}
          className="chat-input-field"
          aria-label="AI command input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isProcessing}
          className="chat-send-button"
          aria-label="Send message"
        >
          {isProcessing ? '⚡' : '➤'}
        </button>
      </div>
      
      {isProcessing && (
        <div className="processing-indicator">
          <span className="processing-text">⚡ AI is thinking...</span>
        </div>
      )}
    </form>
  );
};

export default ChatInput;
