import fetch from 'node-fetch'

export interface ActivityStats {
  totalTransfers: number
  totalVolume: number
  uniqueSenders: number
  uniqueReceivers: number
}

export async function analyzeTokenActivity(
  mint: string,
  limit: number = 200
): Promise<ActivityStats> {
  const res = await fetch(
    `https://public-api.solscan.io/account/token/txs?account=${mint}&limit=${limit}`
  )
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
  const data = (await res.json()).data as any[]
  const transfers = data.filter(tx => tx.err === null)
  const totalTransfers = transfers.length
  const totalVolume = transfers.reduce((s, tx) => s + Number(tx.tokenAmount.amount), 0)
  const senders = new Set<string>()
  const receivers = new Set<string>()
  transfers.forEach(tx => {
    senders.add(tx.userAddress)
    receivers.add(tx.destination)
  })
  return {
    totalTransfers,
    totalVolume,
    uniqueSenders: senders.size,
    uniqueReceivers: receivers.size
  }
}
