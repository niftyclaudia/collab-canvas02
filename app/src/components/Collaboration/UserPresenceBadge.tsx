import React from 'react';
import type { OnlineUser } from '../../hooks/usePresence';

interface UserPresenceBadgeProps {
  user: OnlineUser;
  isCurrentUser?: boolean;
}

export function UserPresenceBadge({ user, isCurrentUser = false }: UserPresenceBadgeProps) {
  return (
    <div
      className="user-presence-badge"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: isCurrentUser ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
      }}
    >
      {/* Colored dot representing cursor color */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: user.cursorColor,
          flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
        }}
      />
      
      {/* Username */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: isCurrentUser ? '500' : '400',
          color: isCurrentUser ? '#1f2937' : '#4b5563',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {user.username}
        {isCurrentUser && ' (you)'}
      </span>
    </div>
  );
}

export default UserPresenceBadge;
