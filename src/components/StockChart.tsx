import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { StockHistoricalData } from "../types";
import { TrendingUp, TrendingDown, DollarSign, Settings, Sliders, Layers, ChevronDown } from "lucide-react";
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from "../lib/indicators";

const TICKER_NAMES: Record<string, string> = {
  NVDA: "NVIDIA Corp",
  TSLA: "Tesla Inc",
  COIN: "Coinbase Global",
  AAPL: "Apple Inc",
  QQQ: "Invesco QQQ ETF",
};

interface StockChartProps {
  symbol: string;
  data: StockHistoricalData | null;
  loading: boolean;
  viewMode: "day_trade" | "long_term";
  atr?: number;
  beta?: number;
}

export default function StockChart({ symbol, data, loading, viewMode, atr, beta }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const mainHeight = 220;
  const subHeight = 70;

  // Real-time dynamic live feed state (bid, ask, spread, high frequency ticks)
  const [liveTick, setLiveTick] = useState<{
    price: number;
    bid: number;
    ask: number;
    spread: number;
    volume: number;
    timestamp: string;
  } | null>(null);

  // Technical Indicators & Controls toggles
  const [chartType, setChartType] = useState<"line" | "candlestick" | "area">("candlestick");
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Custom periods
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [emaPeriod, setEmaPeriod] = useState(9);
  const [showSettings, setShowSettings] = useState(false);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(Math.max(300, entries[0].contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Live High-Frequency Price Feed Simulation via Polling (/api/stocks/realtime/:symbol)
  useEffect(() => {
    if (loading || !data || !symbol) return;

    const fetchLiveTick = async () => {
      try {
        const res = await fetch(`/api/stocks/realtime/${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const tickData = await res.json();
          setLiveTick(tickData);
        }
      } catch (err) {
        console.log("Failed to fetch live real-time stock tick");
      }
    };

    fetchLiveTick();
    const interval = setInterval(fetchLiveTick, 1500); // 1.5 seconds tick update
    return () => clearInterval(interval);
  }, [symbol, data, loading]);

  if (loading) {
    return (
      <div className="h-[360px] w-full flex flex-col items-center justify-center bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse">
        <div className="text-neutral-500 font-mono text-xs tracking-widest uppercase">LOADING TICKER PRICE ACTION & INDICATORS...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[360px] w-full flex flex-col items-center justify-center bg-neutral-900/40 border border-neutral-800 rounded-2xl">
        <p className="text-neutral-500 text-sm font-medium">Select a ticker to plot market waves and calculate technical signals</p>
      </div>
    );
  }

  const isDayTrade = viewMode === "day_trade";
  const rawPoints: any[] = isDayTrade ? data.intraday : data.history;

  if (!rawPoints || rawPoints.length === 0) {
    return (
      <div className="h-[360px] w-full flex items-center justify-center bg-neutral-900/40 border border-neutral-800 rounded-2xl">
        <p className="text-neutral-500 text-sm">No price ticks available for {symbol}</p>
      </div>
    );
  }

  // Map raw points to standardized IndicatorPoint structure with OHLC
  const points = rawPoints.map((p: any, i) => {
    const close = p.price ?? p.close;
    // Synthesize OHL if missing (for intraday)
    const open = p.open ?? (p.price ? p.price * (1 + Math.sin(i * 1.5) * 0.001) : close);
    const high = p.high ?? Math.max(open, close) * (1 + 0.0012);
    const low = p.low ?? Math.min(open, close) * (1 - 0.0012);
    const volume = p.volume ?? 10000;
    const label = p.time ?? p.date;

    return {
      open,
      high,
      low,
      close,
      volume,
      label,
    };
  });

  const closes = points.map((p) => p.close);

  // Technical Calculations
  const sma20 = calculateSMA(closes, smaPeriod);
  const sma50 = calculateSMA(closes, 50);
  const ema9 = calculateEMA(closes, emaPeriod);
  const ema21 = calculateEMA(closes, 21);
  const rsiValues = calculateRSI(closes, 14);
  const macdResult = calculateMACD(closes, 12, 26, 9);

  // Calculate limits for main chart
  const maxPrice = Math.max(...points.map((p) => p.high)) * 1.005;
  const minPrice = Math.min(...points.map((p) => p.low)) * 0.995;
  const priceRange = maxPrice - minPrice;

  const getX = (index: number) => {
    return (index / (points.length - 1)) * (width - 85) + 40;
  };

  const getY = (price: number) => {
    return mainHeight - 25 - ((price - minPrice) / priceRange) * (mainHeight - 50);
  };

  // SVG lines
  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.close)}`)
    .join(" ");

  const areaD = `${lineD} L ${getX(points.length - 1)} ${mainHeight - 25} L ${getX(0)} ${mainHeight - 25} Z`;

  // Determine current active prices
  const firstPrice = closes[0];
  const lastPrice = liveTick ? liveTick.price : closes[closes.length - 1];
  const priceChange = lastPrice - firstPrice;
  const isUp = priceChange >= 0;
  const strokeColor = isUp ? "#10b981" : "#f43f5e";
  const gradientId = `chart-gradient-${symbol}-${viewMode}`;

  // Hover point selection
  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const activePrice = hoverPoint ? hoverPoint.close : lastPrice;
  const activeLabel = hoverPoint ? hoverPoint.label : (points[points.length - 1].label);

  // Draw indicators helper
  const renderIndicatorLine = (values: (number | null)[], color: string, widthVal = 1.5) => {
    const pathPoints: string[] = [];
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val !== null) {
        pathPoints.push(`${pathPoints.length === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`);
      }
    }
    return pathPoints.length > 0 ? (
      <path d={pathPoints.join(" ")} fill="none" stroke={color} strokeWidth={widthVal} strokeLinecap="round" />
    ) : null;
  };

  // MACD math details
  const macdMax = Math.max(
    ...macdResult.macd.filter((v) => v !== null) as number[],
    ...macdResult.signal.filter((v) => v !== null) as number[],
    ...macdResult.histogram.filter((v) => v !== null) as number[],
    0.01
  );
  const macdMin = Math.min(
    ...macdResult.macd.filter((v) => v !== null) as number[],
    ...macdResult.signal.filter((v) => v !== null) as number[],
    ...macdResult.histogram.filter((v) => v !== null) as number[],
    -0.01
  );
  const macdRange = macdMax - macdMin;
  const getMacdY = (val: number) => {
    return subHeight - 15 - ((val - macdMin) / macdRange) * (subHeight - 30);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      id="ticker-analysis-terminal" 
      className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 shadow-xl" 
      ref={containerRef}
    >
      
      {/* Real-time Bid-Ask Ticker Bar */}
      {isDayTrade && liveTick && (
        <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-4 py-2 mb-4 font-mono text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold">LIVE HIGH-FREQUENCY FEED</span>
          </div>
          <div className="flex gap-4 md:gap-6">
            <div>
              BID: <span className="text-white font-bold">${liveTick.bid.toFixed(2)}</span>
            </div>
            <div>
              ASK: <span className="text-white font-bold">${liveTick.ask.toFixed(2)}</span>
            </div>
            <div>
              SPREAD: <span className="text-emerald-400 font-bold">${liveTick.spread.toFixed(2)}</span>
            </div>
            <div className="hidden sm:block">
              VOL: <span className="text-neutral-200">{(liveTick.volume / 1000).toFixed(1)}k shares</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 tracking-wider">
              {isDayTrade ? "5-MIN INTRADAY TIME FRAME" : "120D DAILY SWING BARS"}
            </span>
            <span className="text-neutral-500 text-[10px] font-mono">REAL-TIME DATA ENGINE</span>
          </div>
          <h3 className="text-xl font-bold font-sans mt-1 text-white tracking-tight flex items-baseline gap-2">
            {symbol} <span className="text-neutral-500 text-xs font-mono font-medium">({TICKER_NAMES[symbol] || "Custom Ticker"})</span>
          </h3>
        </div>

        {/* Dynamic active price */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
              {hoverPoint ? "HOVER PRICE" : "MARKET PRICE"}
            </p>
            <p className="text-2xl font-bold font-mono text-white flex items-center justify-end gap-1">
              ${activePrice.toFixed(2)}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${isUp ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-mono font-bold text-xs">
              {isUp ? "+" : ""}{((priceChange / firstPrice) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Control Dropdowns for Technical Analysis */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Dropdown */}
          <div className="relative group">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono font-bold py-1.5 pl-3 pr-8 rounded-xl appearance-none cursor-pointer focus:border-emerald-500/50 outline-none"
            >
              <option value="line">LINE CHART</option>
              <option value="area">AREA CHART</option>
              <option value="candlestick">CANDLESTICKS</option>
            </select>
            <div className="absolute right-2.5 top-2.5 pointer-events-none text-neutral-600">
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>

          {/* Indicator Overlays Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-[11px] transition-all hover:border-neutral-700 ${showSMA20 || showSMA50 || showEMA9 || showEMA21 ? "text-emerald-400 font-bold" : "text-neutral-400"}`}
            >
              <Layers size={14} /> OVERLAYS AI
              <ChevronDown size={14} />
            </button>
            
            {showSettings && (
              <div className="absolute top-full left-0 mt-2 z-20 w-48 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl">
                <div className="space-y-1">
                  {[
                    { label: `SMA (${smaPeriod})`, active: showSMA20, toggle: () => setShowSMA20(!showSMA20), color: "text-indigo-400" },
                    { label: "SMA (50)", active: showSMA50, toggle: () => setShowSMA50(!showSMA50), color: "text-cyan-400" },
                    { label: `EMA (${emaPeriod})`, active: showEMA9, toggle: () => setShowEMA9(!showEMA9), color: "text-amber-400" },
                    { label: "EMA (21)", active: showEMA21, toggle: () => setShowEMA21(!showEMA21), color: "text-purple-400" },
                  ].map((ind, i) => (
                    <button
                      key={i}
                      onClick={ind.toggle}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-mono transition-all ${ind.active ? "bg-neutral-800 " + ind.color : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"}`}
                    >
                      {ind.label}
                      <div className={`h-2 w-2 rounded-full ${ind.active ? "bg-current" : "bg-neutral-800"}`} />
                    </button>
                  ))}
                  
                  <div className="border-t border-neutral-800 my-2 pt-2 px-2">
                    <p className="text-[9px] font-mono text-neutral-600 uppercase mb-2">Configure Periods</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={smaPeriod}
                        onChange={(e) => setSmaPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 20)))}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-white w-full text-[10px]"
                        placeholder="SMA"
                      />
                      <input
                        type="number"
                        value={emaPeriod}
                        onChange={(e) => setEmaPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 9)))}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-white w-full text-[10px]"
                        placeholder="EMA"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicators Panels */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] border transition-all ${showRSI ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-neutral-950/40 border-neutral-800/40 text-neutral-500"}`}
          >
            RSI
          </button>
          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] border transition-all ${showMACD ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-neutral-950/40 border-neutral-800/40 text-neutral-500"}`}
          >
            MACD
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] border transition-all ${showVolume ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-neutral-950/40 border-neutral-800/40 text-neutral-500"}`}
          >
            VOL
          </button>
        </div>
      </div>

      {/* Period Configurations panel */}
      {showSettings && (
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 mb-4 grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <label className="text-neutral-500 block mb-1">SMA (Short) Period:</label>
            <input
              type="number"
              value={smaPeriod}
              onChange={(e) => setSmaPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 20)))}
              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white w-full"
            />
          </div>
          <div>
            <label className="text-neutral-500 block mb-1">EMA (Short) Period:</label>
            <input
              type="number"
              value={emaPeriod}
              onChange={(e) => setEmaPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 9)))}
              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white w-full"
            />
          </div>
        </div>
      )}

      {/* MAIN SVG CANVAS AREA */}
      <div
        className="relative cursor-crosshair select-none overflow-visible"
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left - 40;
          const chartWidth = width - 85;
          const percent = x / chartWidth;
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.round(percent * (points.length - 1)))
          );
          setHoverIndex(index);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg width={width} height={mainHeight} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = getY(minPrice + priceRange * p);
            return (
              <line
                key={i}
                x1={40}
                y1={y}
                x2={width - 45}
                y2={y}
                stroke="#1c1c1c"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Price Labels */}
          <text x={width - 40} y={getY(maxPrice) + 4} className="font-mono text-[9px] fill-neutral-500" textAnchor="start">
            ${maxPrice.toFixed(1)}
          </text>
          <text x={width - 40} y={getY(minPrice) - 4} className="font-mono text-[9px] fill-neutral-500" textAnchor="start">
            ${minPrice.toFixed(1)}
          </text>
          <text x={width - 40} y={getY(minPrice + priceRange * 0.5) + 4} className="font-mono text-[9px] fill-neutral-500" textAnchor="start">
            ${(minPrice + priceRange * 0.5).toFixed(1)}
          </text>

          {/* Volume bars drawn inside the main chart if requested */}
          {showVolume && points.map((p, i) => {
            const maxVol = Math.max(...points.map((pt) => pt.volume));
            const barHeight = (p.volume / maxVol) * 45; // max 45px tall
            const y = mainHeight - 25 - barHeight;
            const barWidth = Math.max(1, (width - 85) / points.length - 2.5);
            const isBarUp = i === 0 ? true : p.close >= points[i - 1].close;
            const barColor = isBarUp ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)";
            return (
              <rect
                key={i}
                x={getX(i) - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
              />
            );
          })}

          {/* Line Chart Style */}
          {chartType === "line" && (
            <path d={lineD} fill="none" stroke={strokeColor} strokeWidth={2.2} strokeLinecap="round" />
          )}
          {/* Area Chart Style */}
          {chartType === "area" && (
            <>
              <path d={areaD} fill={`url(#${gradientId})`} />
              <path d={lineD} fill="none" stroke={strokeColor} strokeWidth={2.2} strokeLinecap="round" />
            </>
          )}

          {/* Candlestick Style */}
          {chartType === "candlestick" && points.map((p, i) => {
            const isCandleUp = p.close >= p.open;
            const candleColor = isCandleUp ? "#10b981" : "#f43f5e";
            const candleWidth = Math.max(2, (width - 85) / points.length - 2.5);

            const yOpen = getY(p.open);
            const yClose = getY(p.close);
            const yHigh = getY(p.high);
            const yLow = getY(p.low);

            return (
              <g key={i}>
                {/* Wick */}
                <line x1={getX(i)} y1={yHigh} x2={getX(i)} y2={yLow} stroke={candleColor} strokeWidth={1.2} />
                {/* Body */}
                <rect
                  x={getX(i) - candleWidth / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleWidth}
                  height={Math.max(1.5, Math.abs(yOpen - yClose))}
                  fill={isCandleUp ? "none" : candleColor}
                  stroke={candleColor}
                  strokeWidth={1.2}
                />
              </g>
            );
          })}

          {/* SMA Overlays */}
          {showSMA20 && renderIndicatorLine(sma20, "#6366f1", 1.8)}
          {showSMA50 && renderIndicatorLine(sma50, "#06b6d4", 1.8)}

          {/* EMA Overlays */}
          {showEMA9 && renderIndicatorLine(ema9, "#f59e0b", 1.8)}
          {showEMA21 && renderIndicatorLine(ema21, "#a855f7", 1.8)}

          {/* Interactive Crosshair Line */}
          {hoverIndex !== null && (
            <>
              <line
                x1={getX(hoverIndex)}
                y1={15}
                x2={getX(hoverIndex)}
                y2={mainHeight - 25}
                stroke="#4b5563"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePrice)}
                r={5.5}
                fill={strokeColor}
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            </>
          )}

          {/* Bottom border */}
          <line x1={40} y1={mainHeight - 25} x2={width - 45} y2={mainHeight - 25} stroke="#262626" strokeWidth={1} />
        </svg>

        {/* Dynamic Hover Box overlay */}
        <div className="absolute top-1 left-12 bg-neutral-950/95 border border-neutral-800 rounded-lg px-2.5 py-1 flex items-center gap-4 text-[10px] text-neutral-400 font-mono shadow-xl backdrop-blur-md">
          <div>
            Time/Date: <span className="text-white font-bold">{activeLabel}</span>
          </div>
          <div>
            Price: <span className="text-white font-bold">${activePrice.toFixed(2)}</span>
          </div>
          {hoverPoint && (
            <div>
              Vol: <span className="text-neutral-300">{(hoverPoint.volume / 1000).toFixed(0)}k</span>
            </div>
          )}
        </div>
      </div>

      {/* SECONDARY PANEL: RSI */}
      {showRSI && (
        <div className="mt-4 border-t border-neutral-800/40 pt-2 text-left">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
            <span className="text-neutral-400 font-bold">RSI (14) - Relative Strength Index</span>
            <span>
              {hoverIndex !== null && rsiValues[hoverIndex] !== null
                ? `Value: ${rsiValues[hoverIndex]?.toFixed(1)}`
                : `Active: ${rsiValues[rsiValues.length - 1]?.toFixed(1) || "N/A"}`}
            </span>
          </div>
          <div className="relative">
            <svg width={width} height={subHeight} className="overflow-visible">
              {/* Overbought 70 and Oversold 30 reference lines */}
              <line x1={40} y1={subHeight - 15 - (70/100)*(subHeight-30)} x2={width-45} y2={subHeight - 15 - (70/100)*(subHeight-30)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
              <line x1={40} y1={subHeight - 15 - (30/100)*(subHeight-30)} x2={width-45} y2={subHeight - 15 - (30/100)*(subHeight-30)} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
              
              <text x={22} y={subHeight - 15 - (70/100)*(subHeight-30) + 3} className="font-mono text-[8px] fill-rose-500 font-bold">70</text>
              <text x={22} y={subHeight - 15 - (30/100)*(subHeight-30) + 3} className="font-mono text-[8px] fill-blue-400 font-bold">30</text>

              {/* Draw RSI Line */}
              {(() => {
                const pathPoints: string[] = [];
                for (let i = 0; i < rsiValues.length; i++) {
                  const val = rsiValues[i];
                  if (val !== null) {
                    const y = subHeight - 15 - (val / 100) * (subHeight - 30);
                    pathPoints.push(`${pathPoints.length === 0 ? "M" : "L"} ${getX(i)} ${y}`);
                  }
                }
                return pathPoints.length > 0 ? (
                  <path d={pathPoints.join(" ")} fill="none" stroke="#a855f7" strokeWidth={1.5} strokeLinecap="round" />
                ) : null;
              })()}

              {/* Crosshair connector */}
              {hoverIndex !== null && (
                <line
                  x1={getX(hoverIndex)}
                  y1={10}
                  x2={getX(hoverIndex)}
                  y2={subHeight - 15}
                  stroke="#4b5563"
                  strokeWidth={0.8}
                  strokeDasharray="2 2"
                />
              )}
              <line x1={40} y1={subHeight - 15} x2={width - 45} y2={subHeight - 15} stroke="#262626" strokeWidth={1} />
            </svg>
          </div>
        </div>
      )}

      {/* SECONDARY PANEL: MACD */}
      {showMACD && (
        <div className="mt-4 border-t border-neutral-800/40 pt-2 text-left">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
            <span className="text-neutral-400 font-bold">MACD (12, 26, 9)</span>
            <span>
              {hoverIndex !== null && macdResult.macd[hoverIndex] !== null
                ? `MACD: ${macdResult.macd[hoverIndex]?.toFixed(2)} | Sig: ${macdResult.signal[hoverIndex]?.toFixed(2)}`
                : `MACD: ${macdResult.macd[macdResult.macd.length - 1]?.toFixed(2) || "N/A"}`}
            </span>
          </div>
          <div className="relative">
            <svg width={width} height={subHeight} className="overflow-visible">
              {/* Zero baseline */}
              <line x1={40} y1={getMacdY(0)} x2={width-45} y2={getMacdY(0)} stroke="#333333" strokeWidth={1} />

              {/* Draw Histogram Bars */}
              {macdResult.histogram.map((h, i) => {
                if (h === null) return null;
                const barWidth = Math.max(1.2, (width - 85) / points.length - 2.5);
                const y0 = getMacdY(0);
                const y1 = getMacdY(h);
                const isHistUp = h >= 0;
                return (
                  <rect
                    key={i}
                    x={getX(i) - barWidth / 2}
                    y={isHistUp ? y1 : y0}
                    width={barWidth}
                    height={Math.max(1, Math.abs(y1 - y0))}
                    fill={isHistUp ? "rgba(16, 185, 129, 0.45)" : "rgba(244, 63, 94, 0.45)"}
                  />
                );
              })}

              {/* Draw MACD Line (Blue) */}
              {(() => {
                const pathPoints: string[] = [];
                for (let i = 0; i < macdResult.macd.length; i++) {
                  const val = macdResult.macd[i];
                  if (val !== null) {
                    pathPoints.push(`${pathPoints.length === 0 ? "M" : "L"} ${getX(i)} ${getMacdY(val)}`);
                  }
                }
                return pathPoints.length > 0 ? (
                  <path d={pathPoints.join(" ")} fill="none" stroke="#2563eb" strokeWidth={1.3} strokeLinecap="round" />
                ) : null;
              })()}

              {/* Draw Signal Line (Amber) */}
              {(() => {
                const pathPoints: string[] = [];
                for (let i = 0; i < macdResult.signal.length; i++) {
                  const val = macdResult.signal[i];
                  if (val !== null) {
                    pathPoints.push(`${pathPoints.length === 0 ? "M" : "L"} ${getX(i)} ${getMacdY(val)}`);
                  }
                }
                return pathPoints.length > 0 ? (
                  <path d={pathPoints.join(" ")} fill="none" stroke="#f59e0b" strokeWidth={1.3} strokeLinecap="round" />
                ) : null;
              })()}

              {/* Crosshair connector */}
              {hoverIndex !== null && (
                <line
                  x1={getX(hoverIndex)}
                  y1={10}
                  x2={getX(hoverIndex)}
                  y2={subHeight - 15}
                  stroke="#4b5563"
                  strokeWidth={0.8}
                  strokeDasharray="2 2"
                />
              )}
              <line x1={40} y1={subHeight - 15} x2={width - 45} y2={subHeight - 15} stroke="#262626" strokeWidth={1} />
            </svg>
          </div>
        </div>
      )}

      {/* Volatility Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-800/50">
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-left">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">ATR Volatility</p>
          <p className="text-sm font-bold font-mono text-white mt-0.5">{atr ? `$${atr.toFixed(2)}` : "N/A"}</p>
        </div>
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-left">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Asset Beta</p>
          <p className="text-sm font-bold font-mono text-white mt-0.5">{beta ? beta.toFixed(2) : "1.00"}</p>
        </div>
        <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/40 text-left col-span-2">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Asset Compounding Projection</p>
          <p className="text-xs font-medium font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <DollarSign size={13} />
            {isDayTrade ? "High Intraday Wave, Focus on Setups" : "Compounding at 12.8% p.a. projected growth"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
