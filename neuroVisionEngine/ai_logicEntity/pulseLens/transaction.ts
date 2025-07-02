import { Connection, PublicKey, Commitment } from "@solana/web3.js"

export type AccountUpdateHandler = (data: Buffer, slot: number) => void

export class HexaAccountMonitor {
  private conn: Connection
  private subs = new Map<string, number[]>()

  constructor(
    rpc: string,
    ws?: string,
    private defaultCommitment: Commitment = "confirmed"
  ) {
    this.conn = new Connection(rpc, { wsEndpoint: ws, commitment: defaultCommitment })
  }

  async watchAccount(
    mint: string,
    handler: AccountUpdateHandler,
    commitment: Commitment = this.defaultCommitment
  ): Promise<number> {
    const key = new PublicKey(mint)
    const id = await this.conn.onAccountChange(
      key,
      (info, ctx) => handler(info.data, ctx.slot),
      commitment
    )
    const list = this.subs.get(mint) || []
    list.push(id)
    this.subs.set(mint, list)
    return id
  }

  async unwatchAccount(mint: string, id?: number): Promise<boolean> {
    const list = this.subs.get(mint)
    if (!list?.length) return false
    const targets = id != null ? list.filter(x => x === id) : list
    await Promise.all(targets.map(x => this.conn.removeAccountChangeListener(x).catch(() => {})))
    this.subs.set(mint, id != null ? list.filter(x => x !== id) : [])
    return true
  }

  async close(): Promise<void> {
    const all = Array.from(this.subs.values()).flat()
    await Promise.all(all.map(x => this.conn.removeAccountChangeListener(x).catch(() => {})))
    this.subs.clear()
    await this.conn.close()
  }
}
