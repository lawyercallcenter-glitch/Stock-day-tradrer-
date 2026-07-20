import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, getDocs, query, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { User } from "firebase/auth";
import { BookOpen, Save, TrendingUp } from "lucide-react";

interface TradeJournalFormProps {
  user: User | null;
  initialTicker?: string;
  initialPrice?: number;
}

export default function TradeJournalForm({ user, initialTicker = "", initialPrice = 0 }: TradeJournalFormProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [price, setPrice] = useState(initialPrice.toString());
  const [qty, setQty] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [notes, setNotes] = useState("");
  const [sentiment, setSentiment] = useState("50");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const q = query(collection(db, `users/${user.uid}/journal`), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach((docRef) => data.push(docRef.data()));
      setHistory(data);
    };
    fetchHistory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please connect your workspace to save journal entries.");
      return;
    }
    setLoading(true);

    const entryId = `journal-${Date.now()}`;
    const path = `users/${user.uid}/journal/${entryId}`;

    try {
      await setDoc(doc(db, path), {
        ticker: ticker.toUpperCase(),
        price: parseFloat(price),
        qty: parseInt(qty),
        type,
        notes,
        sentiment: parseInt(sentiment),
        createdAt: new Date().toISOString(),
      });
      setTicker("");
      setPrice("");
      setQty("");
      setNotes("");
      setSentiment("50");
      alert("Trade journaled successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left animate-fadeIn space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-400" /> Trade Journal
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Ticker (e.g. NVDA)" value={ticker} onChange={(e) => setTicker(e.target.value)} required className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white" />
            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white" />
            <input type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} required className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white" />
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div className="space-y-1">
             <label className="text-xs text-neutral-400">Sentiment Score (0-100)</label>
             <input type="range" min="0" max="100" value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="w-full" />
          </div>
          <textarea placeholder="Trade notes/strategy..." value={notes} onChange={(e) => setNotes(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white h-24" />
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-2 rounded-xl transition-all">
            <Save size={16} /> {loading ? "Saving..." : "Save Trade"}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="h-64 bg-neutral-950 rounded-xl border border-neutral-800 p-4">
          <h4 className="text-sm font-bold text-neutral-300 mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400"/> Sentiment vs P&L History</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="createdAt" hide />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="sentiment" stroke="#10b981" />
              <Line yAxisId="right" type="monotone" dataKey="price" stroke="#f43f5e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
