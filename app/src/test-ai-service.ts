// Test script for AI Service
// Run this in the browser console after the app loads

import { AIService } from './services/aiService';

// Test function to run AI commands
async function testAIService() {
  console.log('🤖 Starting AI Service Tests...');
  
  // Check if OpenAI API key is set
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-...your-key-here') {
    console.error('❌ OpenAI API key not set! Please set VITE_OPENAI_API_KEY in your .env file');
    return;
  }
  
  console.log('✅ OpenAI API key found');
  
  try {
    const ai = new AIService();
    const userId = "test_user_123";
    
    console.log('🧪 Test 1: Basic rectangle creation');
    const result1 = await ai.executeCommand("create a blue rectangle at 500, 500", userId);
    console.log('Result:', result1);
    
    console.log('🧪 Test 2: Centered rectangle');
    const result2 = await ai.executeCommand("create a red rectangle in the center", userId);
    console.log('Result:', result2);
    
    console.log('🧪 Test 3: Circle creation');
    const result3 = await ai.executeCommand("add a green circle at the top", userId);
    console.log('Result:', result3);
    
    console.log('🧪 Test 4: Triangle creation');
    const result4 = await ai.executeCommand("make a yellow triangle in the bottom-left", userId);
    console.log('Result:', result4);
    
    console.log('🧪 Test 5: Text creation');
    const result5 = await ai.executeCommand("add text that says Hello World", userId);
    console.log('Result:', result5);
    
    console.log('🧪 Test 6: Text with formatting');
    const result6 = await ai.executeCommand("create bold italic text saying TITLE at the center", userId);
    console.log('Result:', result6);
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make it available globally for console testing
(window as any).testAIService = testAIService;
