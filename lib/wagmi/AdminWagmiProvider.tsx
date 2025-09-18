'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ReactNode } from 'react';
import { CHAIN } from './addresses';

// Create config with RainbowKit
const config = getDefaultConfig({
  appName: 'Farcaster Science Admin',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [CHAIN],
  ssr: true,
});

const queryClient = new QueryClient();

export function AdminWagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}