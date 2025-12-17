'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/miniapp-sdk'
import ActionButtons from '@/components/ActionButtons'
import RuggedModal from '@/components/RuggedModal'
import SoldModal from '@/components/SoldModal'
import CompletionModal from '@/components/CompletionModal'
import CandleChart from '@/components/CandleChart'
import {
  ActionChoice,
  GameState,
  TokenScenario,
  Announcement,
  createInitialState,
  getCurrentAnnouncement,
  processAction,
} from '@/lib/engine'
import { generateRandomScenarios } from '@/lib/announcements'

// デフォルトのトークン数
const DEFAULT_TOKEN_COUNT = 5

export default function PlayPage() {
  const router = useRouter()

  // ランダムシナリオをクライアントサイドで生成（Hydrationエラー防止）
  const [scenarios, setScenarios] = useState<TokenScenario[]>([])
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(DEFAULT_TOKEN_COUNT)
  )
  const [showRugged, setShowRugged] = useState(false)
  const [showSold, setShowSold] = useState(false)
  const [soldTokenName, setSoldTokenName] = useState('')
  const [soldAnnouncement, setSoldAnnouncement] = useState<Announcement | undefined>(undefined)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [pulseChart, setPulseChart] = useState(false)
  const [showCompletionChoice, setShowCompletionChoice] = useState(false)

  // Farcaster MiniApp SDK の初期化
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  // 初回マウント時にシナリオを生成
  useEffect(() => {
    if (scenarios.length === 0) {
      setScenarios(generateRandomScenarios(DEFAULT_TOKEN_COUNT))
    }
  }, [scenarios.length])

  const totalTokens = scenarios.length || DEFAULT_TOKEN_COUNT

  const { token: currentToken, announcement: currentAnnouncement } =
    getCurrentAnnouncement(gameState, scenarios)

  const activeTokenIndex = useMemo(() => {
    if (gameState.status === 'COMPLETED') {
      return totalTokens - 1
    }
    return Math.min(gameState.tokenIndex, totalTokens - 1)
  }, [gameState.status, gameState.tokenIndex, totalTokens])

  useEffect(() => {
    if (gameState.status === 'RUGGED') {
      // 暴落チャートを眺める時間を確保するため遅延を長めに設定
      const timer = setTimeout(() => setShowRugged(true), 2000)
      return () => clearTimeout(timer)
    }
    setShowRugged(false)
  }, [gameState.status])

  const goToResultPage = useCallback(() => {
    router.push(
      `/result?survived=${gameState.survivedTokens}&total=${totalTokens}&value=${Math.round(gameState.chartValue)}`
    )
  }, [router, gameState.survivedTokens, totalTokens, gameState.chartValue])

  useEffect(() => {
    if (gameState.status === 'COMPLETED') {
      if (gameState.survivedTokens >= totalTokens) {
        if (!showSold) {
          setShowCompletionChoice(true)
        }
        return
      }

      if (!showSold) {
        const timer = setTimeout(() => {
          goToResultPage()
        }, 700)
        return () => clearTimeout(timer)
      }
    } else if (showCompletionChoice) {
      setShowCompletionChoice(false)
    }
  }, [
    gameState.status,
    gameState.survivedTokens,
    showSold,
    totalTokens,
    showCompletionChoice,
    goToResultPage,
  ])

  const handleAction = (action: ActionChoice) => {
    if (!currentAnnouncement || isTransitioning || gameState.status !== 'RUNNING') {
      return
    }

    // SELLの場合、先にモーダル表示フラグを立ててから状態更新
    if (action === 'SELL' && currentToken && currentAnnouncement) {
      // 先にモーダル表示用のデータを保存
      setSoldTokenName(currentToken.name)
      setSoldAnnouncement(currentAnnouncement)
      setShowSold(true)  // showSoldを先にtrueにする

      // その後にゲーム状態を更新
      const nextState = processAction(gameState, action, scenarios)
      setGameState(nextState)
      setPulseChart(true)
      setTimeout(() => setPulseChart(false), 350)
      return
    }

    setIsTransitioning(true)
    const nextState = processAction(gameState, action, scenarios)
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
    // 新しいランダムシナリオを生成
    const newScenarios = generateRandomScenarios(DEFAULT_TOKEN_COUNT)
    setScenarios(newScenarios)
    setGameState(createInitialState(DEFAULT_TOKEN_COUNT))
    setShowRugged(false)
    setShowSold(false)
    setPulseChart(false)
    setIsTransitioning(false)
    setShowCompletionChoice(false)
  }

  const handleSoldNext = () => {
    setShowSold(false)
    // COMPLETEDの場合はresultページに遷移
    if (gameState.status === 'COMPLETED') {
      if (gameState.survivedTokens >= totalTokens) {
        setShowCompletionChoice(true)
      } else {
        goToResultPage()
      }
    }
  }

  const handleContinueAfterClear = () => {
    // ポイントを引き継いで次の5トークンをプレイ
    const currentChartValue = gameState.chartValue
    const newScenarios = generateRandomScenarios(DEFAULT_TOKEN_COUNT)
    setScenarios(newScenarios)
    setGameState({
      ...createInitialState(DEFAULT_TOKEN_COUNT),
      chartValue: currentChartValue,
      chartHistory: [currentChartValue], // 現在の値のみで新しい履歴を開始
    })
    setShowRugged(false)
    setShowSold(false)
    setPulseChart(false)
    setIsTransitioning(false)
    setShowCompletionChoice(false)
  }

  const handleEndAfterClear = () => {
    setShowCompletionChoice(false)
    goToResultPage()
  }

  // 5トークンクリア時はCompletionModalを表示
  // showSold中でなく、COMPLETEDかつ全トークン通過した場合もモーダル表示
  // tokenIndex >= totalTokens は全トークンを通過したことを意味する
  // Note: scenariosが既に読み込まれていて、全トークンをクリアした場合
  const isAllTokensCleared = gameState.status === 'COMPLETED' &&
    scenarios.length > 0 &&
    gameState.tokenIndex >= scenarios.length &&
    !showSold
  const shouldShowCompletion = showCompletionChoice || isAllTokensCleared

  if (shouldShowCompletion) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <CompletionModal
          chartValue={gameState.chartValue}
          onContinue={handleContinueAfterClear}
          onEnd={handleEndAfterClear}
        />
      </div>
    )
  }

  // showSold表示中は、tokenIndexが進んでいてもエラー画面を出さずにモーダルを表示する
  if (showSold && soldAnnouncement) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <SoldModal
          tokenName={soldTokenName}
          chartValue={gameState.chartValue}
          announcement={soldAnnouncement}
          onNext={handleSoldNext}
        />
      </div>
    )
  }

  // scenariosがまだロードされていない場合はローディング
  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="text-gray-500 font-mono">Loading scenarios...</div>
      </div>
    )
  }

  // RUNNING状態でtokenIndexが範囲外の場合は完了処理へ
  if (gameState.status === 'RUNNING' && gameState.tokenIndex >= scenarios.length) {
    // これは本来起こらないはずだが、安全のためCOMPLETED扱いにする
    setGameState(prev => ({
      ...prev,
      status: 'COMPLETED',
      survivedTokens: prev.survivedTokens,
    }))
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500 font-mono">Processing...</div>
      </div>
    )
  }

  if (!currentToken || !currentAnnouncement) {
    // デバッグ情報を表示
    const debugInfo = {
      scenariosLength: scenarios.length,
      tokenIndex: gameState.tokenIndex,
      announcementIndex: gameState.announcementIndex,
      status: gameState.status,
      survivedTokens: gameState.survivedTokens,
      showSold,
    }
    console.error('アナウンス取得失敗:', debugInfo)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="text-gray-500 font-mono">アナウンスを待機中...</div>
        <div className="text-xs text-gray-700 font-mono">
          tokens: {scenarios.length}, idx: {gameState.tokenIndex}, status: {gameState.status}
        </div>
        <button
          onClick={() => {
            const newScenarios = generateRandomScenarios(DEFAULT_TOKEN_COUNT)
            setScenarios(newScenarios)
            setGameState(createInitialState(DEFAULT_TOKEN_COUNT))
          }}
          className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          ゲームをリセット
        </button>
      </div>
    )
  }
  const announcementStep = `${gameState.announcementIndex + 1}/${currentToken.announcements.length}`
  const chartValueLabel = `$${Math.round(gameState.chartValue).toLocaleString()}`

  return (
    <div
      className="min-h-screen bg-black text-white overflow-hidden relative"
    >
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

      {showCompletionChoice && (
        <CompletionModal
          chartValue={gameState.chartValue}
          onContinue={handleContinueAfterClear}
          onEnd={handleEndAfterClear}
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
          {Array.from({ length: totalTokens }).map((_, index) => {
            const isCleared = index < gameState.survivedTokens
            const isActive = index === activeTokenIndex && gameState.status === 'RUNNING'
            const key = scenarios[index]?.id ?? `token-progress-${index}`
            return (
              <div
                key={key}
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${isCleared
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
              chartPoints={gameState.tokenGainHistory}
              isRugged={gameState.status === 'RUGGED'}
              tokenIndex={activeTokenIndex}
              pulse={pulseChart}
            />
          </div>
        </main>

        <div
          className={`bg-gray-900/70 border-2 border-orange-500 rounded-2xl p-4 transition-opacity duration-300 text-center shadow-[0_0_20px_rgba(249,115,22,0.3)] ${isTransitioning ? 'opacity-50' : ''
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

      {/* 右下に資産額を表示 */}
      <div className="fixed bottom-4 right-4 bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2 backdrop-blur">
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">PORTFOLIO</p>
        <p className="text-xl font-bold text-white">
          ${Math.round(gameState.chartValue).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
