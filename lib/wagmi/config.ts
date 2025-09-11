import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Create wagmi config with Farcaster connector - Base Sepolia only for testing
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
  ],
});

// Contract configuration for Base Sepolia
export const CONTRACT_ADDRESS = "0x9150Ae3b5e1Db7fB7300239532c5dC62a63aFfae" as const;
export const TOKEN_ADDRESS = "0x33c17027bc6d1af5985F18D93377D7731bB03527" as const;

// We'll use Base Sepolia for testing
export const DEFAULT_CHAIN = baseSepolia;

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