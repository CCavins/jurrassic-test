import { canvasToJpegBlob, jpegBase64ToBlob } from '../utils/media'
import type { CaptureMedia } from './events'
import { loadXrEngine, takeXrScreenshot } from './xrEngine'

export const MAX_MS = 15000

export interface RecorderHandle {
  start: () => Promise<void>
  stop: () => Promise<CaptureMedia>
}

export async function captureStillFromXr(): Promise<CaptureMedia> {
  const XR8 = await loadXrEngine()
  const data = await takeXrScreenshot(XR8)
  const blob = jpegBase64ToBlob(data)
  return { kind: 'photo', blob, url: URL.createObjectURL(blob) }
}

export async function captureStillFromCanvas(canvas: HTMLCanvasElement): Promise<CaptureMedia> {
  const blob = await canvasToJpegBlob(canvas)
  return { kind: 'photo', blob, url: URL.createObjectURL(blob) }
}

export function createCanvasRecorder(
  canvas: HTMLCanvasElement,
  onTick: (elapsedMs: number) => void,
): RecorderHandle {
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let startedAt = 0
  let timer = 0
  let done: ((media: CaptureMedia) => void) | null = null
  let stream: MediaStream | null = null

  const handle: RecorderHandle = {
    async start() {
      stream = canvas.captureStream(30)
      const mime = pickRecorderMime()
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunks = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        stream?.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunks, { type: recorder?.mimeType || mime || 'video/webm' })
        done?.({ kind: 'video', blob, url: URL.createObjectURL(blob) })
      }
      recorder.start()
      startedAt = performance.now()
      timer = window.setInterval(() => {
        const elapsed = performance.now() - startedAt
        onTick(elapsed)
        if (elapsed >= MAX_MS) void handle.stop()
      }, 100)
    },
    stop() {
      window.clearInterval(timer)
      return new Promise((resolve, reject) => {
        if (!recorder || recorder.state === 'inactive') {
          reject(new Error('Nothing was recorded.'))
          return
        }
        done = resolve
        recorder.stop()
      })
    },
  }
  return handle
}

function pickRecorderMime(): string | undefined {
  const candidates = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}
