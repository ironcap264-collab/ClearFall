'use client';

import { useState, useMemo } from 'react';
import { useLatestAuctions, useAuctionCount } from '@/hooks';
import { AuctionCard } from '@/components/AuctionCard';
import {
  Search,
  Filter,
  RefreshCw,
  Grid,
  List,
  ChevronDown,
  Sparkles
} from 'lucide-react';

type FilterStatus = 'all' | 'active' | 'pending' | 'ended';
type SortOption = 'newest' | 'ending-soon' | 'price-low' | 'price-high';

export default function ExplorePage() {
  const { data: count } = useAuctionCount();
  const { data: auctions, isLoading, refetch } = useLatestAuctions(50);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // For now, we just return all auctions since we don't have client-side filtering
  // In production, you'd want to add more sophisticated filtering
  const filteredAuctions = useMemo(() => {
    if (!auctions) return [];
    return auctions;
  }, [auctions, searchQuery, filterStatus, sortBy]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Explore</span> Auctions
          </h1>
          <p className="text-gray-400">
            Discover {count?.toString() || '0'} auctions on ClearFall
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, token address, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="input appearance-none pr-10 min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="ended">Ended</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input appearance-none pr-10 min-w-[160px]"
              >
                <option value="newest">Newest First</option>
                <option value="ending-soon">Ending Soon</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Showing <span className="text-white font-medium">{filteredAuctions.length}</span> auctions
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Auctions Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }>
          {[...Array(9)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-32 w-full mb-4" />
              <div className="skeleton h-6 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-3" />
              <div className="skeleton h-20 w-full" />
            </div>
          ))}
        </div>
      ) : filteredAuctions.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }>
          {filteredAuctions.map((address) => (
            <AuctionCard key={address} address={address} />
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Auctions Found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Be the first to create an auction on ClearFall'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Load More (if needed) */}
      {filteredAuctions.length >= 50 && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Auctions
          </button>
        </div>
      )}
    </div>
  );
}
