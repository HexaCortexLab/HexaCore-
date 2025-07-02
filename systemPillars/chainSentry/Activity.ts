export interface SuspiciousEvent {
  mint: string
  spikePct: number       // percent change vs prior window
  whaleCount: number     // number of transfers above whaleThreshold
  timestamp: number
}

/**
 * Detects tokens exhibiting both a volume spike and multiple whale moves.
 */
export function detectSuspiciousActivity(
  mint: string,
  transfers: RawTransfer[],
  windowSize: number = 50,
  spikeThreshold: number = 100,   // 100% volume increase
  whaleThreshold: number = 100_000 // base units
): SuspiciousEvent | null {
  if (transfers.length < windowSize * 2) return null

  const sliceRecent = transfers.slice(0, windowSize)
  const slicePrior  = transfers.slice(windowSize, windowSize * 2)

  const sum = (arr: RawTransfer[]) => arr.reduce((s, t) => s + t.amount, 0)
  const volPrior = sum(slicePrior)
  const volRec   = sum(sliceRecent)
  if (volPrior === 0) return null

  const spikePct = ((volRec - volPrior) / volPrior) * 100
  const whaleCount = sliceRecent.filter(t => t.amount >= whaleThreshold).length

  if (spikePct >= spikeThreshold && whaleCount >= 2) {
    return {
      mint,
      spikePct: parseFloat(spikePct.toFixed(2)),
      whaleCount,
      timestamp: Date.now()
    }
  }
  return null
}