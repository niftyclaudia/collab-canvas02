import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthComponent from './components/Auth/AuthProvider';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import './App.css'

// Main app component with route guard logic
function AppContent() {
  const { user, loading } = useAuth();

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Route guard: show auth screens if not authenticated
  if (!user) {
    return <AuthComponent />;
  }

  // Show main app if authenticated
  return (
    <AppShell>
      <Canvas />
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
