import { RawTransfer, HexaCoreEngine } from './hexacoreEngine'

export interface DetectorEvent {
  type: 'WHALE' | 'PUMP' | 'DUMP'
  details: any
  timestamp: number
}


export class HexaCoreDetector {
  constructor(private engine: HexaCoreEngine) {}

  public async detectWhales(mint: string, threshold = 100_000): Promise<DetectorEvent[]> {
    const txs = await this.engine.fetchTransfers(mint, 200)
    return txs
      .filter(t => t.amount >= threshold)
      .map(t => ({ type:'WHALE', details: t, timestamp: Date.now() }))
  }

  public async detectSpikes(mint: string, window = 50, pct = 20): Promise<DetectorEvent[]> {
    const txs = await this.engine.fetchTransfers(mint, window*2)
    const slice = txs.slice(0, window), prior = txs.slice(window, window*2)
    const sum = arr => arr.reduce((s, t) => s + t.amount, 0)
    const oldV = sum(prior), newV = sum(slice)
    if (oldV === 0) return []
    const change = (newV - oldV) / oldV * 100
    if (change >= pct) return [{ type:'PUMP', details:{ change }, timestamp: Date.now() }]
    if (change <= -pct) return [{ type:'DUMP', details:{ change }, timestamp: Date.now() }]
    return []
  }
}
