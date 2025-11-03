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
    CONTRACT_ADDRESS: '0x63eB4e421f9BC6D4250Ea28e5b64f2C0Ccd880ae',
    TOKEN_ADDRESS: '0xB8a61F5d2E61121a1c476CC8C90113d5D24C48dd',
  },
  'base': {
    CONTRACT_ADDRESS: '0x180352CAAC77B58c00885Eff3b3947C385979cb9',
    // USDC on base
    TOKEN_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
} as const;

// Selected addresses for the hardcoded NETWORK
export const CONTRACT_ADDRESS = NETWORK_CONFIGS[NETWORK].CONTRACT_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = NETWORK_CONFIGS[NETWORK].TOKEN_ADDRESS as `0x${string}`;