export interface BehaviorProfile {
  lastSeen: number
  txCount: number
  avgAmount: number
}

export class BehaviorMap {
  private map = new Map<string, BehaviorProfile>()

  get(addr: string): BehaviorProfile {
    if (!this.map.has(addr)) {
      this.map.set(addr, { lastSeen: Date.now(), txCount: 0, avgAmount: 0 })
    }
    return this.map.get(addr)!
  }

  record(addr: string, amount: number): BehaviorProfile {
    const p = this.get(addr)
    p.txCount += 1
    p.avgAmount = (p.avgAmount * (p.txCount - 1) + amount) / p.txCount
    p.lastSeen = Date.now()
    return p
  }

  prune(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs
    for (const [addr, profile] of this.map) {
      if (profile.lastSeen < cutoff) this.map.delete(addr)
    }
  }
}
