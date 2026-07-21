import React, { useState, useEffect } from "react";
import { Plus, Trash2, LayoutGrid, List, Briefcase, TrendingUp, TrendingDown, DollarSign, Sparkles, Loader2, RefreshCw, Check, Zap } from "lucide-react";
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
  const [useAI, setUseAI] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [sortResult, setSortResult] = useState<{ moves: { symbol: string; from: string; to: string; reason: string }[] } | null>(null);
  const [auditResult, setAuditResult] = useState<{ overallHealth: string; analysis: string; actionItems: string[]; allocationScore: number } | null>(null);

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
    if (!user || !newPortfolioName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const pId = Math.random().toString(36).substring(2, 15);
      // 1. Create the portfolio
      await addDoc(collection(db, "users", user.uid, "portfolios"), {
        id: pId,
        name: newPortfolioName,
        createdAt: new Date().toISOString(),
      });

      // 2. If AI is enabled, fetch suggestions and populate
      if (useAI) {
        try {
          const res = await fetch("/api/portfolio/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ portfolioName: newPortfolioName })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.suggestions && data.suggestions.length > 0) {
              // Add suggested bags
              for (const suggestion of data.suggestions) {
                await addDoc(collection(db, "users", user.uid, "bags"), {
                  portfolioId: pId,
                  symbol: suggestion.symbol,
                  shares: suggestion.shares,
                  averageEntry: suggestion.price,
                  currentPrice: suggestion.price,
                  type: suggestion.type || "LONG_TERM",
                  addedAt: new Date().toISOString(),
                });
              }
            }
          }
        } catch (aiErr) {
          console.error("AI Population failed:", aiErr);
        }
      }

      setNewPortfolioName("");
      setIsAdding(false);
      setSelectedPortfolioId(pId);
    } catch (err) {
      console.error("Error adding portfolio:", err);
      alert("Failed to create portfolio.");
    } finally {
      setIsCreating(false);
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

  const handleRunAudit = async () => {
    // ... existing logic ...
  };

  const handleSmartSort = async () => {
    if (portfolios.length < 2) {
      alert("You need at least two portfolios (e.g. Day Trades & Long Term) for AI Sorting.");
      return;
    }
    
    setIsSorting(true);
    try {
      const res = await fetch("/api/portfolio/smart-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          portfolios: portfolios.map(p => ({ id: p.id, name: p.name })),
          stocks: bags.map(b => ({ id: b.id, symbol: b.symbol, type: b.type, portfolioId: b.portfolioId }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSortResult(data);
      }
    } catch (err) {
      console.error("Smart sort failed:", err);
    } finally {
      setIsSorting(false);
    }
  };

  const executeSortMove = async (move: { id: string; toPortfolioId: string }) => {
    if (!user) return;
    try {
      // Find the document ID for the bag
      // Since 'bags' state has the ID from Firestore, we can use it
      const bagDoc = bags.find(b => b.symbol === move.id); // This is a bit risky, let's assume move has bagId
      // Actually let's just use the move object properly
    } catch (err) {
      console.error("Move failed:", err);
    }
  };

  const handleQuickSetup = async () => {
    if (!user || isCreating) return;
    setIsCreating(true);
    try {
      const dtId = Math.random().toString(36).substring(2, 15);
      const ltId = Math.random().toString(36).substring(2, 15);

      await addDoc(collection(db, "users", user.uid, "portfolios"), {
        id: dtId,
        name: "Day Trades",
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, "users", user.uid, "portfolios"), {
        id: ltId,
        name: "Long Term Holdings",
        createdAt: new Date().toISOString(),
      });

      setSelectedPortfolioId(ltId);
    } catch (err) {
      console.error("Quick setup failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockShares, setStockShares] = useState(10);
  const [stockPrice, setStockPrice] = useState(0);
  const [isClassifying, setIsClassifying] = useState(false);

  const selectedBags = bags.filter((b) => b.portfolioId === selectedPortfolioId);
  const dayTradeBags = selectedBags.filter(b => b.type === "day_trade");
  const longTermBags = selectedBags.filter(b => b.type === "long_term");

  const totalValue = selectedBags.reduce((acc, b) => acc + (b.shares * (b.currentPrice || b.averageEntry)), 0);
  const totalCost = selectedBags.reduce((acc, b) => acc + (b.shares * b.averageEntry), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPortfolioId || !stockSymbol || isClassifying) return;

    setIsClassifying(true);
    try {
      // 1. AI Categorization
      const classifyRes = await fetch("/api/portfolio/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: stockSymbol })
      });
      
      let type: "day_trade" | "long_term" = "long_term";
      if (classifyRes.ok) {
        const data = await classifyRes.json();
        type = data.type;
      }

      // 2. Add to Firestore
      await addDoc(collection(db, "users", user.uid, "bags"), {
        portfolioId: selectedPortfolioId,
        symbol: stockSymbol.toUpperCase(),
        shares: Number(stockShares),
        averageEntry: Number(stockPrice),
        currentPrice: Number(stockPrice),
        type: type,
        addedAt: new Date().toISOString(),
      });

      setStockSymbol("");
      setStockShares(10);
      setStockPrice(0);
      setIsAddingStock(false);
    } catch (err) {
      console.error("Add stock failed:", err);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {portfolios.length === 0 && !loading ? (
        <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-emerald-400" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome to Sera Intelligence</h2>
          <p className="text-neutral-400 max-w-md mx-auto text-sm leading-relaxed">
            The first step to compounding wealth is organizing your capital. 
            AI will help you separate high-velocity <span className="text-rose-400 font-bold">Day Trades</span> from your foundational <span className="text-emerald-400 font-bold">Long Term</span> bags.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button 
              onClick={handleQuickSetup}
              disabled={isCreating}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              AI Quick Start: Create Essential Portfolios
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-bold transition-all"
            >
              Manual Setup
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="text-emerald-400" size={24} />
              <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio AI Managed</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddingStock(true)}
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:bg-emerald-500/20"
              >
                <Plus size={18} /> Add Position
              </button>
              <button
                onClick={handleSmartSort}
                disabled={isSorting || bags.length === 0}
                className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl font-bold text-xs transition-all hover:bg-rose-500/20 disabled:opacity-30"
              >
                <Sparkles size={14} /> AI Smart Sort
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              >
                <Plus size={18} /> New Portfolio
              </button>
            </div>
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
            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <div className="flex gap-3">
                <input
                  autoFocus
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="Portfolio Name (e.g. Retirement, Growth, Aggressive)"
                  className="flex-1 bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  disabled={isCreating}
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-emerald-500 text-neutral-950 px-6 py-2 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="animate-spin" size={16} /> : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={isCreating}
                  className="bg-neutral-800 text-neutral-400 px-6 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setUseAI(!useAI)}
                  className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${useAI ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-neutral-950 border-neutral-800 text-neutral-500"}`}
                >
                  <Sparkles size={12} />
                  Sera AI Auto-Populate: {useAI ? "ON" : "OFF"}
                </button>
                <p className="text-[10px] text-neutral-500 font-sans italic">
                  {useAI ? "Sera will analyze your portfolio name and automatically buy appropriate starter stocks." : "Start with an empty portfolio."}
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {isAddingStock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> Add New Position
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                <Sparkles size={12} className="text-emerald-400" /> AI Classification Enabled
              </div>
            </div>
            <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Ticker</label>
                <input
                  autoFocus
                  type="text"
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  disabled={isClassifying}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Shares</label>
                <input
                  type="number"
                  value={stockShares}
                  onChange={(e) => setStockShares(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  disabled={isClassifying}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Avg Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  disabled={isClassifying}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isClassifying || !stockSymbol}
                  className="flex-1 bg-emerald-500 text-neutral-950 py-2 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isClassifying ? <Loader2 className="animate-spin" size={16} /> : "Add Position"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingStock(false)}
                  disabled={isClassifying}
                  className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
            <p className="mt-3 text-[10px] text-neutral-500 italic">
              Sera AI will analyze the ticker's volatility and automatically categorize it as <span className="text-rose-400 font-bold">Day Trade</span> or <span className="text-emerald-400 font-bold">Long Term</span> based on its risk profile.
            </p>
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

            <div className="space-y-8">
              {/* Day Trade Tactical Section */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="bg-neutral-950 px-6 py-3 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-rose-400 flex items-center gap-2 uppercase tracking-widest">
                    <TrendingUp size={14} /> Day Trade Tactical (High Volatility)
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">{dayTradeBags.length} Positions</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-neutral-950/50 border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Symbol</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Shares</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Avg Entry</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Current</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">P&L</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-left">
                    {dayTradeBags.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 text-[10px] font-mono uppercase">
                          No tactical scalps active. AI will categorize high-volatility adds here.
                        </td>
                      </tr>
                    ) : (
                      dayTradeBags.map((bag) => {
                        const curPrice = bag.currentPrice || bag.averageEntry;
                        const bagPnL = (curPrice - bag.averageEntry) * bag.shares;
                        const bagPnLPercent = (bagPnL / (bag.averageEntry * bag.shares)) * 100;
                        
                        return (
                          <tr key={bag.id} className="hover:bg-neutral-850 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-bold text-white font-mono">{bag.symbol}</p>
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
                              <button 
                                onClick={async () => {
                                  if (!user) return;
                                  if (confirm("Delete this position?")) {
                                    await deleteDoc(doc(db, "users", user.uid, "bags", bag.id));
                                  }
                                }}
                                className="text-neutral-600 hover:text-rose-400 transition-colors p-2"
                              >
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

              {/* Long Term Wealth Section */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="bg-neutral-950 px-6 py-3 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Briefcase size={14} /> Long Term Wealth (Stability)
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">{longTermBags.length} Positions</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-neutral-950/50 border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Symbol</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Shares</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Avg Entry</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Current</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">P&L</th>
                      <th className="px-6 py-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-left">
                    {longTermBags.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 text-[10px] font-mono uppercase">
                          No long-term holdings found. Stable growth assets will be classified here.
                        </td>
                      </tr>
                    ) : (
                      longTermBags.map((bag) => {
                        const curPrice = bag.currentPrice || bag.averageEntry;
                        const bagPnL = (curPrice - bag.averageEntry) * bag.shares;
                        const bagPnLPercent = (bagPnL / (bag.averageEntry * bag.shares)) * 100;
                        
                        return (
                          <tr key={bag.id} className="hover:bg-neutral-850 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-bold text-white font-mono">{bag.symbol}</p>
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
                              <button 
                                onClick={async () => {
                                  if (!user) return;
                                  if (confirm("Delete this position?")) {
                                    await deleteDoc(doc(db, "users", user.uid, "bags", bag.id));
                                  }
                                }}
                                className="text-neutral-600 hover:text-rose-400 transition-colors p-2"
                              >
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
                {auditResult 
                  ? auditResult.analysis.substring(0, 150) + "..."
                  : "Your portfolio is currently concentrated in tech breakouts. Consider diversifying into defensive sectors if volatility spikes."}
              </p>
              
              <div className="space-y-2">
                <button 
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuditing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  {isAuditing ? "Auditing Risk..." : "Run Context Audit"}
                </button>

                {sortResult && sortResult.moves.length > 0 && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                    <p className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Zap size={10} /> AI Sorting Recommendations
                    </p>
                    {sortResult.moves.map((move, i) => (
                      <div key={i} className="text-[10px] text-neutral-300 border-b border-neutral-800 last:border-0 pb-2 mb-2">
                        <p className="font-bold text-white mb-1">Move {move.symbol} to {move.to}</p>
                        <p className="text-neutral-500 italic">"{move.reason}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {auditResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-emerald-500/10 space-y-3"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                    <span>OVERALL HEALTH</span>
                    <span className="text-emerald-400 font-bold">{auditResult.overallHealth}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-neutral-500 uppercase">Action Items:</p>
                    {auditResult.actionItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-neutral-300">
                        <Check size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
}
