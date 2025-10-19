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
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'processing'
      };

      // Add user message to chat
      addChatMessage(userMessage);

      // Check if this is a complex command
      const lowerContent = content.toLowerCase();
      const isComplexCommand = lowerContent.includes('create login form') || 
                               lowerContent.includes('login form') ||
                               (lowerContent.includes('make') && lowerContent.includes('grid')) ||
                               lowerContent.includes('3x3 grid') ||
                               lowerContent.includes('4x4 grid') ||
                               lowerContent.includes('2x5 grid') ||
                               lowerContent.includes('create') && lowerContent.includes('grid');

      if (isComplexCommand) {
        // Handle complex command with progress indicators
        const complexResult = await aiService.executeComplexCommand(content.trim(), user.uid);
        
        // Create progress messages for each step
        if (complexResult.totalSteps > 1) {
          for (let i = 1; i <= complexResult.totalSteps; i++) {
            const progressMessage: ChatMessage = {
              id: `progress_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'ai',
              content: `⚡ Step ${i}/${complexResult.totalSteps}: ${getStepDescription(content, i)}`,
              timestamp: new Date(),
              status: 'processing'
            };
            addChatMessage(progressMessage);
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Update user message status
        const updatedUserMessage: ChatMessage = {
          ...userMessage,
          status: 'success'
        };
        addChatMessage(updatedUserMessage);

        // Add final result message
        const resultMessage: ChatMessage = {
          id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ai',
          content: complexResult.message,
          timestamp: new Date(),
          status: complexResult.success ? 'success' : 'error'
        };
        addChatMessage(resultMessage);

        return resultMessage;
      } else {
        // Handle regular command
        const aiResponse = await aiService.sendMessage(content.trim(), user.uid);

        // Update user message status and add AI response
        const updatedUserMessage: ChatMessage = {
          ...userMessage,
          status: 'success'
        };

        addChatMessage(updatedUserMessage);
        addChatMessage(aiResponse);

        return aiResponse;
      }

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

  // Helper function to get step descriptions for complex commands
  const getStepDescription = (command: string, step: number): string => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('login form')) {
      const steps = [
        'Creating title...',
        'Adding username label...',
        'Creating username input...',
        'Adding password label...',
        'Creating password input...',
        'Adding login button...'
      ];
      return steps[step - 1] || `Processing step ${step}...`;
    }
    
    if (lowerCommand.includes('grid')) {
      return `Creating shape ${step}...`;
    }
    
    return `Processing step ${step}...`;
  };

  return {
    sendMessage
  };
}
