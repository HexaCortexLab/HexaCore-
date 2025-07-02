import { TokenAnalyzer } from './tokenAnalyzer'

/**
 * Example runner: analyze a list of token mints and print any suspicious events.
 */
async function run() {
  const rpcUrl = 'https://api.mainnet-beta.solana.com'
  const mints = [
    'So11111111111111111111111111111111111111112',
    'Es9vMFrzaC1XXXXXXXXXXXXXXXXXXXXXXXXXX',
    // add more mints to watch
  ]

  const analyzer = new TokenAnalyzer(rpcUrl)
  const results = await analyzer.analyzeMints(mints)

  for (const res of results) {
    if (res.suspicious) {
      console.log(
        `[ALERT] Mint ${res.mint}: ${res.suspicious.spikePct}% volume spike with ${res.suspicious.whaleCount} whales at ${new Date(res.suspicious.timestamp).toISOString()}`
      )
    } else {
      console.log(`Mint ${res.mint}: no suspicious activity.`)
    }
  }
}

run().catch(err => {
  console.error('Error in analyzer run:', err)
})