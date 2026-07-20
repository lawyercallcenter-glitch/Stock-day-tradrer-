import React, { useState } from "react";
import { Share2, Globe, Sparkles, TrendingUp, BarChart3, Target, Send, Search, Image as ImageIcon, MessageSquare, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MarketingHub() {
  const [seoQuery, setSeoQuery] = useState("");
  const [seoResult, setSeoResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateSEO = async () => {
    if (!seoQuery.trim()) return;
    setLoading(true);
    try {
      // In a real app, this calls the server proxying Gemini
      const response = await fetch("/api/gemini/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: seoQuery }),
      });
      const data = await response.json();
      setSeoResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Share2 className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Marketing & Ad Center</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Growth Orchestration Hub</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
            Launch New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Ad Center Dashboard */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total Reach</p>
              <p className="text-2xl font-bold text-white">124.5K</p>
              <div className="flex items-center gap-1 mt-1 text-emerald-400 text-[10px] font-bold">
                <TrendingUp size={10} /> +12% WoW
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">CTR Avg</p>
              <p className="text-2xl font-bold text-white">4.2%</p>
              <div className="flex items-center gap-1 mt-1 text-emerald-400 text-[10px] font-bold">
                <TrendingUp size={10} /> +0.5% WoW
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Conv. Rate</p>
              <p className="text-2xl font-bold text-white">1.8%</p>
              <div className="flex items-center gap-1 mt-1 text-rose-400 text-[10px] font-bold">
                <TrendingUp size={10} className="rotate-180" /> -2% WoW
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={18} /> SEO AI Intelligence
            </h3>
            <div className="space-y-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={seoQuery}
                  onChange={(e) => setSeoQuery(e.target.value)}
                  placeholder="Target keyword or page topic (e.g. Day Trading Strategies)..."
                  className="flex-1 bg-neutral-950 border border-neutral-850 rounded-2xl px-6 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                />
                <button
                  onClick={generateSEO}
                  disabled={loading}
                  className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50"
                >
                  {loading ? "Analyzing..." : "Generate Optimization"}
                </button>
              </div>

              <AnimatePresence>
                {seoResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-2xl">
                      <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-3">High-Conviction Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {seoResult.keywords?.map((k: string) => (
                          <span key={k} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-lg">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-2xl">
                      <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-3">Meta Optimization</p>
                      <p className="text-sm text-white font-bold mb-1">{seoResult.title}</p>
                      <p className="text-xs text-neutral-500 leading-relaxed">{seoResult.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-6">Active Ad Campaigns</h3>
            <div className="space-y-4">
              {[
                { platform: "Facebook", name: "Alpha Breakout Awareness", spend: "$450.00", status: "Active" },
                { platform: "Instagram", name: "Sera AI Teaser", spend: "$210.00", status: "Active" },
                { platform: "Google Search", name: "Trade Journal SEO", spend: "$1,200.00", status: "Paused" },
              ].map((campaign, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-850 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                      <Target size={20} className="text-neutral-500 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{campaign.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-mono">{campaign.platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{campaign.spend}</p>
                    <span className={`text-[10px] font-bold uppercase ${campaign.status === "Active" ? "text-emerald-400" : "text-neutral-600"}`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-400" /> Attribution Map
            </h3>
            <div className="space-y-6">
              {[
                { label: "Organic Search", value: 45, color: "bg-indigo-500" },
                { label: "Social Ads", value: 30, color: "bg-purple-500" },
                { label: "Referral", value: 15, color: "bg-pink-500" },
                { label: "Direct", value: 10, color: "bg-neutral-700" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-indigo-400" /> Ad Center AI
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Sera identified a 40% lower CAC on Instagram for "Swing Trading" keywords. Automatically reallocating budget?
            </p>
            <button className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/40 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest">
              Enable Auto-Pilot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
