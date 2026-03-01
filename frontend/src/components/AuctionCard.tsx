'use client';

import Link from 'next/link';
import { formatEther, getPhaseLabel, getPhaseClass, formatDuration, formatAddress } from '@/lib/utils';
import { useAuctionInfo, useAuctionMetadata, useTimeRemaining } from '@/hooks';
import { Clock, Users, Coins, TrendingDown, ArrowUpRight, Flame } from 'lucide-react';
import { ipfsToHttp } from '@/lib/ipfs';

interface AuctionCardProps {
  address: `0x${string}`;
}

export function AuctionCard({ address }: AuctionCardProps) {
  const { data: info, isLoading: infoLoading } = useAuctionInfo(address);
  const { data: metadata } = useAuctionMetadata(address);
  const { data: timeRemaining } = useTimeRemaining(address);

  if (infoLoading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-3/4 mb-4" />
        <div className="skeleton h-4 w-1/2 mb-3" />
        <div className="skeleton h-24 w-full mb-4" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    );
  }

  if (!info) return null;

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
    currentPrice,
    totalDemand,
    isCleared,
    clearingPrice,
  ] = info;

  const title = metadata?.[0] || `Auction ${formatAddress(address)}`;
  const description = metadata?.[1] || 'Dutch auction for token distribution';
  const imageUri = metadata?.[2];

  // Calculate price progress
  const priceProgress = Number(startPrice) > Number(endPrice)
    ? Math.min(100, Math.max(0, ((Number(startPrice) - Number(currentPrice)) / (Number(startPrice) - Number(endPrice))) * 100))
    : 0;

  // Determine if auction is hot (has demand)
  const isHot = Number(totalDemand) > 0;

  return (
    <Link href={`/auction/${address}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-2xl">
      <div className="card card-hover p-6 cursor-pointer group h-full flex flex-col">
        {/* Header with Image/Gradient */}
        <div className="relative h-32 -mx-6 -mt-6 mb-4 rounded-t-2xl overflow-hidden">
          {imageUri ? (
            <img
              src={ipfsToHttp(imageUri)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500/30 via-primary-600/20 to-polygon/30" />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Phase Badge */}
          <div className="absolute top-4 left-4">
            <span className={getPhaseClass(phase)}>
              {getPhaseLabel(phase)}
            </span>
          </div>

          {/* Hot indicator */}
          {isHot && (
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">Hot</span>
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-lg font-bold text-white truncate drop-shadow-lg">{title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">{description}</p>

        {/* Price Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-subtle rounded-xl p-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
              <TrendingDown className="w-3 h-3" />
              Current Price
            </div>
            <p className="text-lg font-bold gradient-text">
              {formatEther(currentPrice)}
            </p>
            <p className="text-xs text-gray-500">MATIC</p>
          </div>
          <div className="glass-subtle rounded-xl p-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
              <Coins className="w-3 h-3" />
              Supply
            </div>
            <p className="text-lg font-bold text-white">
              {formatEther(totalSupply)}
            </p>
            <p className="text-xs text-gray-500">Tokens</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-1 text-gray-400" title={phase === 0 ? "Time to Start" : "Time to End"}>
            <Clock className="w-4 h-4" />
            <span className="text-xs mr-1">{phase === 0 ? 'Starts in:' : 'Ends in:'}</span>
            {timeRemaining && timeRemaining > 0
              ? formatDuration(Number(timeRemaining))
              : 'Ended'}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-4 h-4" />
            {formatEther(totalDemand)} demand
          </div>
        </div>

        {/* Price Progress */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Start: {formatEther(startPrice)} MATIC</span>
            <span>End: {formatEther(endPrice)} MATIC</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${priceProgress}%` }}
            />
          </div>
        </div>

        {/* View Link */}
        <div className="mt-4 flex items-center justify-end text-primary-400 text-sm font-medium group-hover:text-primary-300 transition-colors">
          View Details
          <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
