import type { XR8Api, XR8PipelineModule } from '../types/xr8'
import { publicUrl } from '../utils/paths'

let loadPromise: Promise<XR8Api> | null = null

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing && window.XR8) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'
    script.dataset.preloadChunks = 'slam'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('The XR engine failed to load.'))
    document.head.appendChild(script)
  })
}

function waitForXr8(): Promise<XR8Api> {
  if (window.XR8) return Promise.resolve(window.XR8)
  return new Promise((resolve) => {
    const onLoaded = () => {
      if (window.XR8) resolve(window.XR8)
    }
    window.addEventListener('xrloaded', onLoaded, { once: true })
    const timer = window.setInterval(() => {
      if (window.XR8) {
        window.clearInterval(timer)
        resolve(window.XR8)
      }
    }, 50)
  })
}

export async function loadXrEngine(): Promise<XR8Api> {
  if (!loadPromise) {
    loadPromise = (async () => {
      await injectScript(publicUrl('external/xr/xr.js'))
      const XR8 = await waitForXr8()
      if (typeof XR8.loadChunk === 'function') {
        await XR8.loadChunk('slam')
      }
      return XR8
    })()
  }
  return loadPromise
}

export function createScenePipeline(handlers: {
  onStart: (xr: XR8Api) => void
  onUpdate: (xr: XR8Api, reality?: import('../types/xr8').XR8Reality) => void
  onCameraStatus: (status: string) => void
  onTracking: (status: string, reason?: string) => void
}): XR8PipelineModule {
  return {
    name: 'jurassic-scene',
    onStart: () => {
      if (!window.XR8) return
      handlers.onStart(window.XR8)
    },
    onUpdate: ({ processCpuResult }) => {
      if (!window.XR8) return
      handlers.onUpdate(window.XR8, processCpuResult?.reality)
    },
    onCameraStatusChange: ({ status }) => handlers.onCameraStatus(status),
    listeners: [
      {
        event: 'reality.trackingstatus',
        process: ({ detail }) => {
          const data = detail as { status?: string; reason?: string }
          handlers.onTracking(data.status ?? 'LIMITED', data.reason)
        },
      },
    ],
  }
}

export function screenshotModule(XR8: XR8Api): XR8PipelineModule | null {
  if (XR8.CanvasScreenshot) return XR8.CanvasScreenshot.pipelineModule()
  if (XR8.canvasScreenshot) return XR8.canvasScreenshot().cameraPipelineModule()
  return null
}

export async function takeXrScreenshot(XR8: XR8Api): Promise<string> {
  if (XR8.CanvasScreenshot) return XR8.CanvasScreenshot.takeScreenshot()
  if (XR8.canvasScreenshot) return XR8.canvasScreenshot().takeScreenshot()
  throw new Error('Still capture is not available on this device.')
}
