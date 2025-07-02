
import { Connection, PublicKey } from '@solana/web3.js'

export interface EmergingToken {
  mint: string
  creator: string
  initialSupply: number
  timestamp: number
}


export class EmergingTokenScanner {
  private conn: Connection
  private lastSlot = 0
  private TOKEN_PROGRAM = new PublicKey(
    ''
  )

  constructor(rpcUrl: string) {
    this.conn = new Connection(rpcUrl, 'confirmed')
  }

  public async scanEmergingTokens(limitSlots = 500): Promise<EmergingToken[]> {
    const current = await this.conn.getSlot('confirmed')
    const from = this.lastSlot + 1
    this.lastSlot = current

    const sigs = await this.conn.getSignaturesForAddress(
      this.TOKEN_PROGRAM,
      { limit: limitSlots }
    )
    const events: EmergingToken[] = []

    for (const info of sigs) {
      if (info.slot < from) continue
      const tx = await this.conn.getParsedConfirmedTransaction(info.signature, 'confirmed')
      if (!tx?.meta?.logMessages) continue

      // detect InitializeMint instruction
      if (tx.meta.logMessages.some(l => l.includes('Instruction: InitializeMint'))) {
        const inst = (tx.transaction.message.instructions as any[]).find(ix =>
          ix.program === 'spl-token' && ix.parsed?.type === 'initializeMint'
        ) as any
        if (!inst) continue

        const mint = inst.parsed.info.mint as string
        const creator = tx.transaction.message.accountKeys[0].toBase58()
        const supplyInfo = await this.conn.getTokenSupply(new PublicKey(mint))
        const initialSupply = Number(supplyInfo.value.amount)

        events.push({
          mint,
          creator,
          initialSupply,
          timestamp: (tx.blockTime || 0) * 1000
        })
      }
    }

    return events
  }
}
