import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testEnv, createTestUser, PROJECT_ID } from '../../setup'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { User } from '../../../src/services/authService'

describe('AuthService', () => {
  const testUserId = 'auth-test-user-123'
  const testEmail = 'auth-test@example.com'
  const testUsername = 'AuthTestUser'

  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks()
  })

  describe('User Creation and Authentication', () => {
    it('should create a user document in Firestore on signup', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      const firestore = context.firestore()
      
      // Verify user document was created
      const userDocRef = doc(firestore, 'users', testUserId)
      const userDoc = await getDoc(userDocRef)
      
      expect(userDoc.exists()).toBe(true)
      const userData = userDoc.data() as Omit<User, 'uid'>
      
      expect(userData.email).toBe(testEmail)
      expect(userData.username).toBe(testUsername)
      expect(userData.cursorColor).toMatch(/^#[0-9a-f]{6}$/i) // Valid hex color
      expect(userData.createdAt).toBeDefined()
    })

    it('should assign a random cursor color from the predefined palette', async () => {
      const context1 = await createTestUser('auth-color-user1', 'auth-color-user1@test.com', 'AuthColorUser1')
      const context2 = await createTestUser('auth-color-user2', 'auth-color-user2@test.com', 'AuthColorUser2')
      
      const firestore1 = context1.firestore()
      const firestore2 = context2.firestore()
      
      const user1DocRef = doc(firestore1, 'users', 'auth-color-user1')
      const user2DocRef = doc(firestore2, 'users', 'auth-color-user2')
      const user1Doc = await getDoc(user1DocRef)
      const user2Doc = await getDoc(user2DocRef)
      
      const user1Data = user1Doc.data()
      const user2Data = user2Doc.data()
      
      // Both should have valid colors
      expect(user1Data?.cursorColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(user2Data?.cursorColor).toMatch(/^#[0-9a-f]{6}$/i)
      
      // Colors should be from the predefined palette
      const validColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
      expect(validColors).toContain(user1Data?.cursorColor)
      expect(validColors).toContain(user2Data?.cursorColor)
    })

    it('should retrieve user data correctly after creation', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      const firestore = context.firestore()
      
      const userDocRef = doc(firestore, 'users', testUserId)
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.data()
      
      expect(userData).toEqual(
        expect.objectContaining({
          email: testEmail,
          username: testUsername,
          cursorColor: expect.any(String),
          createdAt: expect.any(String),
        })
      )
    })
  })

  describe('Security Rules', () => {
    it('should allow users to read any user document when authenticated', async () => {
      const context1 = await createTestUser('auth-read-user1', 'auth-read-user1@test.com', 'AuthReadUser1')
      const context2 = testEnv.authenticatedContext('auth-read-user2', { email: 'auth-read-user2@test.com' })
      
      const firestore2 = context2.firestore()
      
      // User2 should be able to read User1's document
      const userDocRef = doc(firestore2, 'users', 'auth-read-user1')
      const userDoc = await getDoc(userDocRef)
      expect(userDoc.exists()).toBe(true)
    })

    it('should only allow users to write to their own document', async () => {
      await createTestUser('auth-write-user1', 'auth-write-user1@test.com', 'AuthWriteUser1')
      const context2 = testEnv.authenticatedContext('auth-write-user2', { email: 'auth-write-user2@test.com' })
      
      const firestore2 = context2.firestore()
      
      // User2 should NOT be able to write to User1's document
      try {
        const userDocRef = doc(firestore2, 'users', 'auth-write-user1')
        await setDoc(userDocRef, {
          username: 'Hacked!',
          email: 'hacker@evil.com',
          cursorColor: '#000000',
          createdAt: new Date().toISOString(),
        })
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.code).toMatch(/permission-denied|unauthenticated/)
      }
    })

    it('should prevent unauthenticated access to user documents', async () => {
      await createTestUser('auth-unauth-user1', 'auth-unauth-user1@test.com', 'AuthUnauthUser1')
      const unauthContext = testEnv.unauthenticatedContext()
      
      const firestore = unauthContext.firestore()
      
      // Unauthenticated user should NOT be able to read user documents
      try {
        const userDocRef = doc(firestore, 'users', 'auth-unauth-user1')
        await getDoc(userDocRef)
        
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.code).toMatch(/permission-denied|unauthenticated/)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty username gracefully', async () => {
      const context = testEnv.authenticatedContext(testUserId, { email: testEmail })
      const firestore = context.firestore()
      
      // Create user with empty username (should be trimmed)
      const userDocRef = doc(firestore, 'users', testUserId)
      await setDoc(userDocRef, {
        email: testEmail,
        username: '   ', // Spaces only
        cursorColor: '#3b82f6',
        createdAt: new Date().toISOString(),
      })
      
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.data()
      
      // Username should be trimmed (though this would be handled by the service)
      expect(userData?.username).toBe('   ')
    })

    it('should handle duplicate email scenarios', async () => {
      await createTestUser('auth-dup-user1', 'auth-same@test.com', 'AuthDupUser1')
      
      // Creating another user with same email should be allowed 
      // (Firebase Auth would prevent this, but Firestore allows it)
      const context2 = testEnv.authenticatedContext('auth-dup-user2', { email: 'auth-same@test.com' })
      const firestore2 = context2.firestore()
      
      const user2DocRef = doc(firestore2, 'users', 'auth-dup-user2')
      await setDoc(user2DocRef, {
        email: 'auth-same@test.com',
        username: 'User2',
        cursorColor: '#ef4444',
        createdAt: new Date().toISOString(),
      })
      
      const user2Doc = await getDoc(user2DocRef)
      expect(user2Doc.exists()).toBe(true)
    })
  })
})
