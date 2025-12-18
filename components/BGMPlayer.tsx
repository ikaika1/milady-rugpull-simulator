'use client'

import { useEffect, useRef, useState } from 'react'

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

// モジュールスコープでAudioオブジェクトを保持（再マウントされても同じインスタンスを使用）
let globalAudio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio()
    globalAudio.loop = true
    globalAudio.preload = 'auto'
  }
  return globalAudio
}

interface BGMPlayerProps {
  volume?: number
  enabled?: boolean
  reloadTrigger?: number  // この値が変わると新しいBGMをロード
  isStarted?: boolean     // 親コンポーネントから管理される開始状態
  onStarted?: () => void  // 再生開始時のコールバック
}

export default function BGMPlayer({
  volume = 0.3,
  enabled = true,
  reloadTrigger = 0,
  isStarted: externalIsStarted,
  onStarted,
}: BGMPlayerProps) {
  const [internalIsStarted, setInternalIsStarted] = useState(false)
  const prevReloadTriggerRef = useRef(reloadTrigger)

  // 外部から管理されている場合はそれを使用、そうでなければ内部状態を使用
  const isStarted = externalIsStarted !== undefined ? externalIsStarted : internalIsStarted
  const setIsStarted = (value: boolean) => {
    setInternalIsStarted(value)
    if (value && onStarted) {
      onStarted()
    }
  }

  // 初期化（初回のみBGMをプリロード）
  useEffect(() => {
    const audio = getAudio()

    // まだsrcが設定されていない場合のみプリロード
    if (!audio.src || audio.src === window.location.href) {
      const bgm = getRandomBGM()
      audio.src = bgm
    }

    // 既にisStartedがtrueの場合は再生を開始
    if (isStarted && enabled) {
      audio.volume = volume
      audio.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ユーザー操作を待つ
  useEffect(() => {
    if (isStarted) return

    const handleUserInteraction = () => {
      const audio = getAudio()
      if (enabled) {
        audio.volume = volume
        audio.play().catch(() => {})
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
    const audio = getAudio()

    if (!enabled) {
      audio.pause()
    } else if (isStarted) {
      audio.play().catch(() => {})
    }
  }, [enabled, isStarted])

  // ボリューム変更
  useEffect(() => {
    const audio = getAudio()
    audio.volume = volume
  }, [volume])

  // reloadTriggerが変わったら新しいBGMをロード
  useEffect(() => {
    // 値が実際に変わった場合のみ実行
    if (reloadTrigger !== prevReloadTriggerRef.current) {
      prevReloadTriggerRef.current = reloadTrigger
      if (reloadTrigger > 0 && isStarted && enabled) {
        const audio = getAudio()
        const bgm = getRandomBGM()
        audio.src = bgm
        audio.loop = true
        audio.volume = volume
        audio.play().catch(() => {})
      }
    }
  }, [reloadTrigger, isStarted, enabled, volume])

  return null
}
