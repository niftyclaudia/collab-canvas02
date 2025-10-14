import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser, updateTestCursor, setTestPresence } from '../setup'
import { ref, get, onValue, off, set } from 'firebase/database'

describe('Cursor and Presence Integration', () => {
  const testUser1Id = 'cursor-user-1'
  const testUser2Id = 'cursor-user-2'
  const testUser3Id = 'cursor-user-3'

  describe('Multi-User Cursor Tracking', () => {
    it('should track multiple users cursors simultaneously', async () => {
      await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      await createTestUser(testUser2Id, 'user2@test.com', 'User2')
      await createTestUser(testUser3Id, 'user3@test.com', 'User3')

      // Each user sets their cursor position using fresh contexts
      const user1Context = testEnv.authenticatedContext(testUser1Id, { email: 'user1@test.com' })
      const user2Context = testEnv.authenticatedContext(testUser2Id, { email: 'user2@test.com' })
      const user3Context = testEnv.authenticatedContext(testUser3Id, { email: 'user3@test.com' })

      await updateTestCursor(user1Context, testUser1Id, 100, 200)
      await updateTestCursor(user2Context, testUser2Id, 300, 400)
      await updateTestCursor(user3Context, testUser3Id, 500, 600)

      // Any user should be able to read all cursor positions
      const database = user1Context.database()

      const cursor1Snapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/cursor`))
      const cursor2Snapshot = await get(ref(database, `sessions/main/users/${testUser2Id}/cursor`))
      const cursor3Snapshot = await get(ref(database, `sessions/main/users/${testUser3Id}/cursor`))

      expect(cursor1Snapshot.val()).toEqual(expect.objectContaining({ x: 100, y: 200 }))
      expect(cursor2Snapshot.val()).toEqual(expect.objectContaining({ x: 300, y: 400 }))
      expect(cursor3Snapshot.val()).toEqual(expect.objectContaining({ x: 500, y: 600 }))
    })

    it('should handle rapid cursor updates without data loss', async () => {
      await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      const user = testEnv.authenticatedContext(testUser1Id, { email: 'user1@test.com' })
      
      // Simulate rapid cursor movements
      const positions = [
        [10, 20], [50, 80], [100, 150], [200, 250], [350, 400]
      ]
      
      for (const [x, y] of positions) {
        await updateTestCursor(user, testUser1Id, x, y)
        // Small delay to simulate real cursor movement
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      // Verify final position is the last one set
      const database = user.database()
      const cursorSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/cursor`))
      const finalPosition = cursorSnapshot.val()

      expect(finalPosition.x).toBe(350)
      expect(finalPosition.y).toBe(400)
      expect(finalPosition.timestamp).toBeDefined()
    })

    it('should enforce canvas boundaries for cursor visibility', async () => {
      const user = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      
      // Test cursor positions at various boundaries
      const testPositions = [
        [0, 0],           // Top-left corner
        [5000, 5000],     // Bottom-right corner  
        [2500, 2500],     // Center
        [5000, 0],        // Top-right corner
        [0, 5000],        // Bottom-left corner
      ]

      for (const [x, y] of testPositions) {
        await updateTestCursor(user, testUser1Id, x, y)
        
        const database = user.database()
        const cursorSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/cursor`))
        const cursorData = cursorSnapshot.val()

        expect(cursorData.x).toBe(x)
        expect(cursorData.y).toBe(y)
      }
    })
  })

  describe('Real-Time Presence Management', () => {
    it('should track multiple users online status simultaneously', async () => {
      await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      await createTestUser(testUser2Id, 'user2@test.com', 'User2')
      await createTestUser(testUser3Id, 'user3@test.com', 'User3')

      // Create fresh contexts for each user
      const user1Context = testEnv.authenticatedContext(testUser1Id, { email: 'user1@test.com' })
      const user2Context = testEnv.authenticatedContext(testUser2Id, { email: 'user2@test.com' })
      const user3Context = testEnv.authenticatedContext(testUser3Id, { email: 'user3@test.com' })

      // Set all users as online
      await setTestPresence(user1Context, testUser1Id, 'User1')
      await setTestPresence(user2Context, testUser2Id, 'User2') 
      await setTestPresence(user3Context, testUser3Id, 'User3')

      // Verify all users can see each other's presence
      const database = user1Context.database()

      const presence1 = await get(ref(database, `sessions/main/users/${testUser1Id}/presence`))
      const presence2 = await get(ref(database, `sessions/main/users/${testUser2Id}/presence`))
      const presence3 = await get(ref(database, `sessions/main/users/${testUser3Id}/presence`))

      expect(presence1.val().online).toBe(true)
      expect(presence2.val().online).toBe(true) 
      expect(presence3.val().online).toBe(true)

      expect(presence1.val().username).toBe('User1')
      expect(presence2.val().username).toBe('User2')
      expect(presence3.val().username).toBe('User3')
    })

    it('should update lastSeen timestamps correctly', async () => {
      await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      const user = testEnv.authenticatedContext(testUser1Id, { email: 'user1@test.com' })
      
      const time1 = Date.now()
      await setTestPresence(user, testUser1Id, 'User1')
      
      // Wait a bit then update presence again
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const time2 = Date.now()
      await setTestPresence(user, testUser1Id, 'User1')

      const database = user.database()
      const presenceSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/presence`))
      const presenceData = presenceSnapshot.val()

      expect(presenceData.lastSeen).toBeGreaterThanOrEqual(time2)
      expect(presenceData.lastSeen).toBeGreaterThan(time1)
    })

    it('should handle user going offline gracefully', async () => {
      const user = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      
      // Set user online first
      await setTestPresence(user, testUser1Id, 'User1')
      
      // Verify user is online
      const database = user.database()
      let presenceSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/presence`))
      expect(presenceSnapshot.val().online).toBe(true)

      // Simulate going offline by setting online: false
      const presenceRef = ref(database, `sessions/main/users/${testUser1Id}/presence`)
      await set(presenceRef, {
        username: 'User1',
        online: false,
        lastSeen: Date.now(),
      })

      // Verify user is now offline
      presenceSnapshot = await get(presenceRef)
      expect(presenceSnapshot.val().online).toBe(false)
    })
  })

  describe('Cursor and Presence Real-Time Updates', () => {
    it('should receive real-time updates for cursor movements', async () => {
      const user1 = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      const user2 = await createTestUser(testUser2Id, 'user2@test.com', 'User2')

      const database2 = user2.database()
      const cursor1Ref = ref(database2, `sessions/main/users/${testUser1Id}/cursor`)

      let updateReceived = false
      let cursorData: any = null

      // User2 listens for User1's cursor updates
      const unsubscribe = onValue(cursor1Ref, (snapshot) => {
        if (snapshot.exists()) {
          updateReceived = true
          cursorData = snapshot.val()
        }
      })

      // User1 moves cursor
      await updateTestCursor(user1, testUser1Id, 150, 250)

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(updateReceived).toBe(true)
      expect(cursorData).toEqual(
        expect.objectContaining({
          x: 150,
          y: 250,
          username: 'Test User',
          color: '#3b82f6'
        })
      )

      // Cleanup listener
      off(cursor1Ref)
      unsubscribe()
    })

    it('should receive real-time updates for presence changes', async () => {
      const user1 = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      const user2 = await createTestUser(testUser2Id, 'user2@test.com', 'User2')

      const database2 = user2.database()
      const presence1Ref = ref(database2, `sessions/main/users/${testUser1Id}/presence`)

      let updateReceived = false
      let presenceData: any = null

      // User2 listens for User1's presence updates
      const unsubscribe = onValue(presence1Ref, (snapshot) => {
        if (snapshot.exists()) {
          updateReceived = true
          presenceData = snapshot.val()
        }
      })

      // User1 sets presence
      await setTestPresence(user1, testUser1Id, 'User1')

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(updateReceived).toBe(true)
      expect(presenceData).toEqual(
        expect.objectContaining({
          username: 'User1',
          online: true,
          lastSeen: expect.any(Number)
        })
      )

      // Cleanup listener
      off(presence1Ref)
      unsubscribe()
    })

    it('should handle multiple simultaneous real-time listeners', async () => {
      const user1 = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      const user2 = await createTestUser(testUser2Id, 'user2@test.com', 'User2')
      const user3 = await createTestUser(testUser3Id, 'user3@test.com', 'User3')

      // Multiple users listening to User1's cursor
      const database2 = user2.database()
      const database3 = user3.database()
      
      const cursor1Ref2 = ref(database2, `sessions/main/users/${testUser1Id}/cursor`)
      const cursor1Ref3 = ref(database3, `sessions/main/users/${testUser1Id}/cursor`)

      let user2Received = false
      let user3Received = false
      let user2Data: any = null
      let user3Data: any = null

      const unsub2 = onValue(cursor1Ref2, (snapshot) => {
        if (snapshot.exists()) {
          user2Received = true
          user2Data = snapshot.val()
        }
      })

      const unsub3 = onValue(cursor1Ref3, (snapshot) => {
        if (snapshot.exists()) {
          user3Received = true
          user3Data = snapshot.val()
        }
      })

      // User1 moves cursor
      await updateTestCursor(user1, testUser1Id, 100, 200)

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 150))

      // Both users should receive the update
      expect(user2Received).toBe(true)
      expect(user3Received).toBe(true)
      
      expect(user2Data.x).toBe(100)
      expect(user2Data.y).toBe(200)
      expect(user3Data.x).toBe(100)
      expect(user3Data.y).toBe(200)

      // Cleanup
      off(cursor1Ref2)
      off(cursor1Ref3)
      unsub2()
      unsub3()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle rapid cursor updates from multiple users', async () => {
      const users = []
      
      // Create 5 users
      for (let i = 0; i < 5; i++) {
        const userId = `perf-user-${i}`
        const user = await createTestUser(userId, `perf${i}@test.com`, `PerfUser${i}`)
        users.push({ userId, context: user })
      }

      // Each user makes rapid cursor movements
      const updatePromises = users.map(async (user, userIndex) => {
        for (let moveIndex = 0; moveIndex < 10; moveIndex++) {
          const x = userIndex * 100 + moveIndex * 10
          const y = userIndex * 100 + moveIndex * 10
          await updateTestCursor(user.context, user.userId, x, y)
        }
      })

      // Wait for all updates to complete
      await Promise.all(updatePromises)

      // Verify final positions for each user
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const database = user.context.database()
        const cursorSnapshot = await get(ref(database, `sessions/main/users/${user.userId}/cursor`))
        const cursorData = cursorSnapshot.val()

        // Final position should be the last one set
        const expectedX = i * 100 + 9 * 10
        const expectedY = i * 100 + 9 * 10
        
        expect(cursorData.x).toBe(expectedX)
        expect(cursorData.y).toBe(expectedY)
      }
    })

    it('should maintain data consistency under concurrent access', async () => {
      const user = await createTestUser(testUser1Id, 'user1@test.com', 'User1')
      
      // Simulate concurrent cursor and presence updates
      const cursorPromise = updateTestCursor(user, testUser1Id, 100, 200)
      const presencePromise = setTestPresence(user, testUser1Id, 'User1')
      
      await Promise.all([cursorPromise, presencePromise])

      // Verify both updates succeeded
      const database = user.database()
      
      const cursorSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/cursor`))
      const presenceSnapshot = await get(ref(database, `sessions/main/users/${testUser1Id}/presence`))

      expect(cursorSnapshot.exists()).toBe(true)
      expect(presenceSnapshot.exists()).toBe(true)
      
      expect(cursorSnapshot.val().x).toBe(100)
      expect(cursorSnapshot.val().y).toBe(200)
      expect(presenceSnapshot.val().online).toBe(true)
    })
  })
})
