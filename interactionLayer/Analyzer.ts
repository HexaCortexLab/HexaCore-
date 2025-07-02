import fetch from "node-fetch"

export interface FluxStats {
  mint: string
  transferCount: number
  totalVolume: number
  timestamp: number
}

export class TokenFluxAggregator {
  constructor(private apiBase: string) {}

  async aggregate(mint: string, limit = 100): Promise<FluxStats> {
    const res = await fetch(`${this.apiBase}/transfers/${mint}?limit=${limit}`)
    if (!res.ok) throw new Error(`Fetch transfers failed ${res.status}`)
    const data = (await res.json()) as Array<{ amount: number }>
    const count = data.length
    const volume = data.reduce((s, tx) => s + tx.amount, 0)
    return { mint, transferCount: count, totalVolume: volume, timestamp: Date.now() }
  }
}
