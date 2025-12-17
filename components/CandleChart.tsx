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

// 初期価格 $0.001
const BASE_PRICE = 0.001

// tokenGain（累積gain）を価格に変換
// gain=0で$0.001、gainが増えるほど価格上昇
const gainToPrice = (gain: number): number => {
  // gainは累積なので、1 + (gain / 10000) で価格倍率を計算
  // 例: gain=10000 -> 価格2倍、gain=30000 -> 価格4倍
  const multiplier = Math.max(0, 1 + gain / 10000)
  return BASE_PRICE * multiplier
}

// 価格をフォーマット
const formatPrice = (price: number): string => {
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  return `$${price.toExponential(2)}`
}

function generateInitialCandles(baseGain: number): CandleData[] {
  const candles: CandleData[] = []
  let gain = baseGain

  for (let i = 0; i < MAX_CANDLES; i++) {
    // 小さな変動を追加
    const change = (Math.random() - 0.4) * 100
    const open = gain
    const close = open + change
    // high/low
    const high = Math.max(open, close) + Math.random() * 50
    const low = Math.min(open, close) - Math.random() * 50

    candles.push({
      open,
      high,
      low,
      close,
      isGreen: close >= open,
    })

    gain = close
  }

  return candles
}

export default function CandleChart({ chartPoints, isRugged, tokenIndex, pulse = false }: CandleChartProps) {
  const [candles, setCandles] = useState<CandleData[]>([])
  const lastPointCount = useRef(chartPoints.length)
  const ruggedApplied = useRef(false)

  // クライアントサイドでのみ初期キャンドルを生成（Hydrationエラー防止）
  useEffect(() => {
    if (candles.length === 0) {
      setCandles(generateInitialCandles(chartPoints[0] ?? 0))
    }
  }, [])

  const resetCandles = () => {
    const base = chartPoints[0] ?? 0
    setCandles(generateInitialCandles(base))
    lastPointCount.current = chartPoints.length
    ruggedApplied.current = false
  }

  // チャートのリセット処理 - 長さと基準値の両方に依存
  const baseValue = chartPoints[0] ?? 0
  useEffect(() => {
    if (chartPoints.length <= 1) {
      setCandles(generateInitialCandles(baseValue))
      lastPointCount.current = chartPoints.length
      ruggedApplied.current = false
    }
  }, [chartPoints.length, baseValue])

  useEffect(() => {
    if (chartPoints.length > lastPointCount.current) {
      const newValue = chartPoints[chartPoints.length - 1]
      const prevValue = chartPoints[chartPoints.length - 2] ?? chartPoints[0] ?? 0

      setCandles(prev => {
        const open = prevValue
        const close = newValue
        // high/lowは価格に比例した範囲で（2%程度のノイズ）
        const high = Math.max(open, close) * (1 + Math.random() * 0.02)
        const low = Math.max(0, Math.min(open, close) * (1 - Math.random() * 0.02))

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
        const lastClose = prev[prev.length - 1]?.close ?? chartPoints[chartPoints.length - 1] ?? 0
        // 落差を強調するためhighは前の価格より少し上に
        const rugCandle: CandleData = {
          open: lastClose,
          high: lastClose + 50, // ヒゲを少し上に
          low: -500,  // 確実にゼロより下まで
          close: -500, // 確実にゼロより下まで（視覚的にゼロを表現）
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
      return { min: -100, max: 100 }
    }
    let min = Infinity
    let max = -Infinity
    candles.forEach(c => {
      min = Math.min(min, c.low)
      max = Math.max(max, c.high)
    })
    if (min === max) {
      min -= 100
      max += 100
    }
    // 10%のマージンを追加
    const range = max - min
    const margin = range * 0.1
    return { min: min - margin, max: max + margin }
  }, [candles])

  const candleWidth = 28
  const candleGap = 22
  const chartWidth = candles.length * (candleWidth + candleGap) + PADDING + PADDING_RIGHT
  const svgWidth = Math.max(MIN_WIDTH, chartWidth)

  const priceToY = (pts: number) => {
    const { min, max } = bounds
    const range = max - min
    if (range === 0 || !isFinite(range)) {
      return HEIGHT / 2 // 範囲がない場合は中央に
    }
    // 上下にPADDINGを確保
    const drawableHeight = HEIGHT - PADDING * 2
    const y = PADDING + drawableHeight - ((pts - min) / range) * drawableHeight
    return isFinite(y) ? Math.round(y) : HEIGHT / 2
  }

  // 右軸に表示する価格レベル
  const priceLevels = useMemo(() => {
    const { min, max } = bounds
    const levels: { pts: number; y: number; price: number }[] = []
    const range = max - min
    const drawableHeight = HEIGHT - PADDING * 2
    if (range === 0 || !isFinite(range)) {
      // デフォルトレベルを返す
      for (let i = 0; i <= 4; i++) {
        levels.push({
          pts: 0,
          y: PADDING + drawableHeight - (i / 4) * drawableHeight,
          price: gainToPrice(0),
        })
      }
      return levels
    }
    const step = range / 4
    for (let i = 0; i <= 4; i++) {
      const pts = min + step * i
      const y = PADDING + drawableHeight - ((pts - min) / range) * drawableHeight
      levels.push({
        pts: Math.round(pts),
        y: isFinite(y) ? Math.round(y) : HEIGHT / 2,
        price: gainToPrice(pts),
      })
    }
    return levels
  }, [bounds])

  // キャンドルがまだ生成されていない場合は空の状態を表示
  if (candles.length === 0) {
    return (
      <div className="relative bg-gray-900/60 border border-gray-800 rounded-3xl p-6 w-full">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono mb-3">
          <span>CHART / CANDLE</span>
          <span>TOKEN {tokenIndex + 1}</span>
        </div>
        <div className="h-[260px] flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative bg-gray-900/60 border border-gray-800 rounded-3xl p-6 transition-all duration-300 ${pulse ? 'shadow-[0_0_25px_rgba(34,197,94,0.25)]' : ''
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
        className="overflow-hidden w-full"
        preserveAspectRatio="none"
      >
        {/* クリッピング領域を定義 */}
        <defs>
          <clipPath id="chart-clip">
            <rect x={0} y={0} width={svgWidth} height={HEIGHT} />
          </clipPath>
        </defs>
        <g clipPath="url(#chart-clip)">
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
        </g>
      </svg>

      {isRugged && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-red-500 font-black text-4xl tracking-[0.4em]">ZERO</div>
        </div>
      )}
    </div>
  )
}
