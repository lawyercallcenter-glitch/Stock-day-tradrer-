import React, { useState, useEffect } from "react";
import { Presentation, Plus, RefreshCw, Search, FileText, Trash2, ExternalLink, Play, Layout, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/firebase";

interface PresentationItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  modifiedTime: string;
}

interface SlidesProps {
  accessToken: string | null;
}

export default function GoogleSlidesIntegration({ accessToken }: SlidesProps) {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newPres, setNewPres] = useState({ title: "" });

  const fetchPresentations = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // Use Drive API to list presentation files
      const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation'&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch presentations from Drive");
      const data = await response.json();
      setPresentations(data.files || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newPres.title.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("https://slides.googleapis.com/v1/presentations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newPres.title,
        }),
      });
      if (!response.ok) throw new Error("Failed to create presentation");
      setNewPres({ title: "" });
      setIsCreating(false);
      fetchPresentations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchPresentations();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Presentation className="text-orange-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Slides AI Crafted</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Manage and create strategy decks for your trading performance reviews. Connect your account to sync your Google Slides data.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 mx-auto"
        >
          <LogIn size={20} /> Connect Workspace
        </button>
      </motion.div>
    );
  }

  const filtered = presentations.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Presentation className="text-orange-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Slides AI Crafted</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Google Slides Integration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPresentations}
            disabled={loading}
            className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus size={18} /> New Deck
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search strategy decks, research reports, or presentations..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-3">
          <Trash2 size={16} />
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-orange-500/30 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Trading Presentation</h3>
              <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
            <form onSubmit={createPresentation} className="space-y-4">
              <input
                type="text"
                value={newPres.title}
                onChange={(e) => setNewPres({ title: e.target.value })}
                placeholder="Presentation Title (e.g., Weekly Trading Review - Q3)"
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all"
              >
                Create Strategy Deck
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && presentations.length === 0 ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-neutral-900 rounded-2xl animate-pulse border border-neutral-800" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <Layout className="mx-auto text-neutral-800" size={48} />
            <p className="text-neutral-500 text-sm">No strategy decks found.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-orange-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                    <Presentation size={20} />
                  </div>
                  <Play size={14} className="text-neutral-700 group-hover:text-orange-400 transition-colors cursor-pointer" />
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors mb-2 truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] font-mono text-neutral-500 uppercase">
                  Modified: {new Date(p.modifiedTime).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-end">
                <a 
                  href={p.webViewLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-neutral-600 hover:text-orange-400 flex items-center gap-1 transition-colors uppercase tracking-widest"
                >
                  Edit Deck <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
