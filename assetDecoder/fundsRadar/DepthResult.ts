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

  constructor(
    private dexApi: string,
    private defaultLevels: number = 10,
    private retryCount: number = 3,
    private retryDelayMs: number = 500
  ) {}

  private async fetchDepth(
    mint: string,
    levels: number
  ): Promise<PairDepth> {
    const url = `${this.dexApi}/latest/dex/pairs/solana/${mint}`
    let response: Response

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Fetch error: ${response.status} ${response.statusText}`)
        }
        break
      } catch (err) {
        if (attempt === this.retryCount) throw err
        await new Promise(res => setTimeout(res, this.retryDelayMs))
      }
    }

    const data = (await response!.json()) as APIResponse

    const parseEntries = (arr: [string, string][]): OrderBookEntry[] =>
      arr.slice(0, levels).map(([price, size]) => ({
        price: parseFloat(price),
        size: parseFloat(size)
      }))

    return {
      bids: parseEntries(data.pair.book.depth.bids),
      asks: parseEntries(data.pair.book.depth.asks)
    }
  }

  private sumDepth(entries: OrderBookEntry[]): number {
    return entries.reduce((sum, { price, size }) => sum + price * size, 0)
  }

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

    const { bids, asks } = await this.fetchDepth(mint, levels)
    const result: DepthResult = {
      mint,
      totalBidDepth: this.sumDepth(bids),
      totalAskDepth: this.sumDepth(asks),
      timestamp: now
    }

    this.cache.set(cacheKey, result)
    return result
  }

  async analyzeMultiple(
    mints: string[],
    levels: number = this.defaultLevels
  ): Promise<DepthResult[]> {
    return Promise.all(
      mints.map(mint => this.analyzeDepth(mint, levels))
    )
  }
}
