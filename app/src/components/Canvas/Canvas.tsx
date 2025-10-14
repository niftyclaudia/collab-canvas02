import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
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
  }, [getDistance, getCenter]);

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

    // Reset accumulated delta and clear animation frame
    accumulatedDeltaRef.current = 0;
    animationFrameRef.current = null;
  }, []);

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
  }, [isGesturing, performSmoothZoom]);

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
  }, []);

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

  const handleMouseMove = useCallback((_e: KonvaEventObject<MouseEvent>) => {
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
  }, [drawingState.isDrawing, updateDrawing]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing) return;
    finishDrawing();
  }, [drawingState.isDrawing, finishDrawing]);

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
              
              return (
                <React.Fragment key={shape.id}>
                  <Rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.color}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    draggable={isDraggable}
                    onClick={(e) => handleShapeClick(e, shape)}
                    onDragMove={(e) => handleShapeDragMove(e, shape)}
                    onDragEnd={(e) => handleShapeDragEnd(e, shape)}
                    listening={lockStatus !== 'locked-by-other'} // Disable interaction if locked by other
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
          </Layer>
        </Stage>
        
        {/* Cursor overlay layer */}
        <CursorLayer cursors={remoteCursors} stageRef={stageRef} />
      </div>
    </div>
  );
}

export default Canvas;
