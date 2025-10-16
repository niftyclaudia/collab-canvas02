import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../../utils/constants';
import { useCursors } from '../../hooks/useCursors';
import { useCanvas } from '../../hooks/useCanvas';
import { CursorLayer } from '../Collaboration/CursorLayer';
import { canvasService } from '../../services/canvasService';
import type { Shape } from '../../services/canvasService';

export function Canvas() {
  const stageRef = useRef<any>(null);
  
  // Resize handle hover state
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Track shape node refs for real-time position updates during drag
  const shapeNodesRef = useRef<Map<string, Konva.Rect>>(new Map());
  
  // Force re-render trigger for smooth handle updates
  const [, setUpdateTrigger] = useState(0);
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);
  
  // Resize state management
  const [isResizing, setIsResizing] = useState(false);
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
    shapes, 
    selectedColor, 
    selectedShapeId,
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
  
  // Cursor tracking hook
  const { remoteCursors } = useCursors(stageRef);
  const animationFrameRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<number | null>(null);
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

  // Shape click handlers
  const handleShapeClick = useCallback(async (e: KonvaEventObject<MouseEvent>, shape: Shape) => {
    e.cancelBubble = true; // Prevent event from bubbling to stage
    
    try {
      await lockShape(shape.id);
    } catch (error) {
      console.error('Failed to lock shape:', error);
    }
  }, [lockShape]);
  
  // Handle shape drag movement with boundary constraints
  const handleShapeDragMove = useCallback((e: KonvaEventObject<DragEvent>, shape: Shape) => {
    const node = e.target as Konva.Rect;
    const currentX = node.x();
    const currentY = node.y();
    
    // Clamp position to canvas boundaries in real-time
    const clampedPosition = canvasService.clampShapeToCanvas(
      currentX, 
      currentY, 
      shape.width, 
      shape.height
    );
    
    // Only update position if it was clamped
    if (clampedPosition.x !== currentX || clampedPosition.y !== currentY) {
      node.x(clampedPosition.x);
      node.y(clampedPosition.y);
    }
    
    // Force React re-render for smooth handle position updates
    forceUpdate();
  }, [forceUpdate]);

  const handleShapeDragEnd = useCallback(async (e: KonvaEventObject<DragEvent>, shape: Shape) => {
    const node = e.target as Konva.Rect;
    
    // Validate and clamp final position
    const validatedPosition = canvasService.validateShapePosition(
      node.x(),
      node.y(),
      shape.width,
      shape.height
    );
    
    // Apply clamped position if needed
    if (validatedPosition.wasClamped) {
      node.x(validatedPosition.x);
      node.y(validatedPosition.y);
      console.log('🔒 Shape position clamped to canvas bounds');
    }
    
    const finalPosition = {
      x: validatedPosition.x,
      y: validatedPosition.y,
    };
    
    try {
      // Update shape position in Firestore
      await updateShape(shape.id, finalPosition);
      
      // Release lock after successful drag
      await unlockShape(shape.id);
    } catch (error) {
      console.error('Failed to update shape position:', error);
      // Reset position on error
      node.x(shape.x);
      node.y(shape.y);
    }
  }, [updateShape, unlockShape]);

  // Resize handle mousedown - start resize
  const handleResizeStart = useCallback((e: KonvaEventObject<MouseEvent>, shape: Shape, handleType: 'corner' | 'edge', handleName: string) => {
    e.cancelBubble = true; // Prevent shape drag
    
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
    const shapeX = shapeNode ? shapeNode.x() : shape.x;
    const shapeY = shapeNode ? shapeNode.y() : shape.y;
    
    setIsResizing(true);
    setActiveHandle({ shapeId: shape.id, handleType, handleName });
    setResizeStart({
      cursorX: canvasPos.x,
      cursorY: canvasPos.y,
      shapeX: shapeX,
      shapeY: shapeY,
      width: shape.width,
      height: shape.height,
      aspectRatio: shape.width / shape.height,
    });
    setPreviewDimensions({
      shapeId: shape.id,
      x: shapeX,
      y: shapeY,
      width: shape.width,
      height: shape.height,
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
      
      // Enforce minimum size
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);
      
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
      // Edge resize - single dimension only
      let newX = resizeStart.shapeX;
      let newY = resizeStart.shapeY;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
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
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Stop interactive resizing but keep preview dimensions for optimistic update
    setIsResizing(false);
    setActiveHandle(null);
    setResizeStart(null);

    try {
      // Save resize to Firestore
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
      
      console.log('✅ Shape resized successfully');
    } catch (error) {
      console.error('❌ Failed to resize shape:', error);
      // Clear preview on error so shape reverts to original
      setPreviewDimensions(null);
    }
    // Note: previewDimensions will be cleared when we detect the shape update from Firestore
  }, [isResizing, previewDimensions, activeHandle, resizeStart, updateShape]);

  // Background click handler (deselect + drawing)
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Check if we clicked on the stage background
    const targetClass = e.target.getClassName();
    const isBackground = targetClass === 'Stage' || 
                        (targetClass === 'Rect' && e.target.id() === 'canvas-background') ||
                        targetClass === 'Line';
    
    if (isBackground) {
      // Deselect current shape if any
      if (selectedShapeId) {
        unlockShape(selectedShapeId).catch(error => {
          console.error('Failed to unlock shape on deselect:', error);
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
        
        startDrawing(canvasPos.x, canvasPos.y);
      }
    }
  }, [mode, selectedShapeId, startDrawing, unlockShape]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Handle resize if active
    if (isResizing) {
      handleResizeMove(e);
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
  }, [isResizing, handleResizeMove, drawingState.isDrawing, updateDrawing]);

  const handleMouseUp = useCallback(() => {
    // Handle resize end if active
    if (isResizing) {
      handleResizeEnd();
      return;
    }
    
    // Handle drawing
    if (!drawingState.isDrawing) return;
    finishDrawing();
  }, [isResizing, handleResizeEnd, drawingState.isDrawing, finishDrawing]);

  // Cancel drawing on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingState.isDrawing) {
        cancelDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingState.isDrawing, cancelDrawing]);

  // Clear preview dimensions once Firestore update is confirmed
  useEffect(() => {
    if (!previewDimensions || isResizing) return;
    
    // Find the shape that was resized
    const shape = shapes.find(s => s.id === previewDimensions.shapeId);
    if (!shape) return;
    
    // Check if the shape dimensions match the preview (within 1px tolerance for rounding)
    const dimensionsMatch = 
      Math.abs(shape.width - previewDimensions.width) < 1 &&
      Math.abs(shape.height - previewDimensions.height) < 1 &&
      Math.abs(shape.x - previewDimensions.x) < 1 &&
      Math.abs(shape.y - previewDimensions.y) < 1;
    
    if (dimensionsMatch) {
      console.log('✅ Firestore update confirmed, clearing preview dimensions');
      setPreviewDimensions(null);
    }
  }, [shapes, previewDimensions, isResizing]);

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
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={!isGesturing && !drawingState.isDrawing && mode === 'pan'}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseDown={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
              
              // Visual styling based on lock status
              let strokeColor = shape.color;
              let strokeWidth = 2;
              let opacity = 1;
              let isDraggable = false;
              
              if (lockStatus === 'locked-by-me') {
                strokeColor = '#10b981'; // Green border
                strokeWidth = 3;
                isDraggable = true;
              } else if (lockStatus === 'locked-by-other') {
                strokeColor = '#ef4444'; // Red border
                strokeWidth = 3;
                opacity = 0.5;
              }
              
              // Check if we have optimistic preview dimensions for this shape
              const hasOptimisticUpdate = !isResizing && previewDimensions && 
                                         !activeHandle && shape.id === previewDimensions.shapeId;
              
              // Make original shape semi-transparent during active resize
              const isBeingResized = isResizing && activeHandle?.shapeId === shape.id;
              if (isBeingResized) {
                opacity = 0.2;
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
              }
              
              return (
                <React.Fragment key={shape.id}>
                  <Rect
                    ref={(node) => {
                      if (node) {
                        shapeNodesRef.current.set(shape.id, node);
                      } else {
                        shapeNodesRef.current.delete(shape.id);
                      }
                    }}
                    x={hasOptimisticUpdate ? displayX : shape.x}
                    y={hasOptimisticUpdate ? displayY : shape.y}
                    width={displayWidth}
                    height={displayHeight}
                    fill={shape.color}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    draggable={isDraggable && !hasOptimisticUpdate}
                    onClick={(e) => handleShapeClick(e, shape)}
                    onDragMove={(e) => handleShapeDragMove(e, shape)}
                    onDragEnd={(e) => handleShapeDragEnd(e, shape)}
                    listening={lockStatus !== 'locked-by-other' && !hasOptimisticUpdate} // Disable interaction if locked by other or has optimistic update
                  />
                  
                  {/* Lock icon for shapes locked by others */}
                  {lockStatus === 'locked-by-other' && (
                    <Text
                      x={shape.x + shape.width - 20}
                      y={shape.y + 5}
                      text="🔒"
                      fontSize={16}
                      listening={false} // Icon shouldn't capture events
                    />
                  )}
                  
                  {/* Resize handles - only show for shapes locked by current user */}
                  {lockStatus === 'locked-by-me' && !isBeingResized && !hasOptimisticUpdate && (() => {
                    const stage = stageRef.current;
                    const stageScale = stage ? stage.scaleX() : 1;
                    
                    // Handle size scales inversely with zoom for consistent screen size
                    const baseSize = 16 / stageScale;
                    const hoverSize = 20 / stageScale;
                    const offset = baseSize / 2;
                    
                    // Define 8 resize handles using display position and dimensions (4 corners + 4 edges)
                    const handles = [
                      { x: displayX - offset, y: displayY - offset, cursor: 'nwse-resize', type: 'corner' as const, name: `${shape.id}-tl` },
                      { x: displayX + displayWidth / 2 - offset, y: displayY - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-t` },
                      { x: displayX + displayWidth - offset, y: displayY - offset, cursor: 'nesw-resize', type: 'corner' as const, name: `${shape.id}-tr` },
                      { x: displayX - offset, y: displayY + displayHeight / 2 - offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-l` },
                      { x: displayX + displayWidth - offset, y: displayY + displayHeight / 2 - offset, cursor: 'ew-resize', type: 'edge' as const, name: `${shape.id}-r` },
                      { x: displayX - offset, y: displayY + displayHeight - offset, cursor: 'nesw-resize', type: 'corner' as const, name: `${shape.id}-bl` },
                      { x: displayX + displayWidth / 2 - offset, y: displayY + displayHeight - offset, cursor: 'ns-resize', type: 'edge' as const, name: `${shape.id}-b` },
                      { x: displayX + displayWidth - offset, y: displayY + displayHeight - offset, cursor: 'nwse-resize', type: 'corner' as const, name: `${shape.id}-br` },
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
                </React.Fragment>
              );
            })}
            
            {/* Render preview rectangle during drawing */}
            {drawingState.isDrawing && drawingState.previewShape && (
              <Rect
                x={drawingState.previewShape.x}
                y={drawingState.previewShape.y}
                width={drawingState.previewShape.width}
                height={drawingState.previewShape.height}
                fill={selectedColor}
                opacity={0.5}
                stroke={selectedColor}
                strokeWidth={2}
                dash={[10, 5]}
              />
            )}
            
            {/* Render preview during resize */}
            {isResizing && previewDimensions && activeHandle && (() => {
              const resizingShape = shapes.find(s => s.id === activeHandle.shapeId);
              if (!resizingShape) return null;
              
              const stage = stageRef.current;
              const stageScale = stage ? stage.scaleX() : 1;
              const baseSize = 16 / stageScale;
              const offset = baseSize / 2;
              
              // Define 8 resize handles for preview
              const previewHandles = [
                { x: previewDimensions.x - offset, y: previewDimensions.y - offset },
                { x: previewDimensions.x + previewDimensions.width / 2 - offset, y: previewDimensions.y - offset },
                { x: previewDimensions.x + previewDimensions.width - offset, y: previewDimensions.y - offset },
                { x: previewDimensions.x - offset, y: previewDimensions.y + previewDimensions.height / 2 - offset },
                { x: previewDimensions.x + previewDimensions.width - offset, y: previewDimensions.y + previewDimensions.height / 2 - offset },
                { x: previewDimensions.x - offset, y: previewDimensions.y + previewDimensions.height - offset },
                { x: previewDimensions.x + previewDimensions.width / 2 - offset, y: previewDimensions.y + previewDimensions.height - offset },
                { x: previewDimensions.x + previewDimensions.width - offset, y: previewDimensions.y + previewDimensions.height - offset },
              ];
              
              return (
                <React.Fragment>
                  {/* Preview shape */}
                  <Rect
                    x={previewDimensions.x}
                    y={previewDimensions.y}
                    width={previewDimensions.width}
                    height={previewDimensions.height}
                    fill={resizingShape.color}
                    opacity={0.6}
                    stroke="#10b981"
                    strokeWidth={3}
                    listening={false}
                  />
                  
                  {/* Preview handles */}
                  {previewHandles.map((handle, idx) => (
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
                  ))}
                  
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
          </Layer>
        </Stage>
        
        {/* Cursor overlay layer */}
        <CursorLayer cursors={remoteCursors} stageRef={stageRef} />
      </div>
    </div>
  );
}

export default Canvas;
