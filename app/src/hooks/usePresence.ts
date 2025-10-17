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

  // Subscribe to presence updates
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }
    
    // Note: cleanupStalePresence is disabled because it requires admin permissions
    // The onDisconnect handlers will handle cleanup automatically
    
    const unsubscribe = presenceService.subscribeToPresence((updates: PresenceUpdate[]) => {
      // Filter and map presence updates to OnlineUser format
      const now = Date.now();
      const ACTIVE_TIMEOUT = 30 * 1000; // 30 seconds in milliseconds (reduced from 5 minutes for faster cleanup)
      
      const users = updates
        .filter((update) => {
          const isOnline = update.presence.online;
          const isNotMe = update.userId !== user.uid;
          const hasUsername = !!update.presence.username;
          const lastSeen = update.presence.lastSeen || 0;
          const isRecentlyActive = (now - lastSeen) < ACTIVE_TIMEOUT;
          
          return isOnline && isNotMe && hasUsername && isRecentlyActive;
        })
        .map((update) => ({
          userId: update.userId,
          username: update.presence.username,
          cursorColor: update.presence.cursorColor,
          lastSeen: update.presence.lastSeen,
          online: update.presence.online,
        }));

      setOnlineUsers(users);
    });

    return unsubscribe;
  }, [user]);

  // Heartbeat to keep user's lastSeen timestamp fresh
  useEffect(() => {
    if (!user) return;

    const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

    const heartbeatInterval = setInterval(async () => {
      try {
        await presenceService.setOnline(user.uid, user.username, user.cursorColor);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [user]);

  // Handle user going online when authenticated
  useEffect(() => {
    if (!user) return;

    const goOnline = async () => {
      try {
        // Validate user data before setting online
        if (!user.uid || !user.username || !user.cursorColor) {
          console.error('Cannot set user online: missing required data', { uid: !!user.uid, username: !!user.username, cursorColor: !!user.cursorColor });
          return;
        }
        
        // Mark user as online
        await presenceService.setOnline(user.uid, user.username, user.cursorColor);
        
        // Set up disconnect handler for automatic cleanup
        await presenceService.setupDisconnectHandler(user.uid);
      } catch (error) {
        console.error('Failed to set user online:', error);
      }
    };

    goOnline();

    // Cleanup function - only runs for non-logout scenarios
    return () => {
      if (user && !presenceService.getLogoutFlag()) {
        console.log('🧹 usePresence cleanup triggered for user:', user.uid);
        // This cleanup runs when:
        // 1. User navigates away from page (browser close/refresh)
        // 2. Component unmounts for other reasons
        // Note: For explicit logout, cleanup is handled in AuthContext to prevent race conditions
        presenceService.cancelDisconnectHandler(user.uid).then(() => {
          return presenceService.setOffline(user.uid);
        }).catch((error) => {
          console.error('usePresence cleanup failed:', error);
        });
      } else if (presenceService.getLogoutFlag()) {
        console.log('🚫 Skipping usePresence cleanup - logout in progress');
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
