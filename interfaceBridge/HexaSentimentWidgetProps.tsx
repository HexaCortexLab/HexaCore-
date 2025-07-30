import React, { useEffect, useState, useMemo } from "react"

interface HexaSentimentWidgetProps {
  score: number      // 0–100
  signal: "Bullish" | "Bearish" | "Neutral"
  topMint: string
  volumeUsd24h: number
  loading?: boolean
  className?: string
  /** Optional override colors */
  colors?: {
    bullish?: string
    neutral?: string
    bearish?: string
  }
}

const DEFAULT_COLORS = {
  bullish: "bg-green-500",
  neutral: "bg-yellow-500",
  bearish: "bg-red-500",
}

export const HexaSentimentWidget: React.FC<HexaSentimentWidgetProps> = React.memo(({
  score,
  signal,
  topMint,
  volumeUsd24h,
  loading = false,
  className = "",
  colors = {}
}) => {
  const mergedColors = useMemo(() => ({ ...DEFAULT_COLORS, ...colors }), [colors])

  const sentimentBg = useMemo(() => {
    if (score >= 70) return mergedColors.bullish
    if (score >= 40) return mergedColors.neutral
    return mergedColors.bearish
  }, [score, mergedColors])

  // For smooth gauge animation
  const [dashOffset, setDashOffset] = useState(283)
  useEffect(() => {
    const offset = 283 - (283 * Math.min(Math.max(score, 0), 100)) / 100
    const id = requestAnimationFrame(() => setDashOffset(offset))
    return () => cancelAnimationFrame(id)
  }, [score])

  if (loading) {
    return (
      <div className={`p-4 bg-gray-100 rounded-2xl shadow animate-pulse ${className}`}>
        <div className="h-6 bg-gray-300 rounded w-3/5 mb-4" />
        <div className="h-20 w-20 bg-gray-300 rounded-full mx-auto mb-4" />
        <ul className="space-y-1">
          <li className="h-4 bg-gray-300 rounded w-1/2" />
          <li className="h-4 bg-gray-300 rounded w-2/3" />
          <li className="h-4 bg-gray-300 rounded w-1/3" />
        </ul>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label={`Market sentiment: ${signal}, score ${score}%`}
      className={`p-4 bg-white rounded-2xl shadow flex flex-col items-center space-y-4 ${className}`}
    >
      <h3 className="text-xl font-bold">Market Sentiment</h3>

      <div className="relative w-20 h-20" aria-hidden="true">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white ${sentimentBg}`}
        >
          {score}%
        </div>
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={score >= 70 ? "#4caf50" : score >= 40 ? "#ffeb3b" : "#f44336"}
            strokeWidth="4"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
      </div>

      <ul className="space-y-1 text-sm w-full text-left">
        <li>
          <span className="font-medium">Signal:</span>{" "}
          <span aria-label={`Signal ${signal}`}>{signal}</span>
        </li>
        <li>
          <span className="font-medium">Top Token:</span>{" "}
          <code className="font-mono">{topMint}</code>
        </li>
        <li>
          <span className="font-medium">24h Volume:</span>{" "}
          <span>${volumeUsd24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </li>
      </ul>
    </div>
  )
})

HexaSentimentWidget.displayName = "HexaSentimentWidget"
