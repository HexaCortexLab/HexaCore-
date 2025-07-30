import fetch, { AbortError } from 'node-fetch'
import { BaseHexaAction } from './baseHexaAction'

export interface AlertParams {
  mint: string
  whaleThreshold: number
  checkIntervalMs: number
  fetchTimeoutMs?: number
  retries?: number
  backoffMs?: number
}

export class HexaAlertService extends BaseHexaAction {
  private intervalId?: NodeJS.Timer

  constructor(private params: AlertParams) {
    super('HexaAlertService')
    if (!params.mint) throw new Error('mint is required')
    if (params.whaleThreshold <= 0) throw new Error('whaleThreshold must be > 0')
    if (params.checkIntervalMs <= 0) throw new Error('checkIntervalMs must be > 0')
    this.params.fetchTimeoutMs = params.fetchTimeoutMs ?? 5000
    this.params.retries = params.retries ?? 2
    this.params.backoffMs = params.backoffMs ?? 500
  }

  protected async execute(): Promise<void> {
    this.log('info', 'Starting whale check loop', { params: this.params })
    this.intervalId = setInterval(() => this.checkOnce().catch(err => {
      this.log('error', 'Error during whale check', { error: err.message })
    }), this.params.checkIntervalMs)
  }

  /** Stop the internal loop */
  public async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.log('info', 'Stopped whale check loop')
    }
  }

  private async checkOnce(): Promise<void> {
    const url = `https://public-api.solscan.io/account/token/txs?account=${this.params.mint}&limit=50`
    const data = await this.fetchWithRetry(url)
    const whales = data.filter(tx => Number(tx.tokenAmount.amount) >= this.params.whaleThreshold)
    if (whales.length) {
      this.log('info', 'Whale transactions detected', { count: whales.length })
      this.emit('whales', whales.map(w => ({
        sig: w.signature,
        amount: Number(w.tokenAmount.amount),
        ts: (w.blockTime || 0) * 1000
      })))
    }
  }

  private async fetchWithRetry(url: string): Promise<any[]> {
    for (let attempt = 1; attempt <= (this.params.retries! + 1); attempt++) {
      try {
        this.log('debug', `Fetching data (attempt ${attempt})`, { url })
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.params.fetchTimeoutMs)
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timer)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        return json.data as any[]
      } catch (err: any) {
        const isAbort = err instanceof AbortError || err.name === 'AbortError'
        this.log('warn', `Fetch attempt ${attempt} failed`, { error: err.message, timeout: isAbort })
        if (attempt <= this.params.retries! && !isAbort) {
          await this.delay(this.params.backoffMs! * attempt)
          continue
        }
        throw err
      }
    }
    return []
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
 
