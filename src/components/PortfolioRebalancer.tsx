import React, { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";

interface PortfolioRebalancerProps {
  portfolio: any[];
}

export default function PortfolioRebalancer({ portfolio }: PortfolioRebalancerProps) {
  const [allocations, setAllocations] = useState('{"Tech": 0.6, "Energy": 0.4}');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRebalance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio, targetAllocations: JSON.parse(allocations) }),
      });
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      console.error(err);
      alert("Failed to rebalance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left space-y-4">
      <h4 className="font-bold text-lg text-white font-sans flex items-center gap-2">
        <RefreshCw className="text-emerald-400" size={20} />
        Auto-Rebalance
      </h4>
      <textarea 
        value={allocations} 
        onChange={(e) => setAllocations(e.target.value)} 
        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white font-mono h-20"
      />
      <button 
        onClick={handleRebalance} 
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <Zap size={16} /> {loading ? "Analyzing..." : "Generate Plan"}
      </button>

      {plan && (
        <div className="mt-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <p className="text-xs text-neutral-300 font-bold">Plan Rationale:</p>
          <p className="text-xs text-neutral-400">{plan.rationale}</p>
          <p className="text-xs text-neutral-300 font-bold pt-2">Actions:</p>
          <ul className="list-disc pl-4 text-xs text-neutral-400 space-y-1">
            {plan.actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
