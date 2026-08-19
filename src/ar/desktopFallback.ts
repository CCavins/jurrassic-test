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
import { placeInFrontOfCamera } from './dinosaurPlacement'
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
    this.renderer.toneMappingExposure = 1.05
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new PerspectiveCamera(60, 1, 0.1, 120)
    this.camera.position.set(0, 1.6, 8)
    this.scene.background = new Color(0x141814)
    const grid = new GridHelper(40, 40, 0x3d4a3a, 0x222822)
    grid.position.y = 0.001
    this.scene.add(grid)
    this.manager.attach(this.scene)
    this.resize()
    this.bind()
    this.loop()
  }

  async load(config: DinosaurConfig): Promise<void> {
    this.events.emit('loading', { message: `Summoning ${config.name}` })
    await this.manager.load(config)
    placeInFrontOfCamera(this.manager.anchor, this.camera, this.manager.lengthMeters)
    this.camera.position.set(0, Math.max(1.6, this.manager.lengthMeters * 0.18), Math.max(6, this.manager.lengthMeters * 0.85))
    this.camera.lookAt(this.manager.anchor.position.x, this.manager.lengthMeters * 0.12, this.manager.anchor.position.z)
    this.events.emit('loading', { message: null })
    this.events.emit('placed', { id: config.id })
    this.events.emit('coaching', { phase: 'ready', message: 'Tap and drag the dinosaur to move it' })
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

  private onDown = (event: PointerEvent) => {
    const hit = this.interaction.pointerDown(event.clientX, event.clientY, this.canvas, this.camera, this.manager.model)
    if (hit) this.canvas.setPointerCapture(event.pointerId)
    this.events.emit('selected', { selected: this.interaction.selected })
    this.manager.showSelection(this.interaction.selected)
  }

  private onMove = (event: PointerEvent) => {
    if (this.interaction.pointerMove(event.clientX, event.clientY, this.canvas, this.camera, this.manager.anchor)) {
      this.events.emit('coaching', { phase: 'ready', message: null })
    }
  }

  private onUp = () => {
    this.interaction.pointerUp()
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
