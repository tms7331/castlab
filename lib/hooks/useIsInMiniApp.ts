'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface UseIsInMiniAppResult {
  isInMiniApp: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect if the app is running inside a Farcaster Mini App context.
 *
 * Uses sdk.isInMiniApp() which:
 * - Returns false immediately for SSR
 * - Verifies context communication for iframes/WebViews
 * - Caches the result for performance
 *
 * @see https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
 */
export function useIsInMiniApp(): UseIsInMiniAppResult {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        const result = await sdk.isInMiniApp();
        setIsInMiniApp(result);
      } catch (error) {
        // If detection fails, assume we're not in a mini app
        console.warn('Failed to detect mini app environment:', error);
        setIsInMiniApp(false);
      } finally {
        setIsLoading(false);
      }
    };

    detectEnvironment();
  }, []);

  return { isInMiniApp, isLoading };
}
