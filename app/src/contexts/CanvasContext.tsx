import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { Shape, CreateShapeData, Group } from '../services/canvasService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { ChatMessage } from '../types/chat';

// Drawing state for shape preview during drag
export interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  previewShape: { x: number; y: number; width: number; height: number } | null;
}

// Canvas interaction modes
export type CanvasMode = 'select' | 'create';

// Shape tool types
export type ShapeTool = 'rectangle' | 'circle' | 'triangle' | 'text';

export interface CanvasState {
  // Mode state
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  
  // Tool state
  activeTool: ShapeTool;
  setActiveTool: (tool: ShapeTool) => void;
  
  // Color state
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Shapes state
  shapes: Shape[];
  isLoadingShapes: boolean;
  // Lock status tracking (client-side)
  lockStatus: Record<string, 'pending' | 'confirmed' | 'expired' | 'failed'>;
  
  // Groups state
  groups: Group[];
  isLoadingGroups: boolean;
  
  // Selection state
  selectedShapes: string[];
  setSelectedShapes: (shapeIds: string[]) => void;
  toggleSelection: (shapeId: string) => void;
  clearSelection: () => void;
  markMultiSelect: () => void;
  
  // Drawing state
  drawingState: DrawingState;
  setDrawingState: (state: DrawingState) => void;
  
  // Text editing state
  editingTextId: string | null;
  editingTextValue: string | null;
  enterTextEdit: (shapeId: string, initialText: string) => void;
  updateTextValue: (text: string) => void;
  saveTextEdit: () => Promise<void>;
  cancelTextEdit: () => void;
  
  // Text formatting state
  selectedTextFormatting: {
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    fontSize: number;
  };
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setFontSize: (size: number) => void;
  applyBoldFormatting: () => Promise<void>;
  applyItalicFormatting: () => Promise<void>;
  applyUnderlineFormatting: () => Promise<void>;
  applyFontSizeFormatting: (size: number) => Promise<void>;
  
  // Shape operations
  createShape: (shapeData: Omit<CreateShapeData, 'createdBy'>) => Promise<void>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
  clearCanvas: () => Promise<void>;
  
  // Group operations
  groupShapes: (shapeIds: string[], name?: string) => Promise<string>;
  ungroupShapes: (groupId: string) => Promise<void>;
  getShapesInGroup: (groupId: string) => Shape[];
  isShapeInGroup: (shapeId: string) => boolean;
  getGroupForShape: (shapeId: string) => Group | null;
  
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
  
  // Chat state
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isChatProcessing: boolean;
  chatDrawerHeight: number;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  setChatOpen: (isOpen: boolean) => void;
  setChatProcessing: (isProcessing: boolean) => void;
  setChatDrawerHeight: (height: number) => void;
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
  const [mode, setMode] = useState<CanvasMode>('select'); // Default to select mode
  const [activeTool, setActiveTool] = useState<ShapeTool>('rectangle'); // Default to rectangle tool
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SHAPE_COLOR);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState<boolean>(true);
  const [lockStatus, setLockStatus] = useState<Record<string, 'pending' | 'confirmed' | 'expired' | 'failed'>>({});
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);
  const [drawingState, setDrawingState] = useState<DrawingState>(initialDrawingState);
  const [selectedShapes, setSelectedShapesState] = useState<string[]>([]);
  
  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string | null>(null);
  // Deprecated refs removed after lockStatus refactor
  
  // Text formatting state
  const [selectedTextFormatting, setSelectedTextFormatting] = useState({
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    fontSize: 16,
  });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [chatDrawerHeight, setChatDrawerHeight] = useState(300);
  
  // Wrapper function to track manual deselection
  const setSelectedShapes = useCallback((shapeIds: string[]) => {
    setSelectedShapesState(shapeIds);
  }, []);
  
  // Toggle selection for a shape (add if not present, remove if present)
  const toggleSelection = useCallback((shapeId: string) => {
    setSelectedShapesState(prev => 
      prev.includes(shapeId) 
        ? prev.filter(id => id !== shapeId)
        : [...prev, shapeId]
    );
  }, []);
  
  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedShapesState([]);
  }, []);
  
  // Mark a multi-select operation to prevent auto-deselection
  const markMultiSelect = useCallback(() => {}, []);
  
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
      // Derive lockStatus for each shape based on backend data
      setLockStatus(prev => {
        const newStatus: Record<string, 'pending' | 'confirmed' | 'expired' | 'failed'> = { ...prev };
        updatedShapes.forEach(shape => {
          if (shape.lockedBy === user?.uid) {
            newStatus[shape.id] = 'confirmed';
          } else {
            const prevStatus = prev[shape.id];
            if (prevStatus === 'confirmed' && shape.lockedBy !== user?.uid) {
              newStatus[shape.id] = 'expired';
            }
          }
        });
        return newStatus;
      });
      setIsLoadingShapes(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Subscribe to groups changes
  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoadingGroups(true);
    
    const unsubscribe = canvasService.subscribeToGroups('main', (updatedGroups) => {
      setGroups(updatedGroups);
      setIsLoadingGroups(false);
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

  const clearCanvas = useCallback(async () => {
    try {
      await canvasService.clearCanvas();
      // Clear selected shapes since canvas is now empty
      setSelectedShapes([]);
      // Clear any drawing state
      setDrawingState(initialDrawingState);
      // Clear all lock timeouts
      lockTimeoutRef.current.forEach(timeout => window.clearTimeout(timeout));
      lockTimeoutRef.current.clear();
      showToast('Canvas cleared successfully', 'success');
    } catch (error) {
      console.error('Failed to clear canvas:', error);
      showToast('Failed to clear canvas', 'error');
      throw error;
    }
  }, [showToast]);

  // Group operations
  const groupShapes = useCallback(async (shapeIds: string[], name?: string) => {
    if (!user) {
      throw new Error('User must be authenticated to group shapes');
    }
    
    try {
      const groupId = await canvasService.groupShapes(shapeIds, user.uid, name);
      showToast(`Grouped ${shapeIds.length} shapes`, 'success');
      
      // Keep the shapes selected after grouping
      // The shapes will be updated with groupId via the subscription
      // but we want to keep them selected to show the group is working
      setSelectedShapesState(shapeIds);
      return groupId;
    } catch (error) {
      console.error('Failed to group shapes:', error);
      showToast('Failed to group shapes', 'error');
      throw error;
    }
  }, [user, showToast]);

  const ungroupShapes = useCallback(async (groupId: string) => {
    try {
      await canvasService.ungroupShapes(groupId);
      showToast('Shapes ungrouped', 'success');
    } catch (error) {
      console.error('Failed to ungroup shapes:', error);
      showToast('Failed to ungroup shapes', 'error');
      throw error;
    }
  }, [showToast]);

  const getShapesInGroup = useCallback((groupId: string): Shape[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return shapes.filter(shape => group.shapeIds.includes(shape.id));
  }, [groups, shapes]);

  const isShapeInGroup = useCallback((shapeId: string): boolean => {
    return shapes.some(shape => shape.id === shapeId && shape.groupId);
  }, [shapes]);

  const getGroupForShape = useCallback((shapeId: string): Group | null => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !shape.groupId) return null;
    
    return groups.find(g => g.id === shape.groupId) || null;
  }, [shapes, groups]);

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

      let normalized;
      let clampedPosition;
      let constrainedShape;

      if (activeTool === 'circle') {
        // For circles, use the same bounding box logic as rectangles
        normalized = canvasService.normalizeRectangle(
          prev.startPoint.x,
          prev.startPoint.y,
          x,
          y
        );

        // Clamp preview shape to canvas bounds
        clampedPosition = canvasService.clampShapeToCanvas(
          normalized.x,
          normalized.y,
          normalized.width,
          normalized.height
        );

        // Create constrained preview shape (bounding box for circle preview)
        constrainedShape = {
          x: clampedPosition.x,
          y: clampedPosition.y,
          width: Math.min(normalized.width, CANVAS_WIDTH - clampedPosition.x),
          height: Math.min(normalized.height, CANVAS_HEIGHT - clampedPosition.y),
        };
      } else {
        // For rectangles and triangles, use the same logic
        normalized = canvasService.normalizeRectangle(
          prev.startPoint.x,
          prev.startPoint.y,
          x,
          y
        );

        // Clamp preview shape to canvas bounds
        clampedPosition = canvasService.clampShapeToCanvas(
          normalized.x,
          normalized.y,
          normalized.width,
          normalized.height
        );

        // Create constrained preview shape
        constrainedShape = {
          x: clampedPosition.x,
          y: clampedPosition.y,
          width: Math.min(normalized.width, CANVAS_WIDTH - clampedPosition.x),
          height: Math.min(normalized.height, CANVAS_HEIGHT - clampedPosition.y),
        };
      }

      return {
        ...prev,
        currentPoint: { x, y },
        previewShape: constrainedShape,
      };
    });
  }, [activeTool]);

  const finishDrawing = useCallback(async () => {
    if (!drawingState.isDrawing || !drawingState.previewShape || !drawingState.startPoint) {
      setDrawingState(initialDrawingState);
      return;
    }

    try {
      if (activeTool === 'circle') {
        // Use the same coordinates as the preview to ensure consistency
        const { x, y, width, height } = drawingState.previewShape;
        
        // Calculate circle properties from the preview shape (same as preview)
        const size = Math.min(width, height);

        // Validate minimum size (10px)
        if (size < 10) {
          setDrawingState(initialDrawingState);
          return;
        }

        // Validate circle bounds
        if (!canvasService.validateShapeBounds(x, y, size, size)) {
          setDrawingState(initialDrawingState);
          return;
        }

        await canvasService.createCircle(
          x,
          y,
          size,
          size,
          selectedColor,
          user!.uid
        );
      } else if (activeTool === 'triangle') {
        // Use the same coordinates as the preview to ensure consistency
        const { x, y, width, height } = drawingState.previewShape;
        
        // Validate minimum size (10x10 pixels)
        if (width < 10 || height < 10) {
          setDrawingState(initialDrawingState);
          return;
        }

        // Validate canvas bounds
        if (!canvasService.validateShapeBounds(x, y, width, height)) {
          setDrawingState(initialDrawingState);
          return;
        }

        await canvasService.createTriangle(
          x,
          y,
          width,
          height,
          selectedColor,
          user!.uid
        );
      } else {
        // Rectangle (existing logic)
        // Use the same coordinates as the preview to ensure consistency
        const { x, y, width, height } = drawingState.previewShape;
        
        // Validate minimum size (10x10 pixels)
        if (width < 10 || height < 10) {
          setDrawingState(initialDrawingState);
          return;
        }

        // Validate canvas bounds
        if (!canvasService.validateShapeBounds(x, y, width, height)) {
          setDrawingState(initialDrawingState);
          return;
        }

        await createShape({
          type: 'rectangle',
          x,
          y,
          width,
          height,
          color: selectedColor,
        });
      }

    } catch (error) {
      console.error('❌ Failed to create shape:', error);
    }

    setDrawingState(initialDrawingState);
  }, [drawingState, selectedColor, createShape, activeTool, user]);

  const cancelDrawing = useCallback(() => {
    setDrawingState(initialDrawingState);
  }, []);

  // Chat helper functions
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some(existing => existing.id === message.id);
      if (exists) {
        console.warn('Duplicate message ID detected:', message.id);
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  // Text editing functions
  const enterTextEdit = useCallback(async (shapeId: string, initialText: string) => {
    if (!user) {
      console.error('❌ User not authenticated for text editing');
      return;
    }

    try {
      // Try to acquire editing rights
      const editingStarted = await canvasService.startTextEditing(shapeId, user.uid);
      
      if (!editingStarted) {
        // Get the shape to show who is editing it
        const shape = shapes.find(s => s.id === shapeId);
        if (shape?.editingBy) {
          try {
            const editorName = await canvasService.getUserDisplayName(shape.editingBy);
            showToast(`Text is being edited by ${editorName}`, 'error');
          } catch (error) {
            showToast('Text is currently being edited by another user', 'error');
          }
        } else {
          showToast('Text is currently being edited by another user', 'error');
        }
        return;
      }

      // Successfully acquired editing rights
      setEditingTextId(shapeId);
      setEditingTextValue(initialText);
    } catch (error) {
      console.error('❌ Error starting text editing:', error);
      showToast('Failed to start text editing', 'error');
    }
  }, [user, shapes, showToast]);

  const updateTextValue = useCallback((text: string) => {
    setEditingTextValue(text);
  }, []);

  const saveTextEdit = useCallback(async () => {
    if (!editingTextId || !editingTextValue) return;
    
    try {
      await canvasService.updateShapeText(editingTextId, editingTextValue);
      // Clear editing state from Firestore
      await canvasService.stopTextEditing(editingTextId);
      
      // Maintain selection of the text shape after editing
      setSelectedShapes([editingTextId]);
      
      setEditingTextId(null);
      setEditingTextValue(null);
    } catch (error) {
      console.error('Failed to save text edit:', error);
      showToast('Failed to save text changes', 'error');
    }
  }, [editingTextId, editingTextValue, showToast, setSelectedShapes]);

  const cancelTextEdit = useCallback(async () => {
    if (editingTextId) {
      try {
        // Clear editing state from Firestore
        await canvasService.stopTextEditing(editingTextId);
      } catch (error) {
        console.error('Failed to stop text editing:', error);
      }
      
      // Maintain selection of the text shape after cancelling edit
      setSelectedShapes([editingTextId]);
    }
    setEditingTextId(null);
    setEditingTextValue(null);
  }, [editingTextId, setSelectedShapes]);

  // Text formatting functions
  const toggleBold = useCallback(() => {
    setSelectedTextFormatting(prev => ({
      ...prev,
      fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
    }));
  }, []);

  const toggleItalic = useCallback(() => {
    setSelectedTextFormatting(prev => ({
      ...prev,
      fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
    }));
  }, []);

  const toggleUnderline = useCallback(() => {
    setSelectedTextFormatting(prev => ({
      ...prev,
      textDecoration: prev.textDecoration === 'underline' ? 'none' : 'underline'
    }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    // Validate font size (1-500px as per requirements)
    const validatedSize = Math.max(1, Math.min(500, size));
    setSelectedTextFormatting(prev => ({
      ...prev,
      fontSize: validatedSize
    }));
  }, []);

  // Apply formatting to selected text shape or currently editing text
  const applyBoldFormatting = useCallback(async () => {
    let targetShapeId: string | null = null;
    
    // Check if we're editing text
    if (editingTextId) {
      targetShapeId = editingTextId;
    } else if (selectedShapes.length === 1) {
      const selectedShape = shapes.find(shape => shape.id === selectedShapes[0]);
      if (selectedShape && selectedShape.type === 'text') {
        targetShapeId = selectedShape.id;
      }
    }
    
    if (targetShapeId) {
      try {
        await canvasService.toggleTextBold(targetShapeId);
        toggleBold(); // Update local state
      } catch (error) {
        console.error('Failed to apply bold formatting:', error);
        showToast('Failed to apply bold formatting', 'error');
      }
    }
  }, [editingTextId, selectedShapes, shapes, toggleBold, showToast]);

  const applyItalicFormatting = useCallback(async () => {
    let targetShapeId: string | null = null;
    
    // Check if we're editing text
    if (editingTextId) {
      targetShapeId = editingTextId;
    } else if (selectedShapes.length === 1) {
      const selectedShape = shapes.find(shape => shape.id === selectedShapes[0]);
      if (selectedShape && selectedShape.type === 'text') {
        targetShapeId = selectedShape.id;
      }
    }
    
    if (targetShapeId) {
      try {
        await canvasService.toggleTextItalic(targetShapeId);
        toggleItalic(); // Update local state
      } catch (error) {
        console.error('Failed to apply italic formatting:', error);
        showToast('Failed to apply italic formatting', 'error');
      }
    }
  }, [editingTextId, selectedShapes, shapes, toggleItalic, showToast]);

  const applyUnderlineFormatting = useCallback(async () => {
    let targetShapeId: string | null = null;
    
    // Check if we're editing text
    if (editingTextId) {
      targetShapeId = editingTextId;
    } else if (selectedShapes.length === 1) {
      const selectedShape = shapes.find(shape => shape.id === selectedShapes[0]);
      if (selectedShape && selectedShape.type === 'text') {
        targetShapeId = selectedShape.id;
      }
    }
    
    if (targetShapeId) {
      try {
        await canvasService.toggleTextUnderline(targetShapeId);
        toggleUnderline(); // Update local state
      } catch (error) {
        console.error('Failed to apply underline formatting:', error);
        showToast('Failed to apply underline formatting', 'error');
      }
    }
  }, [editingTextId, selectedShapes, shapes, toggleUnderline, showToast]);

  const applyFontSizeFormatting = useCallback(async (size: number) => {
    let targetShapeId: string | null = null;
    
    // Check if we're editing text
    if (editingTextId) {
      targetShapeId = editingTextId;
    } else if (selectedShapes.length === 1) {
      const selectedShape = shapes.find(shape => shape.id === selectedShapes[0]);
      if (selectedShape && selectedShape.type === 'text') {
        targetShapeId = selectedShape.id;
      }
    }
    
    if (targetShapeId) {
      try {
        await canvasService.updateTextFontSize(targetShapeId, size);
        setFontSize(size); // Update local state
      } catch (error) {
        console.error('Failed to apply font size:', error);
        showToast('Failed to apply font size', 'error');
      }
    }
  }, [editingTextId, selectedShapes, shapes, setFontSize, showToast]);

  // Locking operations
  const lockShape = useCallback(async (shapeId: string): Promise<boolean> => {
    if (!user) {
      console.error('User must be authenticated to lock shapes');
      return false;
    }

    try {
      // Immediately mark as pending
      setLockStatus(prev => ({ ...prev, [shapeId]: 'pending' }));

      const lockAcquired = await canvasService.lockShape(shapeId, user.uid);

      if (lockAcquired) {
        setSelectedShapes([shapeId]);
        setLockStatus(prev => ({ ...prev, [shapeId]: 'confirmed' }));

        // Set up auto-unlock timeout (5 seconds)
        const existingTimeout = lockTimeoutRef.current.get(shapeId);
        if (existingTimeout) {
          window.clearTimeout(existingTimeout);
        }

        const timeout = window.setTimeout(async () => {
          try {
            await canvasService.unlockShape(shapeId);
            setLockStatus(prev => ({ ...prev, [shapeId]: 'expired' }));
            setSelectedShapesState(prev => prev.filter(id => id !== shapeId));
            lockTimeoutRef.current.delete(shapeId);
          } catch (error) {
            console.error('Error auto-unlocking shape:', error);
          }
        }, 5000);

        lockTimeoutRef.current.set(shapeId, timeout);
      } else {
        setLockStatus(prev => ({ ...prev, [shapeId]: 'failed' }));
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
      setSelectedShapesState(prev => prev.filter(id => id !== shapeId));
      setLockStatus(prev => ({ ...prev, [shapeId]: 'expired' }));
      
      // Clear timeout
      const existingTimeout = lockTimeoutRef.current.get(shapeId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        lockTimeoutRef.current.delete(shapeId);
      }
    } catch (error) {
      // Only log if it's not a "document not found" error (shape was deleted)
      if (error instanceof Error && !error.message?.includes('No document to update')) {
        console.error('Error unlocking shape:', error);
      }
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

  // Clear selection when lockStatus for a selected shape becomes 'expired' or shape deleted
  useEffect(() => {
    if (selectedShapes.length === 0) return;

    const hasExpired = selectedShapes.some(id => lockStatus[id] === 'expired' || !shapes.find(s => s.id === id));
    if (hasExpired) {
      setSelectedShapesState([]);
    }
  }, [selectedShapes, lockStatus, shapes]);

  // Update text formatting when a text shape is selected or being edited
  useEffect(() => {
    if (editingTextId) {
      // When editing text, use the editing shape's formatting
      const editingShape = shapes.find(shape => shape.id === editingTextId);
      if (editingShape && editingShape.type === 'text') {
        setSelectedTextFormatting({
          fontWeight: editingShape.fontWeight || 'normal',
          fontStyle: editingShape.fontStyle || 'normal',
          textDecoration: editingShape.textDecoration || 'none',
          fontSize: editingShape.fontSize || 16,
        });
      }
    } else if (selectedShapes.length === 1) {
      // When a text shape is selected (but not editing)
      const selectedShape = shapes.find(shape => shape.id === selectedShapes[0]);
      if (selectedShape && selectedShape.type === 'text') {
        setSelectedTextFormatting({
          fontWeight: selectedShape.fontWeight || 'normal',
          fontStyle: selectedShape.fontStyle || 'normal',
          textDecoration: selectedShape.textDecoration || 'none',
          fontSize: selectedShape.fontSize || 16,
        });
      }
    } else {
      // Reset to defaults when no text is selected or multiple shapes are selected
      setSelectedTextFormatting({
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        fontSize: 16,
      });
    }
  }, [editingTextId, selectedShapes, shapes]);

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
    activeTool,
    setActiveTool,
    selectedColor,
    setSelectedColor,
    shapes,
    isLoadingShapes,
    lockStatus,
    groups,
    isLoadingGroups,
    selectedShapes,
    setSelectedShapes,
    toggleSelection,
    clearSelection,
    markMultiSelect,
    drawingState,
    setDrawingState,
    editingTextId,
    editingTextValue,
    enterTextEdit,
    updateTextValue,
    saveTextEdit,
    cancelTextEdit,
    selectedTextFormatting,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setFontSize,
    applyBoldFormatting,
    applyItalicFormatting,
    applyUnderlineFormatting,
    applyFontSizeFormatting,
    createShape,
    updateShape,
    clearCanvas,
    groupShapes,
    ungroupShapes,
    getShapesInGroup,
    isShapeInGroup,
    getGroupForShape,
    lockShape,
    unlockShape,
    isShapeLockedByMe,
    isShapeLockedByOther,
    getShapeLockStatus,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    chatMessages,
    isChatOpen,
    isChatProcessing,
    chatDrawerHeight,
    setChatMessages,
    addChatMessage,
    clearChatMessages,
    setChatOpen: setIsChatOpen,
    setChatProcessing: setIsChatProcessing,
    setChatDrawerHeight,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
