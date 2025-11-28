import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { User, AuthResponse, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // NEW: Add refreshUser function
  const refreshUser = async (): Promise<void> => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.log('❌ No token found for refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing user data...');
      const userData = await authService.getCurrentUser();
      console.log('✅ User data refreshed:', userData);
      setUser(userData);
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);
      // If refresh fails, the token might be invalid
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('🔄 Auth init - storedToken:', storedToken);
      
      if (storedToken) {
        try {
          console.log('🔐 Attempting to get current user...');
          const userData = await authService.getCurrentUser();
          console.log('✅ User data loaded:', userData);
          setUser(userData);
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Starting login for user:', username);
      
      // Clear any previous reset messages
      setResetMessage(null);
      
      const response: AuthResponse = await authService.login(username, password);
      console.log('✅ Login response received:', response);
      
      if (!response.access_token) {
        throw new Error('No access token received');
      }
      
      setToken(response.access_token);
      localStorage.setItem('token', response.access_token);
      console.log('💾 Token saved to localStorage');
      
      console.log('👤 Fetching user data...');
      const userData = await authService.getCurrentUser();
      console.log('✅ User data received:', userData);
      setUser(userData);
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      console.log('📝 Starting registration...');
      await authService.register(userData);
      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    console.log('🚪 Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    console.log('✅ Logout complete');
  };

  // Password reset functionality
  const forgotPassword = async (email: string): Promise<void> => {
    setResetLoading(true);
    setResetMessage(null);
    
    try {
      console.log('📧 Sending password reset for email:', email);
      await authService.forgotPassword(email);
      setResetMessage('If the email exists, a reset link has been sent.');
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send reset email. Please try again.';
      setResetMessage(message);
      console.error('❌ Forgot password failed:', error);
      throw error;
    } finally {
      setResetLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    setResetLoading(true);
    setResetMessage('');
    
    try {
      console.log('🔄 Resetting password with token:', token);
      await authService.resetPassword(token, newPassword);
      setResetMessage('Password reset successfully! Redirecting to login...');
      return true; // Return true on success
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      const message = error.response?.data?.detail || 'Failed to reset password. The token may be invalid or expired.';
      setResetMessage(message);
      return false; // Return false on failure
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetToken = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 Verifying reset token:', token);
      const response = await authService.verifyResetToken(token);
      console.log('✅ Token verification response:', response);
      return response.valid;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return false;
    }
  };

  const clearResetMessage = (): void => {
    setResetMessage(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    loading,
    // NEW: Add refreshUser to the context value
    refreshUser,
    // Password reset
    forgotPassword,
    resetPassword,
    verifyResetToken,
    resetLoading,
    resetMessage,
    clearResetMessage,
    setResetMessage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};