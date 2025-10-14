import React from 'react';
import Navbar from './Navbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default AppShell;
