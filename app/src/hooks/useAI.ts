import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useCanvas } from './useCanvas';
import { AIService } from '../services/aiService';
import type { ChatMessage } from '../types/chat';

export function useAI() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addChatMessage, setChatProcessing } = useCanvas();

  const sendMessage = useCallback(async (content: string): Promise<ChatMessage | null> => {
    if (!user || !content.trim()) return null;

    setChatProcessing(true);

    try {
      // Create AI service with toast callbacks
      const aiService = new AIService({
        onError: (message) => showToast(message, 'error'),
        onSuccess: (message) => showToast(message, 'success')
      });

      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'processing'
      };

      // Add user message to chat
      addChatMessage(userMessage);

      // Send to AI service
      const aiResponse = await aiService.sendMessage(content.trim(), user.uid);

      // Update user message status and add AI response
      const updatedUserMessage: ChatMessage = {
        ...userMessage,
        status: 'success'
      };

      addChatMessage(updatedUserMessage);
      addChatMessage(aiResponse);

      return aiResponse;

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: "⚠️ AI service error. Please try again.",
        timestamp: new Date(),
        status: 'error'
      };

      addChatMessage(errorMessage);
      showToast('Failed to send message', 'error');

      return errorMessage;
    } finally {
      setChatProcessing(false);
    }
  }, [user, showToast, addChatMessage, setChatProcessing]);

  return {
    sendMessage
  };
}
