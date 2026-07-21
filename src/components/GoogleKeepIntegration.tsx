import React, { useState, useEffect } from "react";
import { StickyNote, Plus, RefreshCw, Search, FileText, Trash2, ExternalLink, LogIn, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/firebase";

interface KeepNote {
  name: string;
  title?: string;
  body?: { text?: { text?: string } };
}

interface KeepProps {
  accessToken: string | null;
}

export default function GoogleKeepIntegration({ accessToken }: KeepProps) {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", body: "" });

  const fetchNotes = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // Note: Keep API list endpoint is often restricted or requires specific enterprise setup.
      // We'll try the documented endpoint but handle errors gracefully.
      const response = await fetch("https://keep.googleapis.com/v1/notes", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error("Google Keep API access is restricted to Workspace enterprise accounts.");
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || (!newNote.title.trim() && !newNote.body.trim())) return;
    setLoading(true);
    try {
      const response = await fetch("https://keep.googleapis.com/v1/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newNote.title,
          body: { text: { text: newNote.body } },
        }),
      });
      if (!response.ok) throw new Error("Failed to create note");
      setNewNote({ title: "", body: "" });
      setIsCreating(false);
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchNotes();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <StickyNote className="text-yellow-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Keep AI Organized</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Capture research notes and trade ideas directly to your Google Keep. Connect your account to sync your notes across all devices.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-yellow-500/20 flex items-center gap-3 mx-auto"
        >
          <LogIn size={20} /> Connect Workspace
        </button>
      </motion.div>
    );
  }

  if (error && error.includes("403") || error?.includes("scope")) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="text-rose-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Keep API Restricted</h3>
        <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
          Google Keep access is restricted by Google for third-party apps. To enable this, the Keep API must be enabled and the OAuth Consent screen must be configured in your Google Cloud Console.
        </p>
        <div className="flex flex-col gap-2 text-left bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-[10px] text-neutral-500 mb-6">
          <p>1. Go to Google Cloud Console</p>
          <p>2. Enable "Google Keep API"</p>
          <p>3. Add "https://www.googleapis.com/auth/keep" to Scopes</p>
        </div>
        <button
          onClick={() => fetchNotes()}
          className="text-neutral-500 hover:text-white text-xs underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredNotes = notes.filter(note => 
    (note.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (note.body?.text?.text?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <StickyNote className="text-yellow-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Keep AI Organized</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Google Keep Integration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchNotes}
            disabled={loading}
            className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus size={18} /> New Note
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search trading ideas, research, or notes..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all"
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
            className="bg-neutral-900 border border-yellow-500/30 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Research Note</h3>
              <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
            <form onSubmit={createNote} className="space-y-4">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Note Title (e.g., NVDA Q3 Earnings Analysis)"
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all"
              />
              <textarea
                value={newNote.body}
                onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                placeholder="Note Content..."
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-sm text-white h-32 focus:outline-none focus:border-yellow-500/50 transition-all resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-bold text-sm transition-all"
              >
                Save to Keep
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && notes.length === 0 ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-neutral-900 rounded-2xl animate-pulse border border-neutral-800" />)
        ) : filteredNotes.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <FileText className="mx-auto text-neutral-800" size={48} />
            <p className="text-neutral-500 text-sm">No notes found matching your search.</p>
          </div>
        ) : (
          filteredNotes.map((note, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-yellow-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-white text-sm group-hover:text-yellow-400 transition-colors">
                    {note.title || "Untitled Note"}
                  </h4>
                  <StickyNote size={14} className="text-neutral-700" />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-4">
                  {note.body?.text?.text || "No content."}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-end">
                <button className="text-[10px] font-mono text-neutral-600 hover:text-yellow-400 flex items-center gap-1 transition-colors uppercase tracking-widest">
                  View in Keep <ExternalLink size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
