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

export const HexaTokenOverviewPanel: React.FC<HexaTokenOverviewProps> = ({
  name,
  symbol,
  priceUsd,
  change24h,
  liquidityUsd,
  holderCount,
  riskScore
}) => {
  const isUp = change24h >= 0
  const arrow = isUp ? "▲" : "▼"
  const barColor = riskScore > 70 ? "bg-red-500" : "bg-green-500"

  return (
    <div className="p-4 bg-white rounded-2xl shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{name} <span className="text-gray-500">({symbol})</span></h2>
        <span className="text-2xl font-semibold">${priceUsd.toFixed(4)}</span>
      </div>

      <ul className="grid grid-cols-2 gap-2 text-sm">
        <li className={`flex items-center ${isUp ? "text-green-600" : "text-red-600"}`}>
          {arrow} {Math.abs(change24h).toFixed(2)}% (24h)
        </li>
        <li>Liquidity: ${liquidityUsd.toLocaleString()}</li>
        <li>Holders: {holderCount.toLocaleString()}</li>
        <li>Risk Score: {riskScore}/100</li>
      </ul>

      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${riskScore}%` }} />
      </div>
    </div>
  )
}
