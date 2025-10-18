import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Circle } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../../utils/constants';
import { useCursors } from '../../hooks/useCursors';
import { useCanvas } from '../../hooks/useCanvas';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { CursorLayer } from '../Collaboration/CursorLayer';
import { canvasService } from '../../services/canvasService';
import type { Shape } from '../../services/canvasService';
import { logger } from '../../utils/logger';
import { ShapeControls } from './ShapeControls';

// Constants for rotation handles
const ROTATION_HANDLE_DISTANCE = 150; // Distance from shape top to rotation handle

// Helper function to calculate triangle vertices (equilateral triangle pointing upward)
const calculateTriangleVertices = (width: number, height: number) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Equilateral triangle pointing upward
  // Top vertex, bottom left vertex, bottom right vertex
  return [
    { x: 0, y: -halfHeight },           // Top
    { x: -halfWidth, y: halfHeight },   // Bottom left
    { x: halfWidth, y: halfHeight },    // Bottom right
  ];
};

export function Canvas() {
  const stageRef = useRef<any>(null);
  
  // Resize handle hover state
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Track shapes that should have selectors hidden (for immediate deselection)
  const [hiddenSelectors, setHiddenSelectors] = useState<Set<string>>(new Set());
  
  // Marquee selection state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  
  // Track if Shift key is held for marquee selection
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  
  // Rotation state management - consolidated into single object
  const [rotationState, setRotationState] = useState<{
    isRotating: boolean;
    hoveredHandle: string | null;
    previewRotation: number | null;
    start: {
      shapeId: string;
      initialAngle: number;
      initialRotation: number;
    } | null;
  }>({
    isRotating: false,
    hoveredHandle: null,
    previewRotation: null,
    start: null,
  });
  
  // Track shape node refs for real-time position updates during drag
  const shapeNodesRef = useRef<Map<string, Konva.Group>>(new Map());
  
  // Controls panel state for delete/duplicate buttons
  const [controlsPanel, setControlsPanel] = useState<{
    isVisible: boolean;
    shapeId: string | null;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    shapeId: null,
    position: { x: 0, y: 0 }
  });
  
  // Clipboard state for copy/paste functionality
  const [clipboard, setClipboard] = useState<Shape[] | null>(null);
  const PASTE_OFFSET = 30; // 30px offset for pasted shapes
  
  // Ref to track current selection for keyboard shortcuts
  const selectedShapesRef = useRef<string[]>([]);
  
  // Ref to track clipboard for keyboard shortcuts
  const clipboardRef = useRef<Shape[] | null>(null);
  
  // Force re-render trigger for smooth handle updates with throttling
  const [, setUpdateTrigger] = useState(0);
  const forceUpdateRef = useRef<number | null>(null);
  const forceUpdate = useCallback(() => {
    if (forceUpdateRef.current) {
      cancelAnimationFrame(forceUpdateRef.current);
    }
    forceUpdateRef.current = requestAnimationFrame(() => {
      setUpdateTrigger(prev => prev + 1);
      forceUpdateRef.current = null;
    });
  }, []);
  
  // Resize state management
  const [isResizing, setIsResizing] = useState(false);
  
  // Operation lock to prevent race conditions (used for debugging and future features)
  const [activeOperation, setActiveOperation] = useState<'none' | 'resize' | 'rotate'>('none');
  const [activeHandle, setActiveHandle] = useState<{
    shapeId: string;
    handleType: 'corner' | 'edge';
    handleName: string;
  } | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    cursorX: number;
    cursorY: number;
    shapeX: number;
    shapeY: number;
    width: number;
    height: number;
    aspectRatio: number;
  } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{
    shapeId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Canvas state hook for shapes and drawing
  const { 
    mode,
    activeTool,
    shapes, 
    selectedColor, 
    selectedShapes,
    setSelectedShapes,
    toggleSelection,
    markMultiSelect,
    drawingState, 
    startDrawing, 
    updateDrawing, 
    finishDrawing, 
    cancelDrawing,
    lockShape,
    unlockShape,
    getShapeLockStatus,
    updateShape
  } = useCanvas();
  
  // Toast hook for error messages
  const { showToast } = useToast();
  
  // Auth hook for user information
  const { user } = useAuth();
  
  // Cursor tracking hook
  const { remoteCursors } = useCursors(stageRef);
  const animationFrameRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDeltaRef = useRef(0);
  const lastWheelEventRef = useRef<{ pointer: { x: number; y: number } } | null>(null);
  
  // Touch/pinch gesture state
  const touchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    center: { x: number; y: number };
    isGesturing: boolean;
  } | null>(null);
  
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60, // Account for navbar
  });
  const [isGesturing, setIsGesturing] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 60,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Cleanup animation frames and timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      if (forceUpdateRef.current) {
        cancelAnimationFrame(forceUpdateRef.current);
      }
    };
  }, []);

  // Cleanup shape node references on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      shapeNodesRef.current.clear();
    };
  }, []);

  // Clear hidden selectors when shapes are selected
  useEffect(() => {
    if (selectedShapes.length > 0) {
      setHiddenSelectors(prev => {
        const newSet = new Set(prev);
        selectedShapes.forEach(shapeId => newSet.delete(shapeId));
        return newSet;
      });
    }
    // Update ref for keyboard shortcuts
    selectedShapesRef.current = selectedShapes;
  }, [selectedShapes]);

// Update clipboard ref when clipboard state changes
useEffect(() => {
  clipboardRef.current = clipboard;
}, [clipboard]);

  // Clear hidden selectors when shapes are unlocked in Firestore
  useEffect(() => {
    shapes.forEach(shape => {
      if (hiddenSelectors.has(shape.id) && getShapeLockStatus(shape) === 'unlocked') {
        setHiddenSelectors(prev => {
          const newSet = new Set(prev);
          newSet.delete(shape.id);
          return newSet;
        });
      }
    });
  }, [shapes, hiddenSelectors, getShapeLockStatus]);

  // Register canvas reset function globally for debugging
  useEffect(() => {
    (window as any).canvasResetFunction = () => {
      const stage = stageRef.current;
      if (stage) {
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });
        stage.batchDraw();
      }
    };
    
    return () => {
      delete (window as any).canvasResetFunction;
    };
  }, []);

  // Utility functions for touch gestures
  const getDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const getCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Touch event handlers for pinch-to-zoom
  const handleTouchStart = useCallback((event: Event) => {
    const e = event as TouchEvent;
    if (e.touches.length !== 2) return;
    
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const distance = getDistance(e.touches);
    const center = getCenter(e.touches);
    
    touchStateRef.current = {
      initialDistance: distance,
      initialScale: stage.scaleX(),
      center,
      isGesturing: true,
    };
    setIsGesturing(true);
  }, [getDistance, getCenter]);

  const handleTouchMove = useCallback((event: Event) => {
    const e = event as TouchEvent;
    if (e.touches.length !== 2 || !touchStateRef.current) return;
    
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const currentDistance = getDistance(e.touches);
    const touchState = touchStateRef.current;
    
    if (touchState.initialDistance === 0) return;

    // Calculate scale change
    const scaleChange = currentDistance / touchState.initialDistance;
    let newScale = touchState.initialScale * scaleChange;
    
    // Apply zoom limits
    newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));

    // Calculate the point under the gesture center before scaling
    const gesturePointTo = {
      x: (touchState.center.x - stage.x()) / touchState.initialScale,
      y: (touchState.center.y - stage.y()) / touchState.initialScale,
    };

    // Apply new scale
    stage.scale({ x: newScale, y: newScale });

    // Calculate new position to keep zoom centered on gesture
    const newPos = {
      x: touchState.center.x - gesturePointTo.x * newScale,
      y: touchState.center.y - gesturePointTo.y * newScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();
    
    // Force React re-render for smooth handle size updates
    forceUpdate();
  }, [getDistance, getCenter, forceUpdate]);

  const handleTouchEnd = useCallback((event: Event) => {
    const e = event as TouchEvent;
    if (e.touches.length > 0) return;
    
    touchStateRef.current = null;
    setIsGesturing(false);
  }, []);

  // Add touch event listeners for pinch-to-zoom
  useEffect(() => {
    const canvasContainer = document.querySelector('.canvas-stage-container');
    if (!canvasContainer) return;

    canvasContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvasContainer.removeEventListener('touchstart', handleTouchStart);
      canvasContainer.removeEventListener('touchmove', handleTouchMove);
      canvasContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Smooth zoom animation function
  const performSmoothZoom = useCallback(() => {
    const stage = stageRef.current;
    const accumulatedDelta = accumulatedDeltaRef.current;
    const lastWheelEvent = lastWheelEventRef.current;
    
    if (!stage || !lastWheelEvent || Math.abs(accumulatedDelta) < 0.1) {
      animationFrameRef.current = null;
      return;
    }

    const oldScale = stage.scaleX();
    const pointer = lastWheelEvent.pointer;

    // Detect input device type based on deltaY patterns
    const isTouchpad = Math.abs(accumulatedDelta) < 50;
    
    // Calculate zoom factor based on input device and accumulated delta
    let zoomFactor;
    if (isTouchpad) {
      // Touchpad: more sensitive, smoother increments
      zoomFactor = 1 + (Math.abs(accumulatedDelta) * 0.002);
    } else {
      // Mouse wheel: less sensitive, more discrete steps  
      zoomFactor = 1 + (Math.abs(accumulatedDelta) * 0.001);
    }
    
    // Ensure meaningful zoom change
    zoomFactor = Math.max(zoomFactor, 1.01);
    
    // Apply zoom direction
    let newScale;
    if (accumulatedDelta < 0) {
      // Zoom in (wheel/swipe up)
      newScale = oldScale * zoomFactor;
    } else {
      // Zoom out (wheel/swipe down)
      newScale = oldScale / zoomFactor;
    }

    // Apply zoom limits
    newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));
    
    // Skip if no meaningful change
    if (Math.abs(newScale - oldScale) < 0.001) {
      accumulatedDeltaRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    // Calculate mouse point in canvas coordinates before scaling
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Apply new scale
    stage.scale({ x: newScale, y: newScale });

    // Calculate new position to keep zoom centered on cursor
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();

    // Force React re-render for smooth handle size updates
    forceUpdate();

    // Reset accumulated delta and clear animation frame
    accumulatedDeltaRef.current = 0;
    animationFrameRef.current = null;
  }, [forceUpdate]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    // Skip if we're currently handling touch gestures
    if (isGesturing) return;

    // Get pointer position relative to stage
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { deltaY, ctrlKey } = e.evt;
    
    // Detect pinch-to-zoom gesture (Ctrl+wheel or small precise deltas)
    const isPinchGesture = ctrlKey || (Math.abs(deltaY) < 10 && Math.abs(deltaY) > 0.1);
    
    if (isPinchGesture) {
      // Handle pinch-to-zoom directly for immediate response
      const oldScale = stage.scaleX();
      
      // Much more sensitive for pinch gestures
      const sensitivity = ctrlKey ? 0.01 : 0.005;
      const zoomFactor = 1 + (Math.abs(deltaY) * sensitivity);
      
      let newScale;
      if (deltaY < 0) {
        newScale = oldScale * zoomFactor;
      } else {
        newScale = oldScale / zoomFactor;
      }

      // Apply zoom limits
      newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));
      
      if (Math.abs(newScale - oldScale) < 0.001) return;

      // Calculate mouse point in canvas coordinates before scaling
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Apply new scale
      stage.scale({ x: newScale, y: newScale });

      // Calculate new position to keep zoom centered on cursor
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      
      stage.position(newPos);
      stage.batchDraw();
      
      // Force React re-render for smooth handle size updates
      forceUpdate();
    } else {
      // Handle regular wheel scrolling with smoothing
      accumulatedDeltaRef.current += deltaY;
      lastWheelEventRef.current = { pointer };

      // Clear any existing timeout
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      // Cancel any existing animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Debounce rapid wheel events for smoother experience
      wheelTimeoutRef.current = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(performSmoothZoom);
      }, 16); // ~60fps
    }
  }, [isGesturing, performSmoothZoom, forceUpdate]);

  const handleDragEnd = useCallback((_e: KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    // Only prevent extremely excessive panning (like 10,000px away from origin)
    const pos = stage.position();
    const maxDistance = 10000;
    
    let newPos = pos;
    let needsUpdate = false;
    
    // Only constrain if user has panned extremely far
    if (Math.abs(pos.x) > maxDistance) {
      newPos.x = pos.x > 0 ? maxDistance : -maxDistance;
      needsUpdate = true;
    }
    if (Math.abs(pos.y) > maxDistance) {
      newPos.y = pos.y > 0 ? maxDistance : -maxDistance;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      stage.position(newPos);
    }
    
    stage.batchDraw();
  }, []);

  // Shape click handlers - simplified for better reliability
  const handleShapeClick = useCallback(async (e: KonvaEventObject<MouseEvent>, shape: Shape) => {
    e.cancelBubble = true; // Prevent event from bubbling to stage
    
    // Check if Shift key is held for multi-select
    if (e.evt.shiftKey) {
      // Check if shape is currently selected (before toggle)
      const wasSelected = selectedShapes.includes(shape.id);
      
      // Toggle selection (add if not present, remove if present)
      toggleSelection(shape.id);
      
      // Update controls panel for multi-select
      if (wasSelected) {
        // Shape will be deselected, hide controls if no shapes will be selected
        if (selectedShapes.length === 1) {
          setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
        }
      } else {
        // Shape will be selected, show controls for multi-select
        setControlsPanel({ 
          isVisible: true, 
          shapeId: shape.id, 
          position: { x: shape.x, y: shape.y } 
        });
      }
      
      forceUpdate();
      return;
    }
    
    // Single selection (no Shift key)
    if (selectedShapes.length === 1 && selectedShapes[0] === shape.id) {
      // Deselect current shape
      setHiddenSelectors(prev => new Set(prev).add(shape.id));
      setSelectedShapes([]);
      forceUpdate();
      
      // Hide controls panel
      setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
      
      // Unlock in background
      unlockShape(shape.id).catch(error => {
        if (error instanceof Error && !error.message?.includes('No document to update')) {
          console.error('Failed to unlock shape:', error);
        }
      });
      return;
    }
    
    // If clicking on a different shape, switch selection
    if (selectedShapes.length > 0) {
      // Hide selectors for previously selected shapes
      selectedShapes.forEach(shapeId => {
        setHiddenSelectors(prev => new Set(prev).add(shapeId));
        // Unlock previous shapes in background
        unlockShape(shapeId).catch(error => {
          if (error instanceof Error && !error.message?.includes('No document to update')) {
            console.error('Failed to unlock previously selected shape:', error);
          }
        });
      });
    }
    
    // Select the new shape immediately
    setSelectedShapes([shape.id]);
    
    // Clear any hidden selectors for this shape
    setHiddenSelectors(prev => {
      const newSet = new Set(prev);
      newSet.delete(shape.id);
      return newSet;
    });
    
    // Force re-render to show selector immediately
    forceUpdate();
    
    // Lock the shape in background (don't wait for it)
    lockShape(shape.id).then(() => {
      // Show controls panel when shape is successfully locked
      const stage = stageRef.current;
      if (stage) {
        const stagePos = stage.getAbsolutePosition();
        const stageScale = stage.scaleX();
        
        // Calculate position above the shape
        let shapeX, shapeY;
        if (shape.type === 'circle') {
          shapeX = shape.x;
          shapeY = shape.y;
        } else {
          shapeX = shape.x + shape.width / 2;
          shapeY = shape.y + shape.height / 2;
        }
        
        setControlsPanel({
          isVisible: true,
          shapeId: shape.id,
          position: {
            x: (shapeX + stagePos.x) / stageScale,
            y: (shapeY + stagePos.y) / stageScale - 50 // 50px above shape
          }
        });
      }
    }).catch(error => {
      console.error('Failed to lock shape:', error);
      // Keep shape selected even if lock fails - user can manually deselect
    });
  }, [lockShape, selectedShapes, toggleSelection, setSelectedShapes, unlockShape, forceUpdate]);
  
  // Handle shape drag movement with boundary constraints
  const handleShapeDragMove = useCallback((e: KonvaEventObject<DragEvent>, shape: Shape) => {
    const node = e.target as Konva.Group;
    const centerX = node.x();
    const centerY = node.y();
    
    // Check if multiple shapes are selected for multi-shape dragging
    if (selectedShapes.length > 1 && selectedShapes.includes(shape.id)) {
      // Calculate the offset from the original position
      const originalShape = shapes.find(s => s.id === shape.id);
      if (originalShape) {
        let originalCenterX, originalCenterY;
        
        if (originalShape.type === 'circle') {
          originalCenterX = originalShape.x;
          originalCenterY = originalShape.y;
        } else {
          originalCenterX = originalShape.x + originalShape.width / 2;
          originalCenterY = originalShape.y + originalShape.height / 2;
        }
        
        const deltaX = centerX - originalCenterX;
        const deltaY = centerY - originalCenterY;
        
        // Apply the same offset to all selected shapes
        selectedShapes.forEach(shapeId => {
          if (shapeId !== shape.id) {
            const otherShape = shapes.find(s => s.id === shapeId);
            const otherNode = shapeNodesRef.current.get(shapeId);
            
            if (otherShape && otherNode) {
              let otherOriginalCenterX, otherOriginalCenterY;
              
              if (otherShape.type === 'circle') {
                otherOriginalCenterX = otherShape.x;
                otherOriginalCenterY = otherShape.y;
              } else {
                otherOriginalCenterX = otherShape.x + otherShape.width / 2;
                otherOriginalCenterY = otherShape.y + otherShape.height / 2;
              }
              
              const newX = otherOriginalCenterX + deltaX;
              const newY = otherOriginalCenterY + deltaY;
              
              // Apply boundary constraints to the new position
              if (otherShape.type === 'circle') {
                const radius = otherShape.radius || otherShape.width / 2;
                const clampedPosition = canvasService.clampCircleToCanvas(newX, newY, radius);
                otherNode.x(clampedPosition.x);
                otherNode.y(clampedPosition.y);
              } else {
                const topLeftX = newX - otherShape.width / 2;
                const topLeftY = newY - otherShape.height / 2;
                const clampedPosition = canvasService.clampShapeToCanvas(
                  topLeftX,
                  topLeftY,
                  otherShape.width,
                  otherShape.height
                );
                const clampedCenterX = clampedPosition.x + otherShape.width / 2;
                const clampedCenterY = clampedPosition.y + otherShape.height / 2;
                otherNode.x(clampedCenterX);
                otherNode.y(clampedCenterY);
              }
            }
          }
        });
      }
    }
    
    // Handle the dragged shape itself with boundary constraints
    if (shape.type === 'circle') {
      // For circles, use center coordinates directly
      const radius = shape.radius || shape.width / 2;
      
      // Clamp position to canvas boundaries in real-time using center coordinates
      const clampedPosition = canvasService.clampCircleToCanvas(centerX, centerY, radius);
      
      // Only update position if it was clamped
      if (clampedPosition.x !== centerX || clampedPosition.y !== centerY) {
        node.x(clampedPosition.x);
        node.y(clampedPosition.y);
      }
    } else {
      // For rectangles, convert center coordinates to top-left coordinates
      const topLeftX = centerX - shape.width / 2;
      const topLeftY = centerY - shape.height / 2;
      
      // Clamp position to canvas boundaries in real-time
      const clampedPosition = canvasService.clampShapeToCanvas(
        topLeftX, 
        topLeftY, 
        shape.width, 
        shape.height
      );
      
      // Convert back to center coordinates
      const clampedCenterX = clampedPosition.x + shape.width / 2;
      const clampedCenterY = clampedPosition.y + shape.height / 2;
      
      // Only update position if it was clamped
      if (clampedCenterX !== centerX || clampedCenterY !== centerY) {
        node.x(clampedCenterX);
        node.y(clampedCenterY);
      }
    }
    
    // Force React re-render for smooth handle position updates
    forceUpdate();
  }, [forceUpdate, selectedShapes, shapes]);

  const handleShapeDragEnd = useCallback(async (e: KonvaEventObject<DragEvent>, shape: Shape) => {
    const node = e.target as Konva.Group;
    const centerX = node.x();
    const centerY = node.y();
    
    let finalPosition;
    
    if (shape.type === 'circle') {
      // For circles, use center coordinates directly
      const radius = shape.radius || shape.width / 2;
      
      // Validate and clamp final position using center coordinates
      const clampedPosition = canvasService.clampCircleToCanvas(centerX, centerY, radius);
      
      // Apply clamped position if needed
      if (clampedPosition.x !== centerX || clampedPosition.y !== centerY) {
        node.x(clampedPosition.x);
        node.y(clampedPosition.y);
        console.log('🔒 Circle position clamped to canvas bounds');
      }
      
      finalPosition = {
        x: clampedPosition.x,
        y: clampedPosition.y,
      };
    } else {
      // For rectangles, convert center coordinates to top-left coordinates
      const topLeftX = centerX - shape.width / 2;
      const topLeftY = centerY - shape.height / 2;
      
      // Validate and clamp final position
      const validatedPosition = canvasService.validateShapePosition(
        topLeftX,
        topLeftY,
        shape.width,
        shape.height
      );
      
      // Convert back to center coordinates
      const finalCenterX = validatedPosition.x + shape.width / 2;
      const finalCenterY = validatedPosition.y + shape.height / 2;
      
      // Apply clamped position if needed
      if (validatedPosition.wasClamped) {
        node.x(finalCenterX);
        node.y(finalCenterY);
        console.log('🔒 Shape position clamped to canvas bounds');
      }
      
      finalPosition = {
        x: validatedPosition.x,
        y: validatedPosition.y,
      };
    }
    
    try {
      // Handle multi-shape dragging
      if (selectedShapes.length > 1 && selectedShapes.includes(shape.id)) {
        // Calculate the offset from the original position
        const originalShape = shapes.find(s => s.id === shape.id);
        if (originalShape) {
          let originalCenterX, originalCenterY;
          
          if (originalShape.type === 'circle') {
            originalCenterX = originalShape.x;
            originalCenterY = originalShape.y;
          } else {
            originalCenterX = originalShape.x + originalShape.width / 2;
            originalCenterY = originalShape.y + originalShape.height / 2;
          }
          
          const deltaX = centerX - originalCenterX;
          const deltaY = centerY - originalCenterY;
          
          // Update all selected shapes in Firestore
          const updatePromises = selectedShapes.map(async (shapeId) => {
            const otherShape = shapes.find(s => s.id === shapeId);
            if (otherShape) {
              let otherOriginalCenterX, otherOriginalCenterY;
              
              if (otherShape.type === 'circle') {
                otherOriginalCenterX = otherShape.x;
                otherOriginalCenterY = otherShape.y;
              } else {
                otherOriginalCenterX = otherShape.x + otherShape.width / 2;
                otherOriginalCenterY = otherShape.y + otherShape.height / 2;
              }
              
              const newX = otherOriginalCenterX + deltaX;
              const newY = otherOriginalCenterY + deltaY;
              
              // Apply boundary constraints
              let finalPosition;
              if (otherShape.type === 'circle') {
                const radius = otherShape.radius || otherShape.width / 2;
                const clampedPosition = canvasService.clampCircleToCanvas(newX, newY, radius);
                finalPosition = {
                  x: clampedPosition.x,
                  y: clampedPosition.y,
                };
              } else {
                const topLeftX = newX - otherShape.width / 2;
                const topLeftY = newY - otherShape.height / 2;
                const validatedPosition = canvasService.validateShapePosition(
                  topLeftX,
                  topLeftY,
                  otherShape.width,
                  otherShape.height
                );
                finalPosition = {
                  x: validatedPosition.x,
                  y: validatedPosition.y,
                };
              }
              
              return updateShape(shapeId, finalPosition);
            }
            return Promise.resolve();
          });
          
          await Promise.all(updatePromises);
          
          // Unlock all selected shapes
          await Promise.all(selectedShapes.map(shapeId => unlockShape(shapeId)));
        }
      } else {
        // Single shape dragging (existing logic)
        await updateShape(shape.id, finalPosition);
        await unlockShape(shape.id);
      }
    } catch (error) {
      console.error('Failed to update shape position:', error);
      // Reset position on error
      if (shape.type === 'circle') {
        node.x(shape.x);
        node.y(shape.y);
      } else {
        node.x(shape.x + shape.width / 2);
        node.y(shape.y + shape.height / 2);
      }
    }
  }, [updateShape, unlockShape, selectedShapes, shapes]);

  // Resize handle mousedown - start resize
  const handleResizeStart = useCallback((e: KonvaEventObject<MouseEvent>, shape: Shape, handleType: 'corner' | 'edge', handleName: string) => {
    e.cancelBubble = true; // Prevent shape drag
    
    // Prevent race conditions - check if rotation is active
    if (rotationState.isRotating || activeOperation === 'rotate') {
      console.warn('Cannot start resize while rotation is active. Current operation:', activeOperation);
      return;
    }
    
    // Prevent starting resize if already resizing
    if (isResizing) {
      console.warn('Resize already in progress. Ignoring new resize start.');
      return;
    }
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
    
    // Get real-time shape position
    const shapeNode = shapeNodesRef.current.get(shape.id);
    let shapeX, shapeY, shapeWidth, shapeHeight, aspectRatio;
    
    if (shape.type === 'circle') {
      // For circles, use center coordinates and radius
      const centerX = shapeNode ? shapeNode.x() : shape.x;
      const centerY = shapeNode ? shapeNode.y() : shape.y;
      const radius = shape.radius || shape.width / 2;
      
      shapeX = centerX - radius;
      shapeY = centerY - radius;
      shapeWidth = radius * 2;
      shapeHeight = radius * 2;
      aspectRatio = 1; // Circles are always square
    } else {
      // For rectangles, use top-left coordinates
      const centerX = shapeNode ? shapeNode.x() : (shape.x + shape.width / 2);
      const centerY = shapeNode ? shapeNode.y() : (shape.y + shape.height / 2);
      
      shapeX = centerX - shape.width / 2;
      shapeY = centerY - shape.height / 2;
      shapeWidth = shape.width;
      shapeHeight = shape.height;
      aspectRatio = shape.width / shape.height;
    }
    
    setIsResizing(true);
    setActiveOperation('resize');
    setActiveHandle({ shapeId: shape.id, handleType, handleName });
    setResizeStart({
      cursorX: canvasPos.x,
      cursorY: canvasPos.y,
      shapeX: shapeX,
      shapeY: shapeY,
      width: shapeWidth,
      height: shapeHeight,
      aspectRatio: aspectRatio,
    });
    setPreviewDimensions({
      shapeId: shape.id,
      x: shapeX,
      y: shapeY,
      width: shapeWidth,
      height: shapeHeight,
    });
  }, []);

  // Resize handle mousemove - update preview
  const handleResizeMove = useCallback((_e: KonvaEventObject<MouseEvent>) => {
    if (!isResizing || !resizeStart || !activeHandle) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = (pos.x - stage.x()) / stage.scaleX();
    const canvasY = (pos.y - stage.y()) / stage.scaleY();
    
    // Extract handle direction from name (e.g., "shape_123-br" -> "br")
    const direction = activeHandle.handleName.split('-').pop() || '';
    
    // Get the shape being resized to determine its type
    const resizingShape = shapes.find(s => s.id === activeHandle.shapeId);
    if (!resizingShape) return;
    
    if (activeHandle.handleType === 'corner') {
      // Corner resize - maintain aspect ratio, cursor locks to handle
      let anchorX: number, anchorY: number;
      let rawWidth: number, rawHeight: number;
      
      switch (direction) {
        case 'br': // Bottom-right: anchor top-left
          anchorX = resizeStart.shapeX;
          anchorY = resizeStart.shapeY;
          rawWidth = canvasX - anchorX;
          rawHeight = canvasY - anchorY;
          break;
        case 'bl': // Bottom-left: anchor top-right
          anchorX = resizeStart.shapeX + resizeStart.width;
          anchorY = resizeStart.shapeY;
          rawWidth = anchorX - canvasX;
          rawHeight = canvasY - anchorY;
          break;
        case 'tr': // Top-right: anchor bottom-left
          anchorX = resizeStart.shapeX;
          anchorY = resizeStart.shapeY + resizeStart.height;
          rawWidth = canvasX - anchorX;
          rawHeight = anchorY - canvasY;
          break;
        case 'tl': // Top-left: anchor bottom-right
          anchorX = resizeStart.shapeX + resizeStart.width;
          anchorY = resizeStart.shapeY + resizeStart.height;
          rawWidth = anchorX - canvasX;
          rawHeight = anchorY - canvasY;
          break;
        default:
          return;
      }
      
      // Maintain aspect ratio - use the larger dimension
      const scaleFromWidth = Math.abs(rawWidth) / resizeStart.width;
      const scaleFromHeight = Math.abs(rawHeight) / resizeStart.height;
      const scale = Math.max(scaleFromWidth, scaleFromHeight);
      
      // Calculate new dimensions maintaining aspect ratio
      let newWidth = resizeStart.width * scale;
      let newHeight = resizeStart.height * scale;
      
      // For circles, enforce minimum radius (5px = 10px diameter)
      const minSize = resizingShape.type === 'circle' ? 10 : 10;
      newWidth = Math.max(minSize, newWidth);
      newHeight = Math.max(minSize, newHeight);
      
      // Maintain aspect ratio after minimum enforcement
      if (newWidth < resizeStart.width * scale) {
        newHeight = newWidth / resizeStart.aspectRatio;
      }
      if (newHeight < resizeStart.height * scale) {
        newWidth = newHeight * resizeStart.aspectRatio;
      }
      
      // Calculate new position based on anchor point
      let newX: number, newY: number;
      
      switch (direction) {
        case 'br':
          newX = anchorX;
          newY = anchorY;
          break;
        case 'bl':
          newX = anchorX - newWidth;
          newY = anchorY;
          break;
        case 'tr':
          newX = anchorX;
          newY = anchorY - newHeight;
          break;
        case 'tl':
          newX = anchorX - newWidth;
          newY = anchorY - newHeight;
          break;
        default:
          return;
      }
      
      setPreviewDimensions({
        shapeId: activeHandle.shapeId,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    } else if (activeHandle.handleType === 'edge') {
      // Edge resize - single dimension only for rectangles/triangles, proportional for circles
      let newX = resizeStart.shapeX;
      let newY = resizeStart.shapeY;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
      if (resizingShape.type === 'circle') {
        // For circles, edge handles should maintain aspect ratio (circles are always round)
        // The center should remain fixed during resize
        
        switch (direction) {
          case 't': // Top edge: calculate distance from center
            {
              const centerX = resizeStart.shapeX + resizeStart.width / 2;
              const centerY = resizeStart.shapeY + resizeStart.height / 2;
              const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
              const newRadius = Math.max(5, distance);
              newWidth = newRadius * 2;
              newHeight = newRadius * 2;
              // Keep the center fixed - calculate new top-left position
              newX = centerX - newRadius;
              newY = centerY - newRadius;
            }
            break;
          case 'b': // Bottom edge: calculate distance from center
            {
              const centerX = resizeStart.shapeX + resizeStart.width / 2;
              const centerY = resizeStart.shapeY + resizeStart.height / 2;
              const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
              const newRadius = Math.max(5, distance);
              newWidth = newRadius * 2;
              newHeight = newRadius * 2;
              // Keep the center fixed - calculate new top-left position
              newX = centerX - newRadius;
              newY = centerY - newRadius;
            }
            break;
          case 'l': // Left edge: calculate distance from center
            {
              const centerX = resizeStart.shapeX + resizeStart.width / 2;
              const centerY = resizeStart.shapeY + resizeStart.height / 2;
              const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
              const newRadius = Math.max(5, distance);
              newWidth = newRadius * 2;
              newHeight = newRadius * 2;
              // Keep the center fixed - calculate new top-left position
              newX = centerX - newRadius;
              newY = centerY - newRadius;
            }
            break;
          case 'r': // Right edge: calculate distance from center
            {
              const centerX = resizeStart.shapeX + resizeStart.width / 2;
              const centerY = resizeStart.shapeY + resizeStart.height / 2;
              const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
              const newRadius = Math.max(5, distance);
              newWidth = newRadius * 2;
              newHeight = newRadius * 2;
              // Keep the center fixed - calculate new top-left position
              newX = centerX - newRadius;
              newY = centerY - newRadius;
            }
            break;
          default:
            return;
        }
      } else {
        // For rectangles and triangles, use single dimension resize
        switch (direction) {
          case 't': // Top edge: resize height, adjust y position
            {
              const anchorY = resizeStart.shapeY + resizeStart.height; // Anchor bottom
              newHeight = anchorY - canvasY;
              newHeight = Math.max(10, newHeight);
              newY = anchorY - newHeight;
            }
            break;
          case 'b': // Bottom edge: resize height only
            {
              const anchorY = resizeStart.shapeY; // Anchor top
              newHeight = canvasY - anchorY;
              newHeight = Math.max(10, newHeight);
              newY = anchorY;
            }
            break;
          case 'l': // Left edge: resize width, adjust x position
            {
              const anchorX = resizeStart.shapeX + resizeStart.width; // Anchor right
              newWidth = anchorX - canvasX;
              newWidth = Math.max(10, newWidth);
              newX = anchorX - newWidth;
            }
            break;
          case 'r': // Right edge: resize width only
            {
              const anchorX = resizeStart.shapeX; // Anchor left
              newWidth = canvasX - anchorX;
              newWidth = Math.max(10, newWidth);
              newX = anchorX;
            }
            break;
          default:
            return;
        }
      }
      
      setPreviewDimensions({
        shapeId: activeHandle.shapeId,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
    
    // Force re-render for smooth updates
    forceUpdate();
  }, [isResizing, resizeStart, activeHandle, forceUpdate]);

  // Resize handle mouseup - finish resize and persist to Firestore
  const handleResizeEnd = useCallback(async () => {
    if (!isResizing || !previewDimensions || !activeHandle) {
      setIsResizing(false);
      setActiveOperation('none');
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Stop interactive resizing but keep preview dimensions for optimistic update
    setIsResizing(false);
    setActiveOperation('none');
    setActiveHandle(null);
    setResizeStart(null);

    try {
      // Get the shape being resized to determine its type
      const resizingShape = shapes.find(s => s.id === activeHandle.shapeId);
      if (!resizingShape) {
        console.error('❌ Shape not found for resize');
        setPreviewDimensions(null);
        return;
      }

      if (resizingShape.type === 'circle') {
        // For circles, use resizeCircle method
        const newRadius = previewDimensions.width / 2;
        await canvasService.resizeCircle(activeHandle.shapeId, newRadius);
        
        // For circles, the center should remain fixed during resize
        // No position update needed since the center stays the same
      } else {
        // For rectangles, use resizeShape method
        await canvasService.resizeShape(
          activeHandle.shapeId,
          previewDimensions.width,
          previewDimensions.height
        );
        
        // Also update position if it changed (for top/left edge resizes)
        if (resizeStart && (previewDimensions.x !== resizeStart.shapeX || previewDimensions.y !== resizeStart.shapeY)) {
          await updateShape(activeHandle.shapeId, {
            x: previewDimensions.x,
            y: previewDimensions.y
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to resize shape:', error);
      // Clear preview on error so shape reverts to original
      setPreviewDimensions(null);
      
      // Show user-facing error message
      console.error('Resize operation failed. Please try again.');
    }
    // Note: previewDimensions will be cleared when we detect the shape update from Firestore
  }, [isResizing, previewDimensions, activeHandle, resizeStart, updateShape, shapes]);

  // Rotation handle mousedown - start rotation
  const handleRotationStart = useCallback((e: KonvaEventObject<MouseEvent>, shape: Shape) => {
    e.cancelBubble = true; // Prevent shape drag
    
    // Prevent race conditions - check if resize is active
    if (isResizing || activeOperation === 'resize') {
      console.warn('Cannot start rotation while resize is active. Current operation:', activeOperation);
      return;
    }
    
    // Prevent starting rotation if already rotating
    if (rotationState.isRotating) {
      console.warn('Rotation already in progress. Ignoring new rotation start.');
      return;
    }
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
    
    // Get real-time shape position from node (Bug #2 fix)
    const shapeNode = shapeNodesRef.current.get(shape.id);
    let centerX, centerY;
    
    if (shapeNode) {
      // Use real-time position from the node
      centerX = shapeNode.x();
      centerY = shapeNode.y();
    } else {
      // Calculate center from stored coordinates
      if (shape.type === 'circle') {
        centerX = shape.x;
        centerY = shape.y;
      } else {
        // For rectangles and triangles, center is at x + width/2, y + height/2
        centerX = shape.x + shape.width / 2;
        centerY = shape.y + shape.height / 2;
      }
    }
    
    // Calculate rotation handle position (middle of top edge)
    const handleX = centerX; // Same X as center (middle of top edge)
    const handleY = centerY - ROTATION_HANDLE_DISTANCE; // Above the shape center
    
    // Calculate initial angle from rotation handle to mouse
    const initialAngle = Math.atan2(canvasPos.y - handleY, canvasPos.x - handleX);
    
    setRotationState({
      isRotating: true,
      hoveredHandle: null,
      previewRotation: shape.rotation || 0,
      start: {
        shapeId: shape.id,
        initialAngle,
        initialRotation: shape.rotation || 0,
      },
    });
    setActiveOperation('rotate');
  }, []);

  // Rotation handle mousemove - update preview
  const handleRotationMove = useCallback((_e: KonvaEventObject<MouseEvent>) => {
    if (!rotationState.isRotating || !rotationState.start) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
    
    // Find the shape being rotated
    const shape = shapes.find(s => s.id === rotationState.start?.shapeId);
    if (!shape) return;
    
    // Get real-time shape position from node (Bug #2 fix)
    const shapeNode = shapeNodesRef.current.get(shape.id);
    let centerX, centerY;
    
    if (shapeNode) {
      // Use real-time position from the node
      centerX = shapeNode.x();
      centerY = shapeNode.y();
    } else {
      // Calculate center from stored coordinates
      if (shape.type === 'circle') {
        centerX = shape.x;
        centerY = shape.y;
      } else {
        // For rectangles and triangles, center is at x + width/2, y + height/2
        centerX = shape.x + shape.width / 2;
        centerY = shape.y + shape.height / 2;
      }
    }
    
    // Calculate rotation handle position (middle of top edge)
    const handleX = centerX; // Same X as center (middle of top edge)
    const handleY = centerY - ROTATION_HANDLE_DISTANCE; // Above the shape center
    
    // Calculate current angle from rotation handle to mouse
    const currentAngle = Math.atan2(canvasPos.y - handleY, canvasPos.x - handleX);
    
    // Calculate angle delta and convert to degrees
    const angleDelta = currentAngle - (rotationState.start?.initialAngle || 0);
    const deltaInDegrees = angleDelta * (180 / Math.PI);
    
    // Calculate new rotation
    const newRotation = (rotationState.start?.initialRotation || 0) + deltaInDegrees;
    
    setRotationState(prev => ({
      ...prev,
      previewRotation: newRotation,
    }));
    
    // Force re-render for smooth updates
    forceUpdate();
  }, [rotationState, shapes, forceUpdate]);

  // Rotation handle mouseup - finish rotation and persist to Firestore
  const handleRotationEnd = useCallback(async () => {
    if (!rotationState.isRotating || !rotationState.start || rotationState.previewRotation === null) {
      setRotationState({
        isRotating: false,
        hoveredHandle: null,
        previewRotation: null,
        start: null,
      });
      setActiveOperation('none');
      return;
    }

    // Stop interactive rotation
    const finalRotation = rotationState.previewRotation;
    setRotationState({
      isRotating: false,
      hoveredHandle: null,
      previewRotation: null,
      start: null,
    });
    setActiveOperation('none');

    try {
      // Save rotation to Firestore
      await canvasService.rotateShape(rotationState.start.shapeId, finalRotation);
    } catch (error) {
      console.error('❌ Failed to rotate shape:', error);
      // Show user-facing error message
      console.error('Rotation operation failed. Please try again.');
    }
  }, [rotationState]);

  // Background click handler (deselect + drawing + marquee)
  const handleStageClick = useCallback(async (e: KonvaEventObject<MouseEvent>) => {
    // Simplified background detection - if we clicked on the stage itself or canvas background
    const targetClass = e.target.getClassName();
    const targetId = e.target.id();
    
    // Check if we clicked on the stage background or canvas background
    const isBackground = targetClass === 'Stage' || 
                        (targetClass === 'Rect' && targetId === 'canvas-background');
    
    if (isBackground) {
      // Start marquee selection if not in create mode AND holding Shift key
      if (mode === 'select' && e.evt.shiftKey) {
        // Prevent stage dragging when starting marquee
        e.cancelBubble = true;
        
        const stage = stageRef.current;
        if (stage) {
          const stagePos = stage.getAbsolutePosition();
          const stageScale = stage.scaleX();
          const pointerPos = stage.getPointerPosition();
          
          if (pointerPos) {
            const canvasPos = {
              x: (pointerPos.x - stagePos.x) / stageScale,
              y: (pointerPos.y - stagePos.y) / stageScale
            };
            
            // Start marquee selection
            setMarquee({
              startX: canvasPos.x,
              startY: canvasPos.y,
              endX: canvasPos.x,
              endY: canvasPos.y
            });
          }
        }
        return;
      }
      
      // Deselect all shapes if any - clear selection immediately for better UX
      if (selectedShapes.length > 0) {
        console.log('Background click - deselecting all shapes');
        // Hide selectors immediately by adding to hidden set
        selectedShapes.forEach(shapeId => {
          setHiddenSelectors(prev => new Set(prev).add(shapeId));
        });
        
        // Clear selection immediately to hide selectors
        setSelectedShapes([]);
        
        // Hide controls panel
        setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
        
        // Force a re-render to ensure selectors disappear immediately
        forceUpdate();
        
        // Unlock all shapes in background (don't wait for it)
        selectedShapes.forEach(shapeId => {
          unlockShape(shapeId).catch(error => {
            console.error('Failed to unlock shape on deselect:', error);
          });
        });
      }
      
      // Handle shape creation in create mode
      if (mode === 'create') {
        const stage = stageRef.current;
        if (!stage) return;
        
        const pos = stage.getPointerPosition();
        if (!pos) return;
        
        // Convert screen coordinates to canvas coordinates
        const canvasPos = {
          x: (pos.x - stage.x()) / stage.scaleX(),
          y: (pos.y - stage.y()) / stage.scaleY(),
        };
        
        // Check if position is within canvas bounds
        if (canvasPos.x < 0 || canvasPos.y < 0 || 
            canvasPos.x > CANVAS_WIDTH || canvasPos.y > CANVAS_HEIGHT) {
          return;
        }
        
        // Handle text creation immediately (no drawing state needed)
        if (activeTool === 'text') {
          try {
            await canvasService.createText(
              'TEXT',
              canvasPos.x,
              canvasPos.y,
              16,
              selectedColor,
              'normal',
              'normal',
              'none',
              user!.uid
            );
          } catch (error) {
            console.error('Failed to create text:', error);
            showToast('Failed to create text. Please try again.', 'error');
          }
        } else {
          startDrawing(canvasPos.x, canvasPos.y);
        }
      }
    }
  }, [mode, activeTool, selectedShapes, selectedColor, startDrawing, unlockShape, setSelectedShapes, forceUpdate, showToast, user]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Handle rotation if active
    if (rotationState.isRotating) {
      handleRotationMove(e);
      return;
    }
    
    // Handle resize if active
    if (isResizing) {
      handleResizeMove(e);
      return;
    }
    
    // Handle marquee selection
    if (marquee) {
      const stage = stageRef.current;
      if (stage) {
        const stagePos = stage.getAbsolutePosition();
        const stageScale = stage.scaleX();
        const pointerPos = stage.getPointerPosition();
        
        if (pointerPos) {
          const canvasPos = {
            x: (pointerPos.x - stagePos.x) / stageScale,
            y: (pointerPos.y - stagePos.y) / stageScale
          };
          
          setMarquee(prev => prev ? {
            ...prev,
            endX: canvasPos.x,
            endY: canvasPos.y
          } : null);
        }
      }
      return;
    }
    
    // Handle drawing
    if (!drawingState.isDrawing) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
    
    updateDrawing(canvasPos.x, canvasPos.y);
  }, [rotationState.isRotating, handleRotationMove, isResizing, handleResizeMove, marquee, drawingState.isDrawing, updateDrawing]);

  const handleMouseUp = useCallback(() => {
    // Handle rotation end if active
    if (rotationState.isRotating) {
      handleRotationEnd();
      return;
    }
    
    // Handle resize end if active
    if (isResizing) {
      handleResizeEnd();
      return;
    }
    
    // Handle marquee selection completion
    if (marquee) {
      const marqueeBounds = {
        x: Math.min(marquee.startX, marquee.endX),
        y: Math.min(marquee.startY, marquee.endY),
        width: Math.abs(marquee.endX - marquee.startX),
        height: Math.abs(marquee.endY - marquee.startY)
      };
      
      // Find shapes that intersect with marquee bounds
      const intersectingShapes = shapes.filter(shape => {
        const shapeBounds = {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height
        };
        
        // Check if shapes intersect
        return !(shapeBounds.x + shapeBounds.width < marqueeBounds.x ||
                shapeBounds.x > marqueeBounds.x + marqueeBounds.width ||
                shapeBounds.y + shapeBounds.height < marqueeBounds.y ||
                shapeBounds.y > marqueeBounds.y + marqueeBounds.height);
      });
      
      // Check if Shift was held during marquee completion
      const shouldAddToSelection = false; // For now, always replace selection
      
      if (shouldAddToSelection) {
        // Add to existing selection
        markMultiSelect();
        const newShapes = intersectingShapes.map(shape => shape.id);
        const combined = [...selectedShapes, ...newShapes];
        setSelectedShapes([...new Set(combined)]); // Remove duplicates
      } else {
        // Replace selection with intersecting shapes
        markMultiSelect();
        setSelectedShapes(intersectingShapes.map(shape => shape.id));
      }
      
      // Clear marquee and reset Shift state
      setMarquee(null);
      setIsShiftHeld(false);
      return;
    }
    
    // Handle drawing
    if (!drawingState.isDrawing) return;
    
    // Capture the final mouse position for accurate shape creation
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        // Convert screen coordinates to canvas coordinates
        const canvasPos = {
          x: (pos.x - stage.x()) / stage.scaleX(),
          y: (pos.y - stage.y()) / stage.scaleY(),
        };
        
        // Update the drawing state with the final position before finishing
        updateDrawing(canvasPos.x, canvasPos.y);
      }
    }
    
    finishDrawing();
  }, [rotationState.isRotating, handleRotationEnd, isResizing, handleResizeEnd, marquee, shapes, selectedShapes, setSelectedShapes, drawingState.isDrawing, updateDrawing, finishDrawing]);

  // Handle copy shape functionality
  const handleCopyShape = useCallback(() => {
    // Get currently selected shapes
    const currentSelectedIds = selectedShapesRef.current.length > 0 ? selectedShapesRef.current : selectedShapes;
    
    if (currentSelectedIds.length === 0) {
      showToast('No shapes selected to copy', 'error');
      return;
    }
    
    // Find all selected shapes
    const selectedShapesToCopy = shapes.filter(s => currentSelectedIds.includes(s.id));
    
    if (selectedShapesToCopy.length === 0) {
      showToast('No shapes found to copy', 'error');
      return;
    }
    
    setClipboard(selectedShapesToCopy);
    showToast(`${selectedShapesToCopy.length} shape(s) copied to clipboard`, 'success');
  }, [shapes, showToast, selectedShapes, user]);

  // Handle paste shape functionality
  const handlePasteShape = useCallback(async () => {
    const currentClipboard = clipboardRef.current;
    if (!currentClipboard) {
      showToast('No shape in clipboard to paste', 'error');
      return;
    }
    
    if (!user) {
      showToast('User not authenticated', 'error');
      return;
    }
    
    try {
      // Calculate paste position with offset
      const pasteX = currentClipboard.x + PASTE_OFFSET;
      const pasteY = currentClipboard.y + PASTE_OFFSET;
      
      // Create new shape data based on type
      let newShapeData;
      
      if (currentClipboard.type === 'rectangle') {
        newShapeData = {
          type: 'rectangle' as const,
          x: pasteX,
          y: pasteY,
          width: currentClipboard.width,
          height: currentClipboard.height,
          color: currentClipboard.color,
          rotation: currentClipboard.rotation || 0,
          createdBy: user.uid,
        };
      } else if (currentClipboard.type === 'circle') {
        newShapeData = {
          type: 'circle' as const,
          x: pasteX,
          y: pasteY,
          width: currentClipboard.width,
          height: currentClipboard.height,
          radius: currentClipboard.radius || currentClipboard.width / 2,
          color: currentClipboard.color,
          rotation: currentClipboard.rotation || 0,
          createdBy: user.uid,
        };
      } else if (currentClipboard.type === 'triangle') {
        newShapeData = {
          type: 'triangle' as const,
          x: pasteX,
          y: pasteY,
          width: currentClipboard.width,
          height: currentClipboard.height,
          color: currentClipboard.color,
          rotation: currentClipboard.rotation || 0,
          createdBy: user.uid,
        };
      } else if (currentClipboard.type === 'text') {
        newShapeData = {
          type: 'text' as const,
          x: pasteX,
          y: pasteY,
          width: currentClipboard.width,
          height: currentClipboard.height,
          color: currentClipboard.color,
          text: currentClipboard.text || 'TEXT',
          fontSize: currentClipboard.fontSize || 16,
          fontWeight: currentClipboard.fontWeight || 'normal',
          fontStyle: currentClipboard.fontStyle || 'normal',
          textDecoration: currentClipboard.textDecoration || 'none',
          rotation: currentClipboard.rotation || 0,
          createdBy: user.uid,
        };
      } else {
        showToast('Unsupported shape type for paste', 'error');
        return;
      }
      
      // Create the new shape using canvasService
      const newShape = await canvasService.createShape(newShapeData);
      
      // Auto-select the pasted shape with a small delay to ensure it's rendered
      setTimeout(() => {
        setSelectedShapes([newShape.id]);
      }, 100);
      
      showToast('Shape pasted successfully', 'success');
      
    } catch (error) {
      console.error('Failed to paste shape:', error);
      showToast('Failed to paste shape', 'error');
    }
  }, [user, showToast, setSelectedShapes]);

  // Handle select all functionality
  const handleSelectAll = useCallback(() => {
    if (shapes.length === 0) {
      showToast('No shapes on canvas to select', 'error');
      return;
    }
    
    // Mark as multi-select operation to prevent auto-deselection
    markMultiSelect();
    
    // Select all shapes
    const allShapeIds = shapes.map(shape => shape.id);
    setSelectedShapes(allShapeIds);
    showToast(`Selected ${allShapeIds.length} shapes`, 'success');
  }, [shapes, setSelectedShapes, showToast, markMultiSelect]);

  // Handle delete selected shapes
  const handleDeleteSelected = useCallback(async () => {
    const currentSelectedIds = selectedShapesRef.current.length > 0 ? selectedShapesRef.current : selectedShapes;
    if (currentSelectedIds.length === 0) {
      showToast('No shapes selected to delete', 'error');
      return;
    }
    
    try {
      // Delete all selected shapes
      await Promise.all(currentSelectedIds.map(shapeId => canvasService.deleteShape(shapeId)));
      setSelectedShapes([]);
      setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
      showToast(`${currentSelectedIds.length} shape${currentSelectedIds.length > 1 ? 's' : ''} deleted`, 'success');
    } catch (error) {
      console.error('Failed to delete shapes:', error);
      showToast('Failed to delete shapes', 'error');
    }
  }, [setSelectedShapes, showToast]);

  // Handle duplicate shape (single or multiple)
  const handleDuplicateShape = useCallback(async (shapeId?: string) => {
    if (!user) return;
    
    try {
      // If shapeId provided, duplicate single shape
      if (shapeId) {
        const duplicatedShape = await canvasService.duplicateShape(shapeId, user.uid);
        // Auto-select the duplicated shape with a small delay to ensure it's rendered
        setTimeout(() => {
          setSelectedShapes([duplicatedShape.id]);
        }, 100);
        showToast('Shape duplicated', 'success');
        return;
      }
      
      // Otherwise, duplicate all selected shapes
      const currentSelectedIds = selectedShapesRef.current.length > 0 ? selectedShapesRef.current : selectedShapes;
      if (currentSelectedIds.length === 0) {
        showToast('No shapes selected to duplicate', 'error');
        return;
      }
      
      // Duplicate all selected shapes with 20px offset
      const duplicatePromises = currentSelectedIds.map(shapeId => 
        canvasService.duplicateShape(shapeId, user.uid)
      );
      
      const duplicatedShapes = await Promise.all(duplicatePromises);
      
      // Auto-select all duplicated shapes with a small delay to ensure they're rendered
      setTimeout(() => {
        setSelectedShapes(duplicatedShapes.map(shape => shape.id));
      }, 100);
      
      showToast(`Duplicated ${currentSelectedIds.length} shape${currentSelectedIds.length > 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Failed to duplicate shape(s):', error);
      showToast('Failed to duplicate shape(s)', 'error');
    }
  }, [user, showToast, selectedShapes, setSelectedShapes]);

  // Track Shift key state for marquee selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Enhanced keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key - deselect shape or cancel drawing
      if (e.key === 'Escape') {
        if (drawingState.isDrawing) {
          cancelDrawing();
        } else if (selectedShapes.length > 0) {
          // Deselect all shapes
          setSelectedShapes([]);
          setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
          selectedShapes.forEach(shapeId => {
            unlockShape(shapeId).catch(error => {
              console.error('Failed to unlock shape on deselect:', error);
            });
          });
        }
        return;
      }
      
      // Handle Ctrl+C/Cmd+C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopyShape();
        return;
      }
      
      // Handle Ctrl+V/Cmd+V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteShape();
        return;
      }
      
      // Handle Ctrl+A/Cmd+A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }
      
      // Handle Ctrl+D/Cmd+D for duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateShape();
        return;
      }
      
      // Handle Delete/Backspace for delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingState.isDrawing, cancelDrawing, selectedShapes, setSelectedShapes, unlockShape, handleCopyShape, handlePasteShape, handleSelectAll, handleDeleteSelected, handleDuplicateShape]);

  // Clear preview dimensions once Firestore update is confirmed
  useEffect(() => {
    if (!previewDimensions || isResizing) return;
    
    // Find the shape that was resized
    const shape = shapes.find(s => s.id === previewDimensions.shapeId);
    if (!shape) return;
    
    // Check if the shape dimensions match the preview (within 1px tolerance for rounding)
    let dimensionsMatch;
    if (shape.type === 'circle') {
      // For circles, compare radius and center position
      const expectedRadius = previewDimensions.width / 2;
      const actualRadius = shape.radius || shape.width / 2;
      const expectedCenterX = previewDimensions.x + previewDimensions.width / 2;
      const expectedCenterY = previewDimensions.y + previewDimensions.height / 2;
      
      dimensionsMatch = 
        Math.abs(actualRadius - expectedRadius) < 1 &&
        Math.abs(shape.x - expectedCenterX) < 1 &&
        Math.abs(shape.y - expectedCenterY) < 1;
    } else {
      // For rectangles and triangles, compare bounding box
      dimensionsMatch = 
        Math.abs(shape.width - previewDimensions.width) < 1 &&
        Math.abs(shape.height - previewDimensions.height) < 1 &&
        Math.abs(shape.x - previewDimensions.x) < 1 &&
        Math.abs(shape.y - previewDimensions.y) < 1;
    }
    
    if (dimensionsMatch) {
      setPreviewDimensions(null);
    }
  }, [shapes, previewDimensions, isResizing]);

  // Handle clicks on the canvas container for deselection
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if we have selected shapes and we're clicking on the container itself
    if (selectedShapes.length > 0 && e.target === e.currentTarget) {
      console.log('Container click - deselecting all shapes');
      // Hide selectors immediately by adding to hidden set
      selectedShapes.forEach(shapeId => {
        setHiddenSelectors(prev => new Set(prev).add(shapeId));
      });
      
      // Clear selection immediately to hide selectors
      setSelectedShapes([]);
      
      // Hide controls panel
      setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
      
      // Force a re-render to ensure selectors disappear immediately
      forceUpdate();
      
      // Unlock all shapes in background (don't wait for it)
      selectedShapes.forEach(shapeId => {
        unlockShape(shapeId).catch(error => {
          console.error('Failed to unlock shape on deselect:', error);
        });
      });
    }
  }, [selectedShapes, setSelectedShapes, unlockShape, forceUpdate]);

  // Handle delete shape
  const handleDeleteShape = useCallback(async (shapeId: string) => {
    try {
      await canvasService.deleteShape(shapeId);
      setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
      showToast('Shape deleted', 'success');
    } catch (error) {
      console.error('Failed to delete shape:', error);
      showToast('Failed to delete shape', 'error');
    }
  }, [showToast]);

  return (
    <div className="canvas-container">
      <div 
        className={`canvas-stage-container mode-${mode}`}
        style={{
          position: 'relative',
          touchAction: 'none', // Disable default touch behaviors
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
        }}
        onClick={handleContainerClick}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={!isGesturing && !drawingState.isDrawing && mode === 'select' && !marquee && !isShiftHeld}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseDown={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={(e) => {
            // Fallback deselection - if we clicked on the stage itself, deselect
            if (e.target === e.target.getStage() && selectedShapes.length > 0) {
              console.log('Stage click - deselecting all shapes');
              selectedShapes.forEach(shapeId => {
                setHiddenSelectors(prev => new Set(prev).add(shapeId));
              });
              setSelectedShapes([]);
              forceUpdate();
              selectedShapes.forEach(shapeId => {
                unlockShape(shapeId).catch(error => {
                  console.error('Failed to unlock shape on deselect:', error);
                });
              });
            }
          }}
        >
          <Layer>
            {/* Canvas background - visual indicator of canvas bounds */}
            <Rect
              id="canvas-background"
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="white"
              stroke="#e5e5e5"
              strokeWidth={2}
            />
            {/* Grid lines for visual reference (optional) */}
            {Array.from({ length: 11 }, (_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[i * (CANVAS_WIDTH / 10), 0, i * (CANVAS_WIDTH / 10), CANVAS_HEIGHT]}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, i * (CANVAS_HEIGHT / 10), CANVAS_WIDTH, i * (CANVAS_HEIGHT / 10)]}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
            ))}
            {/* Render existing shapes from Firestore */}
            {shapes.map((shape) => {
              const lockStatus = getShapeLockStatus(shape);
              
              // Use the actual lock status - the selection logic is handled elsewhere
              const effectiveLockStatus = lockStatus;
              
              // Visual styling based on effective lock status and selection
              let strokeColor = shape.color;
              let strokeWidth = 2;
              let opacity = 1;
              let isDraggable = false;
              
              // Check if shape is selected
              const isSelected = selectedShapes.includes(shape.id);
              
              if (effectiveLockStatus === 'locked-by-me') {
                strokeColor = '#10b981'; // Green border
                strokeWidth = 3;
                isDraggable = true;
              } else if (effectiveLockStatus === 'locked-by-other') {
                strokeColor = '#ef4444'; // Red border
                strokeWidth = 3;
                opacity = 0.5;
              } else if (isSelected) {
                strokeColor = '#3b82f6'; // Blue border for selection
                strokeWidth = 3;
                isDraggable = true;
              }
              
              // Check if we have optimistic preview dimensions for this shape
              const hasOptimisticUpdate = !isResizing && previewDimensions && 
                                         !activeHandle && shape.id === previewDimensions.shapeId;
              
              // Hide original shape completely during active resize (preview will show instead)
              const isBeingResized = isResizing && activeHandle?.shapeId === shape.id;
              if (isBeingResized) {
                opacity = 0; // Completely hide original shape during resize
                isDraggable = false; // Can't drag while resizing
              }
              
              // Use optimistic dimensions if available, otherwise use DB values
              let displayWidth = shape.width;
              let displayHeight = shape.height;
              let displayX = shape.x;
              let displayY = shape.y;
              
              if (hasOptimisticUpdate) {
                displayWidth = previewDimensions.width;
                displayHeight = previewDimensions.height;
                displayX = previewDimensions.x;
                displayY = previewDimensions.y;
              } else {
                // Get real-time position from node (for handles during drag)
                const shapeNode = shapeNodesRef.current.get(shape.id);
                displayX = shapeNode ? shapeNode.x() : shape.x;
                displayY = shapeNode ? shapeNode.y() : shape.y;
                
                // For circles, calculate display dimensions from radius
                if (shape.type === 'circle') {
                  const radius = shape.radius || shape.width / 2;
                  displayWidth = radius * 2;
                  displayHeight = radius * 2;
                }
              }
              
              // Get current rotation (use preview during rotation, otherwise use shape rotation)
              const currentRotation = rotationState.isRotating && rotationState.start?.shapeId === shape.id && rotationState.previewRotation !== null 
                ? rotationState.previewRotation 
                : (shape.rotation || 0);
              
              // Debug logging for rotation (only in development and for non-zero rotations)
              if (import.meta.env.DEV && shape.rotation && shape.rotation !== 0) {
                logger.rendering(`Rendering shape ${shape.id} (${shape.type}) with rotation: ${currentRotation}° (from DB: ${shape.rotation}°)`);
              }

              return (
                <React.Fragment key={shape.id}>
                  <Group
                    ref={(node) => {
                      if (node) {
                        shapeNodesRef.current.set(shape.id, node);
                      } else {
                        shapeNodesRef.current.delete(shape.id);
                      }
                    }}
                    x={hasOptimisticUpdate ? displayX + displayWidth / 2 : (shape.type === 'circle' ? shape.x : shape.x + shape.width / 2)}
                    y={hasOptimisticUpdate ? displayY + displayHeight / 2 : (shape.type === 'circle' ? shape.y : shape.y + shape.height / 2)}
                    offsetX={0}
                    offsetY={0}
                    rotation={currentRotation}
                    draggable={isDraggable && !hasOptimisticUpdate}
                    onClick={(e) => handleShapeClick(e, shape)}
                    onDragMove={(e) => handleShapeDragMove(e, shape)}
                    onDragEnd={(e) => handleShapeDragEnd(e, shape)}
                    listening={effectiveLockStatus !== 'locked-by-other' && !hasOptimisticUpdate}
                  >
                    {/* Render shape based on type */}
                    {shape.type === 'rectangle' && (
                      <Rect
                        x={-displayWidth / 2}
                        y={-displayHeight / 2}
                        width={displayWidth}
                        height={displayHeight}
                        fill={shape.color}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        listening={true}
                      />
                    )}
                    
                    {shape.type === 'circle' && (
                      <Circle
                        x={0}
                        y={0}
                        radius={Math.min(displayWidth, displayHeight) / 2}
                        fill={shape.color}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        listening={true}
                      />
                    )}
                    
                    {shape.type === 'triangle' && (() => {
                      const vertices = calculateTriangleVertices(displayWidth, displayHeight);
                      // For triangles, position vertices relative to center (like rectangles)
                      const points = vertices.flatMap(v => [v.x, v.y]);
                      return (
                        <Line
                          points={points}
                          closed={true}
                          fill={shape.color}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          opacity={opacity}
                          listening={true}
                        />
                      );
                    })()}
                    
                    {shape.type === 'text' && (
                      <Text
                        text={shape.text || 'TEXT'}
                        x={-displayWidth / 2}
                        y={-displayHeight / 2}
                        width={displayWidth}
                        height={displayHeight}
                        fontSize={shape.fontSize || 16}
                        fontFamily="Arial"
                        fontStyle={shape.fontStyle || 'normal'}
                        fontWeight={shape.fontWeight || 'normal'}
                        textDecoration={shape.textDecoration || 'none'}
                        fill={shape.color}
                        opacity={opacity}
                        listening={true}
                        align="center"
                        verticalAlign="middle"
                      />
                    )}
                    
                    {/* Resize handles - inside the rotated group so they rotate with the shape */}
                    {(effectiveLockStatus === 'locked-by-me' || selectedShapes.includes(shape.id)) && !isBeingResized && !hasOptimisticUpdate && !hiddenSelectors.has(shape.id) && shape.type !== 'text' && (() => {
                      const stage = stageRef.current;
                      const stageScale = stage ? stage.scaleX() : 1;
                      
                      // Handle size scales inversely with zoom for consistent screen size
                      const baseSize = 16 / stageScale;
                      const hoverSize = 20 / stageScale;
                      const offset = baseSize / 2;
                      
                      // Define resize handles using local coordinates (relative to shape center)
                      const handles = shape.type === 'circle' ? [
                        // For circles, show only 4 handles at cardinal directions on the circumference
                        { x: -offset, y: -displayHeight / 2 - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-t` },
                        { x: -displayWidth / 2 - offset, y: -offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-l` },
                        { x: displayWidth / 2 - offset, y: -offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-r` },
                        { x: -offset, y: displayHeight / 2 - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-b` },
                      ] : [
                        // For rectangles and triangles, show all 8 handles (positioned relative to center)
                        { x: -displayWidth / 2 - offset, y: -displayHeight / 2 - offset, cursor: 'nwse-resize', type: 'corner' as const, name: `${shape.id}-tl` },
                        { x: -offset, y: -displayHeight / 2 - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-t` },
                        { x: displayWidth / 2 - offset, y: -displayHeight / 2 - offset, cursor: 'nesw-resize', type: 'corner' as const, name: `${shape.id}-tr` },
                        { x: -displayWidth / 2 - offset, y: -offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-l` },
                        { x: displayWidth / 2 - offset, y: -offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-r` },
                        { x: -displayWidth / 2 - offset, y: displayHeight / 2 - offset, cursor: 'nesw-resize', type: 'corner' as const, name: `${shape.id}-bl` },
                        { x: -offset, y: displayHeight / 2 - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-b` },
                        { x: displayWidth / 2 - offset, y: displayHeight / 2 - offset, cursor: 'nwse-resize', type: 'corner' as const, name: `${shape.id}-br` },
                      ];
                      
                      return handles.map((handle) => {
                        const isHovered = hoveredHandle === handle.name;
                        const handleSize = isHovered ? hoverSize : baseSize;
                        
                        return (
                          <Rect
                            key={handle.name}
                            x={handle.x}
                            y={handle.y}
                            width={handleSize}
                            height={handleSize}
                            fill={isHovered ? '#3b82f6' : 'white'}
                            stroke={isHovered ? '#2563eb' : '#999'}
                            strokeWidth={1 / stageScale}
                            onMouseEnter={() => setHoveredHandle(handle.name)}
                            onMouseLeave={() => setHoveredHandle(null)}
                            onMouseDown={(e) => handleResizeStart(e, shape, handle.type, handle.name)}
                            listening={true}
                          />
                        );
                      });
                    })()}
                    
                    {/* Rotation handle - inside the rotated group so it rotates with the shape */}
                    {(effectiveLockStatus === 'locked-by-me' || selectedShapes.includes(shape.id)) && !isBeingResized && !hasOptimisticUpdate && !hiddenSelectors.has(shape.id) && (() => {
                      const stage = stageRef.current;
                      const stageScale = stage ? stage.scaleX() : 1;
                      
                      
                      // Position rotation handle above shape top edge using local coordinates
                      const handleY = -displayHeight / 2 - ROTATION_HANDLE_DISTANCE; // Above the shape top edge
                      const handleSize = 16 / stageScale; // 16px diameter, scaled with zoom
                      const handleRadius = handleSize / 2;
                      
                      // Calculate the middle of the top edge for the rotation handle
                      const handleX = 0; // Middle of the top edge (center of shape)
                      
                      const isHovered = rotationState.hoveredHandle === shape.id;
                      const handleColor = isHovered ? '#3b82f6' : '#ff0000'; // Bright red for maximum visibility
                      const iconColor = isHovered ? 'white' : 'white'; // White icon for better contrast
                      
                      
                      return (
                        <React.Fragment key={`rotation-${shape.id}`}>
                          {/* Connecting line from handle to shape top edge */}
                          <Line
                            points={[handleX, handleY, handleX, -displayHeight / 2]}
                            stroke="#ff0000"
                            strokeWidth={3 / stageScale}
                            dash={[5 / stageScale, 5 / stageScale]}
                            listening={false}
                          />
                          
                          {/* Rotation handle circle */}
                          <Group
                            x={handleX}
                            y={handleY}
                            onMouseEnter={() => setRotationState(prev => ({ ...prev, hoveredHandle: shape.id }))}
                            onMouseLeave={() => setRotationState(prev => ({ ...prev, hoveredHandle: null }))}
                            onMouseDown={(e) => handleRotationStart(e, shape)}
                            listening={true}
                          >
                            <Rect
                              x={-handleRadius}
                              y={-handleRadius}
                              width={handleSize}
                              height={handleSize}
                              fill={handleColor}
                              stroke="#999"
                              strokeWidth={2 / stageScale}
                              cornerRadius={handleRadius}
                            />
                            <Text
                              text="↻"
                              fontSize={10 / stageScale}
                              fill={iconColor}
                              align="center"
                              verticalAlign="middle"
                              x={0}
                              y={0}
                              listening={false}
                            />
                          </Group>
                        </React.Fragment>
                      );
                    })()}
                  </Group>
                  
                  {/* Lock icon for shapes locked by others */}
                  {effectiveLockStatus === 'locked-by-other' && (
                    <Text
                      x={shape.type === 'circle' ? shape.x - 20 : shape.x + shape.width - 20}
                      y={shape.type === 'circle' ? shape.y - (shape.radius || shape.width / 2) + 5 : shape.y + 5}
                      text="🔒"
                      fontSize={16}
                      listening={false} // Icon shouldn't capture events
                    />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Render preview shape during drawing */}
            {drawingState.isDrawing && drawingState.previewShape && (() => {
              const { x, y, width, height } = drawingState.previewShape;
              
              if (activeTool === 'circle') {
                // For circles, render circle centered within the bounding box
                const size = Math.min(width, height);
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                const radius = size / 2;
                
                return (
                  <Circle
                    x={centerX}
                    y={centerY}
                    radius={radius}
                    fill={selectedColor}
                    opacity={0.5}
                    stroke={selectedColor}
                    strokeWidth={2}
                    dash={[10, 5]}
                  />
                );
              } else if (activeTool === 'triangle') {
                // For triangles, calculate vertices from the preview bounding box
                const vertices = calculateTriangleVertices(width, height);
                const points = vertices.flatMap(v => [x + width / 2 + v.x, y + height / 2 + v.y]);
                
                return (
                  <Line
                    points={points}
                    closed={true}
                    fill={selectedColor}
                    opacity={0.5}
                    stroke={selectedColor}
                    strokeWidth={2}
                    dash={[10, 5]}
                  />
                );
              } else {
                // Rectangle (default)
                return (
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={selectedColor}
                    opacity={0.5}
                    stroke={selectedColor}
                    strokeWidth={2}
                    dash={[10, 5]}
                  />
                );
              }
            })()}
            
            {/* Render preview during resize */}
            {isResizing && previewDimensions && activeHandle && (() => {
              const resizingShape = shapes.find(s => s.id === activeHandle.shapeId);
              if (!resizingShape) return null;
              
              const stage = stageRef.current;
              const stageScale = stage ? stage.scaleX() : 1;
              const baseSize = 16 / stageScale;
              const offset = baseSize / 2;
              
              
              return (
                <React.Fragment>
                  {/* Preview shape - maintain rotation during resize */}
                  <Group
                    x={previewDimensions.x + previewDimensions.width / 2}
                    y={previewDimensions.y + previewDimensions.height / 2}
                    rotation={resizingShape.rotation || 0}
                  >
                    {/* Render preview shape based on type */}
                    {resizingShape.type === 'rectangle' && (
                      <Rect
                        x={-previewDimensions.width / 2}
                        y={-previewDimensions.height / 2}
                        width={previewDimensions.width}
                        height={previewDimensions.height}
                        fill={resizingShape.color}
                        opacity={0.6}
                        stroke="#10b981"
                        strokeWidth={3}
                        listening={false}
                      />
                    )}
                    
                    {resizingShape.type === 'circle' && (
                      <Circle
                        x={0}
                        y={0}
                        radius={previewDimensions.width / 2}
                        fill={resizingShape.color}
                        opacity={0.6}
                        stroke="#10b981"
                        strokeWidth={3}
                        listening={false}
                      />
                    )}
                    
                    {resizingShape.type === 'triangle' && (() => {
                      const vertices = calculateTriangleVertices(previewDimensions.width, previewDimensions.height);
                      const points = vertices.flatMap(v => [v.x, v.y]);
                      return (
                        <Line
                          points={points}
                          closed={true}
                          fill={resizingShape.color}
                          opacity={0.6}
                          stroke="#10b981"
                          strokeWidth={3}
                          listening={false}
                        />
                      );
                    })()}
                    
                    {/* Preview handles - positioned relative to rotated shape */}
                    {(() => {
                      // Define resize handles using local coordinates (relative to shape center)
                      const localHandles = resizingShape.type === 'circle' ? [
                        // For circles, show only 4 handles at cardinal directions
                        { x: -offset, y: -previewDimensions.height / 2 - offset },
                        { x: -previewDimensions.width / 2 - offset, y: -offset },
                        { x: previewDimensions.width / 2 - offset, y: -offset },
                        { x: -offset, y: previewDimensions.height / 2 - offset },
                      ] : [
                        // For rectangles and triangles, show all 8 handles (positioned relative to center)
                        { x: -previewDimensions.width / 2 - offset, y: -previewDimensions.height / 2 - offset },
                        { x: -offset, y: -previewDimensions.height / 2 - offset },
                        { x: previewDimensions.width / 2 - offset, y: -previewDimensions.height / 2 - offset },
                        { x: -previewDimensions.width / 2 - offset, y: -offset },
                        { x: previewDimensions.width / 2 - offset, y: -offset },
                        { x: -previewDimensions.width / 2 - offset, y: previewDimensions.height / 2 - offset },
                        { x: -offset, y: previewDimensions.height / 2 - offset },
                        { x: previewDimensions.width / 2 - offset, y: previewDimensions.height / 2 - offset },
                      ];
                      
                      return localHandles.map((handle, idx) => (
                        <Rect
                          key={`preview-handle-${idx}`}
                          x={handle.x}
                          y={handle.y}
                          width={baseSize}
                          height={baseSize}
                          fill="white"
                          stroke="#999"
                          strokeWidth={1 / stageScale}
                          listening={false}
                        />
                      ));
                    })()}
                  </Group>
                  
                  {/* Dimension tooltip */}
                  <Group
                    x={previewDimensions.x + previewDimensions.width / 2}
                    y={previewDimensions.y - (30 / stageScale)}
                  >
                    <Rect
                      x={-(60 / stageScale)}
                      y={-(20 / stageScale)}
                      width={120 / stageScale}
                      height={40 / stageScale}
                      fill="white"
                      stroke="#999"
                      strokeWidth={1 / stageScale}
                      cornerRadius={6 / stageScale}
                      shadowBlur={8 / stageScale}
                      shadowOpacity={0.3}
                      shadowOffsetY={2 / stageScale}
                      listening={false}
                    />
                    <Text
                      x={-(60 / stageScale)}
                      y={-(10 / stageScale)}
                      width={120 / stageScale}
                      text={`${Math.round(previewDimensions.width)} × ${Math.round(previewDimensions.height)}`}
                      fontSize={16 / stageScale}
                      fill="#333"
                      align="center"
                      listening={false}
                    />
                  </Group>
                </React.Fragment>
              );
            })()}
            
            {/* Angle tooltip while rotating */}
            {rotationState.isRotating && rotationState.previewRotation !== null && rotationState.start && (() => {
              const shape = shapes.find(s => s.id === rotationState.start?.shapeId);
              if (!shape) return null;
              
              const stage = stageRef.current;
              const stageScale = stage ? stage.scaleX() : 1;
              
              // Get real-time shape position from node (Bug #1 fix)
              const shapeNode = shapeNodesRef.current.get(shape.id);
              const realTimeX = shapeNode ? shapeNode.x() : (shape.type === 'circle' ? shape.x : shape.x + shape.width / 2);
              const realTimeY = shapeNode ? shapeNode.y() : (shape.type === 'circle' ? shape.y : shape.y + shape.height / 2);
              
              // Calculate rotation handle position using real-time coordinates
              const centerX = realTimeX;
              const handleY = realTimeY - ROTATION_HANDLE_DISTANCE;
              
              // Position tooltip with consistent scaling (Bug #3 fix)
              // Tooltip should be positioned at the rotation handle location (middle of top edge)
              const tooltipX = centerX;
              const tooltipY = handleY - (15 / stageScale);
              
              // Normalize angle to 0-360 and round to nearest degree
              const normalizedAngle = ((rotationState.previewRotation % 360) + 360) % 360;
              const displayAngle = Math.round(normalizedAngle);
              
              return (
                <Group x={tooltipX} y={tooltipY}>
                  {/* Tooltip background with shadow */}
                  <Rect
                    x={-(35 / stageScale)}
                    y={-(20 / stageScale)}
                    width={70 / stageScale}
                    height={40 / stageScale}
                    fill="white"
                    stroke="#999"
                    strokeWidth={1 / stageScale}
                    cornerRadius={6 / stageScale}
                    shadowBlur={8 / stageScale}
                    shadowOpacity={0.3}
                    shadowOffsetY={2 / stageScale}
                    listening={false}
                  />
                  {/* Tooltip text - angle in degrees */}
                  <Text
                    text={`${displayAngle}°`}
                    fontSize={16 / stageScale}
                    fill="#333"
                    align="center"
                    verticalAlign="middle"
                    x={-(35 / stageScale)}
                    y={-(20 / stageScale)}
                    width={70 / stageScale}
                    height={40 / stageScale}
                    listening={false}
                  />
                </Group>
              );
            })()}
            
            {/* Marquee selection rectangle */}
            {marquee && (
              <Rect
                x={Math.min(marquee.startX, marquee.endX)}
                y={Math.min(marquee.startY, marquee.endY)}
                width={Math.abs(marquee.endX - marquee.startX)}
                height={Math.abs(marquee.endY - marquee.startY)}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
        
        {/* Cursor overlay layer */}
        <CursorLayer cursors={remoteCursors} stageRef={stageRef} />
        
        {/* Shape controls panel */}
        {controlsPanel.isVisible && controlsPanel.shapeId && (
          <ShapeControls
            shapeId={controlsPanel.shapeId}
            isVisible={controlsPanel.isVisible}
            position={controlsPanel.position}
            onDelete={handleDeleteShape}
            onDuplicate={handleDuplicateShape}
          />
        )}
      </div>
    </div>
  );
}

export default Canvas;
