import React from 'react';
import Navbar from './Navbar';
import ColorToolbar from '../Canvas/ColorToolbar';
import { CanvasProvider } from '../../contexts/CanvasContext';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <CanvasProvider>
      <div className="app-shell">
        <Navbar />
        <div className="app-body">
          <aside className="sidebar">
            <ColorToolbar />
            <div className="presence-placeholder">
              <h4>Users Online</h4>
              <p>Coming in PR #3</p>
            </div>
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
