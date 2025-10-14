import { ref, set, onValue, remove } from 'firebase/database';
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
    
    console.log('🎯 CURSOR: Setting up cursor subscription to path:', cursorsRef.toString());
    
    const handleCursorUpdates = (snapshot: any) => {
      const users = snapshot.val();
      console.log('🎯 CURSOR: Raw cursor snapshot received:', users);
      console.log('🎯 CURSOR: Full RTDB structure for cursors:', JSON.stringify(users, null, 2));
      
      if (!users) {
        console.log('🎯 CURSOR: No users data, calling callback with empty array');
        callback([]);
        return;
      }

      const cursors: CursorUpdate[] = [];
      Object.entries(users).forEach(([userId, userData]: [string, any]) => {
        console.log(`🎯 CURSOR: Processing user ${userId}:`, userData);
        if (userData?.cursor) {
          console.log(`✅ CURSOR: User ${userId} has cursor data:`, userData.cursor);
          cursors.push({
            userId,
            cursor: userData.cursor,
          });
        } else {
          console.log(`❌ CURSOR: User ${userId} missing cursor data`);
        }
      });

      console.log('📤 CURSOR: Sending cursor updates (total: ' + cursors.length + '):', cursors);
      callback(cursors);
    };

    // Set up the listener
    console.log('🎯 CURSOR: Adding onValue listener to RTDB');
    console.log('🎯 CURSOR: Listener path:', cursorsRef.toString());
    
    const unsubscribe = onValue(cursorsRef, handleCursorUpdates, (error) => {
      console.error('❌ CURSOR: Subscription error:', error);
      console.error('❌ CURSOR: Error details:', JSON.stringify(error, null, 2));
    });
    
    // Store unsubscribe function for cleanup
    this.listeners[cursorsRef.key || 'cursors'] = unsubscribe;
    
    console.log('✅ CURSOR: Listener set up successfully');

    // Return cleanup function
    return () => {
      console.log('🎯 CURSOR: Cleaning up cursor subscription');
      unsubscribe();
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
    } catch (error: unknown) {
      // Handle permission errors gracefully during cleanup scenarios
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'PERMISSION_DENIED') {
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
    // Clean up listeners (they are now unsubscribe functions)
    Object.values(this.listeners).forEach((unsubscribeFn) => {
      if (typeof unsubscribeFn === 'function') {
        unsubscribeFn();
      }
    });
    this.listeners = {};
    this.presenceHeartbeats = {}; // Clean up heartbeat tracking
  }
}

export const cursorService = new CursorService();
export default cursorService;
