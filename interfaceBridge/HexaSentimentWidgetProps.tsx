import React from "react"

interface HexaSentimentWidgetProps {
  score: number      // 0–100
  signal: "Bullish" | "Bearish" | "Neutral"
  topMint: string
  volumeUsd24h: number
}

const sentimentColor = (score: number) => {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export const HexaSentimentWidget: React.FC<HexaSentimentWidgetProps> = ({
  score,
  signal,
  topMint,
  volumeUsd24h
}) => (
  <div className="p-4 bg-white rounded-2xl shadow flex flex-col items-center space-y-4">
    <h3 className="text-xl font-bold">Market Sentiment</h3>
    <div className="relative w-20 h-20">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white ${sentimentColor(score)}`}
      >
        {score}%
      </div>
      <svg className="absolute inset-0 animate-pulse" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={score >= 50 ? "#4caf50" : score >= 25 ? "#ff9800" : "#f44336"}
          strokeWidth="2"
          fill="none"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * score) / 100}
        />
      </svg>
    </div>
    <ul className="space-y-1 text-sm">
      <li>
        <span className="font-medium">Signal:</span> {signal}
      </li>
      <li>
        <span className="font-medium">Top Token:</span> {topMint}
      </li>
      <li>
        <span className="font-medium">24h Volume:</span> ${volumeUsd24h.toLocaleString()}
      </li>
    </ul>
  </div>
)
