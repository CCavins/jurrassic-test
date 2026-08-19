import type { DinosaurConfig } from '../config/dinosaurs'
import { canAttemptWorldTracking } from '../utils/device'
import { captureStillFromCanvas, createCanvasRecorder, MAX_MS } from './captureManager'
import { DesktopPreview } from './desktopFallback'
import { ArEmitter } from './events'
import { createScenePipeline, loadXrEngine, screenshotModule } from './xrEngine'
import { XrWorldScene } from './xrScene'

export type SessionMode = 'xr' | 'desktop'

class XrFacade {
  readonly events = new ArEmitter()
  mode: SessionMode | null = null
  private canvas: HTMLCanvasElement | null = null
  private world: XrWorldScene | null = null
  private desktop: DesktopPreview | null = null
  private running = false
  private canvasRecorder: ReturnType<typeof createCanvasRecorder> | null = null
  private xrModulesReady = false
  private starting = false

  async start(host: HTMLElement, config: DinosaurConfig): Promise<SessionMode> {
    if (this.starting) return this.mode ?? 'desktop'
    this.starting = true
    try {
      if (this.running && this.mode === 'xr' && this.world) {
        await this.world.prepare(config)
        return 'xr'
      }
      if (this.running && this.mode === 'desktop' && this.desktop) {
        await this.desktop.load(config)
        return 'desktop'
      }

      const useXr = canAttemptWorldTracking()
      if (useXr) {
        await this.startXr(host, config)
        this.mode = 'xr'
      } else {
        this.desktop = new DesktopPreview(host, this.events)
        this.canvas = this.desktop.canvas
        await this.desktop.load(config)
        this.mode = 'desktop'
        this.events.emit('ready', { mode: 'desktop' })
      }
      this.running = true
      return this.mode
    } finally {
      this.starting = false
    }
  }

  async changeDinosaur(config: DinosaurConfig): Promise<void> {
    if (this.mode === 'xr' && this.world) await this.world.prepare(config)
    if (this.mode === 'desktop' && this.desktop) await this.desktop.load(config)
  }

  async takePhoto(): Promise<void> {
    if (this.mode === 'xr' && this.world) {
      await this.world.takePhoto()
      return
    }
    if (this.canvas) {
      const media = await captureStillFromCanvas(this.canvas)
      this.events.emit('capture', media)
    }
  }

  async startRecording(): Promise<void> {
    if (this.mode === 'xr' && this.world && window.XR8?.MediaRecorder) {
      this.world.startRecording(window.XR8)
      return
    }
    if (this.canvas) {
      this.canvasRecorder = createCanvasRecorder(this.canvas, (elapsedMs) => {
        this.events.emit('recording', { active: true, elapsedMs, maxMs: MAX_MS })
      })
      await this.canvasRecorder.start()
    }
  }

  async stopRecording(): Promise<void> {
    if (this.mode === 'xr' && this.world && window.XR8) {
      this.world.stopRecording(window.XR8)
      return
    }
    if (this.canvasRecorder) {
      const media = await this.canvasRecorder.stop()
      this.canvasRecorder = null
      this.events.emit('recording', { active: false, elapsedMs: 0, maxMs: MAX_MS })
      this.events.emit('capture', media)
    }
  }

  recenter(): void {
    if (this.mode === 'xr' && this.world && window.XR8) this.world.recenter(window.XR8)
  }

  stop(): void {
    if (this.mode === 'xr' && window.XR8) {
      try {
        window.XR8.stop()
      } catch {
        // XR8.stop can throw if the camera never fully started.
      }
      this.world?.dispose()
    }
    this.desktop?.dispose()
    this.canvas?.remove()
    this.world = null
    this.desktop = null
    this.canvas = null
    this.running = false
    this.mode = null
  }

  private async startXr(host: HTMLElement, config: DinosaurConfig): Promise<void> {
    this.events.emit('loading', { message: 'Preparing the expedition' })
    const XR8 = await loadXrEngine()
    XR8.XrController.configure({
      scale: 'absolute',
      enableLighting: true,
      disableWorldTracking: false,
    })
    XR8.MediaRecorder?.configure({
      maxDurationMs: MAX_MS,
      enableEndCard: false,
      requestMic: XR8.MediaRecorder.RequestMicOptions.MANUAL,
    })

    this.world = new XrWorldScene(this.events)
    await this.world.prepare(config)

    const canvas = document.createElement('canvas')
    canvas.id = 'camerafeed'
    canvas.className = 'xr-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)
    this.canvas = canvas

    const modules = [
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      screenshotModule(XR8),
      XR8.MediaRecorder?.pipelineModule(),
      createScenePipeline({
        onStart: (engine) => {
          this.world?.onStart(engine)
          this.events.emit('ready', { mode: 'xr' })
          this.events.emit('loading', { message: null })
        },
        onUpdate: (engine, reality) => this.world?.onUpdate(engine, reality),
        onCameraStatus: (status) => {
          if (status === 'failed') {
            this.events.emit('error', {
              code: 'camera',
              title: 'Camera access required',
              message: 'Jurassic Adventure needs access to your camera to place dinosaurs in your world.',
            })
          }
        },
        onTracking: (status, reason) => this.world?.setTracking(status, reason),
      }),
    ].filter((module): module is NonNullable<typeof module> => Boolean(module))

    if (!this.xrModulesReady) {
      XR8.addCameraPipelineModules(modules)
      this.xrModulesReady = true
    }
    XR8.run({
      canvas,
      cameraConfig: { direction: XR8.XrConfig.camera().BACK },
      allowedDevices: XR8.XrConfig.device().MOBILE,
    })
  }
}

export const xrFacade = new XrFacade()
