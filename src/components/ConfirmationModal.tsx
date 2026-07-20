import React from "react";
import { Check, X } from "lucide-react";

interface ConfirmationModalProps {
  ticker: string | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function ConfirmationModal({ ticker, onApprove, onReject }: ConfirmationModalProps) {
  if (!ticker) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <h3 className="font-sans font-bold text-white text-lg mb-2">Sera Suggestion</h3>
        <p className="text-sm text-neutral-400 font-mono mb-6">
          Sera recommends analyzing <span className="text-emerald-400 font-bold">{ticker}</span>. Do you approve?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            <X size={14} /> Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            <Check size={14} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
