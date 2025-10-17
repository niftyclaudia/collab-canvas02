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

// Shape interface matching the data model from task.md
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles - radius of the circle
  color: string;
  rotation?: number; // Rotation in degrees (0-360)
  createdBy: string;
  createdAt: Timestamp;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
  updatedAt: Timestamp;
}

// Shape creation data (without auto-generated fields)
export interface CreateShapeData {
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number; // For circles - radius of the circle
  color: string;
  rotation?: number; // Optional rotation field
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
class CanvasService {
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

      console.log('✅ Shape created successfully:', shapeId);

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

      console.log('✅ Shape updated successfully:', shapeId);
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
      const shapesQuery = query(shapesCollectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(shapesQuery);

      const shapes: Shape[] = [];
      querySnapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as Shape);
      });

      console.log('✅ Fetched shapes successfully:', shapes.length);
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
      const shapesQuery = query(shapesCollectionRef, orderBy('createdAt', 'asc'));

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

          console.log('🔄 Shapes updated (real-time):', shapes.length);
          callback(shapes);
        },
        (error) => {
          console.error('❌ Error in shapes subscription:', error);
          // Call callback with empty array on error to prevent crashes
          callback([]);
        }
      );

      console.log('👂 Subscribed to shapes updates');
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

      console.log('✅ Shape locked successfully:', shapeId, 'by:', userId);
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

      console.log('✅ Shape unlocked successfully:', shapeId);
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
      console.log('🗑️ Starting clearCanvas operation...');
      console.log('🗑️ Collection path:', this.shapesCollectionPath);
      
      const shapesCollectionRef = collection(firestore, this.shapesCollectionPath);
      console.log('🗑️ Fetching shapes to delete...');
      
      const querySnapshot = await getDocs(shapesCollectionRef);
      console.log('🗑️ Found shapes:', querySnapshot.docs.length);
      
      if (querySnapshot.empty) {
        console.log('✅ Canvas is already empty');
        return;
      }

      // Log shape IDs being deleted
      const shapeIds = querySnapshot.docs.map(doc => doc.id);
      console.log('🗑️ Shape IDs to delete:', shapeIds);

      // Use batch to delete all shapes efficiently
      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach((doc) => {
        console.log('🗑️ Adding to batch delete:', doc.id);
        batch.delete(doc.ref);
      });

      console.log('🗑️ Committing batch delete...');
      await batch.commit();
      console.log('✅ Canvas cleared successfully:', querySnapshot.docs.length, 'shapes deleted');
      console.log('✅ Batch commit completed');
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
   * Returns center point and radius
   */
  calculateCircleFromDrag(startX: number, startY: number, endX: number, endY: number) {
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
    
    return { x: centerX, y: centerY, radius };
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
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param color - Circle color
   * @param createdBy - User ID who created the circle
   */
  async createCircle(x: number, y: number, radius: number, color: string, createdBy: string): Promise<Shape> {
    // Validate minimum radius (5px)
    if (radius < 5) {
      throw new Error('Minimum circle radius is 5 pixels');
    }

    // Validate circle bounds
    if (!this.validateCircleBounds(x, y, radius)) {
      throw new Error('Circle would be outside canvas bounds');
    }

    const shapeData: CreateShapeData = {
      type: 'circle',
      x,
      y,
      width: radius * 2, // Store diameter as width for bounding box
      height: radius * 2, // Store diameter as height for bounding box
      radius,
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

    console.log('✅ Circle resized successfully:', shapeId, `radius: ${radius}`);
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

    console.log('✅ Shape resized successfully:', shapeId, `${width}×${height}`);
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
    
    console.log(`✅ Shape ${shapeId} rotated to ${normalizedRotation}°`);
  }
}

// Export singleton instance
export const canvasService = new CanvasService();
export default canvasService;

// Expose to window for console testing (development only)
if (typeof window !== 'undefined') {
  (window as any).canvasService = canvasService;
}
