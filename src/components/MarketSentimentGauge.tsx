import { useState, useEffect } from "react";
import { Gauge, Info } from "lucide-react";

export default function MarketSentimentGauge() {
  const [score, setScore] = useState<number>(50);
  const [label, setLabel] = useState<string>("Loading...");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/gemini/sentiment")
      .then(r => r.json())
      .then(data => {
        setScore(data.score || 50);
        setLabel(data.label || "Neutral");
        setReason(data.reason || "");
      })
      .catch(() => {
        setScore(50);
        setLabel("Neutral");
      })
      .finally(() => setLoading(false));
  }, []);

  // Determine color based on score
  const getColor = () => {
    if (score < 30) return "text-rose-500";
    if (score < 45) return "text-orange-400";
    if (score <= 55) return "text-neutral-400";
    if (score < 75) return "text-emerald-400";
    return "text-emerald-500";
  };

  const getBgColor = () => {
    if (score < 30) return "bg-rose-500";
    if (score < 45) return "bg-orange-400";
    if (score <= 55) return "bg-neutral-400";
    if (score < 75) return "bg-emerald-400";
    return "bg-emerald-500";
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-xl group relative">
      <Gauge size={14} className={getColor()} />
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
          Market Mood
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-xs ${getColor()}`}>{label}</span>
          <span className="text-[10px] text-neutral-400">({score}/100)</span>
        </div>
      </div>
      
      {/* Tooltip */}
      {!loading && reason && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          <p className="text-[10px] text-neutral-300 leading-snug">{reason}</p>
        </div>
      )}
    </div>
  );
}
