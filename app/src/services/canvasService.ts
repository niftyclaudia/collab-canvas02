import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { logger } from '../utils/logger';

// Shape interface matching the data model from task.md
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles - radius of the circle
  color: string;
  rotation?: number; // Rotation in degrees (0-360)
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  createdBy: string;
  createdAt: Timestamp;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
  updatedAt: Timestamp;
}

// Shape creation data (without auto-generated fields)
export interface CreateShapeData {
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles - radius of the circle
  color: string;
  rotation?: number; // Optional rotation field
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  createdBy: string;
}

// Shape update data (partial updates)
export interface UpdateShapeData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number; // For circles - radius of the circle
  color?: string;
  rotation?: number;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
}

/**
 * Canvas Service for managing shapes in Firestore
 * Handles CRUD operations for collaborative shape editing
 */
export class CanvasService {
  private readonly shapesCollectionPath = 'canvases/main/shapes';

  /**
   * Generate a new unique shape ID
   */
  private generateShapeId(): string {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new shape in Firestore
   */
  async createShape(shapeData: CreateShapeData): Promise<Shape> {
    try {
      // Validate bounds based on shape type
      if (shapeData.type === 'circle') {
        // For circles, validate using circle bounds (center + radius)
        if (!this.validateCircleBounds(shapeData.x, shapeData.y, shapeData.radius || 0)) {
          throw new Error(`Circle would be outside canvas bounds (canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT})`);
        }
      } else {
        // For rectangles, triangles, and text, validate using shape bounds
        if (!this.validateShapeBounds(shapeData.x, shapeData.y, shapeData.width, shapeData.height)) {
          throw new Error(`Shape would be outside canvas bounds (canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT})`);
        }
      }

      const shapeId = this.generateShapeId();
      const now = serverTimestamp() as Timestamp;
      
      const shape: Omit<Shape, 'id'> = {
        ...shapeData,
        rotation: shapeData.rotation ?? 0, // Default to 0 if not provided
        createdAt: now,
        updatedAt: now,
        lockedBy: null,
        lockedAt: null,
      };

      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeDocRef, shape);


      return {
        id: shapeId,
        ...shape,
      } as Shape;
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      throw error;
    }
  }

  /**
   * Update an existing shape in Firestore
   */
  async updateShape(shapeId: string, updates: UpdateShapeData): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await updateDoc(shapeDocRef, updateData);

    } catch (error) {
      console.error('❌ Error updating shape:', error);
      throw error;
    }
  }

  /**
   * Get all shapes from Firestore (one-time read)
   */
  async getShapes(): Promise<Shape[]> {
    try {
      const shapesCollectionRef = collection(firestore, this.shapesCollectionPath);
      const shapesQuery = query(shapesCollectionRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(shapesQuery);

      const shapes: Shape[] = [];
      querySnapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as Shape);
      });

      return shapes;
    } catch (error) {
      console.error('❌ Error fetching shapes:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time shape updates
   * Returns unsubscribe function
   */
  subscribeToShapes(callback: (shapes: Shape[]) => void): () => void {
    try {
      const shapesCollectionRef = collection(firestore, this.shapesCollectionPath);
      const shapesQuery = query(shapesCollectionRef, orderBy('updatedAt', 'desc'));

      const unsubscribe = onSnapshot(
        shapesQuery,
        (querySnapshot) => {
          const shapes: Shape[] = [];
          querySnapshot.forEach((doc) => {
            shapes.push({
              id: doc.id,
              ...doc.data(),
            } as Shape);
          });

          callback(shapes);
        },
        (error) => {
          console.error('❌ Error in shapes subscription:', error);
          // Call callback with empty array on error to prevent crashes
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up shapes subscription:', error);
      throw error;
    }
  }

  /**
   * Validate shape bounds (ensure within canvas limits)
   */
  validateShapeBounds(x: number, y: number, width: number, height: number): boolean {
    return (
      x >= 0 && 
      y >= 0 && 
      x + width <= CANVAS_WIDTH && 
      y + height <= CANVAS_HEIGHT &&
      width > 0 &&
      height > 0
    );
  }

  /**
   * Validate circle bounds (ensure within canvas limits)
   */
  validateCircleBounds(x: number, y: number, radius: number): boolean {
    return (
      x - radius >= 0 && 
      y - radius >= 0 && 
      x + radius <= CANVAS_WIDTH && 
      y + radius <= CANVAS_HEIGHT &&
      radius > 0
    );
  }

  /**
   * Clamp shape position to stay within canvas bounds
   * Returns corrected position if shape would go outside canvas
   */
  clampShapeToCanvas(x: number, y: number, width: number, height: number): { x: number; y: number } {
    
    // Ensure shape stays within left and top bounds
    const clampedX = Math.max(0, Math.min(x, CANVAS_WIDTH - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - height));
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Clamp circle position to stay within canvas bounds
   * Returns corrected position if circle would go outside canvas
   */
  clampCircleToCanvas(x: number, y: number, radius: number): { x: number; y: number } {
    // Ensure circle stays within canvas bounds
    const clampedX = Math.max(radius, Math.min(x, CANVAS_WIDTH - radius));
    const clampedY = Math.max(radius, Math.min(y, CANVAS_HEIGHT - radius));
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Validate and clamp shape position for drag operations
   * Returns corrected position and whether clamping was needed
   */
  validateShapePosition(x: number, y: number, width: number, height: number): { 
    x: number; 
    y: number; 
    wasClamped: boolean 
  } {
    const originalX = x;
    const originalY = y;
    const clamped = this.clampShapeToCanvas(x, y, width, height);
    
    return {
      x: clamped.x,
      y: clamped.y,
      wasClamped: originalX !== clamped.x || originalY !== clamped.y
    };
  }

  /**
   * Attempt to lock a shape for editing
   * Returns true if lock acquired, false if shape is already locked by another user
   */
  async lockShape(shapeId: string, userId: string): Promise<boolean> {
    try {
      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        console.error('❌ Shape not found for locking:', shapeId);
        return false;
      }

      const shapeData = shapeDoc.data() as Shape;
      const now = Date.now();
      
      // Check if shape is already locked by another user
      if (shapeData.lockedBy && shapeData.lockedBy !== userId) {
        // Check if lock is still valid (less than 5 seconds old)
        const lockAge = now - (shapeData.lockedAt?.toMillis() || 0);
        
        if (lockAge < 5000) {
          console.log('🔒 Shape is locked by another user:', shapeData.lockedBy);
          return false; // Lock acquisition failed
        }
      }
      
      // Acquire or refresh the lock
      await updateDoc(shapeDocRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      });

      return true;
    } catch (error) {
      console.error('❌ Error locking shape:', error);
      return false;
    }
  }

  /**
   * Release lock on a shape
   */
  async unlockShape(shapeId: string): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      await updateDoc(shapeDocRef, {
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      });

    } catch (error) {
      console.error('❌ Error unlocking shape:', error);
      throw error;
    }
  }

  /**
   * Check if a shape lock has expired (client-side check)
   */
  isLockExpired(lockedAt: Timestamp | null | undefined): boolean {
    if (!lockedAt) return true;
    
    const now = Date.now();
    const lockAge = now - lockedAt.toMillis();
    
    return lockAge > 5000; // 5 second timeout
  }

  /**
   * Get the display name for a locked shape owner
   */
  async getUserDisplayName(userId: string): Promise<string> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.username || userData.email || 'Unknown User';
      }
      
      return 'Unknown User';
    } catch (error) {
      console.error('❌ Error fetching user display name:', error);
      return 'Unknown User';
    }
  }

  /**
   * Clear all shapes from the canvas
   * Deletes all shapes in the collection using a batch operation
   */
  async clearCanvas(): Promise<void> {
    try {
        const shapesCollectionRef = collection(firestore, this.shapesCollectionPath);
      const querySnapshot = await getDocs(shapesCollectionRef);
      
      if (querySnapshot.empty) {
        return;
      }

      // Use batch to delete all shapes efficiently
      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('❌ Error clearing canvas:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        name: (error as any)?.name,
      });
      throw error;
    }
  }

  /**
   * Normalize rectangle coordinates (handle negative drag)
   * Ensures x,y is top-left corner with positive width/height
   */
  normalizeRectangle(startX: number, startY: number, endX: number, endY: number) {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    return { x, y, width, height };
  }

  /**
   * Calculate circle properties from drag coordinates
   * Returns top-left coordinates and dimensions (like rectangles)
   * The circle is created by dragging from one corner to the opposite corner
   */
  calculateCircleFromDrag(startX: number, startY: number, endX: number, endY: number) {
    // Calculate the bounding box (like rectangles)
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // For circles, use the smaller dimension to ensure it fits
    const size = Math.min(width, height);
    
    return { x, y, width: size, height: size };
  }

  /**
   * Calculate triangle properties from drag coordinates
   * Returns bounding box for equilateral triangle pointing upward
   */
  calculateTriangleFromDrag(startX: number, startY: number, endX: number, endY: number) {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    return { x, y, width, height };
  }

  /**
   * Create a circle shape
   * @param x - Top-left X coordinate
   * @param y - Top-left Y coordinate
   * @param width - Circle width (diameter)
   * @param height - Circle height (diameter)
   * @param color - Circle color
   * @param createdBy - User ID who created the circle
   */
  async createCircle(x: number, y: number, width: number, height: number, color: string, createdBy: string): Promise<Shape> {
    
    // Validate minimum size (10px diameter)
    if (width < 10 || height < 10) {
      throw new Error('Minimum circle size is 10×10 pixels');
    }

    // Validate circle bounds (using top-left coordinates)
    const boundsCheck = this.validateShapeBounds(x, y, width, height);
    
    if (!boundsCheck) {
      throw new Error('Circle would be outside canvas bounds');
    }

    const shapeData: CreateShapeData = {
      type: 'circle',
      x,
      y,
      width,
      height,
      radius: Math.min(width, height) / 2, // Store radius for compatibility
      color,
      createdBy,
    };

    return this.createShape(shapeData);
  }

  /**
   * Create a triangle shape
   * @param x - Top-left X coordinate of bounding box
   * @param y - Top-left Y coordinate of bounding box
   * @param width - Width of bounding box
   * @param height - Height of bounding box
   * @param color - Triangle color
   * @param createdBy - User ID who created the triangle
   */
  async createTriangle(x: number, y: number, width: number, height: number, color: string, createdBy: string): Promise<Shape> {
    // Validate minimum size (10x10)
    if (width < 10 || height < 10) {
      throw new Error('Minimum triangle size is 10×10 pixels');
    }

    // Validate triangle bounds
    if (!this.validateShapeBounds(x, y, width, height)) {
      throw new Error('Triangle would be outside canvas bounds');
    }

    const shapeData: CreateShapeData = {
      type: 'triangle',
      x,
      y,
      width,
      height,
      color,
      createdBy,
    };

    return this.createShape(shapeData);
  }

  /**
   * Create a text shape on the canvas
   * @param text - The text content to display
   * @param x - X position in pixels
   * @param y - Y position in pixels
   * @param fontSize - Font size in pixels (default 16)
   * @param color - Text color hex code (default #000000)
   * @param fontWeight - Font weight (default normal)
   * @param fontStyle - Font style (default normal)
   * @param textDecoration - Text decoration (default none)
   * @param createdBy - User ID who created the text
   */
  async createText(
    text: string,
    x: number,
    y: number,
    fontSize: number = 16,
    color: string = '#000000',
    fontWeight: string = 'normal',
    fontStyle: string = 'normal',
    textDecoration: string = 'none',
    createdBy: string
  ): Promise<Shape> {
    // Validate text content
    if (!text || text.trim().length === 0) {
      throw new Error('Text content cannot be empty');
    }

    // Validate font size
    if (fontSize < 8 || fontSize > 200) {
      throw new Error('Font size must be between 8 and 200 pixels');
    }

    // Estimate text dimensions (rough approximation)
    const estimatedWidth = text.length * fontSize * 0.6;
    const estimatedHeight = fontSize * 1.2;

    // Validate text bounds
    if (!this.validateShapeBounds(x, y, estimatedWidth, estimatedHeight)) {
      throw new Error('Text would be outside canvas bounds');
    }

    const shapeData: CreateShapeData = {
      type: 'text',
      x,
      y,
      width: estimatedWidth,
      height: estimatedHeight,
      color,
      text,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      createdBy,
    };

    return this.createShape(shapeData);
  }

  /**
   * Resize a circle by updating its radius
   * @param shapeId - The ID of the circle to resize
   * @param radius - New radius (must be >= 5px)
   */
  async resizeCircle(shapeId: string, radius: number): Promise<void> {
    // Validate minimum radius
    if (radius < 5) {
      throw new Error('Minimum circle radius is 5 pixels');
    }
    
    const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await updateDoc(shapeRef, {
      radius: radius,
      width: radius * 2, // Update bounding box width
      height: radius * 2, // Update bounding box height
      updatedAt: serverTimestamp()
    });

  }

  /**
   * Resize a shape with validation
   * @param shapeId - The ID of the shape to resize
   * @param width - New width (must be >= 10px for rectangles/triangles)
   * @param height - New height (must be >= 10px for rectangles/triangles)
   */
  async resizeShape(shapeId: string, width: number, height: number): Promise<void> {
    // Validate minimum dimensions
    if (width < 10 || height < 10) {
      throw new Error('Minimum size is 10×10 pixels');
    }
    
    const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await updateDoc(shapeRef, {
      width: width,
      height: height,
      updatedAt: serverTimestamp()
    });

  }

  /**
   * Rotate a shape with angle normalization
   * @param shapeId - The ID of the shape to rotate
   * @param rotation - Rotation angle in degrees (will be normalized to 0-360)
   */
  async rotateShape(shapeId: string, rotation: number): Promise<void> {
    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await updateDoc(shapeRef, {
      rotation: normalizedRotation,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Duplicate a shape with a small offset
   * @param shapeId - The ID of the shape to duplicate
   * @param createdBy - User ID who is duplicating the shape
   */
  async duplicateShape(shapeId: string, createdBy: string): Promise<Shape> {
    try {
      // Get the original shape
      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const originalShape = shapeDoc.data() as Shape;
      
      // Create duplicate with 20px offset
      const duplicateData: CreateShapeData = {
        type: originalShape.type,
        x: originalShape.x + 20,
        y: originalShape.y + 20,
        width: originalShape.width,
        height: originalShape.height,
        radius: originalShape.radius,
        color: originalShape.color,
        rotation: originalShape.rotation || 0,
        text: originalShape.text,
        fontSize: originalShape.fontSize,
        fontWeight: originalShape.fontWeight,
        fontStyle: originalShape.fontStyle,
        textDecoration: originalShape.textDecoration,
        createdBy: createdBy,
      };
      
      return this.createShape(duplicateData);
    } catch (error) {
      console.error('❌ Error duplicating shape:', error);
      throw error;
    }
  }

  /**
   * Delete a shape from the canvas
   * @param shapeId - The ID of the shape to delete
   */
  async deleteShape(shapeId: string): Promise<void> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await deleteDoc(shapeDocRef);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const canvasService = new CanvasService();
export default canvasService;

// Expose to window for console testing (development only)
if (typeof window !== 'undefined') {
  (window as any).canvasService = canvasService;
}
