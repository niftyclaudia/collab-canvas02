import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const { signup, signInWithGoogle, loading } = useAuth();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password || !formData.username) {
      showError('All fields are required');
      return;
    }

    if (formData.username.trim().length < 2) {
      showError('Username must be at least 2 characters long');
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.username);
      showSuccess(`Welcome to CollabCanvas, ${formData.username}! Your account has been created successfully.`);
      // Success - user will be redirected by the route guard in App.tsx
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An error occurred during signup';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters long.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      showError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showSuccess('Welcome to CollabCanvas! Your account has been created with Google.');
      // Success - user will be redirected by the route guard in App.tsx
    } catch (error: any) {
      console.error('Google signin error:', error);
      
      // Handle Google auth errors
      let errorMessage = 'An error occurred during Google sign-in';
      if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="geometric-shape-1"></div>
      <div className="geometric-shape-2"></div>
      <div className="geometric-shape-3"></div>
      
      {/* Side Info Panel */}
      <div className="auth-info-panel">
        <div className="info-content">
          <h2>DESIGN TOGETHER</h2>
          <p>Real-time collaboration meets AI-powered design</p>
          <div className="feature-badges">
            <span className="feature-badge">REAL-TIME SYNC</span>
            <span className="feature-badge">AI ASSISTANT</span>
            <span className="feature-badge">MULTIPLAYER</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        {/* Logo/Brand */}
        <div className="auth-logo">
          <div className="logo-icon">◆</div>
          <span className="logo-text">COLLABCANVAS</span>
        </div>

        <div className="auth-header">
          <h1>Create Together</h1>
          <p>Start your journey with real-time collaboration tools</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">USERNAME</label>
            <div className="input-with-icon">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                disabled={loading}
                minLength={2}
                maxLength={30}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <div className="input-with-icon">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <div className="input-with-icon">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button 
          type="button" 
          className="google-auth-button" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading ? 'Signing in...' : 'Google'}</span>
        </button>

        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              className="link-button" 
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
