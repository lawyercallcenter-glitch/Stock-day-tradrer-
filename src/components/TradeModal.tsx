import React from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface TradeModalProps {
  symbol: string;
  onClose: () => void;
  onTrade: (type: "BUY" | "SELL") => void;
}

export default function TradeModal({ symbol, onClose, onTrade }: TradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-6">Trade {symbol}</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => onTrade("BUY")}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl hover:bg-emerald-500/20 font-bold"
          >
            <TrendingUp size={18} /> BUY
          </button>
          <button 
            onClick={() => onTrade("SELL")}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3 rounded-xl hover:bg-rose-500/20 font-bold"
          >
            <TrendingDown size={18} /> SELL
          </button>
        </div>
      </div>
    </div>
  );
}
