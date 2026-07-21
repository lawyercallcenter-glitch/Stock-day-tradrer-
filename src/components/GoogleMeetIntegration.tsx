import React, { useState, useEffect } from "react";
import { Video, Calendar, Plus, ExternalLink, RefreshCw, Clock, Users, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/firebase";

interface MeetingSpace {
  name: string;
  meetingUri: string;
  config: {
    accessType: string;
    entryPointAccess: string;
  };
}

export default function GoogleMeetIntegration({ accessToken }: { accessToken?: string | null }) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      // Note: Meet API is relatively new and may require specific scopes
      // For now, we'll try to list space or just show a "Create" interface
      // as Listing meetings often requires Calendar API or specific Meet audit scopes
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            accessType: "OPEN",
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create meeting space");
      const data = await response.json();
      window.open(data.meetingUri, "_blank");
      fetchMeetings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchMeetings();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Video className="text-emerald-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Connect Meet AI Guided</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Launch instant video review sessions for your breakout alerts. Connect your account to manage strategy meetings and group sessions directly.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto"
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
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Video className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Meet AI Guided</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Workspace Integration Active</p>
          </div>
        </div>
        <button
          onClick={createMeeting}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
          Instant Space
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-emerald-400" /> Active Strategy Spaces
          </h3>
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl">
                <p className="text-neutral-600 text-xs italic">No active spaces found. Create one to start a session.</p>
              </div>
            ) : (
              meetings.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                  <div>
                    <p className="text-sm font-bold text-white">{m.name}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">{m.meetingCode}</p>
                  </div>
                  <button className="text-emerald-400 hover:text-emerald-300">
                    <ExternalLink size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Users size={18} className="text-emerald-400" /> Trading Group Sync
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Launch instant video review sessions for your breakout alerts. Sera can automatically generate meeting links for high-conviction signals.
            </p>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all">
              Schedule Sync
            </button>
            <button className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all">
              Invite Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
