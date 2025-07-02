import { RawTransfer, HexaCoreEngine } from './hexacoreEngine'

export interface FeatureVector {
  timestamp: number
  smaShort: number
  smaLong: number
  momentum: number
}

export interface CorrelationPair {
  metrics: [string, string]
  coefficient: number
}

export class HexaCoreAnalyzer {
  constructor(private engine: HexaCoreEngine) {}

  /** Build a time‐series of volumes and extract SMAs & momentum */
  public async extractFeatures(mint: string, windowShort = 5, windowLong = 20): Promise<FeatureVector> {
    const txs: RawTransfer[] = await this.engine.fetchTransfers(mint, windowLong)
    const volumes = txs.map(t => t.amount)
    const latestTs = txs[0]?.blockTime * 1000 || Date.now()

    const sma = (arr: number[], w: number) => {
      const slice = arr.slice(0, w)
      return slice.reduce((s, v) => s + v, 0) / (slice.length || 1)
    }

    const momentum = volumes[0] - volumes[volumes.length - 1] || 0

    return {
      timestamp: latestTs,
      smaShort:  sma(volumes, windowShort),
      smaLong:   sma(volumes, windowLong),
      momentum
    }
  }

  /** Pearson correlation between two numeric arrays */
  private pearson(x: number[], y: number[]): number {
    const n = x.length
    if (n === 0 || y.length !== n) return 0
    const mean = arr => arr.reduce((s, v) => s + v, 0) / n
    const mx = mean(x), my = mean(y)
    let num = 0, dx2 = 0, dy2 = 0
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my
      num += dx * dy
      dx2 += dx*dx
      dy2 += dy*dy
    }
    const denom = Math.sqrt(dx2 * dy2)
    return denom ? num/denom : 0
  }

  /** Compute correlations between amount, hour‐of‐day, and day‐of‐week */
  public async correlatePatterns(mint: string): Promise<CorrelationPair[]> {
    const txs = await this.engine.fetchTransfers(mint, 200)
    const amounts = txs.map(t => t.amount)
    const hours   = txs.map(t => new Date(t.blockTime*1000).getUTCHours())
    const days    = txs.map(t => new Date(t.blockTime*1000).getUTCDay())

    return [
      { metrics: ['amount','hours'], coefficient: this.pearson(amounts, hours) },
      { metrics: ['amount','days'],  coefficient: this.pearson(amounts, days) },
      { metrics: ['hours','days'],   coefficient: this.pearson(hours, days) }
    ]
  }
}
