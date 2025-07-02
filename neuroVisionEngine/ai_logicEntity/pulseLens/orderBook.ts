import fetch from "node-fetch"

export interface BookEntry {
  price: number
  size: number
}

export interface Level2Book {
  bids: BookEntry[]
  asks: BookEntry[]
  timestamp: number
}

export interface BookMetrics {
  mid: number
  spread: number
  imbalance: number
  depthUsd: number
  timestamp: number
}

export class HexaOrderBookAnalyzer {
  constructor(private apiBase: string) {}

  async loadBook(symbol: string, limit = 50): Promise<Level2Book> {
    const r = await fetch(`${this.apiBase}/markets/${symbol}/orderbook?depth=${limit}`, { timeout: 10000 })
    if (!r.ok) throw new Error(`Fetch failed ${r.status}`)
    return r.json() as Promise<Level2Book>
  }

  computeMid(book: Level2Book): number {
    const b = book.bids[0]?.price || 0
    const a = book.asks[0]?.price || 0
    return (b + a) / 2
  }

  computeSpread(book: Level2Book): number {
    const b = book.bids[0]?.price || 0
    const a = book.asks[0]?.price || 0
    return b && a ? ((a - b) / ((a + b) / 2)) * 100 : 0
  }

  computeImbalance(book: Level2Book): number {
    const bidVol = book.bids.reduce((s, o) => s + o.size, 0)
    const askVol = book.asks.reduce((s, o) => s + o.size, 0)
    const total = bidVol + askVol
    return total ? (bidVol - askVol) / total : 0
  }

  computeDepth(book: Level2Book, levels = 10): number {
    const bids = book.bids.slice(0, levels)
    const asks = book.asks.slice(0, levels)
    const bidVal = bids.reduce((s, o) => s + o.price * o.size, 0)
    const askVal = asks.reduce((s, o) => s + o.price * o.size, 0)
    return bidVal + askVal
  }

  async metrics(symbol: string, depthLevels = 10): Promise<BookMetrics> {
    const book = await this.loadBook(symbol, depthLevels)
    return {
      mid: this.computeMid(book),
      spread: this.computeSpread(book),
      imbalance: this.computeImbalance(book),
      depthUsd: this.computeDepth(book, depthLevels),
      timestamp: book.timestamp
    }
  }
}
