export type TrackingStatus = 'INITIALIZING' | 'LIMITED' | 'NORMAL' | 'UNKNOWN'

export interface ArDebugState {
  fps: number
  cameraPosition: [number, number, number]
  dinosaurPosition: [number, number, number]
  groundY: number
  animation: string
  initState: string
  tracking: TrackingStatus
  absoluteScale: boolean
  recording: boolean
  mode: 'xr' | 'desktop'
}

export interface CaptureMedia {
  kind: 'photo' | 'video'
  blob: Blob
  url: string
}

export type ArEventMap = {
  tracking: { status: TrackingStatus; reason?: string }
  coaching: { message: string | null; phase: 'space' | 'scan' | 'place' | 'ready' | 'lost' }
  placed: { id: string; placed: boolean }
  selected: { selected: boolean }
  loading: { message: string | null }
  error: { code: string; title: string; message: string }
  capture: CaptureMedia
  recording: { active: boolean; elapsedMs: number; maxMs: number }
  debug: ArDebugState
  ready: { mode: 'xr' | 'desktop' }
}

type Handler<T> = (payload: T) => void

export class ArEmitter {
  private listeners = new Map<string, Set<Handler<unknown>>>()

  on<K extends keyof ArEventMap>(event: K, handler: Handler<ArEventMap[K]>): () => void {
    const set = this.listeners.get(event) ?? new Set()
    set.add(handler as Handler<unknown>)
    this.listeners.set(event, set)
    return () => set.delete(handler as Handler<unknown>)
  }

  emit<K extends keyof ArEventMap>(event: K, payload: ArEventMap[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const handler of set) handler(payload)
  }
}
