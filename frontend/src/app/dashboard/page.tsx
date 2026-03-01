'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCreatorAuctions, useAuctionInfo, useAuctionMetadata, useAuctionStats, useUserParticipatedAuctions, useUserCreatedTokens } from '@/hooks';
import {
  useDepositTokens,
  useCancelAuction,
  useWithdrawProceeds,
  useAddToWhitelistBatch,
  useApproveToken,
} from '@/hooks';
import { ERC20ABI } from '@/lib/abis';
import { formatAddress, formatEther, getPhaseLabel, getPhaseClass } from '@/lib/utils';
import {
  Plus,
  Settings,
  Trash2,
  Download,
  Users,
  Loader2,
  LayoutDashboard,
  TrendingUp,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Coins,
  Copy,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

function TokenListCard({ userAddress }: { userAddress: `0x${string}` }) {
  const { data: tokens, isLoading } = useUserCreatedTokens(userAddress);

  if (isLoading) return <div className="skeleton h-20 w-full" />;
  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="card p-6 mb-8 bg-gradient-to-br from-primary-900/20 to-purple-900/20 border-primary-500/20">
      <h3 className="font-bold mb-4 flex items-center gap-2 font-display">
        <Coins className="w-5 h-5 text-primary-400" />
        My Deployed Tokens
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token: `0x${string}`) => (
          <div key={token} className="glass-subtle p-3 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-mono text-primary-300">
                ERC20
              </div>
              <div>
                <p className="text-xs text-gray-500 font-mono">Token Address</p>
                <p className="text-sm font-mono text-white truncate w-32">{formatAddress(token)}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(token);
                toast.success('Address copied!');
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Copy Address"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuctionManageCard({ address }: { address: `0x${string}` }) {
  const { data: info } = useAuctionInfo(address);
  const { data: metadata } = useAuctionMetadata(address);
  const { data: stats } = useAuctionStats(address);

  const { depositTokens, isPending: isDepositing } = useDepositTokens(address);
  const { cancelAuction, isPending: isCancelling } = useCancelAuction(address);
  const { withdrawProceeds, isPending: isWithdrawing } = useWithdrawProceeds(address);

  const [showSettings, setShowSettings] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState('');

  const { addToWhitelistBatch, isPending: isAddingWhitelist } = useAddToWhitelistBatch(address);

  // Check allowance for deposit
  const { address: userAddress } = useAccount();
  const token = info?.[0];
  const totalSupply = info?.[2];

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: userAddress && address ? [userAddress, address] : undefined,
    query: {
      enabled: !!userAddress && !!token && !!address,
    }
  });

  const { approve, isPending: isApproving } = useApproveToken(token);

  // Refetch allowance after approval or deposit
  useEffect(() => {
    if (!isApproving && !isDepositing) {
      refetchAllowance();
    }
  }, [isApproving, isDepositing, refetchAllowance]);

  if (!info || !stats) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-3/4 mb-4" />
        <div className="skeleton h-4 w-1/2 mb-3" />
        <div className="skeleton h-20 w-full" />
      </div>
    );
  }

  const [
    _token, // Renamed to avoid conflict
    paymentToken,
    _totalSupply, // Renamed to avoid conflict
    startPrice,
    endPrice,
    reservePrice,
    startTime,
    commitEndTime,
    revealEndTime,
    phase,
    currentPrice,
    totalDemand,
    isCleared,
    clearingPrice,
  ] = info;

  const [bidCount, totalCommittedFunds, totalRevealedDemand, bidderCount, tokensDeposited, isCancelled, isFailed] = stats;

  const isApproved = allowance && totalSupply ? allowance >= totalSupply : false;

  const handleDepositAction = () => {
    if (!isApproved) {
      if (address && totalSupply) {
        approve(address, totalSupply);
      }
    } else {
      depositTokens();
    }
  };

  const title = metadata?.[0] || `Auction ${formatAddress(address)}`;

  const handleAddWhitelist = () => {
    const addresses = whitelistAddresses
      .split(/[\n,]/)
      .map((a) => a.trim())
      .filter((a) => a.startsWith('0x')) as `0x${string}`[];

    if (addresses.length === 0) {
      toast.error('No valid addresses found');
      return;
    }

    addToWhitelistBatch(addresses);
    toast.success(`Adding ${addresses.length} addresses to whitelist...`);
  };

  return (
    <div className="card card-hover overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/auction/${address}`}
              className="text-lg font-semibold hover:text-primary-400 transition-colors flex items-center gap-2"
            >
              {title}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100" />
            </Link>
            <p className="text-xs text-gray-500 font-mono mt-1">{formatAddress(address)}</p>
          </div>
          <span className={getPhaseClass(phase)}>
            {getPhaseLabel(phase)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Supply', value: formatEther(_totalSupply) },
            { label: 'Bids', value: bidCount.toString() },
            { label: 'Committed', value: `${formatEther(totalCommittedFunds)}` },
          ].map((stat, i) => (
            <div key={i} className="glass-subtle rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Token Deposit Alert */}
      {!tokensDeposited && !isCancelled && (
        <div className="mx-6 mb-4">
          <div className="alert alert-warning">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Tokens not deposited</p>
              <p className="text-xs text-yellow-300/70">
                {isApproved ? 'Deposit tokens to activate' : 'Approve tokens first'}
              </p>
            </div>
            <button
              onClick={handleDepositAction}
              disabled={isDepositing || isApproving}
              className="btn-primary text-sm py-2 px-4"
            >
              {isDepositing || isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isApproved ? (
                'Deposit'
              ) : (
                'Approve'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cleared Status */}
      {isCleared && !isCancelled && !isFailed && (
        <div className="mx-6 mb-4">
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Auction Cleared!</p>
              <p className="text-xs text-green-300/70">@ {formatEther(clearingPrice)} MATIC</p>
            </div>
            <button
              onClick={() => withdrawProceeds()}
              disabled={isWithdrawing}
              className="btn-primary text-sm py-2 px-4"
            >
              {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Withdraw'}
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 bg-black/20 flex items-center gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-ghost flex items-center gap-2 text-sm flex-1 justify-center"
        >
          <Settings className="w-4 h-4" />
          Settings
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <Link href={`/auction/${address}`} className="btn-secondary text-sm py-2 flex-1 text-center">
          View Details
        </Link>

        {phase === 0 && Number(bidCount) === 0 && !isCancelled && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel this auction?')) {
                cancelAuction();
                toast.success('Cancelling auction...');
              }
            }}
            disabled={isCancelling}
            className="btn-ghost text-red-400 hover:text-red-300 p-2"
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 border-t border-white/5 space-y-6 animate-fade-in">
          {/* Whitelist */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              Add to Whitelist
            </h4>
            <textarea
              placeholder="Enter addresses (one per line or comma-separated)"
              value={whitelistAddresses}
              onChange={(e) => setWhitelistAddresses(e.target.value)}
              className="input text-sm h-24 resize-none"
            />
            <button
              onClick={handleAddWhitelist}
              disabled={isAddingWhitelist}
              className="btn-secondary text-sm w-full mt-3 flex items-center justify-center gap-2"
            >
              {isAddingWhitelist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Add to Whitelist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuctionParticipationCard({ address }: { address: `0x${string}` }) {
  const { data: info } = useAuctionInfo(address);
  const { data: metadata } = useAuctionMetadata(address);
  const { data: stats } = useAuctionStats(address);
  
  if (!info || !stats) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-3/4 mb-4" />
        <div className="skeleton h-4 w-1/2 mb-3" />
        <div className="skeleton h-20 w-full" />
      </div>
    );
  }

  const [
    _token,
    paymentToken,
    _totalSupply,
    startPrice,
    endPrice,
    reservePrice,
    startTime,
    commitEndTime,
    revealEndTime,
    phase,
    currentPrice,
    totalDemand,
    isCleared,
    clearingPrice,
  ] = info;

  const title = metadata?.[0] || `Auction ${formatAddress(address)}`;

  return (
    <div className="card card-hover overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/auction/${address}`}
              className="text-lg font-semibold hover:text-primary-400 transition-colors flex items-center gap-2"
            >
              {title}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100" />
            </Link>
            <p className="text-xs text-gray-500 font-mono mt-1">{formatAddress(address)}</p>
          </div>
          <span className={getPhaseClass(phase)}>
            {getPhaseLabel(phase)}
          </span>
        </div>

        <div className="glass-subtle rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Status</span>
            <span className="text-sm font-medium">
              {isCleared ? 'Cleared' : 'Active'}
            </span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-sm text-gray-400">Current Price</span>
             <span className="text-sm font-bold gradient-text">{formatEther(currentPrice)} MATIC</span>
          </div>
        </div>

        <Link href={`/auction/${address}`} className="btn-secondary w-full text-center block">
          View My Bid
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: creatorAuctions, isLoading: isLoadingCreator } = useCreatorAuctions(address);
  const { data: participatedAuctions, isLoading: isLoadingParticipated } = useUserParticipatedAuctions(address);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
            <LayoutDashboard className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 font-display">Dashboard</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to manage your auctions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 font-display">
            <span className="gradient-text">My</span> Dashboard
          </h1>
          <p className="text-gray-400">Manage your auctions and track performance</p>
        </div>
        <Link href="/create" className="btn-primary inline-flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          Create Auction
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card hover:scale-[1.02] transition-transform duration-300">
          <TrendingUp className="w-8 h-8 text-primary-400 mx-auto mb-3" />
          <p className="text-4xl font-bold gradient-text mb-1">{creatorAuctions?.length || 0}</p>
          <p className="text-gray-400">Created Auctions</p>
        </div>
        <div className="stat-card hover:scale-[1.02] transition-transform duration-300">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <p className="text-4xl font-bold text-blue-400 mb-1">
            {participatedAuctions?.length || 0}
          </p>
          <p className="text-gray-400">Participated</p>
        </div>
        <div className="stat-card hover:scale-[1.02] transition-transform duration-300">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <p className="text-4xl font-bold text-green-400 mb-1">0</p>
          <p className="text-gray-400">Won</p>
        </div>
      </div>

      {/* My Deployed Tokens */}
      {address && <TokenListCard userAddress={address} />}

      {/* Participated Auctions Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 font-display">Participated Auctions</h2>
        {isLoadingParticipated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-6">
                 <div className="skeleton h-6 w-3/4 mb-4" />
                 <div className="skeleton h-20 w-full" />
              </div>
            ))}
          </div>
        ) : participatedAuctions && participatedAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {participatedAuctions.map((auctionAddress: `0x${string}`) => (
              <AuctionParticipationCard key={auctionAddress} address={auctionAddress} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center bg-black/20 border-dashed border-white/10">
            <p className="text-gray-400">You haven't participated in any auctions yet.</p>
            <Link href="/explore" className="text-primary-400 hover:underline mt-2 inline-block">
              Explore Auctions
            </Link>
          </div>
        )}
      </div>

      {/* My Created Auctions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 font-display">Created Auctions</h2>

        {isLoadingCreator ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/2 mb-3" />
                <div className="skeleton h-20 w-full" />
              </div>
            ))}
          </div>
        ) : creatorAuctions && creatorAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creatorAuctions.map((auctionAddress) => (
              <AuctionManageCard key={auctionAddress} address={auctionAddress} />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
              <Plus className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Auctions Yet</h3>
            <p className="text-gray-400 mb-6">Create your first auction to get started</p>
            <Link href="/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Auction
            </Link>
          </div>
        )}
      </div>

      {/* Quick Guide */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-6 font-display">Quick Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: 'Create',
              description: 'Set your token, prices, and timing parameters',
              icon: Plus,
            },
            {
              step: 2,
              title: 'Deposit',
              description: 'Approve and deposit tokens to the auction vault',
              icon: Download,
            },
            {
              step: 3,
              title: 'Configure',
              description: 'Add metadata and whitelist addresses',
              icon: Settings,
            },
            {
              step: 4,
              title: 'Withdraw',
              description: 'Collect proceeds after auction clears',
              icon: CheckCircle,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-400" />
                </div>
                <div className="text-xs font-bold text-primary-400 mb-1">STEP {item.step}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
