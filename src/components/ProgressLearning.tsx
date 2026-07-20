import { useState, useEffect } from "react";
import { Target, TrendingUp, PiggyBank, ShieldCheck, Zap, LineChart, Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function ProgressLearning() {
  const [monthlySavings, setMonthlySavings] = useState(1000);
  const [years, setYears] = useState(10);
  const [dayTradeAllocation, setDayTradeAllocation] = useState(25); // Percentage
  
  const [rates, setRates] = useState<{longTermRate: number, dayTradeRate: number, analysis: string} | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    fetch("/api/gemini/market-rates")
      .then(r => r.json())
      .then(data => {
        setRates(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingRates(false));
  }, []);

  const longTermAllocation = 100 - dayTradeAllocation;

  const calculateFutureValue = () => {
    if (!rates) return { total: 0, dayTrade: 0, longTerm: 0 };
    
    // Day trade bucket
    const dtMonthly = monthlySavings * (dayTradeAllocation / 100);
    const dtRate = rates.dayTradeRate / 100 / 12;
    const n = years * 12;
    const dtFV = dtMonthly * ((Math.pow(1 + dtRate, n) - 1) / dtRate);
    
    // Long term bucket
    const ltMonthly = monthlySavings * (longTermAllocation / 100);
    const ltRate = rates.longTermRate / 100 / 12;
    const ltFV = ltMonthly * ((Math.pow(1 + ltRate, n) - 1) / ltRate);
    
    return {
      total: (isNaN(dtFV) ? 0 : dtFV) + (isNaN(ltFV) ? 0 : ltFV),
      dayTrade: isNaN(dtFV) ? 0 : dtFV,
      longTerm: isNaN(ltFV) ? 0 : ltFV
    };
  };

  const calculateTotalContributions = () => {
    return monthlySavings * 12 * years;
  };

  const fv = calculateFutureValue();
  const totalContributions = calculateTotalContributions();
  const totalInterest = fv.total - totalContributions;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <PiggyBank className="text-emerald-400" />
          The Dual-Bag Strategy: Balancing Risk & Compounding
        </h2>
        <p className="text-neutral-400 text-sm">
          A realistic strategy involves balancing low-risk long-term compounding (mutual funds, S&P 500) with higher-risk active day trading. Determine your allocation and see the true potential of your capital based on live market analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy Guide & Analysis */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 flex flex-col">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Target className="text-emerald-400" size={20} />
            Live Market Strategy Analysis
          </h3>
          
          <div className="flex-1 bg-neutral-950 border border-neutral-850 p-5 rounded-xl flex flex-col">
            {loadingRates ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-3">
                <Loader2 className="animate-spin text-emerald-400" size={24} />
                <p className="text-xs font-mono text-neutral-500 uppercase">Consulting Gemini for live market rates...</p>
              </div>
            ) : rates ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg mt-0.5">
                    <ShieldCheck className="text-emerald-400" size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-400 text-sm">Long-Term (Mutual Funds / Solid Companies)</h4>
                    <div className="text-xl font-bold text-white mt-1">{rates.longTermRate}% <span className="text-xs text-neutral-500 font-normal font-mono">Expected Annual Return</span></div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-lg mt-0.5">
                    <Zap className="text-orange-400" size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-400 text-sm">Active Day Trading (High Alpha)</h4>
                    <div className="text-xl font-bold text-white mt-1">{rates.dayTradeRate}% <span className="text-xs text-neutral-500 font-normal font-mono">Expected Annual Return</span></div>
                  </div>
                </div>
                
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-neutral-400 uppercase tracking-wider font-bold">
                    <AlertCircle size={12} className="text-neutral-400" /> Sera's Market Verdict
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-3">
                    "{rates.analysis}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-rose-400 text-sm">Failed to load market rates.</p>
            )}
          </div>
        </div>

        {/* Wealth Calculator */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
          {loadingRates && (
            <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-10">
               <Loader2 className="animate-spin text-emerald-400" size={24} />
            </div>
          )}
          
          <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-6">
            <LineChart className="text-emerald-400" size={20} />
            Compound Growth Simulator
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                Total Monthly Contribution ($)
              </label>
              <input 
                type="range" min="100" max="10000" step="100" 
                value={monthlySavings}
                onChange={(e) => setMonthlySavings(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-right text-sm font-bold text-emerald-400 mt-1">${monthlySavings.toLocaleString()} / mo</div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Portfolio Allocation
                </label>
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                  <input 
                    type="range" min="0" max="100" step="5" 
                    value={dayTradeAllocation}
                    onChange={(e) => setDayTradeAllocation(Number(e.target.value))}
                    className="w-full accent-orange-400 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={12}/> {longTermAllocation}% Long-Term</span>
                <span className="text-orange-400 flex items-center gap-1">{dayTradeAllocation}% Day Trading <Zap size={12}/></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                Time Horizon (Years)
              </label>
              <input 
                type="range" min="1" max="40" step="1" 
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-right text-sm font-bold text-emerald-400 mt-1">{years} Years</div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total Contributions</div>
                  <div className="text-lg font-bold text-white">${totalContributions.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Interest Earned</div>
                  <div className="text-lg font-bold text-emerald-400">+${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">Estimated Future Value</div>
                  <Sparkles className="text-emerald-400 opacity-50" size={16} />
                </div>
                <div className="text-3xl font-bold text-white">
                  ${fv.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                
                <div className="flex gap-2 h-2 w-full bg-neutral-900 rounded-full overflow-hidden mt-2">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(fv.longTerm / fv.total) * 100}%` }}></div>
                  <div className="bg-orange-500 h-full transition-all" style={{ width: `${(fv.dayTrade / fv.total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase">
                  <span>${fv.longTerm.toLocaleString(undefined, { maximumFractionDigits: 0 })} from LT</span>
                  <span>${fv.dayTrade.toLocaleString(undefined, { maximumFractionDigits: 0 })} from DT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
