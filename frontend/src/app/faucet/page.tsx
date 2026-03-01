'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Coins, Loader2, ArrowRight, ExternalLink, ShieldCheck, Plus as PlusIcon, Copy, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserCreatedTokens } from '@/hooks';
import { ERC20ABI } from '@/lib/abis';

// MockERC20 ABI (minimal for minting and balance)
const MOCK_TOKEN_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lastMintTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Address of the deployed MockERC20 on Amoy
const MOCK_TOKEN_ADDRESS = '0xb9CD1B4d629C80BF77A15C9c7BbA61E7FC570f0C';

function TokenCard({ address, userAddress }: { address: `0x${string}`; userAddress: `0x${string}` }) {
  const { data: results } = useReadContracts({
    contracts: [
      {
        address,
        abi: ERC20ABI,
        functionName: 'name',
      },
      {
        address,
        abi: ERC20ABI,
        functionName: 'symbol',
      },
      {
        address,
        abi: ERC20ABI,
        functionName: 'decimals',
      },
      {
        address,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
    ],
  });

  const [copied, setCopied] = useState(false);

  if (!results) return <div className="skeleton h-20 w-full" />;

  const name = results[0]?.result as string;
  const symbol = results[1]?.result as string;
  const decimals = results[2]?.result as number;
  const balance = results[3]?.result as bigint;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const addTokenToWallet = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol: symbol || 'TOKEN',
            decimals: decimals || 18,
          },
        },
      });
      toast.success('Token added to wallet!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add token');
    }
  };

  return (
    <div className="card p-6 hover:bg-white/5 transition-all duration-300 group hover:scale-[1.02] border border-white/5 hover:border-primary-500/20 shadow-lg hover:shadow-primary-500/10">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-primary-400 font-bold text-lg shadow-inner shadow-white/10">
              {symbol ? symbol.slice(0, 2).toUpperCase() : '??'}
            </div>
            <div>
               <h4 className="font-bold text-white text-lg">{name || 'Unknown Token'}</h4>
               <p className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-0.5 rounded-full inline-block mt-1">
                 {symbol}
               </p>
            </div>
          </div>
          
          <button 
            onClick={addTokenToWallet}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-primary-400 transition-colors"
            title="Add to Wallet"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-auto space-y-4">
           <div className="p-3 bg-black/20 rounded-xl border border-white/5">
             <p className="text-xs text-gray-500 mb-1">Your Balance</p>
             <p className="text-xl font-bold font-mono gradient-text">
               {balance !== undefined && decimals ? formatEther(balance) : '0'}
             </p>
           </div>

           <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                 {address.slice(0, 6)}...{address.slice(-4)}
                 <button onClick={copyAddress} className="hover:text-white transition-colors">
                   {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                 </button>
              </div>
              <a
                href={`https://amoy.polygonscan.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors"
              >
                View
                <ExternalLink className="w-3 h-3" />
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tokens created by user
  const { data: userTokens, isLoading: isLoadingTokens } = useUserCreatedTokens(address);

  // Write Hook for Minting
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  // Wait for Transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read Hook for Balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Read Last Mint Time
  const { data: lastMintTimeData, refetch: refetchLastMint } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: 'lastMintTime',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (lastMintTimeData === undefined) return;

    const lastMint = Number(lastMintTimeData);
    if (lastMint === 0) {
       setTimeRemaining(null);
       return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const nextMint = lastMint + 86400; // 24 hours
      const diff = nextMint - now;

      if (diff <= 0) {
        setTimeRemaining(null);
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastMintTimeData]);

  const handleMint = () => {
    if (!address) return;
    
    try {
      writeContract({
        address: MOCK_TOKEN_ADDRESS,
        abi: MOCK_TOKEN_ABI,
        functionName: 'mint',
        args: [address, parseEther('1000')],
      });
      toast.success('Mint transaction sent!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send transaction');
    }
  };

  // Refetch balance after successful mint
  if (isSuccess) {
    refetchBalance();
    refetchLastMint();
  }

  const addTokenToWallet = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: MOCK_TOKEN_ADDRESS,
            symbol: 'CFT',
            decimals: 18,
            image: 'https://raw.githubusercontent.com/OffchainLabs/arbitrum-token-list/master/assets/0x0000000000000000000000000000000000000000/logo.png', // Placeholder
          },
        },
      });
      toast.success('Token added to wallet!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add token');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500/20 to-polygon/20 flex items-center justify-center ring-1 ring-white/10">
          <Coins className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-4xl font-bold font-display">
          <span className="gradient-text">Testnet</span> Faucet & Assets
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Manage your test tokens and assets for ClearFall Protocol.
        </p>
      </div>

      {!mounted ? null : !isConnected ? (
        <div className="card p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-primary-400 mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">
            You need to connect your wallet to view your assets.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* User Tokens Column - Full Width */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-green-400" />
                   My Created Assets
                </h2>
                <div className="flex items-center gap-2">
                   <div className="text-xs bg-primary-500/10 text-primary-400 px-3 py-1 rounded-full border border-primary-500/20 flex items-center gap-2">
                      <Coins className="w-3 h-3" />
                      Testnet Faucet Available
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingTokens ? (
                   [...Array(4)].map((_, i) => (
                      <div key={i} className="card p-4">
                         <div className="flex items-center gap-3">
                            <div className="skeleton w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                               <div className="skeleton h-4 w-1/3" />
                               <div className="skeleton h-3 w-1/2" />
                            </div>
                         </div>
                      </div>
                   ))
                ) : userTokens && userTokens.length > 0 ? (
                   userTokens.map((tokenAddr: `0x${string}`) => (
                      <TokenCard key={tokenAddr} address={tokenAddr} userAddress={address!} />
                   ))
                ) : (
                   <div className="col-span-full card p-12 text-center bg-white/5 border-dashed border-white/10">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Coins className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Assets Created</h3>
                      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                        You haven't created any custom tokens yet. Launch your own token to start building your ecosystem.
                      </p>
                      <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                         <PlusIcon className="w-4 h-4" />
                         Create New Token
                      </Link>
                   </div>
                )}
             </div>
          </div>

          {/* Collapsible/Hidden Platform Faucet */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors p-2">
               <Coins className="w-4 h-4" />
               <span className="text-sm font-medium">Need Testnet CFT?</span>
               <div className="h-px bg-white/10 flex-1 ml-2" />
            </summary>
            
            <div className="mt-4 card p-6 relative overflow-hidden bg-white/5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                   <h3 className="font-bold text-lg mb-1">Get ClearFall Test Tokens</h3>
                   <p className="text-sm text-gray-400">Mint free CFT to test the auction mechanism without creating your own token.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl">
                   <div className="flex flex-col text-right mr-4 border-r border-white/10 pr-4">
                      <span className="text-xs text-gray-400">Current Wallet Balance</span>
                      <span className="font-mono font-bold text-white">
                        {balance ? formatEther(balance) : '0'} CFT
                      </span>
                   </div>

                   <div className="flex flex-col items-end mr-2">
                     <span className="font-mono text-xl font-bold">1000</span>
                     <span className="text-xs text-gray-500">CFT</span>
                   </div>
                   
                   {timeRemaining ? (
                     <div
                        className="btn-ghost text-sm py-2 px-4 whitespace-nowrap opacity-50 cursor-not-allowed flex items-center gap-2 border border-white/10 rounded-lg"
                        title="Cooldown Active"
                     >
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-xs">{timeRemaining}</span>
                     </div>
                   ) : (
                     <button
                        onClick={handleMint}
                        disabled={isPending || isConfirming}
                        className="btn-secondary text-sm py-2 px-4 whitespace-nowrap"
                     >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mint Now'}
                     </button>
                   )}
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
