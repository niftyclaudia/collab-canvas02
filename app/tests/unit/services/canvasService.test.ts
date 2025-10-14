import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser, createTestShape, assertSucceeds, assertFails, retryOperation, waitForAsync } from '../../setup'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import type { CreateShapeData, Shape } from '../../../src/services/canvasService'

describe('CanvasService', () => {
  const testUserId = 'canvas-test-user-123'
  const testUser2Id = 'canvas-test-user-456'
  const testEmail = 'canvas-test@example.com'
  const testUser2Email = 'test2@example.com'
  const testUsername = 'TestUser'
  const testUser2Name = 'TestUser2'

  beforeEach(() => {
    // Setup is handled in global beforeEach
  })

  describe('Shape Creation', () => {
    it('should create a shape with correct data structure', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, shapeData)
      
      const firestore = context.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      const shapeDoc = await getDoc(shapeDocRef)
      
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
          createdBy: testUserId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })

    it('should validate createdBy field matches authenticated user', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      const firestore = context.firestore()
      
      // Try to create shape with wrong createdBy
      const invalidShape = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: 'different-user-id', // Wrong user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // This should fail due to security rules
      const shapesCollection = collection(firestore, 'canvases', 'main', 'shapes')
      await assertFails(
        addDoc(shapesCollection, invalidShape)
      )
    })

    it('should allow creation with valid createdBy field', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      const firestore = context.firestore()
      
      const validShape = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId, // Correct user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // This should succeed
      const shapesCollection = collection(firestore, 'canvases', 'main', 'shapes')
      await assertSucceeds(
        addDoc(shapesCollection, validShape)
      )
    })
  })

  describe('Shape Updates', () => {
    it('should allow authenticated users to update any shape', async () => {
      const context1 = await createTestUser(testUserId, testEmail, testUsername)
      const context2 = await createTestUser(testUser2Id, testUser2Email, testUser2Name)
      
      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context1, shapeData)
      
      // Wait for shape to be fully created
      await waitForAsync(100)
      
      // User2 should be able to update User1's shape
      const firestore2 = context2.firestore()
      const shapeDocRef2 = doc(firestore2, 'canvases', 'main', 'shapes', shapeId)
      
      // Retry the update operation in case of timing issues
      await retryOperation(async () => {
        await assertSucceeds(
          updateDoc(shapeDocRef2, {
            x: 200,
            y: 300,
            updatedAt: new Date().toISOString(),
          })
        )
      })
      
      // Verify the update with retry
      const updatedShape = await retryOperation(async () => {
        const updatedShapeDoc = await getDoc(shapeDocRef2)
        return updatedShapeDoc.data()
      })
      
      expect(updatedShape?.x).toBe(200)
      expect(updatedShape?.y).toBe(300)
    })

    it('should handle locking mechanism fields', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, shapeData)
      
      // Wait for shape to be fully created
      await waitForAsync(100)
      
      // Verify shape exists first
      const firestore = context.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      
      const initialShapeDoc = await retryOperation(async () => {
        const doc = await getDoc(shapeDocRef)
        if (!doc.exists()) {
          throw new Error('Shape not found')
        }
        return doc
      })
      expect(initialShapeDoc.exists()).toBe(true)
      
      // Lock the shape with retry
      await retryOperation(async () => {
        await updateDoc(shapeDocRef, {
          lockedBy: testUserId,
          lockedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })
      
      // Verify lock was set with retry
      const lockedShape = await retryOperation(async () => {
        const lockedShapeDoc = await getDoc(shapeDocRef)
        return lockedShapeDoc.data()
      })
      
      expect(lockedShape?.lockedBy).toBe(testUserId)
      expect(lockedShape?.lockedAt).toBeDefined()
    })
  })

  describe('Shape Deletion', () => {
    it('should allow authenticated users to delete shapes', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, shapeData)
      
      const firestore = context.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      
      // Should be able to delete
      await assertSucceeds(
        deleteDoc(shapeDocRef)
      )
      
      // Verify deletion
      const deletedShapeDoc = await getDoc(shapeDocRef)
      expect(deletedShapeDoc.exists()).toBe(false)
    })
  })

  describe('Shape Reading', () => {
    it('should allow authenticated users to read all shapes', async () => {
      const context1 = await createTestUser(testUserId, testEmail, testUsername)
      const context2 = await createTestUser(testUser2Id, testUser2Email, testUser2Name)
      
      // User1 creates a shape
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context1, shapeData)
      
      // User2 should be able to read User1's shape
      const firestore2 = context2.firestore()
      const shapeDocRef2 = doc(firestore2, 'canvases', 'main', 'shapes', shapeId)
      await assertSucceeds(
        getDoc(shapeDocRef2)
      )
    })

    it('should prevent unauthenticated access to shapes', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const shapeData: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, shapeData)
      
      // Unauthenticated user should not be able to read shapes
      const unauthContext = testEnv.unauthenticatedContext()
      const firestore = unauthContext.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      
      await assertFails(
        getDoc(shapeDocRef)
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle shapes with minimum valid dimensions', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const minShapeData: CreateShapeData = {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 10, // Minimum size per requirements
        height: 10,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, minShapeData)
      
      const firestore = context.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      const shapeDoc = await getDoc(shapeDocRef)
      
      expect(shapeDoc.exists()).toBe(true)
      const shape = shapeDoc.data()
      expect(shape?.width).toBe(10)
      expect(shape?.height).toBe(10)
    })

    it('should handle shapes at canvas boundaries', async () => {
      const context = await createTestUser(testUserId, testEmail, testUsername)
      
      const boundaryShapeData: CreateShapeData = {
        type: 'rectangle',
        x: 4900, // Near 5000px boundary
        y: 4900,
        width: 100,
        height: 100,
        color: '#3b82f6',
        createdBy: testUserId,
      }
      
      const shapeId = await createTestShape(context, boundaryShapeData)
      
      const firestore = context.firestore()
      const shapeDocRef = doc(firestore, 'canvases', 'main', 'shapes', shapeId)
      const shapeDoc = await getDoc(shapeDocRef)
      
      expect(shapeDoc.exists()).toBe(true)
      const shape = shapeDoc.data()
      expect(shape?.x).toBe(4900)
      expect(shape?.y).toBe(4900)
    })
  })
})
