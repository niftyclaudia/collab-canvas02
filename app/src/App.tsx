import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CanvasProvider } from './contexts/CanvasContext';
import { ToastProvider } from './contexts/ToastContext';
import AuthComponent from './components/Auth/AuthProvider';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import ToastContainer from './components/UI/ToastContainer';
import ErrorBoundary from './components/UI/ErrorBoundary';
import './App.css'

// Main app component with route guard logic
function AppContent() {
  const { user, loading } = useAuth();

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading CollabCanvas...</p>
      </div>
    );
  }

  // Route guard: show auth screens if not authenticated
  if (!user) {
    return <AuthComponent />;
  }

  // Show main app if authenticated
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <AppShell>
          <Canvas />
        </AppShell>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
