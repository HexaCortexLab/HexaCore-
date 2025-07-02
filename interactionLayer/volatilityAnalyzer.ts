export interface VolatilityPulse {
  mint: string
  volatility: number
  timestamp: number
}

export class VolatilityPulse {
  compute(prices: number[]): VolatilityPulse {
    const n = prices.length
    if (n === 0) return { mint: "", volatility: 0, timestamp: Date.now() }
    const mean = prices.reduce((s, p) => s + p, 0) / n
    const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / n
    return { mint: "", volatility: parseFloat(Math.sqrt(variance).toFixed(6)), timestamp: Date.now() }
  }
}
