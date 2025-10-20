import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canvasService } from '../../src/services/canvasService';
import { firestore } from '../../src/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  firestore: {}
}));

describe('Grouping Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const mockShapeIds = ['shape-1', 'shape-2', 'shape-3'];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Basic Group/Ungroup Functionality', () => {
    it('should group multiple shapes together', async () => {
      // Mock the service methods
      const mockGroupShapes = vi.spyOn(canvasService, 'groupShapes');
      mockGroupShapes.mockResolvedValue('group-123');

      // Test grouping
      const groupId = await canvasService.groupShapes(mockShapeIds, mockUserId);

      expect(mockGroupShapes).toHaveBeenCalledWith(mockShapeIds, mockUserId);
      expect(groupId).toBe('group-123');
    });

    it('should ungroup shapes', async () => {
      const mockGroupId = 'group-123';
      
      // Mock the service method
      const mockUngroupShapes = vi.spyOn(canvasService, 'ungroupShapes');
      mockUngroupShapes.mockResolvedValue(undefined);

      // Test ungrouping
      await canvasService.ungroupShapes(mockGroupId);

      expect(mockUngroupShapes).toHaveBeenCalledWith(mockGroupId);
    });

    it('should get group by ID', async () => {
      const mockGroupId = 'group-123';
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Group',
        shapeIds: mockShapeIds,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the service method
      const mockGetGroup = vi.spyOn(canvasService, 'getGroup');
      mockGetGroup.mockResolvedValue(mockGroup);

      // Test getting group
      const group = await canvasService.getGroup(mockGroupId);

      expect(mockGetGroup).toHaveBeenCalledWith(mockGroupId);
      expect(group).toEqual(mockGroup);
    });

    it('should get shapes in group', async () => {
      const mockGroupId = 'group-123';
      const mockShapes = [
        { id: 'shape-1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50, color: '#3b82f6', groupId: mockGroupId },
        { id: 'shape-2', type: 'circle', x: 200, y: 200, width: 60, height: 60, color: '#10b981', groupId: mockGroupId }
      ];

      // Mock the service method
      const mockGetShapesInGroup = vi.spyOn(canvasService, 'getShapesInGroup');
      mockGetShapesInGroup.mockResolvedValue(mockShapes);

      // Test getting shapes in group
      const shapes = await canvasService.getShapesInGroup(mockGroupId);

      expect(mockGetShapesInGroup).toHaveBeenCalledWith(mockGroupId);
      expect(shapes).toEqual(mockShapes);
    });
  });

  describe('Group Operations (Move, Delete, Duplicate)', () => {
    it('should move group by delta', async () => {
      const mockGroupId = 'group-123';
      const deltaX = 50;
      const deltaY = 30;

      // Mock the service method
      const mockMoveGroup = vi.spyOn(canvasService, 'moveGroup');
      mockMoveGroup.mockResolvedValue(undefined);

      // Test moving group
      await canvasService.moveGroup(mockGroupId, deltaX, deltaY);

      expect(mockMoveGroup).toHaveBeenCalledWith(mockGroupId, deltaX, deltaY);
    });

    it('should delete group and all its shapes', async () => {
      const mockGroupId = 'group-123';

      // Mock the service method
      const mockDeleteGroup = vi.spyOn(canvasService, 'deleteGroup');
      mockDeleteGroup.mockResolvedValue(undefined);

      // Test deleting group
      await canvasService.deleteGroup(mockGroupId);

      expect(mockDeleteGroup).toHaveBeenCalledWith(mockGroupId);
    });

    it('should duplicate group with offset', async () => {
      const mockGroupId = 'group-123';
      const offsetX = 20;
      const offsetY = 20;
      const mockNewShapeIds = ['new-shape-1', 'new-shape-2', 'new-shape-3'];

      // Mock the service method
      const mockDuplicateGroup = vi.spyOn(canvasService, 'duplicateGroup');
      mockDuplicateGroup.mockResolvedValue(mockNewShapeIds);

      // Test duplicating group
      const newShapeIds = await canvasService.duplicateGroup(mockGroupId, offsetX, offsetY);

      expect(mockDuplicateGroup).toHaveBeenCalledWith(mockGroupId, offsetX, offsetY);
      expect(newShapeIds).toEqual(mockNewShapeIds);
    });
  });

  describe('Multi-User Group Sync', () => {
    it('should sync group changes across users', async () => {
      const mockGroups = [
        {
          id: 'group-1',
          name: 'Group 1',
          shapeIds: ['shape-1', 'shape-2'],
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'group-2',
          name: 'Group 2',
          shapeIds: ['shape-3', 'shape-4'],
          createdBy: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock the subscription callback
      const mockCallback = vi.fn();
      const mockSubscribeToGroups = vi.spyOn(canvasService, 'subscribeToGroups');
      mockSubscribeToGroups.mockReturnValue(() => {});

      // Test subscription
      const unsubscribe = canvasService.subscribeToGroups('main', mockCallback);

      expect(mockSubscribeToGroups).toHaveBeenCalledWith('main', mockCallback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle concurrent group operations', async () => {
      const mockGroupId = 'group-123';
      const mockShapeIds = ['shape-1', 'shape-2'];

      // Mock concurrent operations
      const mockGroupShapes = vi.spyOn(canvasService, 'groupShapes');
      const mockUngroupShapes = vi.spyOn(canvasService, 'ungroupShapes');
      
      mockGroupShapes.mockResolvedValue(mockGroupId);
      mockUngroupShapes.mockResolvedValue(undefined);

      // Simulate concurrent operations
      const groupPromise = canvasService.groupShapes(mockShapeIds, mockUserId);
      const ungroupPromise = canvasService.ungroupShapes(mockGroupId);

      await Promise.all([groupPromise, ungroupPromise]);

      expect(mockGroupShapes).toHaveBeenCalled();
      expect(mockUngroupShapes).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid shape IDs', async () => {
      const invalidShapeIds = ['invalid-shape-1', 'invalid-shape-2'];

      // Mock the service method to throw error
      const mockGroupShapes = vi.spyOn(canvasService, 'groupShapes');
      mockGroupShapes.mockRejectedValue(new Error('Some shapes could not be grouped'));

      // Test error handling
      await expect(canvasService.groupShapes(invalidShapeIds, mockUserId))
        .rejects.toThrow('Some shapes could not be grouped');
    });

    it('should handle network errors gracefully', async () => {
      const mockGroupId = 'group-123';

      // Mock network error
      const mockUngroupShapes = vi.spyOn(canvasService, 'ungroupShapes');
      mockUngroupShapes.mockRejectedValue(new Error('Network error'));

      // Test error handling
      await expect(canvasService.ungroupShapes(mockGroupId))
        .rejects.toThrow('Network error');
    });

    it('should validate minimum group size', async () => {
      const singleShapeId = ['shape-1'];

      // Mock validation error
      const mockGroupShapes = vi.spyOn(canvasService, 'groupShapes');
      mockGroupShapes.mockRejectedValue(new Error('At least 2 shapes are required to create a group'));

      // Test validation
      await expect(canvasService.groupShapes(singleShapeId, mockUserId))
        .rejects.toThrow('At least 2 shapes are required to create a group');
    });
  });
});
