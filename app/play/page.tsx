'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ActionButtons from '@/components/ActionButtons'
import RuggedModal from '@/components/RuggedModal'
import SoldModal from '@/components/SoldModal'
import CandleChart from '@/components/CandleChart'
import {
  ActionChoice,
  GameState,
  createInitialState,
  getCurrentAnnouncement,
  processAction,
} from '@/lib/engine'
import { tokenScenarios } from '@/data/tokens'

const totalTokens = tokenScenarios.length

export default function PlayPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(totalTokens)
  )
  const [showRugged, setShowRugged] = useState(false)
  const [showSold, setShowSold] = useState(false)
  const [soldTokenName, setSoldTokenName] = useState('')
  const [soldAnnouncement, setSoldAnnouncement] = useState<typeof currentAnnouncement>(undefined)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [pulseChart, setPulseChart] = useState(false)

  const { token: currentToken, announcement: currentAnnouncement } =
    getCurrentAnnouncement(gameState, tokenScenarios)

  const activeTokenIndex = useMemo(() => {
    if (gameState.status === 'COMPLETED') {
      return totalTokens - 1
    }
    return Math.min(gameState.tokenIndex, totalTokens - 1)
  }, [gameState.status, gameState.tokenIndex])

  useEffect(() => {
    if (gameState.status === 'RUGGED') {
      const timer = setTimeout(() => setShowRugged(true), 400)
      return () => clearTimeout(timer)
    }
    setShowRugged(false)
  }, [gameState.status])

  useEffect(() => {
    // showSold中はモーダルから遷移するので自動遷移しない
    if (gameState.status === 'COMPLETED' && !showSold) {
      const timer = setTimeout(() => {
        router.push(
          `/result?survived=${gameState.survivedTokens}&total=${totalTokens}&value=${Math.round(gameState.chartValue)}`
        )
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [gameState.chartValue, gameState.status, gameState.survivedTokens, router, showSold])

  const handleAction = (action: ActionChoice) => {
    if (!currentAnnouncement || isTransitioning || gameState.status !== 'RUNNING') {
      return
    }

    // SELLの場合、モーダルを表示してから次へ進む
    if (action === 'SELL' && currentToken && currentAnnouncement) {
      setSoldTokenName(currentToken.name)
      setSoldAnnouncement(currentAnnouncement)
      const nextState = processAction(gameState, action, tokenScenarios)
      setGameState(nextState)
      setPulseChart(true)
      setTimeout(() => setPulseChart(false), 350)
      setShowSold(true)
      return
    }

    setIsTransitioning(true)
    const nextState = processAction(gameState, action, tokenScenarios)
    setGameState(nextState)
    setPulseChart(true)

    setTimeout(() => {
      setPulseChart(false)
    }, 350)

    if (nextState.status === 'RUNNING') {
      setTimeout(() => {
        setIsTransitioning(false)
      }, 550)
    } else {
      setIsTransitioning(false)
    }
  }

  const handleRetry = () => {
    setGameState(createInitialState(totalTokens))
    setShowRugged(false)
    setShowSold(false)
    setPulseChart(false)
    setIsTransitioning(false)
  }

  const handleSoldNext = () => {
    setShowSold(false)
    // COMPLETEDの場合はresultページに遷移
    if (gameState.status === 'COMPLETED') {
      router.push(
        `/result?survived=${gameState.survivedTokens}&total=${totalTokens}&value=${Math.round(gameState.chartValue)}`
      )
    }
  }

  if (!currentToken || !currentAnnouncement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500 font-mono">アナウンスを待機中...</div>
      </div>
    )
  }

  const announcementStep = `${gameState.announcementIndex + 1}/${currentToken.announcements.length}`
  const chartValueLabel = `${Math.round(gameState.chartValue)} pts`

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {showRugged && gameState.lastAnnouncement && (
        <RuggedModal
          announcement={gameState.lastAnnouncement}
          tokenName={currentToken.name}
          onRetry={handleRetry}
        />
      )}

      {showSold && soldAnnouncement && (
        <SoldModal
          tokenName={soldTokenName}
          chartValue={gameState.chartValue}
          announcement={soldAnnouncement}
          onNext={handleSoldNext}
        />
      )}

      <div className="h-screen flex flex-col p-4 gap-4">
        <header className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono tracking-wider">
            <span>{currentToken.name}</span>
            <span>TOKEN {activeTokenIndex + 1}/{totalTokens}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            {currentToken.description}
          </p>
        </header>

        <section className="flex items-center gap-2">
          {tokenScenarios.map((token, index) => {
            const isCleared = index < gameState.survivedTokens
            const isActive = index === activeTokenIndex && gameState.status === 'RUNNING'
            return (
              <div
                key={token.id}
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                  isCleared
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                    : isActive
                      ? 'bg-white'
                      : 'bg-gray-800'
                }`}
              />
            )
          })}
          <span className="text-xs text-gray-500 font-mono">{chartValueLabel}</span>
        </section>

        <main className="flex-1 flex flex-col gap-4">
          <div className="flex-1 flex items-center justify-center w-full">
            <CandleChart
              chartPoints={gameState.chartHistory}
              isRugged={gameState.status === 'RUGGED'}
              tokenIndex={activeTokenIndex}
              pulse={pulseChart}
            />
          </div>
        </main>

        <div
          className={`bg-gray-900/70 border border-gray-800 rounded-2xl p-4 transition-opacity duration-300 text-center ${
            isTransitioning ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">
            <span>ANNOUNCEMENT {announcementStep}</span>
            <span>tone {currentAnnouncement.tone}</span>
          </div>
          <p className="text-lg leading-relaxed text-gray-50">
            {currentAnnouncement.text}
          </p>
        </div>

        <footer className="pb-2">
          <ActionButtons
            onAction={handleAction}
            announcement={currentAnnouncement}
            disabled={isTransitioning || gameState.status !== 'RUNNING'}
          />
          <p className="text-center text-[10px] text-gray-600 mt-4 font-mono uppercase tracking-[0.3em]">
            情報ではなく、利確のタイミングを選べ。
          </p>
        </footer>
      </div>
    </div>
  )
}
