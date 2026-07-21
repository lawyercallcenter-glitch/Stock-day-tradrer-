import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  LineChart, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Zap,
  TrendingUp,
  X
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "AI & ANALYSIS",
    question: "How does the AI Scan Console work?",
    answer: "Our AI Scan Console utilizes real-time market data combined with proprietary technical algorithms. It scans thousands of tickers to identify high-probability setups based on volatility, volume, and price action momentum, providing you with actionable signals in seconds.",
    icon: <Cpu className="text-emerald-400" size={24} />
  },
  {
    category: "STRATEGY",
    question: "Day Trade vs. Long Term Mode: Which one is for me?",
    answer: "Day Trade mode focuses on high-volatility, short-term price fluctuations suitable for scalping and intraday breakouts. Long Term mode prioritizes fundamental stability, dividend growth, and consistent compounding for wealth preservation and multi-year growth.",
    icon: <TrendingUp className="text-rose-400" size={24} />
  },
  {
    category: "INTEGRATION",
    question: "How do I sync my Google Workspace data?",
    answer: "Navigate to the Workspace tab and click 'Connect Account'. Once authenticated via OAuth, Sera can securely access your Drive, Sheets, and Calendar to provide personalized context for your trades and meetings.",
    icon: <Globe className="text-blue-400" size={24} />
  },
  {
    category: "PERFORMANCE",
    question: "What is the Portfolio Health Score?",
    answer: "The Health Score is a quantitative metric ranging from 1-100. It evaluates your current holdings against market benchmarks, risk exposure, and diversification levels, helping you identify if your capital is efficiently deployed.",
    icon: <ShieldCheck className="text-amber-400" size={24} />
  },
  {
    category: "RESOURCES",
    question: "Where can I find daily market tutorials?",
    answer: "Visit the Education tab to access the 'Stock Temix' video series. You can also click 'Go to YouTube Channel' to subscribe for live daily market analysis and real-time trading strategy sessions.",
    icon: <Zap className="text-purple-400" size={24} />
  }
];

export default function HelpCenter({ onClose }: { onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % FAQ_DATA.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + FAQ_DATA.length) % FAQ_DATA.length);
  };

  const currentItem = FAQ_DATA[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden relative shadow-2xl shadow-emerald-500/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <HelpCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Help & FAQ</h2>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Animated Slide Presentation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 md:p-12 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-neutral-800 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/10">
                  {currentItem.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-600">
                  Slide {currentIndex + 1} of {FAQ_DATA.length}
                </span>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-4 bg-neutral-800 rounded-2xl shrink-0">
                  {currentItem.icon}
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">
                    {currentItem.question}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed text-lg">
                    {currentItem.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / FAQ_DATA.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="p-6 bg-neutral-950/50 flex items-center justify-between border-t border-neutral-800">
          <div className="flex gap-2">
            <button 
              onClick={prevSlide}
              className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-emerald-500/30 transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-emerald-500/30 transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-1">
              {FAQ_DATA.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "bg-emerald-500" : "bg-neutral-800"
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={currentIndex === FAQ_DATA.length - 1 ? onClose : nextSlide}
              className="px-6 py-3 bg-emerald-500 text-neutral-950 rounded-xl font-bold text-sm transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {currentIndex === FAQ_DATA.length - 1 ? "Get Started" : "Next Slide"}
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-10">
          <Sparkles size={120} className="text-emerald-500 rotate-12" />
        </div>
      </motion.div>
    </div>
  );
}
