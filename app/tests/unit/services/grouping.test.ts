import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';
import { firestore } from '../../../src/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  firestore: {}
}));

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn()
}));

describe('Grouping Service Unit Tests', () => {
  const mockUserId = 'test-user-123';
  const mockShapeIds = ['shape-1', 'shape-2', 'shape-3'];
  const mockGroupId = 'group-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('groupShapes Method', () => {
    it('should create a group with valid shape IDs', async () => {
      // Mock shape documents
      const mockShapeDocs = mockShapeIds.map(shapeId => ({
        exists: () => true,
        data: () => ({
          id: shapeId,
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          color: '#3b82f6',
          groupId: null,
          createdBy: mockUserId
        })
      }));

      // Mock getDoc calls
      vi.mocked(getDoc).mockImplementation((docRef) => {
        const shapeId = docRef.path.split('/').pop();
        const shapeIndex = mockShapeIds.indexOf(shapeId!);
        return Promise.resolve(mockShapeDocs[shapeIndex]);
      });

      // Mock batch operations
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn()
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Test grouping
      const result = await canvasService.groupShapes(mockShapeIds, mockUserId);

      expect(result).toBeDefined();
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledTimes(mockShapeIds.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should throw error for insufficient shapes', async () => {
      const singleShapeId = ['shape-1'];

      await expect(canvasService.groupShapes(singleShapeId, mockUserId))
        .rejects.toThrow('At least 2 shapes are required to create a group');
    });

    it('should throw error for non-existent shapes', async () => {
      const invalidShapeIds = ['invalid-shape-1', 'invalid-shape-2'];

      // Mock getDoc to return non-existent documents
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      await expect(canvasService.groupShapes(invalidShapeIds, mockUserId))
        .rejects.toThrow('Shape invalid-shape-1 not found');
    });

    it('should throw error for already grouped shapes', async () => {
      // Mock shape documents with existing groupId
      const mockShapeDocs = mockShapeIds.map(shapeId => ({
        exists: () => true,
        data: () => ({
          id: shapeId,
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          color: '#3b82f6',
          groupId: 'existing-group',
          createdBy: mockUserId
        })
      }));

      vi.mocked(getDoc).mockImplementation((docRef) => {
        const shapeId = docRef.path.split('/').pop();
        const shapeIndex = mockShapeIds.indexOf(shapeId!);
        return Promise.resolve(mockShapeDocs[shapeIndex]);
      });

      await expect(canvasService.groupShapes(mockShapeIds, mockUserId))
        .rejects.toThrow('Shape shape-1 is already in a group');
    });
  });

  describe('ungroupShapes Method', () => {
    it('should ungroup shapes successfully', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Group',
        shapeIds: mockShapeIds,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getDoc for group
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockGroup
      } as any);

      // Mock batch operations
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn()
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Test ungrouping
      await canvasService.ungroupShapes(mockGroupId);

      expect(mockBatch.update).toHaveBeenCalledTimes(mockShapeIds.length);
      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should throw error for non-existent group', async () => {
      // Mock getDoc to return non-existent group
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      await expect(canvasService.ungroupShapes(mockGroupId))
        .rejects.toThrow('Group not found');
    });
  });

  describe('getGroup Method', () => {
    it('should return group data for valid group ID', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Group',
        shapeIds: mockShapeIds,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getDoc
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockGroup
      } as any);

      const result = await canvasService.getGroup(mockGroupId);

      expect(result).toEqual({
        id: mockGroupId,
        ...mockGroup
      });
    });

    it('should return null for non-existent group', async () => {
      // Mock getDoc to return non-existent group
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      const result = await canvasService.getGroup(mockGroupId);

      expect(result).toBeNull();
    });
  });

  describe('getShapesInGroup Method', () => {
    it('should return shapes in group', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Group',
        shapeIds: mockShapeIds,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockShapes = mockShapeIds.map(shapeId => ({
        id: shapeId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: '#3b82f6',
        groupId: mockGroupId,
        createdBy: mockUserId
      }));

      // Mock getGroup
      const mockGetGroup = vi.spyOn(canvasService, 'getGroup');
      mockGetGroup.mockResolvedValue(mockGroup as any);

      // Mock getDoc for shapes
      vi.mocked(getDoc).mockImplementation((docRef) => {
        const shapeId = docRef.path.split('/').pop();
        const shapeIndex = mockShapeIds.indexOf(shapeId!);
        return Promise.resolve({
          exists: () => true,
          data: () => mockShapes[shapeIndex]
        });
      });

      const result = await canvasService.getShapesInGroup(mockGroupId);

      expect(result).toEqual(mockShapes);
    });

    it('should return empty array for non-existent group', async () => {
      // Mock getGroup to return null
      const mockGetGroup = vi.spyOn(canvasService, 'getGroup');
      mockGetGroup.mockResolvedValue(null);

      const result = await canvasService.getShapesInGroup(mockGroupId);

      expect(result).toEqual([]);
    });
  });

  describe('moveGroup Method', () => {
    it('should move all shapes in group by delta', async () => {
      const deltaX = 50;
      const deltaY = 30;
      const mockShapes = mockShapeIds.map(shapeId => ({
        id: shapeId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: '#3b82f6',
        groupId: mockGroupId,
        createdBy: mockUserId
      }));

      // Mock getShapesInGroup
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue(mockShapes as any);

      // Mock batch operations
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn()
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      await canvasService.moveGroup(mockGroupId, deltaX, deltaY);

      expect(mockBatch.update).toHaveBeenCalledTimes(mockShapeIds.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should throw error for empty group', async () => {
      // Mock getShapesInGroup to return empty array
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue([]);

      await expect(canvasService.moveGroup(mockGroupId, 50, 30))
        .rejects.toThrow('Group is empty');
    });
  });

  describe('deleteGroup Method', () => {
    it('should delete all shapes in group and group document', async () => {
      const mockShapes = mockShapeIds.map(shapeId => ({
        id: shapeId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: '#3b82f6',
        groupId: mockGroupId,
        createdBy: mockUserId
      }));

      // Mock getShapesInGroup
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue(mockShapes as any);

      // Mock batch operations
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn()
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      await canvasService.deleteGroup(mockGroupId);

      expect(mockBatch.delete).toHaveBeenCalledTimes(mockShapeIds.length + 1); // +1 for group document
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('duplicateGroup Method', () => {
    it('should duplicate all shapes in group with offset', async () => {
      const offsetX = 20;
      const offsetY = 20;
      const mockShapes = mockShapeIds.map(shapeId => ({
        id: shapeId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: '#3b82f6',
        groupId: mockGroupId,
        createdBy: mockUserId
      }));

      // Mock getShapesInGroup
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue(mockShapes as any);

      // Mock createShape
      const mockCreateShape = vi.spyOn(canvasService, 'createShape');
      const newShapeIds = ['new-shape-1', 'new-shape-2', 'new-shape-3'];
      mockCreateShape.mockImplementation((shapeData) => {
        const index = mockShapes.findIndex(s => s.type === shapeData.type);
        return Promise.resolve({
          id: newShapeIds[index],
          ...shapeData
        } as any);
      });

      const result = await canvasService.duplicateGroup(mockGroupId, offsetX, offsetY);

      expect(result).toEqual(newShapeIds);
      expect(mockCreateShape).toHaveBeenCalledTimes(mockShapeIds.length);
    });

    it('should throw error for empty group', async () => {
      // Mock getShapesInGroup to return empty array
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue([]);

      await expect(canvasService.duplicateGroup(mockGroupId, 20, 20))
        .rejects.toThrow('Group is empty');
    });
  });

  describe('subscribeToGroups Method', () => {
    it('should set up groups subscription', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      // Mock onSnapshot
      vi.mocked(require('firebase/firestore').onSnapshot).mockReturnValue(mockUnsubscribe);

      const unsubscribe = canvasService.subscribeToGroups('main', mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });
  });
});
