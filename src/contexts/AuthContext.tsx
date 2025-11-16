import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

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

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Starting login for user:', username);
      
      // Step 1: Login to get token
      const response: AuthResponse = await authService.login(username, password);
      console.log('✅ Login response received:', response);
      
      if (!response.access_token) {
        throw new Error('No access token received');
      }
      
      // Save token
      setToken(response.access_token);
      localStorage.setItem('token', response.access_token);
      console.log('💾 Token saved to localStorage');
      
      // Step 2: Get user data
      console.log('👤 Fetching user data...');
      const userData = await authService.getCurrentUser();
      console.log('✅ User data received:', userData);
      setUser(userData);
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      // Clear any partial state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('📝 Starting registration...');
      await authService.register(userData);
      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    console.log('✅ Logout complete');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    loading
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