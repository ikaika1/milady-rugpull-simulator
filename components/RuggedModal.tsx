'use client'

import { useEffect, useState } from 'react'
import { Announcement } from '@/lib/engine'
import { announcementTypeLabels } from '@/data/tokens'
import LearnPanel from './LearnPanel'

interface RuggedModalProps {
  announcement: Announcement
  tokenName: string
  onRetry: () => void
}

export default function RuggedModal({ announcement, tokenName, onRetry }: RuggedModalProps) {
  const [phase, setPhase] = useState<'glitch' | 'message' | 'actions'>('glitch')
  const [showLearn, setShowLearn] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('message'), 450)
    const timer2 = setTimeout(() => setPhase('actions'), 1200)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  if (showLearn) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <LearnPanel announcement={announcement} tokenName={tokenName} />
          <button
            onClick={onRetry}
            className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {phase === 'glitch' && (
        <div className="absolute inset-0 bg-red-900/30 animate-glitch opacity-80" />
      )}

      <div className={`text-center px-6 ${phase === 'glitch' ? 'animate-shake' : 'animate-fade-in'}`}>
        <p className="text-xs text-gray-500 font-mono tracking-widest mb-3">
          {tokenName}
        </p>
        <h1
          className={`
            text-6xl font-black tracking-[0.6em] mb-6
            ${phase === 'glitch' ? 'text-red-500 animate-glitch' : 'text-red-600'}
          `}
        >
          ZERO
        </h1>

        {(phase === 'message' || phase === 'actions') && (
          <div className="animate-fade-in space-y-3 max-w-md text-center mx-auto">
            <p className="text-xs text-red-300 font-mono uppercase tracking-[0.3em]">
              {announcementTypeLabels[announcement.type]}
            </p>
            <p className="text-white text-sm leading-relaxed">
              {announcement.text}
            </p>
            <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">
              YOUR BAGS ARE GOING TO ZERO
            </p>
          </div>
        )}

        {phase === 'actions' && (
          <div className="mt-8 space-y-3 animate-fade-in">
            <button
              onClick={() => setShowLearn(true)}
              className="w-48 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
            >
              Learn why
            </button>
            <button
              onClick={onRetry}
              className="w-48 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
