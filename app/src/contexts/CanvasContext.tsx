import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { Shape, CreateShapeData } from '../services/canvasService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

// Drawing state for shape preview during drag
export interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  previewShape: { x: number; y: number; width: number; height: number } | null;
}

// Canvas interaction modes
export type CanvasMode = 'pan' | 'create';

export interface CanvasState {
  // Mode state
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  
  // Color state
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Shapes state
  shapes: Shape[];
  isLoadingShapes: boolean;
  
  // Selection state
  selectedShapeId: string | null;
  setSelectedShapeId: (shapeId: string | null) => void;
  
  // Drawing state
  drawingState: DrawingState;
  setDrawingState: (state: DrawingState) => void;
  
  // Shape operations
  createShape: (shapeData: Omit<CreateShapeData, 'createdBy'>) => Promise<void>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
  
  // Locking operations
  lockShape: (shapeId: string) => Promise<boolean>;
  unlockShape: (shapeId: string) => Promise<void>;
  isShapeLockedByMe: (shape: Shape) => boolean;
  isShapeLockedByOther: (shape: Shape) => boolean;
  getShapeLockStatus: (shape: Shape) => 'unlocked' | 'locked-by-me' | 'locked-by-other';
  
  // Drawing helpers
  startDrawing: (x: number, y: number) => void;
  updateDrawing: (x: number, y: number) => void;
  finishDrawing: () => Promise<void>;
  cancelDrawing: () => void;
}

export const CanvasContext = createContext<CanvasState | undefined>(undefined);

interface CanvasProviderProps {
  children: React.ReactNode;
}

const initialDrawingState: DrawingState = {
  isDrawing: false,
  startPoint: null,
  currentPoint: null,
  previewShape: null,
};

export function CanvasProvider({ children }: CanvasProviderProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<CanvasMode>('create'); // Default to create mode
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SHAPE_COLOR);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState<boolean>(true);
  const [drawingState, setDrawingState] = useState<DrawingState>(initialDrawingState);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  // Lock timeout management
  const lockTimeoutRef = useRef<Map<string, number>>(new Map());


  // Subscribe to shapes updates
  useEffect(() => {
    if (!user) {
      setShapes([]);
      setIsLoadingShapes(false);
      return;
    }

    setIsLoadingShapes(true);
    
    const unsubscribe = canvasService.subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setIsLoadingShapes(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Shape operations
  const createShape = useCallback(async (shapeData: Omit<CreateShapeData, 'createdBy'>) => {
    if (!user) {
      throw new Error('User must be authenticated to create shapes');
    }

    try {
      await canvasService.createShape({
        ...shapeData,
        createdBy: user.uid,
      });
    } catch (error) {
      console.error('Failed to create shape:', error);
      throw error;
    }
  }, [user]);

  const updateShape = useCallback(async (shapeId: string, updates: any) => {
    try {
      await canvasService.updateShape(shapeId, updates);
    } catch (error) {
      console.error('Failed to update shape:', error);
      throw error;
    }
  }, []);

  // Drawing helpers
  const startDrawing = useCallback((x: number, y: number) => {
    setDrawingState({
      isDrawing: true,
      startPoint: { x, y },
      currentPoint: { x, y },
      previewShape: null,
    });
  }, []);

  const updateDrawing = useCallback((x: number, y: number) => {
    setDrawingState(prev => {
      if (!prev.isDrawing || !prev.startPoint) return prev;

      // Normalize rectangle coordinates
      const normalized = canvasService.normalizeRectangle(
        prev.startPoint.x,
        prev.startPoint.y,
        x,
        y
      );

      return {
        ...prev,
        currentPoint: { x, y },
        previewShape: normalized,
      };
    });
  }, []);

  const finishDrawing = useCallback(async () => {
    if (!drawingState.isDrawing || !drawingState.previewShape) {
      setDrawingState(initialDrawingState);
      return;
    }

    const { x, y, width, height } = drawingState.previewShape;

    // Validate minimum size (10x10 pixels)
    if (width < 10 || height < 10) {
      console.log('Shape too small, ignoring (minimum 10x10)');
      setDrawingState(initialDrawingState);
      return;
    }

    // Validate canvas bounds
    if (!canvasService.validateShapeBounds(x, y, width, height)) {
      console.log('Shape outside canvas bounds, ignoring');
      setDrawingState(initialDrawingState);
      return;
    }

    try {
      await createShape({
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color: selectedColor,
      });

      console.log('✅ Shape created successfully');
    } catch (error) {
      console.error('❌ Failed to create shape:', error);
    }

    setDrawingState(initialDrawingState);
  }, [drawingState, selectedColor, createShape]);

  const cancelDrawing = useCallback(() => {
    setDrawingState(initialDrawingState);
  }, []);

  // Locking operations
  const lockShape = useCallback(async (shapeId: string): Promise<boolean> => {
    if (!user) {
      console.error('User must be authenticated to lock shapes');
      return false;
    }

    try {
      const lockAcquired = await canvasService.lockShape(shapeId, user.uid);
      
      if (lockAcquired) {
        setSelectedShapeId(shapeId);
        
        // Set up auto-unlock timeout (5 seconds)
        const existingTimeout = lockTimeoutRef.current.get(shapeId);
        if (existingTimeout) {
          window.clearTimeout(existingTimeout);
        }
        
        const timeout = window.setTimeout(async () => {
          try {
            await canvasService.unlockShape(shapeId);
            setSelectedShapeId(prev => prev === shapeId ? null : prev);
            lockTimeoutRef.current.delete(shapeId);
          } catch (error) {
            console.error('Error auto-unlocking shape:', error);
          }
        }, 5000);
        
        lockTimeoutRef.current.set(shapeId, timeout);
      } else {
        // Lock failed - show toast with owner name
        const shape = shapes.find(s => s.id === shapeId);
        if (shape?.lockedBy) {
          try {
            const ownerName = await canvasService.getUserDisplayName(shape.lockedBy);
            showToast(`Shape locked by ${ownerName}`, 'error');
          } catch (error) {
            showToast('Shape is currently locked by another user', 'error');
          }
        }
      }
      
      return lockAcquired;
    } catch (error) {
      console.error('Error locking shape:', error);
      showToast('Failed to lock shape', 'error');
      return false;
    }
  }, [user, shapes, showToast]);

  const unlockShape = useCallback(async (shapeId: string): Promise<void> => {
    try {
      await canvasService.unlockShape(shapeId);
      setSelectedShapeId(prev => prev === shapeId ? null : prev);
      
      // Clear timeout
      const existingTimeout = lockTimeoutRef.current.get(shapeId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        lockTimeoutRef.current.delete(shapeId);
      }
    } catch (error) {
      console.error('Error unlocking shape:', error);
      throw error;
    }
  }, []);

  // Lock status helpers
  const isShapeLockedByMe = useCallback((shape: Shape): boolean => {
    if (!user || !shape.lockedBy) return false;
    
    // Check if lock is expired
    if (canvasService.isLockExpired(shape.lockedAt)) {
      return false;
    }
    
    return shape.lockedBy === user.uid;
  }, [user]);

  const isShapeLockedByOther = useCallback((shape: Shape): boolean => {
    if (!user || !shape.lockedBy) return false;
    
    // Check if lock is expired
    if (canvasService.isLockExpired(shape.lockedAt)) {
      return false;
    }
    
    return shape.lockedBy !== user.uid;
  }, [user]);

  const getShapeLockStatus = useCallback((shape: Shape): 'unlocked' | 'locked-by-me' | 'locked-by-other' => {
    if (!shape.lockedBy || canvasService.isLockExpired(shape.lockedAt)) {
      return 'unlocked';
    }
    
    if (!user) return 'locked-by-other';
    
    return shape.lockedBy === user.uid ? 'locked-by-me' : 'locked-by-other';
  }, [user]);

  // Clean up selected shape when it's no longer locked by me
  useEffect(() => {
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape && !isShapeLockedByMe(selectedShape)) {
        setSelectedShapeId(null);
      }
    }
  }, [selectedShapeId, shapes, isShapeLockedByMe]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      lockTimeoutRef.current.forEach(timeout => window.clearTimeout(timeout));
      lockTimeoutRef.current.clear();
    };
  }, []);

  const value: CanvasState = {
    mode,
    setMode,
    selectedColor,
    setSelectedColor,
    shapes,
    isLoadingShapes,
    selectedShapeId,
    setSelectedShapeId,
    drawingState,
    setDrawingState,
    createShape,
    updateShape,
    lockShape,
    unlockShape,
    isShapeLockedByMe,
    isShapeLockedByOther,
    getShapeLockStatus,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
