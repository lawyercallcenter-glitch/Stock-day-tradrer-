import React, { useState } from "react";
import { Sparkles, Megaphone, Search, Check, Copy, Share2, Globe, Cpu, Loader2, ArrowRight, Table, AlertCircle, RefreshCw } from "lucide-react";

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
  };
  checklist: string[];
  keywordRecommendations: {
    keyword: string;
    searchVolume: string;
    competition: string;
  }[];
  robotsTxt: string;
  fallback?: boolean;
}

interface CampaignData {
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  fallback?: boolean;
}

export default function MarketingConsole() {
  // SEO Agent States
  const [focus, setFocus] = useState("Stock day trading, real-time AI alerts, options risk analyzer");
  const [keywords, setKeywords] = useState("day trading tools, stock options scanner, Sera AI copilot, retail trader compounding");
  const [loadingSEO, setLoadingSEO] = useState(false);
  const [seoResult, setSeoResult] = useState<SEOData | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Doxiql Campaign states
  const [selectedChannel, setSelectedChannel] = useState<"twitter" | "linkedin" | "reddit" | "email">("twitter");
  const [selectedTheme, setSelectedTheme] = useState("Launch Day Announcement ($2.99/mo Trial)");
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<CampaignData | null>(null);

  const triggerSEOAudit = async () => {
    setLoadingSEO(true);
    try {
      const res = await fetch("/api/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus, keywords })
      });
      const data = await res.json();
      setSeoResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSEO(false);
    }
  };

  const generateCampaign = async () => {
    setLoadingCampaign(true);
    try {
      const res = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: selectedChannel, campaignTheme: selectedTheme })
      });
      const data = await res.json();
      setCampaignResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaign(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div id="marketing-console-container" className="space-y-10 py-4 text-left">
      
      {/* Top Value Banner */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 blur-2xl rounded-full" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              <Megaphone size={11} /> Doxiql Grow Engine
            </div>
            <h3 className="text-xl font-bold text-white font-sans">
              SEO AI Agent & Social Media Launchpad
            </h3>
            <p className="text-xs text-neutral-400 max-w-2xl">
              Equip your trading dashboard with technical index crawlers and organic growth copilots. Generate high-impact organic copy, perform technical meta audits, and identify lucrative keywords.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-850 px-4 py-2.5 rounded-xl text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-400 uppercase">Search Crawlers Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Doxiql Media Marketing Hub (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-6">
            <div className="border-b border-neutral-850 pb-3">
              <h4 className="font-bold text-base text-white font-sans flex items-center gap-2">
                <Share2 className="text-emerald-400" size={18} />
                Doxiql Social Ad Architect
              </h4>
              <p className="text-[10px] font-mono text-neutral-500 uppercase mt-1">Multi-Channel Growth Playbooks</p>
            </div>

            {/* Channel Selectors */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">Select Growth Channel</label>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {(["twitter", "linkedin", "reddit", "email"] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setSelectedChannel(channel)}
                    className={`py-2.5 px-3 rounded-lg border text-left capitalize transition-all cursor-pointer ${selectedChannel === channel ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold" : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700"}`}
                  >
                    ● {channel === "twitter" ? "X / Twitter" : channel}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Theme Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">Select Campaign Theme</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/30"
              >
                <option value="Launch Day Announcement ($2.99/mo Trial)">Launch Day Announcement ($2.99/mo Trial)</option>
                <option value="Sera Live Search Grounded Stock Scans">Sera Live Search Grounded Stock Scans</option>
                <option value="Dynamic Interactive Voice Co-Pilot">Dynamic Interactive Voice Co-Pilot</option>
                <option value="Long-Term Wealth Compounding Strategy">Long-Term Wealth Compounding Strategy</option>
              </select>
            </div>

            {/* Submit Generation Action */}
            <button
              onClick={generateCampaign}
              disabled={loadingCampaign}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:opacity-60 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loadingCampaign ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Drafting Social Copy...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Assemble Doxiql Ad Copy
                </>
              )}
            </button>
          </div>

          {/* Doxiql Ad Copy Output Card */}
          {campaignResult && (
            <div className="bg-neutral-900 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden animate-fadeIn space-y-4">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500/10 border-b border-l border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase rounded-bl">
                {selectedChannel} Template
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Generated Output Hook:</span>
                <h5 className="font-sans font-bold text-sm text-white leading-snug">{campaignResult.headline}</h5>
              </div>

              <div className="space-y-1 bg-neutral-950 border border-neutral-850 p-3.5 rounded-xl">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Copy Block:</span>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {campaignResult.body}
                </p>
                
                {campaignResult.hashtags && campaignResult.hashtags.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-850/40 flex flex-wrap gap-1.5 text-[10px] font-mono text-emerald-400">
                    {campaignResult.hashtags.map((tag, tIdx) => (
                      <span key={tIdx}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">CTA: {campaignResult.callToAction}</span>
                <button
                  onClick={() => handleCopy(`${campaignResult.headline}\n\n${campaignResult.body}\n\n${campaignResult.hashtags.join(" ")}\n\n${campaignResult.callToAction}`, "adcopy")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10px] text-neutral-400 hover:text-neutral-200 cursor-pointer transition-all"
                >
                  {copiedText === "adcopy" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copiedText === "adcopy" ? "Copied" : "Copy Copy"}
                </button>
              </div>

              {campaignResult.fallback && (
                <p className="text-[9px] font-mono text-neutral-500 uppercase text-center mt-2">
                  ⚠️ Direct server channel active. fallback template loaded securely.
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SEO AI Agent Dashboard (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 space-y-5">
            <div className="border-b border-neutral-850 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-white font-sans flex items-center gap-2">
                  <Search className="text-emerald-400" size={18} />
                  Sera SEO AI Auditor
                </h4>
                <p className="text-[10px] font-mono text-neutral-500 uppercase mt-1">Technical Rank Optimization Agent</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <Cpu size={11} /> AGENT 3.5
              </div>
            </div>

            {/* Inputs block */}
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Content Audit Laboratory (Blog/Promo Page)</label>
                <textarea
                  value={contentToAudit}
                  onChange={(e) => setContentToAudit(e.target.value)}
                  className="w-full h-32 bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500/30 resize-none"
                  placeholder="Paste your content here for an automated deep SEO audit..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Niche Focus</label>
                  <input
                    type="text"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Focus statement..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Target Keywords</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Comma separated targets..."
                  />
                </div>
              </div>
            </div>

            {/* Run SEO Audit Action */}
            <button
              onClick={triggerSEOAudit}
              disabled={loadingSEO}
              className="w-full py-3 bg-neutral-950 border border-emerald-500/40 hover:border-emerald-400 disabled:opacity-50 text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loadingSEO ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Analyzing Meta Tag Densities...
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  Execute Technical SEO Audit
                </>
              )}
            </button>
          </div>

          {/* Audit Results Dashboard */}
          {seoResult && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Meta Tags Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4 space-y-3">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-widest block">HTML head meta tags optimization:</span>
                  
                  <div className="space-y-1 bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-xs">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold block">Document Title:</span>
                    <p className="text-white font-sans font-bold leading-normal">{seoResult.metaTitle}</p>
                    <button
                      onClick={() => handleCopy(seoResult.metaTitle, "metatitle")}
                      className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 block mt-2 text-right cursor-pointer"
                    >
                      {copiedText === "metatitle" ? "Copied ✓" : "Copy Title"}
                    </button>
                  </div>

                  <div className="space-y-1 bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-xs">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold block">Meta Description:</span>
                    <p className="text-neutral-300 font-sans leading-relaxed">{seoResult.metaDescription}</p>
                    <button
                      onClick={() => handleCopy(seoResult.metaDescription, "metadesc")}
                      className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 block mt-2 text-right cursor-pointer"
                    >
                      {copiedText === "metadesc" ? "Copied ✓" : "Copy Description"}
                    </button>
                  </div>
                </div>

                {/* OpenGraph Cards embed preview simulation */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-widest block mb-2">Social Preview Embed (OpenGraph):</span>
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden">
                      <img
                        src={seoResult.openGraph.image}
                        alt="SEO preview metadata"
                        className="h-24 w-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-3 space-y-1.5 text-xs text-left">
                        <span className="text-[8px] font-mono text-neutral-500 uppercase block tracking-wider">{seoResult.openGraph.type} | sera.ai</span>
                        <h6 className="font-bold text-white text-xs leading-snug truncate">{seoResult.openGraph.title}</h6>
                        <p className="text-[10px] text-neutral-400 leading-snug line-clamp-2">{seoResult.openGraph.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCopy(`<meta property="og:title" content="${seoResult.openGraph.title}" />\n<meta property="og:description" content="${seoResult.openGraph.description}" />\n<meta property="og:image" content="${seoResult.openGraph.image}" />`, "ogtags")}
                    className="w-full py-1.5 bg-neutral-950 hover:bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer text-center"
                  >
                    {copiedText === "ogtags" ? "OpenGraph Code Copied ✓" : "Copy HTML OpenGraph Tags"}
                  </button>
                </div>
              </div>

              {/* Technical Audit Checklist */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4 text-left">
                <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-widest block mb-3">AI Agent Priority Technical Optimizations:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seoResult.checklist.map((item, idx) => (
                    <div key={idx} className="bg-neutral-950 border border-neutral-850 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                      <div className="shrink-0 h-4 w-4 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mt-0.5">
                        <Check size={10} />
                      </div>
                      <span className="text-neutral-300 leading-relaxed font-sans">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Keyword Metrics and robots.txt */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Keyword table */}
                <div className="md:col-span-7 bg-neutral-900 border border-neutral-850 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-widest block mb-2.5">Keyword Traffic Metrics Recommendation:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10px] text-neutral-400">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[8px] uppercase text-neutral-500">
                          <th className="pb-2">Target Keyword</th>
                          <th className="pb-2 text-center">Volume</th>
                          <th className="pb-2 text-right">Competition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/40">
                        {seoResult.keywordRecommendations.map((rec, rIdx) => (
                          <tr key={rIdx} className="hover:bg-neutral-950/20">
                            <td className="py-2.5 font-sans font-bold text-neutral-300">{rec.keyword}</td>
                            <td className={`py-2.5 text-center font-bold ${rec.searchVolume === "High" ? "text-emerald-400" : rec.searchVolume === "Medium" ? "text-yellow-400" : "text-neutral-500"}`}>{rec.searchVolume}</td>
                            <td className={`py-2.5 text-right font-bold ${rec.competition === "High" ? "text-rose-400" : rec.competition === "Medium" ? "text-yellow-400" : "text-emerald-400"}`}>{rec.competition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Robots.txt Configuration output */}
                <div className="md:col-span-5 bg-neutral-900 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-widest block">robots.txt config snippet:</span>
                    <pre className="bg-neutral-950 border border-neutral-850 p-2.5 rounded-xl font-mono text-[10px] text-neutral-400 overflow-x-auto whitespace-pre leading-relaxed text-left h-28">
                      {seoResult.robotsTxt}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopy(seoResult.robotsTxt, "robotstxt")}
                    className="w-full py-2 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all text-center mt-2"
                  >
                    {copiedText === "robotstxt" ? "robots.txt Copied ✓" : "Copy robots.txt Config"}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
