/**
 * Unit tests for layout calculator utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateRowLayout, 
  calculateEvenSpacing, 
  calculateAlignment,
  calculateGridLayout,
  validateLayoutInput,
  calculateOptimalSpacing,
  type Shape,
  type PositionUpdate
} from '../../../src/utils/layoutCalculator';
import { Timestamp } from 'firebase/firestore';

describe('Layout Calculator', () => {
  const mockShapes: Shape[] = [
    {
      id: 'shape1',
      type: 'rectangle',
      x: 100,
      y: 200,
      width: 100,
      height: 80,
      color: '#3b82f6',
      zIndex: 1,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'shape2',
      type: 'circle',
      x: 300,
      y: 200,
      width: 80,
      height: 80,
      radius: 40,
      color: '#ef4444',
      zIndex: 2,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'shape3',
      type: 'triangle',
      x: 500,
      y: 200,
      width: 120,
      height: 100,
      color: '#10b981',
      zIndex: 3,
      createdBy: 'user1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  describe('calculateRowLayout', () => {
    it('should arrange shapes in a horizontal row with equal spacing', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      const spacing = 20;
      
      const result = calculateRowLayout(shapeIds, mockShapes, spacing);
      
      expect(result).toHaveLength(3);
      
      // Check that shapes are positioned in a row
      expect(result[0].id).toBe('shape1'); // First shape (sorted by x)
      expect(result[1].id).toBe('shape2');
      expect(result[2].id).toBe('shape3');
      
      // Check that shapes maintain their y position
      expect(result[0].y).toBe(200);
      expect(result[1].y).toBe(200);
      expect(result[2].y).toBe(200);
      
      // Check that shapes are spaced correctly
      const totalWidth = 100 + 20 + 80 + 20 + 120; // shape1 + spacing + shape2 + spacing + shape3
      const expectedStartX = (5000 - totalWidth) / 2;
      
      expect(result[0].x).toBeCloseTo(expectedStartX, 0);
      expect(result[1].x).toBeCloseTo(expectedStartX + 100 + 20, 0);
      expect(result[2].x).toBeCloseTo(expectedStartX + 100 + 20 + 80 + 20, 0);
    });

    it('should handle minimum shapes requirement', () => {
      expect(() => {
        calculateRowLayout(['shape1'], mockShapes, 20);
      }).toThrow('At least 2 shapes are required for row layout');
    });

    it('should handle missing shapes', () => {
      expect(() => {
        calculateRowLayout(['shape1', 'nonexistent'], mockShapes, 20);
      }).toThrow('One or more shapes not found');
    });
  });

  describe('calculateEvenSpacing', () => {
    it('should space shapes evenly horizontally', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      
      const result = calculateEvenSpacing(shapeIds, mockShapes, 'horizontal');
      
      expect(result).toHaveLength(3);
      
      // Check that shapes maintain their y position
      expect(result[0].y).toBe(200);
      expect(result[1].y).toBe(200);
      expect(result[2].y).toBe(200);
      
      // Check that shapes are spaced evenly
      const spacing1 = result[1].x - (result[0].x + 100); // gap between shape1 and shape2
      const spacing2 = result[2].x - (result[1].x + 80); // gap between shape2 and shape3
      
      expect(spacing1).toBeCloseTo(spacing2, 0);
    });

    it('should space shapes evenly vertically', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      
      const result = calculateEvenSpacing(shapeIds, mockShapes, 'vertical');
      
      expect(result).toHaveLength(3);
      
      // Check that shapes maintain their x position
      expect(result[0].x).toBe(100);
      expect(result[1].x).toBe(300);
      expect(result[2].x).toBe(500);
      
      // Check that shapes are spaced evenly vertically
      const spacing1 = result[1].y - (result[0].y + 80); // gap between shape1 and shape2
      const spacing2 = result[2].y - (result[1].y + 80); // gap between shape2 and shape3
      
      expect(spacing1).toBeCloseTo(spacing2, 0);
    });

    it('should handle minimum shapes requirement', () => {
      expect(() => {
        calculateEvenSpacing(['shape1'], mockShapes, 'horizontal');
      }).toThrow('At least 2 shapes are required for even spacing');
    });
  });

  describe('calculateAlignment', () => {
    it('should align shapes to the left', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      
      const result = calculateAlignment(shapeIds, mockShapes, 'left');
      
      expect(result).toHaveLength(3);
      
      // All shapes should have the same x position (leftmost)
      const leftX = Math.min(...mockShapes.map(s => s.x));
      expect(result[0].x).toBe(leftX);
      expect(result[1].x).toBe(leftX);
      expect(result[2].x).toBe(leftX);
    });

    it('should align shapes to the right', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      
      const result = calculateAlignment(shapeIds, mockShapes, 'right');
      
      expect(result).toHaveLength(3);
      
      // All shapes should have their right edges aligned
      const rightX = Math.max(...mockShapes.map(s => s.x + s.width));
      expect(result[0].x).toBe(rightX - 100); // shape1 width
      expect(result[1].x).toBe(rightX - 80);  // shape2 width
      expect(result[2].x).toBe(rightX - 120); // shape3 width
    });

    it('should align shapes to the center', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      
      const result = calculateAlignment(shapeIds, mockShapes, 'center');
      
      expect(result).toHaveLength(3);
      
      // All shapes should be centered around the same point
      const totalWidth = Math.max(...mockShapes.map(s => s.x + s.width)) - Math.min(...mockShapes.map(s => s.x));
      const centerX = Math.min(...mockShapes.map(s => s.x)) + totalWidth / 2;
      
      expect(result[0].x).toBeCloseTo(centerX - 100 / 2, 0);
      expect(result[1].x).toBeCloseTo(centerX - 80 / 2, 0);
      expect(result[2].x).toBeCloseTo(centerX - 120 / 2, 0);
    });

    it('should handle invalid alignment', () => {
      expect(() => {
        calculateAlignment(['shape1', 'shape2'], mockShapes, 'invalid');
      }).toThrow('Invalid alignment: invalid');
    });
  });

  describe('calculateGridLayout', () => {
    it('should arrange shapes in a grid', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      const columns = 2;
      const spacing = 20;
      
      const result = calculateGridLayout(shapeIds, mockShapes, columns, spacing);
      
      expect(result).toHaveLength(3);
      
      // Check that shapes are positioned in a grid
      // shape1 should be at (0, 0) in grid
      // shape2 should be at (1, 0) in grid  
      // shape3 should be at (0, 1) in grid
      
      const maxWidth = Math.max(...mockShapes.map(s => s.width));
      const maxHeight = Math.max(...mockShapes.map(s => s.height));
      const cellWidth = maxWidth + spacing;
      const cellHeight = maxHeight + spacing;
      
      // Calculate expected positions
      const gridWidth = columns * cellWidth - spacing;
      const gridHeight = Math.ceil(3 / columns) * cellHeight - spacing;
      const startX = Math.max(0, (5000 - gridWidth) / 2);
      const startY = Math.max(0, (5000 - gridHeight) / 2);
      
      expect(result[0].x).toBeCloseTo(startX, 0);
      expect(result[1].x).toBeCloseTo(startX + cellWidth, 0);
      expect(result[2].x).toBeCloseTo(startX, 0);
      
      expect(result[0].y).toBeCloseTo(startY, 0);
      expect(result[1].y).toBeCloseTo(startY, 0);
      expect(result[2].y).toBeCloseTo(startY + cellHeight, 0);
    });
  });

  describe('validateLayoutInput', () => {
    it('should validate minimum shapes requirement', () => {
      expect(() => {
        validateLayoutInput(['shape1'], mockShapes, 2, 50);
      }).toThrow('At least 2 shapes are required');
    });

    it('should validate maximum shapes requirement', () => {
      const manyShapes = Array.from({ length: 51 }, (_, i) => `shape${i}`);
      expect(() => {
        validateLayoutInput(manyShapes, mockShapes, 2, 50);
      }).toThrow('Maximum 50 shapes allowed');
    });

    it('should validate shape existence', () => {
      expect(() => {
        validateLayoutInput(['shape1', 'nonexistent'], mockShapes, 2, 50);
      }).toThrow('One or more shapes not found');
    });
  });

  describe('calculateOptimalSpacing', () => {
    it('should calculate optimal horizontal spacing', () => {
      const result = calculateOptimalSpacing(mockShapes, 'horizontal');
      
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(200);
    });

    it('should calculate optimal vertical spacing', () => {
      const result = calculateOptimalSpacing(mockShapes, 'vertical');
      
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(200);
    });

    it('should return default spacing for single shape', () => {
      const singleShape = [mockShapes[0]];
      const result = calculateOptimalSpacing(singleShape, 'horizontal');
      
      expect(result).toBe(20);
    });
  });
});
