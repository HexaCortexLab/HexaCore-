import fetch, { AbortError } from 'node-fetch'

export interface ActivityStats {
  totalTransfers: number
  totalVolume: number
  uniqueSenders: number
  uniqueReceivers: number
}

export interface AnalyzeOptions {
  limit?: number
  timeoutMs?: number
  retries?: number
  backoffMs?: number
  /** Hooks for instrumentation */
  hooks?: {
    onStart?: (mint: string, opts: Omit<AnalyzeOptions, 'hooks'>) => void
    onSuccess?: (stats: ActivityStats) => void
    onError?: (error: Error) => void
  }
}

/** Simple structured logger */
const logger = {
  info: (msg: string, meta: any = {}) =>
    console.log({ level: 'info', timestamp: new Date().toISOString(), msg, ...meta }),
  warn: (msg: string, meta: any = {}) =>
    console.warn({ level: 'warn', timestamp: new Date().toISOString(), msg, ...meta }),
  error: (msg: string, meta: any = {}) =>
    console.error({ level: 'error', timestamp: new Date().toISOString(), msg, ...meta }),
}

/**
 * Analyze token activity on Solscan, computing transfer stats.
 */
export async function analyzeTokenActivity(
  mint: string,
  opts: AnalyzeOptions = {}
): Promise<ActivityStats> {
  const {
    limit = 200,
    timeoutMs = 5000,
    retries = 2,
    backoffMs = 500,
    hooks = {}
  } = opts
  const baseOpts = { limit, timeoutMs, retries, backoffMs }

  hooks.onStart?.(mint, baseOpts)
  logger.info('Starting analyzeTokenActivity', { mint, ...baseOpts })

  const url = `https://public-api.solscan.io/account/token/txs?account=${mint}&limit=${limit}`

  async function fetchData(): Promise<any[]> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        logger.info('Fetching data', { url, attempt })
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timer)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        return Array.isArray(json.data) ? json.data : []
      } catch (err: any) {
        clearTimeout(timer)
        const isAbort = err instanceof AbortError || err.name === 'AbortError'
        logger.warn('Fetch attempt failed', { attempt, error: err.message, timeout: isAbort })
        hooks.onError?.(err)
        if (attempt <= retries && !isAbort) {
          await new Promise(r => setTimeout(r, backoffMs * attempt))
          continue
        }
        throw err
      }
    }
    return []
  }

  try {
    const data = await fetchData()

    const transfers = data.filter(tx => tx.err == null)
    const totalTransfers = transfers.length
    const totalVolume = transfers.reduce((sum, tx) => sum + Number(tx.tokenAmount.amount), 0)

    const senders = new Set<string>()
    const receivers = new Set<string>()
    transfers.forEach(tx => {
      if (tx.userAddress) senders.add(tx.userAddress)
      if (tx.destination) receivers.add(tx.destination)
    })

    const stats: ActivityStats = {
      totalTransfers,
      totalVolume,
      uniqueSenders: senders.size,
      uniqueReceivers: receivers.size
    }

    hooks.onSuccess?.(stats)
    logger.info('analyzeTokenActivity succeeded', stats)
    return stats
  } catch (err: any) {
    logger.error('analyzeTokenActivity failed', { error: err.message })
    hooks.onError?.(err)
    throw err
  }
}
