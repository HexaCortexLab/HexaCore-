import fetch from "node-fetch"

export interface DepthResult {
  mint: string
  totalBidDepth: number
  totalAskDepth: number
  timestamp: number
}

export class TokenDepthAnalyzer {
  constructor(private dexApi: string) {}

  private async fetchDepth(mint: string, levels = 10): Promise<{ bids: [string, string][]; asks: [string, string][] }> {
    const res = await fetch(`${this.dexApi}/latest/dex/pairs/solana/${mint}`)
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
    const { pair } = (await res.json()) as any
    return {
      bids: (pair.book.depth.bids as [string, string][]).slice(0, levels),
      asks: (pair.book.depth.asks as [string, string][]).slice(0, levels)
    }
  }

  async analyzeDepth(mint: string, levels = 10): Promise<DepthResult> {
    const { bids, asks } = await this.fetchDepth(mint, levels)
    const sum = (arr: [string, string][]) => arr.reduce((s, [p, q]) => s + parseFloat(p) * parseFloat(q), 0)
    return {
      mint,
      totalBidDepth: sum(bids),
      totalAskDepth: sum(asks),
      timestamp: Date.now()
    }
  }
}
