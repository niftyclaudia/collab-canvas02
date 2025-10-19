import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasService } from '../../../src/services/canvasService';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore } from '../../../src/firebase';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn()
  }))
}));

vi.mock('../../../src/firebase', () => ({
  firestore: {}
}));

describe('CanvasService - Z-Index Methods', () => {
  let canvasService: CanvasService;
  const mockCanvasId = 'test-canvas-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    canvasService = new CanvasService(mockCanvasId, mockUserId);
  });

  describe('getZIndexRange', () => {
    it('should return default range when no shapes exist', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const result = await canvasService.getZIndexRange();
      
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('should return correct range when shapes exist', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2', zIndex: 5 },
        { id: 'shape3', zIndex: 15 }
      ];
      
      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => ({ zIndex: shape.zIndex })
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const result = await canvasService.getZIndexRange();
      
      expect(result).toEqual({ min: 5, max: 15 });
    });

    it('should handle shapes without zIndex', async () => {
      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2' }, // no zIndex
        { id: 'shape3', zIndex: 5 }
      ];
      
      const mockQuerySnapshot = {
        empty: false,
        docs: mockShapes.map(shape => ({
          id: shape.id,
          data: () => ({ zIndex: shape.zIndex })
        }))
      };
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      const result = await canvasService.getZIndexRange();
      
      expect(result).toEqual({ min: 0, max: 10 });
    });
  });

  describe('bringToFront', () => {
    it('should update shape zIndex to max + 1', async () => {
      const shapeId = 'test-shape-id';
      const mockZIndexRange = { min: 5, max: 15 };
      
      // Mock getZIndexRange
      vi.spyOn(canvasService, 'getZIndexRange').mockResolvedValue(mockZIndexRange);
      
      // Mock updateShape
      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.bringToFront(shapeId);

      expect(updateShapeSpy).toHaveBeenCalledWith(shapeId, { zIndex: 16 });
    });

    it('should throw error when getZIndexRange fails', async () => {
      const shapeId = 'test-shape-id';
      const error = new Error('Failed to get z-index range');
      
      vi.spyOn(canvasService, 'getZIndexRange').mockRejectedValue(error);

      await expect(canvasService.bringToFront(shapeId)).rejects.toThrow('Failed to get z-index range');
    });
  });

  describe('sendToBack', () => {
    it('should update shape zIndex to min - 1', async () => {
      const shapeId = 'test-shape-id';
      const mockZIndexRange = { min: 5, max: 15 };
      
      vi.spyOn(canvasService, 'getZIndexRange').mockResolvedValue(mockZIndexRange);
      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.sendToBack(shapeId);

      expect(updateShapeSpy).toHaveBeenCalledWith(shapeId, { zIndex: 4 });
    });
  });

  describe('bringForward', () => {
    it('should swap zIndex with next higher shape', async () => {
      const shapeId = 'test-shape-id';
      const currentZIndex = 10;
      
      // Mock getDoc for current shape
      const mockShapeDoc = {
        exists: () => true,
        id: shapeId,
        data: () => ({ zIndex: currentZIndex })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      // Mock getShapes to return shapes with higher zIndex
      const mockShapes = [
        { id: 'shape1', zIndex: 5 },
        { id: 'shape2', zIndex: 12 }, // next higher
        { id: 'shape3', zIndex: 15 }
      ];
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);

      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.bringForward(shapeId);

      expect(updateShapeSpy).toHaveBeenCalledTimes(2);
      expect(updateShapeSpy).toHaveBeenCalledWith(shapeId, { zIndex: 12 });
      expect(updateShapeSpy).toHaveBeenCalledWith('shape2', { zIndex: 10 });
    });

    it('should call bringToFront when already at front', async () => {
      const shapeId = 'test-shape-id';
      const currentZIndex = 15;
      
      const mockShapeDoc = {
        exists: () => true,
        id: shapeId,
        data: () => ({ zIndex: currentZIndex })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      const mockShapes = [
        { id: 'shape1', zIndex: 5 },
        { id: 'shape2', zIndex: 10 }
      ];
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);
      
      const bringToFrontSpy = vi.spyOn(canvasService, 'bringToFront').mockResolvedValue();

      await canvasService.bringForward(shapeId);

      expect(bringToFrontSpy).toHaveBeenCalledWith(shapeId);
    });

    it('should throw error when shape does not exist', async () => {
      const shapeId = 'non-existent-shape';
      
      const mockShapeDoc = {
        exists: () => false
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      await expect(canvasService.bringForward(shapeId)).rejects.toThrow('Shape not found');
    });
  });

  describe('sendBackward', () => {
    it('should swap zIndex with next lower shape', async () => {
      const shapeId = 'test-shape-id';
      const currentZIndex = 10;
      
      const mockShapeDoc = {
        exists: () => true,
        id: shapeId,
        data: () => ({ zIndex: currentZIndex })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      const mockShapes = [
        { id: 'shape1', zIndex: 5 },
        { id: 'shape2', zIndex: 8 }, // next lower
        { id: 'shape3', zIndex: 15 }
      ];
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);

      const updateShapeSpy = vi.spyOn(canvasService, 'updateShape').mockResolvedValue();

      await canvasService.sendBackward(shapeId);

      expect(updateShapeSpy).toHaveBeenCalledTimes(2);
      expect(updateShapeSpy).toHaveBeenCalledWith(shapeId, { zIndex: 8 });
      expect(updateShapeSpy).toHaveBeenCalledWith('shape2', { zIndex: 10 });
    });

    it('should call sendToBack when already at back', async () => {
      const shapeId = 'test-shape-id';
      const currentZIndex = 5;
      
      const mockShapeDoc = {
        exists: () => true,
        id: shapeId,
        data: () => ({ zIndex: currentZIndex })
      };
      (getDoc as any).mockResolvedValue(mockShapeDoc);

      const mockShapes = [
        { id: 'shape1', zIndex: 10 },
        { id: 'shape2', zIndex: 15 }
      ];
      vi.spyOn(canvasService, 'getShapes').mockResolvedValue(mockShapes as any);
      
      const sendToBackSpy = vi.spyOn(canvasService, 'sendToBack').mockResolvedValue();

      await canvasService.sendBackward(shapeId);

      expect(sendToBackSpy).toHaveBeenCalledWith(shapeId);
    });
  });
});