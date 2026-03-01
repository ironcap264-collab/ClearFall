'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { FACTORY_ADDRESS } from '@/lib/wagmi';
import { AuctionFactoryABI, DutchAuctionABI, ERC20ABI } from '@/lib/abis';

export function useTokenInfo(tokenAddress: `0x${string}` | undefined) {
  return useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: !!tokenAddress,
    },
  });
}


export function useAuctionCount() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: AuctionFactoryABI,
    functionName: 'getAuctionCount',
  });
}

export function useLatestAuctions(limit: number = 10) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: AuctionFactoryABI,
    functionName: 'getLatestAuctions',
    args: [BigInt(limit)],
  });
}

export function useCreatorAuctions(creator: `0x${string}` | undefined) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: AuctionFactoryABI,
    functionName: 'getCreatorAuctions',
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });
}

export function useAuctionInfo(auctionAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getAuctionInfo',
    query: {
      enabled: !!auctionAddress,
    },
  });
}

export function useAuctionStats(auctionAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getAuctionStats',
    query: {
      enabled: !!auctionAddress,
    },
  });
}

export function useAuctionMetadata(auctionAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!auctionAddress,
    },
  });

  // If metadata call fails (e.g. older contracts without getMetadata), return empty but don't error out visually
  if (result.isError) {
    return { ...result, data: ['', '', ''] as const, isError: false, error: null };
  }

  return result;
}

export function useCurrentPrice(auctionAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getCurrentPrice',
    query: {
      enabled: !!auctionAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
}

export function useCurrentPhase(auctionAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getCurrentPhase',
    query: {
      enabled: !!auctionAddress,
      refetchInterval: 10000,
    },
  });
}

export function useTimeRemaining(auctionAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getTimeRemaining',
    query: {
      enabled: !!auctionAddress,
      refetchInterval: 1000, // Refetch every second
    },
  });
}

export function useCommitment(
  auctionAddress: `0x${string}` | undefined,
  bidder: `0x${string}` | undefined
) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getCommitment',
    args: bidder ? [bidder] : undefined,
    query: {
      enabled: !!auctionAddress && !!bidder,
    },
  });
}

export function useVestingInfo(
  auctionAddress: `0x${string}` | undefined,
  user: `0x${string}` | undefined
) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'getVestingInfo',
    args: user ? [user] : undefined,
    query: {
      enabled: !!auctionAddress && !!user,
    },
  });
}

export function useIsWhitelisted(
  auctionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined
) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'isWhitelisted',
    args: account ? [account] : undefined,
    query: {
      enabled: !!auctionAddress && !!account,
    },
  });
}

export function useHasClaimed(
  auctionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined
) {
  return useReadContract({
    address: auctionAddress,
    abi: DutchAuctionABI,
    functionName: 'hasClaimed',
    args: account ? [account] : undefined,
    query: {
      enabled: !!auctionAddress && !!account,
    },
  });
}

// Batch fetch multiple auctions info
export function useAuctionsInfo(addresses: `0x${string}`[]) {
  const contracts = addresses.map((address) => ({
    address,
    abi: DutchAuctionABI,
    functionName: 'getAuctionInfo' as const,
  }));

  return useReadContracts({
    contracts,
    query: {
      enabled: addresses.length > 0,
    },
  });
}

export function useUserParticipatedAuctions(user: `0x${string}` | undefined) {
  const { data: latestAuctions } = useLatestAuctions(50);
  
  // Prepare contracts array separately to help TS inference
  const contracts = (latestAuctions || []).map((auctionAddr) => ({
    address: auctionAddr,
    abi: DutchAuctionABI,
    functionName: 'getCommitment',
    args: [user!] as const,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = useReadContracts({
    contracts,
    query: {
      enabled: !!user && !!latestAuctions && latestAuctions.length > 0,
    },
  }) as any;

  // Perform transformation outside the hook to completely avoid deep type instantiation issues in wagmi
  // We reconstruct the object property by property to avoid spreading a complex type
  if (!latestAuctions || !query.data) {
    return { 
        data: [] as `0x${string}`[],
        error: query.error,
        isError: query.isError,
        isPending: query.isPending,
        isLoading: query.isLoading,
        isSuccess: query.isSuccess,
        status: query.status,
        refetch: query.refetch,
        fetchStatus: query.fetchStatus, 
        isFetched: query.isFetched,     
        isFetching: query.isFetching
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = query.data as any[];

  const participatedAddresses = results
    .map((result, index) => ({
      address: latestAuctions[index],
      status: result.status as 'success' | 'failure',
      commitment: result.result as [string, bigint] | undefined
    }))
    .filter((item) => {
      const commitmentData = item.commitment;
      return item.status === 'success' && 
             commitmentData && 
             commitmentData[0] !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    })
    .map(item => item.address);

  return { 
      data: participatedAddresses,
      error: query.error,
      isError: query.isError,
      isPending: query.isPending,
      isLoading: query.isLoading,
      isSuccess: query.isSuccess,
      status: query.status,
      refetch: query.refetch,
      fetchStatus: query.fetchStatus,
      isFetched: query.isFetched,
      isFetching: query.isFetching
  };
}

export function useUserCreatedTokens(user: `0x${string}` | undefined) {
  const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS as `0x${string}`;
  
  return useReadContract({
    address: factoryAddress,
    abi: [
      {
        inputs: [{ internalType: 'address', name: 'creator', type: 'address' }],
        name: 'getCreatorTokens',
        outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
      }
    ],
    functionName: 'getCreatorTokens',
    args: user ? [user] : undefined,
    query: {
      enabled: !!user && !!factoryAddress,
    },
  });
}
