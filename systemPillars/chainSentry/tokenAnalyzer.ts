
import { HexaCoreEngine, RawTransfer } from './hexacoreEngine'
import { groupByToken } from './groupByToken'
import { detectSuspiciousActivity, SuspiciousEvent } from './suspiciousActivity'

export interface TokenAnalysisResult {
  mint: string
  suspicious?: SuspiciousEvent
}

/**
 * Orchestrates fetching transfers for multiple mints, grouping them,
 * and running suspicious-activity detection on each.
 */
export class TokenAnalyzer {
  private engine: HexaCoreEngine

  constructor(rpcUrl: string) {
    this.engine = new HexaCoreEngine(rpcUrl)
  }

  public async analyzeMints(mints: string[]): Promise<TokenAnalysisResult[]> {
    const allResults: TokenAnalysisResult[] = []

    for (const mint of mints) {
      // fetch recent transfers
      const transfers: RawTransfer[] = await this.engine.fetchTransfers(mint, 100)
      // group unneeded here since single mint
      const suspicious = detectSuspiciousActivity(mint, transfers)
      allResults.push({ mint, suspicious: suspicious || undefined })
    }

    return allResults
  }
}