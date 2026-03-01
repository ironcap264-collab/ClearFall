import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { polygonAmoy, polygon, hardhat } from 'wagmi/chains';

// Validate environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('Warning: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.');
}

// Custom Polygon Amoy config with correct RPC and gas settings
const customPolygonAmoy = {
  ...polygonAmoy,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology'],
    },
  },
  // Ensure we don't send underpriced transactions by setting a safe minimum if needed,
  // but Wagmi usually handles this via the RPC estimation.
  // The issue described (25 Gwei vs 1.5 Gwei) suggests we need to be more aggressive with gas.
};

export const config = getDefaultConfig({
  appName: 'ClearFall Protocol',
  projectId: projectId || 'demo-project-id',
  chains: [customPolygonAmoy, polygon, hardhat],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

// Contract addresses
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 80002;

// Validate factory address
if (FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
  console.warn('Warning: NEXT_PUBLIC_FACTORY_ADDRESS is not set. Contract interactions will fail.');
}
