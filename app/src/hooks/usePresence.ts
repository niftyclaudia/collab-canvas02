import { useState, useEffect } from 'react';
import { presenceService, type PresenceUpdate } from '../services/presenceService';
import { useAuth } from '../contexts/AuthContext';

export interface OnlineUser {
  userId: string;
  username: string;
  cursorColor: string;
  lastSeen: number;
  online: boolean;
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  console.log('🚨 usePresence HOOK IS RUNNING - Updated version deployed!', { user: !!user, uid: user?.uid });

  // Subscribe to presence updates
  useEffect(() => {
    if (!user) {
      console.log('🎯 usePresence: No user, not setting up presence subscription');
      setOnlineUsers([]);
      return;
    }

    console.log('🎯 usePresence: Setting up presence subscription for user:', user.uid);
    
    // Clean up stale presence data before subscribing (30 second timeout for faster cleanup)
    presenceService.cleanupStalePresence(0.5).catch((error) => {
      console.error('❌ Failed to cleanup stale presence data:', error);
    });
    
    const unsubscribe = presenceService.subscribeToPresence((updates: PresenceUpdate[]) => {
      console.log('🎯 usePresence received updates:', updates);
      console.log('🔍 Current user ID:', user?.uid);
      console.log('🔍 Current user data:', { uid: user.uid, username: user.username, cursorColor: user.cursorColor });
      
      // Debug each user in the updates
      updates.forEach((update, index) => {
        console.log(`🔍 Update ${index}: userId=${update.userId}, presence=`, update.presence);
      });
      
      // Filter and map presence updates to OnlineUser format
      const now = Date.now();
      const ACTIVE_TIMEOUT = 30 * 1000; // 30 seconds in milliseconds (reduced from 5 minutes for faster cleanup)
      
      const users = updates
        .filter((update) => {
          const isOnline = update.presence.online;
          const isNotMe = update.userId !== user.uid;
          const hasUsername = !!update.presence.username;
          const hasColor = !!update.presence.cursorColor;
          const lastSeen = update.presence.lastSeen || 0;
          const isRecentlyActive = (now - lastSeen) < ACTIVE_TIMEOUT;
          
          console.log(`🔍 User ${update.userId}:`);
          console.log(`  - online: ${isOnline}`);
          console.log(`  - notMe: ${isNotMe}`);
          console.log(`  - hasUsername: ${hasUsername} (${update.presence.username})`);
          console.log(`  - hasColor: ${hasColor} (${update.presence.cursorColor})`);
          console.log(`  - lastSeen: ${new Date(lastSeen).toLocaleTimeString()} (${Math.round((now - lastSeen) / 1000)}s ago)`);
          console.log(`  - isRecentlyActive: ${isRecentlyActive}`);
          console.log(`  - passes filter: ${isOnline && isNotMe && hasUsername && isRecentlyActive}`);
          
          return isOnline && isNotMe && hasUsername && isRecentlyActive;
        })
        .map((update) => ({
          userId: update.userId,
          username: update.presence.username,
          cursorColor: update.presence.cursorColor,
          lastSeen: update.presence.lastSeen,
          online: update.presence.online,
        }));

      console.log('👥 Final filtered online users:', users);
      setOnlineUsers(users);
    });

    console.log('🎯 usePresence: Presence subscription set up, unsubscribe function ready');
    return unsubscribe;
  }, [user]);

  // Heartbeat to keep user's lastSeen timestamp fresh
  useEffect(() => {
    if (!user) return;

    const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
    console.log('🫀 Setting up heartbeat for user:', user.uid);

    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('🫀 Heartbeat: Updating lastSeen for user:', user.username);
        await presenceService.setOnline(user.uid, user.username, user.cursorColor);
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      console.log('🫀 Cleaning up heartbeat for user:', user.uid);
      clearInterval(heartbeatInterval);
    };
  }, [user]);

  // Handle user going online when authenticated
  useEffect(() => {
    if (!user) return;

    const goOnline = async () => {
      console.log('🚀🚀🚀 STARTING goOnline() function');
      console.log('🚀 User object exists:', !!user);
      
      try {
        console.log('🎯 DEBUGGING: Full user object:', JSON.stringify(user, null, 2));
        
        // Validate user data before setting online
        if (!user.uid) {
          console.error('❌ Cannot set user online: missing uid');
          return;
        }
        console.log('✅ User has uid:', user.uid);
        
        if (!user.username) {
          console.error('❌ Cannot set user online: missing username', user);
          console.error('❌ This could be the root cause! User missing username.');
          return;
        }
        console.log('✅ User has username:', user.username);
        
        if (!user.cursorColor) {
          console.error('❌ Cannot set user online: missing cursorColor', user);
          console.error('❌ This could be the root cause! User missing cursorColor.');
          return;
        }
        console.log('✅ User has cursorColor:', user.cursorColor);

        console.log('🚀 Setting user online with data:', {
          uid: user.uid,
          username: user.username,
          cursorColor: user.cursorColor
        });
        
        // Mark user as online
        await presenceService.setOnline(user.uid, user.username, user.cursorColor);
        console.log('✅ Called presenceService.setOnline() successfully');
        
        // Set up disconnect handler for automatic cleanup
        await presenceService.setupDisconnectHandler(user.uid);
        console.log('✅ Set up disconnect handler successfully');
        
        console.log('✅ User marked as online:', user.username);
      } catch (error) {
        console.error('❌ Failed to set user online:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
    };

    goOnline();

    // Cleanup function - only runs for non-logout scenarios
    return () => {
      if (user) {
        console.log('🧹 usePresence cleanup: Starting presence cleanup for user:', user.uid);
        // This cleanup runs when:
        // 1. User navigates away from page (browser close/refresh)
        // 2. Component unmounts for other reasons
        // Note: For explicit logout, cleanup is handled in AuthContext to prevent race conditions
        presenceService.cancelDisconnectHandler(user.uid).then(() => {
          return presenceService.setOffline(user.uid);
        }).catch((error) => {
          console.error('❌ usePresence cleanup failed:', error);
        });
      }
    };
  }, [user]);

  // Get total count of online users (including self)
  const totalOnlineCount = user ? onlineUsers.length + 1 : 0;

  return {
    onlineUsers,
    totalOnlineCount,
    currentUser: user ? {
      userId: user.uid,
      username: user.username,
      cursorColor: user.cursorColor,
      lastSeen: Date.now(),
      online: true,
    } : null,
  };
}

export default usePresence;
