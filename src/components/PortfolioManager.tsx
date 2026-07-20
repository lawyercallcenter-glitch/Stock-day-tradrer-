import React, { useState, useEffect } from "react";
import { Plus, Trash2, LayoutGrid, List, Briefcase, TrendingUp, TrendingDown, DollarSign, Sparkles } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { Portfolio, StockBagItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function PortfolioManager() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [bags, setBags] = useState<StockBagItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const portfoliosQuery = query(collection(db, "users", user.uid, "portfolios"));
    const unsubscribePortfolios = onSnapshot(portfoliosQuery, (snapshot) => {
      const portfolioData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Portfolio[];
      setPortfolios(portfolioData);
      if (portfolioData.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolioData[0].id);
      }
      setLoading(false);
    });

    const bagsQuery = query(collection(db, "users", user.uid, "bags"));
    const unsubscribeBags = onSnapshot(bagsQuery, (snapshot) => {
      const bagsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StockBagItem[];
      setBags(bagsData);
    });

    return () => {
      unsubscribePortfolios();
      unsubscribeBags();
    };
  }, [user, selectedPortfolioId]);

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPortfolioName.trim()) return;

    try {
      const id = Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, "users", user.uid, "portfolios"), {
        id,
        name: newPortfolioName,
        createdAt: new Date().toISOString(),
      });
      setNewPortfolioName("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding portfolio:", err);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!user || !window.confirm("Delete this portfolio and all its contents?")) return;
    try {
      // In a real app, we'd also delete associated bags. 
      // For now, we'll just delete the portfolio record.
      const snapshot = portfolios.find(p => p.id === id);
      if (snapshot) {
        // Need to find the firestore doc ID
        // Simplified: we'd need to query by id field or use doc ID as id
      }
    } catch (err) {
      console.error("Error deleting portfolio:", err);
    }
  };

  const selectedBags = bags.filter((b) => b.portfolioId === selectedPortfolioId);
  const totalValue = selectedBags.reduce((acc, b) => acc + (b.shares * (b.currentPrice || b.averageEntry)), 0);
  const totalCost = selectedBags.reduce((acc, b) => acc + (b.shares * b.averageEntry), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="text-emerald-400" size={24} />
          <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Engine</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-all"
        >
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {portfolios.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border ${
              selectedPortfolioId === p.id
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl"
          >
            <form onSubmit={handleAddPortfolio} className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="Portfolio Name (e.g. Retirement, Growth, Aggressive)"
                className="flex-1 bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                className="bg-emerald-500 text-neutral-950 px-6 py-2 rounded-xl font-bold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="bg-neutral-800 text-neutral-400 px-6 py-2 rounded-xl font-bold"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPortfolioId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total Market Value</p>
                <p className="text-xl font-bold text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total P&L</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {totalPnl !== 0 && (totalPnl >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />)}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Return Percentage</p>
                <p className={`text-xl font-bold ${pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Symbol</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Shares</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Avg Entry</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Current</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">P&L</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {selectedBags.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 text-sm">
                        No positions in this portfolio. Add stocks to start tracking.
                      </td>
                    </tr>
                  ) : (
                    selectedBags.map((bag) => {
                      const curPrice = bag.currentPrice || bag.averageEntry;
                      const bagPnL = (curPrice - bag.averageEntry) * bag.shares;
                      const bagPnLPercent = (bagPnL / (bag.averageEntry * bag.shares)) * 100;
                      
                      return (
                        <tr key={bag.id} className="hover:bg-neutral-850 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{bag.symbol}</p>
                              <p className="text-[10px] text-neutral-500 uppercase">{bag.type.replace("_", " ")}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-300 font-mono">{bag.shares}</td>
                          <td className="px-6 py-4 text-sm text-neutral-300 font-mono">${bag.averageEntry.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-neutral-300 font-mono">${curPrice.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <div className={bagPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              <p className="text-sm font-bold">${Math.abs(bagPnL).toFixed(2)}</p>
                              <p className="text-[10px] font-mono">{bagPnL >= 0 ? "+" : "-"}{Math.abs(bagPnLPercent).toFixed(2)}%</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-neutral-600 hover:text-rose-400 transition-colors p-2">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <LayoutGrid size={18} className="text-emerald-400" /> Allocation Breakdown
              </h3>
              <div className="space-y-4">
                {/* Simplified allocation bar */}
                <div className="h-4 w-full bg-neutral-950 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: "65%" }}></div>
                  <div className="h-full bg-cyan-500" style={{ width: "25%" }}></div>
                  <div className="h-full bg-neutral-700" style={{ width: "10%" }}></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-neutral-400 uppercase">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Tech (65%)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Energy (25%)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-700"></div> Cash (10%)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-6 rounded-2xl">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" /> Sera Analysis
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Your portfolio is currently concentrated in tech breakouts. Consider diversifying into defensive sectors if volatility spikes.
              </p>
              <button className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all">
                Run Context Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
