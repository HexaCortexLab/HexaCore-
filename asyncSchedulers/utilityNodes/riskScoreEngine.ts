import { Connection, PublicKey } from '@solana/web3.js'
import fetch from 'node-fetch'

export interface RiskFactors {
  velocity: number
  concentration: number
  volatility: number
}

export interface RiskScore {
  mint: string
  score: number
  factors: RiskFactors
  timestamp: number
}

export interface RiskScoreEngineOptions {
  rpcUrl: string
  dexChain?: string
  velocityWeight?: number
  concentrationWeight?: number
  volatilityWeight?: number
  threshold?: number
  txFetchLimit?: number
  holderFetchLimit?: number
}

export class RiskScoreEngine {
  private dexChain: string
  private velocityWeight: number
  private concentrationWeight: number
  private volatilityWeight: number
  private threshold: number
  private txFetchLimit: number
  private holderFetchLimit: number

  constructor(options: RiskScoreEngineOptions) {
    this.rpcUrl = options.rpcUrl
    this.dexChain = options.dexChain ?? 'solana'

    // configurable weights and threshold
    this.velocityWeight = options.velocityWeight ?? 0.3
    this.concentrationWeight = options.concentrationWeight ?? 0.4
    this.volatilityWeight = options.volatilityWeight ?? 0.3
    this.threshold = options.threshold ?? 1.0

    // fetch limits
    this.txFetchLimit = options.txFetchLimit ?? 60
    this.holderFetchLimit = options.holderFetchLimit ?? 1000
  }

  private async fetchVelocity(mint: string): Promise<number> {
    try {
      const res = await fetch(
        `https://public-api.solscan.io/account/token/txs?account=${mint}&limit=${this.txFetchLimit}`
      )
      const json = await res.json()
      const data = (json.data as any[]) || []
      const nowSec = Date.now() / 1000
      const times = data.map(tx => tx.blockTime || nowSec)
      const earliest = Math.min(...times, nowSec - 60) // at least 1 minute window
      const spanMinutes = Math.max((nowSec - earliest) / 60, 1)
      return data.length / spanMinutes
    } catch (err) {
      console.error('fetchVelocity error', err)
      return 0
    }
  }

  private async fetchConcentration(mint: string): Promise<number> {
    try {
      const res = await fetch(
        `https://public-api.solscan.io/token/holders?tokenAddress=${mint}&limit=${this.holderFetchLimit}`
      )
      const holders = (await res.json()) as Array<{ tokenAmount: string }>
      const balances = holders.map(h => Number(h.tokenAmount) || 0)
      if (balances.length === 0) return 0
      balances.sort((a, b) => a - b)
      const n = balances.length
      const total = balances.reduce((s, v) => s + v, 0)
      const cum = balances.reduce((s, v, i) => s + v * (i + 1), 0)
      const gini = (2 * cum) / (n * total) - (n + 1) / n
      return Math.max(0, Math.min(gini, 1))
    } catch (err) {
      console.error('fetchConcentration error', err)
      return 0
    }
  }

  private async fetchVolatility(mint: string): Promise<number> {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/${this.dexChain}/${mint}?include=ohlcv`
      )
      const json = await res.json()
      const raw = (json.pair?.ohlcv as any[]) || []
      const closes = raw
        .filter(r => r[6] === '1h')
        .map(r => parseFloat(r[4]))
        .filter(v => !isNaN(v))
      if (closes.length === 0) return 0
      const mean = closes.reduce((a, b) => a + b, 0) / closes.length
      const variance =
        closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closes.length
      return mean > 0 ? Math.sqrt(variance) / mean : 0
    } catch (err) {
      console.error('fetchVolatility error', err)
      return 0
    }
  }

  public async score(mint: string): Promise<RiskScore> {
    const [velocity, concentration, volatility] = await Promise.all([
      this.fetchVelocity(mint),
      this.fetchConcentration(mint),
      this.fetchVolatility(mint),
    ])

    const rawScore =
      velocity * this.velocityWeight +
      concentration * this.concentrationWeight +
      volatility * this.volatilityWeight

    // normalize and cap at threshold
    const normalized = Math.min(rawScore / this.threshold, 1)
    const score = parseFloat(normalized.toFixed(3))

    return {
      mint,
      score,
      factors: { velocity, concentration, volatility },
      timestamp: Date.now(),
    }
  }

  /**
   * Returns whether the asset’s risk exceeds the configured threshold.
   */
  public async isRisky(mint: string): Promise<boolean> {
    const { score } = await this.score(mint)
    return score >= 1
  }
}
