import fetch from "node-fetch"

export interface SurgeEvent {
  mint: string
  oldPrice: number
  newPrice: number
  changePct: number
  timestamp: number
}

export class SurgeSignalProbe {
  private lastPrices = new Map<string, number>()

  constructor(private apiBase: string, private thresholdPct = 10) {}

  async probe(mint: string): Promise<SurgeEvent | null> {
    const res = await fetch(`${this.apiBase}/price/${mint}`)
    if (!res.ok) throw new Error(`Price fetch failed ${res.status}`)
    const { priceUsd } = (await res.json()) as { priceUsd: number }
    const prev = this.lastPrices.get(mint) || priceUsd
    const change = prev ? ((priceUsd - prev) / prev) * 100 : 0
    this.lastPrices.set(mint, priceUsd)
    if (change >= this.thresholdPct) {
      return { mint, oldPrice: prev, newPrice: priceUsd, changePct: parseFloat(change.toFixed(2)), timestamp: Date.now() }
    }
    return null
  }
}
