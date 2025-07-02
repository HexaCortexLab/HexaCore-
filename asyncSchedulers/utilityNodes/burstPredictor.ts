import { activityHeatmap, HeatmapPoint } from './activityHeatmap'

export interface BurstEvent {
  mint: string
  hourUTC: number
  ratio: number
  timestamp: number
}

export async function burstPredictor(
  mint: string,
  lookbackHours: number = 24
): Promise<BurstEvent[]> {
  const heatmap: HeatmapPoint[] = await activityHeatmap(mint, lookbackHours * 50)
  if (heatmap.length < 2) return []
  const last = heatmap[heatmap.length - 1]
  const prior = heatmap.slice(0, -1)
  const avg = prior.reduce((s, p) => s + p.txCount, 0) / (prior.length || 1)
  const ratio = last.txCount / (avg || 1)
  const events: BurstEvent[] = []
  if (ratio > 2) {
    events.push({
      mint,
      hourUTC: last.hourUTC,
      ratio: parseFloat(ratio.toFixed(2)),
      timestamp: Date.now()
    })
  }
  return events
}
