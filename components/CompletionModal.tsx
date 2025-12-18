'use client'

import { INITIAL_FUNDS } from '@/lib/engine'

interface CompletionModalProps {
  chartValue: number
  onContinue: () => void
  onEnd: () => void
}

export default function CompletionModal({ chartValue, onContinue, onEnd }: CompletionModalProps) {
  const profit = Math.round(chartValue - INITIAL_FUNDS)
  const profitLabel = profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`

  return (
    <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-6 animate-fade-in">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-mono tracking-[0.4em] uppercase">token loop</p>
          <h1 className="text-6xl font-black text-green-400 tracking-[0.5em]">CLEAR</h1>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-mono tracking-widest">RESULT</p>
          <p className="text-5xl font-black text-white">
            ${Math.round(chartValue).toLocaleString()}
          </p>
          <p className="text-lg text-green-400 font-mono">
            {profitLabel}
          </p>
          <p className="text-sm text-gray-500 font-mono">
            5/5 tokens survived
          </p>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          欲に勝ち続けた。ここで終わるか、もう5トークン分のブロードキャストに挑戦するかを選択せよ。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-2xl transition-colors"
          >
            Play 5 More
          </button>
          <button
            onClick={onEnd}
            className="flex-1 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold rounded-2xl transition-colors"
          >
            Congratulations
          </button>
        </div>
      </div>
    </div>
  )
}
