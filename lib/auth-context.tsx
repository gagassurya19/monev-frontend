"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthContextType, AuthState, JWTPayload } from './types';
import { JWTAuth } from './auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const updateAuthState = useCallback((
    isAuthenticated: boolean,
    user: AuthState['user'] = null,
    token: string | null = null,
    error: string | null = null
  ) => {
    setAuthState({
      isAuthenticated,
      user,
      token,
      isLoading: false,
      error,
    });
  }, []);

  const signOut = useCallback(() => {
    // Clear token from storage
    JWTAuth.removeToken();
    
    // Clear token check interval
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
      tokenCheckIntervalRef.current = null;
    }

    // Update state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    
    // Redirect to current page without token
    if (typeof window !== 'undefined') {
      JWTAuth.removeTokenFromURL();
    }
  }, []);

  const setupTokenExpiration = useCallback((token: string) => {
    // Clear existing interval
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
    }

    const checkTokenExpiry = () => {
      if (JWTAuth.isTokenExpired(token)) {
        console.log('Token expired, refreshing page...');
        
        // Clear token from storage before refresh
        JWTAuth.removeToken();
        
        // Refresh the page to restart authentication flow
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return;
      }

      // Get time until expiry
      const timeUntilExpiry = JWTAuth.getTimeUntilExpiry(token);
      console.log(`Token expires in ${timeUntilExpiry} seconds`);
    };

    // Check immediately
    checkTokenExpiry();

    // Set up interval to check every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);
    tokenCheckIntervalRef.current = interval;
  }, []);

  const authenticateWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const verificationResult = await JWTAuth.verifyToken(token);
      
      if (!verificationResult.valid) {
        updateAuthState(false, null, null, verificationResult.error || 'Token verification failed');
        return false;
      }

      const payload = verificationResult.payload as JWTPayload;
      
      // Store token
      JWTAuth.storeToken(token);
      
      // Set up token expiration monitoring
      setupTokenExpiration(token);

      // Update auth state
      updateAuthState(
        true,
        {
          username: payload.sub,
          name: payload.name,
          admin: payload.admin || false,
        },
        token,
        null
      );

      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      updateAuthState(false, null, null, 'Authentication failed');
      return false;
    }
  }, [updateAuthState, setupTokenExpiration]);

  const refreshAuth = useCallback(async (force: boolean = false) => {
    if (!force && isInitializedRef.current) {
      return; // Prevent multiple calls unless forced
    }
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, check for token in URL
      const urlToken = JWTAuth.getTokenFromURL();
      
      if (urlToken) {
        console.log('Found token in URL, authenticating...');
        const verificationResult = await JWTAuth.verifyToken(urlToken);
        
        if (verificationResult.valid && verificationResult.payload) {
          const payload = verificationResult.payload as JWTPayload;
          
          // Store token
          JWTAuth.storeToken(urlToken);
          
          // Set up token expiration monitoring
          setupTokenExpiration(urlToken);

          // Update auth state
          updateAuthState(
            true,
            {
              username: payload.sub,
              name: payload.name,
              admin: payload.admin || false,
            },
            urlToken,
            null
          );

          // Remove token from URL after successful authentication
          JWTAuth.removeTokenFromURL();
          return;
        }
      }

      // If no URL token or URL token failed, check stored token
      const storedToken = JWTAuth.getStoredToken();
      
      if (storedToken) {
        console.log('Found stored token, verifying...');
        const verificationResult = await JWTAuth.verifyToken(storedToken);
        
        if (verificationResult.valid && verificationResult.payload) {
          const payload = verificationResult.payload as JWTPayload;
          
          // Set up token expiration monitoring
          setupTokenExpiration(storedToken);

          // Update auth state
          updateAuthState(
            true,
            {
              username: payload.sub,
              name: payload.name,
              admin: payload.admin || false,
            },
            storedToken,
            null
          );
          return;
        } else {
          // Remove invalid stored token
          JWTAuth.removeToken();
        }
      }

      // No valid token found
      updateAuthState(false, null, null, null);
    } catch (error) {
      console.error('Auth refresh error:', error);
      updateAuthState(false, null, null, 'Authentication failed');
    }
  }, [updateAuthState, setupTokenExpiration]);

  // Initialize authentication on mount ONCE
  useEffect(() => {
    refreshAuth();
  }, []); // Empty dependency array - run only once

  // Listen for storage changes (for logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue === null) {
        // Token was removed in another tab
        signOut();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [signOut]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
    };
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    signOut,
    refreshAuth,
  };

  // Don't render children until authentication check is complete
  if (authState.isLoading) {
    return (
      <AuthContext.Provider value={contextValue}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* Simple spinner */}
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            
            {/* Minimal text */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Memverifikasi autentikasi
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mohon tunggu...
              </p>
            </div>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 