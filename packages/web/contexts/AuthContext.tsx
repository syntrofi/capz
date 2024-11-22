'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

type LoginProvider = 'Farcaster' | 'Google' | 'Web3 Wallet' | 'Email';

interface AuthContextType {
  isLoggedIn: boolean;
  loginProvider: LoginProvider | null;
  login: (provider: LoginProvider) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginProvider, setLoginProvider] = useState<LoginProvider | null>(null);

  const login = (provider: LoginProvider) => {
    setIsLoggedIn(true);
    setLoginProvider(provider);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setLoginProvider(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loginProvider, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}