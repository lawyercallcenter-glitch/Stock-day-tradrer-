import React, { useState } from "react";
import { Check, Sparkles, Shield, Zap, Flame, Award, CreditCard, Loader2, Calendar, CheckCircle, Info } from "lucide-react";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: any;
  color: string;
  badge?: string;
  features: string[];
  ctaText: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Explorer (7-Day Free Trial)",
    price: "$2.99",
    period: "month",
    description: "Full co-pilot access for 7 days, then just $2.99/mo. Essential market metrics and static breakout scans.",
    icon: Zap,
    color: "border-neutral-800/80 text-neutral-400 hover:border-neutral-700",
    features: [
      "Access to basic stock visualizer charts",
      "Standard simulated win-rate calculations",
      "Manual buy/sell order log creation",
      "Up to 3 active transaction allocations",
      "Local browser storage persistence only"
    ],
    ctaText: "Start Free Trial"
  },
  {
    name: "Sera Pro Co-Pilot",
    price: "$49",
    period: "month",
    description: "Elite real-time intelligence, day trading scans, and live Gemini analysis.",
    icon: Flame,
    color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5",
    badge: "MOST POPULAR",
    features: [
      "All Explorer tier access",
      "Live Gemini-powered day trade scans with search grounding",
      "Real-time interactive AI conversational co-pilot feed",
      "Unlimited active real bags and transaction logs",
      "Durable Firebase Cloud Database synchronization",
      "Google Workspace & Calendar integration to schedule setups",
      "Beta index & ATR risk sizing algorithms"
    ],
    ctaText: "Upgrade to Pro"
  },
  {
    name: "Elite Compounder",
    price: "$149",
    period: "month",
    description: "Institutional capacity for private funds and full-time professional day-traders.",
    icon: Award,
    color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.02]",
    badge: "INSTITUTIONAL",
    features: [
      "All Pro Co-Pilot tier access",
      "Ultra-low latency dedicated API routes",
      "Multi-asset correlation scanner",
      "Automated portfolio risk compounding modeler",
      "Team Overrides & Management Dashboard",
      "Customizable system instruction triggers for Sera AI",
      "Priority 1-on-1 developer onboarding",
      "Lifetime feature roadmap updates"
    ],
    ctaText: "Go Institutional"
  }
];

interface PricingPageProps {
  isAdmin?: boolean;
}

export default function PricingPage({ isAdmin }: PricingPageProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [activePlan, setActivePlan] = useState<string>("Basic Free Trial");

  const handleCheckout = (tier: PricingTier) => {
    setSelectedTier(tier);
    setPaymentSuccess(false);
    setCardNumber("");
    setExpiry("");
    setCvc("");
  };

  const processSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    
    // Simulate payment validation gateway with realistic latency
    setTimeout(() => {
      setLoadingPayment(false);
      setPaymentSuccess(true);
      setActivePlan(selectedTier?.name || "Basic Free Trial");
      
      // Persist tier for App.tsx access
      if (selectedTier) {
        localStorage.setItem("sera_user_tier", selectedTier.name);
        // Dispatch event to notify App.tsx of storage change immediately in current window
        window.dispatchEvent(new CustomEvent("user_tier_updated"));
      }

      // Clean up tier view state after brief success notice
      setTimeout(() => {
        setSelectedTier(null);
      }, 2500);
    }, 2000);
  };

  return (
    <div id="pricing-page-container" className="space-y-12 py-6">
      
      {/* Top Value Pitch Hero Banner */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-40 w-80 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
            <Sparkles size={11} /> Sera Elite Trade Compounding
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-sans">
            7-Day Free Trial: Scale Volatility with Sera AI Co-Pilot
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Experience elite intelligence for $0 today. Full access to real-time grounded scans, automated trade journaling, and professional academy courses. Just $2.99/mo after your trial.
          </p>
          
          <div className="pt-4 flex flex-wrap justify-center gap-6 text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-emerald-400" /> Cancel anytime with zero friction</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-400" /> Secure SSL processing & sandbox mode</span>
            <span className="flex items-center gap-1.5"><Info size={14} className="text-emerald-400" /> Instant activation upon checkout</span>
          </div>
        </div>
      </div>

      {/* active Plan Pill Indicator */}
      <div className="flex items-center justify-center">
        <div className="bg-neutral-950 border border-neutral-800 rounded-full px-6 py-2.5 flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Your Active Strategic Account:</span>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            {activePlan}
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PRICING_TIERS.map((tier, idx) => {
          const Icon = tier.icon;
          const isCurrent = activePlan === tier.name;
          
          return (
            <div
              key={idx}
              className={`bg-neutral-900 border rounded-2xl p-6 flex flex-col justify-between text-left transition-all duration-300 relative group overflow-hidden ${tier.color} ${isCurrent ? "ring-2 ring-emerald-500/30" : "hover:border-neutral-700"}`}
            >
              {tier.badge && (
                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${tier.name === "Sera Pro Co-Pilot" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"}`}>
                  {tier.badge}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tier.name === "Sera Pro Co-Pilot" ? "bg-emerald-500/15" : tier.name === "Elite Compounder" ? "bg-cyan-500/15" : "bg-neutral-800"}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white font-sans">{tier.name}</h4>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">Asset Tier Setup</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3 border-b border-neutral-850 pb-4">
                  <span className="text-4xl font-bold font-mono text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs font-mono text-neutral-500">/ {tier.period}</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mb-6 h-12">
                  {tier.description}
                </p>

                {/* Premium features list */}
                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Key Capabilites Included:</p>
                  {tier.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-start gap-2.5 text-xs">
                      <Check className="shrink-0 text-emerald-400 mt-0.5" size={13} />
                      <span className="text-neutral-300 leading-normal font-sans">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* pricing tier action button */}
              <button
                type="button"
                onClick={() => handleCheckout(tier)}
                disabled={isCurrent}
                className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${isCurrent ? "bg-neutral-950 border border-neutral-800 text-neutral-600 cursor-default" : tier.name === "Sera Pro Co-Pilot" ? "bg-emerald-500 hover:bg-emerald-600 text-neutral-950 active:scale-[0.98]" : "bg-neutral-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 active:scale-[0.98]"}`}
              >
                {isCurrent ? "Active Setup Container" : tier.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Simulated Premium Checkout Slide-over Modal Backdrop */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl text-left">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 blur-2xl rounded-full" />
            
            {paymentSuccess ? (
              /* Success confirmation panel */
              <div className="py-8 text-center space-y-4 animate-scaleIn">
                <div className="mx-auto h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-sans font-bold text-xl text-white">Compound Strategy Activated!</h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Your payment has been successfully processed. The high-performance <span className="text-emerald-400 font-bold">{selectedTier.name}</span> asset engine is now fully synced to your account.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full text-[9px] font-mono text-emerald-400 uppercase">
                  Transaction Status: Approved Securely
                </div>
              </div>
            ) : (
              /* Standard secure billing payment form simulation */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
                  <div>
                    <h4 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                      <CreditCard className="text-emerald-400" size={20} />
                      Sera Secure Vault Billing
                    </h4>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">SSL Secured Gateway Setup</p>
                  </div>
                  <button
                    onClick={() => setSelectedTier(null)}
                    className="text-neutral-500 hover:text-neutral-300 font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Invoice summary info block */}
                <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex justify-between items-center text-sm font-mono">
                  <div>
                    <span className="text-neutral-400 font-sans font-bold block">{selectedTier.name} Tier</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mt-0.5">Billed {selectedTier.period === "month" ? "monthly" : "yearly"}</span>
                  </div>
                  <span className="text-xl font-bold text-white">{selectedTier.price}<span className="text-[10px] text-neutral-500 font-normal"> / {selectedTier.period}</span></span>
                </div>

                <form onSubmit={processSimulatedPayment} className="space-y-4">
                  
                  {/* Card Number */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">Credit Card Number</label>
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 flex items-center gap-2 focus-within:border-emerald-500/40">
                      <CreditCard className="text-neutral-500" size={16} />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").substring(0, 16))}
                        placeholder="4242 4242 4242 4242"
                        className="bg-transparent text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  {/* Expiry & CVC row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">Expiration Date</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value.substring(0, 5))}
                        placeholder="MM/YY"
                        className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none w-full font-mono focus:border-emerald-500/40"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">Security Code (CVC)</label>
                      <input
                        type="password"
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").substring(0, 3))}
                        placeholder="•••"
                        className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none w-full font-mono focus:border-emerald-500/40"
                      />
                    </div>
                  </div>

                  {/* Submit Transaction Action */}
                  <button
                    type="submit"
                    disabled={loadingPayment}
                    className="w-full py-4 mt-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loadingPayment ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Validating Secure Channel...
                      </>
                    ) : (
                      `Authorize Secure Payment: ${selectedTier.price}`
                    )}
                  </button>

                  <p className="text-[10px] font-mono text-neutral-500 text-center uppercase tracking-wider mt-4">
                    🔐 AES 256 encrypted sandbox simulation. Real credentials not required.
                  </p>

                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Feature Comparison breakdown chart detail */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 text-left">
        <h4 className="font-bold text-base text-white font-sans mb-4 flex items-center gap-1.5">
          <Check className="text-emerald-400" size={18} /> Detailed Capability Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-neutral-300 font-mono">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 tracking-wider text-[10px] uppercase">
                <th className="pb-3 text-left">Core Capability</th>
                <th className="pb-3 text-center">Explorer</th>
                <th className="pb-3 text-center">Sera Pro Co-Pilot</th>
                <th className="pb-3 text-center">Elite Compounder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              <tr className="hover:bg-neutral-950/20">
                <td className="py-3 text-neutral-400 font-sans">Active Breakout Recommender</td>
                <td className="py-3 text-center text-neutral-500">Static Fallbacks</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Live web-scan grounding</td>
                <td className="py-3 text-center text-cyan-400 font-bold">Ultra-Low Latency Feed</td>
              </tr>
              <tr className="hover:bg-neutral-950/20">
                <td className="py-3 text-neutral-400 font-sans">Gemini AI Conversational Chat</td>
                <td className="py-3 text-center text-neutral-500">Limited Fallback Guidance</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Unlimited Pro Feed</td>
                <td className="py-3 text-center text-cyan-400 font-bold">Unlimited Custom Tuning</td>
              </tr>
              <tr className="hover:bg-neutral-950/20">
                <td className="py-3 text-neutral-400 font-sans">Portfolio Database Sync</td>
                <td className="py-3 text-center text-neutral-500">Local Only</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Durable Firestore DB</td>
                <td className="py-3 text-center text-cyan-400 font-bold">Durable Firestore DB</td>
              </tr>
              <tr className="hover:bg-neutral-950/20">
                <td className="py-3 text-neutral-400 font-sans">Google Calendar Event Dispatch</td>
                <td className="py-3 text-center text-neutral-500">Disabled</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Fully Automated Setup</td>
                <td className="py-3 text-center text-cyan-400 font-bold">Fully Automated Setup</td>
              </tr>
              <tr className="hover:bg-neutral-950/20">
                <td className="py-3 text-neutral-400 font-sans">Strategic Risk Sizing Tools</td>
                <td className="py-3 text-center text-neutral-500">Standard Static Formula</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Advanced Beta Calculator</td>
                <td className="py-3 text-center text-cyan-400 font-bold">Advanced Custom Sizer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
