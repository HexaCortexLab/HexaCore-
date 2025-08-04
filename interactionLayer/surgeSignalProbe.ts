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

  /**
   * @param apiBase Base URL of the price API (e.g. https://api.example.com)
   * @param thresholdPct Percentage change threshold to fire a surge event
   * @param retryCount Number of retry attempts on fetch failure
   * @param retryDelayMs Initial delay between retries (will double each attempt)
   */
  constructor(
    private apiBase: string,
    private thresholdPct: number = 10,
    private retryCount: number = 3,
    private retryDelayMs: number = 500
  ) {}

  /** Probe a single mint for a price surge. */
  async probe(mint: string): Promise<SurgeEvent | null> {
    const newPrice = await this.fetchPriceWithRetry(mint)
    const prevPrice = this.lastPrices.get(mint) ?? newPrice
    const changePct = prevPrice > 0
      ? Number((((newPrice - prevPrice) / prevPrice) * 100).toFixed(2))
      : 0

    this.lastPrices.set(mint, newPrice)

    if (changePct >= this.thresholdPct) {
      return {
        mint,
        oldPrice: prevPrice,
        newPrice,
        changePct,
        timestamp: Date.now(),
      }
    }
    return null
  }

  /** Clear stored last price for a mint (useful for resetting state). */
  reset(mint: string): void {
    this.lastPrices.delete(mint)
  }

  /** Fetch price with retry and exponential backoff. */
  private async fetchPriceWithRetry(mint: string): Promise<number> {
    const url = `${this.apiBase}/price/${mint}`
    let attempt = 0
    let delay = this.retryDelayMs

    while (attempt < this.retryCount) {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
        }
        const body = (await res.json()) as { priceUsd: number }
        if (typeof body.priceUsd !== "number") {
          throw new Error("Invalid response format: missing priceUsd")
        }
        return body.priceUsd
      } catch (err) {
        attempt++
        if (attempt >= this.retryCount) {
          throw err
        }
        await this.delay(delay)
        delay *= 2
      }
    }
    // Fallback, should never hit
    throw new Error("Failed to fetch price after retries")
  }

  /** Simple promise-based delay. */
  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms))
  }
}
