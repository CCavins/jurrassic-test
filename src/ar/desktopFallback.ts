import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  GridHelper,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import type { DinosaurConfig } from '../config/dinosaurs'
import { DinosaurInteraction } from './dinosaurInteraction'
import { DinosaurManager } from './dinosaurManager'
import { screenToGround } from './dinosaurPlacement'
import type { ArEmitter } from './events'
import { captureStillFromCanvas, createCanvasRecorder, MAX_MS } from './captureManager'

export class DesktopPreview {
  readonly canvas: HTMLCanvasElement
  private host: HTMLElement
  private events: ArEmitter
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera: PerspectiveCamera
  private manager = new DinosaurManager()
  private interaction = new DinosaurInteraction()
  private clock = new Clock()
  private raf = 0
  private disposed = false
  private recorder: ReturnType<typeof createCanvasRecorder> | null = null
  private frames = 0
  private fpsAt = performance.now()
  private fps = 0
  private placed = false
  private paused = false

  constructor(
    host: HTMLElement,
    events: ArEmitter,
  ) {
    this.host = host
    this.events = events
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'xr-canvas'
    this.canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(this.canvas)

    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, preserveDrawingBuffer: true })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.35
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new PerspectiveCamera(60, 1, 0.1, 120)
    this.camera.position.set(0, 1.6, 8)
    this.scene.background = new Color(0x141814)
    const grid = new GridHelper(40, 40, 0x3d4a3a, 0x222822)
    grid.position.y = 0.001
    this.scene.add(grid)
    this.manager.attach(this.scene)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __preview?: DesktopPreview }).__preview = this
    }
    this.resize()
    this.bind()
    this.loop()
  }

  async load(config: DinosaurConfig): Promise<void> {
    this.events.emit('loading', { message: `Summoning ${config.name}` })
    await this.manager.load(config)
    this.placed = false
    this.camera.position.set(0, 4.2, 14)
    this.camera.lookAt(0, 0, 0)
    this.events.emit('loading', { message: null })
    this.events.emit('placed', { id: '', placed: false })
    this.events.emit('coaching', { phase: 'place', message: 'Tap the ground to place the dinosaur' })
  }

  placeAt(clientX: number, clientY: number): boolean {
    if (!this.manager.model) return false
    const hit = screenToGround(clientX, clientY, this.canvas.getBoundingClientRect(), this.camera, 0)
    if (!hit) {
      this.events.emit('coaching', { phase: 'place', message: 'Tap the ground to place the dinosaur' })
      return false
    }
    this.manager.revealAt(hit.x, hit.z, 0)
    this.manager.faceToward(this.camera.position.x, this.camera.position.z)
    this.placed = true
    this.events.emit('placed', { id: this.manager.config?.id ?? '', placed: true })
    this.events.emit('coaching', { phase: 'ready', message: 'Tap the ground to move, or drag to slide' })
    return true
  }

  async takePhoto(): Promise<void> {
    const media = await captureStillFromCanvas(this.canvas)
    this.events.emit('capture', media)
  }

  async startRecording(): Promise<void> {
    this.recorder = createCanvasRecorder(this.canvas, (elapsedMs) => {
      this.events.emit('recording', { active: true, elapsedMs, maxMs: MAX_MS })
    })
    await this.recorder.start()
    this.events.emit('recording', { active: true, elapsedMs: 0, maxMs: MAX_MS })
  }

  async stopRecording(): Promise<void> {
    if (!this.recorder) return
    const media = await this.recorder.stop()
    this.recorder = null
    this.events.emit('recording', { active: false, elapsedMs: 0, maxMs: MAX_MS })
    this.events.emit('capture', media)
  }

  setPaused(paused: boolean): void {
    this.paused = paused
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.manager.dispose()
    this.renderer.dispose()
    this.canvas.remove()
    window.removeEventListener('resize', this.resize)
  }

  private bind(): void {
    window.addEventListener('resize', this.resize)
    this.canvas.addEventListener('pointerdown', this.onDown)
    this.canvas.addEventListener('pointermove', this.onMove)
    this.canvas.addEventListener('pointerup', this.onUp)
    this.canvas.addEventListener('pointercancel', this.onUp)
  }

  handlePointerDown(clientX: number, clientY: number): boolean {
    if (!this.placed) {
      const placed = this.placeAt(clientX, clientY)
      if (placed) this.interaction.beginDrag()
      return placed
    }
    const hit = this.interaction.pointerDown(
      clientX,
      clientY,
      this.canvas,
      this.camera,
      this.manager.model,
      this.manager.anchor,
    )
    this.events.emit('selected', { selected: this.interaction.selected })
    this.manager.showSelection(this.interaction.selected)
    if (hit) this.events.emit('coaching', { phase: 'ready', message: null })
    return hit
  }

  handlePointerMove(clientX: number, clientY: number): boolean {
    if (this.interaction.pointerMove(clientX, clientY, this.canvas, this.camera, this.manager.anchor)) {
      this.events.emit('coaching', { phase: 'ready', message: null })
      return true
    }
    return false
  }

  handlePointerUp(): void {
    this.interaction.pointerUp()
  }

  private onDown = (event: PointerEvent) => {
    if (this.handlePointerDown(event.clientX, event.clientY)) {
      this.canvas.setPointerCapture(event.pointerId)
    }
  }

  private onMove = (event: PointerEvent) => {
    this.handlePointerMove(event.clientX, event.clientY)
  }

  private onUp = () => {
    this.handlePointerUp()
  }

  private resize = () => {
    const width = this.host.clientWidth || window.innerWidth
    const height = this.host.clientHeight || window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    if (this.paused) return
    const delta = this.clock.getDelta()
    const animation = this.manager.update(delta)
    this.renderer.render(this.scene, this.camera)
    this.frames += 1
    const now = performance.now()
    if (now - this.fpsAt > 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsAt)
      this.frames = 0
      this.fpsAt = now
    }
    this.events.emit('debug', {
      fps: this.fps,
      cameraPosition: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      dinosaurPosition: [this.manager.anchor.position.x, this.manager.anchor.position.y, this.manager.anchor.position.z],
      groundY: 0,
      animation,
      initState: 'desktop-preview',
      tracking: 'UNKNOWN',
      absoluteScale: false,
      recording: Boolean(this.recorder),
      mode: 'desktop',
    })
  }
}
