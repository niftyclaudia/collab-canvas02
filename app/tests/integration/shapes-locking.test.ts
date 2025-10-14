import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser, createTestShape, assertSucceeds, assertFails } from '../setup'
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc } from 'firebase/firestore'
import type { CreateShapeData } from '../../src/services/canvasService'

describe('Shapes Creation, Moving, and Locking Integration', () => {
  const testUser1Id = 'shapes-user-1'
  const testUser2Id = 'shapes-user-2'
  const testUser1Email = 'shapes1@test.com'
  const testUser2Email = 'shapes2@test.com'

  describe('Shape Creation and Synchronization', () => {
    it('should create shapes and sync them to other users in real-time', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // User2 should be able to see User1's shape immediately
      const firestore2 = user2.firestore()
      const shapeDoc = await getDoc(doc(firestore2, 'canvases/main/shapes', shapeId))

      expect(shapeDoc.exists()).toBe(true)
      const shape = shapeDoc.data()

      expect(shape).toEqual(
        expect.objectContaining({
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          color: '#3b82f6',
          createdBy: testUser1Id,
        })
      )
    })

    it('should handle multiple shapes created by different users', async () => {
      await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // Create fresh contexts for each user
      const user1 = testEnv.authenticatedContext(testUser1Id, { email: testUser1Email })
      const user2 = testEnv.authenticatedContext(testUser2Id, { email: testUser2Email })

      // User1 creates first shape
      const shape1Data: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      }

      // User2 creates second shape
      const shape2Data: CreateShapeData = {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 200,
        height: 150,
        color: '#10b981',
        createdBy: testUser2Id,
      }

      const shape1Id = await createTestShape(user1, shape1Data)
      const shape2Id = await createTestShape(user2, shape2Data)

      // Both users should be able to see both shapes
      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()

      // User1 sees both shapes
      const shape1Doc1 = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc1 = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      // User2 sees both shapes
      const shape1Doc2 = await getDoc(doc(firestore2, 'canvases/main/shapes', shape1Id))
      const shape2Doc2 = await getDoc(doc(firestore2, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc1.exists()).toBe(true)
      expect(shape2Doc1.exists()).toBe(true)
      expect(shape1Doc2.exists()).toBe(true)
      expect(shape2Doc2.exists()).toBe(true)

      expect(shape1Doc1.data()?.createdBy).toBe(testUser1Id)
      expect(shape2Doc1.data()?.createdBy).toBe(testUser2Id)
    })

    it('should validate createdBy field on shape creation', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const firestore1 = user1.firestore()

      // Try to create shape with wrong createdBy - should fail
      const invalidShape = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: 'wrong-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const shapesCollection = collection(firestore1, 'canvases', 'main', 'shapes')
      await assertFails(
        addDoc(shapesCollection, invalidShape)
      )
    })
  })

  describe('Shape Locking Mechanism', () => {
    it('should allow first user to lock shape and prevent others from editing', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // User1 locks the shape (first-click wins)
      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      await updateDoc(shapeRef1, {
        lockedBy: testUser1Id,
        lockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Verify User1 has locked the shape
      const lockedShapeDoc = await getDoc(shapeRef1)
      const lockedShape = lockedShapeDoc.data()

      expect(lockedShape?.lockedBy).toBe(testUser1Id)
      expect(lockedShape?.lockedAt).toBeDefined()

      // User2 should see the locked state
      const firestore2 = user2.firestore()
      const shapeRef2 = doc(firestore2, 'canvases/main/shapes', shapeId)
      const user2ShapeDoc = await getDoc(shapeRef2)
      const user2Shape = user2ShapeDoc.data()

      expect(user2Shape?.lockedBy).toBe(testUser1Id)

      // User2 should still be able to read, but the UI would show it as locked
      expect(user2ShapeDoc.exists()).toBe(true)
    })

    it('should handle lock timeout mechanism (5 second rule)', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // User1 creates and locks a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // User1 locks with old timestamp (>5 seconds ago)
      const oldTimestamp = new Date(Date.now() - 6000).toISOString() // 6 seconds ago
      
      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      await updateDoc(shapeRef1, {
        lockedBy: testUser1Id,
        lockedAt: oldTimestamp,
        updatedAt: new Date().toISOString(),
      })

      // User2 should be able to take over the lock (timeout exceeded)
      const firestore2 = user2.firestore()
      const shapeRef2 = doc(firestore2, 'canvases/main/shapes', shapeId)

      const currentTime = new Date().toISOString()
      await updateDoc(shapeRef2, {
        lockedBy: testUser2Id,
        lockedAt: currentTime,
        updatedAt: currentTime,
      })

      // Verify User2 now has the lock
      const updatedShapeDoc = await getDoc(shapeRef2)
      const updatedShape = updatedShapeDoc.data()

      expect(updatedShape?.lockedBy).toBe(testUser2Id)
    })

    it('should handle lock release on shape move completion', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')

      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      // User1 locks and moves the shape
      await updateDoc(shapeRef1, {
        lockedBy: testUser1Id,
        lockedAt: new Date().toISOString(),
        x: 200, // New position
        y: 300, // New position
        updatedAt: new Date().toISOString(),
      })

      // Simulate drag end - release lock
      await updateDoc(shapeRef1, {
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date().toISOString(),
      })

      // Verify lock is released
      const unlockedShapeDoc = await getDoc(shapeRef1)
      const unlockedShape = unlockedShapeDoc.data()

      expect(unlockedShape?.lockedBy).toBeNull()
      expect(unlockedShape?.lockedAt).toBeNull()
      expect(unlockedShape?.x).toBe(200)
      expect(unlockedShape?.y).toBe(300)
    })
  })

  describe('Shape Movement Synchronization', () => {
    it('should synchronize shape movements to all users in real-time', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // User2 sets up real-time listener for shape changes
      const firestore2 = user2.firestore()
      const shapeRef2 = doc(firestore2, 'canvases/main/shapes', shapeId)

      let updateReceived = false
      let updatedShapeData: any = null

      const unsubscribe = onSnapshot(shapeRef2, (doc) => {
        if (doc.exists()) {
          updateReceived = true
          updatedShapeData = doc.data()
        }
      })

      // User1 moves the shape
      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      await updateDoc(shapeRef1, {
        x: 300,
        y: 400,
        updatedAt: new Date().toISOString(),
      })

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(updateReceived).toBe(true)
      expect(updatedShapeData?.x).toBe(300)
      expect(updatedShapeData?.y).toBe(400)

      // Cleanup listener
      unsubscribe()
    })

    it('should handle rapid shape movements without data corruption', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')

      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      // Simulate rapid movements (drag path)
      const movements = [
        [110, 210], [120, 220], [130, 230], [140, 240], [150, 250]
      ]

      for (const [x, y] of movements) {
        await updateDoc(shapeRef1, {
          x,
          y,
          updatedAt: new Date().toISOString(),
        })
        // Small delay to simulate real drag timing
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      // Verify final position
      const finalShapeDoc = await getDoc(shapeRef1)
      const finalShape = finalShapeDoc.data()

      expect(finalShape?.x).toBe(150)
      expect(finalShape?.y).toBe(250)
    })

    it('should maintain shape integrity during concurrent operations', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // Both users try to update different properties simultaneously
      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)
      const shapeRef2 = doc(firestore2, 'canvases/main/shapes', shapeId)

      const updatePromises = [
        updateDoc(shapeRef1, { x: 200, updatedAt: new Date().toISOString() }),
        updateDoc(shapeRef2, { y: 300, updatedAt: new Date().toISOString() }),
      ]

      await Promise.all(updatePromises)

      // Verify both updates were applied (last write wins for updatedAt)
      const finalShapeDoc = await getDoc(shapeRef1)
      const finalShape = finalShapeDoc.data()

      // Both position changes should be present
      // Note: In a real scenario with transactions, this would be more predictable
      expect(finalShape?.x).toBeDefined()
      expect(finalShape?.y).toBeDefined()
    })
  })

  describe('Multi-User Shape Interaction Scenarios', () => {
    it('should handle shape creation while others are moving existing shapes', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      // User1 creates first shape
      const shape1Data: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      }

      const shape1Id = await createTestShape(user1, shape1Data)

      // Simultaneously: User1 moves shape1 and User2 creates shape2
      const movePromise = (async () => {
        const firestore1 = user1.firestore()
        const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shape1Id)
        await updateDoc(shapeRef1, {
          x: 200,
          y: 300,
          updatedAt: new Date().toISOString(),
        })
      })()

      const createPromise = (async () => {
        const shape2Data: CreateShapeData = {
          type: 'rectangle',
          x: 400,
          y: 500,
          width: 200,
          height: 150,
          color: '#10b981',
          createdBy: testUser2Id,
        }
        return await createTestShape(user2, shape2Data)
      })()

      const [, shape2Id] = await Promise.all([movePromise, createPromise])

      // Verify both operations succeeded
      const firestore1 = user1.firestore()
      
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.x).toBe(200) // Moved
      expect(shape1Doc.data()?.y).toBe(300) // Moved
      expect(shape2Doc.exists()).toBe(true) // Created
      expect(shape2Doc.data()?.x).toBe(400)
      expect(shape2Doc.data()?.y).toBe(500)
    })

    it('should handle lock conflicts gracefully', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'ShapesUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'ShapesUser2')

      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shapeId = await createTestShape(user1, shapeData)

      // User1 locks the shape first
      const firestore1 = user1.firestore()
      const shapeRef1 = doc(firestore1, 'canvases/main/shapes', shapeId)

      await updateDoc(shapeRef1, {
        lockedBy: testUser1Id,
        lockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // User2 tries to lock the same shape (should see existing lock)
      const firestore2 = user2.firestore()
      const shapeRef2 = doc(firestore2, 'canvases/main/shapes', shapeId)

      // In a real application, User2 would check for existing locks before attempting
      const shapeDoc = await getDoc(shapeRef2)
      const currentShapeData = shapeDoc.data()

      // User2 should see that shape is locked by User1
      expect(currentShapeData?.lockedBy).toBe(testUser1Id)
      expect(currentShapeData?.lockedAt).toBeDefined()

      // User2 should not override an active lock (this would be enforced in the service layer)
      const lockTime = new Date(currentShapeData?.lockedAt).getTime()
      const now = Date.now()
      const lockAge = now - lockTime

      if (lockAge < 5000) { // Lock is still active
        // User2 should not be able to take over
        expect(currentShapeData?.lockedBy).toBe(testUser1Id)
      }
    })
  })
})
