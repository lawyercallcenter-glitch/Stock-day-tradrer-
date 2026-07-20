import React, { useState, useEffect, useRef } from "react";
import { StockMetric, StockHistoricalData, TradeLog, StockBagItem } from "./types";
import StockChart from "./components/StockChart";
import StockFundamentals from "./components/StockFundamentals";
import TradeModal from "./components/TradeModal";
import TradeJournalForm from "./components/TradeJournalForm";
import TradeBagsManager from "./components/TradeBagsManager";
import AIScanConsole from "./components/AIScanConsole";
import GeminiChat from "./components/GeminiChat";
import RecommendationEngine from "./components/RecommendationEngine";
import ProgressLearning from "./components/ProgressLearning";
import PricingPage from "./components/PricingPage";
import MarketingConsole from "./components/MarketingConsole";
import WorkspaceHub from "./components/WorkspaceHub";
import MarketSentimentGauge from "./components/MarketSentimentGauge";
import { LineChart, Briefcase, Activity, Sparkles, TrendingUp, Compass, Cpu, Bell, Star, Shield, LogIn, LogOut, Check, X, FileSearch, ExternalLink, HelpCircle, Zap, CreditCard, Megaphone, GraduationCap, BookOpen } from "lucide-react";
import { initAuth, googleSignIn, googleSignOut, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { loadGooglePickerScript, showGooglePicker, fetchContacts } from "./lib/workspace";
import { User } from "firebase/auth";
import StockBanner from "./components/StockBanner";
import Sparkline from "./components/Sparkline";
import ConfirmationModal from "./components/ConfirmationModal";

interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

interface StockAlert {
  id: string;
  symbol: string;
  type: "price_above" | "price_below" | "volume_spike";
  targetValue: number;
  active: boolean;
  triggered: boolean;
  message: string;
  createdAt: string;
}

export default function App() {
  // Screen Wake Lock API to prevent screensaver
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err: any) {
        // Silently ignore wake lock policy errors in iframe
        console.log("Wake Lock not allowed in this context.");
      }
    };
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
      }
    };
  }, []);

  const [presets, setPresets] = useState<StockMetric[]>([]);
  const [activeTicker, setActiveTicker] = useState("NVDA");
  const [symbolData, setSymbolData] = useState<StockHistoricalData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<"day_trade" | "long_term">("day_trade");
  const [theme, setTheme] = useState<"midnight" | "daylight">("midnight");
  const [selectedTab, setSelectedTab] = useState<"visualizer" | "bags" | "ai_console" | "gemini_chat" | "recommendations" | "pricing" | "marketing" | "progress" | "workspace" | "google_meet" | "contacts" | "journal">("visualizer");
  const [pendingTickerSelection, setPendingTickerSelection] = useState<string | null>(null);
  const [tradeModalTicker, setTradeModalTicker] = useState<string | null>(null);

  const approveTickerSelection = () => {
    if (pendingTickerSelection) {
      setActiveTicker(pendingTickerSelection);
      setSelectedTab("visualizer");
      setPendingTickerSelection(null);
    }
  };
  const rejectTickerSelection = () => setPendingTickerSelection(null);

  // Google OAuth & Auth states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Personalized Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Live Alerting State
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [newAlertTarget, setNewAlertTarget] = useState<string>("");
  const [newAlertType, setNewAlertType] = useState<"price_above" | "price_below" | "volume_spike">("price_above");
  const [alertIntensity, setAlertIntensity] = useState<"moderate" | "aggressive">("moderate");
  const [trendFilter, setTrendFilter] = useState<"bullish" | "bearish" | "all">("all");
  
  // Real-time Active Price Notification state
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    body: string;
    time: string;
  } | null>(null);

  // Picker states
  const [importedFile, setImportedFile] = useState<{ id: string; name: string; url: string; mimeType: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [sheetData, setSheetData] = useState<string[][] | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const loadSheetContents = async (spreadsheetId: string, token: string) => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!metaRes.ok) throw new Error("Failed to load sheet metadata");
      const meta = await metaRes.json();
      const firstSheetName = meta.sheets[0].properties.title;

      const dataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A1:Z50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!dataRes.ok) throw new Error("Failed to load sheet data");
      const data = await dataRes.json();
      setSheetData(data.values || []);
    } catch (err: any) {
      setSheetError(err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  // 1. Initial Google API & Firebase Auth boot
  useEffect(() => {
    // Monitor auth change
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Fetch preset tickers on boot
  useEffect(() => {
    fetch("/api/stocks/presets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load presets.");
        return res.json();
      })
      .then((data) => {
        setPresets(data);
      })
      .catch((err) => {
        console.log("Presets load error");
        setPresets([
          { symbol: "NVDA", name: "NVIDIA Corp", price: 135.42, change: 4.82, changePercent: 3.69, high: 136.20, low: 130.80, volume: "52M", atr: 5.12, beta: 1.85, vibe: "Both", catalyst: "Semiconductor Blackwell high volume catalyst.", peRatio: 72.5, eps: 1.89, sentimentScore: 85 },
          { symbol: "TSLA", name: "Tesla Inc", price: 242.15, change: -8.32, changePercent: -3.32, high: 251.50, low: 240.10, volume: "84M", atr: 11.45, beta: 2.10, vibe: "Day Trade", catalyst: "Intraday option gamma squeeze.", peRatio: 65.2, eps: 3.21, sentimentScore: -15 },
          { symbol: "COIN", name: "Coinbase Global", price: 215.80, change: 12.45, changePercent: 6.12, high: 218.40, low: 201.20, volume: "12M", atr: 14.20, beta: 2.80, vibe: "Day Trade", catalyst: "Crypto volume spike catalyst.", peRatio: 45.3, eps: 2.50, sentimentScore: 45 },
          { symbol: "AAPL", name: "Apple Inc", price: 188.30, change: 0.45, changePercent: 0.24, high: 189.10, low: 187.50, volume: "41M", atr: 2.80, beta: 0.95, vibe: "Long Term", catalyst: "Capital buyback compounding.", peRatio: 32.1, eps: 6.43, sentimentScore: 10 },
          { symbol: "QQQ", name: "Invesco QQQ ETF", price: 438.10, change: 3.12, changePercent: 0.72, high: 439.50, low: 434.20, volume: "38M", atr: 5.40, beta: 1.00, vibe: "Long Term", catalyst: "Compounding growth indexing.", peRatio: 28.5, eps: 12.10, sentimentScore: 25 }
        ]);
      });
  }, []);

  // 3. Fetch chart ticks for selected ticker
  useEffect(() => {
    setLoadingData(true);
    fetch(`/api/stocks/history/${activeTicker}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load historical ticks.");
        return res.json();
      })
      .then((data) => {
        setSymbolData(data);
        // Pre-fill alert target nicely based on current price
        const preset = presets.find((p) => p.symbol === activeTicker);
        if (preset) {
          setNewAlertTarget(preset.price.toFixed(2));
        }
      })
      .catch((err) => {
        console.log("Ticker fetch error");
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [activeTicker, presets]);

  // 4. Sync Watchlist and Alerts when user logs in
  useEffect(() => {
    const loadSyncedUserData = async () => {
      if (user) {
        setWatchlistLoading(true);
        setAlertsLoading(true);
        try {
          // Sync watchlist
          const wlPath = `users/${user.uid}/watchlist`;
          let wlSnap;
          try {
            wlSnap = await getDocs(collection(db, wlPath));
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, wlPath);
            return;
          }
          const wlItems: WatchlistItem[] = [];
          wlSnap.forEach((docRef) => {
            wlItems.push({
              symbol: docRef.id,
              addedAt: docRef.data().addedAt,
            });
          });
          setWatchlist(wlItems);

          // Sync alerts
          const alertsPath = `users/${user.uid}/alerts`;
          let alertsSnap;
          try {
            alertsSnap = await getDocs(collection(db, alertsPath));
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, alertsPath);
            return;
          }
          const alertItems: StockAlert[] = [];
          alertsSnap.forEach((docRef) => {
            const data = docRef.data();
            alertItems.push({
              id: docRef.id,
              symbol: data.symbol,
              type: data.type,
              targetValue: data.targetValue,
              active: data.active,
              triggered: data.triggered || false,
              message: data.message || "",
              createdAt: data.createdAt,
            });
          });
          setAlerts(alertItems);
        } catch (err) {
          console.error("Firestore user sync error:", err);
        } finally {
          setWatchlistLoading(false);
          setAlertsLoading(false);
        }
      } else {
        // Local state fallback
        const localWl = localStorage.getItem("stock_watchlist");
        const localAlerts = localStorage.getItem("stock_alerts");
        if (localWl) setWatchlist(JSON.parse(localWl));
        if (localAlerts) setAlerts(JSON.parse(localAlerts));
      }
    };

    loadSyncedUserData();
  }, [user]);

  // 5. Background Alert Evaluation Checker (Simulated real-time high-conviction trigger)
  useEffect(() => {
    const checkAlertsEngine = async () => {
      if (alerts.length === 0) return;

      const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
      if (activeAlerts.length === 0) return;

      // Check each alert
      for (const alert of activeAlerts) {
        if (!alert.symbol) continue;
        try {
          // Fetch high-frequency ticket price
          const res = await fetch(`/api/stocks/realtime/${encodeURIComponent(alert.symbol)}`);
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            const tick = await res.json();
            const price = tick.price;
            let conditionMet = false;

            if (alert.type === "price_above" && price >= alert.targetValue) {
              conditionMet = true;
            } else if (alert.type === "price_below" && price <= alert.targetValue) {
              conditionMet = true;
            } else if (alert.type === "volume_spike") {
              const preset = presets.find((p) => p.symbol === alert.symbol);
              const baseVol = preset ? parseInt(preset.volume) * 1000000 : 5000000;
              if (tick.volume > baseVol * 1.15) {
                conditionMet = true;
              }
            }

            if (conditionMet) {
              // Trigger in-app notification state!
              setActiveNotification({
                id: alert.id,
                title: `🚨 SECURE ALERT TRIGGERED: ${alert.symbol}`,
                body: `${alert.symbol} crossed your ${alert.type.replace("_", " ")} target of $${alert.targetValue}! Current market: $${price.toFixed(2)}.`,
                time: new Date().toLocaleTimeString(),
              });

              // Mark alert as triggered
              const updatedAlerts = alerts.map((a) =>
                a.id === alert.id ? { ...a, triggered: true, active: false } : a
              );
              setAlerts(updatedAlerts);

              // Persist alert trigger state
              if (user) {
                const path = `users/${user.uid}/alerts/${alert.id}`;
                await setDoc(doc(db, path), {
                  symbol: alert.symbol,
                  type: alert.type,
                  targetValue: alert.targetValue,
                  active: false,
                  triggered: true,
                  message: `Crossed target at $${price.toFixed(2)}`,
                  createdAt: alert.createdAt,
                }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
              } else {
                localStorage.setItem("stock_alerts", JSON.stringify(updatedAlerts));
              }
            }
          }
        } catch (err) {
          console.log("Alert checker fetch issue");
        }
      }
    };

    const interval = setInterval(checkAlertsEngine, 5000); // Check all active alerts every 5 seconds
    return () => clearInterval(interval);
  }, [alerts, presets, user]);

  // 6. Fetch contacts when tab changes to contacts
  useEffect(() => {
    if (selectedTab === "contacts" && accessToken && contacts.length === 0) {
      fetchContacts(accessToken).then(setContacts).catch(console.error);
    }
  }, [selectedTab, accessToken, contacts.length]);

  // Google OAuth triggers
  const handleConnectWorkspace = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error("Auth connect failed:", err);
    }
  };

  const handleDisconnectWorkspace = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setWatchlist([]);
    setAlerts([]);
  };

  // Watchlist Actions
  const handleAddToWatchlist = async (symbolToAdd: string) => {
    const cleanSym = symbolToAdd.toUpperCase().trim();
    if (watchlist.some((w) => w.symbol === cleanSym)) return;

    const newItem: WatchlistItem = {
      symbol: cleanSym,
      addedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...watchlist];
    setWatchlist(updated);

    if (user) {
      const path = `users/${user.uid}/watchlist/${cleanSym}`;
      await setDoc(doc(db, path), {
        symbol: cleanSym,
        addedAt: newItem.addedAt,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    } else {
      localStorage.setItem("stock_watchlist", JSON.stringify(updated));
    }
  };

  const handleRemoveFromWatchlist = async (sym: string) => {
    const updated = watchlist.filter((w) => w.symbol !== sym);
    setWatchlist(updated);

    if (user) {
      const path = `users/${user.uid}/watchlist/${sym}`;
      await deleteDoc(doc(db, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    } else {
      localStorage.setItem("stock_watchlist", JSON.stringify(updated));
    }
  };

  // Alert Actions
  const createAlert = async (symbol: string, type: "price_above" | "price_below" | "volume_spike", target: number) => {
    const alertId = `alert-${Date.now()}-${symbol}`;
    const newAlert: StockAlert = {
      id: alertId,
      symbol: symbol,
      type: type,
      targetValue: target,
      active: true,
      triggered: false,
      message: `${symbol} natural alert set at $${target.toFixed(2)}`,
      createdAt: new Date().toISOString(),
    };

    setAlerts((prev) => [newAlert, ...prev]);

    if (user) {
      const path = `users/${user.uid}/alerts/${alertId}`;
      await setDoc(doc(db, path), {
        symbol: newAlert.symbol,
        type: newAlert.type,
        targetValue: newAlert.targetValue,
        active: true,
        triggered: false,
        message: newAlert.message,
        createdAt: newAlert.createdAt,
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    } else {
      localStorage.setItem("stock_alerts", JSON.stringify([newAlert, ...alerts]));
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAlertTarget);
    if (isNaN(val) || val <= 0) return;
    await createAlert(activeTicker, newAlertType, val);
    setNewAlertTarget("");
  };

  const setNaturalAlerts = async () => {
    const multiplier = alertIntensity === "aggressive" ? 0.02 : 0.05;
    for (const preset of presets) {
      // Trend filter
      if (trendFilter === "bullish" && (preset.sentimentScore ?? 0) < 0) continue;
      if (trendFilter === "bearish" && (preset.sentimentScore ?? 0) > 0) continue;

      // Logic
      if ((preset.sentimentScore ?? 0) > 40) {
        await createAlert(preset.symbol, "price_above", preset.price * (1 + multiplier));
      } else if ((preset.sentimentScore ?? 0) < -40) {
        await createAlert(preset.symbol, "price_below", preset.price * (1 - multiplier));
      } else {
        await createAlert(preset.symbol, "volume_spike", preset.price);
      }
    }
  };

  const handleRemoveAlert = async (alertId: string) => {
    const updated = alerts.filter((a) => a.id !== alertId);
    setAlerts(updated);

    if (user) {
      const path = `users/${user.uid}/alerts/${alertId}`;
      await deleteDoc(doc(db, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    } else {
      localStorage.setItem("stock_alerts", JSON.stringify(updated));
    }
  };

  // Google Picker Trigger
  const triggerPicker = async () => {
    if (!accessToken) return;
    try {
      await loadGooglePickerScript();
      showGooglePicker(accessToken, (file) => {
        setImportedFile(file);
        if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
          loadSheetContents(file.id, accessToken);
        }
      });
    } catch (err) {
      console.error("Google Picker load error:", err);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "midnight" ? "midnight" : "daylight"} flex flex-col selection:bg-emerald-500 selection:text-neutral-950 relative overflow-x-hidden`}>
      
      <ConfirmationModal 
        ticker={pendingTickerSelection} 
        onApprove={approveTickerSelection} 
        onReject={rejectTickerSelection} 
      />
      {tradeModalTicker && (
        <TradeModal 
          symbol={tradeModalTicker} 
          onClose={() => setTradeModalTicker(null)} 
          onTrade={(type) => {
            console.log(`Executed ${type} for ${tradeModalTicker}`);
            setTradeModalTicker(null);
          }}
        />
      )}

      {/* Top Warning Banner / In-App Live Notifications */}
      {activeNotification && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full bg-rose-950 border-2 border-rose-500/80 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase">
              <Bell size={13} className="animate-bounce" />
              {activeNotification.title}
            </span>
            <button onClick={() => setActiveNotification(null)} className="text-neutral-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <p className="text-xs text-neutral-200 leading-normal font-sans text-left">
            {activeNotification.body}
          </p>
          <div className="flex justify-end gap-1.5 text-[10px] font-mono">
            <button
              onClick={() => {
                // Snooze: Reactivate alert as untriggered, set active to true
                const reactivated = alerts.map((a) =>
                  a.id === activeNotification.id ? { ...a, triggered: false, active: true } : a
                );
                setAlerts(reactivated);
                if (!user) localStorage.setItem("stock_alerts", JSON.stringify(reactivated));
                setActiveNotification(null);
              }}
              className="bg-neutral-900 border border-neutral-850 text-neutral-400 px-2 py-1 rounded-md hover:text-white"
            >
              Snooze 5m
            </button>
            <button
              onClick={() => setActiveNotification(null)}
              className="bg-rose-500 text-neutral-950 font-bold px-2 py-1 rounded-md hover:bg-rose-600"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Terminal Bar */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center glow-emerald">
              <Activity className="text-emerald-400 stroke-[2.5]" size={20} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-base text-white tracking-tight leading-none md:text-lg">
                  Stock Day Trader and Portfolio Analyzer
                </h1>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">
                  PRO v2.5
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono mt-1">
                Sera Core Engine — High-conviction setups with real compounding bags
              </p>
            </div>
          </div>

          <MarketSentimentGauge />

          {/* Google Auth Integration Section */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <span className="font-mono text-[10px] text-neutral-500">Checking credentials...</span>
            ) : user ? (
              <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 pr-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="h-6 w-6 rounded-lg border border-neutral-700" />
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-bold text-white leading-tight truncate max-w-[100px]">{user.displayName || "Connected User"}</p>
                  <p className="text-[8px] font-mono text-emerald-400 leading-none">DURABLE CLOUD SYNC</p>
                </div>
                <button
                  onClick={handleDisconnectWorkspace}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Disconnect Workspace"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWorkspace}
                className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/5 cursor-pointer uppercase tracking-wider"
              >
                <LogIn size={13} />
                Connect Workspace
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "midnight" ? "daylight" : "midnight")}
              className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-neutral-400 hover:text-white cursor-pointer"
            >
              {theme === "midnight" ? "☀️" : "🌙"}
            </button>

            {/* Sub Navigation Tabs */}
            <div className="flex bg-neutral-900 border border-neutral-850 p-1 rounded-xl">
              <button
                onClick={() => setSelectedTab("visualizer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "visualizer" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <LineChart size={13} /> Screen
              </button>
              <button
                onClick={() => setSelectedTab("bags")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "bags" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Briefcase size={13} /> Real Bags
              </button>
              <button
                onClick={() => setSelectedTab("ai_console")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "ai_console" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Compass size={13} /> AI Analyst
              </button>
              <button
                onClick={() => setSelectedTab("gemini_chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "gemini_chat" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Sparkles size={13} /> Gemini Chat
              </button>
              <button
                onClick={() => setSelectedTab("recommendations")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "recommendations" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Zap size={13} /> Day Trade Recs
              </button>
              <button
                onClick={() => setSelectedTab("google_meet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "google_meet" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Zap size={13} /> Google Meet
              </button>
              <button
                onClick={() => setSelectedTab("contacts")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "contacts" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Zap size={13} /> Contacts
              </button>
              <button
                onClick={() => setSelectedTab("journal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "journal" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <BookOpen size={13} /> Journal
              </button>
              <button
                onClick={() => setSelectedTab("pricing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "pricing" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <CreditCard size={13} /> Pricing & Plans
              </button>
              <button
                onClick={() => setSelectedTab("progress")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "progress" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <GraduationCap size={13} /> Savings Strategy
              </button>
              <button
                onClick={() => setSelectedTab("marketing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "marketing" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Megaphone size={13} /> Doxiql Growth
              </button>
              <button
                onClick={() => setSelectedTab("workspace")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${selectedTab === "workspace" ? "bg-neutral-850 text-emerald-400 font-bold border border-neutral-800" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                <Briefcase size={13} /> Workspace
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Futuristic Stock Suggestion Banner */}
      <StockBanner onSelectTicker={(sym) => { setActiveTicker(sym); setSelectedTab("visualizer"); }} onTradeTicker={(sym) => setTradeModalTicker(sym)} />

      {/* Main Terminal Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Preset Ticker Market Bar */}
        <section id="preset-ticker-bar" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {presets.map((preset) => {
            const isSelected = activeTicker === preset.symbol;
            const isUp = preset.change >= 0;
            return (
              <button
                key={preset.symbol}
                onClick={() => {
                  setActiveTicker(preset.symbol);
                  if (preset.vibe === "Day Trade") setChartViewMode("day_trade");
                  if (preset.vibe === "Long Term") setChartViewMode("long_term");
                }}
                className={`bg-neutral-900 border text-left p-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  isSelected 
                    ? "border-emerald-500/60 bg-neutral-900 glow-emerald" 
                    : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-white">{preset.symbol}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border uppercase ${
                    preset.vibe === "Long Term" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : preset.vibe === "Day Trade"
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                  }`}>
                    {preset.vibe}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 font-medium truncate mt-0.5">{preset.name}</p>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-neutral-800/40">
                  <span className="font-mono font-bold text-sm text-neutral-100">${preset.price.toFixed(2)}</span>
                  <span className={`font-mono text-xs font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                    {isUp ? "+" : ""}{preset.changePercent.toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Selected View Rendering */}
        <section id="terminal-view-deck" className="space-y-6">
          
          {selectedTab === "visualizer" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Left Column: Interactive Technical Chart & Controls */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Chart Mode Controls */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-emerald-400 shrink-0" size={16} />
                    <span className="font-sans font-bold text-xs text-neutral-300 uppercase tracking-wide">
                      Interactive Visualizer Mode
                    </span>
                  </div>

                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button
                      onClick={() => setChartViewMode("day_trade")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${chartViewMode === "day_trade" ? "bg-neutral-850 text-emerald-400 border border-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      Day Trade (5M Intraday)
                    </button>
                    <button
                      onClick={() => setChartViewMode("long_term")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${chartViewMode === "long_term" ? "bg-neutral-850 text-emerald-400 border border-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      Long Term (Compounding 120D)
                    </button>
                  </div>
                </div>

                {(() => {
                  const activePreset = presets.find(p => p.symbol === activeTicker);
                  return (
                  <>
                    <StockChart
                      symbol={activeTicker}
                      data={symbolData}
                      loading={loadingData}
                      viewMode={chartViewMode}
                      atr={activePreset?.atr}
                      beta={activePreset?.beta}
                    />
                    {activePreset && <StockFundamentals metric={activePreset} />}
                  </>
                  );
                })()}
              </div>

              {/* Right Column: Watchlist, Active Alerts, Sera's Intelligence */}
              <div className="space-y-6">
                
                {/* 1. Personalized Watchlist Section */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800/40">
                    <h4 className="font-sans font-bold text-sm text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Star size={15} className="text-yellow-400 fill-yellow-400" />
                      My Live Watchlist
                    </h4>
                    <button
                      onClick={() => handleAddToWatchlist(activeTicker)}
                      className="bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                    >
                      + Add {activeTicker}
                    </button>
                  </div>

                  {watchlistLoading ? (
                    <p className="font-mono text-xs text-neutral-500 animate-pulse py-2">Refreshing watchlist...</p>
                  ) : watchlist.length === 0 ? (
                    <p className="text-xs text-neutral-500 font-sans py-4 text-center">Your watch list is currently empty. Click Add above to track.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[185px] overflow-y-auto pr-1">
                      {watchlist.map((wl) => {
                        const isMatch = activeTicker === wl.symbol;
                        const preset = presets.find((p) => p.symbol === wl.symbol);
                        const curPrice = preset ? preset.price : 100.00;
                        const isUp = preset ? preset.change >= 0 : true;

                        // Pseudo-random but stable based on symbol name to avoid flicker on every render
                        const getSparklineData = (sym: string, base: number) => {
                          let val = base * 0.95;
                          const hash = sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1);
                          return Array.from({length: 15}, (_, i) => {
                             const change = Math.sin(hash + i) * 0.02 + (isUp ? 0.008 : -0.008);
                             val = val * (1 + change);
                             return val;
                          });
                        };
                        const sparklineData = getSparklineData(wl.symbol, curPrice);

                        return (
                          <div
                            key={wl.symbol}
                            onClick={() => setActiveTicker(wl.symbol)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${isMatch ? "bg-neutral-950 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-neutral-950/40 border-neutral-850 hover:border-neutral-800"}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold font-mono text-sm text-white">{wl.symbol}</span>
                              <span className="text-[8px] text-neutral-500 font-mono">WATCHED</span>
                            </div>

                            <div className="flex-1 px-4 flex justify-center">
                              <Sparkline data={sparklineData} isUp={isUp} />
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-bold text-xs text-neutral-200">${curPrice.toFixed(2)}</span>
                                <span className={`font-mono text-[9px] ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                  {isUp ? "+" : ""}{preset ? preset.changePercent.toFixed(2) : "0.00"}%
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromWatchlist(wl.symbol);
                                }}
                                className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-600 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Interactive Alert System Section */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800/40">
                    <h4 className="font-sans font-bold text-sm text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell size={15} className="text-emerald-400" />
                      Tactical Alerts Core
                    </h4>
                    <button
                      onClick={setNaturalAlerts}
                      className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      AI Set Natural
                    </button>
                    <span className="font-mono text-[9px] text-neutral-500">LIVE BG ENGINE</span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <select
                      value={alertIntensity}
                      onChange={(e) => setAlertIntensity(e.target.value as any)}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1 text-[10px] font-mono text-neutral-300"
                    >
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                    <select
                      value={trendFilter}
                      onChange={(e) => setTrendFilter(e.target.value as any)}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1 text-[10px] font-mono text-neutral-300"
                    >
                      <option value="all">All Trends</option>
                      <option value="bullish">Bullish Only</option>
                      <option value="bearish">Bearish Only</option>
                    </select>
                  </div>
                  <form onSubmit={handleCreateAlert} className="grid grid-cols-12 gap-2 mb-4">
                    <select
                      value={newAlertType}
                      onChange={(e) => setNewAlertType(e.target.value as any)}
                      className="col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-[10px] font-mono text-neutral-300"
                    >
                      <option value="price_above">Price &gt;=</option>
                      <option value="price_below">Price &lt;=</option>
                      <option value="volume_spike">Vol Spike</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Target"
                      value={newAlertTarget}
                      onChange={(e) => setNewAlertTarget(e.target.value)}
                      className="col-span-4 bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs font-bold font-mono text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="col-span-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold py-1 px-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      Set
                    </button>
                  </form>

                  {alertsLoading ? (
                    <p className="font-mono text-xs text-neutral-500 py-1">Refreshing alerts...</p>
                  ) : alerts.length === 0 ? (
                    <p className="text-xs text-neutral-500 font-sans py-2 text-center">No active alerts set for {activeTicker}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {alerts.map((al) => (
                        <div
                          key={al.id}
                          className="bg-neutral-950 border border-neutral-850 p-2 rounded-xl flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-white text-[11px]">{al.symbol}</span>
                            <span className="text-[9px] text-neutral-500 uppercase">
                              {al.type.replace("_", " ")} @ ${al.targetValue.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {al.triggered ? (
                              <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase font-bold">Triggered</span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Active</span>
                            )}
                            <button
                              onClick={() => handleRemoveAlert(al.id)}
                              className="text-neutral-600 hover:text-white transition-colors p-1"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Google Picker: External Research Integration */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800/40">
                    <h4 className="font-sans font-bold text-sm text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSearch size={15} className="text-emerald-400" />
                      External Research Notes
                    </h4>
                  </div>

                  {accessToken ? (
                    <div>
                      <button
                        onClick={triggerPicker}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <FileSearch size={13} className="text-emerald-400" />
                        Import Google Drive File
                      </button>

                      {importedFile && (
                        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-left">
                          <p className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Research File Picked</p>
                          <p className="text-xs font-sans font-bold text-white truncate mt-1">{importedFile.name}</p>
                          
                          {sheetLoading && (
                            <p className="text-[10px] text-emerald-300 font-mono mt-1 animate-pulse">Loading sheet data...</p>
                          )}
                          
                          {sheetError && (
                            <p className="text-[10px] text-rose-400 font-mono mt-1 border border-rose-500/30 bg-rose-500/10 p-1.5 rounded">Error: {sheetError}</p>
                          )}

                          {sheetData && sheetData.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mb-1">Preview (Rows 1-{Math.min(sheetData.length, 5)})</p>
                              <div className="overflow-x-auto overflow-y-hidden max-h-[120px] rounded border border-emerald-500/20 bg-neutral-950">
                                <table className="w-full text-left text-[9px] font-mono text-neutral-300 whitespace-nowrap">
                                  <tbody>
                                    {sheetData.slice(0, 5).map((row, i) => (
                                      <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                                        {row.map((cell, j) => (
                                          <td key={j} className="px-2 py-1.5 border-r border-neutral-800/50 last:border-0">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <a href={importedFile.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-[10px] text-emerald-400 font-bold underline hover:no-underline">
                            View original sheet <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 leading-normal font-sans text-center py-2">
                      💡 Click <span className="text-emerald-400 font-bold">Connect Workspace</span> in the header to securely browse and link your research sheets directly via the native Google Picker.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {selectedTab === "bags" && (
            <div className="animate-fadeIn">
              <TradeBagsManager presets={presets} user={user} accessToken={accessToken} />
            </div>
          )}

          {selectedTab === "ai_console" && (
            <div className="animate-fadeIn">
              <AIScanConsole 
                presets={presets} 
                onSelectTicker={(sym) => setActiveTicker(sym)} 
                onProposeTicker={(sym) => setPendingTickerSelection(sym)}
                accessToken={accessToken} 
              />
            </div>
          )}

          {selectedTab === "gemini_chat" && (
            <div className="animate-fadeIn">
              <GeminiChat />
            </div>
          )}

          {selectedTab === "recommendations" && (
            <div className="animate-fadeIn">
              <RecommendationEngine 
                onSelectTicker={(sym) => { setActiveTicker(sym); setSelectedTab("visualizer"); }} 
                onProposeTicker={(sym) => setPendingTickerSelection(sym)}
                accessToken={accessToken} 
              />
            </div>
          )}

          {selectedTab === "google_meet" && (
            <div className="animate-fadeIn p-6 bg-neutral-900 rounded-2xl border border-neutral-800">
              <h2 className="text-xl font-bold mb-4">Google Meet</h2>
              <p>Google Meet integration coming soon.</p>
            </div>
          )}

          {selectedTab === "journal" && (
            <div className="max-w-md mx-auto animate-fadeIn">
              <TradeJournalForm user={user} initialTicker={activeTicker} initialPrice={presets.find(p => p.symbol === activeTicker)?.price} />
            </div>
          )}

          {selectedTab === "contacts" && (
            <div className="animate-fadeIn p-6 bg-neutral-900 rounded-2xl border border-neutral-800">
              <h2 className="text-xl font-bold mb-4">Contacts</h2>
              {contacts.length === 0 ? (
                <p>No contacts found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((c: any) => (
                    <div key={c.resourceName} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-4">
                      {c.photos?.[0] && <img src={c.photos[0].url} className="w-12 h-12 rounded-full" />}
                      <div>
                        <p className="font-bold">{c.names?.[0]?.displayName}</p>
                        <p className="text-xs text-neutral-500">{c.emailAddresses?.[0]?.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "pricing" && (
            <div className="animate-fadeIn">
              <PricingPage />
            </div>
          )}

          {selectedTab === "progress" && (
            <div className="animate-fadeIn">
              <ProgressLearning />
            </div>
          )}
          {selectedTab === "marketing" && (
            <div className="animate-fadeIn">
              <MarketingConsole />
            </div>
          )}
          {selectedTab === "workspace" && (
            <div className="animate-fadeIn">
              <WorkspaceHub accessToken={accessToken} />
            </div>
          )}

        </section>

      </main>

      {/* Visual background ambient details */}
      <footer className="mt-auto py-8 border-t border-neutral-900 bg-neutral-950/40 text-center font-mono text-[10px] text-neutral-600">
        <p>© 2026 Stock Day Trader and Portfolio Analyzer. All intelligence models processed on-demand.</p>
        <p className="mt-1 text-neutral-700">Data provided via Google Search Grounding. No financial advice simulated.</p>
      </footer>
    </div>
  );
}
