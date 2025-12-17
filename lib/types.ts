// 共有型定義（循環参照を防ぐため）

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
  tokenGain: number  // 現在のトークンで得たgain（価格計算用）
  tokenGainHistory: number[]  // トークン内のgain履歴（チャート表示用）
  status: GameStatus
  lastAction: ActionChoice | null
  lastOutcome: OutcomeLabel
  lastAnnouncement: Announcement | null
}
