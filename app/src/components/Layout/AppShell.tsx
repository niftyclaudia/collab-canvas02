import React from 'react';
import Navbar from './Navbar';
import ColorToolbar from '../Canvas/ColorToolbar';
import { PresenceList } from '../Collaboration/PresenceList';
import { usePresence } from '../../hooks/usePresence';
import { useCanvas } from '../../hooks/useCanvas';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { onlineUsers, currentUser, totalOnlineCount } = usePresence();
  const { clearCanvas } = useCanvas();

  const handleClearCanvas = async () => {
    if (window.confirm('Are you sure you want to clear all shapes from the canvas? This action cannot be undone.')) {
      try {
        await clearCanvas();
      } catch (error) {
        console.error('Clear canvas error:', error);
      }
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <aside className="sidebar">
          <ColorToolbar />
          <PresenceList 
            onlineUsers={onlineUsers}
            currentUser={currentUser}
            totalOnlineCount={totalOnlineCount}
          />
          <div className="clear-canvas-section">
            <button
              onClick={handleClearCanvas}
              className="clear-canvas-button sidebar-clear-button"
              title="Clear all shapes from canvas"
            >
              🗑️ Clear Canvas
            </button>
          </div>
        </aside>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
