'use client';

import { http, createConfig } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { CHAIN as DEFAULT_CHAIN } from './addresses';
export { CONTRACT_ADDRESS, TOKEN_ADDRESS } from './addresses';

// Re-export utility functions for backwards compatibility
// (Import from './utils' directly for server-side usage)
export { usdToTokenAmount, tokenAmountToUsd } from './utils';

// WalletConnect project ID - required for WalletConnect
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// RainbowKit connectors for standalone web app mode
const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: 'CastLab',
    projectId,
  }
);

// Create wagmi config with both Farcaster and RainbowKit connectors
// The UI will decide which to display based on environment
export const config = createConfig({
  chains: [DEFAULT_CHAIN],
  transports: {
    [DEFAULT_CHAIN.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
    ...rainbowKitConnectors,
  ],
});