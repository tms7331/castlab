import { base, baseSepolia } from 'wagmi/chains';

export type NetworkType = 'baseSepolia' | 'base';

// Hardcode your network selection here
export const NETWORK: NetworkType = 'base';

// Export the chain for convenience
const NETWORK_TO_CHAIN = {
  base,
  baseSepolia
} as const;
export const CHAIN = NETWORK_TO_CHAIN[NETWORK];

export interface ContractAddresses {
  CONTRACT_ADDRESS: `0x${string}`;
  TOKEN_ADDRESS: `0x${string}`;
}

// Mapping of contract addresses per network
export const NETWORK_CONFIGS: Record<NetworkType, ContractAddresses> = {
  'baseSepolia': {
    CONTRACT_ADDRESS: '0x9f55613af6C11E0c37be58E91ACdE55A30DaB6Cc',
    TOKEN_ADDRESS: '0x33c17027bc6d1af5985F18D93377D7731bB03527',
  },
  'base': {
    CONTRACT_ADDRESS: '0xf9A677F55515f10A3B9C7dca1C11a0A1f46373ee',
    // USDC on base
    TOKEN_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
} as const;

// Selected addresses for the hardcoded NETWORK
export const CONTRACT_ADDRESS = NETWORK_CONFIGS[NETWORK].CONTRACT_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = NETWORK_CONFIGS[NETWORK].TOKEN_ADDRESS as `0x${string}`;