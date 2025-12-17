'use client'

import { ActionChoice, Announcement } from '@/lib/engine'

interface ActionButtonsProps {
  announcement: Announcement
  onAction: (choice: ActionChoice) => void
  disabled?: boolean
}

export default function ActionButtons({ announcement, onAction, disabled = false }: ActionButtonsProps) {
  const playSound = () => {
    const audio = new Audio('/sound/register.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // 自動再生がブロックされた場合は無視
    })
  }

  const handleClick = (choice: ActionChoice) => {
    if (disabled) return
    playSound()
    onAction(choice)
  }

  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('HODL')}
        className={`rounded-2xl border-2 border-green-500/40 bg-gradient-to-br from-green-900/30 to-gray-900/60 p-5 text-center shadow-lg transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-400/70 hover:translate-y-0.5'
          }`}
      >
        <h3 className="text-2xl font-black text-white">HODL</h3>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('SELL')}
        className={`rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-900/30 to-gray-900/60 p-5 text-center shadow-lg transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-400/70 hover:-translate-y-0.5'
          }`}
      >
        <h3 className="text-2xl font-black text-white">SELL</h3>
      </button>
    </div>
  )
}
