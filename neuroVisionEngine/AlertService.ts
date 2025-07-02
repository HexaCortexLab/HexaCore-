import fetch from 'node-fetch'
import { BaseHexaAction } from './baseHexaAction'

export interface AlertParams {
  mint: string
  whaleThreshold: number
  checkIntervalMs: number
}

export class HexaAlertService extends BaseHexaAction {
  constructor(private params: AlertParams) {
    super('HexaAlertService')
  }

  protected async execute() {
    setInterval(async () => {
      const url = `https://public-api.solscan.io/account/token/txs?account=${this.params.mint}&limit=50`
      const data = (await fetch(url).then(r => r.json())).data as any[]
      const whales = data.filter(tx => Number(tx.tokenAmount.amount) >= this.params.whaleThreshold)
      if (whales.length) {
        this.emit('whales', whales.map(w => ({
          sig: w.signature,
          amount: Number(w.tokenAmount.amount),
          ts: (w.blockTime || 0) * 1000
        })))
      }
    }, this.params.checkIntervalMs)
  }
}
