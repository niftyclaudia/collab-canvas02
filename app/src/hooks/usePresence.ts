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

    const unsubscribe = presenceService.subscribeToPresence((updates: PresenceUpdate[]) => {
      console.log('🎯 usePresence received updates:', updates);
      console.log('🔍 Current user ID:', user?.uid);
      console.log('🔍 Current user data:', { uid: user.uid, username: user.username, cursorColor: user.cursorColor });
      
      // Debug each user in the updates
      updates.forEach((update, index) => {
        console.log(`🔍 Update ${index}: userId=${update.userId}, presence=`, update.presence);
      });
      
      // Filter and map presence updates to OnlineUser format
      const users = updates
        .filter((update) => {
          const isOnline = update.presence.online;
          const isNotMe = update.userId !== user.uid;
          const hasUsername = !!update.presence.username;
          const hasColor = !!update.presence.cursorColor;
          
          console.log(`🔍 User ${update.userId}:`);
          console.log(`  - online: ${isOnline}`);
          console.log(`  - notMe: ${isNotMe}`);
          console.log(`  - hasUsername: ${hasUsername} (${update.presence.username})`);
          console.log(`  - hasColor: ${hasColor} (${update.presence.cursorColor})`);
          console.log(`  - passes filter: ${isOnline && isNotMe && hasUsername}`);
          
          return isOnline && isNotMe && hasUsername;
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

    return unsubscribe;
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
        
        // TEMPORARILY DISABLED: Set up disconnect handler for automatic cleanup
        // await presenceService.setupDisconnectHandler(user.uid);
        // console.log('✅ Set up disconnect handler successfully');
        console.log('⚠️ TESTING: Disconnect handlers disabled to test if they cause immediate offline status');
        
        console.log('✅ User marked as online:', user.username);
      } catch (error) {
        console.error('❌ Failed to set user online:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
    };

    goOnline();

    // Cleanup function
    return () => {
      if (user) {
        // Cancel disconnect handlers and go offline
        presenceService.cancelDisconnectHandler(user.uid).then(() => {
          return presenceService.setOffline(user.uid);
        }).catch((error) => {
          console.error('Failed to cleanup presence:', error);
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
