import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CanvasService } from '../../src/services/canvasService';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore } from '../../src/firebase';

// Mock Firebase for integration testing
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn()
};

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
}));

vi.mock('../../src/firebase', () => ({
  firestore: mockFirestore
}));

describe('Z-Index Integration Tests', () => {
  let canvasService: CanvasService;
  const mockCanvasId = 'test-canvas-integration';
  const mockUserId = 'test-user-integration';

  beforeEach(() => {
    vi.clearAllMocks();
    canvasService = new CanvasService(mockCanvasId, mockUserId);
  });

  afterEach(() => {
    // Clean up any test data
  });

  describe('Z-Index Operations Flow', () => {
    it('should handle complete z-index workflow', async () => {
      // Mock initial shapes with different z-indexes
      const mockShapes = [
        { id: 'shape1', zIndex: 10, type: 'rectangle', x: 0, y: 0, width: 100, height: 100, color: 'red' },
        { id: 'shape2', zIndex: 20, type: 'circle', x: 50, y: 50, radius: 50, color: 'blue' },
        { id: 'shape3', zIndex: 30, type: 'triangle', x: 100, y: 100, width: 80, height: 80, color: 'green' }
      ];

      // Mock getDocs for getZIndexRange
      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => shape
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      // Test getZIndexRange
      const zIndexRange = await canvasService.getZIndexRange();
      expect(zIndexRange).toEqual({ min: 10, max: 30 });

      // Test bringToFront
      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();
      await canvasService.bringToFront('shape1');
      expect(updateShapeSpy).toHaveBeenCalledWith('shape1', { zIndex: 31 });

      // Test sendToBack
      await canvasService.sendToBack('shape3');
      expect(updateShapeSpy).toHaveBeenCalledWith('shape3', { zIndex: 9 });
    });

    it('should handle bringForward with shape swapping', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2', zIndex: 20 },
        { id: 'shape3', zIndex: 30 }
      ];

      // Mock getDoc for current shape
      const mockShapeDoc = {
        exists: () => true,
        id: 'shape1',
        data: () => ({ zIndex: 10 })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      // Mock getShapes
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);

      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.bringForward('shape1');

      // Should swap with shape2 (next higher)
      expect(updateShapeSpy).toHaveBeenCalledTimes(2);
      expect(updateShapeSpy).toHaveBeenCalledWith('shape1', { zIndex: 20 });
      expect(updateShapeSpy).toHaveBeenCalledWith('shape2', { zIndex: 10 });
    });

    it('should handle sendBackward with shape swapping', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2', zIndex: 20 },
        { id: 'shape3', zIndex: 30 }
      ];

      // Mock getDoc for current shape
      const mockShapeDoc = {
        exists: () => true,
        id: 'shape3',
        data: () => ({ zIndex: 30 })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      // Mock getShapes
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);

      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.sendBackward('shape3');

      // Should swap with shape2 (next lower)
      expect(updateShapeSpy).toHaveBeenCalledTimes(2);
      expect(updateShapeSpy).toHaveBeenCalledWith('shape3', { zIndex: 20 });
      expect(updateShapeSpy).toHaveBeenCalledWith('shape2', { zIndex: 30 });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (getDocs as any).mockRejectedValue(networkError);

      await expect(canvasService.getZIndexRange()).rejects.toThrow('Network error');
    });

    it('should handle invalid shape IDs', async () => {
      const mockShapeDoc = {
        exists: () => false
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      await expect(canvasService.bringForward('invalid-shape')).rejects.toThrow('Shape not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty canvas', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const zIndexRange = await canvasService.getZIndexRange();
      expect(zIndexRange).toEqual({ min: 0, max: 0 });
    });

    it('should handle shapes with undefined zIndex', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2' }, // no zIndex
        { id: 'shape3', zIndex: 30 }
      ];

      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => shape
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const zIndexRange = await canvasService.getZIndexRange();
      expect(zIndexRange).toEqual({ min: 0, max: 30 });
    });

    it('should handle single shape', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 15 }
      ];

      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => shape
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const zIndexRange = await canvasService.getZIndexRange();
      expect(zIndexRange).toEqual({ min: 15, max: 15 });
    });
  });

  describe('Performance', () => {
    it('should handle large number of shapes efficiently', async () => {
      // Create 100 shapes with different z-indexes
      const mockShapes = Array.from({ length: 100 }, (_, i) => ({
        id: `shape${i}`,
        zIndex: i + 1
      }));

      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => shape
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const startTime = Date.now();
      const zIndexRange = await canvasService.getZIndexRange();
      const endTime = Date.now();

      expect(zIndexRange).toEqual({ min: 1, max: 100 });
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});