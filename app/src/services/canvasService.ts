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
  orderBy 
} from 'firebase/firestore';
import { firestore } from '../firebase';

// Shape interface matching the data model from task.md
export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
  createdAt: Timestamp;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
  updatedAt: Timestamp;
}

// Shape creation data (without auto-generated fields)
export interface CreateShapeData {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
}

// Shape update data (partial updates)
export interface UpdateShapeData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
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
    const CANVAS_WIDTH = 5000;
    const CANVAS_HEIGHT = 5000;
    
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
}

// Export singleton instance
export const canvasService = new CanvasService();
export default canvasService;
