import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import React, { useRef } from "react";

const SUGGESTIONS = [
  { symbol: "NVDA", price: 135.42, change: 2.4, isUp: true },
  { symbol: "TSLA", price: 242.15, change: -1.2, isUp: false },
  { symbol: "AMD", price: 168.20, change: 5.1, isUp: true },
  { symbol: "PLTR", price: 23.10, change: 8.4, isUp: true },
  { symbol: "CRWD", price: 301.50, change: -0.5, isUp: false },
  { symbol: "ARM", price: 142.00, change: 3.2, isUp: true },
  { symbol: "SOUN", price: 5.40, change: 12.1, isUp: true },
];

export default function StockBanner({ onSelectTicker, onTradeTicker }: { onSelectTicker: (sym: string) => void, onTradeTicker: (sym: string) => void }) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (symbol: string) => {
    longPressTimer.current = setTimeout(() => {
      onTradeTicker(symbol);
    }, 600); // 600ms long press
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="w-full overflow-hidden bg-black/60 border-y border-white/10 backdrop-blur-md relative mb-6 group">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      <div className="flex w-full animate-marquee hover:pause whitespace-nowrap py-3">
        {/* Double the list for seamless loop */}
        {[...SUGGESTIONS, ...SUGGESTIONS, ...SUGGESTIONS].map((stock, i) => (
          <div 
            key={`${stock.symbol}-${i}`}
            onClick={() => onSelectTicker(stock.symbol)}
            onMouseDown={() => startLongPress(stock.symbol)}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={() => startLongPress(stock.symbol)}
            onTouchEnd={clearLongPress}
            className="flex items-center gap-3 mx-6 cursor-pointer hover:bg-white/5 px-4 py-1.5 rounded-full transition-all border border-transparent hover:border-white/10"
          >
            <span className="font-mono font-bold text-sm text-white tracking-wider">{stock.symbol}</span>
            <div className={`flex items-center gap-1 font-mono text-xs font-bold ${stock.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>${stock.price.toFixed(2)}</span>
              {stock.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{stock.change > 0 ? '+' : ''}{stock.change}%</span>
            </div>
            {stock.change > 5 && <Sparkles size={12} className="text-yellow-400 ml-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
