import fetch from "node-fetch"

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

export class HexaPatternDetector {
  constructor(private apiUrl: string) {}

  async getCandles(symbol: string, limit = 100): Promise<Candle[]> {
    const r = await fetch(`${this.apiUrl}/markets/${symbol}/candles?limit=${limit}`, { timeout: 10000 })
    if (!r.ok) throw new Error(`Fetch ${r.status}`)
    return r.json() as Promise<Candle[]>
  }

  private hammer(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const wick = Math.min(c.open, c.close) - c.low
    const r = body ? wick / body : 0
    return (r > 2 && body / (c.high - c.low) < 0.3) ? Math.min(r / 3, 1) : 0
  }

  private shootingStar(c: Candle): number {
    const body = Math.abs(c.close - c.open)
    const wick = c.high - Math.max(c.open, c.close)
    const r = body ? wick / body : 0
    return (r > 2 && body / (c.high - c.low) < 0.3) ? Math.min(r / 3, 1) : 0
  }

  private bullishEngulf(prev: Candle, cur: Candle): number {
    if (!(cur.close > cur.open && prev.close < prev.open && cur.close > prev.open && cur.open < prev.close)) {
      return 0
    }
    const b0 = Math.abs(prev.close - prev.open)
    const b1 = Math.abs(cur.close - cur.open)
    return b0 ? Math.min(b1 / b0, 1) : 0.8
  }

  private bearishEngulf(prev: Candle, cur: Candle): number {
    if (!(cur.close < cur.open && prev.close > prev.open && cur.open > prev.close && cur.close < prev.open)) {
      return 0
    }
    const b0 = Math.abs(prev.close - prev.open)
    const b1 = Math.abs(cur.close - cur.open)
    return b0 ? Math.min(b1 / b0, 1) : 0.8
  }

  private doji(c: Candle): number {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    const r = range ? body / range : 1
    return r < 0.1 ? 1 - r * 10 : 0
  }

  async detect(symbol: string, limit = 100): Promise<PatternSignal[]> {
    const candles = await this.getCandles(symbol, limit)
    const signals: PatternSignal[] = []

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const prev = candles[i - 1]
      const t = c.timestamp

      let conf = this.hammer(c)
      if (conf) signals.push({ timestamp: t, pattern: "Hammer", confidence: conf })

      conf = this.shootingStar(c)
      if (conf) signals.push({ timestamp: t, pattern: "ShootingStar", confidence: conf })

      if (prev) {
        conf = this.bullishEngulf(prev, c)
        if (conf) signals.push({ timestamp: t, pattern: "BullishEngulfing", confidence: conf })

        conf = this.bearishEngulf(prev, c)
        if (conf) signals.push({ timestamp: t, pattern: "BearishEngulfing", confidence: conf })
      }

      conf = this.doji(c)
      if (conf) signals.push({ timestamp: t, pattern: "Doji", confidence: conf })
    }

    return signals
  }
}
