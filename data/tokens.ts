import { AnnouncementType, TokenScenario, Announcement } from '@/lib/engine'
import casesSafe from './cases_safe.json'
import casesBait from './cases_bait.json'
import casesLowRisk from './cases_low_risk.json'
import casesMiddleRisk from './cases_middle_risk.json'
import casesHighRisk from './cases_high_risk.json'

export type Difficulty = 'easy' | 'medium' | 'hard'

// タイプ別のゲイン範囲（100の倍数で生成）
const GAIN_RANGES: Record<AnnouncementType, { min: number; max: number }> = {
  SAFE: { min: 300, max: 1200 },
  BAIT: { min: 0, max: 0 },
  LOW_RISK_REWARD: { min: 1500, max: 3000 },
  MIDDLE_RISK_REWARD: { min: 5000, max: 10000 },
  HIGH_RISK_REWARD: { min: 10000, max: 20000 },
}

// タイプに応じたゲインを生成（100の倍数）
function generateGain(type: AnnouncementType): number {
  const { min, max } = GAIN_RANGES[type]
  if (min === 0 && max === 0) return 0
  // 100の倍数で乱数を生成
  const minStep = Math.ceil(min / 100)
  const maxStep = Math.floor(max / 100)
  const step = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep
  return step * 100
}

// JSONファイルの各エントリの型
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
  learn?: string[]
}

// 全アナウンスメントを結合
const allAnnouncements: RawAnnouncement[] = [
  ...(casesSafe as RawAnnouncement[]),
  ...(casesBait as RawAnnouncement[]),
  ...(casesLowRisk as RawAnnouncement[]),
  ...(casesMiddleRisk as RawAnnouncement[]),
  ...(casesHighRisk as RawAnnouncement[]),
]

// caseIdでグループ化してTokenScenarioに変換
function buildTokenScenarios(): Map<string, TokenScenario> {
  const caseMap = new Map<string, {
    caseId: string
    caseTitle: string
    caseDifficulty: string
    caseType: string
    announcements: RawAnnouncement[]
  }>()

  // caseIdでグループ化
  for (const ann of allAnnouncements) {
    if (!caseMap.has(ann.caseId)) {
      caseMap.set(ann.caseId, {
        caseId: ann.caseId,
        caseTitle: ann.caseTitle,
        caseDifficulty: ann.caseDifficulty,
        caseType: ann.caseType,
        announcements: [],
      })
    }
    caseMap.get(ann.caseId)!.announcements.push(ann)
  }

  // TokenScenarioに変換
  const scenarios = new Map<string, TokenScenario>()
  let index = 0
  for (const [caseId, caseData] of caseMap) {
    // announcementIndexでソート
    const sortedAnns = caseData.announcements.sort((a, b) => a.announcementIndex - b.announcementIndex)

    const announcements: Announcement[] = sortedAnns.map((ann, annIndex) => ({
      id: `${caseId}_${annIndex}`,
      text: ann.text,
      type: ann.type,
      tone: ann.tone,
      hodl: ann.isRugged
        ? { outcome: 'RUGGED' as const, gain: -100 }
        : { outcome: 'GAIN' as const, gain: generateGain(ann.type) },
      learn: ann.learn,
    }))

    scenarios.set(caseId, {
      id: caseId,
      name: `TOKEN #${index + 1} / ${caseData.caseTitle}`,
      description: `${caseData.caseType} - ${caseData.caseDifficulty}`,
      announcements,
    })
    index++
  }

  return scenarios
}

const allScenarios = buildTokenScenarios()

// 難易度でフィルタリングされたシナリオを取得するヘルパー
function getScenariosByDifficultyLevel(difficulty: string): TokenScenario[] {
  return Array.from(allScenarios.values()).filter(scenario => {
    const ann = allAnnouncements.find(a => a.caseId === scenario.id)
    return ann?.caseDifficulty === difficulty
  })
}

// 難易度別のトークンシナリオ
export const easyScenarios: TokenScenario[] = getScenariosByDifficultyLevel('easy')
export const mediumScenarios: TokenScenario[] = getScenariosByDifficultyLevel('medium')
export const hardScenarios: TokenScenario[] = getScenariosByDifficultyLevel('hard')

// 難易度に応じたシナリオを取得
export function getScenariosByDifficulty(difficulty: Difficulty): TokenScenario[] {
  switch (difficulty) {
    case 'easy':
      return easyScenarios
    case 'medium':
      return mediumScenarios
    case 'hard':
      return hardScenarios
    default:
      return mediumScenarios
  }
}

// 全難易度を混ぜたシナリオ（デフォルト）
// シナリオがない場合は全シナリオを使用
export const tokenScenarios: TokenScenario[] = (() => {
  const mixed = [
    ...easyScenarios.slice(0, 2),
    ...mediumScenarios.slice(0, 2),
    ...hardScenarios.slice(0, 1),
  ]
  // 混合シナリオが空の場合は全シナリオを使用
  if (mixed.length === 0) {
    return Array.from(allScenarios.values())
  }
  return mixed
})()

export const announcementTypeLabels: Record<AnnouncementType, string> = {
  SAFE: 'SAFE',
  BAIT: 'BAIT',
  LOW_RISK_REWARD: 'LOW RISK / LOW REWARD',
  MIDDLE_RISK_REWARD: 'MIDDLE RISK / MIDDLE REWARD',
  HIGH_RISK_REWARD: 'HIGH RISK / HIGH REWARD',
}

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
}
