
import { RawTransfer } from './hexacoreEngine'

export function groupByToken(transfers: RawTransfer[]): Record<string, RawTransfer[]> {
  return transfers.reduce<Record<string, RawTransfer[]>>((acc, tx) => {
    const mint = tx.mint
    if (!acc[mint]) acc[mint] = []
    acc[mint].push(tx)
    return acc
  }, {})
}
