import React from 'react';
import Navbar from './Navbar';
import ColorToolbar from '../Canvas/ColorToolbar';
import { CanvasProvider } from '../../contexts/CanvasContext';
import { PresenceList } from '../Collaboration/PresenceList';
import { usePresence } from '../../hooks/usePresence';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { onlineUsers, currentUser, totalOnlineCount } = usePresence();

  return (
    <CanvasProvider>
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
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </CanvasProvider>
  );
}

export default AppShell;
