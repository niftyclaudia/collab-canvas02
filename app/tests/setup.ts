// Test setup for Firebase Emulators and React Testing Library
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, set, get, onDisconnect, serverTimestamp } from 'firebase/database'

// Test environment
let testEnv: RulesTestEnvironment

// Firebase config for testing
const PROJECT_ID = 'demo-collab-canvas'

beforeAll(async () => {
  // Initialize test environment with emulators
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Users collection - users can only write their own document
            match /users/{userId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && request.auth.uid == userId;
            }
            
            // Main canvas shapes - individual documents
            match /canvases/main/shapes/{shapeId} {
              allow read: if request.auth != null;
              allow create: if request.auth != null && 
                               request.resource.data.createdBy == request.auth.uid;
              allow update: if request.auth != null;
              allow delete: if request.auth != null;
            }
          }
        }
      `,
      host: 'localhost',
      port: 8080,
    },
    database: {
      rules: `{
        "rules": {
          "sessions": {
            "main": {
              "users": {
                "$userId": {
                  ".read": "auth != null",
                  ".write": "auth != null && auth.uid == $userId"
                }
              }
            }
          }
        }
      }`,
      host: 'localhost',
      port: 9000,
    },
    auth: {
      host: 'localhost',
      port: 9099,
    },
  })
})

afterAll(async () => {
  // Clean up
  if (testEnv) {
    await testEnv.cleanup()
  }
})

beforeEach(async () => {
  // Clear all data before each test
  if (testEnv) {
    await testEnv.clearFirestore()
    await testEnv.clearDatabase()
  }
  
  // Small delay to ensure cleanup is complete
  await new Promise(resolve => setTimeout(resolve, 100))
})

afterEach(async () => {
  // Additional cleanup after each test if needed
})

// Helper functions for tests
const CURSOR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']

const getRandomCursorColor = (): string => {
  const randomIndex = Math.floor(Math.random() * CURSOR_COLORS.length)
  return CURSOR_COLORS[randomIndex]
}

export const createTestUser = async (uid: string, email: string, username: string) => {
  const context = testEnv.authenticatedContext(uid, { email })
  const firestore = context.firestore()
  const userDoc = doc(firestore, 'users', uid)
  
  const userData = {
    uid,
    email,
    username,
    cursorColor: getRandomCursorColor(),
    createdAt: new Date().toISOString(),
  }
  
  await setDoc(userDoc, userData)
  
  // Small delay to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return context
}

export const createTestShape = async (context: any, shapeData: any) => {
  const firestore = context.firestore()
  const shapesCollection = collection(firestore, 'canvases', 'main', 'shapes')
  
  const shapeDoc = await addDoc(shapesCollection, {
    ...shapeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  
  // Small delay to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return shapeDoc.id
}

export const updateTestCursor = async (context: any, userId: string, x: number, y: number) => {
  const database = context.database()
  const cursorRef = ref(database, `sessions/main/users/${userId}/cursor`)
  
  await set(cursorRef, {
    x,
    y,
    username: 'Test User',
    color: '#3b82f6',
    timestamp: Date.now(),
  })
  
  // Small delay to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 50))
}

export const setTestPresence = async (context: any, userId: string, username: string) => {
  const database = context.database()
  const presenceRef = ref(database, `sessions/main/users/${userId}/presence`)
  
  await set(presenceRef, {
    username,
    online: true,
    lastSeen: Date.now(),
  })
  
  // Set up disconnect handler
  onDisconnect(presenceRef).set({
    username,
    online: false,
    lastSeen: Date.now(),
  })
  
  // Small delay to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 50))
}

// Utility function to wait for async operations
export const waitForAsync = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Utility function to retry operations that might fail due to timing
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await waitForAsync(delayMs)
      }
    }
  }
  
  throw lastError
}

// Export test environment and assertion helpers
export { testEnv, assertFails, assertSucceeds, PROJECT_ID }

// Mock Konva for testing (since it requires canvas)
export const mockKonva = () => {
  global.HTMLCanvasElement.prototype.getContext = vi.fn()
  global.HTMLCanvasElement.prototype.toDataURL = vi.fn()
}
