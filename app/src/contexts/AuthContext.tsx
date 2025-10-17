import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { authService, type User } from '../services/authService';
import { presenceService } from '../services/presenceService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Setting up auth state listener');
    
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChanged((userData) => {
      console.log('📡 Auth state changed:', userData?.username || 'logged out');
      setUser(userData);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Memoize the user object to prevent unnecessary re-renders and useEffect triggers
  const memoizedUser = useMemo(() => {
    if (!user) return null;
    
    // Create a stable reference by ensuring all properties are defined
    return {
      uid: user.uid,
      email: user.email,
      username: user.username,
      cursorColor: user.cursorColor,
      createdAt: user.createdAt,
    };
  }, [user?.uid, user?.email, user?.username, user?.cursorColor, user?.createdAt]);

  const signup = async (email: string, password: string, username: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await authService.signup(email, password, username);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      // Step 1: Clean up presence data BEFORE auth signout to prevent race conditions
      // Use the original user object (not memoized) to ensure we have the current state
      if (user?.uid) {
        console.log('🚪 AuthContext: Starting presence cleanup before logout for user:', user.uid);
        try {
          await presenceService.logoutCleanup(user.uid);
          console.log('✅ AuthContext: Presence cleanup completed, proceeding with auth logout');
        } catch (presenceError) {
          console.warn('⚠️ AuthContext: Presence cleanup failed, but continuing with logout:', presenceError);
          // Don't fail the entire logout process if presence cleanup fails
        }
      }
      
      // Step 2: Now perform the actual auth logout
      await authService.logout();
      // setUser(null) will be called by the auth state listener
    } catch (error) {
      console.error('❌ AuthContext: Error during logout process:', error);
      setLoading(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: memoizedUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
