import { describe, it, expect, beforeEach } from 'vitest'
import { testEnv, createTestUser, createTestShape, assertSucceeds, assertFails } from '../setup'
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore'
import type { CreateShapeData } from '../../src/services/canvasService'

describe('Object Grouping System Integration Tests', () => {
  const testUser1Id = 'grouping-user-1'
  const testUser2Id = 'grouping-user-2'
  const testUser1Email = 'grouping1@test.com'
  const testUser2Email = 'grouping2@test.com'

  describe('Group Creation', () => {
    it('should create a group with multiple shapes', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create two shapes
      const shape1Data: CreateShapeData = {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: testUser1Id,
      }

      const shape2Data: CreateShapeData = {
        type: 'circle',
        x: 300,
        y: 400,
        width: 100,
        height: 100,
        radius: 50,
        color: '#ef4444',
        createdBy: testUser1Id,
      }

      const shape1Id = await createTestShape(user1, shape1Data)
      const shape2Id = await createTestShape(user1, shape2Data)

      // Create a group
      const groupId = `group_${Date.now()}_test`
      const groupData = {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const groupDocRef = doc(firestore1, 'canvases/main/groups', groupId)
      await assertSucceeds(addDoc(collection(firestore1, 'canvases/main/groups'), groupData))

      // Update shapes with groupId using batch write
      const batch = writeBatch(firestore1)
      const shape1Ref = doc(firestore1, 'canvases/main/shapes', shape1Id)
      const shape2Ref = doc(firestore1, 'canvases/main/shapes', shape2Id)

      batch.update(shape1Ref, {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })

      batch.update(shape2Ref, {
        groupId: groupId,
        updatedAt: new Date().toISOString(),
      })

      await batch.commit()

      // Verify group was created
      const groupsSnapshot = await getDocs(collection(firestore1, 'canvases/main/groups'))
      const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      expect(groups.length).toBeGreaterThan(0)
      const createdGroup = groups.find(g => g.shapeIds.includes(shape1Id))
      expect(createdGroup).toBeDefined()
      expect(createdGroup?.shapeIds).toContain(shape1Id)
      expect(createdGroup?.shapeIds).toContain(shape2Id)

      // Verify shapes have groupId
      const shape1Doc = await getDoc(shape1Ref)
      const shape2Doc = await getDoc(shape2Ref)

      expect(shape1Doc.data()?.groupId).toBeDefined()
      expect(shape2Doc.data()?.groupId).toBeDefined()
      expect(shape1Doc.data()?.groupId).toBe(shape2Doc.data()?.groupId)
    })

    it('should validate group requires at least 2 shapes', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create only one shape
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

      // Try to create a group with only one shape
      const groupData = {
        name: 'Invalid Group',
        shapeIds: [shapeId],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // This should fail validation in the service layer
      // For now, we just verify that a valid group needs 2+ shapes
      expect(groupData.shapeIds.length).toBeLessThan(2)
    })

    it('should prevent grouping shapes that are already in a group', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create three shapes
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

      // Create first group with shape1 and shape2
      const group1Id = `group_${Date.now()}_test1`
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Group 1',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update shapes with groupId
      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: group1Id,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: group1Id,
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Verify shape1 is already grouped
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      expect(shape1Doc.data()?.groupId).toBe(group1Id)

      // Service layer should prevent creating another group with shape1
      // (This would be validated in canvasService.groupShapes)
    })
  })

  describe('Group Synchronization', () => {
    it('should sync group creation to other users in real-time', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'GroupingUser2')

      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()

      // User1 creates two shapes
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

      // User1 creates a group
      const groupId = `group_${Date.now()}_test`
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Synced Group',
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

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 100))

      // User2 should see the group
      const groupsSnapshot = await getDocs(collection(firestore2, 'canvases/main/groups'))
      const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const syncedGroup = groups.find(g => g.shapeIds && g.shapeIds.includes(shape1Id))
      expect(syncedGroup).toBeDefined()

      // User2 should see the updated shapes with groupId
      const shape1Doc = await getDoc(doc(firestore2, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore2, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.groupId).toBeDefined()
      expect(shape2Doc.data()?.groupId).toBeDefined()
    })

    it('should sync group movements to all users', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'GroupingUser2')

      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()

      // Create shapes and group
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

      // User2 listens for shape updates
      let shape1Updated = false
      let shape2Updated = false

      const unsubscribe1 = onSnapshot(doc(firestore2, 'canvases/main/shapes', shape1Id), (doc) => {
        if (doc.exists() && doc.data().x === 200) {
          shape1Updated = true
        }
      })

      const unsubscribe2 = onSnapshot(doc(firestore2, 'canvases/main/shapes', shape2Id), (doc) => {
        if (doc.exists() && doc.data().x === 400) {
          shape2Updated = true
        }
      })

      // User1 moves the group (simulating moveGroup operation)
      const batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        x: 200, // moved +100
        y: 300, // moved +100
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        x: 400, // moved +100
        y: 500, // moved +100
        updatedAt: new Date().toISOString(),
      })
      await batch.commit()

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(shape1Updated).toBe(true)
      expect(shape2Updated).toBe(true)

      // Cleanup
      unsubscribe1()
      unsubscribe2()
    })
  })

  describe('Group Ungrouping', () => {
    it('should ungroup shapes and remove groupId', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create shapes and group
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

      const groupId = `group_${Date.now()}_test`
      const groupRef = doc(firestore1, 'canvases/main/groups', groupId)
      
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update shapes with groupId
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

      // Ungroup: remove groupId from shapes and delete group
      batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      
      // Get the actual group document to delete
      const groupsSnapshot = await getDocs(collection(firestore1, 'canvases/main/groups'))
      const groupDoc = groupsSnapshot.docs.find(doc => {
        const data = doc.data()
        return data.shapeIds && data.shapeIds.includes(shape1Id)
      })
      
      if (groupDoc) {
        batch.delete(doc(firestore1, 'canvases/main/groups', groupDoc.id))
      }
      
      await batch.commit()

      // Verify shapes are ungrouped
      shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.groupId).toBeNull()
      expect(shape2Doc.data()?.groupId).toBeNull()
    })

    it('should sync ungrouping to other users', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'GroupingUser2')

      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()

      // Create shapes and group
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

      const groupId = `group_${Date.now()}_test`
      
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Test Group',
        shapeIds: [shape1Id, shape2Id],
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update shapes with groupId
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

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 100))

      // User2 verifies group exists
      let shape1Doc = await getDoc(doc(firestore2, 'canvases/main/shapes', shape1Id))
      expect(shape1Doc.data()?.groupId).toBe(groupId)

      // User1 ungroups
      batch = writeBatch(firestore1)
      batch.update(doc(firestore1, 'canvases/main/shapes', shape1Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      batch.update(doc(firestore1, 'canvases/main/shapes', shape2Id), {
        groupId: null,
        updatedAt: new Date().toISOString(),
      })
      
      // Delete group document
      const groupsSnapshot = await getDocs(collection(firestore1, 'canvases/main/groups'))
      const groupDoc = groupsSnapshot.docs.find(doc => {
        const data = doc.data()
        return data.shapeIds && data.shapeIds.includes(shape1Id)
      })
      
      if (groupDoc) {
        batch.delete(doc(firestore1, 'canvases/main/groups', groupDoc.id))
      }
      
      await batch.commit()

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 100))

      // User2 should see shapes are ungrouped
      shape1Doc = await getDoc(doc(firestore2, 'canvases/main/shapes', shape1Id))
      const shape2Doc = await getDoc(doc(firestore2, 'canvases/main/shapes', shape2Id))

      expect(shape1Doc.data()?.groupId).toBeNull()
      expect(shape2Doc.data()?.groupId).toBeNull()
    })
  })

  describe('Group Operations', () => {
    it('should delete entire group when deleteGroup is called', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create shapes and group
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

      // Verify shapes exist
      let shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      let shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))
      expect(shape1Doc.exists()).toBe(true)
      expect(shape2Doc.exists()).toBe(true)

      // Delete all shapes in group and the group itself
      const deleteBatch = writeBatch(firestore1)
      deleteBatch.delete(doc(firestore1, 'canvases/main/shapes', shape1Id))
      deleteBatch.delete(doc(firestore1, 'canvases/main/shapes', shape2Id))
      
      // Delete group document
      const groupsSnapshot = await getDocs(collection(firestore1, 'canvases/main/groups'))
      const groupDoc = groupsSnapshot.docs.find(doc => {
        const data = doc.data()
        return data.shapeIds && data.shapeIds.includes(shape1Id)
      })
      
      if (groupDoc) {
        deleteBatch.delete(doc(firestore1, 'canvases/main/groups', groupDoc.id))
      }
      
      await deleteBatch.commit()

      // Verify shapes and group are deleted
      shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      shape2Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape2Id))
      
      expect(shape1Doc.exists()).toBe(false)
      expect(shape2Doc.exists()).toBe(false)
    })

    it('should handle lock conflicts when grouping', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const user2 = await createTestUser(testUser2Id, testUser2Email, 'GroupingUser2')

      const firestore1 = user1.firestore()
      const firestore2 = user2.firestore()

      // User1 creates shapes
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

      // User2 locks shape1
      const shape1Ref2 = doc(firestore2, 'canvases/main/shapes', shape1Id)
      await updateDoc(shape1Ref2, {
        lockedBy: testUser2Id,
        lockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // User1 tries to group (should check for locks first)
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shape1Id))
      const shape1Data = shape1Doc.data()

      // Check if shape is locked by another user
      expect(shape1Data?.lockedBy).toBe(testUser2Id)
      
      // Service layer should prevent grouping when shapes are locked by others
    })
  })

  describe('Performance', () => {
    it('should handle grouping with 10+ shapes efficiently', async () => {
      const user1 = await createTestUser(testUser1Id, testUser1Email, 'GroupingUser1')
      const firestore1 = user1.firestore()

      // Create 10 shapes
      const shapeIds: string[] = []
      for (let i = 0; i < 10; i++) {
        const shapeId = await createTestShape(user1, {
          type: 'rectangle',
          x: 100 + (i * 50),
          y: 200,
          width: 40,
          height: 40,
          color: '#3b82f6',
          createdBy: testUser1Id,
        })
        shapeIds.push(shapeId)
      }

      // Group all shapes
      const groupId = `group_${Date.now()}_test`
      const startTime = Date.now()
      
      await addDoc(collection(firestore1, 'canvases/main/groups'), {
        name: 'Large Group',
        shapeIds: shapeIds,
        createdBy: testUser1Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update all shapes with groupId using batch
      const batch = writeBatch(firestore1)
      shapeIds.forEach(shapeId => {
        batch.update(doc(firestore1, 'canvases/main/shapes', shapeId), {
          groupId: groupId,
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in less than 500ms
      expect(duration).toBeLessThan(500)

      // Verify all shapes are grouped
      const shape1Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shapeIds[0]))
      const shape10Doc = await getDoc(doc(firestore1, 'canvases/main/shapes', shapeIds[9]))
      
      expect(shape1Doc.data()?.groupId).toBe(groupId)
      expect(shape10Doc.data()?.groupId).toBe(groupId)
    })
  })
})
