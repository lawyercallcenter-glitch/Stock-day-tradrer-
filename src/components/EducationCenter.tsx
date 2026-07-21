import React, { useState, useEffect } from "react";
import { GraduationCap, Play, BookOpen, Star, Clock, ChevronRight, Zap, Target, BarChart, Shield, CheckCircle2, Award, RefreshCw, X, Trophy, Sparkles, ExternalLink, Video, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const STATIC_MODULES: Module[] = [
  {
    id: "m1",
    title: "Beginner: Trading Foundation",
    description: "Stock Temix Series: Understanding the core principles of market movement and order types.",
    level: "Beginner",
    duration: "15m",
    color: "emerald",
    videoId: "zW_C0M4v9Hk",
  },
  {
    id: "m2",
    title: "Beginner: Technical Setup",
    description: "Configuring your layout, indicators, and hotkeys for rapid execution.",
    level: "Beginner",
    duration: "10m",
    color: "emerald",
    videoId: "m9L0vM30k9Q",
  },
  {
    id: "m3",
    title: "Intermediate: Price Action Secrets",
    description: "Decoding candlestick patterns and volume price analysis to spot entries.",
    level: "Intermediate",
    duration: "22m",
    color: "blue",
    videoId: "L7G0Of_D-Sg",
  },
  {
    id: "m4",
    title: "Intermediate: Trend Mastery",
    description: "Using Moving Averages and VWAP to ride major intraday trends.",
    level: "Intermediate",
    duration: "18m",
    color: "blue",
    videoId: "9N7iX0N-k5Y",
  },
  {
    id: "m5",
    title: "Advanced: Order Flow Dynamics",
    description: "Level 2, Time & Sales, and identifying institutional footprints.",
    level: "Advanced",
    duration: "28m",
    color: "amber",
    videoId: "O4-n_yZ2z0k",
  },
  {
    id: "m6",
    title: "Advanced: Scalping Tactics",
    description: "High-frequency strategies for capturing micro-movements in momentum stocks.",
    level: "Advanced",
    duration: "20m",
    color: "amber",
    videoId: "PZ_aX0yO_wQ",
  },
  {
    id: "m7",
    title: "Expert: Macro Correlation",
    description: "Analyzing how indices, bonds, and forex impact your specific equity setups.",
    level: "Expert",
    duration: "35m",
    color: "purple",
    videoId: "G9h3E6_3T_s",
  },
  {
    id: "m8",
    title: "Expert: Institutional Risk Logic",
    description: "Advanced hedging, position sizing, and managing multi-million dollar portfolios.",
    level: "Expert",
    duration: "40m",
    color: "purple",
    videoId: "vX0S4E_y-A8",
  },
];

interface Module {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  color: string;
  videoId: string;
}

interface EducationCenterProps {
  isAdmin?: boolean;
}

export default function EducationCenter({ isAdmin }: EducationCenterProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  
  useEffect(() => {
    const fetchDynamicModules = async () => {
      try {
        const q = query(collection(db, "academy_modules"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const dynamicModules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Module[];
        
        const allModules = [...STATIC_MODULES, ...dynamicModules];
        setModules(allModules);
        if (!selectedModule) setSelectedModule(allModules[0]);
      } catch (err) {
        console.error("Error fetching modules:", err);
        setModules(STATIC_MODULES);
        if (!selectedModule) setSelectedModule(STATIC_MODULES[0]);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchDynamicModules();
  }, []);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [currentCertificateModule, setCurrentCertificateModule] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async () => {
    if (!selectedModule) return;
    setLoadingQuiz(true);
    setShowQuiz(true);
    setQuizFinished(false);
    setScore(0);
    setQuizStep(0);
    setError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedModule.title, level: selectedModule.level })
      });
      
      const text = await res.text();
      if (!text) throw new Error("AI returned an empty response. Try again.");
      
      const data = JSON.parse(text);
      if (data && data.questions && Array.isArray(data.questions)) {
        setQuizData(data.questions);
      } else {
        throw new Error(data.error || "Invalid quiz data received");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate quiz. Check your AI connection.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (!selectedModule || !quizData) return;
    const isCorrect = index === quizData[quizStep].correctIndex;
    const finalScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    if (quizStep + 1 < quizData.length) {
      setQuizStep(prev => prev + 1);
    } else {
      setQuizFinished(true);
      if (finalScore === quizData.length) {
        if (!completedModules.includes(selectedModule.id)) {
          setCompletedModules(prev => [...prev, selectedModule.id]);
        }
      }
    }
  };

  if (loadingModules) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  if (!selectedModule) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <GraduationCap className="text-rose-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Academy AI Guided</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Sera-Powered Learning Path</p>
          </div>
        </div>
          <div className="flex items-center gap-4">
            {completedModules.length > 0 && (
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-400 uppercase tracking-widest"
                >
                  <Award size={14} /> {completedModules.length} Certs Earned
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-[9px] font-mono text-neutral-500 p-2 border-b border-neutral-800 mb-1">YOUR CERTIFICATES</p>
                  {completedModules.map(mid => {
                    const mod = modules.find(m => m.id === mid);
                    return (
                      <button 
                        key={mid}
                        onClick={() => {
                          setCurrentCertificateModule(mod);
                          setShowCertificate(true);
                        }}
                        className="w-full text-left p-2 hover:bg-neutral-850 rounded-lg text-[10px] text-neutral-300 flex items-center justify-between group/cert"
                      >
                        <span className="truncate">{mod?.title}</span>
                        <ChevronRight size={12} className="text-neutral-600 group-hover/cert:text-rose-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <Star className="text-amber-400" size={14} />
            <span>LVL 4 ANALYST</span>
            <div className="w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-[65%]"></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle size={16} />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stage (Video Player) */}
          <div className="relative aspect-video bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden group shadow-2xl">
            {isPlaying ? (
              <div className="absolute inset-0 w-full h-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedModule.videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.origin)}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={selectedModule.title}
                  referrerPolicy="no-referrer-when-downgrade"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                   <a 
                    href={`https://www.youtube.com/watch?v=${selectedModule.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-lg border border-rose-500"
                   >
                     <ExternalLink size={12} />
                     Open in YouTube
                   </a>
                   <button 
                    onClick={() => setIsPlaying(false)}
                    className="p-1.5 bg-black/50 hover:bg-black text-white rounded-lg transition-all"
                   >
                     <X size={16} />
                   </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                  <p className="text-[10px] text-neutral-500 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full inline-block">
                    If video doesn't load, use the "Fix" button above to view directly on YouTube.
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1611974714014-4b5042d9959e?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center">
                <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10 cursor-pointer"
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="h-20 w-20 bg-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/40">
                    <Play className="text-white ml-1" fill="white" size={32} />
                  </div>
                </motion.div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-neutral-950 to-transparent">
                  <h3 className="text-xl font-bold text-white mb-2">{selectedModule.title}</h3>
                  <p className="text-sm text-neutral-400 max-w-lg">{selectedModule.description}</p>
                </div>
              </div>
            )}
            
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <button
                onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedModule.videoId}`, "_blank")}
                className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 p-2 rounded-full text-rose-400 hover:text-white transition-colors"
                title="Watch on YouTube"
              >
                <ExternalLink size={14} />
              </button>
              <span className="px-3 py-1 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-full text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                AI CURATED
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Video className="text-rose-400" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Stock Temix Official Channel</p>
                <p className="text-[10px] font-mono text-neutral-500">Subscribe for live daily market analysis</p>
              </div>
            </div>
            <button
              onClick={() => window.open("https://www.youtube.com/@StockTemix", "_blank")}
              className="bg-rose-500 hover:bg-rose-600 text-neutral-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 uppercase tracking-wider"
            >
              Go to YouTube Channel
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-rose-400" /> Lesson Objectives
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
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={48} className="text-rose-400" />
              </div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-rose-400" /> AI Knowledge Test
              </h4>
              <p className="text-xs text-neutral-500 mb-4">Sera has prepared a custom quiz to verify your expertise in this module.</p>
              <button 
                onClick={startQuiz}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {loadingQuiz ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                Start AI Challenge
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white px-2">AI-Guided Learning Path</h3>
          <div className="space-y-3">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  setSelectedModule(mod);
                  setIsPlaying(false);
                }}
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
                        completedModules.includes(mod.id) ? "bg-emerald-500" : selectedModule.id === mod.id ? "bg-rose-500" : "bg-neutral-800"
                      }`} 
                      style={{ width: completedModules.includes(mod.id) ? "100%" : selectedModule.id === mod.id ? "35%" : "0%" }}
                    />
                  </div>
                  {completedModules.includes(mod.id) ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <ChevronRight size={14} className={selectedModule.id === mod.id ? "text-rose-400" : "text-neutral-700"} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <button onClick={() => setShowQuiz(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X size={24} />
              </button>

              {loadingQuiz ? (
                <div className="py-20 text-center space-y-4">
                  <RefreshCw className="animate-spin mx-auto text-rose-500" size={48} />
                  <p className="text-neutral-400 font-mono text-sm">SERA IS GENERATING YOUR CHALLENGE...</p>
                </div>
              ) : quizFinished ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="text-rose-500" size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                    <p className="text-neutral-400 text-sm">You answered all questions. Mastery requires a 100% score.</p>
                  </div>
                  {completedModules.includes(selectedModule.id) ? (
                    <div className="space-y-4">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Mastery Achieved</p>
                      <button 
                        onClick={() => {
                          setShowQuiz(false);
                          setCurrentCertificateModule(selectedModule);
                          setShowCertificate(true);
                        }}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20"
                      >
                        Claim Completion Certificate
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={startQuiz}
                      className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all"
                    >
                      Retry Challenge
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mb-2">Question {quizStep + 1} of {quizData.length}</p>
                    <h3 className="text-xl font-bold text-white leading-tight">{quizData[quizStep].question}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {quizData[quizStep].options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full text-left p-4 bg-neutral-950 border border-neutral-850 rounded-2xl text-sm text-neutral-300 hover:border-rose-500/50 hover:text-white transition-all group"
                      >
                        <span className="inline-block w-6 text-rose-500 font-mono">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCertificate(false)}
              className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-full max-w-2xl aspect-[1.4/1] bg-white rounded shadow-2xl p-12 overflow-hidden border-[12px] border-amber-900/10"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-50" />
              <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-amber-900/20 pointer-events-none" />
              
              <div className="relative h-full flex flex-col items-center justify-center text-center space-y-6">
                <Award size={64} className="text-amber-600 mb-4" />
                <h1 className="text-4xl font-serif text-neutral-900 tracking-tight">Certificate of Mastery</h1>
                <div className="w-16 h-0.5 bg-amber-600" />
                <p className="text-sm font-mono text-neutral-500 uppercase tracking-[0.3em]">Presented to</p>
                <p className="text-3xl font-serif text-neutral-900 italic">Financial Analyst</p>
                <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
                  For successful completion of the <span className="font-bold text-neutral-900">{currentCertificateModule?.title}</span> program 
                  conducted by the <span className="font-bold">Sera AI Intelligence Bureau</span>.
                </p>
                <div className="pt-8 flex items-center gap-12">
                  <div className="text-center">
                    <div className="w-32 h-px bg-neutral-300 mb-2" />
                    <p className="text-[10px] font-mono text-neutral-400">SERA CORE ENGINE</p>
                  </div>
                  <div className="w-20 h-20 border-4 border-amber-600/20 rounded-full flex items-center justify-center opacity-40">
                    <CheckCircle2 size={32} className="text-amber-600" />
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-px bg-neutral-300 mb-2" />
                    <p className="text-[10px] font-mono text-neutral-400">DATE: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowCertificate(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

