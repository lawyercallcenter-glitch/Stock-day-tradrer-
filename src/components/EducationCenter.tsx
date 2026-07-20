import React, { useState } from "react";
import { GraduationCap, Play, BookOpen, Star, Clock, ChevronRight, Zap, Target, BarChart, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MODULES = [
  {
    id: "m1",
    title: "Market Microstructure",
    description: "Understanding order books, liquidity sweeps, and high-frequency patterns.",
    level: "Beginner",
    duration: "12m",
    color: "emerald",
  },
  {
    id: "m2",
    title: "Technical Indicator Suite",
    description: "Mastering VWAP, RSI, and MACD for confirmation in volatile sessions.",
    level: "Intermediate",
    duration: "25m",
    color: "blue",
  },
  {
    id: "m3",
    title: "Risk Psychology",
    description: "Developing the discipline to cut losses and let winners run.",
    level: "Advanced",
    duration: "18m",
    color: "amber",
  },
  {
    id: "m4",
    title: "Portfolio Theory",
    description: "Balancing alpha-seeking day trades with long-term foundational bags.",
    level: "Advanced",
    duration: "30m",
    color: "purple",
  },
];

export default function EducationCenter() {
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <GraduationCap className="text-rose-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Education Center</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Mastering the Market Pulse</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <Star className="text-amber-400" size={14} />
          <span>LVL 4 ANALYST</span>
          <div className="w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 w-[65%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stage (Animated Placeholder) */}
          <div className="relative aspect-video bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="relative z-10"
              >
                <div className="h-20 w-20 bg-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/40 cursor-pointer hover:scale-110 transition-transform">
                  <Play className="text-white ml-1" fill="white" size={32} />
                </div>
              </motion.div>
              
              {/* Animated Background elements to simulate "Video Content" */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <motion.div
                  animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                  className="absolute top-1/4 left-1/4 w-32 h-1 bg-rose-500/50"
                />
                <motion.div
                  animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
                  transition={{ duration: 12, repeat: Infinity }}
                  className="absolute bottom-1/4 right-1/4 w-48 h-1 bg-blue-500/50"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-neutral-800" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-px bg-neutral-800" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-neutral-950 to-transparent">
              <h3 className="text-xl font-bold text-white mb-2">{selectedModule.title}</h3>
              <p className="text-sm text-neutral-400 max-w-lg">{selectedModule.description}</p>
            </div>
            
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-full text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                LIVE DEMO
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-rose-400" /> Core Objectives
              </h4>
              <ul className="space-y-3">
                {[
                  "Identify high-probability setups",
                  "Manage emotions during drawdown",
                  "Optimize entry/exit execution",
                ].map((obj, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-neutral-400">
                    <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-rose-400" /> Interactive Quiz
              </h4>
              <p className="text-xs text-neutral-500 mb-4">Test your knowledge of order book dynamics and slippage.</p>
              <button className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-all">
                Start Challenge
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white px-2">Learning Path</h3>
          <div className="space-y-3">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                  selectedModule.id === mod.id
                    ? "bg-rose-500/5 border-rose-500/40 ring-1 ring-rose-500/40"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    selectedModule.id === mod.id ? "text-rose-400" : "text-neutral-500"
                  }`}>
                    {mod.level}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-600">
                    <Clock size={10} /> {mod.duration}
                  </div>
                </div>
                <h4 className={`font-bold transition-colors ${
                  selectedModule.id === mod.id ? "text-white" : "text-neutral-300 group-hover:text-white"
                }`}>
                  {mod.title}
                </h4>
                <div className="mt-3 flex items-center justify-between">
                  <div className="h-1 flex-1 bg-neutral-950 rounded-full mr-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        selectedModule.id === mod.id ? "bg-rose-500" : "bg-neutral-800"
                      }`} 
                      style={{ width: selectedModule.id === mod.id ? "35%" : "0%" }}
                    />
                  </div>
                  <ChevronRight size={14} className={selectedModule.id === mod.id ? "text-rose-400" : "text-neutral-700"} />
                </div>
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-6 rounded-3xl mt-6">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Shield size={18} className="text-amber-400" /> Sera Mentorship
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Unlock the advanced "Whale Tracking" module by completing the Risk Psychology challenge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
