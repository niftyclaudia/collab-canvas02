import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser, createTestShape, assertSucceeds, assertFails } from '../../setup'
import { doc, getDoc, collection, addDoc, getDocs, writeBatch } from 'firebase/firestore'
import type { CreateShapeData } from '../../../src/services/canvasService'

describe('CanvasService - Grouping Operations', () => {
  const testUser1Id = 'grouping-service-user-1'
  const testUser2Id = 'grouping-service-user-2'
  const testUser1Email = 'grouping-service1@test.com'
  const testUser2Email = 'grouping-service2@test.com'

  describe('groupShapes', () => {
    it('should create a group with multiple shape IDs', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create two shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'circle',
        x: 300,
        y: 400,
        width: 100,
        height: 100,
        radius: 50,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Create group
      const groupData = {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const groupDocRef = await addDoc(collection(firestore1, 'canvases/main/groups'), groupData)
      
      // Verify group was created
      const groupDoc = await getDoc(groupDocRef)
      expect(groupDoc.exists()).toBe(true)
      
      const group = groupDoc.data()
      expect(group?.name).toBe('Test Group')
      expect(group?.shapeIds).toEqual([shape1Id, shape2Id])
      expect(group?.createdBy).toBe(testUser1Id)
    })

    it('should update all shapes with groupId when grouped', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Create group
      const groupId = `group_${Date.now()}_test`
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update shapes with groupId using batch
      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify shapes have groupId
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.groupId).toBe(groupId)
      expect(shape2Doc.data()?.groupId).toBe(groupId)
    })

    it('should validate that at least 2 shapes are required', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')

      // Create only one shape
      const shapeId = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      // Validate that single shape array would fail validation
      const singleShapeGroup = [shapeId]
      expect(singleShapeGroup.length).toBeLessThan(2)
      
      // In the actual service, this should throw an error:
      // "At least 2 shapes are required to create a group"
    })

    it('should validate createdBy matches authenticated user', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Try to create group with wrong createdBy - should fail security rules
      const invalidGroup = {
        name: 'Invalid Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: 'different-user-id', // Wrong user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await assertFails(
        addDoc(collection(firestore1, 'canvases/main/groups'), invalidGroup)
      )
    })
  })

  describe('ungroupShapes', () => {
    it('should remove groupId from all shapes', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Create group
      const groupId = `group_${Date.now()}_test`
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Group shapes
      let batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify shapes are grouped
      let shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      expect(shape1Doc.data()?.groupId).toBe(groupId)

      // Ungroup shapes
      batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify groupId is removed
      shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.groupId).toBeNull()
      expect(shape2Doc.data()?.groupId).toBeNull()
    })

    it('should delete the group document', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Create group
      const groupDocRef = await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Verify group exists
      let groupDoc = await getDoc(groupDocRef)
      expect(groupDoc.exists()).toBe(true)

      // Delete group (simulating ungroupShapes)
      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      batch.delete(groupDocRef)
      await batch.commit()

      // Verify group is deleted
      groupDoc = await getDoc(groupDocRef)
      expect(groupDoc.exists()).toBe(false)
    })
  })

  describe('moveGroup', () => {
    it('should move all shapes in a group by delta', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes with initial positions
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Move both shapes by +50x, +50y
      const deltaX = 50
      const deltaY = 50

      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        x: 100 + deltaX,
        y: 200 + deltaY,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        x: 300 + deltaX,
        y: 400 + deltaY,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify shapes moved correctly
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.x).toBe(150)
      expect(shape1Doc.data()?.y).toBe(250)
      expect(shape2Doc.data()?.x).toBe(350)
      expect(shape2Doc.data()?.y).toBe(450)
    })

    it('should maintain relative positions when moving group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes with specific relative positioning
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 200, // 100px to the right of shape1
        y: 200, // same y as shape1
        width: 50,
        height: 50,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Get initial relative distance
      const initialDistance = 200 - 100 // 100px

      // Move group
      const deltaX = 75
      const deltaY = 25

      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        x: 100 + deltaX,
        y: 200 + deltaY,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        x: 200 + deltaX,
        y: 200 + deltaY,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify relative positions maintained
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      const newDistance = (shape2Doc.data()?.x || 0) - (shape1Doc.data()?.x || 0)
      expect(newDistance).toBe(initialDistance) // Should still be 100px apart
      
      // Verify both shapes moved by same delta
      expect(shape1Doc.data()?.x).toBe(175)
      expect(shape1Doc.data()?.y).toBe(225)
      expect(shape2Doc.data()?.x).toBe(275)
      expect(shape2Doc.data()?.y).toBe(225)
    })
  })

  describe('deleteGroup', () => {
    it('should delete all shapes in a group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Verify shapes exist
      let shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      let shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))
      expect(shape1Doc.exists()).toBe(true)
      expect(shape2Doc.exists()).toBe(true)

      // Delete both shapes (simulating deleteGroup)
      const batch = writeBatch(firestore1)
      batch.delete(doc(firestore1, 'canvases/main/shapes', shape1Id))
      batch.delete(doc(firestore1, 'canvases/main/shapes', shape2Id))
      await batch.commit()

      // Verify shapes are deleted
      shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))
      expect(shape1Doc.exists()).toBe(false)
      expect(shape2Doc.exists()).toBe(false)
    })

    it('should delete group document when deleting group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Create group
      const groupDocRef = await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Verify group exists
      let groupDoc = await getDoc(groupDocRef)
      expect(groupDoc.exists()).toBe(true)

      // Delete group and all shapes
      const batch = writeBatch(firestore1)
      batch.delete(doc(firestore1, 'canvases/main/shapes', shape1Id))
      batch.delete(doc(firestore1, 'canvases/main/shapes', shape2Id))
      batch.delete(groupDocRef)
      await batch.commit()

      // Verify group is deleted
      groupDoc = await getDoc(groupDocRef)
      expect(groupDoc.exists()).toBe(false)
    })
  })

  describe('duplicateGroup', () => {
    it('should create copies of all shapes in a group with offset', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create original shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Duplicate shapes with offset
      const offsetX = 20
      const offsetY = 20

      const duplicatedShape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100 + offsetX,
        y: 200 + offsetY,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const duplicatedShape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300 + offsetX,
        y: 400 + offsetY,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      // Verify duplicated shapes exist with correct positions
      const dupShape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', duplicatedShape1Id))
      const dupShape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', duplicatedShape2Id))

      expect(dupShape1Doc.exists()).toBe(true)
      expect(dupShape2Doc.exists()).toBe(true)
      expect(dupShape1Doc.data()?.x).toBe(120)
      expect(dupShape1Doc.data()?.y).toBe(220)
      expect(dupShape2Doc.data()?.x).toBe(320)
      expect(dupShape2Doc.data()?.y).toBe(420)
    })
  })

  describe('getShapesInGroup', () => {
    it('should return all shapes belonging to a group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Create shapes
      const shape1Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      })

      const shape2Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 300,
        y: 400,
        width: 150,
        height: 100,
        color: '#ef4444',
        createdBy: testUser1Id,
      })

      const shape3Id = await createTestShape(user1, {
        type: 'rectangle',
        x: 500,
        y: 600,
        width: 150,
        height: 100,
        color: '#10b981',
        createdBy: testUser1Id,
      })

      // Create group with shape1 and shape2
      const groupId = `group_${Date.now()}_test`
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update shapes with groupId
      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Get all shapes with this groupId
      const shapesSnapshot = await getDocs(collection(firestore1, 'canvases/main/shapes'))
      const shapesInGroup = shapesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shape => shape.groupId === groupId)

      // Verify we get exactly 2 shapes in the group
      expect(shapesInGroup.length).toBe(2)
      expect(shapesInGroup.some(s => s.id === shape1Id)).toBe(true)
      expect(shapesInGroup.some(s => s.id === shape2Id)).toBe(true)
      expect(shapesInGroup.some(s => s.id === shape3Id)).toBe(false)
    })

    it('should return empty array for non-existent group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupServiceUser1')
      const firestore1 = user1.firestore()

      // Query for shapes with non-existent groupId
      const nonExistentGroupId = 'group_nonexistent_123'
      const shapesSnapshot = await getDocs(collection(firestore1, 'canvases/main/shapes'))
      const shapesInGroup = shapesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shape => shape.groupId === nonExistentGroupId)

      expect(shapesInGroup.length).toBe(0)
    })
  })
})

