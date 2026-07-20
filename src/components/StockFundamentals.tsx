import React from "react";
import { StockMetric } from "../types";
import { TrendingUp, TrendingDown, Gauge } from "lucide-react";

interface StockFundamentalsProps {
  metric: StockMetric;
}

export default function StockFundamentals({ metric }: StockFundamentalsProps) {
  const sentimentColor =
    (metric.sentimentScore ?? 0) > 20
      ? "text-emerald-400"
      : (metric.sentimentScore ?? 0) < -20
      ? "text-rose-400"
      : "text-neutral-400";

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 backdrop-blur-md shadow-xl mt-4">
      <h3 className="text-sm font-bold font-sans text-white mb-4 tracking-tight">Fundamental & Sentiment Analysis</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-center">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">P/E Ratio</p>
          <p className="text-lg font-bold font-mono text-white mt-1">{metric.peRatio?.toFixed(2) ?? "N/A"}</p>
        </div>
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-center">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">EPS</p>
          <p className="text-lg font-bold font-mono text-white mt-1">${metric.eps?.toFixed(2) ?? "N/A"}</p>
        </div>
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-center">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Sentiment</p>
          <p className={`text-lg font-bold font-mono mt-1 ${sentimentColor} flex items-center justify-center gap-1`}>
            {metric.sentimentScore?.toFixed(0) ?? "0"}
            {metric.sentimentScore && metric.sentimentScore > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </p>
        </div>
      </div>
    </div>
  );
}
