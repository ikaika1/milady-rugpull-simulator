'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// BGMファイルのリスト（WAV形式）
const BGM_FILES = [
  '/bgm/field3.wav',
  '/bgm/field5.wav',
  '/bgm/field6.wav',
  '/bgm/mount.wav',
  '/bgm/sanct.wav',
  '/bgm/ancstemple.wav',
]

// ランダムにBGMを選択
function getRandomBGM(): string {
  const index = Math.floor(Math.random() * BGM_FILES.length)
  return BGM_FILES[index]
}

interface BGMPlayerProps {
  volume?: number
  enabled?: boolean
}

export default function BGMPlayer({ volume = 0.3, enabled = true }: BGMPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isStarted, setIsStarted] = useState(false)

  // BGMを再生
  const playBGM = useCallback(() => {
    if (!enabled || !audioRef.current) return

    const bgm = getRandomBGM()
    audioRef.current.src = bgm
    audioRef.current.volume = volume
    audioRef.current.loop = true
    audioRef.current.play().catch(() => {
      // 自動再生がブロックされた場合は無視
    })
  }, [enabled, volume])

  // 初期化
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    audioRef.current.preload = 'auto'

    // 事前にランダムBGMをプリロード
    const bgm = getRandomBGM()
    audioRef.current.src = bgm

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // ユーザー操作を待つ
  useEffect(() => {
    if (isStarted) return

    const handleUserInteraction = () => {
      if (enabled && audioRef.current) {
        audioRef.current.volume = volume
        audioRef.current.play().catch(() => {})
        setIsStarted(true)
      }
    }

    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [enabled, isStarted, volume])

  // enabled変更時の処理
  useEffect(() => {
    if (!audioRef.current) return

    if (!enabled) {
      audioRef.current.pause()
    } else if (isStarted) {
      audioRef.current.play().catch(() => {})
    }
  }, [enabled, isStarted])

  // ボリューム変更
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return null
}
