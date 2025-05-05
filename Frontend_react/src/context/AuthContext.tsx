// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
  isLoading: boolean;
  setAuthInfo: (user: User | null, token: string | null) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh settings
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check token every minute

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tokenTimer, setTokenTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Function to get token expiration time in milliseconds
  const getTokenExpirationTime = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return payload.exp * 1000; // Convert expiration time to milliseconds
      }
      return 0;
    } catch (error) {
      console.error("Error getting token expiration time:", error);
      return 0;
    }
  };

  // Function to refresh the token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      // Make API call to refresh the token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update token in state and localStorage
        setToken(data.token);
        localStorage.setItem('token', data.token);
        return true;
      } else {
        // If refresh fails, log the user out
        logout();
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      return false;
    }
  }, [token]);

  // Start token refresh timer
  const startTokenRefreshTimer = useCallback(() => {
    if (tokenTimer) {
      clearInterval(tokenTimer);
    }

    const interval = setInterval(() => {
      if (token) {
        const expirationTime = getTokenExpirationTime(token);
        const timeUntilExpiration = expirationTime - Date.now();
        
        if (timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiration > 0) {
          refreshToken();
        } else if (timeUntilExpiration <= 0) {
          logout();
        }
      }
    }, TOKEN_CHECK_INTERVAL);

    setTokenTimer(interval);
    return interval;
  }, [token, refreshToken]);

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
        
        // Start token refresh timer
        startTokenRefreshTimer();
        
        // If token is close to expiration, refresh it immediately
        const expirationTime = getTokenExpirationTime(storedToken);
        const timeUntilExpiration = expirationTime - Date.now();
        if (timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiration > 0) {
          refreshToken();
        }
      } else {
        // If token is expired, remove it from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setIsLoading(false);
    
    // Cleanup timer on unmount
    return () => {
      if (tokenTimer) {
        clearInterval(tokenTimer);
      }
    };
  }, [refreshToken, startTokenRefreshTimer]);

  // Update timer when token changes
  useEffect(() => {
    if (token) {
      startTokenRefreshTimer();
    }
    
    return () => {
      if (tokenTimer) {
        clearInterval(tokenTimer);
      }
    };
  }, [token, startTokenRefreshTimer]);

  const setAuthInfo = (user: User | null, token: string | null) => {
    setUser(user);
    setToken(token);
    setIsAuthenticated(!!user && !!token);
    
    // Save to localStorage
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      startTokenRefreshTimer();
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (tokenTimer) {
        clearInterval(tokenTimer);
        setTokenTimer(null);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (tokenTimer) {
      clearInterval(tokenTimer);
      setTokenTimer(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, setAuthInfo, logout, refreshToken }}>
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