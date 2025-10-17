import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import AuthComponent from './components/Auth/AuthProvider';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import ToastContainer from './components/UI/ToastContainer';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { AIService } from './services/aiService';
import { auth } from './firebase';
import './App.css'


// Make AI Service test function available globally for console testing
(window as any).testAIService = async function() {
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
};

// Simple test function that doesn't require API key
(window as any).testAISetup = function() {
  console.log('🧪 Testing AI Service Setup...');
  
  try {
    // Test if AIService can be instantiated
    new AIService();
    console.log('✅ AIService instantiated successfully');
    
    // Test if OpenAI API key is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-...your-key-here') {
      console.warn('⚠️ OpenAI API key not set. Set VITE_OPENAI_API_KEY in your .env file to test AI commands');
      console.log('📝 To set up: Add VITE_OPENAI_API_KEY=sk-your-key-here to your .env file');
    } else {
      console.log('✅ OpenAI API key is configured');
    }
    
    console.log('🎯 Ready to test! Run testAIService() in console to test AI commands');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error);
  }
};

// Debug function to check app state
(window as any).debugApp = function() {
  console.log('🔍 App Debug Info:');
  console.log('- Current URL:', window.location.href);
  console.log('- Firebase config loaded:', !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.log('- OpenAI config loaded:', !!import.meta.env.VITE_OPENAI_API_KEY);
  console.log('- App element exists:', !!document.getElementById('root'));
  console.log('- React app mounted:', !!document.querySelector('[data-reactroot]'));
};

// Get current user ID
(window as any).getCurrentUserId = function() {
  const user = auth.currentUser;
  if (user) {
    console.log('👤 Current User ID:', user.uid);
    console.log('👤 Current User Email:', user.email);
    return user.uid;
  } else {
    console.log('❌ No user logged in');
    return null;
  }
};

// Global toast context access for testing
let globalToastContext: any = null;
(window as any).setToastContext = function(context: any) {
  globalToastContext = context;
};
(window as any).getToastContext = function() {
  return globalToastContext;
};

// Simple AI test with current user
(window as any).testAI = async function(command = "create a blue rectangle at 500, 500") {
  console.log('🤖 Testing AI with command:', command);
  
  try {
    // Get toast context for error notifications
    const { showError } = (window as any).getToastContext?.() || { showError: () => {} };
    
    const ai = new AIService({
      onError: (message) => {
        console.error('🚨 AI Boundary Error:', message);
        showError(message);
      }
    });
    const userId = (window as any).getCurrentUserId();
    
    if (!userId) {
      console.error('❌ No user logged in. Please sign in first or use Firebase emulators.');
      return;
    }
    
    console.log('🧪 Executing command...');
    const result = await ai.executeCommand(command, userId);
    console.log('✅ Result:', result);
    
    // Debug: Check if tool calls were made
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('🔧 Tool calls made:', result.toolCalls);
    } else {
      console.log('⚠️ No tool calls made - AI may have rejected the command');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ AI test failed:', error);
    return error;
  }
};

// Firebase auth access
(window as any).firebaseAuth = function() {
  console.log('🔥 Firebase Auth Info:');
  console.log('- Current User:', auth.currentUser);
  console.log('- Auth State:', auth.currentUser ? 'Logged In' : 'Not Logged In');
  if (auth.currentUser) {
    console.log('- User ID:', auth.currentUser.uid);
    console.log('- User Email:', auth.currentUser.email);
  }
  return auth;
};

// Comprehensive AI testing function
(window as any).testAICommands = async function() {
  console.log('🧪 Starting Comprehensive AI Command Tests...');
  console.log('=====================================');
  
  // Get toast context for error notifications
  const { showError } = (window as any).getToastContext?.() || { showError: () => {} };
  
  const ai = new AIService({
    onError: (message) => {
      console.error('🚨 AI Boundary Error:', message);
      showError(message);
    }
  });
  const userId = (window as any).getCurrentUserId();
  
  if (!userId) {
    console.error('❌ No user logged in. Please sign in first.');
    return;
  }
  
  const testCommands = [
    {
      name: 'Out of Bounds Rectangle',
      command: 'create a blue rectangle at 6000, 6000',
      expected: 'Should trigger boundary error toast'
    },
    {
      name: 'Centered Rectangle',
      command: 'create a red rectangle in the center',
      expected: 'Red rectangle centered on canvas'
    },
    {
      name: 'Circle at Top',
      command: 'add a green circle at the top',
      expected: 'Green circle at top center'
    },
    {
      name: 'Triangle Bottom-Left',
      command: 'make a yellow triangle in the bottom-left',
      expected: 'Yellow triangle in bottom-left area'
    },
    {
      name: 'Custom Rectangle',
      command: 'create a purple rectangle with width 300 and height 200 at 1000, 800',
      expected: 'Purple rectangle 300x200 at (1000, 800)'
    },
    {
      name: 'Large Circle',
      command: 'add a large orange circle with radius 100 in the center',
      expected: 'Large orange circle (radius 100) centered'
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < testCommands.length; i++) {
    const test = testCommands[i];
    console.log(`\n🧪 Test ${i + 1}: ${test.name}`);
    console.log(`📝 Command: "${test.command}"`);
    console.log(`🎯 Expected: ${test.expected}`);
    
    try {
      const startTime = Date.now();
      const result = await ai.executeCommand(test.command, userId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (result.success) {
        console.log(`✅ SUCCESS (${duration}ms): ${result.message}`);
        successCount++;
      } else {
        console.log(`❌ FAILED: ${result.message}`);
        failCount++;
      }
      
      // Add a small delay between commands
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n=====================================');
  console.log(`📊 Test Results: ${successCount} passed, ${failCount} failed`);
  console.log(`🎯 Success Rate: ${Math.round((successCount / testCommands.length) * 100)}%`);
  
  if (successCount === testCommands.length) {
    console.log('🎉 All tests passed! AI Service is working perfectly!');
  } else if (successCount > 0) {
    console.log('⚠️ Some tests passed. Check failed tests above.');
  } else {
    console.log('❌ All tests failed. Check your setup.');
  }
  
  return { successCount, failCount, total: testCommands.length };
};

// Quick single command tester
(window as any).quickTest = async function(command: string) {
  console.log(`🚀 Quick Test: "${command}"`);
  const result = await (window as any).testAI(command);
  console.log('Result:', result);
  return result;
};

// Test boundary error toast notifications
(window as any).testBoundaryError = async function() {
  console.log('🧪 Testing boundary error toast notifications...');
  
  // Test commands that should trigger boundary errors
  const boundaryTestCommands = [
    'create a blue rectangle at 6000, 6000', // Way out of bounds
    'add a red circle at 10000, 10000', // Way out of bounds
    'make a green triangle at -100, -100' // Negative coordinates
  ];
  
  for (const command of boundaryTestCommands) {
    console.log(`\n🧪 Testing boundary error: "${command}"`);
    try {
      const result = await (window as any).testAI(command);
      console.log('Result:', result);
    } catch (error) {
      console.log('Error:', error);
    }
    
    // Wait a bit between commands to see the toasts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Boundary error tests completed. Check for toast notifications in the UI!');
};

// Debug bounds validation
(window as any).debugBounds = function() {
  console.log('🔍 Debugging Canvas Bounds...');
  console.log('Canvas size: 5000×5000');
  
  // Test the exact positions from AI prompts
  const testPositions = [
    { name: 'Circle at top', x: 2500, y: 100, radius: 75 },
    { name: 'Circle center', x: 2500, y: 2500, radius: 100 },
    { name: 'Triangle bottom-left', x: 100, y: 4670, width: 150, height: 130 }
  ];
  
  testPositions.forEach(test => {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`Position: x=${test.x}, y=${test.y}`);
    
    if (test.radius) {
      // Circle bounds check
      const xMin = test.x - test.radius;
      const yMin = test.y - test.radius;
      const xMax = test.x + test.radius;
      const yMax = test.y + test.radius;
      
      console.log(`Circle bounds: xMin=${xMin}, yMin=${yMin}, xMax=${xMax}, yMax=${yMax}`);
      console.log(`Valid: ${xMin >= 0 && yMin >= 0 && xMax <= 5000 && yMax <= 5000}`);
    }
    
    if (test.width && test.height) {
      // Rectangle/triangle bounds check
      const xMax = test.x + test.width;
      const yMax = test.y + test.height;
      
      console.log(`Shape bounds: xMax=${xMax}, yMax=${yMax}`);
      console.log(`Valid: ${test.x >= 0 && test.y >= 0 && xMax <= 5000 && yMax <= 5000}`);
    }
  });
};

// Test what AI actually generates
(window as any).testAIPositions = async function() {
  console.log('🤖 Testing what AI actually generates...');
  
  // Get toast context for error notifications
  const { showError } = (window as any).getToastContext?.() || { showError: () => {} };
  
  const ai = new AIService({
    onError: (message) => {
      console.error('🚨 AI Boundary Error:', message);
      showError(message);
    }
  });
  const userId = (window as any).getCurrentUserId();
  
  const testCommands = [
    'add a green circle at the top',
    'make a yellow triangle in the bottom-left',
    'add a large orange circle with radius 100 in the center'
  ];
  
  for (const command of testCommands) {
    console.log(`\n🧪 Testing: "${command}"`);
    
    try {
      // This will show us what the AI is trying to do
      const result = await ai.executeCommand(command, userId);
      console.log('AI Result:', result);
      
      // If there are tool calls, show the parameters
      if (result.toolCalls && result.toolCalls.length > 0) {
        result.toolCalls.forEach((toolCall: any, index: number) => {
          console.log(`Tool ${index + 1}: ${toolCall.tool}`);
          if (toolCall.result) {
            console.log('Tool result:', toolCall.result);
          }
          if (toolCall.error) {
            console.log('Tool error:', toolCall.error);
          }
        });
      }
      
    } catch (error: any) {
      console.log('Error:', error.message);
    }
  }
};

// Main app component with route guard logic
function AppContent() {
  const { user, loading } = useAuth();
  const toastContext = useToast();
  
  // Set global toast context for testing functions
  React.useEffect(() => {
    (window as any).setToastContext(toastContext);
  }, [toastContext]);

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading CollabCanvas...</p>
      </div>
    );
  }

  // Route guard: show auth screens if not authenticated
  if (!user) {
    return <AuthComponent />;
  }

  // Show main app if authenticated
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <AppShell>
          <Canvas />
        </AppShell>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
