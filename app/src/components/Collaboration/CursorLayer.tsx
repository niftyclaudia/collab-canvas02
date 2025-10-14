import React from 'react';
import { Cursor } from './Cursor';
import type { RemoteCursor } from '../../hooks/useCursors';

interface CursorLayerProps {
  cursors: RemoteCursor[];
  stageRef: React.RefObject<any>;
}

export function CursorLayer({ cursors, stageRef }: CursorLayerProps) {
  // Convert canvas coordinates to screen coordinates for cursor positioning
  const canvasToScreenCoordinates = (canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0, visible: false };

    const stagePos = stage.position();
    const scale = stage.scaleX();

    // Convert canvas coordinates to screen coordinates
    const screenX = canvasX * scale + stagePos.x;
    const screenY = canvasY * scale + stagePos.y;

    // Get stage container bounds to check if cursor is visible
    const stageContainer = stage.container();
    const rect = stageContainer?.getBoundingClientRect();
    
    if (!rect) return { x: screenX, y: screenY, visible: true };

    // Check if cursor is within visible stage area
    const isVisible = 
      screenX >= 0 && 
      screenX <= rect.width && 
      screenY >= 0 && 
      screenY <= rect.height;

    return { 
      x: screenX, 
      y: screenY, 
      visible: isVisible 
    };
  };

  return (
    <div 
      className="cursor-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {cursors.map((cursor) => {
        const screenPos = canvasToScreenCoordinates(cursor.x, cursor.y);
        
        return (
          <Cursor
            key={cursor.userId}
            x={screenPos.x}
            y={screenPos.y}
            username={cursor.username}
            color={cursor.color}
            isVisible={screenPos.visible}
          />
        );
      })}
    </div>
  );
}

export default CursorLayer;
