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
    if (storedToken) {
      try {
        const userData = await authService.getCurrentUser(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setLoading(false);
  };

  initAuth();
}, []);

  const login = async (username: string, password: string) => {
    const response: AuthResponse = await authService.login(username, password);
    setToken(response.access_token);
    localStorage.setItem('token', response.access_token);
    
    const userData = await authService.getCurrentUser(response.access_token);
    setUser(userData);
  };

  const register = async (userData: any) => {
    await authService.register(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
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