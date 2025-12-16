'use client'

import { Announcement } from '@/lib/engine'
import { announcementTypeLabels } from '@/data/tokens'

interface LearnPanelProps {
  announcement: Announcement
  tokenName: string
}

export default function LearnPanel({ announcement, tokenName }: LearnPanelProps) {
  const learnItems = announcement.learn?.length
    ? announcement.learn
    : ['このアナウンスは具体的な根拠がなく、過去にも同内容で流動性が消えた例がある。']

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📉</span>
        <div>
          <p className="text-xs font-mono text-gray-500 tracking-widest">{tokenName}</p>
          <h3 className="text-white font-bold">なぜ危険だったのか</h3>
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-flex text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1 bg-red-900/30 text-red-300 rounded-full">
          {announcementTypeLabels[announcement.type]}
        </span>
        <p className="text-gray-300 text-sm">{announcement.text}</p>
      </div>

      <div className="space-y-3">
        {learnItems.map((text, index) => (
          <p key={index} className="text-gray-400 text-sm leading-relaxed">
            {text}
          </p>
        ))}
      </div>

      <p className="text-xs text-gray-500 font-mono pt-2 border-t border-gray-800">
        現実でも同じ流れで資金が消える。利確という行動だけが、ゼロを避ける唯一の手段。
      </p>
    </div>
  )
}
