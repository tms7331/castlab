import { http, createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { CHAIN } from './addresses';

// Separate config for admin page with standard wallet connectors
export const adminConfig = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http(),
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
export { CONTRACT_ADDRESS, usdToTokenAmount, tokenAmountToUsd } from './config';