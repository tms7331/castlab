'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { sdk } from '@farcaster/miniapp-sdk';
import type { UnifiedUser, UnifiedAuthContextType } from '@/lib/auth/types';

const AuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [miniAppDetected, setMiniAppDetected] = useState(false);

  // Wagmi hooks for wallet state
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { connect, connectors } = useConnect();

  // Detect if we're in a Farcaster mini app
  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        const result = await sdk.isInMiniApp();
        setIsInMiniApp(result);
        setMiniAppDetected(true);
      } catch (error) {
        console.warn('Failed to detect mini app environment:', error);
        setIsInMiniApp(false);
        setMiniAppDetected(true);
      }
    };

    detectEnvironment();
  }, []);

  // Initialize Farcaster SDK when in mini app
  useEffect(() => {
    if (!miniAppDetected || !isInMiniApp) return;

    const initializeFarcaster = async () => {
      try {
        // Get the mini app context
        const context = await sdk.context;

        // If we have user info and connected wallet, create unified user
        if (context?.user && address) {
          setUser({
            address,
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        } else if (address) {
          // Wallet connected but no Farcaster context
          setUser({ address });
        }

        // Signal that the app is ready - this hides the splash screen
        await sdk.actions.ready();

        // Prompt user to add the mini app if they haven't already
        try {
          await sdk.actions.addMiniApp();
        } catch (error) {
          // This may fail if already added or in development
          console.log('Add mini app prompt skipped:', error);
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, [miniAppDetected, isInMiniApp, address]);

  // Handle standalone mode (non-Farcaster)
  useEffect(() => {
    if (!miniAppDetected || isInMiniApp) return;

    // In standalone mode, user is just their wallet address
    if (address) {
      setUser({ address });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [miniAppDetected, isInMiniApp, address]);

  // Update user when wallet address changes
  useEffect(() => {
    if (!miniAppDetected) return;

    if (address && user?.address !== address) {
      // Address changed, update user
      if (isInMiniApp) {
        // In mini app, try to get Farcaster context
        sdk.context.then((context) => {
          if (context?.user) {
            setUser({
              address,
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          } else {
            setUser({ address });
          }
        }).catch(() => {
          setUser({ address });
        });
      } else {
        setUser({ address });
      }
    } else if (!address && user) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, miniAppDetected, isInMiniApp, user?.address]);

  const login = useCallback(async () => {
    if (isInMiniApp) {
      // In Farcaster, use Sign In With Farcaster
      try {
        setIsLoading(true);
        const result = await sdk.actions.signIn({
          nonce: Math.random().toString(36).substring(7),
        });

        if (result) {
          // After successful sign-in, get the updated context
          const context = await sdk.context;
          if (context?.user && address) {
            setUser({
              address,
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          }
        }
      } catch (error) {
        console.error('Farcaster login failed:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // In standalone mode, open RainbowKit modal
      if (openConnectModal) {
        openConnectModal();
      } else {
        // Fallback: try to connect with first available connector
        const connector = connectors[0];
        if (connector) {
          connect({ connector });
        }
      }
    }
  }, [isInMiniApp, address, openConnectModal, connect, connectors]);

  const logout = useCallback(() => {
    disconnect();
    setUser(null);
  }, [disconnect]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: isConnected && !!user,
        isInMiniApp,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UnifiedAuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
