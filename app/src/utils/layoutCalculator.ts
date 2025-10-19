/**
 * Layout Calculator Utilities
 * 
 * Provides layout calculation algorithms for AI layout commands
 * including row arrangement, even spacing, and alignment operations.
 */

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  color: string;
  rotation?: number;
  zIndex: number;
  groupId?: string | null;
  createdBy: string;
  createdAt: any;
  lockedBy?: string | null;
  lockedAt?: any | null;
  editingBy?: string | null;
  editingAt?: any | null;
  updatedAt: any;
}

export interface PositionUpdate {
  id: string;
  x: number;
  y: number;
}

export interface ShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate horizontal row layout for shapes
 * @param shapeIds - Array of shape IDs to arrange
 * @param shapes - Array of all shapes
 * @param spacing - Spacing between shapes (default 20px)
 * @returns Array of position updates
 */
export function calculateRowLayout(
  shapeIds: string[], 
  shapes: Shape[], 
  spacing: number = 20
): PositionUpdate[] {
  // Validate input
  if (!shapeIds || shapeIds.length < 2) {
    throw new Error('At least 2 shapes are required for row layout');
  }

  // Get target shapes
  const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
  
  if (targetShapes.length !== shapeIds.length) {
    throw new Error('One or more shapes not found');
  }

  // Sort shapes by current x position
  const sortedShapes = [...targetShapes].sort((a, b) => a.x - b.x);
  
  // Calculate total width needed
  const totalWidth = sortedShapes.reduce((sum, shape) => sum + shape.width, 0) + (sortedShapes.length - 1) * spacing;
  
  // Calculate starting x position (center on canvas)
  const canvasWidth = 5000; // Assuming 5000px canvas width
  const startX = Math.max(0, (canvasWidth - totalWidth) / 2);
  
  // Position each shape
  const positions: PositionUpdate[] = [];
  let currentX = startX;
  
  sortedShapes.forEach(shape => {
    positions.push({ 
      id: shape.id, 
      x: currentX, 
      y: shape.y // Keep original y position
    });
    currentX += shape.width + spacing;
  });
  
  return positions;
}

/**
 * Calculate even spacing layout for shapes
 * @param shapeIds - Array of shape IDs to arrange
 * @param shapes - Array of all shapes
 * @param direction - Direction of spacing: 'horizontal' or 'vertical'
 * @returns Array of position updates
 */
export function calculateEvenSpacing(
  shapeIds: string[], 
  shapes: Shape[], 
  direction: 'horizontal' | 'vertical'
): PositionUpdate[] {
  // Validate input
  if (!shapeIds || shapeIds.length < 2) {
    throw new Error('At least 2 shapes are required for even spacing');
  }

  // Get target shapes
  const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
  
  if (targetShapes.length !== shapeIds.length) {
    throw new Error('One or more shapes not found');
  }

  if (direction === 'horizontal') {
    return calculateHorizontalEvenSpacing(targetShapes);
  } else {
    return calculateVerticalEvenSpacing(targetShapes);
  }
}

/**
 * Calculate horizontal even spacing
 */
function calculateHorizontalEvenSpacing(shapes: Shape[]): PositionUpdate[] {
  // Get bounding box of all shapes
  const minX = Math.min(...shapes.map(s => s.x));
  const maxX = Math.max(...shapes.map(s => s.x + s.width));
  const totalWidth = maxX - minX;
  
  // Calculate available space and spacing
  const totalShapeWidth = shapes.reduce((sum, shape) => sum + shape.width, 0);
  const availableSpace = totalWidth - totalShapeWidth;
  const spacing = availableSpace / (shapes.length - 1);
  
  // Sort shapes by current x position
  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);
  
  // Position shapes with even spacing
  const positions: PositionUpdate[] = [];
  let currentX = minX;
  
  sortedShapes.forEach(shape => {
    positions.push({ 
      id: shape.id, 
      x: currentX, 
      y: shape.y // Keep original y position
    });
    currentX += shape.width + spacing;
  });
  
  return positions;
}

/**
 * Calculate vertical even spacing
 */
function calculateVerticalEvenSpacing(shapes: Shape[]): PositionUpdate[] {
  // Get bounding box of all shapes
  const minY = Math.min(...shapes.map(s => s.y));
  const maxY = Math.max(...shapes.map(s => s.y + s.height));
  const totalHeight = maxY - minY;
  
  // Calculate available space and spacing
  const totalShapeHeight = shapes.reduce((sum, shape) => sum + shape.height, 0);
  const availableSpace = totalHeight - totalShapeHeight;
  const spacing = availableSpace / (shapes.length - 1);
  
  // Sort shapes by current y position
  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);
  
  // Position shapes with even spacing
  const positions: PositionUpdate[] = [];
  let currentY = minY;
  
  sortedShapes.forEach(shape => {
    positions.push({ 
      id: shape.id, 
      x: shape.x, // Keep original x position
      y: currentY
    });
    currentY += shape.height + spacing;
  });
  
  return positions;
}

/**
 * Calculate alignment positions for shapes
 * @param shapeIds - Array of shape IDs to align
 * @param shapes - Array of all shapes
 * @param alignment - Alignment type: 'left', 'center', 'right', 'top', 'middle', 'bottom'
 * @returns Array of position updates
 */
export function calculateAlignment(
  shapeIds: string[], 
  shapes: Shape[], 
  alignment: string
): PositionUpdate[] {
  // Validate input
  if (!shapeIds || shapeIds.length < 2) {
    throw new Error('At least 2 shapes are required for alignment');
  }

  // Get target shapes
  const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
  
  if (targetShapes.length !== shapeIds.length) {
    throw new Error('One or more shapes not found');
  }

  const positions: PositionUpdate[] = [];
  
  switch (alignment) {
    case 'left':
      const leftX = Math.min(...targetShapes.map(s => s.x));
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: leftX, y: shape.y });
      });
      break;
      
    case 'right':
      const rightX = Math.max(...targetShapes.map(s => s.x + s.width));
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: rightX - shape.width, y: shape.y });
      });
      break;
      
    case 'center':
      const totalWidth = Math.max(...targetShapes.map(s => s.x + s.width)) - Math.min(...targetShapes.map(s => s.x));
      const centerX = Math.min(...targetShapes.map(s => s.x)) + totalWidth / 2;
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: centerX - shape.width / 2, y: shape.y });
      });
      break;
      
    case 'top':
      const topY = Math.min(...targetShapes.map(s => s.y));
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: shape.x, y: topY });
      });
      break;
      
    case 'bottom':
      const bottomY = Math.max(...targetShapes.map(s => s.y + s.height));
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: shape.x, y: bottomY - shape.height });
      });
      break;
      
    case 'middle':
      const totalHeight = Math.max(...targetShapes.map(s => s.y + s.height)) - Math.min(...targetShapes.map(s => s.y));
      const middleY = Math.min(...targetShapes.map(s => s.y)) + totalHeight / 2;
      targetShapes.forEach(shape => {
        positions.push({ id: shape.id, x: shape.x, y: middleY - shape.height / 2 });
      });
      break;
      
    default:
      throw new Error(`Invalid alignment: ${alignment}`);
  }
  
  return positions;
}

/**
 * Calculate grid layout for shapes (future enhancement)
 * @param shapeIds - Array of shape IDs to arrange
 * @param shapes - Array of all shapes
 * @param columns - Number of columns in the grid
 * @param spacing - Spacing between shapes
 * @returns Array of position updates
 */
export function calculateGridLayout(
  shapeIds: string[], 
  shapes: Shape[], 
  columns: number, 
  spacing: number = 20
): PositionUpdate[] {
  // Validate input
  if (!shapeIds || shapeIds.length < 2) {
    throw new Error('At least 2 shapes are required for grid layout');
  }

  // Get target shapes
  const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
  
  if (targetShapes.length !== shapeIds.length) {
    throw new Error('One or more shapes not found');
  }

  const positions: PositionUpdate[] = [];
  const rows = Math.ceil(targetShapes.length / columns);
  
  // Calculate grid dimensions
  const maxWidth = Math.max(...targetShapes.map(s => s.width));
  const maxHeight = Math.max(...targetShapes.map(s => s.height));
  
  const cellWidth = maxWidth + spacing;
  const cellHeight = maxHeight + spacing;
  
  // Calculate starting position (center on canvas)
  const canvasWidth = 5000;
  const canvasHeight = 5000;
  const gridWidth = columns * cellWidth - spacing;
  const gridHeight = rows * cellHeight - spacing;
  
  const startX = Math.max(0, (canvasWidth - gridWidth) / 2);
  const startY = Math.max(0, (canvasHeight - gridHeight) / 2);
  
  // Position each shape in grid
  targetShapes.forEach((shape, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const x = startX + col * cellWidth;
    const y = startY + row * cellHeight;
    
    positions.push({ id: shape.id, x, y });
  });
  
  return positions;
}

/**
 * Validate layout parameters
 * @param shapeIds - Array of shape IDs
 * @param shapes - Array of all shapes
 * @param minShapes - Minimum number of shapes required
 * @param maxShapes - Maximum number of shapes allowed
 */
export function validateLayoutInput(
  shapeIds: string[], 
  shapes: Shape[], 
  minShapes: number = 2, 
  maxShapes: number = 50
): void {
  if (!shapeIds || shapeIds.length < minShapes) {
    throw new Error(`At least ${minShapes} shapes are required`);
  }
  
  if (shapeIds.length > maxShapes) {
    throw new Error(`Maximum ${maxShapes} shapes allowed`);
  }
  
  const targetShapes = shapes.filter(shape => shapeIds.includes(shape.id));
  
  if (targetShapes.length !== shapeIds.length) {
    throw new Error('One or more shapes not found');
  }
}

/**
 * Calculate optimal spacing for shapes
 * @param shapes - Array of shapes
 * @param direction - Direction of spacing
 * @returns Optimal spacing value
 */
export function calculateOptimalSpacing(
  shapes: Shape[], 
  direction: 'horizontal' | 'vertical'
): number {
  if (shapes.length < 2) {
    return 20; // Default spacing
  }
  
  if (direction === 'horizontal') {
    const totalWidth = shapes.reduce((sum, shape) => sum + shape.width, 0);
    const availableSpace = 5000 - totalWidth; // Assuming 5000px canvas width
    return Math.max(10, Math.min(200, availableSpace / (shapes.length - 1)));
  } else {
    const totalHeight = shapes.reduce((sum, shape) => sum + shape.height, 0);
    const availableSpace = 5000 - totalHeight; // Assuming 5000px canvas height
    return Math.max(10, Math.min(200, availableSpace / (shapes.length - 1)));
  }
}
