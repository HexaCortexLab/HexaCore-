import fetch from 'node-fetch'

export type PatternType = 'WhaleTransfer' | 'VolumePump' | 'VolumeDump'

export interface PatternSignal {
  type: PatternType
  timestamp: number
  details: any
}

export async function detectTokenPatterns(
  mint: string,
  windowSize: number = 100,
  whaleThreshold: number = 50000,
  pumpPct: number = 20,
  dumpPct: number = 20
): Promise<PatternSignal[]> {
  const res = await fetch(
    `https://public-api.solscan.io/account/token/txs?account=${mint}&limit=${windowSize * 2}`
  )
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
  const data = (await res.json()).data as any[]
  const clean = data.filter(tx => tx.err === null)
  const recent = clean.slice(0, windowSize)
  const prior  = clean.slice(windowSize, windowSize * 2)
  const signals: PatternSignal[] = []

  recent.forEach(tx => {
    const amt = Number(tx.tokenAmount.amount)
    if (amt >= whaleThreshold) {
      signals.push({
        type: 'WhaleTransfer',
        timestamp: (tx.blockTime || 0) * 1000,
        details: { signature: tx.signature, amount: amt }
      })
    }
  })

  const sum = (arr: any[]) => arr.reduce((s, tx) => s + Number(tx.tokenAmount.amount), 0)
  const volOld = sum(prior)
  const volNew = sum(recent)
  if (volOld > 0) {
    const pct = ((volNew - volOld) / volOld) * 100
    if (pct >= pumpPct) {
      signals.push({
        type: 'VolumePump',
        timestamp: Date.now(),
        details: { changePct: parseFloat(pct.toFixed(2)) }
      })
    } else if (pct <= -dumpPct) {
      signals.push({
        type: 'VolumeDump',
        timestamp: Date.now(),
        details: { changePct: parseFloat(pct.toFixed(2)) }
      })
    }
  }

  return signals
}
