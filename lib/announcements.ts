import type { AnnouncementType, Announcement, TokenScenario, HodlEffect } from './types'
import { createHodlEffect } from './engine'
import casesSafe from '@/data/cases_safe.json'
import casesBait from '@/data/cases_bait.json'
import casesLowRisk from '@/data/cases_low_risk.json'
import casesMiddleRisk from '@/data/cases_middle_risk.json'
import casesHighRisk from '@/data/cases_high_risk.json'

// JSONからのアナウンスメント型
interface RawAnnouncement {
  caseId: string
  caseTitle: string
  caseDifficulty: string
  caseType: string
  announcementIndex: number
  text: string
  type: AnnouncementType
  tone: string
  isRugged: boolean
  gain: number
  learn?: string[]
}

// 全アナウンスメントを結合してタイプ別に分類
const allRawAnnouncements: RawAnnouncement[] = [
  ...(casesSafe as RawAnnouncement[]),
  ...(casesBait as RawAnnouncement[]),
  ...(casesLowRisk as RawAnnouncement[]),
  ...(casesMiddleRisk as RawAnnouncement[]),
  ...(casesHighRisk as RawAnnouncement[]),
]

// タイプ別のアナウンスメントプール
export const announcementPools: Record<AnnouncementType, RawAnnouncement[]> = {
  SAFE: [],
  BAIT: [],
  LOW_RISK_REWARD: [],
  MIDDLE_RISK_REWARD: [],
  HIGH_RISK_REWARD: [],
}

// プールを構築
allRawAnnouncements.forEach(raw => {
  announcementPools[raw.type].push(raw)
})

function buildHodlEffect(raw: RawAnnouncement): HodlEffect {
  if (raw.isRugged) {
    return { outcome: 'RUGGED', gain: -100 }
  }

  // 生成ロジックで得られた HodlEffect をそのまま使う。
  // (以前は raw.gain を使っており、JSON に gain が無い場合に undefined となってしまっていた)
  const effect = createHodlEffect(raw.type)
  return effect
}

function instantiateAnnouncement(raw: RawAnnouncement): Announcement {
  return {
    id: `${raw.caseId}_${raw.announcementIndex}_${Math.random().toString(36).slice(2, 8)}`,
    text: raw.text,
    type: raw.type,
    tone: raw.tone,
    hodl: buildHodlEffect(raw),
    learn: raw.learn,
  }
}

// 配列からランダムにN個選択（重複なし）
function randomPickN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

// 難易度曲線に基づくアナウンス分布
interface AnnouncementDistribution {
  SAFE: number
  BAIT: number
  LOW_RISK_REWARD: number
  MIDDLE_RISK_REWARD: number
  HIGH_RISK_REWARD: number
}

const DIFFICULTY_CURVES: Record<number, AnnouncementDistribution> = {
  // Token 1: SAFE多, BAIT無, LOW少, MIDDLE少, HIGH無
  1: { SAFE: 3, BAIT: 0, LOW_RISK_REWARD: 1, MIDDLE_RISK_REWARD: 1, HIGH_RISK_REWARD: 0 },
  // Token 2: SAFE多, BAIT無, LOW少, MIDDLE少, HIGH無
  2: { SAFE: 3, BAIT: 0, LOW_RISK_REWARD: 1, MIDDLE_RISK_REWARD: 1, HIGH_RISK_REWARD: 0 },
  // Token 3: SAFE多, BAIT少, LOW中, MIDDLE少, HIGH少
  3: { SAFE: 2, BAIT: 1, LOW_RISK_REWARD: 2, MIDDLE_RISK_REWARD: 1, HIGH_RISK_REWARD: 1 },
  // Token 4+: SAFE多, BAIT少, LOW中, MIDDLE中, HIGH少
  4: { SAFE: 2, BAIT: 1, LOW_RISK_REWARD: 2, MIDDLE_RISK_REWARD: 2, HIGH_RISK_REWARD: 1 },
}

// トークン番号に基づいて難易度曲線を取得
function getDistribution(tokenNumber: number): AnnouncementDistribution {
  if (tokenNumber >= 4) return DIFFICULTY_CURVES[4]
  return DIFFICULTY_CURVES[tokenNumber] || DIFFICULTY_CURVES[1]
}

// ランダムなアナウンスメントリストを生成
export function generateRandomAnnouncements(tokenNumber: number): Announcement[] {
  const distribution = getDistribution(tokenNumber)
  const announcements: Announcement[] = []

  // 各タイプからランダムに選択
  const types: AnnouncementType[] = ['SAFE', 'BAIT', 'LOW_RISK_REWARD', 'MIDDLE_RISK_REWARD', 'HIGH_RISK_REWARD']

  for (const type of types) {
    const count = distribution[type]
    if (count > 0 && announcementPools[type].length > 0) {
      const picked = randomPickN(announcementPools[type], count)
      announcements.push(...picked.map(raw => instantiateAnnouncement(raw)))
    }
  }

  // シャッフルして順番をランダム化
  return announcements.sort(() => Math.random() - 0.5)
}

// ランダムなトークンシナリオを生成
export function generateRandomScenario(tokenIndex: number): TokenScenario {
  const tokenNumber = tokenIndex + 1
  const announcements = generateRandomAnnouncements(tokenNumber)

  return {
    id: `token_${tokenNumber}_${Date.now()}`,
    name: `TOKEN #${tokenNumber}`,
    description: tokenNumber <= 2 ? 'EASY' : tokenNumber === 3 ? 'MEDIUM' : 'HARD',
    announcements,
  }
}

// 複数のランダムシナリオを生成
export function generateRandomScenarios(count: number): TokenScenario[] {
  return Array.from({ length: count }, (_, i) => generateRandomScenario(i))
}
