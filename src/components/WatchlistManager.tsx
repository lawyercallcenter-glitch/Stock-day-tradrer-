import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Eye, Bell, Activity, Sparkles } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp, where } from "firebase/firestore";
import { Watchlist, WatchlistItem, StockMetric } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const wlQuery = query(collection(db, "users", user.uid, "watchlists"));
    const unsubscribeWL = onSnapshot(wlQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Watchlist[];
      setWatchlists(data);
      if (data.length > 0 && !selectedWatchlistId) {
        setSelectedWatchlistId(data[0].id);
      }
      setLoading(false);
    });

    const itemsQuery = query(collection(db, "users", user.uid, "watchlist_items"));
    // Note: I'll update the blueprint path if needed, but using a separate collection for items is easier
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
      setItems(data);
    });

    return () => {
      unsubscribeWL();
      unsubscribeItems();
    };
  }, [user, selectedWatchlistId]);

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWatchlistName.trim()) return;

    try {
      const id = Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, "users", user.uid, "watchlists"), {
        id,
        name: newWatchlistName,
        createdAt: new Date().toISOString(),
      });
      setNewWatchlistName("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding watchlist:", err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchSymbol.trim() || !selectedWatchlistId) return;

    try {
      await addDoc(collection(db, "users", user.uid, "watchlist_items"), {
        symbol: searchSymbol.toUpperCase(),
        watchlistId: selectedWatchlistId,
        addedAt: new Date().toISOString(),
      });
      setSearchSymbol("");
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const selectedItems = items.filter(i => i.watchlistId === selectedWatchlistId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-white tracking-tight">Watchlist Command</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus size={18} /> New Watchlist
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {watchlists.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWatchlistId(w.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border ${
              selectedWatchlistId === w.id
                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            {w.name}
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
            <form onSubmit={handleAddWatchlist} className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="Watchlist Name (e.g. AI Stocks, Penny Scalps)"
                className="flex-1 bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                className="bg-cyan-500 text-neutral-950 px-6 py-2 rounded-xl font-bold"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <form onSubmit={handleAddItem} className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Quick add symbol (e.g. AAPL, BTC)..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/30"
                />
              </form>
              <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500 uppercase">
                <span>Items: {selectedItems.length}</span>
                <span className="text-cyan-500">Live Update Active</span>
              </div>
            </div>

            <div className="divide-y divide-neutral-800/50">
              {selectedItems.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <Activity className="mx-auto text-neutral-800 mb-4" size={48} />
                  <p className="text-neutral-500 text-sm">Watchlist is empty. Search and add symbols to track.</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-6 hover:bg-neutral-850 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-neutral-950 rounded-xl flex items-center justify-center font-bold text-white border border-neutral-800">
                        {item.symbol[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{item.symbol}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Added {new Date(item.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-sm font-mono text-neutral-400">$---.--</p>
                        <p className="text-[10px] font-mono text-neutral-600">Pending Feed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-neutral-600 hover:text-cyan-400 transition-colors p-2 rounded-lg bg-neutral-950">
                          <Bell size={16} />
                        </button>
                        <button className="text-neutral-600 hover:text-rose-400 transition-colors p-2 rounded-lg bg-neutral-950">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-400" /> Market Context
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">S&P 500</span>
                  <span className="text-[10px] font-mono text-emerald-400">+0.42%</span>
                </div>
                <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[70%]"></div>
                </div>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Nasdaq</span>
                  <span className="text-[10px] font-mono text-emerald-400">+1.15%</span>
                </div>
                <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" /> Watchlist Intel
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Sera detected high relative volume in 3 of your watchlisted stocks. Potential breakout triggers are forming.
            </p>
            <button className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all">
              Scan for Catalysts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
