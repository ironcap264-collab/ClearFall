'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronUp, Loader2, ArrowRight, X, MessageSquare, Sparkles } from 'lucide-react';

export function GlobalAIHelper() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am the ClearFall AI. Ask me anything about creating auctions, minting tokens, or how Dutch Auctions work!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const FAQ: Record<string, string> = {
    "How do I create a Dutch Auction?": "To create an auction: \n1. Go to the **Create** page.\n2. Select your token (or create one).\n3. Set your **Start Price** (high) and **End Price** (low).\n4. Choose the duration and click **Launch Auction**.",
    "How to create a new Token?": "If you don't have a token yet:\n1. Go to the **Create** page.\n2. Switch to the **Create Token** tab.\n3. Enter a Name, Symbol, and Supply.\n4. Click **Deploy** to mint your own ERC20 token instantly.",
    "What is the Faucet for?": "The **Faucet** gives you free test tokens (CFT) on the Polygon Amoy Testnet. You can use these tokens to test the platform, place bids, and simulate real auctions without spending real money.",
    "Explain Dutch Auction mechanism": "A **Dutch Auction** starts at a high price and gradually drops over time. \n- Buyers commit funds when they are happy with the current price.\n- The auction ends when total commitments match the total supply.\n- Everyone pays the same final clearing price."
  };

  const handleAsk = async (e: React.FormEvent, manualQuery?: string) => {
    e.preventDefault();
    const finalQuery = manualQuery || query;
    if (!finalQuery.trim()) return;

    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: finalQuery }]);
    setIsLoading(true);

    // Check for hardcoded FAQ match
    if (FAQ[finalQuery]) {
      // Simulate a small delay for natural feel
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: FAQ[finalQuery] }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API Key is missing');
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful expert assistant for ClearFall, a decentralized Dutch Auction platform on Polygon.
              Keep answers concise (max 3 sentences), friendly, and technical but simple.
              
              Context:
              - ClearFall allows users to create Dutch Auctions for any ERC20 token.
              - It has a Faucet for test tokens.
              - It has a Dashboard to manage auctions.
              - Dutch Auctions start high and drop price over time.
              
              User Question: ${finalQuery}`
            }]
          }]
        })
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0].content) {
         setMessages(prev => [...prev, { role: 'bot', text: data.candidates[0].content.parts[0].text }]);
      } else {
         setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting. Please try again." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "How do I create a Dutch Auction?",
    "How to create a new Token?",
    "What is the Faucet for?",
    "Explain Dutch Auction mechanism"
  ];

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
       {/* Chat Window */}
       <div className={`pointer-events-auto transition-all duration-300 transform origin-bottom-right mb-4 w-80 md:w-96 glass-strong border border-primary-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 h-0'}`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary-900/80 to-purple-900/80 border-b border-white/10 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                   <Bot className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                   <h3 className="font-bold text-white text-sm">ClearFall Assistant</h3>
                   <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-gray-300">Online</span>
                   </div>
                </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
             </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-black/40 flex flex-col">
             {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                   }`}>
                      {formatMessage(msg.text)}
                   </div>
                </div>
             ))}
             {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 border border-white/5">
                      <div className="flex gap-1">
                         <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                         <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                         <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                   </div>
                </div>
             )}
             
             {/* Suggestions (only show if no messages or just welcome message) */}
             {messages.length === 1 && !isLoading && (
                <div className="mt-auto pt-4 space-y-2">
                   <p className="text-xs text-gray-500 ml-1 mb-2">Suggested questions:</p>
                   <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                         <button
                           key={i}
                           onClick={(e) => handleAsk(e, s)}
                           className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary-500/30 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors text-left"
                         >
                           {s}
                         </button>
                      ))}
                   </div>
                </div>
             )}
             
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => handleAsk(e)} className="p-3 bg-white/5 border-t border-white/5">
             <div className="relative">
                <input
                   type="text"
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Ask about auctions..."
                   className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-primary-500/50 transition-colors placeholder:text-gray-500 text-white"
                />
                <button 
                   type="submit"
                   disabled={isLoading || !query.trim()}
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                >
                   <ArrowRight className="w-3.5 h-3.5" />
                </button>
             </div>
          </form>
       </div>

       {/* Floating Toggle Button */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-primary-500/20 transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-gradient-to-br from-primary-500 to-purple-600 text-white rotate-0'}`}
       >
         {isOpen ? (
            <X className="w-6 h-6" />
         ) : (
            <>
               <MessageSquare className="w-6 h-6 absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-50" />
               <Sparkles className="w-6 h-6 absolute opacity-0 scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" />
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
            </>
         )}
       </button>
    </div>
  );
}
