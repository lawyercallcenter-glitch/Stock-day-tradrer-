import React, { useState, useEffect } from "react";
import { Shield, Users, Activity, Settings, Zap, Bell, Database, Cpu, Lock, Globe, Server, BarChart3, MessageSquare, Trash2, CheckCircle2, AlertCircle, TrendingUp, RefreshCw, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  apiRequestsToday: number;
  systemUptime: string;
  databaseSize: string;
  aiTokensUsed: number;
}

export default function AdminConsole() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1284,
    activeSessions: 42,
    apiRequestsToday: 15420,
    systemUptime: "14d 6h 22m",
    databaseSize: "1.2 GB",
    aiTokensUsed: 852400
  });

  const [logs, setLogs] = useState([
    { id: 1, type: "auth", message: "New user registration: alex@example.com", time: "2m ago" },
    { id: 2, type: "system", message: "Database backup completed successfully", time: "15m ago" },
    { id: 3, type: "ai", message: "High volume detected on Gemini-Flash-Latest", time: "1h ago" },
    { id: 4, type: "security", message: "Rate limit triggered for IP 192.168.1.45", time: "3h ago" },
  ]);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [marketPulse, setMarketPulse] = useState<any>(null);
  const [commissions, setCommissions] = useState<any>(null);

  useEffect(() => {
    fetch("/api/gemini/sentiment")
      .then(res => res.json())
      .then(data => setMarketPulse(data))
      .catch(() => setMarketPulse({ score: 65, label: "Bullish Neutral", reason: "Market technicals remain strong despite macro uncertainty." }));

    fetch("/api/admin/commission-report")
      .then(res => res.json())
      .then(data => setCommissions(data))
      .catch(err => console.error("Commission fetch error:", err));
  }, []);

  const handleBroadcast = async () => {
    if (!globalAnnouncement) return;
    setIsBroadcasting(true);
    try {
      await setDoc(doc(db, "system_configs", "broadcast"), {
        message: globalAnnouncement,
        type: "admin_alert",
        timestamp: serverTimestamp(),
        active: true
      });
      setLogs([{ id: Date.now(), type: "broadcast", message: `Live Broadcast Sent: ${globalAnnouncement}`, time: "just now" }, ...logs]);
      setGlobalAnnouncement("");
    } catch (err) {
      console.error("Broadcast failed:", err);
      setLogs([{ id: Date.now(), type: "error", message: `Broadcast Failed: Permission Denied`, time: "just now" }, ...logs]);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Shield className="text-emerald-400" size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Admin <span className="text-emerald-400">Command Center</span></h1>
          </div>
          <p className="text-neutral-500 text-sm max-w-xl">Master administrative interface for Sera AI. Control global configurations, monitor real-time system health, and manage elite compounding tiers.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            Level: Root Admin
          </div>
          <div className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-[10px] uppercase tracking-widest">
            System Live
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: <Users size={16} />, color: "text-blue-400" },
          { label: "Active Now", value: stats.activeSessions, icon: <Activity size={16} />, color: "text-emerald-400" },
          { label: "API Calls", value: stats.apiRequestsToday.toLocaleString(), icon: <Globe size={16} />, color: "text-purple-400" },
          { label: "AI Tokens", value: (stats.aiTokensUsed / 1000).toFixed(1) + "k", icon: <Cpu size={16} />, color: "text-orange-400" },
          { label: "DB Size", value: stats.databaseSize, icon: <Database size={16} />, color: "text-cyan-400" },
          { label: "Uptime", value: stats.systemUptime, icon: <Server size={16} />, color: "text-emerald-400" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl hover:border-neutral-700 transition-colors group"
          >
            <div className={`mb-2 ${stat.color} p-2 bg-neutral-950 rounded-lg inline-block group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-white mb-0.5 tracking-tight">{stat.value}</div>
            <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Management & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings size={20} className="text-neutral-500" />
              Global System Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Maintenance Mode</div>
                  <div className="text-xs text-neutral-500">Disable all user access to Sera</div>
                </div>
                <button
                  onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isMaintenanceMode ? 'bg-rose-500' : 'bg-neutral-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isMaintenanceMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">AI Training Mode</div>
                  <div className="text-xs text-neutral-500">Allow background model fine-tuning</div>
                </div>
                <button className="w-12 h-6 rounded-full relative bg-emerald-500">
                  <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white"></div>
                </button>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Strict OAuth Rules</div>
                  <div className="text-xs text-neutral-500">Enforce verified workspace domains</div>
                </div>
                <button className="w-12 h-6 rounded-full relative bg-neutral-800">
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"></div>
                </button>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Real-time Gapping</div>
                  <div className="text-xs text-neutral-500">Enable high-frequency price walk simulations</div>
                </div>
                <button className="w-12 h-6 rounded-full relative bg-emerald-500">
                  <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white"></div>
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-widest font-mono">System Broadcast</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input
                    type="text"
                    value={globalAnnouncement}
                    onChange={(e) => setGlobalAnnouncement(e.target.value)}
                    placeholder="Type message to all active users..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                  />
                </div>
                <button
                  onClick={handleBroadcast}
                  disabled={isBroadcasting || !globalAnnouncement}
                  className="px-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                  {isBroadcasting ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <Bell size={18} />
                  )}
                  {isBroadcasting ? "SENDING..." : "SEND"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <TrendingUp size={120} />
             </div>
             <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              Global Market Pulse (Admin View)
            </h2>
            
            {marketPulse ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center gap-4">
                   <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-800" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={175} strokeDashoffset={175 - (175 * marketPulse.score / 100)} className="text-emerald-500 transition-all duration-1000" />
                      </svg>
                      <span className="absolute text-sm font-black text-white">{marketPulse.score}</span>
                   </div>
                   <div>
                     <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Market Mood</div>
                     <div className="text-lg font-bold text-white">{marketPulse.label}</div>
                   </div>
                </div>
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono mb-1">Admin Rationale</div>
                  <p className="text-xs text-neutral-400 leading-relaxed italic">"{marketPulse.reason}"</p>
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap size={120} />
             </div>
             <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-neutral-500" />
              Resource Allocation Audit
            </h2>
            <div className="space-y-4">
              {[
                { name: "Gemini-Flash API Usage", current: 85, target: 100, color: "bg-emerald-500" },
                { name: "Firestore Write Throughput", current: 32, target: 100, color: "bg-blue-500" },
                { name: "Workspace Hub Latency", current: 12, target: 100, color: "bg-cyan-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-400 uppercase tracking-wider">{item.name}</span>
                    <span className="text-white">{item.current}%</span>
                  </div>
                  <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.current}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full ${item.color} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity Logs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-neutral-500" />
            Live Activity Feed
          </h2>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded-md ${
                    log.type === 'auth' ? 'bg-blue-500/10 text-blue-400' :
                    log.type === 'ai' ? 'bg-orange-500/10 text-orange-400' :
                    log.type === 'broadcast' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-[10px] text-neutral-600">{log.time}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed group-hover:text-neutral-200 transition-colors">{log.message}</p>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-mono uppercase tracking-widest rounded-xl transition-colors border border-neutral-700">
            Export Logs (CSV)
          </button>
        </div>
      </div>

      {/* Commission Reports Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500">
          <DollarSign size={120} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-amber-400" />
              Sera Elite Commission Intel
            </h2>
            <p className="text-xs text-neutral-500 mt-1 uppercase font-mono tracking-widest">Leadership Overrides & Platform Economics</p>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl">
               <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-0.5">Total Payouts</p>
               <p className="text-sm font-bold text-amber-400 font-mono">${commissions?.totalCommissions?.toLocaleString()}</p>
             </div>
             <div className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl">
               <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-0.5">Growth</p>
               <p className="text-sm font-bold text-emerald-400 font-mono">+{commissions?.projections?.growth}</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-500 uppercase font-mono tracking-tighter">
                <th className="px-6 py-4">Elite Leader</th>
                <th className="px-6 py-4">Managed Organization</th>
                <th className="px-6 py-4">Leadership Commission</th>
                <th className="px-6 py-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {commissions?.breakdown?.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold text-[10px]">
                        {item.leader.charAt(0)}
                      </div>
                      <span className="font-bold text-white">{item.leader}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-400 font-mono">{item.teamSize} High-Volume Traders</td>
                  <td className="px-6 py-4 text-amber-400 font-bold font-mono">${item.commission.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.status === "Paid" ? "bg-emerald-500/10 text-emerald-400" : 
                      item.status === "Processing" ? "bg-cyan-500/10 text-cyan-400" : 
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          Emergency Override Protocols
        </h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-neutral-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-black font-bold rounded-2xl transition-all flex items-center gap-2 text-xs">
            <Trash2 size={16} />
            Flush System Caches
          </button>
          <button className="px-6 py-3 bg-neutral-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-black font-bold rounded-2xl transition-all flex items-center gap-2 text-xs">
            <Lock size={16} />
            Revoke All Session Tokens
          </button>
          <button className="px-6 py-3 bg-neutral-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-black font-bold rounded-2xl transition-all flex items-center gap-2 text-xs">
            <CheckCircle2 size={16} />
            Force Global DB Re-Sync
          </button>
        </div>
      </div>
    </div>
  );
}
