import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Could show a toast notification here
    }
  };

  if (!user) {
    return null; // Don't show navbar when not authenticated
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>CollabCanvas</h1>
        </div>


        <div className="navbar-user">
          <div className="user-info">
            <div 
              className="user-color-indicator" 
              style={{ backgroundColor: user.cursorColor }}
              title="Your cursor color"
            />
            <span className="username">{user.username}</span>
          </div>
          
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
