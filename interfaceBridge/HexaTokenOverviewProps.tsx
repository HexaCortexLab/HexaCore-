import React from "react"

interface HexaTokenOverviewProps {
  name: string
  symbol: string
  priceUsd: number
  change24h: number
  liquidityUsd: number
  holderCount: number
  riskScore: number // 0–100
}

const getRiskColor = (score: number): string => {
  if (score >= 80) return "bg-red-600"
  if (score >= 60) return "bg-orange-500"
  if (score >= 40) return "bg-yellow-400"
  if (score >= 20) return "bg-lime-500"
  return "bg-green-500"
}

const numberFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export const HexaTokenOverviewPanel: React.FC<HexaTokenOverviewProps> = ({
  name,
  symbol,
  priceUsd,
  change24h,
  liquidityUsd,
  holderCount,
  riskScore,
}) => {
  const isUp = change24h >= 0
  const arrow = isUp ? "▲" : "▼"
  const arrowColor = isUp ? "text-green-600" : "text-red-600"
  const riskColor = getRiskColor(riskScore)

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-700 space-y-5">
      <header className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
          {name}{" "}
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            ({symbol})
          </span>
        </h2>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
          ${priceUsd.toFixed(4)}
        </span>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <li className={`flex items-center ${arrowColor}`}>
          {arrow} {Math.abs(change24h).toFixed(2)}% <span className="ml-1 text-zinc-500">(24h)</span>
        </li>
        <li>Liquidity: ${numberFmt.format(liquidityUsd)}</li>
        <li>Holders: {holderCount.toLocaleString()}</li>
        <li>
          Risk Score:{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {riskScore}/100
          </span>
        </li>
      </ul>

      <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden" aria-label="Risk Level">
        <div
          className={`h-full ${riskColor}`}
          style={{ width: `${Math.min(riskScore, 100)}%` }}
        />
      </div>
    </div>
  )
}
