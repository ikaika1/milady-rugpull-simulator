'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface CandleData {
  open: number
  high: number
  low: number
  close: number
  isGreen: boolean
}

interface CandleChartProps {
  chartPoints: number[]
  isRugged: boolean
  tokenIndex: number
  pulse?: boolean
}

const HEIGHT = 260
const PADDING = 24
const PADDING_RIGHT = 80 // 右軸ラベル用のスペース
const MAX_CANDLES = 11
const MIN_WIDTH = 960

// ptsを価格に変換 (100 pts = $0.001 開始)
const ptsToPrice = (pts: number): number => {
  // 対数スケール: 0 pts = $0.0001, 100 pts = $0.001, 200 pts = $0.01, 300 pts = $0.1, 400 pts = $1, 500 pts = $10
  const basePrice = 0.0001
  const scaleFactor = pts / 100
  return basePrice * Math.pow(10, scaleFactor)
}

// 価格をフォーマット
const formatPrice = (price: number): string => {
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(3)}`
  if (price >= 0.001) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(5)}`
  return `$${price.toExponential(1)}`
}

function generateInitialCandles(basePrice: number): CandleData[] {
  const candles: CandleData[] = []
  let price = basePrice

  for (let i = 0; i < MAX_CANDLES; i++) {
    const change = (Math.random() - 0.4) * 8
    const open = price
    const close = Math.max(1, open + change)
    const high = Math.max(open, close) + Math.random() * 4
    const low = Math.max(0, Math.min(open, close) - Math.random() * 4)

    candles.push({
      open,
      high,
      low,
      close,
      isGreen: close >= open,
    })

    price = close
  }

  return candles
}

export default function CandleChart({ chartPoints, isRugged, tokenIndex, pulse = false }: CandleChartProps) {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [isClient, setIsClient] = useState(false)
  const lastPointCount = useRef(chartPoints.length)
  const ruggedApplied = useRef(false)

  // クライアントサイドでのみ初期キャンドルを生成（Hydrationエラー防止）
  useEffect(() => {
    setIsClient(true)
    if (candles.length === 0) {
      setCandles(generateInitialCandles(chartPoints[0] ?? 100))
    }
  }, [])

  const resetCandles = () => {
    const base = chartPoints[0] ?? 100
    setCandles(generateInitialCandles(base))
    lastPointCount.current = chartPoints.length
    ruggedApplied.current = false
  }

  useEffect(() => {
    if (chartPoints.length <= 1) {
      resetCandles()
    }
  }, [chartPoints.length])

  useEffect(() => {
    if (chartPoints.length > lastPointCount.current) {
      const newValue = chartPoints[chartPoints.length - 1]
      const prevValue = chartPoints[chartPoints.length - 2] ?? chartPoints[0] ?? 100

      setCandles(prev => {
        const open = prevValue
        const close = newValue
        const delta = Math.abs(close - open)
        const high = Math.max(open, close) + Math.max(2, delta * 0.4 + Math.random() * 3)
        const low = Math.max(0, Math.min(open, close) - Math.max(2, delta * 0.3 + Math.random() * 3))

        const newCandle: CandleData = {
          open,
          high,
          low,
          close,
          isGreen: close >= open,
        }

        const nextCandles = [...prev, newCandle]
        return nextCandles.slice(-MAX_CANDLES)
      })

      lastPointCount.current = chartPoints.length
    }
  }, [chartPoints])

  useEffect(() => {
    if (isRugged && !ruggedApplied.current) {
      setCandles(prev => {
        const lastClose = prev[prev.length - 1]?.close ?? chartPoints[chartPoints.length - 1] ?? 100
        const rugCandle: CandleData = {
          open: lastClose,
          high: lastClose + 3,
          low: 0,
          close: 0,
          isGreen: false,
        }
        const nextCandles = [...prev, rugCandle]
        return nextCandles.slice(-MAX_CANDLES)
      })
      ruggedApplied.current = true
    }

    if (!isRugged) {
      ruggedApplied.current = false
    }
  }, [isRugged, chartPoints])

  const bounds = useMemo(() => {
    if (candles.length === 0) {
      return { min: 0, max: 200 }
    }
    let min = Infinity
    let max = -Infinity
    candles.forEach(c => {
      min = Math.min(min, c.low)
      max = Math.max(max, c.high)
    })
    if (min === max) {
      min -= 10
      max += 10
    }
    return { min: Math.max(0, min - 5), max: max + 5 }
  }, [candles])

  const candleWidth = 28
  const candleGap = 22
  const chartWidth = candles.length * (candleWidth + candleGap) + PADDING + PADDING_RIGHT
  const svgWidth = Math.max(MIN_WIDTH, chartWidth)

  const priceToY = (pts: number) => {
    const { min, max } = bounds
    return Math.round(HEIGHT - ((pts - min) / (max - min)) * (HEIGHT - PADDING) - PADDING / 2)
  }

  // 右軸に表示する価格レベル
  const priceLevels = useMemo(() => {
    const { min, max } = bounds
    const levels: { pts: number; y: number; price: number }[] = []
    const step = (max - min) / 4
    for (let i = 0; i <= 4; i++) {
      const pts = min + step * i
      const y = Math.round(HEIGHT - ((pts - min) / (max - min)) * (HEIGHT - PADDING) - PADDING / 2)
      levels.push({
        pts: Math.round(pts * 100) / 100, // 価格のpts値も丸める
        y,
        price: ptsToPrice(pts),
      })
    }
    return levels
  }, [bounds])

  return (
    <div
      className={`relative bg-gray-900/60 border border-gray-800 rounded-3xl p-6 transition-all duration-300 ${
        pulse ? 'shadow-[0_0_25px_rgba(34,197,94,0.25)]' : ''
      } ${isRugged ? 'border-red-600/60' : ''} w-full`}
    >
      <div className="flex items-center justify-between text-xs text-gray-500 font-mono mb-3">
        <span>CHART / CANDLE</span>
        <span>TOKEN {tokenIndex + 1}</span>
      </div>
      <svg
        viewBox={`0 0 ${svgWidth} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        className="overflow-visible w-full"
        preserveAspectRatio="none"
      >
        {/* グリッド線 */}
        {priceLevels.map((level, i) => (
          <line
            key={i}
            x1={PADDING}
            y1={level.y}
            x2={svgWidth - PADDING_RIGHT}
            y2={level.y}
            stroke="#1f2937"
            strokeDasharray="4 6"
          />
        ))}

        {/* 右軸の価格ラベル */}
        {priceLevels.map((level, i) => (
          <text
            key={`label-${i}`}
            x={svgWidth - PADDING_RIGHT + 8}
            y={level.y + 4}
            fill="#6b7280"
            fontSize="11"
            fontFamily="monospace"
          >
            {formatPrice(level.price)}
          </text>
        ))}

        {candles.map((candle, index) => {
          const x = PADDING + index * (candleWidth + candleGap)
          const bodyTop = priceToY(Math.max(candle.open, candle.close))
          const bodyBottom = priceToY(Math.min(candle.open, candle.close))
          const bodyHeight = Math.max(bodyBottom - bodyTop, 2)
          const wickTop = priceToY(candle.high)
          const wickBottom = priceToY(candle.low)
          const color = candle.isGreen ? '#22c55e' : '#ef4444'
          const isLast = index === candles.length - 1

          return (
            <g key={`${candle.open}-${index}`} className={isLast ? 'animate-pulse' : ''}>
              <line
                x1={x + candleWidth / 2}
                y1={wickTop}
                x2={x + candleWidth / 2}
                y2={wickBottom}
                stroke={color}
                strokeWidth={2}
              />
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                opacity={0.6}
                rx={3}
              />
            </g>
          )
        })}
      </svg>

      {isRugged && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-red-500 font-black text-4xl tracking-[0.4em]">ZERO</div>
        </div>
      )}
    </div>
  )
}
