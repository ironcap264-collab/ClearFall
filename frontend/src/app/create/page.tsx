'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useCreateAuction } from '@/hooks';
import { parseEther } from '@/lib/utils';
import { createAndUploadAuctionMetadata, isPinataConfigured } from '@/lib/ipfs';
import toast from 'react-hot-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  ArrowLeft,
  Info,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Coins,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ABI for TokenFactory
const TOKEN_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'initialSupply', type: 'uint256' },
      { internalType: 'uint8', name: 'decimals_', type: 'uint8' }
    ],
    name: 'createToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'symbol', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'initialSupply', type: 'uint256' }
    ],
    name: 'TokenCreated',
    type: 'event'
  }
] as const;

// Custom Scrollable Date Time Selector
function DateTimeSelector({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const date = value ? new Date(value) : new Date();
  
  // Generate options
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Current values
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const currentHour24 = date.getHours();
  const currentMinute = date.getMinutes();
  const isPM = currentHour24 >= 12;
  const currentHour12 = currentHour24 % 12 || 12;

  const updateDate = (changes: Partial<{ year: number, month: number, day: number, hour12: number, minute: number, pm: boolean }>) => {
    const y = changes.year ?? currentYear;
    const m = changes.month ?? currentMonth;
    const d = changes.day ?? currentDay;
    const h12 = changes.hour12 ?? currentHour12;
    const min = changes.minute ?? currentMinute;
    const pm = changes.pm ?? isPM;
    
    let h24 = (h12 === 12 ? 0 : h12) + (pm ? 12 : 0);
    
    const newDate = new Date(y, m, d, h24, min);
    // Format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    const iso = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;
    onChange(iso);
  };

  const selectClass = "bg-black/40 border border-white/10 rounded-lg py-2 px-1 text-center appearance-none cursor-pointer hover:border-primary-500/50 focus:border-primary-500 focus:outline-none transition-colors text-sm font-mono h-10";

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
       <div className="flex gap-1">
         <select value={currentMonth} onChange={e => updateDate({ month: +e.target.value })} className={`${selectClass} min-w-[60px]`}>
           {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
         </select>
         <select value={currentDay} onChange={e => updateDate({ day: +e.target.value })} className={`${selectClass} min-w-[50px]`}>
           {days.map(d => <option key={d} value={d}>{d}</option>)}
         </select>
         <select value={currentYear} onChange={e => updateDate({ year: +e.target.value })} className={`${selectClass} min-w-[70px]`}>
           {years.map(y => <option key={y} value={y}>{y}</option>)}
         </select>
       </div>
       
       <div className="text-gray-500 font-bold mx-1">@</div>
       
       <div className="flex gap-1">
         <select value={currentHour12} onChange={e => updateDate({ hour12: +e.target.value })} className={`${selectClass} min-w-[50px]`}>
           {hours.map(h => <option key={h} value={h}>{h}</option>)}
         </select>
         <span className="self-center text-gray-500 font-bold">:</span>
         <select value={currentMinute} onChange={e => updateDate({ minute: +e.target.value })} className={`${selectClass} min-w-[50px]`}>
           {minutes.map((m, i) => <option key={i} value={i}>{m}</option>)}
         </select>
         <select value={isPM ? 'PM' : 'AM'} onChange={e => updateDate({ pm: e.target.value === 'PM' })} className={`${selectClass} min-w-[60px] text-primary-400 font-bold`}>
           <option value="AM">AM</option>
           <option value="PM">PM</option>
         </select>
       </div>
    </div>
  );
}

export default function CreateAuctionPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { createAuction, isPending, isConfirming, isSuccess, hash } = useCreateAuction();

  // Tabs: 'token' or 'auction'
  const [activeTab, setActiveTab] = useState<'token' | 'auction'>('auction');

  // Token Creation State
  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    supply: '1000000',
    decimals: '18'
  });
  
  const { 
    writeContract: createToken, 
    data: tokenHash, 
    isPending: isTokenPending 
  } = useWriteContract();

  const { 
    isLoading: isTokenConfirming, 
    isSuccess: isTokenSuccess,
    data: tokenReceipt
  } = useWaitForTransactionReceipt({ hash: tokenHash });

  // Handle Token Creation
  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS) {
      toast.error('Token Factory address not configured');
      return;
    }
    
    try {
      createToken({
        address: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS as `0x${string}`,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createToken',
        args: [
          tokenForm.name,
          tokenForm.symbol,
          parseEther(tokenForm.supply), // Assuming standard 18 decimals for supply input simplicity, but let's correct logic
          // Actually, we should probably take supply as raw number and multiply by 10^decimals
          // But parseEther does 10^18. Let's stick to 18 decimals for simplicity for now.
          18 
        ]
      });
      toast.loading('Creating token...');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // When token is created, switch to auction tab and autofill
  if (isTokenSuccess && tokenReceipt && activeTab === 'token') {
    // Find the TokenCreated event log
    // In TokenFactory: event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 initialSupply);
    // The first topic is the event signature hash.
    // The second topic is indexed tokenAddress.
    // The third topic is indexed creator.
    
    // We can extract the token address from the logs if we find the one emitted by our factory.
    // The factory address is process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS.
    
    // Let's try to find the log emitted by the factory.
    const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS?.toLowerCase();
    const log = tokenReceipt.logs.find(l => l.address.toLowerCase() === factoryAddress);
    
    if (log && log.topics && log.topics.length >= 2) {
       // The first indexed param (tokenAddress) is at topics[1]
       // It's a 32-byte hex string, we need to slice it to get the address (last 20 bytes)
       const addressTopic = log.topics[1];
       if (addressTopic) {
         const extractedAddress = `0x${addressTopic.slice(26)}`; // Remove 0x and first 12 bytes of padding (24 chars) -> wait, 32 bytes = 64 hex chars. Address is 20 bytes = 40 hex chars. Padding is 12 bytes = 24 chars. 2 + 24 = 26. Correct.
         // Only update if it's different to avoid loops (though we are in render, this is still risky side-effect pattern)
         // Better to use a ref or just show it.
         // Let's just show it in the UI since we have the data now!
       }
    }
  }

  // Effect to handle success state safely
  // We'll use a callback ref or effect to set the token address if we can parse it, 
  // but for now, let's just show the hash.

  const [formData, setFormData] = useState({
    // Metadata
    title: '',
    description: '',
    // Auction params
    token: '',
    paymentToken: '',
    totalSupply: '',
    startPrice: '',
    endPrice: '',
    reservePrice: '0',
    startTime: '',
    commitDuration: '86400',
    revealDuration: '43200',
    vestingDuration: '0',
    vestingCliff: '0',
    nonRevealPenalty: '1000',
    minBidAmount: '0',
    maxBidPerAddress: '0',
    antiSnipingDuration: '300',
    whitelistEnabled: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isEnhancing, setIsEnhancing] = useState(false);

  const enhanceDescription = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Please enter a title or description first');
      return;
    }

    setIsEnhancing(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('AI service unavailable');

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert copywriter for crypto projects. Improve the following auction title and description to be more professional, engaging, and clear.
              
              Current Title: ${formData.title}
              Current Description: ${formData.description}
              
              Return ONLY a valid JSON object with keys "title" and "description". Do not include markdown formatting or code blocks.`
            }]
          }]
        })
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0].content) {
        let text = data.candidates[0].content.parts[0].text;
        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
          const result = JSON.parse(text);
          setFormData(prev => ({
            ...prev,
            title: result.title || prev.title,
            description: result.description || prev.description
          }));
          toast.success('Enhanced with AI ✨');
        } catch (e) {
          console.error("JSON parse error", e);
          toast.error('Failed to parse AI response');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to enhance description');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error('Please upload an image file');
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsUploading(true);

      // Calculate start time
      const startTimestamp = Math.floor(new Date(formData.startTime).getTime() / 1000);

      let metadataURI = '';

      // Upload to IPFS if Pinata is configured and we have metadata
      if (isPinataConfigured() && (formData.title || formData.description || imageFile)) {
        toast.loading('Uploading to IPFS...', { id: 'ipfs-upload' });

        const { metadataUri } = await createAndUploadAuctionMetadata(
          formData.title || `Auction ${formData.token.slice(0, 8)}...`,
          formData.description || 'Dutch auction for token distribution',
          imageFile,
          {
            token_address: formData.token,
            total_supply: formData.totalSupply,
            start_price: formData.startPrice,
            end_price: formData.endPrice,
            start_time: startTimestamp.toString(),
            commit_duration: formData.commitDuration,
            reveal_duration: formData.revealDuration,
          }
        );

        metadataURI = metadataUri;
        toast.success('Uploaded to IPFS!', { id: 'ipfs-upload' });
      }

      setIsUploading(false);

      const params = {
        token: formData.token as `0x${string}`,
        paymentToken: (formData.paymentToken || '0x0000000000000000000000000000000000000000') as `0x${string}`,
        totalSupply: parseEther(formData.totalSupply),
        startPrice: parseEther(formData.startPrice),
        endPrice: parseEther(formData.endPrice),
        reservePrice: parseEther(formData.reservePrice || '0'),
        startTime: BigInt(startTimestamp),
        commitDuration: BigInt(formData.commitDuration),
        revealDuration: BigInt(formData.revealDuration),
        vestingDuration: BigInt(formData.vestingDuration),
        vestingCliff: BigInt(formData.vestingCliff),
        nonRevealPenalty: BigInt(formData.nonRevealPenalty),
        minBidAmount: parseEther(formData.minBidAmount || '0'),
        maxBidPerAddress: parseEther(formData.maxBidPerAddress || '0'),
        antiSnipingDuration: BigInt(formData.antiSnipingDuration),
        whitelistEnabled: formData.whitelistEnabled,
        metadataURI,
      };

      createAuction(params);
      toast.success('Creating auction...');
    } catch (error: any) {
      setIsUploading(false);
      toast.error(error.message || 'Failed to create auction');
    }
  };

  if (isSuccess && hash) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-3 font-display">Auction Created!</h2>
          <p className="text-gray-400 mb-6">
            Your auction has been created successfully on the blockchain.
          </p>

          <div className="glass-subtle rounded-xl p-4 mb-8">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
            <p className="text-sm font-mono text-gray-300 break-all">{hash}</p>
          </div>

          <div className="alert alert-info mb-8">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-blue-300 mb-1">Next Steps</p>
              <ol className="list-decimal list-inside text-sm text-blue-200 space-y-1">
                <li>Approve the auction contract to spend your tokens</li>
                <li>Deposit tokens to the auction</li>
                <li>Optionally update metadata or add whitelist</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-secondary">
              View All Auctions
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Launchpad</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to create tokens and auctions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header - Matching Dashboard Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-bold mb-2 font-display">
             <span className="gradient-text">Launch</span> New Project
           </h1>
           <p className="text-gray-400">Deploy a new token or start a Dutch auction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Form Area - Full Width */}
        <div className="space-y-6">
           {/* Tabs */}
           <div className="flex p-1 bg-white/5 rounded-xl">
             <button
               onClick={() => setActiveTab('auction')}
               className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                 activeTab === 'auction'
                   ? 'bg-primary-500 text-white shadow-lg'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               <Sparkles className="w-4 h-4" />
               Create Auction
             </button>
             <button
               onClick={() => setActiveTab('token')}
               className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                 activeTab === 'token'
                   ? 'bg-primary-500 text-white shadow-lg'
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               <Coins className="w-4 h-4" />
               Create Token First
             </button>
           </div>

           <div className="card p-6 md:p-8">
              {activeTab === 'token' ? (
                 // Token Creation Form
                 <form onSubmit={handleCreateToken} className="space-y-8 animate-fade-in">
                    <section>
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <Coins className="w-5 h-5 text-primary-400" />
                        Token Configuration
                      </h3>
                      <div className="space-y-6">
                         <div>
                            <label className="label">Token Name</label>
                            <input
                              type="text"
                              value={tokenForm.name}
                              onChange={(e) => setTokenForm(p => ({...p, name: e.target.value}))}
                              placeholder="e.g. My Project Token"
                              className="input"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Full name of your project</p>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="label">Symbol</label>
                              <input
                                type="text"
                                value={tokenForm.symbol}
                                onChange={(e) => setTokenForm(p => ({...p, symbol: e.target.value}))}
                                placeholder="MPT"
                                className="input uppercase"
                                required
                              />
                           </div>
                           <div>
                              <label className="label">Initial Supply</label>
                              <input
                                type="text"
                                value={tokenForm.supply}
                                onChange={(e) => setTokenForm(p => ({...p, supply: e.target.value}))}
                                placeholder="1000000"
                                className="input"
                                required
                              />
                           </div>
                         </div>
                      </div>
                    </section>

                    {isTokenSuccess && (
                      <div className="alert alert-success">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-bold">Token Deployed Successfully!</p>
                          
                          {(() => {
                              const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS?.toLowerCase();
                              // Filter logs safely. Depending on wagmi version, log structure might vary.
                              // Usually log has address and topics array.
                              const log = tokenReceipt?.logs.find(l => l.address.toLowerCase() === factoryAddress);
                              
                              // Check if log exists and topics is an array and has enough items
                              if (log && Array.isArray(log.topics) && log.topics.length >= 2) {
                                  const topic = log.topics[1];
                                  if (topic) {
                                      const extractedAddress = `0x${topic.slice(26)}`;
                                      return (
                                          <div className="mt-2 p-2 bg-black/20 rounded border border-white/10">
                                              <p className="text-xs text-gray-400 mb-1">New Token Address:</p>
                                              <div className="flex items-center gap-2">
                                                  <code className="text-sm font-mono text-white break-all">{extractedAddress}</code>
                                                  <button 
                                                      onClick={(e) => {
                                                          e.preventDefault();
                                                          navigator.clipboard.writeText(extractedAddress);
                                                          toast.success('Address copied!');
                                                      }}
                                                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                                                  >
                                                      Copy
                                                  </button>
                                              </div>
                                              <button 
                                                  onClick={(e) => {
                                                      e.preventDefault();
                                                      setFormData(prev => ({ ...prev, token: extractedAddress }));
                                                      setActiveTab('auction');
                                                      toast.success('Address autofilled! Now create your auction.');
                                                  }}
                                                  className="mt-3 btn-secondary text-xs w-full"
                                              >
                                                  Use this Token & Create Auction
                                              </button>
                                          </div>
                                      );
                                  }
                              }
                              return null;
                          })()}

                          <p className="text-sm mt-2">
                             <a 
                               href={`https://amoy.polygonscan.com/tx/${tokenHash}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="underline hover:text-white"
                             >
                               View on Explorer
                             </a>
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isTokenPending || isTokenConfirming}
                      className="btn-primary w-full py-4"
                    >
                      {isTokenPending || isTokenConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Deploying Token...
                        </div>
                      ) : (
                        'Deploy Token'
                      )}
                    </button>
                 </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                  {/* Metadata Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                      <ImageIcon className="w-5 h-5 text-primary-400" />
                      Auction Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Image Upload */}
                      <div
                        className={`upload-zone md:row-span-2 ${isDragging ? 'dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleImageDrop}
                      >
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                            <p className="text-sm text-gray-400 mb-1">Drop image here or click to upload</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-4">
                        <div>
                          <label className="label">Auction Title</label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="My Token Sale"
                            className="input"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                             <label className="label mb-0">Description</label>
                             <button 
                               type="button"
                               onClick={enhanceDescription}
                               disabled={isEnhancing}
                               className="text-xs flex items-center gap-1 text-primary-400 hover:text-white transition-colors"
                             >
                               {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                               Enhance with AI
                             </button>
                          </div>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your token and auction..."
                            rows={3}
                            className="input resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {!isPinataConfigured() && (
                      <div className="alert alert-warning mt-4">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <p className="text-sm text-yellow-200">
                          Pinata not configured. Metadata will not be stored on IPFS.
                          <br />
                          <span className="text-yellow-300/70">Add NEXT_PUBLIC_PINATA_JWT to enable IPFS storage.</span>
                        </p>
                      </div>
                    )}
                  </section>

                  <div className="divider" />

                  {/* Token Settings */}
                  <section>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                       <Coins className="w-5 h-5 text-primary-400" />
                       Token Settings
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="label">Token Address *</label>
                        <input
                          type="text"
                          name="token"
                          value={formData.token}
                          onChange={handleChange}
                          placeholder="0x..."
                          className="input font-mono"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">The ERC20 token you want to auction</p>
                      </div>

                      <div>
                        <label className="label">Total Supply *</label>
                        <input
                          type="text"
                          name="totalSupply"
                          value={formData.totalSupply}
                          onChange={handleChange}
                          placeholder="1000000"
                          className="input"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Total tokens to auction (in token units)</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Start Price (MATIC) *</label>
                          <input
                            type="text"
                            name="startPrice"
                            value={formData.startPrice}
                            onChange={handleChange}
                            placeholder="1.0"
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">End Price (MATIC) *</label>
                          <input
                            type="text"
                            name="endPrice"
                            value={formData.endPrice}
                            onChange={handleChange}
                            placeholder="0.1"
                            className="input"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="divider" />

                  {/* Timing Settings */}
                  <section>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                       <Clock className="w-5 h-5 text-primary-400" />
                       Schedule
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="label">Start Time *</label>
                        <DateTimeSelector 
                           value={formData.startTime} 
                           onChange={(val) => setFormData(p => ({...p, startTime: val}))} 
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                           <Info className="w-3 h-3" />
                           Selected time is in your local timezone. 
                           {formData.startTime && (
                             <span className="text-primary-400 font-medium ml-1">
                               ({new Date(formData.startTime).toLocaleString(undefined, { 
                                 weekday: 'short', 
                                 year: 'numeric', 
                                 month: 'short', 
                                 day: 'numeric', 
                                 hour: 'numeric', 
                                 minute: '2-digit',
                                 hour12: true 
                               })})
                             </span>
                           )}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="label">Commit Phase Duration</label>
                          <select
                            name="commitDuration"
                            value={formData.commitDuration}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="3600">1 Hour</option>
                            <option value="21600">6 Hours</option>
                            <option value="43200">12 Hours</option>
                            <option value="86400">1 Day</option>
                            <option value="172800">2 Days</option>
                            <option value="604800">1 Week</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Reveal Phase Duration</label>
                          <select
                            name="revealDuration"
                            value={formData.revealDuration}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="1800">30 Minutes</option>
                            <option value="3600">1 Hour</option>
                            <option value="21600">6 Hours</option>
                            <option value="43200">12 Hours</option>
                            <option value="86400">1 Day</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Advanced Settings Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors w-full p-4 rounded-xl bg-white/5 justify-between group"
                  >
                    <span className="font-medium">Advanced Configuration</span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Advanced Settings */}
                  {showAdvanced && (
                    <section className="space-y-6 animate-fade-in card bg-black/20 p-6 border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Payment Token</label>
                          <input
                            type="text"
                            name="paymentToken"
                            value={formData.paymentToken}
                            onChange={handleChange}
                            placeholder="Leave empty for native MATIC"
                            className="input font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="label">Reserve Price (MATIC)</label>
                          <input
                            type="text"
                            name="reservePrice"
                            value={formData.reservePrice}
                            onChange={handleChange}
                            placeholder="0"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="label">Min Bid (MATIC)</label>
                          <input
                            type="text"
                            name="minBidAmount"
                            value={formData.minBidAmount}
                            onChange={handleChange}
                            placeholder="0"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="label">Max Bid per Address (MATIC)</label>
                          <input
                            type="text"
                            name="maxBidPerAddress"
                            value={formData.maxBidPerAddress}
                            onChange={handleChange}
                            placeholder="0 (unlimited)"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="label">Non-Reveal Penalty (%)</label>
                          <select
                            name="nonRevealPenalty"
                            value={formData.nonRevealPenalty}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="0">0% (No penalty)</option>
                            <option value="500">5%</option>
                            <option value="1000">10%</option>
                            <option value="2000">20%</option>
                            <option value="5000">50%</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Anti-Sniping Extension</label>
                          <select
                            name="antiSnipingDuration"
                            value={formData.antiSnipingDuration}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="0">Disabled</option>
                            <option value="60">1 Minute</option>
                            <option value="300">5 Minutes</option>
                            <option value="600">10 Minutes</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                        <input
                          type="checkbox"
                          name="whitelistEnabled"
                          id="whitelistEnabled"
                          checked={formData.whitelistEnabled}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-600 text-primary-600 focus:ring-primary-500 bg-black/40"
                        />
                        <label htmlFor="whitelistEnabled" className="flex-1 cursor-pointer">
                          <span className="font-medium">Enable Whitelist</span>
                          <p className="text-sm text-gray-400">Only approved addresses can participate</p>
                        </label>
                      </div>
                    </section>
                  )}

                  {/* Info Box */}
                  <div className="alert alert-info">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-300 mb-1">Launch Steps:</p>
                      <ol className="list-decimal list-inside text-sm text-blue-200 space-y-1">
                        <li>Create the auction contract</li>
                        <li>Approve the auction to spend your tokens (Dashboard)</li>
                        <li>Deposit the tokens (Dashboard)</li>
                      </ol>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending || isConfirming || isUploading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                  >
                    {isPending || isConfirming || isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isUploading ? 'Uploading to IPFS...' : isPending ? 'Confirm in Wallet...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Launch Auction
                      </>
                    )}
                  </button>
                </form>
              )}
           </div>
        </div>

        {/* Sidebar / Guide */}
        <div className="space-y-6">
           {/* Quick Guide - Removed as requested since we have AI Assistant now */}
           {/* You can add back the Quick Guide here if needed, but for now we rely on the global AI assistant */}
        </div>
      </div>
    </div>
  );
}
