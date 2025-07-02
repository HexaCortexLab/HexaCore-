import { Connection, PublicKey } from '@solana/web3.js'

export interface DeepMetrics {
  holderCount: number
  averageBalance: number
  varianceBalance: number
}

export async function analyzeTokenDeep(
  rpcUrl: string,
  mint: string
): Promise<DeepMetrics> {
  const conn = new Connection(rpcUrl, 'confirmed')
  const resp = await conn.getProgramAccounts(
    new PublicKey(),
    {
      encoding: 'jsonParsed',
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mint } }
      ]
    }
  )
  const balances = resp.map(acc =>
    Number((acc.account.data as any).parsed.info.tokenAmount.amount)
  )
  const holderCount = balances.length
  const mean = holderCount
    ? balances.reduce((s, v) => s + v, 0) / holderCount
    : 0
  const variance = holderCount
    ? balances.reduce((s, v) => s + (v - mean) ** 2, 0) / holderCount
    : 0
  return {
    holderCount,
    averageBalance: mean,
    varianceBalance: variance
  }
}
