import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { GlobalAIHelper } from '@/components/GlobalAIHelper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: 'ClearFall Protocol | Decentralized Dutch Auctions',
  description: 'The premier decentralized Dutch auction platform for fair token distribution on Polygon. Featuring commit-reveal mechanism for MEV protection.',
  keywords: ['dutch auction', 'token sale', 'polygon', 'defi', 'crypto', 'blockchain', 'decentralized'],
  authors: [{ name: 'ClearFall Team' }],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'ClearFall Protocol | Decentralized Dutch Auctions',
    description: 'Fair token distribution through trustless Dutch auctions on Polygon',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClearFall Protocol',
    description: 'Decentralized Dutch Auctions on Polygon',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col relative">
            {/* Floating Orbs Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="orb orb-1" />
              <div className="orb orb-2" />
              <div className="orb orb-3" />
            </div>

            {/* Main Content */}
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
              {children}
            </main>

            {/* Footer */}
            <footer className="glass-strong border-t border-white/5 relative z-10">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Brand */}
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-polygon rounded-xl flex items-center justify-center">
                        <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
                      </div>
                      <span className="text-xl font-bold gradient-text">ClearFall</span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-xs">
                      Trustless Dutch auctions with commit-reveal mechanism for fair and transparent token distribution.
                    </p>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="/explore" className="text-gray-400 hover:text-white transition-colors">
                          Explore Auctions
                        </a>
                      </li>
                      <li>
                        <a href="/create" className="text-gray-400 hover:text-white transition-colors">
                          Create Auction
                        </a>
                      </li>
                      <li>
                        <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                          Dashboard
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Resources */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a
                          href="https://docs.polygon.technology/pos/get-started/building-on-polygon/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          Polygon Docs
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://amoy.polygonscan.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          Amoy Explorer
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="divider my-8" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                  <p>2024 ClearFall Protocol. Built on Polygon.</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Polygon Amoy Testnet</span>
                    </div>
                  </div>
                </div>
              </div>
            </footer>

            {/* Global AI Assistant */}
            <GlobalAIHelper />
          </div>
        </Providers>
      </body>
    </html>
  );
}
