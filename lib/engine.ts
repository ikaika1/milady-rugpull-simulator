// 型をtypes.tsからインポート・再エクスポート
export type {
  ActionChoice,
  AnnouncementType,
  HodlEffect,
  Announcement,
  TokenScenario,
  GameStatus,
  OutcomeLabel,
  GameState,
} from './types'

import type {
  ActionChoice,
  Announcement,
  TokenScenario,
  GameState,
  OutcomeLabel,
  AnnouncementType,
  HodlEffect,
} from './types'

// タイプ別の成功確率
export const SUCCESS_RATES: Record<AnnouncementType, number> = {
  SAFE: 1.0,           // 100% - 常に成功
  BAIT: 0.0,           // 0% - 常に失敗（RUGGED）
  LOW_RISK_REWARD: 0.9,    // 90%
  MIDDLE_RISK_REWARD: 0.7, // 70%
  HIGH_RISK_REWARD: 0.5,   // 50%
}

// タイプ別の成功時ゲイン範囲
const GAIN_RANGES: Record<AnnouncementType, { min: number; max: number }> = {
  SAFE: { min: 1000, max: 2000 },
  BAIT: { min: 0, max: 0 },
  LOW_RISK_REWARD: { min: 2000, max: 5000 },
  MIDDLE_RISK_REWARD: { min: 10000, max: 20000 },
  HIGH_RISK_REWARD: { min: 20000, max: 30000 },
}

// タイプに応じたHODL結果を生成（アナウンス生成時に利用）
export function createHodlEffect(type: AnnouncementType): HodlEffect {
  const successRate = SUCCESS_RATES[type]
  const roll = Math.random()

  if (roll < successRate) {
    const { min, max } = GAIN_RANGES[type]
    const gain = Math.floor(Math.random() * (max - min + 1)) + min
    return { outcome: 'GAIN', gain }
  }

  return { outcome: 'RUGGED', gain: -100 }
}

// 初期資金（ドル）
export const INITIAL_FUNDS = 10000

export function createInitialState(totalTokens: number): GameState {
  return {
    tokenIndex: 0,
    announcementIndex: 0,
    survivedTokens: 0,
    totalTokens,
    chartValue: INITIAL_FUNDS,
    chartHistory: [INITIAL_FUNDS],
    tokenGain: 0,  // トークン開始時は0
    tokenGainHistory: [0],  // 初期値0から開始
    status: 'RUNNING',
    lastAction: null,
    lastOutcome: null,
    lastAnnouncement: null,
  }
}

interface AdvanceOptions {
  state: GameState
  tokens: TokenScenario[]
  chartValue: number
  chartHistory: number[]
  action: ActionChoice
  outcome: Exclude<OutcomeLabel, null>
  announcement: Announcement
}

function advanceToNextToken(options: AdvanceOptions): GameState {
  const {
    state,
    tokens,
    chartValue,
    chartHistory,
    action,
    outcome,
    announcement,
  } = options
  const nextTokenIndex = state.tokenIndex + 1
  const survivedTokens = Math.min(state.totalTokens, state.survivedTokens + 1)
  const hasMoreTokens = nextTokenIndex < state.totalTokens && nextTokenIndex < tokens.length

  return {
    ...state,
    tokenIndex: nextTokenIndex,
    announcementIndex: 0,
    chartValue,
    chartHistory,
    tokenGain: 0,  // 次のトークンでリセット
    tokenGainHistory: [0],  // 次のトークンでリセット
    survivedTokens,
    status: hasMoreTokens ? 'RUNNING' : 'COMPLETED',
    lastAction: action,
    lastOutcome: outcome,
    lastAnnouncement: announcement,
  }
}

export function processAction(
  state: GameState,
  action: ActionChoice,
  tokens: TokenScenario[]
): GameState {
  if (state.status !== 'RUNNING') {
    return state
  }

  const token = tokens[state.tokenIndex]
  const announcement = token?.announcements[state.announcementIndex]

  if (!token || !announcement) {
    return {
      ...state,
      status: 'COMPLETED',
      tokenIndex: tokens.length,
      announcementIndex: 0,
    }
  }

  if (action === 'SELL') {
    // SELLは安全に利確。SAFEタイプなら小さなボーナス
    const sellGain = announcement.type === 'SAFE' ? 8 : 0
    const chartValue = state.chartValue + sellGain
    const chartHistory = [...state.chartHistory, chartValue]
    const tokenGain = state.tokenGain + sellGain
    const tokenGainHistory = [...state.tokenGainHistory, tokenGain]

    return advanceToNextToken({
      state: { ...state, tokenGain, tokenGainHistory },
      tokens,
      chartValue,
      chartHistory,
      action,
      outcome: 'PROFIT',
      announcement,
    })
  }

  // HODL: 事前に生成された結果を利用
  const hodlResult = announcement.hodl

  if (hodlResult.outcome === 'RUGGED') {
    return {
      ...state,
      status: 'RUGGED',
      chartValue: 0,
      chartHistory: [...state.chartHistory, 0],
      tokenGain: -100,  // RUGGEDは-100%
      // tokenGainHistoryは更新しない（CandleChartがisRuggedでキャンドルを追加する）
      lastAction: action,
      lastOutcome: 'LOSS',
      lastAnnouncement: announcement,
    }
  }

  // 成功: ゲインを獲得
  const chartValue = state.chartValue + hodlResult.gain
  const chartHistory = [...state.chartHistory, chartValue]
  const tokenGain = state.tokenGain + hodlResult.gain
  const tokenGainHistory = [...state.tokenGainHistory, tokenGain]
  const isLastAnnouncement = state.announcementIndex >= token.announcements.length - 1

  if (isLastAnnouncement) {
    return advanceToNextToken({
      state: { ...state, tokenGain, tokenGainHistory },
      tokens,
      chartValue,
      chartHistory,
      action,
      outcome: 'GAIN',
      announcement,
    })
  }

  return {
    ...state,
    announcementIndex: state.announcementIndex + 1,
    chartValue,
    chartHistory,
    tokenGain,
    tokenGainHistory,
    lastAction: action,
    lastOutcome: 'GAIN',
    lastAnnouncement: announcement,
  }
}

export function getCurrentAnnouncement(
  state: GameState,
  tokens: TokenScenario[]
): { token?: TokenScenario; announcement?: Announcement } {
  const token = tokens[state.tokenIndex]
  const announcement = token?.announcements[state.announcementIndex]
  return { token, announcement }
}

export function getTitle(survivedTokens: number, totalTokens: number): string {
  if (survivedTokens === totalTokens) {
    return 'ULTRA DISCIPLINED'
  }

  if (survivedTokens === 0) {
    return 'BELIEVED THE FIRST TONE'
  }

  if (survivedTokens <= 1) {
    return 'FED BY HYPE'
  }

  if (survivedTokens >= totalTokens - 1) {
    return 'ALMOST SAFE'
  }

  return 'SOMETIMES GREEDY'
}

export function getScoreMessage(
  survivedTokens: number,
  totalTokens: number,
  chartValue: number
): string {
  if (survivedTokens === totalTokens) {
    return '利確のタイミングだけを信じ続けた結果だ。'
  }

  if (survivedTokens === 0) {
    return '最初のアナウンスで欲に乗った。情報ではなく行動が結果を決める。'
  }

  const profit = Math.round(chartValue - INITIAL_FUNDS)
  const formatted = profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`

  return `${survivedTokens}/${totalTokens} トークン生存。損益 ${formatted}。利確が遅れるほど危険は増す。`
}
