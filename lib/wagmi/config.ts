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

// Contract configuration
// TODO: Replace with your deployed contract address
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// We'll use Base Sepolia for testing
export const DEFAULT_CHAIN = baseSepolia;

// Convert USD to ETH (simplified - in production, use a price oracle)
// Assuming 1 ETH = $2000 for demo purposes
export const USD_TO_ETH_RATE = 0.0005; // 1 USD = 0.0005 ETH

export function usdToWei(usdAmount: number): bigint {
  // Convert USD to ETH, then to Wei (1 ETH = 10^18 Wei)
  const ethAmount = usdAmount * USD_TO_ETH_RATE;
  const weiAmount = BigInt(Math.floor(ethAmount * 1e18));
  return weiAmount;
}

export function weiToUsd(weiAmount: bigint): number {
  // Convert Wei to ETH, then to USD
  const ethAmount = Number(weiAmount) / 1e18;
  const usdAmount = ethAmount / USD_TO_ETH_RATE;
  return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
}