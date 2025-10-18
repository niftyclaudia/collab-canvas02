import React from 'react';
import Navbar from './Navbar';
import LeftToolbar from './LeftToolbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <aside className="sidebar">
          <LeftToolbar />
        </aside>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
