import fetch from "node-fetch"

export interface SpreadResult {
  mint: string
  bidPrice: number
  askPrice: number
  spreadPercent: number
  timestamp: number
}

export class TokenSpreadCalculator {
  constructor(private dexApi: string) {}

  private async fetchDepth(mint: string): Promise<{ bids: [string, string][]; asks: [string, string][] }> {
    const res = await fetch(`${this.dexApi}/latest/dex/pairs/solana/${mint}`)
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
    const { pair } = (await res.json()) as any
    return {
      bids: pair.book.depth.bids as [string, string][],
      asks: pair.book.depth.asks as [string, string][]
    }
  }

  async calculateSpread(mint: string): Promise<SpreadResult> {
    const { bids, asks } = await this.fetchDepth(mint)
    const bid = bids[0] ? parseFloat(bids[0][0]) : 0
    const ask = asks[0] ? parseFloat(asks[0][0]) : 0
    const spread = bid && ask ? ((ask - bid) / ((ask + bid) / 2)) * 100 : 0
    return { mint, bidPrice: bid, askPrice: ask, spreadPercent: parseFloat(spread.toFixed(3)), timestamp: Date.now() }
  }
}
