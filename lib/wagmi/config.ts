import { http, createConfig } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { CHAIN as DEFAULT_CHAIN } from './addresses';
export { CONTRACT_ADDRESS, TOKEN_ADDRESS } from './addresses';

// Create wagmi config with Farcaster connector
export const config = createConfig({
  chains: [DEFAULT_CHAIN],
  transports: {
    [DEFAULT_CHAIN.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
  ],
});

// For ERC20 tokens: assuming 1 token = 1 USD with 6 decimals (USDC standard)
export function usdToTokenAmount(usdAmount: number, decimals: number = 6): bigint {
  // Convert USD to token units (assuming 1:1 peg)
  const tokenAmount = BigInt(Math.floor(usdAmount * Math.pow(10, decimals)));
  return tokenAmount;
}

export function tokenAmountToUsd(tokenAmount: bigint, decimals: number = 6): number {
  // Convert token units to USD (assuming 1:1 peg)
  const usdAmount = Number(tokenAmount) / Math.pow(10, decimals);
  return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
}