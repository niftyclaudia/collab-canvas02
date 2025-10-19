import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';
import { firestore } from '../../../src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  firestore: {}
}));

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn()
  }))
}));

describe('CanvasService Z-Index Unit Tests', () => {
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

  describe('getZIndexRange', () => {
    it('should return correct z-index range for multiple shapes', async () => {
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 5 },
        { id: 'shape-3', zIndex: 3 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      mockGetShapes.mockResolvedValue(mockShapes);

      const range = await canvasService.getZIndexRange();

      expect(range).toEqual({ min: 1, max: 5 });
    });

    it('should handle shapes with undefined zIndex', async () => {
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2' }, // No zIndex
        { id: 'shape-3', zIndex: 3 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      mockGetShapes.mockResolvedValue(mockShapes);

      const range = await canvasService.getZIndexRange();

      expect(range).toEqual({ min: 0, max: 3 });
    });

    it('should return default range for empty shapes array', async () => {
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      mockGetShapes.mockResolvedValue([]);

      const range = await canvasService.getZIndexRange();

      expect(range).toEqual({ min: 0, max: 0 });
    });
  });

  describe('bringToFront', () => {
    it('should update shape z-index to max + 1', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 0, max: 5 });
      mockUpdateShape.mockResolvedValue(undefined);

      await canvasService.bringToFront(mockShapeId);

      expect(mockGetZIndexRange).toHaveBeenCalled();
      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 6 });
    });

    it('should handle error in getZIndexRange', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      mockGetZIndexRange.mockRejectedValue(new Error('Database error'));

      await expect(canvasService.bringToFront(mockShapeId)).rejects.toThrow('Database error');
    });
  });

  describe('sendToBack', () => {
    it('should update shape z-index to min - 1', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 2, max: 5 });
      mockUpdateShape.mockResolvedValue(undefined);

      await canvasService.sendToBack(mockShapeId);

      expect(mockGetZIndexRange).toHaveBeenCalled();
      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 1 });
    });
  });

  describe('bringForward', () => {
    it('should swap z-index with next higher shape', async () => {
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 3 },
        { id: mockShapeId, zIndex: 2 },
        { id: 'shape-4', zIndex: 4 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      const mockGetDoc = vi.fn();
      
      mockGetShapes.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ zIndex: 2 })
      });
      
      // Mock the getDoc function
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await canvasService.bringForward(mockShapeId);

      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 3 });
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-2', { zIndex: 2 });
    });

    it('should call bringToFront when already at front', async () => {
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 2 },
        { id: mockShapeId, zIndex: 5 } // Highest z-index
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      const mockBringToFront = vi.spyOn(canvasService, 'bringToFront');
      const mockGetDoc = vi.fn();
      
      mockGetShapes.mockResolvedValue(mockShapes);
      mockBringToFront.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ zIndex: 5 })
      });
      
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await canvasService.bringForward(mockShapeId);

      expect(mockBringToFront).toHaveBeenCalledWith(mockShapeId);
    });

    it('should handle shape not found', async () => {
      const mockGetDoc = vi.fn();
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });
      
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await expect(canvasService.bringForward(mockShapeId)).rejects.toThrow('Shape not found');
    });
  });

  describe('sendBackward', () => {
    it('should swap z-index with next lower shape', async () => {
      const mockShapes = [
        { id: 'shape-1', zIndex: 1 },
        { id: 'shape-2', zIndex: 2 },
        { id: mockShapeId, zIndex: 3 },
        { id: 'shape-4', zIndex: 4 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      const mockGetDoc = vi.fn();
      
      mockGetShapes.mockResolvedValue(mockShapes);
      mockUpdateShape.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ zIndex: 3 })
      });
      
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await canvasService.sendBackward(mockShapeId);

      expect(mockUpdateShape).toHaveBeenCalledWith(mockShapeId, { zIndex: 2 });
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-2', { zIndex: 3 });
    });

    it('should call sendToBack when already at back', async () => {
      const mockShapes = [
        { id: mockShapeId, zIndex: 1 }, // Lowest z-index
        { id: 'shape-2', zIndex: 2 },
        { id: 'shape-3', zIndex: 3 }
      ];
      
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      const mockSendToBack = vi.spyOn(canvasService, 'sendToBack');
      const mockGetDoc = vi.fn();
      
      mockGetShapes.mockResolvedValue(mockShapes);
      mockSendToBack.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ zIndex: 1 })
      });
      
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await canvasService.sendBackward(mockShapeId);

      expect(mockSendToBack).toHaveBeenCalledWith(mockShapeId);
    });
  });

  describe('Error Handling', () => {
    it('should handle updateShape errors in bringToFront', async () => {
      const mockGetZIndexRange = vi.spyOn(canvasService, 'getZIndexRange');
      const mockUpdateShape = vi.spyOn(canvasService, 'updateShape');
      
      mockGetZIndexRange.mockResolvedValue({ min: 0, max: 5 });
      mockUpdateShape.mockRejectedValue(new Error('Update failed'));

      await expect(canvasService.bringToFront(mockShapeId)).rejects.toThrow('Update failed');
    });

    it('should handle getShapes errors in bringForward', async () => {
      const mockGetShapes = vi.spyOn(canvasService, 'getShapes');
      const mockGetDoc = vi.fn();
      
      mockGetShapes.mockRejectedValue(new Error('Database error'));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ zIndex: 2 })
      });
      
      vi.mocked(getDoc).mockResolvedValue(mockGetDoc());

      await expect(canvasService.bringForward(mockShapeId)).rejects.toThrow('Database error');
    });
  });
});
