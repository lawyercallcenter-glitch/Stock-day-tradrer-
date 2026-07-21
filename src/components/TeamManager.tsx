import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  ChevronRight, 
  ArrowUpRight, 
  Plus, 
  X,
  Award,
  BarChart3,
  Percent,
  Settings,
  MoreVertical,
  Briefcase
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Trader" | "Senior" | "Lead";
  performance: number; // monthly %
  managedAssets: number;
  overrideRate: number; // % override the leader gets
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  totalAUM: number;
  monthlyRevenue: number;
}

export default function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  const user = auth.currentUser;

  // Simulated initial teams for Elite Tier users
  useEffect(() => {
    const mockTeams: Team[] = [
      {
        id: "team-1",
        name: "Alpha Growth Squad",
        totalAUM: 1250000,
        monthlyRevenue: 85000,
        members: [
          { id: "m1", name: "David Chen", email: "david@example.com", role: "Senior", performance: 12.4, managedAssets: 450000, overrideRate: 2 },
          { id: "m2", name: "Sarah Miller", email: "sarah@example.com", role: "Trader", performance: 8.2, managedAssets: 200000, overrideRate: 1.5 },
          { id: "m3", name: "Marcus T.", email: "marcus@example.com", role: "Trader", performance: 15.1, managedAssets: 600000, overrideRate: 2.5 },
        ]
      },
      {
        id: "team-2",
        name: "Volatility Hedge Group",
        totalAUM: 850000,
        monthlyRevenue: 42000,
        members: [
          { id: "m4", name: "Elena R.", email: "elena@example.com", role: "Senior", performance: 6.8, managedAssets: 500000, overrideRate: 1.8 },
          { id: "m5", name: "Kevin Park", email: "kevin@example.com", role: "Trader", performance: 4.2, managedAssets: 350000, overrideRate: 1.2 },
        ]
      }
    ];
    setTeams(mockTeams);
  }, []);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      members: [],
      totalAUM: 0,
      monthlyRevenue: 0
    };

    setTeams([...teams, newTeam]);
    setNewTeamName("");
    setIsAddingTeam(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  const calculateTotalOverrides = (team: Team) => {
    return team.members.reduce((acc, member) => {
      // Simple override logic: (Managed Assets * Performance * Override Rate) / 10000
      return acc + (member.managedAssets * (member.performance / 100) * (member.overrideRate / 100));
    }, 0);
  };

  if (!selectedTeam) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Team Selection Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-3">
            <Shield size={11} /> Institutional Team Management
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-sans">
            Teams & Overrides Dashboard
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Manage your trading organization and track leadership overrides.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedTeamId || ""}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl appearance-none cursor-pointer focus:border-cyan-500/50 outline-none shadow-xl"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsAddingTeam(true)}
            className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Override Performance Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Team AUM", value: `$${(selectedTeam.totalAUM / 1000000).toFixed(2)}M`, icon: Briefcase, color: "text-neutral-400" },
          { label: "Team Performance", value: "9.4%", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Est. Team Revenue", value: `$${selectedTeam.monthlyRevenue.toLocaleString()}`, icon: BarChart3, color: "text-cyan-400" },
          { label: "Leadership Override", value: `$${calculateTotalOverrides(selectedTeam).toLocaleString()}`, icon: DollarSign, color: "text-amber-400", highlight: true },
        ].map((stat, i) => (
          <div key={i} className={`bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl ${stat.highlight ? "ring-1 ring-amber-500/20 bg-amber-500/[0.02]" : ""}`}>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">
              <stat.icon size={12} className={stat.color} /> {stat.label}
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.highlight ? "text-amber-400" : "text-white"}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Team Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white font-sans flex items-center gap-2">
              <Users size={18} className="text-cyan-400" /> Organization Members
            </h3>
            <button className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg transition-all">
              <UserPlus size={12} /> Invite Member
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Trader</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Perf (MTD)</th>
                  <th className="px-6 py-4">Override</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {selectedTeam.members.map((member) => (
                  <tr key={member.id} className="group hover:bg-neutral-950/30 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-neutral-700">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none">{member.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-1">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        member.role === "Lead" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : 
                        member.role === "Senior" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : 
                        "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold font-mono text-emerald-400">+{member.performance}%</span>
                        <ArrowUpRight size={12} className="text-emerald-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Percent size={11} className="text-amber-400" />
                        <span className="text-sm font-bold font-mono text-white">{member.overrideRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-800 transition-all">
                        <Settings size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Override Economics Panel */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 blur-3xl rounded-full" />
            
            <h3 className="font-bold text-white font-sans flex items-center gap-2 mb-6">
              <Award size={18} className="text-amber-400" /> Override Economics
            </h3>

            <div className="space-y-6">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Projected Monthly Override</p>
                <div className="text-3xl font-bold font-mono text-amber-400">
                  ${calculateTotalOverrides(selectedTeam).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-emerald-400">
                  <TrendingUp size={12} /> +14.2% from last month
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Override Breakdown</p>
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{member.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-neutral-500">${(member.managedAssets / 1000).toFixed(0)}k Assets</span>
                      <span className="font-mono font-bold text-white">${((member.managedAssets * (member.performance / 100) * (member.overrideRate / 100))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <button className="w-full py-3 bg-neutral-950 border border-amber-500/40 hover:border-amber-400 text-amber-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                  Configure Override Structure
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Shield size={12} className="text-cyan-400" /> Team Security
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed italic">
              All team trades are synchronized via high-latency encrypted channels. Overrides are calculated at market close based on verified account snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* Add Team Modal Backdrop */}
      <AnimatePresence>
        {isAddingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAddingTeam(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Create New Trading Team</h3>
              
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">Team Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Quantitative Alpha Fund"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>

                <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                  <p className="text-[11px] text-cyan-400 leading-relaxed italic">
                    Note: Creating a team allows you to assign members, define override structures, and monitor organization-wide performance from a centralized institutional hub.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Authorize Organization Setup
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
