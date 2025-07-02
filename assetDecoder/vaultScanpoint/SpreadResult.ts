import fetch from "node-fetch"

export interface SpreadResult {
  mint: string
  bidPrice: number
  askPrice: number
  spreadPercent: number
  timestamp: number
}

export class TokenSpreadCalculator {
  constructor(private readonly dexApiBase: string) {}

  private async fetchOrderbook(mint: string): Promise<{ bids: [string, string][]; asks: [string, string][] }> {
    const res = await fetch(`${this.dexApiBase}/latest/dex/pairs/solana/${mint}`)
    if (!res.ok) throw new Error(`Orderbook fetch failed ${res.status}`)
    const json = (await res.json()) as any
    return {
      bids: json.pair.book.depth.bids as [string, string][],
      asks: json.pair.book.depth.asks as [string, string][]
    }
  }

  async calculateSpread(mint: string): Promise<SpreadResult> {
    const { bids, asks } = await this.fetchOrderbook(mint)
    const bidPrice = bids.length ? parseFloat(bids[0][0]) : 0
    const askPrice = asks.length ? parseFloat(asks[0][0]) : 0
    const spreadPercent = bidPrice && askPrice
      ? ((askPrice - bidPrice) / ((askPrice + bidPrice) / 2)) * 100
      : 0
    return {
      mint,
      bidPrice,
      askPrice,
      spreadPercent: parseFloat(spreadPercent.toFixed(3)),
      timestamp: Date.now()
    }
  }
}
