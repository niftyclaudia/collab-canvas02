import React, { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { Shape, CreateShapeData } from '../services/canvasService';
import { useAuth } from '../hooks/useAuth';

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
  
  // Drawing state
  drawingState: DrawingState;
  setDrawingState: (state: DrawingState) => void;
  
  // Shape operations
  createShape: (shapeData: Omit<CreateShapeData, 'createdBy'>) => Promise<void>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
  
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
  const [mode, setMode] = useState<CanvasMode>('create'); // Default to create mode
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SHAPE_COLOR);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState<boolean>(true);
  const [drawingState, setDrawingState] = useState<DrawingState>(initialDrawingState);


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

  const value: CanvasState = {
    mode,
    setMode,
    selectedColor,
    setSelectedColor,
    shapes,
    isLoadingShapes,
    drawingState,
    setDrawingState,
    createShape,
    updateShape,
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
