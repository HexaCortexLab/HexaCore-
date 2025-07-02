import { Connection, PublicKey } from "@solana/web3.js"

export interface BirthEvent {
  mint: string
  creator: string
  timestamp: number
}

export class TokenBirthWatcher {
  private conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed")
  private lastSlot = 0
  private TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

  async scan(limit = 500): Promise<BirthEvent[]> {
    const slot = await this.conn.getSlot()
    const from = this.lastSlot + 1
    this.lastSlot = slot
    const sigs = await this.conn.getSignaturesForAddress(this.TOKEN_PROGRAM, { limit })
    const events: BirthEvent[] = []
    for (const info of sigs) {
      if (info.slot < from) continue
      const tx = await this.conn.getParsedConfirmedTransaction(info.signature)
      if (!tx?.meta?.logMessages?.some(l => l.includes("Instruction: InitializeMint"))) continue
      const inst = (tx.transaction.message.instructions as any[]).find(ix =>
        ix.program === "spl-token" && ix.parsed?.type === "initializeMint"
      ) as any
      if (!inst) continue
      events.push({
        mint: inst.parsed.info.mint,
        creator: tx.transaction.message.accountKeys[0].toBase58(),
        timestamp: (tx.blockTime || 0) * 1000
      })
    }
    return events
  }
}
