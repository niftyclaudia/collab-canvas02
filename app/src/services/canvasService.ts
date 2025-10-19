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
  writeBatch,
  where
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

// Canvas interface for canvas management
export interface Canvas {
  id: string;
  name: string;
  createdBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isShared: boolean; // true = team-wide, false = private
  lastAccessedBy?: string; // Track last user who opened it
  lastAccessedAt?: Timestamp;
  thumbnail?: string; // Optional: base64 preview image
}

// Group interface for grouping shapes
export interface Group {
  id: string;
  name?: string; // Optional user-defined name
  shapeIds: string[]; // Array of shape IDs in this group
  createdBy: string; // User ID who created the group
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  // Z-index properties
  zIndex: number; // Stacking order (higher = on top)
  // Grouping properties
  groupId?: string | null; // Reference to group (if grouped)
  createdBy: string;
  createdAt: Timestamp;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
  editingBy?: string | null; // User currently editing this text
  editingAt?: Timestamp | null; // When editing started
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
  // Z-index properties
  zIndex?: number; // Optional z-index (will be auto-assigned if not provided)
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
  zIndex?: number; // Z-index updates
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
}

/**
 * Canvas Service for managing shapes in Firestore
 * Handles CRUD operations for collaborative shape editing
 */
export class CanvasService {
  private currentCanvasId: string = 'main'; // Default to 'main' for backward compatibility
  
  private getShapesCollectionPath(canvasId?: string): string {
    return `canvases/${canvasId || this.currentCanvasId}/shapes`;
  }
  
  private getGroupsCollectionPath(canvasId?: string): string {
    return `canvases/${canvasId || this.currentCanvasId}/groups`;
  }
  
  /**
   * Set the current canvas ID for all operations
   */
  setCurrentCanvas(canvasId: string): void {
    this.currentCanvasId = canvasId;
  }
  
  /**
   * Get the current canvas ID
   */
  getCurrentCanvasId(): string {
    return this.currentCanvasId;
  }

  /**
   * Generate a new unique shape ID
   */
  private generateShapeId(): string {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create multiple shapes in a batch operation for better performance
   */
  async createShapesBatch(shapesData: CreateShapeData[]): Promise<Shape[]> {
    try {
      if (shapesData.length === 0) return [];
      
      // Validate all shapes first
      for (const shapeData of shapesData) {
        if (shapeData.type === 'circle') {
          if (!this.validateCircleBounds(shapeData.x, shapeData.y, shapeData.radius || 0)) {
            throw new Error(`Circle would be outside canvas bounds (canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT})`);
          }
        } else {
          if (!this.validateShapeBounds(shapeData.x, shapeData.y, shapeData.width, shapeData.height)) {
            throw new Error(`Shape would be outside canvas bounds (canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT})`);
          }
        }
      }

      // Get current z-index range to assign new z-indexes
      const zIndexRange = await this.getZIndexRange();
      const now = serverTimestamp() as Timestamp;
      
      // Create batch operation
      const batch = writeBatch(firestore);
      const shapes: Shape[] = [];
      
      shapesData.forEach((shapeData, index) => {
        const shapeId = this.generateShapeId();
        const newZIndex = zIndexRange.max + 1 + index;
        
        const shape: Omit<Shape, 'id'> = {
          ...shapeData,
          rotation: shapeData.rotation ?? 0,
          zIndex: shapeData.zIndex ?? newZIndex,
          createdAt: now,
          updatedAt: now,
          lockedBy: null,
          lockedAt: null,
        };

        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
        batch.set(shapeDocRef, shape);
        
        shapes.push({
          id: shapeId,
          ...shape,
        } as Shape);
      });

      // Commit all shapes in a single batch operation
      await batch.commit();
      
      return shapes;
    } catch (error) {
      console.error('❌ Error creating shapes batch:', error);
      throw error;
    }
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
      
      // Get current z-index range to assign new z-index
      const zIndexRange = await this.getZIndexRange();
      const newZIndex = zIndexRange.max + 1;
      
      const shape: Omit<Shape, 'id'> = {
        ...shapeData,
        rotation: shapeData.rotation ?? 0, // Default to 0 if not provided
        zIndex: shapeData.zIndex ?? newZIndex, // Use provided zIndex or assign new one
        createdAt: now,
        updatedAt: now,
        lockedBy: null,
        lockedAt: null,
      };

      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
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
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      
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
      const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath());
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
   * Get all groups from Firestore (one-time read)
   */
  async getGroups(): Promise<Group[]> {
    try {
      const groupsCollectionRef = collection(firestore, this.getGroupsCollectionPath());
      const groupsQuery = query(groupsCollectionRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(groupsQuery);

      const groups: Group[] = [];
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data(),
        } as Group);
      });

      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time shape updates with performance optimizations
   * Returns unsubscribe function
   */
  subscribeToShapes(callback: (shapes: Shape[]) => void): () => void {
    try {
      const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath());
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

          // Performance optimization: Sort shapes by zIndex for efficient rendering
          shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
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
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
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
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      
      // Check if the document exists before trying to update it
      const shapeDoc = await getDoc(shapeDocRef);
      if (!shapeDoc.exists()) {
        // Shape doesn't exist (probably deleted), so no need to unlock
        return;
      }
      
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
   * Start editing a text shape
   * Returns true if editing started, false if already being edited by another user
   */
  async startTextEditing(shapeId: string, userId: string): Promise<boolean> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        console.error('❌ Shape not found for editing:', shapeId);
        return false;
      }

      const shapeData = shapeDoc.data() as Shape;
      const now = Date.now();
      
      // Check if shape is already being edited by another user
      if (shapeData.editingBy && shapeData.editingBy !== userId) {
        // Check if editing session is still active (less than 30 seconds old)
        const editingAge = now - (shapeData.editingAt?.toMillis() || 0);
        
        if (editingAge < 30000) { // 30 seconds timeout
          return false; // Editing acquisition failed
        }
      }
      
      // Start or refresh the editing session
      await updateDoc(shapeDocRef, {
        editingBy: userId,
        editingAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      });

      return true;
    } catch (error) {
      console.error('❌ Error starting text editing:', error);
      return false;
    }
  }

  /**
   * Stop editing a text shape
   */
  async stopTextEditing(shapeId: string): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      await updateDoc(shapeDocRef, {
        editingBy: null,
        editingAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      });
    } catch (error) {
      console.error('❌ Error stopping text editing:', error);
      throw error;
    }
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
        const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath());
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
   * @param x - Top-left X coordinate (will be converted to center)
   * @param y - Top-left Y coordinate (will be converted to center)
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

    // Convert from top-left to center coordinates for storage
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;

    // Validate circle bounds using center coordinates
    if (!this.validateCircleBounds(centerX, centerY, radius)) {
      throw new Error('Circle would be outside canvas bounds');
    }

    const shapeData: CreateShapeData = {
      type: 'circle',
      x: centerX, // Store center coordinates
      y: centerY, // Store center coordinates
      width,
      height,
      radius: radius, // Store radius for compatibility
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
    
    const shapeRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
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
    
    const shapeRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
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
    
    const shapeRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
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
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const originalShape = shapeDoc.data() as Shape;
      
      // Calculate new position with 20px offset, but handle canvas bounds
      let newX = originalShape.x + 20;
      let newY = originalShape.y + 20;
      
      // If the offset would put the shape outside bounds, wrap to (50, 50)
      if (originalShape.type === 'circle') {
        const radius = originalShape.radius || originalShape.width / 2;
        if (!this.validateCircleBounds(newX, newY, radius)) {
          newX = 50;
          newY = 50;
        }
      } else {
        if (!this.validateShapeBounds(newX, newY, originalShape.width, originalShape.height)) {
          newX = 50;
          newY = 50;
        }
      }
      
      // Create duplicate with calculated position
      const duplicateData: CreateShapeData = {
        type: originalShape.type,
        x: newX,
        y: newY,
        width: originalShape.width,
        height: originalShape.height,
        color: originalShape.color,
        rotation: originalShape.rotation || 0,
        createdBy: createdBy,
      };
      
      // Only add radius for circles
      if (originalShape.type === 'circle' && originalShape.radius !== undefined) {
        duplicateData.radius = originalShape.radius;
      }
      
      // Only add text properties for text shapes
      if (originalShape.type === 'text') {
        if (originalShape.text !== undefined) duplicateData.text = originalShape.text;
        if (originalShape.fontSize !== undefined) duplicateData.fontSize = originalShape.fontSize;
        if (originalShape.fontWeight !== undefined) duplicateData.fontWeight = originalShape.fontWeight;
        if (originalShape.fontStyle !== undefined) duplicateData.fontStyle = originalShape.fontStyle;
        if (originalShape.textDecoration !== undefined) duplicateData.textDecoration = originalShape.textDecoration;
      }
      
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
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      await deleteDoc(shapeDocRef);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }

  /**
   * Updates the text content of a text shape
   * @param shapeId - The ID of the text shape to update
   * @param text - The new text content
   * @throws Error if update fails
   */
  async updateShapeText(shapeId: string, text: string): Promise<void> {
    try {
      // Get the current shape to access its font properties
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      const fontSize = shapeData.fontSize || 16;
      const fontFamily = 'Arial'; // Match the font used in Canvas component
      
      // Calculate actual text dimensions
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create canvas context for text measurement');
      }
      
      context.font = `${fontSize}px ${fontFamily}`;
      const metrics = context.measureText(text);
      
      // Calculate new dimensions with padding
      const newWidth = Math.max(metrics.width + 20, 100); // Add padding, minimum 100px
      const newHeight = Math.max(fontSize * 1.2, 20); // Minimum height
      
      const shapeRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      await updateDoc(shapeRef, {
        text: text,
        width: newWidth,
        height: newHeight,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating text:', error);
      throw new Error(`Failed to update text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Toggle bold formatting for a text shape
   * @param shapeId - The ID of the text shape to update
   * @throws Error if update fails
   */
  async toggleTextBold(shapeId: string): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      const currentWeight = shapeData.fontWeight || 'normal';
      const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
      
      await updateDoc(shapeDocRef, {
        fontWeight: newWeight,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error toggling bold:', error);
      throw error;
    }
  }

  /**
   * Toggle italic formatting for a text shape
   * @param shapeId - The ID of the text shape to update
   * @throws Error if update fails
   */
  async toggleTextItalic(shapeId: string): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      const currentStyle = shapeData.fontStyle || 'normal';
      const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
      
      await updateDoc(shapeDocRef, {
        fontStyle: newStyle,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error toggling italic:', error);
      throw error;
    }
  }

  /**
   * Toggle underline formatting for a text shape
   * @param shapeId - The ID of the text shape to update
   * @throws Error if update fails
   */
  async toggleTextUnderline(shapeId: string): Promise<void> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      const currentDecoration = shapeData.textDecoration || 'none';
      const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
      
      await updateDoc(shapeDocRef, {
        textDecoration: newDecoration,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error toggling underline:', error);
      throw error;
    }
  }

  /**
   * Update font size for a text shape with validation
   * @param shapeId - The ID of the text shape to update
   * @param fontSize - New font size (1-500px)
   * @throws Error if update fails or font size is invalid
   */
  async updateTextFontSize(shapeId: string, fontSize: number): Promise<void> {
    try {
      // Validate font size (1-500px as per requirements)
      if (fontSize < 1 || fontSize > 500) {
        throw new Error('Font size must be between 1 and 500 pixels');
      }
      
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      const text = shapeData.text || '';
      const fontFamily = 'Arial'; // Match the font used in Canvas component
      
      // Calculate new dimensions based on font size
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create canvas context for text measurement');
      }
      
      context.font = `${fontSize}px ${fontFamily}`;
      const metrics = context.measureText(text);
      
      // Calculate new dimensions with padding
      const newWidth = Math.max(metrics.width + 20, 100); // Add padding, minimum 100px
      const newHeight = Math.max(fontSize * 1.2, 20); // Minimum height
      
      await updateDoc(shapeDocRef, {
        fontSize: fontSize,
        width: newWidth,
        height: newHeight,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating font size:', error);
      throw error;
    }
  }

  // ===== GROUP OPERATIONS =====

  /**
   * Generate a new unique group ID
   */
  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Group multiple shapes together
   * @param shapeIds - Array of shape IDs to group
   * @param userId - User ID who is creating the group
   * @param name - Optional group name
   * @returns The group ID
   */
  async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string> {
    try {
      // Validate input
      if (!shapeIds || shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required to create a group');
      }

      // Check if all shapes exist and are not already grouped
      const shapePromises = shapeIds.map(shapeId => getDoc(doc(firestore, this.getShapesCollectionPath(), shapeId)));
      const shapeDocs = await Promise.all(shapePromises);
      
      for (let i = 0; i < shapeDocs.length; i++) {
        const shapeDoc = shapeDocs[i];
        if (!shapeDoc.exists()) {
          throw new Error(`Shape ${shapeIds[i]} not found`);
        }
        
        const shapeData = shapeDoc.data() as Shape;
        if (shapeData.groupId) {
          throw new Error(`Shape ${shapeIds[i]} is already in a group`);
        }
      }

      // Create group document
      const groupId = this.generateGroupId();
      const now = serverTimestamp() as Timestamp;
      
      const groupData: Omit<Group, 'id'> = {
        name: name || `Group ${shapeIds.length}`,
        shapeIds,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      const groupDocRef = doc(firestore, 'canvases/main/groups', groupId);
      
      // Use batch write to ensure atomicity
      const batch = writeBatch(firestore);
      
      // Create group document
      batch.set(groupDocRef, groupData);
      
      // Update all shapes with groupId
      shapeIds.forEach(shapeId => {
        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
        batch.update(shapeDocRef, {
          groupId: groupId,
          updatedAt: now,
        });
      });
      
      await batch.commit();
      
      return groupId;
    } catch (error) {
      console.error('❌ Error grouping shapes:', error);
      throw error;
    }
  }

  /**
   * Ungroup shapes by removing groupId from all shapes and deleting group document
   * @param groupId - The group ID to ungroup
   */
  async ungroupShapes(groupId: string): Promise<void> {
    try {
      // Get group document
      const groupDocRef = doc(firestore, 'canvases/main/groups', groupId);
      const groupDoc = await getDoc(groupDocRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data() as Group;
      const shapeIds = groupData.shapeIds;
      
      // Use batch write to ensure atomicity
      const batch = writeBatch(firestore);
      
      // Remove groupId from all shapes
      shapeIds.forEach(shapeId => {
        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
        batch.update(shapeDocRef, {
          groupId: null,
          updatedAt: serverTimestamp(),
        });
      });
      
      // Delete group document
      batch.delete(groupDocRef);
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error ungrouping shapes:', error);
      throw error;
    }
  }

  /**
   * Get a group by ID
   * @param groupId - The group ID
   * @returns Group data or null if not found
   */
  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const groupDocRef = doc(firestore, 'canvases/main/groups', groupId);
      const groupDoc = await getDoc(groupDocRef);
      
      if (!groupDoc.exists()) {
        return null;
      }
      
      return {
        id: groupId,
        ...groupDoc.data(),
      } as Group;
    } catch (error) {
      console.error('❌ Error getting group:', error);
      throw error;
    }
  }

  /**
   * Get all shapes in a group
   * @param groupId - The group ID
   * @returns Array of shapes in the group
   */
  async getShapesInGroup(groupId: string): Promise<Shape[]> {
    try {
      const group = await this.getGroup(groupId);
      if (!group) {
        return [];
      }
      
      // Get all shapes in the group
      const shapePromises = group.shapeIds.map(shapeId => 
        getDoc(doc(firestore, this.getShapesCollectionPath(), shapeId))
      );
      const shapeDocs = await Promise.all(shapePromises);
      
      const shapes: Shape[] = [];
      shapeDocs.forEach((shapeDoc, index) => {
        if (shapeDoc.exists()) {
          shapes.push({
            id: group.shapeIds[index],
            ...shapeDoc.data(),
          } as Shape);
        }
      });
      
      return shapes;
    } catch (error) {
      console.error('❌ Error getting shapes in group:', error);
      throw error;
    }
  }

  /**
   * Move all shapes in a group by the specified delta
   * @param groupId - The group ID
   * @param deltaX - X offset to move the group
   * @param deltaY - Y offset to move the group
   */
  async moveGroup(groupId: string, deltaX: number, deltaY: number): Promise<void> {
    try {
      const shapes = await this.getShapesInGroup(groupId);
      if (shapes.length === 0) {
        throw new Error('Group is empty');
      }
      
      // Use batch write to move all shapes atomically
      const batch = writeBatch(firestore);
      const now = serverTimestamp() as Timestamp;
      
      shapes.forEach(shape => {
        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shape.id);
        batch.update(shapeDocRef, {
          x: shape.x + deltaX,
          y: shape.y + deltaY,
          updatedAt: now,
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error moving group:', error);
      throw error;
    }
  }

  /**
   * Delete all shapes in a group and the group itself
   * @param groupId - The group ID
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const shapes = await this.getShapesInGroup(groupId);
      
      // Use batch write to delete all shapes and group atomically
      const batch = writeBatch(firestore);
      
      // Delete all shapes in the group
      shapes.forEach(shape => {
        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shape.id);
        batch.delete(shapeDocRef);
      });
      
      // Delete group document
      const groupDocRef = doc(firestore, 'canvases/main/groups', groupId);
      batch.delete(groupDocRef);
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Duplicate all shapes in a group with offset
   * @param groupId - The group ID
   * @param offsetX - X offset for duplicated shapes
   * @param offsetY - Y offset for duplicated shapes
   * @returns Array of new shape IDs
   */
  async duplicateGroup(groupId: string, offsetX: number, offsetY: number): Promise<string[]> {
    try {
      const shapes = await this.getShapesInGroup(groupId);
      if (shapes.length === 0) {
        throw new Error('Group is empty');
      }
      
      const newShapeIds: string[] = [];
      
      // Create new shapes with offset
      for (const shape of shapes) {
        const newShapeData: CreateShapeData = {
          type: shape.type,
          x: shape.x + offsetX,
          y: shape.y + offsetY,
          width: shape.width,
          height: shape.height,
          color: shape.color,
          rotation: shape.rotation || 0,
          createdBy: shape.createdBy,
        };
        
        // Add shape-specific properties
        if (shape.type === 'circle' && shape.radius !== undefined) {
          newShapeData.radius = shape.radius;
        }
        
        if (shape.type === 'text') {
          if (shape.text !== undefined) newShapeData.text = shape.text;
          if (shape.fontSize !== undefined) newShapeData.fontSize = shape.fontSize;
          if (shape.fontWeight !== undefined) newShapeData.fontWeight = shape.fontWeight;
          if (shape.fontStyle !== undefined) newShapeData.fontStyle = shape.fontStyle;
          if (shape.textDecoration !== undefined) newShapeData.textDecoration = shape.textDecoration;
        }
        
        const newShape = await this.createShape(newShapeData);
        newShapeIds.push(newShape.id);
      }
      
      return newShapeIds;
    } catch (error) {
      console.error('❌ Error duplicating group:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time group updates
   * @param canvasId - Canvas ID (currently 'main')
   * @param callback - Callback function for group updates
   * @returns Unsubscribe function
   */
  subscribeToGroups(canvasId: string, callback: (groups: Group[]) => void): () => void {
    try {
      const groupsCollectionRef = collection(firestore, `canvases/${canvasId}/groups`);
      const groupsQuery = query(groupsCollectionRef, orderBy('updatedAt', 'desc'));

      const unsubscribe = onSnapshot(
        groupsQuery,
        (querySnapshot) => {
          const groups: Group[] = [];
          querySnapshot.forEach((doc) => {
            groups.push({
              id: doc.id,
              ...doc.data(),
            } as Group);
          });

          callback(groups);
        },
        (error) => {
          console.error('❌ Error in groups subscription:', error);
          // Call callback with empty array on error to prevent crashes
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up groups subscription:', error);
      throw error;
    }
  }

  /**
   * Get current z-index range for all shapes (optimized for performance)
   * @returns Object with min and max z-index values
   */
  async getZIndexRange(): Promise<{ min: number; max: number }> {
    try {
      const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath());
      const shapesQuery = query(shapesCollectionRef, orderBy('zIndex', 'asc'));
      const querySnapshot = await getDocs(shapesQuery);
      
      if (querySnapshot.empty) {
        return { min: 0, max: 0 };
      }

      const shapes: Shape[] = [];
      querySnapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as Shape);
      });

      if (shapes.length === 0) {
        return { min: 0, max: 0 };
      }

      const zIndexes = shapes.map(shape => shape.zIndex || 0);
      return {
        min: Math.min(...zIndexes),
        max: Math.max(...zIndexes)
      };
    } catch (error) {
      console.error('❌ Error getting z-index range:', error);
      throw error;
    }
  }

  /**
   * Bring a shape to the front (highest z-index)
   * @param shapeId - The shape ID to bring to front
   */
  async bringToFront(shapeId: string): Promise<void> {
    try {
      const zIndexRange = await this.getZIndexRange();
      const newZIndex = zIndexRange.max + 1;
      
      await this.updateShape(shapeId, { zIndex: newZIndex });
    } catch (error) {
      console.error('❌ Error bringing shape to front:', error);
      throw error;
    }
  }

  /**
   * Send a shape to the back (lowest z-index)
   * @param shapeId - The shape ID to send to back
   */
  async sendToBack(shapeId: string): Promise<void> {
    try {
      const zIndexRange = await this.getZIndexRange();
      const newZIndex = zIndexRange.min - 1;
      
      await this.updateShape(shapeId, { zIndex: newZIndex });
    } catch (error) {
      console.error('❌ Error sending shape to back:', error);
      throw error;
    }
  }

  /**
   * Bring a shape forward one layer
   * @param shapeId - The shape ID to bring forward
   */
  async bringForward(shapeId: string): Promise<void> {
    try {
      // Get current shape
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const currentShape = { id: shapeDoc.id, ...shapeDoc.data() } as Shape;
      const currentZIndex = currentShape.zIndex || 0;
      
      // Get all shapes and find the next higher z-index
      const shapes = await this.getShapes();
      const higherShapes = shapes.filter(shape => (shape.zIndex || 0) > currentZIndex);
      
      if (higherShapes.length === 0) {
        // Already at front, bring to absolute front
        await this.bringToFront(shapeId);
        return;
      }
      
      // Find the shape with the lowest z-index that's still higher than current
      const nextHigherShape = higherShapes.reduce((prev, current) => 
        (current.zIndex || 0) < (prev.zIndex || 0) ? current : prev
      );
      
      const newZIndex = nextHigherShape.zIndex || 0;
      
      // Swap z-indexes
      await this.updateShape(shapeId, { zIndex: newZIndex });
      await this.updateShape(nextHigherShape.id, { zIndex: currentZIndex });
    } catch (error) {
      console.error('❌ Error bringing shape forward:', error);
      throw error;
    }
  }

  /**
   * Send a shape backward one layer
   * @param shapeId - The shape ID to send backward
   */
  async sendBackward(shapeId: string): Promise<void> {
    try {
      // Get current shape
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const currentShape = { id: shapeDoc.id, ...shapeDoc.data() } as Shape;
      const currentZIndex = currentShape.zIndex || 0;
      
      // Get all shapes and find the next lower z-index
      const shapes = await this.getShapes();
      const lowerShapes = shapes.filter(shape => (shape.zIndex || 0) < currentZIndex);
      
      if (lowerShapes.length === 0) {
        // Already at back, send to absolute back
        await this.sendToBack(shapeId);
        return;
      }
      
      // Find the shape with the highest z-index that's still lower than current
      const nextLowerShape = lowerShapes.reduce((prev, current) => 
        (current.zIndex || 0) > (prev.zIndex || 0) ? current : prev
      );
      
      const newZIndex = nextLowerShape.zIndex || 0;
      
      // Swap z-indexes
      await this.updateShape(shapeId, { zIndex: newZIndex });
      await this.updateShape(nextLowerShape.id, { zIndex: currentZIndex });
    } catch (error) {
      console.error('❌ Error sending shape backward:', error);
      throw error;
    }
  }

  /**
   * Update multiple shape positions in a batch operation
   * @param updates - Array of position updates with shape ID and new coordinates
   */
  async updateShapePositions(updates: Array<{id: string, x: number, y: number}>): Promise<void> {
    try {
      if (!updates || updates.length === 0) {
        throw new Error('No position updates provided');
      }

      // Use batch write for atomic updates
      const batch = writeBatch(firestore);
      const now = serverTimestamp() as Timestamp;
      
      updates.forEach(update => {
        const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), update.id);
        batch.update(shapeDocRef, {
          x: update.x,
          y: update.y,
          updatedAt: now,
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error updating shape positions:', error);
      throw error;
    }
  }

  /**
   * Get shape bounds for layout calculations
   * @param shapeId - The shape ID
   * @returns Shape bounds with x, y, width, height
   */
  async getShapeBounds(shapeId: string): Promise<{x: number, y: number, width: number, height: number}> {
    try {
      const shapeDocRef = doc(firestore, this.getShapesCollectionPath(), shapeId);
      const shapeDoc = await getDoc(shapeDocRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const shapeData = shapeDoc.data() as Shape;
      return {
        x: shapeData.x,
        y: shapeData.y,
        width: shapeData.width,
        height: shapeData.height
      };
    } catch (error) {
      console.error('❌ Error getting shape bounds:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   * @returns Performance metrics object
   */
  async getPerformanceMetrics(): Promise<{
    shapeCount: number;
    averageZIndex: number;
    lastUpdated: Date | null;
    memoryUsage?: number;
  }> {
    try {
      const shapes = await this.getShapes();
      const shapeCount = shapes.length;
      
      if (shapeCount === 0) {
        return {
          shapeCount: 0,
          averageZIndex: 0,
          lastUpdated: null,
        };
      }

      const zIndexes = shapes.map(shape => shape.zIndex || 0);
      const averageZIndex = zIndexes.reduce((sum, zIndex) => sum + zIndex, 0) / zIndexes.length;
      
      const lastUpdated = shapes.length > 0 
        ? shapes.reduce((latest, shape) => {
            const shapeTime = shape.updatedAt?.toDate();
            return !latest || (shapeTime && shapeTime > latest) ? shapeTime : latest;
          }, null as Date | null)
        : null;

      return {
        shapeCount,
        averageZIndex,
        lastUpdated,
        memoryUsage: typeof performance !== 'undefined' && (performance as any).memory 
          ? (performance as any).memory.usedJSHeapSize 
          : undefined,
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Optimize shape queries for large datasets
   * @param limit - Maximum number of shapes to fetch
   * @param offset - Number of shapes to skip
   * @returns Paginated shapes array
   */
  async getShapesPaginated(limit: number = 100, offset: number = 0): Promise<Shape[]> {
    try {
      const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath());
      const shapesQuery = query(
        shapesCollectionRef, 
        orderBy('updatedAt', 'desc')
        // Note: Firestore doesn't support offset directly, 
        // but we can implement cursor-based pagination if needed
      );
      
      const querySnapshot = await getDocs(shapesQuery);
      const shapes: Shape[] = [];
      
      querySnapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as Shape);
      });

      // Client-side pagination (for now)
      return shapes.slice(offset, offset + limit);
    } catch (error) {
      console.error('❌ Error fetching paginated shapes:', error);
      throw error;
    }
  }

  // ===== CANVAS MANAGEMENT =====

  /**
   * Generate a new unique canvas ID
   */
  private generateCanvasId(): string {
    return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new canvas
   * @param name - Canvas name
   * @param userId - User ID who created the canvas
   * @param isShared - Whether the canvas is shared (true) or private (false)
   * @returns The created canvas
   */
  async createCanvas(name: string, userId: string, isShared: boolean): Promise<Canvas> {
    try {
      const canvasId = this.generateCanvasId();
      const now = serverTimestamp() as Timestamp;
      
      const canvasData: Omit<Canvas, 'id'> = {
        name,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        isShared,
        lastAccessedBy: userId,
        lastAccessedAt: now,
      };

      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      await setDoc(canvasDocRef, canvasData);

      return {
        id: canvasId,
        ...canvasData,
      } as Canvas;
    } catch (error) {
      console.error('❌ Error creating canvas:', error);
      throw error;
    }
  }

  /**
   * Get all canvases accessible to a user (their private + all shared)
   * @param userId - User ID
   * @returns Array of accessible canvases
   */
  async getCanvases(userId: string): Promise<Canvas[]> {
    try {
      // Get user's private canvases
      const privateQuery = query(
        collection(firestore, 'canvases'),
        where('createdBy', '==', userId),
        where('isShared', '==', false),
        orderBy('updatedAt', 'desc')
      );
      
      // Get all shared canvases
      const sharedQuery = query(
        collection(firestore, 'canvases'),
        where('isShared', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const [privateSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(privateQuery),
        getDocs(sharedQuery)
      ]);

      const canvases: Canvas[] = [];
      
      // Add private canvases
      privateSnapshot.forEach((doc) => {
        canvases.push({
          id: doc.id,
          ...doc.data(),
        } as Canvas);
      });
      
      // Add shared canvases
      sharedSnapshot.forEach((doc) => {
        canvases.push({
          id: doc.id,
          ...doc.data(),
        } as Canvas);
      });

      // Sort by updatedAt descending
      canvases.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });

      return canvases;
    } catch (error) {
      console.error('❌ Error fetching canvases:', error);
      throw error;
    }
  }

  /**
   * Get a specific canvas by ID
   * @param canvasId - Canvas ID
   * @returns Canvas data or null if not found
   */
  async getCanvas(canvasId: string): Promise<Canvas | null> {
    try {
      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      const canvasDoc = await getDoc(canvasDocRef);
      
      if (!canvasDoc.exists()) {
        return null;
      }
      
      return {
        id: canvasId,
        ...canvasDoc.data(),
      } as Canvas;
    } catch (error) {
      console.error('❌ Error getting canvas:', error);
      throw error;
    }
  }

  /**
   * Update canvas name
   * @param canvasId - Canvas ID
   * @param name - New canvas name
   */
  async updateCanvasName(canvasId: string, name: string): Promise<void> {
    try {
      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      await updateDoc(canvasDocRef, {
        name,
        updatedAt: serverTimestamp() as Timestamp,
      });
    } catch (error) {
      console.error('❌ Error updating canvas name:', error);
      throw error;
    }
  }

  /**
   * Delete a canvas and all its shapes/groups
   * @param canvasId - Canvas ID to delete
   */
  async deleteCanvas(canvasId: string): Promise<void> {
    try {
      // Get all shapes in the canvas
      const shapesCollectionRef = collection(firestore, this.getShapesCollectionPath(canvasId));
      const shapesSnapshot = await getDocs(shapesCollectionRef);
      
      // Get all groups in the canvas
      const groupsCollectionRef = collection(firestore, this.getGroupsCollectionPath(canvasId));
      const groupsSnapshot = await getDocs(groupsCollectionRef);
      
      // Use batch to delete everything atomically
      const batch = writeBatch(firestore);
      
      // Delete all shapes
      shapesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete all groups
      groupsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete canvas metadata
      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      batch.delete(canvasDocRef);
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error deleting canvas:', error);
      throw error;
    }
  }

  /**
   * Update canvas sharing status
   * @param canvasId - Canvas ID
   * @param isShared - New sharing status
   */
  async updateCanvasSharing(canvasId: string, isShared: boolean): Promise<void> {
    try {
      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      await updateDoc(canvasDocRef, {
        isShared,
        updatedAt: serverTimestamp() as Timestamp,
      });
    } catch (error) {
      console.error('❌ Error updating canvas sharing:', error);
      throw error;
    }
  }

  /**
   * Duplicate a canvas with all its shapes and groups
   * @param canvasId - Canvas ID to duplicate
   * @param newName - Name for the new canvas
   * @param userId - User ID who is duplicating
   * @returns The new canvas
   */
  async duplicateCanvas(canvasId: string, newName: string, userId: string): Promise<Canvas> {
    try {
      // Get original canvas
      const originalCanvas = await this.getCanvas(canvasId);
      if (!originalCanvas) {
        throw new Error('Canvas not found');
      }

      // Create new canvas
      const newCanvas = await this.createCanvas(newName, userId, originalCanvas.isShared);
      
      // Get all shapes from original canvas
      const originalShapesCollectionRef = collection(firestore, this.getShapesCollectionPath(canvasId));
      const shapesSnapshot = await getDocs(originalShapesCollectionRef);
      
      // Get all groups from original canvas
      const originalGroupsCollectionRef = collection(firestore, this.getGroupsCollectionPath(canvasId));
      const groupsSnapshot = await getDocs(originalGroupsCollectionRef);
      
      // Create new shapes in the new canvas
      const newShapesCollectionRef = collection(firestore, this.getShapesCollectionPath(newCanvas.id));
      const batch = writeBatch(firestore);
      const shapeIdMap = new Map<string, string>(); // Map old shape IDs to new ones
      
      // Duplicate shapes
      shapesSnapshot.forEach((shapeDoc) => {
        const shapeData = shapeDoc.data() as Shape;
        const newShapeId = this.generateShapeId();
        shapeIdMap.set(shapeDoc.id, newShapeId);
        
        const newShapeData = {
          ...shapeData,
          id: newShapeId,
          createdBy: userId,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          groupId: null, // Will be updated after groups are created
        };
        
        const newShapeDocRef = doc(newShapesCollectionRef, newShapeId);
        batch.set(newShapeDocRef, newShapeData);
      });
      
      // Duplicate groups with updated shape IDs
      const newGroupsCollectionRef = collection(firestore, this.getGroupsCollectionPath(newCanvas.id));
      groupsSnapshot.forEach((groupDoc) => {
        const groupData = groupDoc.data() as Group;
        const newGroupId = this.generateGroupId();
        
        // Update shape IDs in the group
        const newShapeIds = groupData.shapeIds
          .map(oldId => shapeIdMap.get(oldId))
          .filter(Boolean) as string[];
        
        const newGroupData = {
          ...groupData,
          id: newGroupId,
          shapeIds: newShapeIds,
          createdBy: userId,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };
        
        const newGroupDocRef = doc(newGroupsCollectionRef, newGroupId);
        batch.set(newGroupDocRef, newGroupData);
        
        // Update shapes with new group ID
        newShapeIds.forEach(shapeId => {
          const shapeDocRef = doc(newShapesCollectionRef, shapeId);
          batch.update(shapeDocRef, { groupId: newGroupId });
        });
      });
      
      await batch.commit();
      return newCanvas;
    } catch (error) {
      console.error('❌ Error duplicating canvas:', error);
      throw error;
    }
  }

  /**
   * Update last accessed information for a canvas
   * @param canvasId - Canvas ID
   * @param userId - User ID who accessed the canvas
   */
  async updateCanvasAccess(canvasId: string, userId: string): Promise<void> {
    try {
      const canvasDocRef = doc(firestore, 'canvases', canvasId);
      await updateDoc(canvasDocRef, {
        lastAccessedBy: userId,
        lastAccessedAt: serverTimestamp() as Timestamp,
      });
    } catch (error) {
      console.error('❌ Error updating canvas access:', error);
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
