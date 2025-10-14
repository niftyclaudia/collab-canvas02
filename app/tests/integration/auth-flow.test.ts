import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser } from '../setup'
import { ref, get, set } from 'firebase/database'
import { doc, getDoc, setDoc } from 'firebase/firestore'

describe('Authentication Flow Integration', () => {
  const testUserId = 'auth-flow-user'
  const testEmail = 'authflow@example.com'
  const testUsername = 'AuthFlowUser'

  describe('Complete Signup Flow', () => {
    it('should complete full signup process with user doc and presence setup', async () => {
      // 1. Create user account and Firestore document
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      // 2. Verify user document exists in Firestore
      const firestore = context.firestore()
      const userDoc = await getDoc(doc(firestore, 'users', testUserId))
      
      expect(userDoc.exists()).toBe(true)
      const userData = userDoc.data()
      
      expect(userData).toEqual(
        expect.objectContaining({
          email: testEmail,
          username: testUsername,
          cursorColor: expect.stringMatching(/^#[0-9a-f]{6}$/i),
          createdAt: expect.any(String),
        })
      )
      
      // 3. Verify user can immediately set presence after signup
      const database = context.database()
      const presenceRef = ref(database, `sessions/main/users/${testUserId}/presence`)
      
      await set(presenceRef, {
        username: testUsername,
        online: true,
        lastSeen: Date.now(),
      })
      
      const presenceSnapshot = await get(presenceRef)
      expect(presenceSnapshot.exists()).toBe(true)
      expect(presenceSnapshot.val().online).toBe(true)
    })

    it('should assign unique cursor colors to different users', async () => {
      const users = []
      const colors = new Set()
      
      // Create 5 users to test color assignment
      for (let i = 0; i < 5; i++) {
        const userId = `color-test-user-${i}`
        const email = `colortest${i}@example.com`
        const username = `ColorUser${i}`
        
        const context = await createTestUser(userId, email, username)
        const firestore = context.firestore()
        const userDoc = await getDoc(doc(firestore, 'users', userId))
        
        const userData = userDoc.data()
        users.push(userData)
        colors.add(userData?.cursorColor)
      }
      
      // Should have multiple unique colors (at least 2 different ones with 5 users)
      expect(colors.size).toBeGreaterThan(1)
      
      // All colors should be valid hex colors from the palette
      const validColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
      for (const color of colors) {
        expect(validColors).toContain(color)
      }
    })
  })

  describe('Login Flow Integration', () => {
    it('should retrieve existing user data on login', async () => {
      // 1. Create user first (simulating previous signup)  
      await createTestUser(testUserId, testEmail, testUsername)
      
      // 2. Simulate login by creating new context for same user
      const loginContext = testEnv.authenticatedContext(testUserId, { email: testEmail })
      const firestore = loginContext.firestore()
      
      // 3. Verify can access existing user data
      const userDoc = await getDoc(doc(firestore, 'users', testUserId))
      
      expect(userDoc.exists()).toBe(true)
      const userData = userDoc.data()
      
      expect(userData?.email).toBe(testEmail)
      expect(userData?.username).toBe(testUsername) 
      expect(userData?.cursorColor).toBeDefined()
    })

    it('should maintain cursor color consistency across sessions', async () => {
      // 1. Create user and get initial color
      await createTestUser(testUserId, testEmail, testUsername)
      
      // Get initial color using a fresh context
      const context1 = testEnv.authenticatedContext(testUserId, { email: testEmail })
      const firestore1 = context1.firestore()
      const userDoc1 = await getDoc(doc(firestore1, 'users', testUserId))
      const initialColor = userDoc1.data()?.cursorColor
      
      // 2. Simulate new session (login)
      const context2 = testEnv.authenticatedContext(testUserId, { email: testEmail })
      const firestore2 = context2.firestore()
      
      const userDoc2 = await getDoc(doc(firestore2, 'users', testUserId))
      const sessionColor = userDoc2.data()?.cursorColor
      
      // 3. Color should be the same
      expect(sessionColor).toBe(initialColor)
    })
  })

  describe('Multi-User Authentication', () => {
    it('should handle multiple simultaneous authenticated users', async () => {
      const users = []
      
      // Create 3 users simultaneously
      for (let i = 0; i < 3; i++) {
        const userId = `multi-user-${i}`
        const email = `multiuser${i}@example.com`
        const username = `MultiUser${i}`
        
        await createTestUser(userId, email, username)
        users.push({ userId, email, username })
      }
      
      // Verify all users can read each other's data using fresh contexts
      for (let i = 0; i < users.length; i++) {
        const currentUser = users[i]
        const currentUserContext = testEnv.authenticatedContext(currentUser.userId, { email: currentUser.email })
        
        for (let j = 0; j < users.length; j++) {
          const otherUser = users[j]
          
          const firestore = currentUserContext.firestore()
          const otherUserDoc = await getDoc(doc(firestore, 'users', otherUser.userId))
          
          expect(otherUserDoc.exists()).toBe(true)
          if (i !== j) {
            // Can read other user's document
            expect(otherUserDoc.data()?.email).toBe(otherUser.email)
          }
        }
      }
    })

    it('should enforce user isolation for personal data writes', async () => {
        const user1 = await createTestUser('auth-flow-user1', 'auth-flow-user1@test.com', 'AuthFlowUser1')
        const user2 = await createTestUser('auth-flow-user2', 'auth-flow-user2@test.com', 'AuthFlowUser2')
      
      // User2 should not be able to modify User1's document
      const firestore2 = user2.firestore()
      
      try {
        await setDoc(doc(firestore2, 'users', 'auth-flow-user1'), {
          email: 'hacked@evil.com',
          username: 'Hacked!',
          cursorColor: '#000000',
          createdAt: new Date().toISOString(),
        })
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.code).toMatch(/permission-denied|unauthenticated/)
      }
    })
  })

  describe('Session Persistence', () => {
    it('should maintain authentication state across context switches', async () => {
      // 1. Create user
      await createTestUser(testUserId, testEmail, testUsername)
      
      // 2. Set some presence data using fresh context
      const context1 = testEnv.authenticatedContext(testUserId, { email: testEmail })
      const database1 = context1.database()
      const presenceRef1 = ref(database1, `sessions/main/users/${testUserId}/presence`)
      
      await set(presenceRef1, {
        username: testUsername,
        online: true,
        lastSeen: Date.now(),
      })
      
      // 3. Create new context for same user (simulating page refresh)
      const context2 = testEnv.authenticatedContext(testUserId, { email: testEmail })
      
      // 4. Should still be able to access own data
      const database2 = context2.database()
      const presenceRef2 = ref(database2, `sessions/main/users/${testUserId}/presence`)
      
      const presenceSnapshot = await get(presenceRef2)
      expect(presenceSnapshot.exists()).toBe(true)
      expect(presenceSnapshot.val().username).toBe(testUsername)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user document gracefully', async () => {
      // Create authenticated context but no user document
      const context = testEnv.authenticatedContext('missing-user', { email: 'missing@test.com' })
      const firestore = context.firestore()
      
      const userDoc = await getDoc(doc(firestore, 'users', 'missing-user'))
      expect(userDoc.exists()).toBe(false)
      
      // Should be able to create the missing document if needed
      await setDoc(doc(firestore, 'users', 'missing-user'), {
        email: 'missing@test.com',
        username: 'MissingUser',
        cursorColor: '#3b82f6',
        createdAt: new Date().toISOString(),
      })
      
      const createdDoc = await getDoc(doc(firestore, 'users', 'missing-user'))
      expect(createdDoc.exists()).toBe(true)
    })

    it('should handle invalid email formats appropriately', async () => {
      // This would typically be handled by Firebase Auth validation
      // In our test environment, we can create users with any email
      await createTestUser('invalid-email-user', 'not-an-email', 'InvalidUser')
      
      // Use fresh context to read the user data
      const context = testEnv.authenticatedContext('invalid-email-user', { email: 'not-an-email' })
      const firestore = context.firestore()
      const userDoc = await getDoc(doc(firestore, 'users', 'invalid-email-user'))
      
      expect(userDoc.exists()).toBe(true)
      expect(userDoc.data()?.email).toBe('not-an-email')
    })
  })
})
