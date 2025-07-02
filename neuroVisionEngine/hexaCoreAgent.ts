import { Connection, PublicKey } from '@solana/web3.js'

export class HexaCoreAgent {
  private conn: Connection

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, 'confirmed')
  }

  async getTokenSupply(mint: string): Promise<number> {
    const info = await this.conn.getTokenSupply(new PublicKey(mint))
    return Number(info.value.amount)
  }

  async getRecentTransfers(mint: string, limit = 100) {
    const res = await this.conn.getSignaturesForAddress(
      new PublicKey(mint),
      { limit }
    )
    return res.map(r => r.signature)
  }
}
