import React, { useState, useEffect } from "react";
import { StockBagItem, TradeLog, StockMetric } from "../types";
import { PlusCircle, Wallet, Award, History, HelpCircle, Trash2, ArrowUpRight, TrendingUp, RefreshCw, Briefcase } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import PortfolioRebalancer from "./PortfolioRebalancer";

interface TradeBagsManagerProps {
  presets: StockMetric[];
  user: any; // Firebase User or null
  accessToken?: string | null;
}

export default function TradeBagsManager({ presets, user, accessToken }: TradeBagsManagerProps) {
  const [bags, setBags] = useState<StockBagItem[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Portfolio Sub-tabs: "day_trade" or "long_term"
  const [portfolioView, setPortfolioView] = useState<"day_trade" | "long_term">("day_trade");

  // Form Inputs State
  const [symbol, setSymbol] = useState("NVDA");
  const [type, setType] = useState<"day_trade" | "long_term">("day_trade");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState(10);
  const [price, setPrice] = useState(135.42);
  const [notes, setNotes] = useState("");

  // Sync form strategy selection with active portfolio sub-tab
  useEffect(() => {
    setType(portfolioView);
  }, [portfolioView]);

  // Sync data on User auth change
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setSyncing(true);
        try {
          // Fetch durable bags from Firestore
          const bagsPath = `users/${user.uid}/bags`;
          let bagsSnap;
          try {
            bagsSnap = await getDocs(collection(db, bagsPath));
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, bagsPath);
            return;
          }
          const loadedBags: StockBagItem[] = [];
          bagsSnap.forEach((docRef) => {
            const data = docRef.data();
            // Synthesize local fields like currentPrice and PNL based on live preset pricing
            const matched = presets.find((p) => p.symbol === data.symbol.toUpperCase());
            const curPrice = matched ? matched.price : data.averageEntry;
            const pnl = (curPrice - data.averageEntry) * data.shares;
            const pnlPercent = data.averageEntry > 0 ? ((curPrice - data.averageEntry) / data.averageEntry) * 100 : 0;

            loadedBags.push({
              id: docRef.id,
              symbol: data.symbol,
              name: data.name,
              type: data.type,
              shares: data.shares,
              averageEntry: data.averageEntry,
              purchaseDate: data.purchaseDate,
              currentPrice: curPrice,
              pnl: parseFloat(pnl.toFixed(2)),
              pnlPercent: parseFloat(pnlPercent.toFixed(2)),
            });
          });

          // Fetch chronological logs from Firestore
          const logsPath = `users/${user.uid}/logs`;
          let logsSnap;
          try {
            logsSnap = await getDocs(collection(db, logsPath));
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, logsPath);
            return;
          }
          const loadedLogs: TradeLog[] = [];
          logsSnap.forEach((docRef) => {
            const data = docRef.data();
            loadedLogs.push({
              id: docRef.id,
              symbol: data.symbol,
              type: data.type,
              action: data.action,
              shares: data.shares,
              price: data.price,
              timestamp: data.timestamp,
              notes: data.notes || "",
            });
          });

          // Sort logs chronologically descending
          loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          setBags(loadedBags);
          setLogs(loadedLogs);
        } catch (err) {
          console.error("Firestore loading error:", err);
        } finally {
          setSyncing(false);
        }
      } else {
        // Fallback offline localStorage loading
        const cachedBags = localStorage.getItem("stock_bags");
        const cachedLogs = localStorage.getItem("stock_trade_logs");
        if (cachedBags) setBags(JSON.parse(cachedBags));
        if (cachedLogs) setLogs(JSON.parse(cachedLogs));
      }
    };

    loadUserData();
  }, [user, presets]);

  // Handle adding trade transaction
  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || shares <= 0 || price <= 0) return;

    const matchedPreset = presets.find((p) => p.symbol === symbol.toUpperCase());
    const companyName = matchedPreset ? matchedPreset.name : `${symbol.toUpperCase()} Asset`;
    const curPrice = matchedPreset ? matchedPreset.price : price;

    const logId = `log-${Date.now()}`;
    const newLog: TradeLog = {
      id: logId,
      symbol: symbol.toUpperCase(),
      type,
      action,
      shares,
      price,
      timestamp: new Date().toISOString(),
      notes: notes || `${action} transaction of ${shares} shares.`,
    };

    // Calculate updated Bags list
    let updatedBags = [...bags];
    const existingBagIndex = bags.findIndex(
      (b) => b.symbol === symbol.toUpperCase() && b.type === type
    );

    let targetBag: StockBagItem | null = null;
    let removeBagId: string | null = null;

    if (existingBagIndex > -1) {
      const currentBag = bags[existingBagIndex];
      if (action === "BUY") {
        const totalCost = currentBag.shares * currentBag.averageEntry + shares * price;
        const totalShares = currentBag.shares + shares;
        const newAvg = totalCost / totalShares;
        const pnl = (curPrice - newAvg) * totalShares;
        const pnlPercent = ((curPrice - newAvg) / newAvg) * 100;

        targetBag = {
          ...currentBag,
          shares: totalShares,
          averageEntry: parseFloat(newAvg.toFixed(2)),
          currentPrice: curPrice,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        };
        updatedBags[existingBagIndex] = targetBag;
      } else {
        // SELL action
        const remainingShares = Math.max(0, currentBag.shares - shares);
        if (remainingShares === 0) {
          removeBagId = currentBag.id;
          updatedBags = updatedBags.filter((_, idx) => idx !== existingBagIndex);
        } else {
          const pnl = (curPrice - currentBag.averageEntry) * remainingShares;
          const pnlPercent = ((curPrice - currentBag.averageEntry) / currentBag.averageEntry) * 100;
          
          targetBag = {
            ...currentBag,
            shares: remainingShares,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPercent: parseFloat(pnlPercent.toFixed(2)),
          };
          updatedBags[existingBagIndex] = targetBag;
        }
      }
    } else {
      if (action === "BUY") {
        const bagId = `bag-${Date.now()}`;
        const pnl = (curPrice - price) * shares;
        const pnlPercent = ((curPrice - price) / price) * 100;
        
        targetBag = {
          id: bagId,
          symbol: symbol.toUpperCase(),
          name: companyName,
          type,
          shares,
          averageEntry: price,
          currentPrice: curPrice,
          purchaseDate: new Date().toISOString().split("T")[0],
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        };
        updatedBags.push(targetBag);
      }
    }

    const updatedLogs = [newLog, ...logs];

    // PERSIST DATA (Firestore if logged in, local if offline)
    if (user) {
      try {
        // 1. Save Log entry
        const logPath = `users/${user.uid}/logs/${logId}`;
        await setDoc(doc(db, logPath), {
          symbol: newLog.symbol,
          type: newLog.type,
          action: newLog.action,
          shares: newLog.shares,
          price: newLog.price,
          timestamp: newLog.timestamp,
          notes: newLog.notes,
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, logPath));

        // 2. Save/Delete Bag entry
        if (removeBagId) {
          const bagDelPath = `users/${user.uid}/bags/${removeBagId}`;
          await deleteDoc(doc(db, bagDelPath)).catch((err) =>
            handleFirestoreError(err, OperationType.DELETE, bagDelPath)
          );
        } else if (targetBag) {
          const bagSavePath = `users/${user.uid}/bags/${targetBag.id}`;
          await setDoc(doc(db, bagSavePath), {
            symbol: targetBag.symbol,
            name: targetBag.name,
            type: targetBag.type,
            shares: targetBag.shares,
            averageEntry: targetBag.averageEntry,
            purchaseDate: targetBag.purchaseDate,
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, bagSavePath));
        }
      } catch (err) {
        console.error("Firestore persistence error:", err);
      }
    } else {
      // Local fallback storage
      localStorage.setItem("stock_bags", JSON.stringify(updatedBags));
      localStorage.setItem("stock_trade_logs", JSON.stringify(updatedLogs));
    }

    setBags(updatedBags);
    setLogs(updatedLogs);
    setNotes("");

    // Reset default price entry
    const match = presets.find((p) => p.symbol === symbol.toUpperCase());
    if (match) {
      setPrice(match.price);
    }
  };

  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    const match = presets.find((p) => p.symbol === sym.toUpperCase());
    if (match) {
      setPrice(match.price);
    }
  };

  const clearLogsAndBags = async () => {
    if (window.confirm("Are you sure you want to purge all custom trade logs and bags?")) {
      if (user) {
        try {
          // Clear bags
          const bagsPath = `users/${user.uid}/bags`;
          const bagsSnap = await getDocs(collection(db, bagsPath));
          bagsSnap.forEach(async (docRef) => {
            await deleteDoc(doc(db, bagsPath, docRef.id));
          });

          // Clear logs
          const logsPath = `users/${user.uid}/logs`;
          const logsSnap = await getDocs(collection(db, logsPath));
          logsSnap.forEach(async (docRef) => {
            await deleteDoc(doc(db, logsPath, docRef.id));
          });
        } catch (err) {
          console.error("Error purging Firestore data:", err);
        }
      } else {
        localStorage.removeItem("stock_bags");
        localStorage.removeItem("stock_trade_logs");
      }
      setBags([]);
      setLogs([]);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportToSheets = async () => {
    if (!accessToken) {
      alert("Please connect your Google Workspace account to export to Sheets.");
      return;
    }
    
    const confirmed = window.confirm("Create a new Google Sheet in your Drive with your portfolio data?");
    if (!confirmed) return;

    setExporting(true);
    try {
      // Create new spreadsheet
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: `Portfolio Export - ${new Date().toISOString().split("T")[0]}`,
          },
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create spreadsheet.");
      const spreadsheet = await createRes.json();
      const spreadsheetId = spreadsheet.spreadsheetId;

      // Prepare data
      const rows = bags.filter(b => b.type === portfolioView).map(bag => [
        bag.symbol,
        bag.name,
        bag.shares.toString(),
        bag.averageEntry.toString(),
        bag.currentPrice.toString(),
        bag.pnl.toString(),
        bag.pnlPercent.toString() + "%",
      ]);

      const headerRow = ["Symbol", "Name", "Shares", "Average Entry", "Current Price", "PNL ($)", "PNL (%)"];
      
      const updateData = {
        range: "Sheet1!A1:G",
        majorDimension: "ROWS",
        values: [headerRow, ...rows],
      };

      // Write data
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!updateRes.ok) throw new Error("Failed to update spreadsheet data.");
      
      alert(`Export successful! You can view it in your Google Drive.`);
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, "_blank");

    } catch (err) {
      console.error(err);
      alert("Error exporting to sheets.");
    } finally {
      setExporting(false);
    }
  };

  // Math Analytics Calculations
  const dayTradingBags = bags.filter((b) => b.type === "day_trade");
  const longTermBags = bags.filter((b) => b.type === "long_term");

  const totalDayTradeValue = dayTradingBags.reduce((acc, b) => acc + b.shares * b.currentPrice, 0);
  const totalLongTermValue = longTermBags.reduce((acc, b) => acc + b.shares * b.currentPrice, 0);

  const totalDayTradePnl = dayTradingBags.reduce((acc, b) => acc + b.pnl, 0);
  const totalLongTermPnl = longTermBags.reduce((acc, b) => acc + b.pnl, 0);

  const dayTradePnlPercent = totalDayTradeValue > 0 ? (totalDayTradePnl / (totalDayTradeValue - totalDayTradePnl)) * 100 : 0;
  const longTermPnlPercent = totalLongTermValue > 0 ? (totalLongTermPnl / (totalLongTermValue - totalLongTermPnl)) * 100 : 0;

  const closedLogs = logs.filter((l) => l.type === "day_trade");
  const winCount = closedLogs.filter((l) => {
    const currentMetric = presets.find((p) => p.symbol === l.symbol);
    if (!currentMetric) return false;
    return l.action === "BUY" ? currentMetric.price > l.price : currentMetric.price < l.price;
  }).length;
  const simulatedWinRate = closedLogs.length > 0 ? (winCount / closedLogs.length) * 100 : 75;

  return (
    <div id="bags-and-portfolio-system" className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      
      {/* Transaction Entry Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800/40">
            <h4 className="font-bold text-lg text-white font-sans flex items-center gap-2">
              <PlusCircle className="text-emerald-400" size={20} />
              Log Transaction
            </h4>
            <span className="font-mono text-neutral-500 text-xs">TERM: REAL BAGS</span>
          </div>

          <form onSubmit={handleAddTrade} className="space-y-4 text-left">
            {/* Ticker Selection */}
            <div>
              <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                Asset Symbol
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="col-span-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                  placeholder="AAPL"
                />
                <select
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  value={symbol}
                  className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-xs font-mono text-neutral-300 focus:outline-none"
                >
                  <option disabled value="">Presets</option>
                  {presets.map((p) => (
                    <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Strategy & Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                  Bag Strategy
                </label>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setType("day_trade")}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all ${type === "day_trade" ? "bg-neutral-850 text-emerald-400 font-bold" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Day Trade
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("long_term")}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all ${type === "long_term" ? "bg-neutral-850 text-emerald-400 font-bold" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Long Term
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                  Transaction Mode
                </label>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setAction("BUY")}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold tracking-wider transition-all ${action === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("SELL")}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold tracking-wider transition-all ${action === "SELL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            {/* Shares & Price Basis */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                  Share Vol
                </label>
                <input
                  type="number"
                  value={shares}
                  min={1}
                  onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                  Price Basis ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  min={0.01}
                  onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Trade Logic Notes */}
            <div>
              <label className="block font-mono text-[11px] text-neutral-400 uppercase tracking-wider mb-1.5">
                Technical Catalyst / Entry Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-16 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Entering on bull flag consolidation support"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-neutral-950 font-bold py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all duration-150 cursor-pointer"
            >
              Commit Bag Entry
            </button>
          </form>
        </div>

        <button
          onClick={clearLogsAndBags}
          className="mt-6 flex items-center justify-center gap-2 text-neutral-600 hover:text-rose-400 transition-colors text-xs font-mono border border-neutral-800/40 hover:border-rose-500/20 py-2 rounded-xl cursor-pointer"
        >
          <Trash2 size={13} /> Purge All Portfolio Memory
        </button>
        <div className="mt-6">
          <PortfolioRebalancer portfolio={bags} />
        </div>
      </div>

      {/* Portfolio Bento Analytics Panels */}
      <div className="lg:col-span-2 flex flex-col justify-between bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div>
          {/* Section Header with Tab Toggles */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800/40">
            <div className="text-left">
              <h4 className="font-bold text-lg text-white font-sans flex items-center gap-2">
                <Wallet className="text-emerald-400" size={20} />
                My Portfolio Hub
              </h4>
              <p className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">Real assets & tactical compounding</p>
            </div>
            
            {/* Day Trade / Long Term Tab Switcher */}
            <div className="flex flex-col md:flex-row gap-3 self-start md:self-auto">
              <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPortfolioView("day_trade")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${portfolioView === "day_trade" ? "bg-neutral-850 text-emerald-400 border border-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  Day Trading
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioView("long_term")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${portfolioView === "long_term" ? "bg-neutral-850 text-emerald-400 border border-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  Long-Term
                </button>
              </div>

              <button
                onClick={handleExportToSheets}
                disabled={exporting}
                className="px-4 py-1.5 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono tracking-wider uppercase rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Briefcase size={14} />
                {exporting ? "Exporting..." : "Export Sheets"}
              </button>
            </div>
          </div>

          {syncing && (
            <div className="py-24 text-center animate-pulse">
              <RefreshCw className="animate-spin mx-auto text-emerald-400 mb-2" size={24} />
              <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">Syncing secure bags with Firestore...</p>
            </div>
          )}

          {!syncing && (
            <>
              {/* Focused Summary Card based on Active Tab */}
              <div className="mb-6">
                {portfolioView === "day_trade" ? (
                  /* Day Trading Portfolio Card */
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 blur-2xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400 tracking-wider font-sans uppercase">Day Trading Real Bags</span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase tracking-wider">ACTIVE SCALPS</span>
                      </div>
                      <p className="text-3xl font-bold font-mono text-white mt-2">${totalDayTradeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800/40 pt-4 mt-5">
                      <div>
                        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Intraday P&L</p>
                        <p className={`font-mono font-bold text-base flex items-center ${totalDayTradePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {totalDayTradePnl >= 0 ? "+" : ""}${totalDayTradePnl.toFixed(2)} ({dayTradePnlPercent.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Estimated Win Rate</p>
                        <p className="font-mono font-bold text-base text-emerald-400 flex items-center justify-end gap-1">
                          <Award size={16} /> {simulatedWinRate.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Long-Term Portfolio Card */
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 blur-2xl rounded-full" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400 tracking-wider font-sans uppercase">Long-Term Wealth Compounders</span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">ACCUMULATING</span>
                      </div>
                      <p className="text-3xl font-bold font-mono text-white mt-2">${totalLongTermValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800/40 pt-4 mt-5">
                      <div>
                        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Unrealized Wealth Growth</p>
                        <p className={`font-mono font-bold text-base flex items-center ${totalLongTermPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {totalLongTermPnl >= 0 ? "+" : ""}${totalLongTermPnl.toFixed(2)} ({longTermPnlPercent.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Strategic Holdings</p>
                        <p className="font-mono font-bold text-base text-neutral-300">
                          {longTermBags.length} Core Asset{longTermBags.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Tickers Positions List Filtered by Sub-tab */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 overflow-hidden text-left">
                <h5 className="font-bold text-xs text-neutral-400 tracking-wider uppercase mb-3 flex items-center gap-1.5 font-sans">
                  <Briefcase size={14} className="text-emerald-400" /> 
                  Active {portfolioView === "day_trade" ? "Day Trading Scalps" : "Long-Term Investments"}
                </h5>

                {bags.filter((b) => b.type === portfolioView).length === 0 ? (
                  <div className="py-12 text-center">
                    <HelpCircle className="mx-auto text-neutral-600 mb-2" size={24} />
                    <p className="text-xs text-neutral-500">No active {portfolioView === "day_trade" ? "day trades" : "long term investments"} registered.</p>
                    <p className="text-[10px] font-mono text-neutral-600 mt-1 uppercase">Log a transaction to instantiate tracking.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-500 font-mono tracking-wider text-[10px] uppercase">
                          <th className="pb-2">Asset</th>
                          <th className="pb-2 text-right">Shares</th>
                          <th className="pb-2 text-right">Avg Entry</th>
                          <th className="pb-2 text-right">Current Price</th>
                          <th className="pb-2 text-right">Net P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/40">
                        {bags
                          .filter((b) => b.type === portfolioView)
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="py-2.5 font-bold font-mono text-white flex flex-col">
                                {b.symbol}
                                <span className="text-[10px] font-medium font-sans text-neutral-500 truncate max-w-[120px]">{b.name}</span>
                              </td>
                              <td className="py-2.5 text-right font-mono text-neutral-300">{b.shares}</td>
                              <td className="py-2.5 text-right font-mono text-neutral-300">${b.averageEntry.toFixed(2)}</td>
                              <td className="py-2.5 text-right font-mono text-white font-bold">${b.currentPrice.toFixed(2)}</td>
                              <td className={`py-2.5 text-right font-mono font-bold ${b.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {b.pnl >= 0 ? "+" : ""}${b.pnl.toFixed(2)}
                                <span className="block text-[9px] font-semibold">{b.pnlPercent >= 0 ? "+" : ""}{b.pnlPercent.toFixed(1)}%</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Filtered History / Transactions Logs Peek */}
        <div className="mt-6 pt-4 border-t border-neutral-800/60 text-left">
          <div className="flex items-center justify-between text-neutral-400 font-bold text-xs uppercase font-sans mb-3">
            <div className="flex items-center gap-1.5">
              <History size={14} className="text-emerald-400" />
              {portfolioView === "day_trade" ? "Day Trade Log history" : "Long Term Accumulation Log"}
            </div>
            <span className="font-mono text-[9px] text-neutral-600 uppercase">Filtered Logs</span>
          </div>
          <div className="space-y-2">
            {logs
              .filter((l) => l.type === portfolioView)
              .slice(0, 3)
              .map((l) => (
                <div key={l.id} className="bg-neutral-950 border border-neutral-850 p-2.5 rounded-lg flex items-center justify-between text-xs hover:border-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${l.action === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {l.action}
                    </span>
                    <div className="text-left">
                      <span className="font-bold font-mono text-white text-sm">{l.symbol}</span>
                      <span className="text-[10px] text-neutral-500 font-mono ml-2">@{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-neutral-300">{l.shares} shares @ ${l.price.toFixed(2)}</span>
                    <span className="block text-[10px] text-neutral-500 italic max-w-[200px] truncate">{l.notes}</span>
                  </div>
                </div>
              ))}
            {logs.filter((l) => l.type === portfolioView).length === 0 && (
              <p className="text-xs text-neutral-600 font-mono text-center py-2 uppercase">No transactions logged in this strategic container.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
