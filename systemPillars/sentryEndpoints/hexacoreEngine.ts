
import fetch from 'node-fetch'
import { Connection, PublicKey } from '@solana/web3.js'

export interface RawTransfer {
  signature: string
  blockTime: number
  amount: number
  source: string
  destination: string
}


export class HexaCoreEngine {
  private connection: Connection

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

 
  public async fetchTransfers(mint: string, limit = 200): Promise<RawTransfer[]> {
    const res = await fetch(
      `https://public-api.solscan.io/account/token/txs?account=${mint}&limit=${limit}`
    )
    const body = await res.json() as any
    return (body.data || []).filter((tx: any) => tx.err === null).map((tx: any) => ({
      signature:   tx.signature,
      blockTime:   tx.blockTime || 0,
      amount:      Number(tx.tokenAmount.amount),
      source:      tx.userAddress,
      destination: tx.destination
    }))
  }

  /** Fetch holder distribution for a mint via Solscan public API */
  public async fetchHolders(mint: string, topN = 50): Promise<Record<string, number>> {
    const res = await fetch(
      `https://public-api.solscan.io/token/holders?tokenAddress=${mint}&limit=${topN}`
    )
    const data = await res.json() as any[]
    const dist: Record<string, number> = {}
    for (const h of data) {
      dist[h.ownerAddress] = Number(h.tokenAmount)
    }
    return dist
  }
}
