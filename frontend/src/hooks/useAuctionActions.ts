'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FACTORY_ADDRESS } from '@/lib/wagmi';
import { AuctionFactoryABI, DutchAuctionABI, ERC20ABI } from '@/lib/abis';

export function useCreateAuction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createAuction = (params: {
    token: `0x${string}`;
    paymentToken: `0x${string}`;
    totalSupply: bigint;
    startPrice: bigint;
    endPrice: bigint;
    reservePrice: bigint;
    startTime: bigint;
    commitDuration: bigint;
    revealDuration: bigint;
    vestingDuration: bigint;
    vestingCliff: bigint;
    nonRevealPenalty: bigint;
    minBidAmount: bigint;
    maxBidPerAddress: bigint;
    antiSnipingDuration: bigint;
    whitelistEnabled: boolean;
    metadataURI: string;
  }) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: AuctionFactoryABI,
      functionName: 'createAuction',
      args: [params],
    });
  };

  return { createAuction, hash, isPending, isConfirming, isSuccess, error };
}

export function useDepositTokens(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const depositTokens = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'depositTokens',
    });
  };

  return { depositTokens, hash, isPending, isConfirming, isSuccess, error };
}

export function useCommit(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const commit = (commitmentHash: `0x${string}`, value: bigint) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'commit',
      args: [commitmentHash],
      value,
    });
  };

  return { commit, hash, isPending, isConfirming, isSuccess, error };
}

export function useCommitWithToken(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const commitWithToken = (commitmentHash: `0x${string}`, amount: bigint) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'commitWithToken',
      args: [commitmentHash, amount],
    });
  };

  return { commitWithToken, hash, isPending, isConfirming, isSuccess, error };
}

export function useIncreaseBid(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const increaseBid = (value: bigint) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'increaseBid',
      value,
    });
  };

  return { increaseBid, hash, isPending, isConfirming, isSuccess, error };
}

export function useReveal(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const reveal = (quantity: bigint, nonce: bigint) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'reveal',
      args: [quantity, nonce],
    });
  };

  return { reveal, hash, isPending, isConfirming, isSuccess, error };
}

export function useClaimTokens(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimTokens = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'claimTokens',
    });
  };

  return { claimTokens, hash, isPending, isConfirming, isSuccess, error };
}

export function useClaimVestedTokens(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimVestedTokens = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'claimVestedTokens',
    });
  };

  return { claimVestedTokens, hash, isPending, isConfirming, isSuccess, error };
}

export function useClaimRefund(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRefund = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'claimRefund',
    });
  };

  return { claimRefund, hash, isPending, isConfirming, isSuccess, error };
}

export function useForceClear(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const forceClear = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'forceClear',
    });
  };

  return { forceClear, hash, isPending, isConfirming, isSuccess, error };
}

export function useWithdrawProceeds(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawProceeds = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'withdrawProceeds',
    });
  };

  return { withdrawProceeds, hash, isPending, isConfirming, isSuccess, error };
}

export function useCancelAuction(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelAuction = () => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'cancelAuction',
    });
  };

  return { cancelAuction, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveToken(tokenAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!tokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useAddToWhitelist(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addToWhitelist = (account: `0x${string}`) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'addToWhitelist',
      args: [account],
    });
  };

  return { addToWhitelist, hash, isPending, isConfirming, isSuccess, error };
}

export function useAddToWhitelistBatch(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addToWhitelistBatch = (accounts: `0x${string}`[]) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'addToWhitelistBatch',
      args: [accounts],
    });
  };

  return { addToWhitelistBatch, hash, isPending, isConfirming, isSuccess, error };
}

export function useUpdateMetadata(auctionAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateMetadata = (
    title: string,
    description: string,
    imageURI: string,
    metadataURI: string
  ) => {
    if (!auctionAddress) return;
    writeContract({
      address: auctionAddress,
      abi: DutchAuctionABI,
      functionName: 'updateMetadata',
      args: [title, description, imageURI, metadataURI],
    });
  };

  return { updateMetadata, hash, isPending, isConfirming, isSuccess, error };
}
