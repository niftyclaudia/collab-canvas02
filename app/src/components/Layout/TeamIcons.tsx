import { useState } from 'react';
import type { OnlineUser } from '../../hooks/usePresence';

interface TeamIconsProps {
  onlineUsers: OnlineUser[];
  currentUser: OnlineUser | null;
  totalOnlineCount: number;
}

export function TeamIcons({ onlineUsers, currentUser, totalOnlineCount }: TeamIconsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Combine current user with other users
  const allUsers = currentUser 
    ? [currentUser, ...onlineUsers.filter(user => user.userId !== currentUser.userId)]
    : onlineUsers;
  
  // Show first 5 users, rest in dropdown
  const visibleUsers = allUsers.slice(0, 5);
  const hiddenUsers = allUsers.slice(5);
  
  const handleIconClick = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="team-icons-container">
      {/* Visible team icons */}
      <div className="team-icons">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className="team-icon"
            style={{ backgroundColor: user.cursorColor }}
            title={`${user.username} (${user === currentUser ? 'you' : 'online'})`}
            onClick={handleIconClick}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        ))}
        
        {/* Show more button if there are hidden users */}
        {hiddenUsers.length > 0 && (
          <button
            className="team-icon show-more"
            onClick={handleIconClick}
            title={`${hiddenUsers.length} more users`}
          >
            +{hiddenUsers.length}
          </button>
        )}
      </div>

      {/* Dropdown with all users */}
      {showDropdown && (
        <div className="team-dropdown">
          <div className="team-dropdown-header">
            <span>Online ({totalOnlineCount})</span>
            <button 
              className="close-dropdown"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>
          <div className="team-dropdown-list">
            {allUsers.map((user) => (
              <div key={user.userId} className="team-dropdown-item">
                <div
                  className="team-dropdown-icon"
                  style={{ backgroundColor: user.cursorColor }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="team-dropdown-name">
                  {user.username}
                  {user === currentUser && ' (you)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamIcons;
