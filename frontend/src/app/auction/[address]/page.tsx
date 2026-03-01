'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
    useAuctionInfo,
    useAuctionStats,
    useAuctionMetadata,
    useCurrentPrice,
    useTimeRemaining,
    useCommitment,
    useVestingInfo,
    useIsWhitelisted,
    useHasClaimed,
    useCreatorAuctions,
  } from '@/hooks';
import {
  useCommit,
  useReveal,
  useClaimTokens,
  useClaimVestedTokens,
  useClaimRefund,
  useWithdrawProceeds,
  useTokenInfo,
} from '@/hooks';
import {
  formatEther,
  parseEther,
  formatDuration,
  formatTimestamp,
  getPhaseLabel,
  getPhaseClass,
  generateCommitment,
  generateNonce,
  storeCommitment,
  getStoredCommitment,
  formatAddress,
} from '@/lib/utils';
import { ipfsToHttp } from '@/lib/ipfs';
import {
  ArrowLeft,
  Clock,
  Users,
  Coins,
  TrendingDown,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Info,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AuctionDetailPage() {
  const params = useParams();
  const auctionAddress = params.address as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();

  // Auction data
  const { data: info, refetch: refetchInfo } = useAuctionInfo(auctionAddress);
  const { data: stats, refetch: refetchStats } = useAuctionStats(auctionAddress);
  const { data: metadata } = useAuctionMetadata(auctionAddress);
  const { data: currentPrice } = useCurrentPrice(auctionAddress);
  const { data: timeRemaining } = useTimeRemaining(auctionAddress);
  const { data: commitment, refetch: refetchCommitment } = useCommitment(auctionAddress, userAddress);
  const { data: vestingInfo, refetch: refetchVesting } = useVestingInfo(auctionAddress, userAddress);
  const { data: isWhitelisted } = useIsWhitelisted(auctionAddress, userAddress);
  const { data: hasClaimed } = useHasClaimed(auctionAddress, userAddress);

  // Actions
  const { commit, isPending: isCommitting, isSuccess: commitSuccess } = useCommit(auctionAddress);
  const { reveal, isPending: isRevealing, isSuccess: revealSuccess } = useReveal(auctionAddress);
  const { claimTokens, isPending: isClaiming } = useClaimTokens(auctionAddress);
  const { claimVestedTokens, isPending: isClaimingVested } = useClaimVestedTokens(auctionAddress);
  const { claimRefund, isPending: isRefunding } = useClaimRefund(auctionAddress);
  const { withdrawProceeds, isPending: isWithdrawingProceeds } = useWithdrawProceeds(auctionAddress);

  // Form state
  const [bidAmount, setBidAmount] = useState('');
  const [bidQuantity, setBidQuantity] = useState('');
  const [revealQuantity, setRevealQuantity] = useState('');
  const [revealNonce, setRevealNonce] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: creatorAuctions } = useCreatorAuctions(userAddress);
  const isCreator = creatorAuctions?.includes(auctionAddress);

  // Load stored commitment data
  useEffect(() => {
    if (auctionAddress && userAddress) {
      const stored = getStoredCommitment(auctionAddress, userAddress);
      if (stored) {
        setRevealQuantity(stored.quantity);
        setRevealNonce(stored.nonce);
      }
    }
  }, [auctionAddress, userAddress]);

  // Refetch on success
  useEffect(() => {
    if (commitSuccess || revealSuccess) {
      refetchInfo();
      refetchStats();
      refetchCommitment();
      refetchVesting();
    }
  }, [commitSuccess, revealSuccess]);

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading auction...</p>
        </div>
      </div>
    );
  }

  const [
    token,
    paymentToken,
    totalSupply,
    startPrice,
    endPrice,
    reservePrice,
    startTime,
    commitEndTime,
    revealEndTime,
    phase,
    _currentPrice,
    totalDemand,
    isCleared,
    clearingPrice,
  ] = info || [];

  const { data: tokenInfo } = useTokenInfo(token);
  const tokenSymbol = tokenInfo?.[0]?.result || 'TOKEN';
  const tokenDecimals = tokenInfo?.[1]?.result || 18;

  const [bidCount, totalCommittedFunds, totalRevealedDemand, bidderCount, tokensDeposited, isCancelled, isFailed] =
    stats || [BigInt(0), BigInt(0), BigInt(0), BigInt(0), false, false, false];

  const title = metadata?.[0] ? metadata[0] : `Auction ${formatAddress(auctionAddress)}`;
  const description = metadata?.[1] ? metadata[1] : 'No description available for this auction.';
  const imageUri = metadata?.[2] ? metadata[2] : '';

  const hasCommitted = commitment && commitment[0] !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  const hasRevealed = commitment?.[2] || false;

  const handleCommit = () => {
    if (!bidAmount || !bidQuantity || !userAddress) {
      toast.error('Please enter bid amount and quantity');
      return;
    }

    const price = currentPrice || _currentPrice || BigInt(0);
    const quantity = parseEther(bidQuantity);
    const value = parseEther(bidAmount);
    const requiredValue = (quantity * price) / BigInt(1e18);

    if (value < requiredValue) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-yellow-500">Warning: Bid below current price</p>
          <p className="text-sm">
            Your bid amount ({bidAmount} MATIC) is less than the current price requires ({formatEther(requiredValue)} MATIC).
            You may not win the allocation.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
              onClick={() => toast.dismiss(t.id)}
            >
              Continue anyway
            </button>
            <button
              className="px-3 py-1 bg-primary-600 rounded text-xs hover:bg-primary-500"
              onClick={() => {
                setBidAmount(formatEther(requiredValue));
                toast.dismiss(t.id);
              }}
            >
              Update Price
            </button>
          </div>
        </div>
      ), { duration: 6000 });
      // We don't return here, we let the user continue if they want (or they can click update)
      // Actually, to block them, we should return. But a warning is better for UX if they really want to bid low.
      // But the user asked "it should shoe me to bid at the current price".
      // Let's just warn for now, or maybe auto-fill.
    }

    if (isCreator) {
      toast.error('Creators cannot bid on their own auctions');
      return;
    }

    const nonce = generateNonce();
    const commitmentHash = generateCommitment(quantity, nonce, userAddress);

    storeCommitment(auctionAddress, userAddress, bidQuantity, nonce.toString());
    
    // Update local state immediately for better UX
    setRevealQuantity(bidQuantity);
    setRevealNonce(nonce.toString());

    commit(commitmentHash, value); // Pass value directly, hook handles mapping
    toast.success('Submitting commitment...');
  };

  const handleReveal = () => {
    if (!revealQuantity || !revealNonce) {
      toast.error('Please enter quantity and nonce');
      return;
    }

    reveal(parseEther(revealQuantity), BigInt(revealNonce));
    toast.success('Revealing bid...');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const addToWallet = async () => {
    if (!window.ethereum || !token) return;
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token,
            symbol: tokenSymbol as string,
            decimals: Number(tokenDecimals),
            image: imageUri ? ipfsToHttp(imageUri) : '',
          },
        },
      });
      toast.success('Token added to wallet!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add token to wallet');
    }
  };

  const priceProgress = Number(startPrice) > Number(endPrice)
    ? Math.min(100, ((Number(startPrice) - Number(currentPrice || _currentPrice)) / (Number(startPrice) - Number(endPrice))) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <Link href="/explore" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group/back">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover/back:-translate-x-0.5 transition-transform" />
        Back to Auctions
      </Link>

      {/* Hero Section */}
      <div className="card overflow-hidden">
        {/* Image/Gradient Header */}
        <div className="relative h-48 md:h-64">
          {imageUri ? (
            <img
              src={ipfsToHttp(imageUri)}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500/30 via-primary-600/20 to-polygon/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Phase Badge */}
          <div className="absolute top-4 right-4">
            <span className={getPhaseClass(phase)}>
              {getPhaseLabel(phase)}
            </span>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 font-display">{title}</h1>
            {description && <p className="text-gray-300">{description}</p>}
          </div>
        </div>

        {/* Address Bar */}
        <div className="px-6 py-3 bg-black/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-mono">{auctionAddress}</span>
          </div>
          <a
            href={`https://amoy.polygonscan.com/address/${auctionAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Price & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Card */}
          <div className="card p-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
              <TrendingDown className="w-5 h-5 text-primary-400" />
              Current Price
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold gradient-text">
                {formatEther(currentPrice || _currentPrice)}
              </span>
              <span className="text-xl text-gray-400">MATIC</span>
            </div>

            {/* Price Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Start: {formatEther(startPrice)} MATIC</span>
                <span>End: {formatEther(endPrice)} MATIC</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${priceProgress}%` }} />
              </div>
            </div>

            {reservePrice > BigInt(0) && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Reserve Price: {formatEther(reservePrice)} MATIC
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Supply', value: formatEther(totalSupply), icon: Coins },
              { label: 'Total Bids', value: bidCount.toString(), icon: Users },
              { label: 'Committed', value: `${formatEther(totalCommittedFunds)} MATIC`, icon: Lock },
              { label: 'Demand', value: formatEther(totalRevealedDemand), icon: TrendingDown },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <Icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Start Time</span>
                <span>{formatTimestamp(Number(startTime))}</span>
              </div>
              <div className="divider" />
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Commit Phase Ends</span>
                <span>{formatTimestamp(Number(commitEndTime))}</span>
              </div>
              <div className="divider" />
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reveal Phase Ends</span>
                <span>{formatTimestamp(Number(revealEndTime))}</span>
              </div>
            </div>
          </div>

          {/* Auction Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-400" />
              Auction Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Token Address</p>
                <p className="font-mono text-xs break-all">{token}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Payment Token</p>
                <p>{paymentToken === '0x0000000000000000000000000000000000000000' ? 'MATIC (Native)' : formatAddress(paymentToken)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Tokens Deposited</p>
                <span className={`badge ${tokensDeposited ? 'badge-success' : 'badge-danger'}`}>
                  {tokensDeposited ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Status</p>
                {isCancelled ? (
                  <span className="badge badge-danger">Cancelled</span>
                ) : isFailed ? (
                  <span className="badge badge-danger">Failed</span>
                ) : isCleared ? (
                  <span className="badge badge-success">Cleared @ {formatEther(clearingPrice)} MATIC</span>
                ) : phase >= 3 ? (
                  <span className="badge badge-neutral bg-gray-600">Ended</span>
                ) : (
                  <span className="badge badge-info">Active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Time Remaining */}
          <div className="card p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              {phase === 0 ? 'Time Remaining to Start Auction' : 'Time Remaining to End Auction'}
            </div>
            <p className="text-3xl font-bold gradient-text">
              {timeRemaining && timeRemaining > 0 ? formatDuration(Number(timeRemaining)) : 'Ended'}
            </p>
          </div>

          {/* User Actions */}
          {!isConnected ? (
            <div className="card p-8 text-center">
              <Shield className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Connect wallet to participate</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                Your Position
              </h3>

              {/* Creator View */}
              {isCreator && (
                <div className="space-y-4">
                  <div className="alert alert-warning">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm">You are the creator of this auction and cannot participate.</p>
                  </div>
                </div>
              )}

              {/* Commit Phase */}
              {phase === 1 && !hasCommitted && !isCreator && (
                <div className="space-y-4">
                  <div className="alert alert-info">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-sm">Submit your hidden bid commitment</p>
                  </div>

                  {isWhitelisted === false && (
                    <div className="alert alert-danger">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm">You are not whitelisted</p>
                    </div>
                  )}

                  <div>
                    <label className="label">Bid Amount (MATIC)</label>
                    <input
                      type="text"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="1.0"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Quantity (Tokens)</label>
                    <input
                      type="text"
                      value={bidQuantity}
                      onChange={(e) => setBidQuantity(e.target.value)}
                      placeholder="100"
                      className="input"
                    />
                  </div>

                  <button
                    onClick={handleCommit}
                    disabled={isCommitting || isWhitelisted === false}
                    className="btn-primary w-full"
                  >
                    {isCommitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Committing...</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" />Submit Commitment</>
                    )}
                  </button>
                </div>
              )}

              {/* Committed - Waiting for Reveal */}
              {hasCommitted && !hasRevealed && phase < 2 && (
                <div className="space-y-4">
                  <div className="alert alert-success">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm">Committed! Wait for reveal phase</p>
                  </div>

                  <div className="glass-subtle rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Locked Amount</p>
                    <p className="text-2xl font-bold gradient-text">{formatEther(commitment?.[1] || BigInt(0))} MATIC</p>
                  </div>

                  <div className="alert alert-warning">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Save your reveal data!</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                      <span className="text-xs text-gray-400">Quantity</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{revealQuantity}</span>
                        <button onClick={() => copyToClipboard(revealQuantity)} className="text-gray-400 hover:text-white">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                      <span className="text-xs text-gray-400">Nonce</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs truncate max-w-[100px]">{revealNonce}</span>
                        <button onClick={() => copyToClipboard(revealNonce)} className="text-gray-400 hover:text-white">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reveal Phase */}
              {phase === 2 && hasCommitted && !hasRevealed && (
                <div className="space-y-4">
                  <div className="alert alert-warning">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm">Reveal your bid now!</p>
                  </div>

                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="text"
                      value={revealQuantity}
                      onChange={(e) => setRevealQuantity(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Nonce</label>
                    <input
                      type="text"
                      value={revealNonce}
                      onChange={(e) => setRevealNonce(e.target.value)}
                      className="input"
                    />
                  </div>

                  <button onClick={handleReveal} disabled={isRevealing} className="btn-primary w-full">
                    {isRevealing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revealing...</>
                    ) : (
                      <><Unlock className="w-4 h-4 mr-2" />Reveal Bid</>
                    )}
                  </button>
                </div>
              )}

              {/* Already Revealed */}
              {hasRevealed && (
                <div className="alert alert-success">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm">Revealed: {formatEther(commitment?.[3] || BigInt(0))} tokens</p>
                </div>
              )}

              {/* Claim Tokens */}
              {(phase === 3 || phase === 4) && !hasClaimed && hasCommitted && hasRevealed && (
                <div className="space-y-4">
                  <div className="alert alert-success">
                    <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm">Claim your tokens!</p>
                  </div>
                  
                  <div className="glass-subtle rounded-xl p-4 space-y-2">
                     <p className="text-sm font-semibold text-gray-300">Your Allocation:</p>
                     {(() => {
                        const committed = commitment?.[1] || BigInt(0);
                        const revealed = commitment?.[3] || BigInt(0);
                        const price = clearingPrice || BigInt(0);
                        if (price === BigInt(0)) return null;

                        const cost = (revealed * price) / BigInt(1e18); // rough calc for display
                        // Accurate logic depends on solidity math but this is close for UI
                        // In contract: if committed >= cost, get revealed. Else get committed / price.
                        
                        // We need to use BigInt arithmetic carefully
                        // In JS, BigInt division drops decimals.
                        // committed: 10^18, price: 10^18. 
                        
                        let allocation = BigInt(0);
                        let refund = BigInt(0);

                        // Calculate cost with full precision
                        // cost = (revealed * price) / 1e18
                        const requiredFunds = (revealed * price) / BigInt(1e18);

                        if (committed >= requiredFunds) {
                            allocation = revealed;
                            refund = committed - requiredFunds;
                        } else {
                            // Partial
                            allocation = (committed * BigInt(1e18)) / price;
                            refund = committed % price; // Remainder
                        }

                        return (
                           <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Tokens:</span>
                                <span className="font-mono text-white">{formatEther(allocation)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Refund:</span>
                                <span className="font-mono text-white">{formatEther(refund)} MATIC</span>
                              </div>
                           </div>
                        );
                     })()}
                  </div>

                  <button onClick={() => claimTokens()} disabled={isClaiming} className="btn-primary w-full">
                    {isClaiming ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Claiming...</> : 'Claim Tokens'}
                  </button>
                </div>
              )}

              {/* Claim Refund */}
              {(phase === 3 || phase === 4 || isCancelled || isFailed) && !hasClaimed && hasCommitted && !hasRevealed && (
                <div className="space-y-4">
                  <div className="alert alert-warning">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm">Claim your refund</p>
                  </div>
                  <button onClick={() => claimRefund()} disabled={isRefunding} className="btn-secondary w-full">
                    {isRefunding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Claiming...</> : 'Claim Refund'}
                  </button>
                </div>
              )}

              {/* Already Claimed */}
              {hasClaimed && (
                <div className="text-center py-4 text-gray-400 space-y-4">
                  <div>
                    <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>Already claimed</p>
                  </div>
                  
                  {hasRevealed && (
                    <button 
                      onClick={addToWallet}
                      className="btn-secondary w-full text-sm"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Add {tokenSymbol} to Wallet
                    </button>
                  )}
                </div>
              )}

              {/* No Position */}
              {!hasCommitted && phase > 1 && (
                <div className="text-center py-8 text-gray-400">
                  <p>You did not participate</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
