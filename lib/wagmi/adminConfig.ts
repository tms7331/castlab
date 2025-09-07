import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Separate config for admin page with standard wallet connectors
export const adminConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    }),
    coinbaseWallet({
      appName: 'Farcaster Science Admin',
    }),
  ],
});

// Re-export common utilities
export { CONTRACT_ADDRESS, USD_TO_ETH_RATE, usdToWei, weiToUsd } from './config';