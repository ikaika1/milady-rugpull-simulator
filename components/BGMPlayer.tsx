'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// BGMファイルのリスト
const BGM_FILES = [
  '/bgm/field3.mid',
  '/bgm/field5.mid',
  '/bgm/field6.mid',
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
  const toneRef = useRef<typeof import('tone') | null>(null)
  const midiRef = useRef<typeof import('@tonejs/midi') | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthsRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partsRef = useRef<any[]>([])
  const isPlayingRef = useRef(false)
  const [isStarted, setIsStarted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Tone.jsを動的にロード
  useEffect(() => {
    const loadTone = async () => {
      try {
        const [tone, midi] = await Promise.all([
          import('tone'),
          import('@tonejs/midi')
        ])
        toneRef.current = tone
        midiRef.current = midi
        setIsLoaded(true)
      } catch (error) {
        console.error('Tone.js読み込みエラー:', error)
      }
    }
    loadTone()
  }, [])

  // BGMを停止する関数
  const stopBGM = useCallback(() => {
    const Tone = toneRef.current
    if (!Tone) return

    partsRef.current.forEach(part => {
      part.stop()
      part.dispose()
    })
    partsRef.current = []

    synthsRef.current.forEach(synth => {
      synth.releaseAll()
      synth.dispose()
    })
    synthsRef.current = []

    if (Tone.getTransport().state === 'started') {
      Tone.getTransport().stop()
    }

    isPlayingRef.current = false
  }, [])

  // MIDIファイルを読み込んで再生
  const playMidi = useCallback(async (url: string) => {
    const Tone = toneRef.current
    const MidiModule = midiRef.current
    if (!Tone || !MidiModule) return

    try {
      // 既存の再生を停止
      stopBGM()

      // MIDIファイルを取得
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const midi = new MidiModule.Midi(arrayBuffer)

      // Tone.jsの初期化
      await Tone.start()

      // マスターボリュームの設定
      Tone.getDestination().volume.value = Tone.gainToDb(volume)

      const transport = Tone.getTransport()
      transport.bpm.value = midi.header.tempos[0]?.bpm || 120

      // 各トラックにシンセを作成
      midi.tracks.forEach((track) => {
        if (track.notes.length === 0) return

        const synth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.8,
          },
        }).toDestination()

        synth.volume.value = -6 // 音量を少し下げる
        synthsRef.current.push(synth)

        // ノートをPartに追加
        const notes = track.notes.map(note => ({
          time: note.time,
          note: note.name,
          duration: note.duration,
          velocity: note.velocity,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const part = new Tone.Part((time: number, event: any) => {
          synth.triggerAttackRelease(
            event.note,
            event.duration,
            time,
            event.velocity
          )
        }, notes)

        part.start(0)
        part.loop = true
        part.loopEnd = midi.duration
        partsRef.current.push(part)
      })

      transport.start()
      isPlayingRef.current = true
    } catch (error) {
      console.error('MIDI再生エラー:', error)
    }
  }, [volume, stopBGM])

  // BGMを開始する関数
  const startBGM = useCallback(async () => {
    if (isPlayingRef.current || !enabled || !isLoaded) return

    const bgm = getRandomBGM()
    await playMidi(bgm)
    setIsStarted(true)
  }, [enabled, isLoaded, playMidi])

  // ユーザー操作を待つ
  useEffect(() => {
    if (isStarted || !isLoaded) return

    const handleUserInteraction = async () => {
      if (!isPlayingRef.current && enabled) {
        await startBGM()
      }
    }

    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [enabled, isStarted, isLoaded, startBGM])

  // enabled変更時の処理
  useEffect(() => {
    if (!enabled) {
      stopBGM()
    } else if (isStarted && !isPlayingRef.current && isLoaded) {
      startBGM()
    }
  }, [enabled, isStarted, isLoaded, startBGM, stopBGM])

  // ボリューム変更時の更新
  useEffect(() => {
    const Tone = toneRef.current
    if (Tone) {
      Tone.getDestination().volume.value = Tone.gainToDb(volume)
    }
  }, [volume])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopBGM()
    }
  }, [stopBGM])

  return null
}
