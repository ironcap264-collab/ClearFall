'use client';

import { useLatestAuctions, useAuctionCount } from '@/hooks';
import { AuctionCard } from '@/components/AuctionCard';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Shield,
  Zap,
  Users,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Lock,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const { data: count } = useAuctionCount();
  const { data: auctions, isLoading, refetch } = useLatestAuctions(6);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative py-20 text-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">Live on Polygon Amoy</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Fair Price</span>
            <br />
            <span className="text-white">Discovery Protocol</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Decentralized Dutch auctions for <span className="text-white font-medium">anything</span>.
            <br className="hidden md:block" />
            Tokens, tickets, RWAs, and digital assets.
            <br />
            <span className="text-primary-400">MEV-protected</span>, transparent, and trustless.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              <Plus className="w-5 h-5" />
              Create Auction
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/explore" className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4">
              Explore Auctions
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{count?.toString() || '0'} Auctions</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-4 h-4 text-primary-400" />
              <span>MEV Protected</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Low Gas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Auctions', value: count?.toString() || '0', icon: TrendingDown, color: 'primary' },
          { label: 'Network', value: 'Polygon', icon: Zap, color: 'yellow' },
          { label: 'Protection', value: 'Commit-Reveal', icon: Lock, color: 'green' },
          { label: 'Status', value: 'Live', icon: Clock, color: 'blue' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card group hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <p className="text-3xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Latest Auctions */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Latest Auctions</h2>
            <p className="text-gray-400">Discover ongoing and upcoming token sales</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="btn-ghost flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/explore" className="btn-secondary">
              View All
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/2 mb-3" />
                <div className="skeleton h-20 w-full mb-4" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : auctions && auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {auctions.map((address) => (
              <AuctionCard key={address} address={address} />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
              <Plus className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Auctions Yet</h3>
            <p className="text-gray-400 mb-6">Be the first to create an auction on ClearFall</p>
            <Link href="/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create First Auction
            </Link>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="card p-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            ClearFall uses a Dutch auction mechanism with commit-reveal for fair price discovery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: 1,
              title: 'Create',
              description: 'Creator deposits tokens and sets auction parameters like price range and duration',
              icon: Plus,
              color: 'primary',
            },
            {
              step: 2,
              title: 'Commit',
              description: 'Bidders submit hidden commitments with locked funds during the commit phase',
              icon: Lock,
              color: 'blue',
            },
            {
              step: 3,
              title: 'Reveal',
              description: 'Bidders reveal their bid quantities to determine the clearing price',
              icon: Shield,
              color: 'yellow',
            },
            {
              step: 4,
              title: 'Claim',
              description: 'Winners claim tokens at the uniform clearing price with excess refunded',
              icon: Sparkles,
              color: 'green',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="relative text-center group">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-700 to-transparent" />
                )}

                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                  <Icon className={`w-7 h-7 text-${item.color}-400`} />
                </div>

                <div className="text-xs font-bold text-gray-500 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield,
            title: 'MEV Protected',
            description: 'Commit-reveal mechanism prevents front-running and sandwich attacks',
            gradient: 'from-primary-500/20 to-primary-600/20',
          },
          {
            icon: Users,
            title: 'Fair Distribution',
            description: 'Uniform clearing price ensures all winners pay the same fair price',
            gradient: 'from-blue-500/20 to-cyan-500/20',
          },
          {
            icon: Zap,
            title: 'Gas Efficient',
            description: 'Optimized smart contracts on Polygon for minimal transaction costs',
            gradient: 'from-yellow-500/20 to-orange-500/20',
          },
        ].map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={i} className={`card p-8 bg-gradient-to-br ${feature.gradient} hover:scale-[1.02] transition-transform duration-300`}>
              <Icon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          );
        })}
      </section>

      {/* CTA Section */}
      <section className="card p-12 text-center bg-gradient-to-br from-primary-500/10 to-polygon/10">
        <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Token?</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Create a Dutch auction in minutes. Fair price discovery, MEV protection, and seamless distribution.
        </p>
        <Link href="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
          <Plus className="w-5 h-5" />
          Start Creating
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
