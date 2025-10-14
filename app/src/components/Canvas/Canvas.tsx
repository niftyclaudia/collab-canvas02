import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../../utils/constants';

export function Canvas() {
  const stageRef = useRef<any>(null);
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

  return (
    <div className="canvas-container">
      <div 
        className="canvas-stage-container"
        style={{
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
          draggable={!isGesturing}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
        >
          <Layer>
            {/* Canvas background - visual indicator of canvas bounds */}
            <Rect
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
            {/* Shapes will be rendered here in future PRs */}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default Canvas;
