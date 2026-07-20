// Technical indicators calculation engine

export interface IndicatorPoint {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  label: string;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  if (data.length === 0) return [];

  const k = 2 / (period + 1);
  let prevEma = data[0];
  ema.push(prevEma);

  for (let i = 1; i < data.length; i++) {
    const currentVal = data[i];
    const val = currentVal * k + prevEma * (1 - k);
    ema.push(val);
    prevEma = val;
  }

  // Set the initial periods as null or estimate them
  for (let i = 0; i < Math.min(period - 1, data.length); i++) {
    ema[i] = null;
  }
  return ema;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (data.length < period) {
    return Array(data.length).fill(null);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // First RSI value
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRs));

  for (let i = period + 1; i < data.length; i++) {
    const gain = gains[i - 1];
    const loss = losses[i - 1];

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));
  }

  return rsi;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  data: number[],
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const length = data.length;
  const macd: (number | null)[] = [];
  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  const ema12 = calculateEMA(data, shortPeriod);
  const ema26 = calculateEMA(data, longPeriod);

  // Compute MACD Line = EMA(12) - EMA(26)
  const rawMacd: number[] = [];
  for (let i = 0; i < length; i++) {
    const e12 = ema12[i];
    const e26 = ema26[i];
    if (e12 === null || e26 === null) {
      macd.push(null);
      rawMacd.push(0); // placeholder
    } else {
      const diff = e12 - e26;
      macd.push(diff);
      rawMacd.push(diff);
    }
  }

  // Signal Line = EMA of MACD Line over signalPeriod
  const rawSignal = calculateEMA(rawMacd, signalPeriod);

  for (let i = 0; i < length; i++) {
    if (i < longPeriod + signalPeriod - 2) {
      signal.push(null);
      histogram.push(null);
    } else {
      const sig = rawSignal[i];
      signal.push(sig);
      const macdVal = macd[i];
      if (macdVal !== null && sig !== null) {
        histogram.push(macdVal - sig);
      } else {
        histogram.push(null);
      }
    }
  }

  return { macd, signal, histogram };
}
