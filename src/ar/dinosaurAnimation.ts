import { AnimationMixer, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three'
import type { DinosaurConfig } from '../config/dinosaurs'
import { snapFeetToGround } from './dinosaurPlacement'

const LOCOMOTION = /walk|run|jump|death/i

export class DinosaurAnimator {
  private mixer: AnimationMixer | null = null
  private actions = new Map<string, AnimationAction>()
  private current = ''
  private idle = ''
  private ambient: string[] = []
  private nextAmbientAt = 0
  private returning = false
  private groundOffset = 0
  private lockedFootY: number | null = null
  private lockedX = 0
  private lockedZ = 0
  private groundSamples = 0

  attach(root: Object3D, clips: AnimationClip[], config: DinosaurConfig): void {
    this.dispose()
    this.groundOffset = config.groundOffset ?? 0
    this.lockedFootY = null
    this.groundSamples = 0
    this.mixer = new AnimationMixer(root)
    this.idle = config.defaultAnimation
    this.ambient = config.ambientAnimations.filter((name) => !LOCOMOTION.test(name))
    this.actions.clear()

    for (const clip of clips) {
      const action = this.mixer.clipAction(clip)
      action.clampWhenFinished = true
      this.actions.set(clip.name, action)
    }

    const idleAction = this.actions.get(this.idle) ?? this.actions.values().next().value
    if (idleAction) {
      idleAction.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.25).play()
      this.current = idleAction.getClip().name
      this.mixer.update(1 / 30)
      snapFeetToGround(root, this.groundOffset)
      this.captureGroundPose(root)
    }
    this.scheduleAmbient()
  }

  captureGroundPose(root: Object3D): void {
    this.lockedX = root.position.x
    this.lockedZ = root.position.z
    this.lockedFootY = root.position.y
    this.groundSamples = 12
  }

  update(delta: number, root: Object3D): string {
    this.mixer?.update(delta)
    if (this.lockedFootY === null || this.groundSamples < 12) {
      snapFeetToGround(root, this.groundOffset)
      this.lockedFootY = root.position.y
      this.lockedX = root.position.x
      this.lockedZ = root.position.z
      this.groundSamples += 1
    } else {
      root.position.set(this.lockedX, this.lockedFootY, this.lockedZ)
    }

    const now = performance.now()
    if (!this.returning && this.ambient.length > 0 && now >= this.nextAmbientAt && this.current === this.idle) {
      const next = this.ambient[Math.floor(Math.random() * this.ambient.length)]
      this.crossfade(next, 0.45)
      this.returning = true
      window.setTimeout(() => {
        this.crossfade(this.idle, 0.6)
        this.returning = false
        this.scheduleAmbient()
      }, 2800)
    }
    return this.current
  }

  currentName(): string {
    return this.current
  }

  dispose(): void {
    this.mixer?.stopAllAction()
    this.mixer = null
    this.actions.clear()
    this.current = ''
    this.lockedFootY = null
    this.groundSamples = 0
  }

  private crossfade(name: string, duration: number): void {
    const next = this.actions.get(name)
    const prev = this.actions.get(this.current)
    if (!next || name === this.current) return
    next.reset().setLoop(LoopRepeat, name === this.idle ? Infinity : 1).play()
    if (prev) prev.crossFadeTo(next, duration, false)
    else next.fadeIn(duration)
    this.current = name
  }

  private scheduleAmbient(): void {
    this.nextAmbientAt = performance.now() + (8000 + Math.random() * 12000)
  }
}
