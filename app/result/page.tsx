'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { getTitle, getScoreMessage, INITIAL_FUNDS } from '@/lib/engine'

// 結果表示コンポーネント
function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const survived = parseInt(searchParams.get('survived') || '0', 10)
  const total = parseInt(searchParams.get('total') || '4', 10)
  const chartValue = parseInt(searchParams.get('value') || String(INITIAL_FUNDS), 10)

  const title = getTitle(survived, total)
  const message = getScoreMessage(survived, total, chartValue)
  const isPerfect = survived === total
  const profit = chartValue - INITIAL_FUNDS
  const profitLabel = profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`

  const handleRetry = () => {
    router.push('/play')
  }

  const handleHome = () => {
    router.push('/')
  }

  const handleShare = () => {
    const text = `ULTRATHINK: ${title} (${survived}/${total}) / $${chartValue.toLocaleString()} (${profitLabel})\n情報ではなく利確のタイミングを選ぶ決定論シミュレーター。`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      alert('クリップボードにコピーしました')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* 結果表示 */}
      <div className="text-center mb-8">
        {/* 称号 */}
        <div
          className={`
            text-4xl md:text-5xl font-black tracking-tight mb-4
            ${isPerfect ? 'text-green-500' : 'text-gray-400'}
          `}
        >
          {title}
        </div>

        {/* スコア */}
        <div className="text-6xl font-mono font-bold mb-4">
          <span className={isPerfect ? 'text-green-400' : 'text-white'}>{survived}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">{total}</span>
        </div>

        <div className="text-sm text-gray-400 font-mono mb-4">
          Chart Result: <span className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>{profitLabel}</span>
        </div>

        {/* メッセージ */}
        <p className="text-gray-400 text-sm">
          {message}
        </p>
      </div>

      {/* 生存インジケーター */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full
              ${i < survived ? 'bg-green-500' : 'bg-red-500'}
            `}
          />
        ))}
      </div>

      {/* アクションボタン */}
      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={handleShare}
          className="
            w-full py-3 bg-white text-black font-bold rounded-lg
            hover:bg-gray-200 active:scale-[0.98] transition-all
          "
        >
          Share
        </button>

        <button
          onClick={handleRetry}
          className="
            w-full py-3 bg-gray-800 text-white font-medium rounded-lg
            hover:bg-gray-700 active:scale-[0.98] transition-all
          "
        >
          Play Again
        </button>

        <button
          onClick={handleHome}
          className="
            w-full py-3 border border-gray-700 text-gray-400 font-medium rounded-lg
            hover:border-gray-600 hover:text-gray-300 active:scale-[0.98] transition-all
          "
        >
          Home
        </button>
      </div>

      {/* 教訓 */}
      {isPerfect && (
        <div className="mt-8 max-w-sm text-center">
          <p className="text-gray-500 text-xs">
            慎重さが生存の鍵。安全は退屈だが、退屈こそが安全。
          </p>
        </div>
      )}
    </div>
  )
}

// 結果画面（Suspense でラップ）
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
