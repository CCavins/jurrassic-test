import { useEffect, useState } from 'react'
import type { SessionMode } from '../ar/xrFacade'
import type { CaptureMedia, TrackingStatus } from '../ar/events'
import type { DinosaurConfig } from '../config/dinosaurs'

async function facade() {
  const module = await import('../ar/xrFacade')
  return module.xrFacade
}

export function useARSession() {
  const [mode, setMode] = useState<SessionMode | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [coaching, setCoaching] = useState<string | null>(null)
  const [tracking, setTracking] = useState<TrackingStatus>('UNKNOWN')
  const [selected, setSelected] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [recording, setRecording] = useState({ active: false, elapsedMs: 0, maxMs: 15000 })
  const [capture, setCapture] = useState<CaptureMedia | null>(null)
  const [error, setError] = useState<{ code: string; title: string; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const unsubs: Array<() => void> = []
    void facade().then((xr) => {
      if (cancelled) return
      unsubs.push(
        xr.events.on('ready', ({ mode: next }) => setMode(next)),
        xr.events.on('loading', ({ message }) => setLoading(message)),
        xr.events.on('coaching', ({ message }) => setCoaching(message)),
        xr.events.on('tracking', ({ status }) => setTracking(status)),
        xr.events.on('selected', ({ selected: next }) => setSelected(next)),
        xr.events.on('placed', ({ placed: next }) => setPlaced(next)),
        xr.events.on('recording', setRecording),
        xr.events.on('capture', (media) => {
          setCapture(media)
          xr.pauseForPreview()
        }),
        xr.events.on('error', setError),
      )
    })
    return () => {
      cancelled = true
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  return {
    mode,
    loading,
    coaching,
    tracking,
    selected,
    placed,
    recording,
    capture,
    error,
    clearError: () => setError(null),
    reportError: (next: { code: string; title: string; message: string }) => setError(next),
    clearCapture: () => {
      if (capture?.url) URL.revokeObjectURL(capture.url)
      setCapture(null)
      void facade().then((xr) => xr.resumeFromPreview())
    },
    start: async (host: HTMLElement, config: DinosaurConfig) => (await facade()).start(host, config),
    changeDinosaur: async (config: DinosaurConfig) => (await facade()).changeDinosaur(config),
    takePhoto: async () => (await facade()).takePhoto(),
    startRecording: async () => (await facade()).startRecording(),
    stopRecording: async () => (await facade()).stopRecording(),
    recenter: async () => (await facade()).recenter(),
    placeAt: async (clientX: number, clientY: number) => (await facade()).placeAt(clientX, clientY),
    pointerDown: async (clientX: number, clientY: number) => (await facade()).pointerDown(clientX, clientY),
    pointerMove: async (clientX: number, clientY: number) => (await facade()).pointerMove(clientX, clientY),
    pointerUp: async () => (await facade()).pointerUp(),
    stop: async () => {
      setLoading(null)
      setCoaching(null)
      setTracking('UNKNOWN')
      setMode(null)
      setPlaced(false)
      await (await facade()).stop()
    },
  }
}
