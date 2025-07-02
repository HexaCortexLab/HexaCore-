import fetch from "node-fetch"

export interface TradeTick {
  timestamp: number
  price: number
  size: number
  side: "buy" | "sell"
}

export class HexaMarketAnalyzer {
  constructor(private apiUrl: string) {}

  async getRecentTrades(symbol: string, limit = 100): Promise<TradeTick[]> {
    const res = await fetch(`${this.apiUrl}/markets/${symbol}/trades?limit=${limit}`, { method: "GET", timeout: 10000 })
    if (!res.ok) throw new Error(`Fetch error ${res.status}`)
    return res.json() as Promise<TradeTick[]>
  }

  vwap(trades: TradeTick[]): number {
    let pv = 0, vol = 0
    for (const t of trades) {
      pv += t.price * t.size
      vol += t.size
    }
    return vol ? pv / vol : 0
  }

  sma(trades: TradeTick[], window = 20): number {
    const slice = trades.slice(-window)
    const sum = slice.reduce((s, t) => s + t.price, 0)
    return slice.length ? sum / slice.length : 0
  }

  async arbitrageSpread(marketA: string, marketB: string): Promise<number> {
    const [a, b] = await Promise.all([
      this.getRecentTrades(marketA, 60),
      this.getRecentTrades(marketB, 60),
    ])
    return parseFloat((this.vwap(a) - this.vwap(b)).toFixed(6))
  }
}
