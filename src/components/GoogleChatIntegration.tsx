import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Users, Hash, Shield, Sparkles, RefreshCw, ExternalLink, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/firebase";

interface Space {
  name: string;
  displayName: string;
  type: string;
}

export default function GoogleChatIntegration({ accessToken }: { accessToken?: string | null }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaces = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch Google Chat spaces");
      const data = await response.json();
      setSpaces(data.spaces || []);
      if (data.spaces?.length > 0) setSelectedSpace(data.spaces[0].name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!accessToken || !selectedSpace || !message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${selectedSpace}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      setMessage("");
      // Success feedback could go here
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const polishSignal = async () => {
    if (!message.trim()) return;
    setPolishing(true);
    try {
      const response = await fetch("/api/gemini/polish-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to polish signal");
      const data = await response.json();
      if (data.polished) setMessage(data.polished);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPolishing(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchSpaces();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="text-indigo-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Enable Chat AI Assisted</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Bridge your trading room with Google Chat. Broadcast alerts, signals, and strategy shifts to your team instantly. Connect your account to start broadcasting.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 mx-auto"
        >
          <LogIn size={20} /> Connect Workspace
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <MessageSquare className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Chat AI Assisted</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Team Communication Active</p>
          </div>
        </div>
        <button
          onClick={fetchSpaces}
          disabled={loading}
          className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Hash size={14} /> Active Spaces
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {spaces.map((space) => (
                <button
                  key={space.name}
                  onClick={() => setSelectedSpace(space.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedSpace === space.name
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                      : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <p className="text-sm font-bold truncate">{space.displayName || "Direct Message"}</p>
                  <p className="text-[10px] opacity-60 uppercase">{space.type}</p>
                </button>
              ))}
              {spaces.length === 0 && !loading && (
                <p className="text-xs text-neutral-600 italic p-4 text-center">No accessible spaces found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Send size={18} className="text-indigo-400" /> Broadcast Signal
            </h3>
            <form onSubmit={sendMessage} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter trade signal or market update to broadcast..."
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMessage(prev => prev + "🚨 VOLATILITY ALERT: ")}
                    className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-[10px] font-bold uppercase hover:text-white transition-colors"
                  >
                    Alert Tag
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage(prev => prev + "📊 TRADE SIGNAL: ")}
                    className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-[10px] font-bold uppercase hover:text-white transition-colors"
                  >
                    Signal Tag
                  </button>
                  <button
                    type="button"
                    onClick={polishSignal}
                    disabled={polishing || !message.trim()}
                    className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                  >
                    {polishing ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={10} />}
                    AI Polish
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedSpace || !message.trim()}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                  Send to {spaces.find(s => s.name === selectedSpace)?.displayName || "Space"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Sera Auto-Broadcast</h4>
                <p className="text-xs text-neutral-400">Enable AI to automatically post high-conviction breakouts to this space.</p>
              </div>
            </div>
            <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
