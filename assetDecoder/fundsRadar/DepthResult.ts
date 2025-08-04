import fetch, { Response } from 'node-fetch'

export interface DepthResult {
  mint: string
  totalBidDepth: number
  totalAskDepth: number
  timestamp: number
}

interface OrderBookEntry {
  price: number
  size: number
}

interface PairDepth {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

interface APIResponse {
  pair: {
    book: {
      depth: {
        bids: [string, string][]
        asks: [string, string][]
      }
    }
  }
}

export class TokenDepthAnalyzer {
  private cache = new Map<string, DepthResult>()

  /**
   * @param dexApi Base URL of the DEX API (e.g. https://api.example.com)
   * @param defaultLevels How many price levels to fetch by default
   * @param retryCount Number of retry attempts on fetch failure
   * @param retryDelayMs Initial delay between retries (doubles each attempt)
   */
  constructor(
    private dexApi: string,
    private defaultLevels: number = 10,
    private retryCount: number = 3,
    private retryDelayMs: number = 500
  ) {}

  /** Clear cached result for a specific mint (or all if none provided). */
  clearCache(mint?: string): void {
    if (mint) {
      this.cache.delete(`${mint}-${this.defaultLevels}`)
    } else {
      this.cache.clear()
    }
  }

  /** Analyze order-book depth for a single mint, with caching. */
  async analyzeDepth(
    mint: string,
    levels: number = this.defaultLevels
  ): Promise<DepthResult> {
    const cacheKey = `${mint}-${levels}`
    const now = Date.now()

    // Return cached if within 30 seconds
    const cached = this.cache.get(cacheKey)
    if (cached && now - cached.timestamp < 30_000) {
      return cached
    }

    const { bids, asks } = await this.fetchDepthWithRetry(mint, levels)

    const result: DepthResult = {
      mint,
      totalBidDepth: this.sumDepth(bids),
      totalAskDepth: this.sumDepth(asks),
      timestamp: now
    }

    this.cache.set(cacheKey, result)
    return result
  }

  /** Analyze multiple mints in parallel. */
  async analyzeMultiple(
    mints: string[],
    levels: number = this.defaultLevels
  ): Promise<DepthResult[]> {
    return Promise.all(mints.map(mint => this.analyzeDepth(mint, levels)))
  }

  /** Fetch order-book depth with retry and exponential backoff. */
  private async fetchDepthWithRetry(
    mint: string,
    levels: number
  ): Promise<PairDepth> {
    const url = `${this.dexApi}/latest/dex/pairs/solana/${mint}`
    let attempt = 0
    let delay = this.retryDelayMs
    let response: Response

    while (++attempt <= this.retryCount) {
      try {
        response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Fetch error: ${response.status} ${response.statusText}`)
        }
        const data = (await response.json()) as APIResponse
        return {
          bids: this.parseEntries(data.pair.book.depth.bids, levels),
          asks: this.parseEntries(data.pair.book.depth.asks, levels)
        }
      } catch (err) {
        if (attempt === this.retryCount) {
          throw new Error(`Failed to fetch depth for ${mint} after ${attempt} attempts: ${err}`)
        }
        await this.delay(delay)
        delay *= 2
      }
    }
    // should not reach here
    throw new Error('Unexpected error in fetchDepthWithRetry')
  }

  /** Parse raw string entries into typed OrderBookEntry[] */
  private parseEntries(
    arr: [string, string][],
    levels: number
  ): OrderBookEntry[] {
    return arr.slice(0, levels).map(([price, size]) => {
      const p = parseFloat(price)
      const s = parseFloat(size)
      if (isNaN(p) || isNaN(s)) {
        throw new Error(`Invalid depth entry: [${price}, ${size}]`)
      }
      return { price: p, size: s }
    })
  }

  /** Sum up price * size across entries. */
  private sumDepth(entries: OrderBookEntry[]): number {
    return entries.reduce((sum, { price, size }) => sum + price * size, 0)
  }

  /** Simple delay helper. */
  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms))
  }
}
