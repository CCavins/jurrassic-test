import { Clock } from 'three'
import type { DinosaurConfig } from '../config/dinosaurs'
import type { XR8Api, XR8Reality } from '../types/xr8'
import { captureStillFromXr, MAX_MS } from './captureManager'
import { DinosaurInteraction } from './dinosaurInteraction'
import { DinosaurManager } from './dinosaurManager'
import { placeInFrontOfCamera } from './dinosaurPlacement'
import type { ArEmitter, TrackingStatus } from './events'

export class XrWorldScene {
  readonly manager = new DinosaurManager()
  readonly interaction = new DinosaurInteraction()
  private clock = new Clock()
  private placed = false
  private tracking: TrackingStatus = 'INITIALIZING'
  private limitedSince: number | null = null
  private animation = ''
  private frames = 0
  private fpsAt = performance.now()
  private fps = 0
  private recording = false
  private pendingConfig: DinosaurConfig | null = null
  private canvas: HTMLCanvasElement | null = null
  private events: ArEmitter

  constructor(events: ArEmitter) {
    this.events = events
  }

  async prepare(config: DinosaurConfig): Promise<void> {
    this.pendingConfig = config
    if (this.placed && this.manager.model) {
      await this.loadDinosaur(config)
    }
  }

  onStart(XR8: XR8Api): void {
    const { scene, camera } = XR8.Threejs.xrScene()
    this.manager.attach(scene)
    camera.position.set(0, 1.6, 0)
    XR8.XrController.updateCameraProjectionMatrix({
      origin: camera.position,
      facing: camera.quaternion,
    })
    const renderer = XR8.Threejs.xrScene().renderer
    this.canvas = renderer.domElement
    this.bindCanvas(this.canvas)
    this.events.emit('coaching', { phase: 'space', message: 'Find some open space' })
    window.setTimeout(() => {
      if (!this.placed) {
        this.events.emit('coaching', { phase: 'scan', message: 'Move your phone slowly to find the ground' })
      }
    }, 1600)
    if (this.pendingConfig) void this.loadDinosaur(this.pendingConfig)
  }

  onUpdate(XR8: XR8Api, reality?: XR8Reality): void {
    const { camera } = XR8.Threejs.xrScene()
    const delta = this.clock.getDelta()
    this.animation = this.manager.update(delta)
    if (reality?.lighting?.exposure !== undefined) {
      this.manager.applyExposure(reality.lighting.exposure)
    }
    if (!this.placed && this.tracking === 'NORMAL' && this.manager.model) {
      placeInFrontOfCamera(this.manager.anchor, camera, this.manager.lengthMeters)
      this.placed = true
      this.events.emit('placed', { id: this.manager.config?.id ?? '' })
      this.events.emit('coaching', { phase: 'ready', message: 'Tap and drag the dinosaur to move it' })
    }
    this.tickFps()
    this.events.emit('debug', {
      fps: this.fps,
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
      dinosaurPosition: [this.manager.anchor.position.x, this.manager.anchor.position.y, this.manager.anchor.position.z],
      groundY: 0,
      animation: this.animation,
      initState: this.placed ? 'placed' : 'waiting-for-floor',
      tracking: this.tracking,
      absoluteScale: true,
      recording: this.recording,
      mode: 'xr',
    })
  }

  setTracking(status: string, reason?: string): void {
    const next: TrackingStatus =
      status === 'NORMAL' ? 'NORMAL' : reason === 'INITIALIZING' ? 'INITIALIZING' : 'LIMITED'
    this.tracking = next
    this.events.emit('tracking', { status: next, reason })
    if (next === 'LIMITED') {
      this.limitedSince ??= performance.now()
      if (performance.now() - this.limitedSince > 4000) {
        this.events.emit('coaching', {
          phase: 'lost',
          message: 'Move slowly and point toward a textured area of the ground.',
        })
      }
    } else {
      this.limitedSince = null
      if (this.placed) this.events.emit('coaching', { phase: 'ready', message: null })
    }
  }

  recenter(XR8: XR8Api): void {
    const { camera } = XR8.Threejs.xrScene()
    XR8.XrController.updateCameraProjectionMatrix({
      origin: { x: 0, y: camera.position.y, z: 0 },
      facing: camera.quaternion,
    })
    XR8.XrController.recenter()
    this.placed = false
    this.events.emit('coaching', { phase: 'scan', message: 'Move your phone slowly to find the ground' })
  }

  async takePhoto(): Promise<void> {
    const media = await captureStillFromXr()
    this.events.emit('capture', media)
  }

  startRecording(XR8: XR8Api): void {
    if (!XR8.MediaRecorder) throw new Error('Video recording is not available on this device.')
    XR8.MediaRecorder.configure({
      maxDurationMs: MAX_MS,
      enableEndCard: false,
      requestMic: XR8.MediaRecorder.RequestMicOptions.MANUAL,
      fileNamePrefix: 'jurassic-adventure-',
    })
    this.recording = true
    XR8.MediaRecorder.recordVideo({
      onStart: () => this.events.emit('recording', { active: true, elapsedMs: 0, maxMs: MAX_MS }),
      onProcessFrame: ({ elapsedTimeMs, maxRecordingMs }) => {
        this.events.emit('recording', { active: true, elapsedMs: elapsedTimeMs, maxMs: maxRecordingMs })
      },
      onStop: () => {
        this.recording = false
        this.events.emit('recording', { active: false, elapsedMs: 0, maxMs: MAX_MS })
      },
      onPreviewReady: (result) => this.emitVideo(result),
      onVideoReady: (result) => this.emitVideo(result),
      onError: () => {
        this.recording = false
        this.events.emit('error', {
          code: 'record',
          title: 'Recording unavailable',
          message: 'This browser could not finish the video. Try a still photo instead.',
        })
      },
    })
  }

  stopRecording(XR8: XR8Api): void {
    XR8.MediaRecorder?.stopRecording()
  }

  dispose(): void {
    this.unbindCanvas()
    this.manager.dispose()
  }

  private emitVideo(result: { videoBlob?: Blob; videoUrl?: string; blob?: Blob; url?: string }): void {
    const blob = result.videoBlob ?? result.blob
    if (!blob) return
    const url = result.videoUrl ?? result.url ?? URL.createObjectURL(blob)
    this.events.emit('capture', { kind: 'video', blob, url })
  }

  private async loadDinosaur(config: DinosaurConfig): Promise<void> {
    this.events.emit('loading', { message: `Summoning ${config.name}` })
    try {
      await this.manager.load(config)
      this.placed = false
      this.events.emit('loading', { message: null })
    } catch {
      this.events.emit('error', {
        code: 'model',
        title: 'Could not load this dinosaur',
        message: 'The model failed to download. Check your connection and try again.',
      })
    }
  }

  private bindCanvas(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onUp)
  }

  private unbindCanvas(): void {
    this.canvas?.removeEventListener('pointerdown', this.onDown)
    this.canvas?.removeEventListener('pointermove', this.onMove)
    this.canvas?.removeEventListener('pointerup', this.onUp)
    this.canvas?.removeEventListener('pointercancel', this.onUp)
  }

  private onDown = (event: PointerEvent) => {
    if (!this.canvas || !window.XR8) return
    const { camera } = window.XR8.Threejs.xrScene()
    const hit = this.interaction.pointerDown(event.clientX, event.clientY, this.canvas, camera, this.manager.model)
    if (hit) this.canvas.setPointerCapture(event.pointerId)
    this.events.emit('selected', { selected: this.interaction.selected })
    this.manager.showSelection(this.interaction.selected)
  }

  private onMove = (event: PointerEvent) => {
    if (!this.canvas || !window.XR8) return
    const { camera } = window.XR8.Threejs.xrScene()
    if (this.interaction.pointerMove(event.clientX, event.clientY, this.canvas, camera, this.manager.anchor)) {
      this.events.emit('coaching', { phase: 'ready', message: null })
    }
  }

  private onUp = () => {
    this.interaction.pointerUp()
  }

  private tickFps(): void {
    this.frames += 1
    const now = performance.now()
    if (now - this.fpsAt > 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsAt)
      this.frames = 0
      this.fpsAt = now
    }
  }
}
