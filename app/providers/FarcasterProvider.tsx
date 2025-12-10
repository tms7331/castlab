'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

/**
 * @deprecated Use useAuth() from AuthProvider instead.
 * This is kept for backwards compatibility with existing code.
 */
interface User {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

/**
 * @deprecated Use AuthProvider instead.
 * This provider now wraps AuthProvider for backwards compatibility.
 * Existing code using useFarcaster() will continue to work.
 */
export function FarcasterProvider({ children }: { children: ReactNode }) {
  // Just pass through - the actual auth logic is now in AuthProvider
  return <>{children}</>;
}

/**
 * @deprecated Use useAuth() from AuthProvider instead.
 * This hook is kept for backwards compatibility.
 * It adapts the unified auth context to the old Farcaster-specific interface.
 */
export function useFarcaster(): FarcasterContextType {
  const auth = useAuth();

  // Adapt unified user to Farcaster-specific user interface
  const farcasterUser: User | null = auth.user?.fid
    ? {
        fid: auth.user.fid,
        username: auth.user.username,
        displayName: auth.user.displayName,
        pfpUrl: auth.user.pfpUrl,
      }
    : null;

  return {
    user: farcasterUser,
    isLoading: auth.isLoading,
    login: auth.login,
    logout: auth.logout,
  };
}