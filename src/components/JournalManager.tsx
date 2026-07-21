import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Calendar, Tag, Trash2, Save, Sparkles, Smile, Meh, Frown } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy } from "firebase/firestore";
import { JournalEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function JournalManager() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New Entry State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [symbols, setSymbols] = useState("");
  const [sentiment, setSentiment] = useState<"Bullish" | "Bearish" | "Neutral">("Neutral");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const journalQuery = query(
      collection(db, "users", user.uid, "journal"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(journalQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JournalEntry[];
      setEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    try {
      const symbolArray = symbols.split(",").map(s => s.trim().toUpperCase()).filter(s => s);
      await addDoc(collection(db, "users", user.uid, "journal"), {
        title,
        content,
        symbols: symbolArray,
        sentiment,
        createdAt: new Date().toISOString(),
      });
      
      // Reset
      setTitle("");
      setContent("");
      setSymbols("");
      setSentiment("Neutral");
      setIsAdding(false);
    } catch (err) {
      console.error("Error saving journal entry:", err);
    }
  };

  const generateAIEntry = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/journal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbols,
          sentiment,
          prompt: content || "Post-market review of active session"
        })
      });
      
      if (!response.ok) {
        let errorMsg = "Generation failed";
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorMsg;
          }
        } catch (e) {
          errorMsg = `Generation failed with status ${response.status}`;
        }
        throw new Error(errorMsg);
      }
      
      const text = await response.text();
      if (!text) throw new Error("Sera was unable to generate a draft. Empty response.");
      const data = JSON.parse(text);
      
      setTitle(data.title || title);
      setContent(data.content || content);
      setSentiment(data.sentiment || sentiment);
    } catch (err: any) {
      console.error("AI Generation error:", err);
      alert("Sera AI Assistant Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const autoApproveDraft = async () => {
    setIsAdding(true);
    await generateAIEntry();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user || !window.confirm("Delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "journal", id));
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-amber-400" size={24} />
          <h2 className="text-2xl font-bold text-white tracking-tight">Journal AI Analyzed</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoApproveDraft}
            className="flex items-center gap-2 bg-neutral-900 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:bg-amber-500/10 active:scale-95"
            title="Auto-fill journal with AI"
          >
            <Sparkles size={18} /> Sera Auto-Fill
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            {isAdding ? "Close Editor" : <><Plus size={18} /> New Entry</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Entry Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Post-Market Review: NVDA Squeeze"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Ticker Symbols (Comma separated)</label>
                  <input
                    type="text"
                    value={symbols}
                    onChange={(e) => setSymbols(e.target.value)}
                    placeholder="e.g. NVDA, TSLA, SPY"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Psychology & Market Narrative</label>
                  <button
                    onClick={generateAIEntry}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider hover:text-amber-300 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={12} className={isGenerating ? "animate-pulse" : ""} />
                    {isGenerating ? "Sera is drafting..." : "Draft with Sera Intel"}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your trade execution, mental state, or market observations... (Or click 'Draft with Sera Intel' for an AI proposal)"
                  rows={6}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Sentiment:</span>
                  <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-850">
                    <button
                      onClick={() => setSentiment("Bullish")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${sentiment === "Bullish" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      <Smile size={14} /> Bullish
                    </button>
                    <button
                      onClick={() => setSentiment("Neutral")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${sentiment === "Neutral" ? "bg-neutral-800 text-neutral-300" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      <Meh size={14} /> Neutral
                    </button>
                    <button
                      onClick={() => setSentiment("Bearish")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${sentiment === "Bearish" ? "bg-rose-500/20 text-rose-400" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      <Frown size={14} /> Bearish
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveEntry}
                  className="bg-amber-500 text-neutral-950 px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Save size={18} /> Save Entry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-neutral-900 rounded-2xl animate-pulse border border-neutral-800" />
          ))
        ) : entries.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <BookOpen className="mx-auto text-neutral-800 mb-4" size={48} />
            <p className="text-neutral-500 text-sm">Your journal is empty. Document your journey to improve discipline.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
                    <Calendar size={12} />
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    entry.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" :
                    entry.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-400" :
                    "bg-neutral-800 text-neutral-400"
                  }`}>
                    {entry.sentiment}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{entry.title}</h4>
                <p className="text-sm text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                  {entry.content}
                </p>
                {entry.symbols && entry.symbols.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {entry.symbols.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-850 rounded text-[9px] font-mono text-amber-400 uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider hover:text-amber-300 transition-colors">
                  <Sparkles size={12} /> Sera Intel
                </button>
                <button 
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-neutral-600 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
