import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canvasService } from '../../src/services/canvasService';
import { firestore } from '../../src/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  firestore: {}
}));

describe('Z-Index Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const mockShapeId = 'shape-123';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Basic Z-Index Operations', () => {
    it('should bring shape to front', async () => {
      // Mock the service methods
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 0, max: 5 });
      mockUpdateShape.mockResolvedValue(undefined);

      // Test bring to front
      await canvasService.bringToFront(mockShapeId);

      expect(mockGetZIndexRange).toHaveBeenCalled();
      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 6 });
    });

    it('should send shape to back', async () => {
      // Mock the service methods
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 0, max: 5 });
      mockUpdateShape.mockResolvedValue(undefined);

      // Test send to back
      await canvasService.sendToBack(mockShapeId);

      expect(mockGetZIndexRange).toHaveBeenCalled();
      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: -1 });
    });

    it('should bring shape forward one layer', async () => {
      // Mock the service methods
      const mockGetDoc = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      // Mock shapes with different z-indexes
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 3 },
        { id: mockShapeId, zIndex: 2 },
        { id: 'shape-4', zIndex: 4 }
      ];
      
      mockGetDoc.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);

      // Test bring forward
      await canvasService.bringForward(mockShapeId);

      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 3 });
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-2', { zIndex: 2 });
    });

    it('should send shape backward one layer', async () => {
      // Mock the service methods
      const mockGetDoc = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      // Mock shapes with different z-indexes
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 2 },
        { id: mockShapeId, zIndex: 3 },
        { id: 'shape-4', zIndex: 4 }
      ];
      
      mockGetDoc.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);

      // Test send backward
      await canvasService.sendBackward(mockShapeId);

      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 2 });
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-2', { zIndex: 3 });
    });
  });

  describe('Z-Index Range Operations', () => {
    it('should get z-index range correctly', async () => {
      // Mock shapes with different z-indexes
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 5 },
        { id: 'shape-3', zIndex: 3 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      mockGetShapes.mockResolvedValue(mockShapes);

      // Test get z-index range
      const range = await canvasService.getZIndexRange();

      expect(range).toEqual({ min: 1, max: 5 });
    });

    it('should handle empty shapes array', async () => {
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      mockGetShapes.mockResolvedValue([]);

      // Test get z-index range with empty array
      const range = await canvasService.getZIndexRange();

      expect(range).toEqual({ min: 0, max: 0 });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid shape ID in bring to front', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 0, max: 5 });
      mockUpdateShape.mockRejectedValue(new Error('Shape not found'));

      // Test error handling
      await expect(canvasService.bringToFront('invalid-shape')).rejects.toThrow('Shape not found');
    });

    it('should handle network errors gracefully', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      mockGetZIndexRange.mockRejectedValue(new Error('Network error'));

      // Test error handling
      await expect(canvasService.bringToFront(mockShapeId)).rejects.toThrow('Network error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle shape already at front in bring forward', async () => {
      // Mock the service methods
      const mockGetDoc = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      const mockBringToFront = vi.spyOn(canvasService, 'bringToFront');
      
      // Mock shapes where target shape is already at front
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 2 },
        { id: mockShapeId, zIndex: 5 } // Highest z-index
      ];
      
      mockGetDoc.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);
      mockBringToFront.mockResolvedValue(undefined);

      // Test bring forward when already at front
      await canvasService.bringForward(mockShapeId);

      expect(mockBringToFront).toHaveBeenCalledWith(mockShapeId);
    });

    it('should handle shape already at back in send backward', async () => {
      // Mock the service methods
      const mockGetDoc = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      const mockSendToBack = vi.spyOn(canvasService, 'sendToBack');
      
      // Mock shapes where target shape is already at back
      const mockShapes = [
        { id: mockShapeId, zIndex: 1 }, // Lowest z-index
        { id: 'shape-2', zIndex: 2 },
        { id: 'shape-3', zIndex: 3 }
      ];
      
      mockGetDoc.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);
      mockSendToBack.mockResolvedValue(undefined);

      // Test send backward when already at back
      await canvasService.sendBackward(mockShapeId);

      expect(mockSendToBack).toHaveBeenCalledWith(mockShapeId);
    });
  });
});
