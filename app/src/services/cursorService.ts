import { ref, set, onValue, off, remove } from 'firebase/database';
import { database } from '../firebase';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export interface CursorData {
  x: number;
  y: number;
  username: string;
  color: string;
  timestamp: number;
}

export interface CursorUpdate {
  userId: string;
  cursor: CursorData;
}

class CursorService {
  private listeners: { [key: string]: any } = {};
  private presenceHeartbeats: { [userId: string]: number } = {}; // Track last heartbeat time
  private readonly PRESENCE_HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Update cursor position for a user in RTDB
   */
  async updateCursorPosition(
    userId: string, 
    x: number, 
    y: number, 
    username: string, 
    color: string
  ): Promise<void> {
    try {
      // Validate coordinates are within canvas bounds
      if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        // Don't update if cursor is outside canvas bounds
        return;
      }

      const cursorRef = ref(database, `sessions/main/users/${userId}/cursor`);
      const cursorData: CursorData = {
        x,
        y,
        username,
        color,
        timestamp: Date.now(),
      };

      await set(cursorRef, cursorData);

      // Smart presence heartbeat - update presence every 30 seconds
      this.maybeUpdatePresence(userId, username, color);
    } catch (error) {
      console.error('Error updating cursor position:', error);
      throw error;
    }
  }

  /**
   * Subscribe to cursor updates for all users
   */
  subscribeToCursors(callback: (cursors: CursorUpdate[]) => void): () => void {
    const cursorsRef = ref(database, 'sessions/main/users');
    
    const handleCursorUpdates = (snapshot: any) => {
      const users = snapshot.val();
      
      if (!users) {
        callback([]);
        return;
      }

      const cursors: CursorUpdate[] = [];
      Object.entries(users).forEach(([userId, userData]: [string, any]) => {
        if (userData?.cursor) {
          cursors.push({
            userId,
            cursor: userData.cursor,
          });
        }
      });

      callback(cursors);
    };

    // Set up the listener
    onValue(cursorsRef, handleCursorUpdates);
    
    // Store reference for cleanup
    this.listeners[cursorsRef.key || 'cursors'] = cursorsRef;

    // Return cleanup function
    return () => {
      off(cursorsRef, 'value', handleCursorUpdates);
      delete this.listeners[cursorsRef.key || 'cursors'];
    };
  }

  /**
   * Maybe update presence (throttled to every 30 seconds per user)
   */
  private maybeUpdatePresence(userId: string, username: string, color: string): void {
    const now = Date.now();
    const lastHeartbeat = this.presenceHeartbeats[userId] || 0;
    
    // Only update presence every 30 seconds
    if (now - lastHeartbeat > this.PRESENCE_HEARTBEAT_INTERVAL) {
      this.presenceHeartbeats[userId] = now;
      
      // Import and call presenceService (async, don't await to avoid blocking cursor)
      import('./presenceService').then(({ presenceService }) => {
        presenceService.setOnline(userId, username, color).catch((error) => {
          console.error('Failed to update presence from cursor activity:', error);
        });
      }).catch((error) => {
        console.error('Failed to import presenceService:', error);
      });
    }
  }

  /**
   * Remove cursor for a specific user (cleanup on disconnect)
   */
  async removeCursor(userId: string): Promise<void> {
    try {
      const cursorRef = ref(database, `sessions/main/users/${userId}/cursor`);
      await remove(cursorRef);
      
      // Clean up presence heartbeat tracking to avoid memory leaks
      delete this.presenceHeartbeats[userId];
    } catch (error) {
      // Handle permission errors gracefully during cleanup scenarios
      if (error.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied removing cursor (likely during logout/cleanup):', userId);
        // Still clean up local tracking even if database removal fails
        delete this.presenceHeartbeats[userId];
      } else {
        console.error('Error removing cursor:', error);
        throw error;
      }
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    Object.values(this.listeners).forEach((listenerRef) => {
      off(listenerRef);
    });
    this.listeners = {};
    this.presenceHeartbeats = {}; // Clean up heartbeat tracking
  }
}

export const cursorService = new CursorService();
export default cursorService;
