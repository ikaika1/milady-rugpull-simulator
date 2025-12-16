'use client'

import { ActionChoice, Announcement } from '@/lib/engine'

interface ActionButtonsProps {
  announcement: Announcement
  onAction: (choice: ActionChoice) => void
  disabled?: boolean
}

export default function ActionButtons({ announcement, onAction, disabled = false }: ActionButtonsProps) {
  const handleClick = (choice: ActionChoice) => {
    if (disabled) return
    onAction(choice)
  }

  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('SELL')}
        className={`rounded-2xl border-2 border-green-500/40 bg-gradient-to-br from-gray-900/60 to-black p-5 text-left shadow-lg transition-all duration-200 flex flex-col h-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-400/70 hover:-translate-y-0.5'
        }`}
      >
        <p className="text-xs text-green-300 uppercase tracking-[0.4em] mb-2 font-mono">SELL</p>
        <h3 className="text-2xl font-black text-white mb-4">SELL</h3>
        <p className="text-[10px] text-gray-500 font-mono mt-auto uppercase tracking-[0.4em]">
          exit timing is the only defense
        </p>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('HODL')}
        className={`rounded-2xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-900/30 via-purple-900/30 to-gray-900/40 p-5 text-left shadow-lg transition-all duration-200 flex flex-col h-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-400/60 hover:translate-y-0.5'
        }`}
      >
        <p className="text-xs text-pink-200 uppercase tracking-[0.4em] mb-2 font-mono">HODL</p>
        <h3 className="text-2xl font-black text-white mb-4">HODL</h3>
        <p className="text-[10px] text-gray-500 font-mono mt-auto">
          tone hint {'->'} {announcement.tone}
        </p>
      </button>
    </div>
  )
}
