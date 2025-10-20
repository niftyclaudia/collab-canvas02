import React, { useState } from 'react';
import Navbar from './Navbar';
import LeftToolbar from './LeftToolbar';
import AIChat from '../AI/AIChat';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

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
      
      {/* AI Chat - Right side floating panel */}
      <AIChat 
        isOpen={isChatOpen}
        onToggle={handleToggleChat}
      />
    </div>
  );
}

export default AppShell;
