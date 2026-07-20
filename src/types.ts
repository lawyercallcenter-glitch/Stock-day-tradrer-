export interface StockMetric {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  atr: number; // Average True Range (vital for day trading volatility)
  beta: number; // Volatility relative to market
  vibe: "Day Trade" | "Long Term" | "Both";
  catalyst: string;
  peRatio?: number;
  eps?: number;
  sentimentScore?: number; // -100 to 100
}

export interface DayTradeSetup {
  symbol: string;
  name: string;
  pattern: string; // e.g. "Bull Flag Breakout", "Mean Reversion"
  direction: "LONG" | "SHORT";
  entryTrigger: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  conviction: "High" | "Medium" | "Low";
  explanation: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  createdAt: string;
}

export interface WatchlistItem {
  symbol: string;
  watchlistId: string;
  addedAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  symbols?: string[];
  sentiment?: "Bullish" | "Bearish" | "Neutral";
  createdAt: string;
}

export interface StockBagItem {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  type: "day_trade" | "long_term";
  shares: number;
  averageEntry: number;
  currentPrice?: number;
  purchaseDate: string;
  pnl?: number;
  pnlPercent?: number;
}

export interface TradeLog {
  id: string;
  symbol: string;
  type: "day_trade" | "long_term";
  action: "BUY" | "SELL";
  shares: number;
  price: number;
  timestamp: string;
  notes?: string;
}

export interface StockHistoricalData {
  symbol: string;
  history: { date: string; close: number; open: number; high: number; low: number; volume: number }[];
  intraday: { time: string; price: number; volume: number }[];
}

export interface AIAnalysisResponse {
  symbol: string;
  name: string;
  summary: string;
  dayTradeSetup?: DayTradeSetup;
  longTermOutlook: {
    horizon3Yr: string;
    riskLevel: string;
    dividendYield?: string;
    moatRating: "Strong" | "Medium" | "None";
    convictionScore: number; // 1-100
  };
  verdict: "STRONG DAY TRADE" | "STRONG LONG TERM" | "ACCUMULATE BOTH" | "AVOID";
  sources?: { title: string; uri: string }[];
}
