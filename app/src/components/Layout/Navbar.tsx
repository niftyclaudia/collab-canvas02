import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { usePresence } from '../../hooks/usePresence';
import TeamIcons from './TeamIcons';
import { CanvasSelector } from '../Canvas/CanvasSelector';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const { setShowDashboard } = useCanvas();
  const { onlineUsers, currentUser, totalOnlineCount } = usePresence();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToDashboard = () => {
    setShowDashboard(true);
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
          <button 
            onClick={handleBackToDashboard}
            className="back-to-dashboard-btn"
            title="Back to Dashboard"
          >
            ← Dashboard
          </button>
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
