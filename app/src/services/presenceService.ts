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

      console.log('🟢 ATTEMPTING to set user online:', { userId, username, cursorColor, presenceData });
      console.log('🟢 RTDB reference path:', presenceRef.toString());
      
      await set(presenceRef, presenceData);
      
      console.log('✅ User presence set successfully in RTDB');
      console.log('✅ SUCCESS: Data written to RTDB at path:', presenceRef.toString());
      
      // Immediately verify the data was written
      setTimeout(async () => {
        try {
          const { get } = await import('firebase/database');
          const snapshot = await get(presenceRef);
          console.log('🔍 VERIFICATION: Data actually stored in RTDB:', snapshot.val());
        } catch (verificationError) {
          console.error('❌ VERIFICATION FAILED:', verificationError);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR setting user online:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
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

      console.log('🔴 Setting user offline:', { userId, presenceData });
      await set(presenceRef, presenceData);
      console.log('✅ User set offline successfully');
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
    console.log('🎯 PRESENCE: Setting up presence subscription to path:', presenceRef.toString());
    
    const handlePresenceUpdates = (snapshot: any) => {
      const users = snapshot.val();
      console.log('🔄 Raw presence snapshot received:', users);
      console.log('🔄 Full RTDB structure:', JSON.stringify(users, null, 2));
      
      if (!users) {
        console.log('📭 No users data, calling callback with empty array');
        callback([]);
        return;
      }

      const presenceUpdates: PresenceUpdate[] = [];
      Object.entries(users).forEach(([userId, userData]: [string, any]) => {
        console.log(`👤 Processing user ${userId}:`, userData);
        console.log(`👤 User ${userId} full data:`, JSON.stringify(userData, null, 2));
        
        if (userData?.presence) {
          console.log(`✅ User ${userId} has presence data:`, userData.presence);
          presenceUpdates.push({
            userId,
            presence: userData.presence,
          });
        } else if (userData?.cursor) {
          console.log(`🎯 User ${userId} has cursor data but missing presence:`, userData.cursor);
        } else {
          console.log(`❌ User ${userId} missing both presence and cursor data`);
        }
      });

      console.log('📤 Sending presence updates (total: ' + presenceUpdates.length + '):', presenceUpdates);
      callback(presenceUpdates);
    };

    // Set up the listener
    console.log('🎯 PRESENCE: Adding onValue listener to RTDB');
    console.log('🎯 PRESENCE: Listener path:', presenceRef.toString());
    
    const unsubscribe = onValue(presenceRef, handlePresenceUpdates, (error) => {
      console.error('❌ PRESENCE: Subscription error:', error);
      console.error('❌ PRESENCE: Error details:', JSON.stringify(error, null, 2));
    });
    
    // Store unsubscribe function for cleanup
    this.listeners[presenceRef.key || 'presence'] = unsubscribe;
    
    console.log('✅ PRESENCE: Listener set up successfully');

    // Return cleanup function
    return () => {
      console.log('🎯 PRESENCE: Cleaning up presence subscription');
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
      
      console.log('🔗 SETTING UP disconnect handlers for user:', userId);
      console.log('🔗 Presence ref path:', presenceRef.toString());
      
      // Set up disconnect handlers
      const presenceDisconnectRef = onDisconnect(presenceRef);
      const cursorDisconnectRef = onDisconnect(cursorRef);
      
      const disconnectData = {
        online: false,
        lastSeen: Date.now(),
        username: '',
        cursorColor: '',
      };
      
      console.log('🔗 Setting disconnect data:', disconnectData);
      
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

      console.log('✅ Disconnect handlers set up successfully for user:', userId);
      console.log('⚠️  NOTE: If user appears offline immediately, disconnect handlers may be firing too early');
    } catch (error) {
      console.error('❌ CRITICAL ERROR setting up disconnect handler:', error);
      console.error('❌ This could cause immediate offline status!');
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
        console.log('✅ Disconnect handlers canceled for user:', userId);
      }
    } catch (error) {
      console.error('Error canceling disconnect handler:', error);
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
