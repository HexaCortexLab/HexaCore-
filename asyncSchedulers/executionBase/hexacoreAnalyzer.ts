import { Keypair, PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js'

export class HexaSigningEngine {
  private connection: Connection
  private signer: Keypair
  private program: PublicKey

  constructor(programId: string, secretKey: Uint8Array, rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed')
    this.signer = Keypair.fromSecretKey(secretKey)
    this.program = new PublicKey(programId)
  }

  async signAnalysis(payload: any): Promise<string> {
    const data = Buffer.from(JSON.stringify(payload))
    const ix = new TransactionInstruction({
      keys: [],
      programId: this.program,
      data
    })
    const tx = new Transaction().add(ix)
    tx.feePayer = this.signer.publicKey
    tx.recentBlockhash = (await this.connection.getRecentBlockhash()).blockhash
    tx.sign(this.signer)
    return this.connection.sendRawTransaction(tx.serialize())
  }
}
