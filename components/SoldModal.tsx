'use client'

import { useEffect, useState } from 'react'
import { Announcement } from '@/lib/engine'

interface SoldModalProps {
  tokenName: string
  chartValue: number
  announcement: Announcement
  onNext: () => void
}

export default function SoldModal({ tokenName, chartValue, announcement, onNext }: SoldModalProps) {
  const [phase, setPhase] = useState<'show' | 'actions'>('show')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('actions'), 800)
    return () => clearTimeout(timer)
  }, [])

  const profit = Math.round(chartValue - 100)
  const profitLabel = profit >= 0 ? `+${profit}` : `${profit}`

  // HODLしていた場合の結果を判定
  const wouldHaveRugged = announcement.hodl.outcome === 'RUGGED'
  const potentialGain = announcement.hodl.gain

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* 暗いオーバーレイ */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 text-center px-6 animate-fade-in">
        <p className="text-xs text-gray-500 font-mono tracking-widest mb-3">
          {tokenName}
        </p>
        <h1 className={`text-6xl font-black tracking-[0.6em] mb-6 ${wouldHaveRugged ? 'text-green-500' : 'text-yellow-500'}`}>
          SOLD
        </h1>

        <div className="space-y-3 max-w-md text-center mx-auto">
          <p className={`text-xs font-mono uppercase tracking-[0.3em] ${wouldHaveRugged ? 'text-green-300' : 'text-yellow-300'}`}>
            {wouldHaveRugged ? '完璧な利確' : '早売り'}
          </p>
          <p className="text-white text-3xl font-bold">
            {chartValue} pts
          </p>
          <p className="text-gray-400 text-sm font-mono">
            損益: {profitLabel}%
          </p>

          {/* HODLしていた場合の結果 */}
          <div className={`mt-4 p-3 rounded-lg ${wouldHaveRugged ? 'bg-green-900/30 border border-green-500/30' : 'bg-yellow-900/30 border border-yellow-500/30'}`}>
            {wouldHaveRugged ? (
              <>
                <p className="text-green-400 text-sm font-bold">
                  HODLしていたらZEROだった
                </p>
                <p className="text-green-300/70 text-xs font-mono mt-1">
                  正しい判断だ。利確こそが唯一の防御。
                </p>
              </>
            ) : (
              <>
                <p className="text-yellow-400 text-sm font-bold">
                  HODLしていたら +{potentialGain}% だった
                </p>
                <p className="text-yellow-300/70 text-xs font-mono mt-1">
                  利益を逃したが、生き残ることが最優先。
                </p>
              </>
            )}
          </div>
        </div>

        {phase === 'actions' && (
          <div className="mt-8 animate-fade-in">
            <button
              onClick={onNext}
              className="w-48 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
            >
              Next Token
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
