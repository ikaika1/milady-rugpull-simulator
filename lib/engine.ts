export type ActionChoice = 'HODL' | 'SELL'

export type AnnouncementType =
  | 'SAFE'
  | 'BAIT'
  | 'LOW_RISK_REWARD'
  | 'MIDDLE_RISK_REWARD'
  | 'HIGH_RISK_REWARD'

export interface HodlEffect {
  outcome: 'GAIN' | 'RUGGED'
  gain: number
}

export interface Announcement {
  id: string
  text: string
  type: AnnouncementType
  tone: string
  hodl: HodlEffect
  learn?: string[]
}

export interface TokenScenario {
  id: string
  name: string
  description: string
  announcements: Announcement[]
}

export type GameStatus = 'RUNNING' | 'RUGGED' | 'COMPLETED'
export type OutcomeLabel = 'GAIN' | 'LOSS' | 'PROFIT' | null

export interface GameState {
  tokenIndex: number
  announcementIndex: number
  survivedTokens: number
  totalTokens: number
  chartValue: number
  chartHistory: number[]
  status: GameStatus
  lastAction: ActionChoice | null
  lastOutcome: OutcomeLabel
  lastAnnouncement: Announcement | null
}

export function createInitialState(totalTokens: number): GameState {
  return {
    tokenIndex: 0,
    announcementIndex: 0,
    survivedTokens: 0,
    totalTokens,
    chartValue: 100,
    chartHistory: [100],
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
    const gain = announcement.type === 'SAFE' ? 8 : 0
    const chartValue = state.chartValue + gain
    const chartHistory = [...state.chartHistory, chartValue]

    return advanceToNextToken({
      state,
      tokens,
      chartValue,
      chartHistory,
      action,
      outcome: 'PROFIT',
      announcement,
    })
  }

  if (announcement.hodl.outcome === 'RUGGED') {
    return {
      ...state,
      status: 'RUGGED',
      chartValue: 0,
      chartHistory: [...state.chartHistory, 0],
      lastAction: action,
      lastOutcome: 'LOSS',
      lastAnnouncement: announcement,
    }
  }

  const chartValue = state.chartValue + announcement.hodl.gain
  const chartHistory = [...state.chartHistory, chartValue]
  const isLastAnnouncement = state.announcementIndex >= token.announcements.length - 1

  if (isLastAnnouncement) {
    return advanceToNextToken({
      state,
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

  const profit = Math.round(chartValue - 100)
  const formatted = profit >= 0 ? `+${profit}` : `${profit}`

  return `${survivedTokens}/${totalTokens} トークン生存。損益 ${formatted}%。利確が遅れるほど危険は増す。`
}
