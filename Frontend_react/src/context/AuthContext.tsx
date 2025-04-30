// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id?: number;
  email: string;
  role: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuthInfo: (user: User | null, token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check if exp exists and if the token has expired
      if (payload.exp) {
        const expirationTime = payload.exp * 1000; // Convert expiration time to milliseconds
        return Date.now() >= expirationTime;
      }
      return false; // If there's no exp claim, assume token is not expired
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true; // If there's an error parsing the token, consider it expired
    }
  };

  // Initialize state from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      // Check if token is valid and not expired
      if (!isTokenExpired(storedToken)) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        // If token is expired, remove it from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const setAuthInfo = (user: User | null, token: string | null) => {
    setUser(user);
    setToken(token);
    setIsAuthenticated(!!user && !!token);
    
    // Save to localStorage
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, setAuthInfo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};