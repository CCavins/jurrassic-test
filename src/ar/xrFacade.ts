import type { DinosaurConfig } from '../config/dinosaurs'
import { canAttemptWorldTracking } from '../utils/device'
import { captureStillFromCanvas, createCanvasRecorder, MAX_MS } from './captureManager'
import { DesktopPreview } from './desktopFallback'
import { ArEmitter } from './events'
import { createFullWindowCanvasModule } from './fullWindowCanvas'
import { exposeThreeGlobal, createScenePipeline, loadXrEngine, screenshotModule } from './xrEngine'
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
  private generation = 0

  async start(host: HTMLElement, config: DinosaurConfig): Promise<SessionMode | null> {
    if (this.starting) return this.mode
    this.starting = true
    const generation = ++this.generation
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
        try {
          const started = await this.startXr(host, config, generation)
          if (!started || generation !== this.generation) return null
          this.mode = 'xr'
        } catch (error) {
          this.events.emit('loading', { message: null })
          this.canvas?.remove()
          this.world?.dispose()
          this.world = null
          this.canvas = null
          throw error
        }
      } else {
        this.desktop = new DesktopPreview(host, this.events)
        this.canvas = this.desktop.canvas
        await this.desktop.load(config)
        if (generation !== this.generation) return null
        this.mode = 'desktop'
        this.events.emit('ready', { mode: 'desktop' })
      }
      this.running = true
      return this.mode
    } finally {
      if (generation === this.generation) this.starting = false
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

  placeAt(clientX: number, clientY: number): boolean {
    return this.pointerDown(clientX, clientY)
  }

  pointerDown(clientX: number, clientY: number): boolean {
    if (this.mode === 'xr' && this.world) return this.world.handlePointerDown(clientX, clientY)
    if (this.mode === 'desktop' && this.desktop) return this.desktop.handlePointerDown(clientX, clientY)
    return false
  }

  pointerMove(clientX: number, clientY: number): boolean {
    if (this.mode === 'xr' && this.world) return this.world.handlePointerMove(clientX, clientY)
    if (this.mode === 'desktop' && this.desktop) return this.desktop.handlePointerMove(clientX, clientY)
    return false
  }

  pointerUp(): void {
    if (this.mode === 'xr' && this.world) this.world.handlePointerUp()
    if (this.mode === 'desktop' && this.desktop) this.desktop.handlePointerUp()
  }

  pauseForPreview(): void {
    this.desktop?.setPaused(true)
  }

  resumeFromPreview(): void {
    this.desktop?.setPaused(false)
  }

  stop(): void {
    this.generation += 1
    this.starting = false
    this.events.emit('loading', { message: null })
    this.events.emit('coaching', { message: null, phase: 'ready' })
    this.events.emit('placed', { id: '', placed: false })
    if (window.XR8) {
      try {
        window.XR8.stop()
      } catch {
        // XR8.stop can throw if the camera never fully started.
      }
      try {
        window.XR8.clearCameraPipelineModules?.()
      } catch {
        // Older engine builds may not expose this.
      }
    }
    this.xrModulesReady = false
    this.world?.dispose()
    this.desktop?.dispose()
    this.canvas?.remove()
    this.world = null
    this.desktop = null
    this.canvas = null
    this.running = false
    this.mode = null
    document.documentElement.classList.remove('is-ar')
  }

  private async startXr(host: HTMLElement, config: DinosaurConfig, generation: number): Promise<boolean> {
    this.events.emit('loading', { message: 'Preparing the expedition' })
    exposeThreeGlobal()
    const XR8 = await loadXrEngine()
    if (generation !== this.generation) return false
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

    // Keep a local reference: a quick back-and-reselect can replace
    // this.world while prepare() is awaiting, and the stale continuation
    // must not push its old dinosaur into the new session's world.
    const world = new XrWorldScene(this.events)
    this.world = world
    await world.prepare(config)
    if (generation !== this.generation) return false

    host.hidden = false
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
      createFullWindowCanvasModule(),
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
            this.events.emit('loading', { message: null })
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

    if (generation !== this.generation) return false
    if (!this.xrModulesReady) {
      XR8.addCameraPipelineModules(modules)
      this.xrModulesReady = true
    }
    XR8.run({
      canvas,
      cameraConfig: { direction: XR8.XrConfig.camera().BACK },
      allowedDevices: XR8.XrConfig.device().MOBILE,
    })
    return true
  }
}

export const xrFacade = new XrFacade()
