'use client'

import { useRouter } from 'next/navigation'

export default function StartPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6"
      style={{
        backgroundImage: 'url(/images/bag_zero.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-3xl border border-gray-800 rounded-3xl p-8 bg-gray-950/70 backdrop-blur">
        <div className="text-center mb-10 space-y-3">

          <h1 className="text-5xl md:text-6xl font-black tracking-tight">MILADY RUGPULL SIMULATOR</h1>
          <p className="text-sm text-gray-400 font-mono">
            A Deterministic Announcement-Driven Trading Simulator
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              流れるのは「信じたくなるアナウンス」だけ。SAFE でも BAIT でも、表には確率もメーターも出ない。
              判断材料はテキストのトーンのみ。HODL で夢を見るか、SELL で次のトークンに逃げるか。
            </p>
            <p className="text-red-400 text-sm font-semibold">
              欲を選べばゼロ。利確した者だけが進む。
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-xs text-gray-500 uppercase tracking-[0.4em] mb-3">
              基本ループ
            </h2>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Token 開始 {'->'} アナウンスが順番に流れる</li>
              <li>• すべてのテキストで HODL or SELL の二択</li>
              <li>• HODL 成功でチャート上昇。失敗は即 RUGGED</li>
              <li>• SELL は利確して次の Token へ進行</li>
              <li>• Token が進むほど SAFE は減り、誘惑だけが増える</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-[0.3em]">
            情報ではなく、降りるタイミングを選べ。
          </div>
          <button
            onClick={() => router.push('/play')}
            className="px-10 py-4 bg-white text-black font-black text-lg rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
          >
            Enter the broadcast
          </button>
        </div>

        <p className="text-[10px] text-gray-600 text-center mt-6">
          教育・娯楽目的のミニアプリ。実資金・換金性・投資助言なし。
        </p>
      </div>
    </div>
  )
}
