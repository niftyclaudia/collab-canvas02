import { UserPresenceBadge } from './UserPresenceBadge';
import type { OnlineUser } from '../../hooks/usePresence';
import { deduplicateUsers } from '../../hooks/usePresence';

interface PresenceListProps {
  onlineUsers: OnlineUser[];
  currentUser: OnlineUser | null;
  totalOnlineCount: number;
}

export function PresenceList({ onlineUsers, currentUser, totalOnlineCount }: PresenceListProps) {
  // Deduplicate users by userId to prevent duplicate keys
  const uniqueOnlineUsers = deduplicateUsers(onlineUsers);

  return (
    <div
      className="presence-list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        minWidth: '200px',
        maxWidth: '250px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Online ({totalOnlineCount})
        </h3>
      </div>

      {/* User list */}
      <div
        className="users-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {/* Current user first */}
        {currentUser && (
          <UserPresenceBadge 
            user={currentUser} 
            isCurrentUser={true}
          />
        )}
        
        {/* Other online users */}
        {uniqueOnlineUsers.map((user) => (
          <UserPresenceBadge 
            key={user.userId} 
            user={user} 
            isCurrentUser={false}
          />
        ))}
        
        {/* Empty state */}
        {totalOnlineCount === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '12px',
              padding: '8px',
            }}
          >
            No users online
          </div>
        )}
        
        {totalOnlineCount === 1 && currentUser && (
          <div
            style={{
              textAlign: 'center',  
              color: '#9ca3af',
              fontSize: '12px',
              padding: '8px',
            }}
          >
            You're the only one here
          </div>
        )}
      </div>
    </div>
  );
}

export default PresenceList;
