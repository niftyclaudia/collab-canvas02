import { useState, useEffect, useCallback, useRef } from 'react';
import { throttle } from 'lodash';
import { cursorService, type CursorUpdate } from '../services/cursorService';
import { useAuth } from '../contexts/AuthContext';
import { usePresence } from './usePresence';
import { CURSOR_UPDATE_THROTTLE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  username: string;
  color: string;
  timestamp: number;
}

export function useCursors(stageRef: React.RefObject<any>) {
  const { user } = useAuth();
  const { onlineUsers } = usePresence(); // Get online users from presence system
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const throttledUpdateRef = useRef<((x: number, y: number) => void) & { cancel(): void } | null>(null);
  const isTrackingRef = useRef(false);

  console.log('🚨 useCursors HOOK IS RUNNING - Updated version deployed!', { user: !!user, uid: user?.uid });

  // Create throttled update function
  useEffect(() => {
    if (!user) return;

    throttledUpdateRef.current = throttle(
      (x: number, y: number) => {
        if (!user) return;
        
        cursorService.updateCursorPosition(
          user.uid,
          x,
          y,
          user.username,
          user.cursorColor
        ).catch((error) => {
          console.error('Failed to update cursor position:', error);
        });
      },
      CURSOR_UPDATE_THROTTLE
    );

    return () => {
      if (throttledUpdateRef.current) {
        throttledUpdateRef.current.cancel();
      }
    };
  }, [user]);

  // Subscribe to remote cursors
  useEffect(() => {
    if (!user) {
      console.log('🎯 useCursors: No user, not setting up cursor subscription');
      return;
    }

    console.log('🎯 useCursors: Setting up cursor subscription for user:', user.uid);
    
    // Clean up any stale cursor data before subscribing
    cursorService.cleanupStaleCursors().catch((error) => {
      console.error('❌ Failed to cleanup stale cursor data:', error);
    });
    
    const unsubscribe = cursorService.subscribeToCursors((cursors: CursorUpdate[]) => {
      console.log('🎯 useCursors: Received cursor updates:', cursors);
      console.log('🎯 useCursors: Current user ID to filter out:', user.uid);
      console.log('🎯 useCursors: Online users from presence:', onlineUsers.map(u => ({ userId: u.userId, username: u.username })));
      
      // Create a Set of online user IDs for efficient lookup
      const onlineUserIds = new Set(onlineUsers.map(u => u.userId));
      
      // Filter cursors: exclude own cursor AND only show cursors for users who are actually online
      const remoteCursors = cursors
        .filter((cursor) => {
          const isNotMe = cursor.userId !== user.uid;
          const isOnline = onlineUserIds.has(cursor.userId);
          
          console.log(`🎯 useCursors: User ${cursor.userId} (${cursor.cursor.username}):`);
          console.log(`  - isNotMe: ${isNotMe}`);
          console.log(`  - isOnline: ${isOnline}`);
          console.log(`  - passes filter: ${isNotMe && isOnline}`);
          
          return isNotMe && isOnline;
        })
        .map((cursor) => ({
          userId: cursor.userId,
          x: cursor.cursor.x,
          y: cursor.cursor.y,
          username: cursor.cursor.username,
          color: cursor.cursor.color,
          timestamp: cursor.cursor.timestamp,
        }));

      console.log('🎯 useCursors: Final remote cursors after presence validation:', remoteCursors);
      setRemoteCursors(remoteCursors);
    });

    console.log('🎯 useCursors: Cursor subscription set up, unsubscribe function ready');
    return unsubscribe;
  }, [user, onlineUsers]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvasCoordinates = useCallback((screenX: number, screenY: number) => {
    const stage = stageRef.current;
    if (!stage) return null;

    const stagePos = stage.position();
    const scale = stage.scaleX();

    // Convert screen coordinates to canvas coordinates
    const canvasX = (screenX - stagePos.x) / scale;
    const canvasY = (screenY - stagePos.y) / scale;

    return { x: canvasX, y: canvasY };
  }, [stageRef]);

  // Handle mouse move over canvas
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!user || !throttledUpdateRef.current || !isTrackingRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Get mouse position relative to the stage container
    const stageContainer = stage.container();
    const rect = stageContainer.getBoundingClientRect();
    
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert to canvas coordinates
    const canvasCoords = screenToCanvasCoordinates(screenX, screenY);
    if (!canvasCoords) return;

    const { x, y } = canvasCoords;

    // Only track cursor if it's within canvas bounds
    if (x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT) {
      throttledUpdateRef.current(x, y);
    }
  }, [user, screenToCanvasCoordinates, stageRef]);

  // Handle mouse enter canvas
  const handleMouseEnter = useCallback(() => {
    isTrackingRef.current = true;
  }, []);

  // Handle mouse leave canvas
  const handleMouseLeave = useCallback(() => {
    isTrackingRef.current = false;
    if (user) {
      // Remove cursor when mouse leaves canvas
      cursorService.removeCursor(user.uid).catch((error) => {
        // Only log non-permission errors to avoid noise during logout
        if (error.code !== 'PERMISSION_DENIED') {
          console.error('Failed to remove cursor:', error);
        }
      });
    }
  }, [user]);

  // Set up mouse event listeners
  useEffect(() => {
    if (!user) return;

    const stage = stageRef.current;
    if (!stage) return;

    const stageContainer = stage.container();
    if (!stageContainer) return;

    // Add event listeners
    stageContainer.addEventListener('mousemove', handleMouseMove);
    stageContainer.addEventListener('mouseenter', handleMouseEnter); 
    stageContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Clean up event listeners
      stageContainer.removeEventListener('mousemove', handleMouseMove);
      stageContainer.removeEventListener('mouseenter', handleMouseEnter);
      stageContainer.removeEventListener('mouseleave', handleMouseLeave);
      
      // Clean up cursor on unmount
      if (user) {
        cursorService.removeCursor(user.uid).catch((error) => {
          // Only log non-permission errors to avoid noise during logout/cleanup
          if (error.code !== 'PERMISSION_DENIED') {
            console.error('Failed to remove cursor on cleanup:', error);
          }
        });
      }
    };
  }, [user, handleMouseMove, handleMouseEnter, handleMouseLeave, stageRef]);

  return {
    remoteCursors,
    isTracking: isTrackingRef.current,
  };
}

export default useCursors;
