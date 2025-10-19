import { useAuth } from '../../hooks/useAuth';
import { usePresence } from '../../hooks/usePresence';
import TeamIcons from './TeamIcons';
import { CanvasSelector } from '../Canvas/CanvasSelector';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const { onlineUsers, currentUser, totalOnlineCount } = usePresence();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <div className="logo-icon">◆</div>
            <span className="logo-text">COLLABCANVAS</span>
          </div>
          <CanvasSelector />
        </div>

        <div className="navbar-right">
          <TeamIcons 
            onlineUsers={onlineUsers}
            currentUser={currentUser}
            totalOnlineCount={totalOnlineCount}
          />
          
          <button 
            onClick={handleLogout} 
            className="logout-button"
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
