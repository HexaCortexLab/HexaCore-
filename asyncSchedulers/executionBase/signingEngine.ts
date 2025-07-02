import { ExecutionEngine } from './executionEngine'

async function main() {
  const rpcUrl = 'https://api.mainnet-beta.solana.com'
  const apiKey = process.env.HEXACORE_API_KEY!
  const programId = process.env.HEXACORE_PROGRAM_ID!
  const signerSecret = Uint8Array.from(JSON.parse(process.env.HEXACORE_SIGNER_SECRET!))

  const engine = new ExecutionEngine(rpcUrl, apiKey, programId, signerSecret)
  const mint = ''
  const output = await engine.runAnalysisAndSign(mint, 6)
  console.log(JSON.stringify(output, null, 2))
}

main().catch(console.error)
