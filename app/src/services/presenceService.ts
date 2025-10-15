import { ref, set, onValue, onDisconnect } from 'firebase/database';
import { database } from '../firebase';

export interface PresenceData {
  online: boolean;
  lastSeen: number;
  username: string;
  cursorColor: string;
}

export interface PresenceUpdate {
  userId: string;
  presence: PresenceData;
}

class PresenceService {
  private listeners: { [key: string]: any } = {};
  private disconnectHandlers: { [userId: string]: any } = {};

  /**
   * Mark user as online
   */
  async setOnline(userId: string, username: string, cursorColor: string): Promise<void> {
    try {
      const presenceRef = ref(database, `sessions/main/users/${userId}/presence`);
      const presenceData: PresenceData = {
        online: true,
        lastSeen: Date.now(),
        username,
        cursorColor,
      };
      
      await set(presenceRef, presenceData);
    } catch (error) {
      console.error('Error setting user online:', error);
      throw error;
    }
  }

  /**
   * Mark user as offline (manual cleanup)
   */
  async setOffline(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `sessions/main/users/${userId}/presence`);
      const presenceData: PresenceData = {
        online: false,
        lastSeen: Date.now(),
        username: '', // Will be overwritten by onDisconnect if needed
        cursorColor: '',
      };

      await set(presenceRef, presenceData);
    } catch (error) {
      console.error('Error setting user offline:', error);
      throw error;
    }
  }

  /**
   * Subscribe to presence updates for all users
   */
  subscribeToPresence(callback: (users: PresenceUpdate[]) => void): () => void {
    const presenceRef = ref(database, 'sessions/main/users');
    
    const handlePresenceUpdates = (snapshot: any) => {
      const users = snapshot.val();
      
      if (!users) {
        callback([]);
        return;
      }

      const presenceUpdates: PresenceUpdate[] = [];
      Object.entries(users).forEach(([userId, userData]: [string, any]) => {
        if (userData?.presence) {
          presenceUpdates.push({
            userId,
            presence: userData.presence,
          });
        }
      });

      callback(presenceUpdates);
    };

    const unsubscribe = onValue(presenceRef, handlePresenceUpdates, (error) => {
      console.error('Presence subscription error:', error);
    });
    
    // Store unsubscribe function for cleanup
    this.listeners[presenceRef.key || 'presence'] = unsubscribe;

    // Return cleanup function
    return () => {
      unsubscribe();
      delete this.listeners[presenceRef.key || 'presence'];
    };
  }

  /**
   * Setup disconnect handler for automatic cleanup
   * This ensures user goes offline when browser closes or network disconnects
   */
  async setupDisconnectHandler(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `sessions/main/users/${userId}/presence`);
      const cursorRef = ref(database, `sessions/main/users/${userId}/cursor`);
      
      // Set up disconnect handlers
      const presenceDisconnectRef = onDisconnect(presenceRef);
      const cursorDisconnectRef = onDisconnect(cursorRef);
      
      const disconnectData = {
        online: false,
        lastSeen: Date.now(),
        username: '',
        cursorColor: '',
      };
      
      // On disconnect, set presence to offline and remove cursor
      await Promise.all([
        presenceDisconnectRef.set(disconnectData),
        cursorDisconnectRef.remove(),
      ]);

      // Store disconnect handlers for cleanup
      this.disconnectHandlers[userId] = {
        presence: presenceDisconnectRef,
        cursor: cursorDisconnectRef,
      };
    } catch (error) {
      console.error('Error setting up disconnect handler:', error);
      throw error;
    }
  }

  /**
   * Cancel disconnect handlers (call on manual logout)
   */
  async cancelDisconnectHandler(userId: string): Promise<void> {
    try {
      const handlers = this.disconnectHandlers[userId];
      if (handlers) {
        // Cancel the disconnect handlers
        await Promise.all([
          handlers.presence.cancel(),
          handlers.cursor.cancel(),
        ]);
        
        delete this.disconnectHandlers[userId];
      }
    } catch (error) {
      console.error('Error canceling disconnect handler:', error);
    }
  }

  /**
   * Explicit logout cleanup - ensures proper offline status before auth signout
   * This prevents race conditions between disconnect handlers and manual cleanup
   */
  async logoutCleanup(userId: string): Promise<void> {
    try {
      // Step 1: Cancel disconnect handlers first to prevent them from overriding our manual cleanup
      await this.cancelDisconnectHandler(userId);
      
      // Step 2: Explicitly set user offline with a slight delay to ensure it takes effect
      await this.setOffline(userId);
      
      // Step 3: Small delay to ensure the offline status is written to Firebase before auth signout
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error during logout cleanup:', error);
      // Still try to set offline even if other steps failed
      try {
        await this.setOffline(userId);
      } catch (fallbackError) {
        console.error('Fallback offline setting failed:', fallbackError);
      }
      throw error;
    }
  }

  /**
   * Clean up stale presence data (users inactive for more than the timeout)
   */
  async cleanupStalePresence(timeoutMinutes: number = 5): Promise<void> {
    try {
      const { get } = await import('firebase/database');
      const presenceRef = ref(database, 'sessions/main/users');
      const snapshot = await get(presenceRef);
      
      if (!snapshot.exists()) {
        return;
      }

      const users = snapshot.val();
      const now = Date.now();
      const timeout = timeoutMinutes * 60 * 1000;
      
      const cleanupPromises: Promise<void>[] = [];
      
      Object.entries(users).forEach(([userId, userData]: [string, any]) => {
        if (userData?.presence) {
          const lastSeen = userData.presence.lastSeen || 0;
          const isStale = (now - lastSeen) > timeout;
          
          if (isStale && userData.presence.online) {
            cleanupPromises.push(this.setOffline(userId));
          }
        }
      });
      
      if (cleanupPromises.length > 0) {
        await Promise.all(cleanupPromises);
      }
    } catch (error) {
      console.error('Error during presence cleanup:', error);
    }
  }

  /**
   * Clean up all listeners and disconnect handlers
   */
  cleanup(): void {
    // Clean up listeners (they are now unsubscribe functions)
    Object.values(this.listeners).forEach((unsubscribeFn) => {
      if (typeof unsubscribeFn === 'function') {
        unsubscribeFn();
      }
    });
    this.listeners = {};

    // Clean up disconnect handlers
    Object.keys(this.disconnectHandlers).forEach(async (userId) => {
      await this.cancelDisconnectHandler(userId);
    });
  }
}

export const presenceService = new PresenceService();
export default presenceService;
