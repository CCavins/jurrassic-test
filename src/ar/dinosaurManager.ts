import { Group, Mesh, type Material, type Object3D, type Scene } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { DinosaurConfig } from '../config/dinosaurs'
import { DinosaurAnimator } from './dinosaurAnimation'
import { normalizeDinosaur } from './dinosaurPlacement'
import { applyEstimatedLighting, createSceneLights, disposeLights, updateContactShadow, type SceneLights } from './lighting'

const loader = new GLTFLoader()

export class DinosaurManager {
  readonly anchor = new Group()
  model: Object3D | null = null
  config: DinosaurConfig | null = null
  lengthMeters = 1
  widthMeters = 1
  readonly animator = new DinosaurAnimator()
  private lights: SceneLights | null = null
  private scene: Scene | null = null

  attach(scene: Scene): void {
    this.scene = scene
    this.anchor.name = 'dinosaur-anchor'
    scene.add(this.anchor)
    this.lights = createSceneLights(scene, this.anchor)
    this.anchor.visible = false
  }

  async load(config: DinosaurConfig): Promise<void> {
    this.disposeModel()
    const gltf = await loader.loadAsync(config.modelUrl)
    this.model = gltf.scene
    this.model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = false
        child.receiveShadow = false
        child.frustumCulled = false
      }
    })
    const metrics = normalizeDinosaur(this.model, config)
    this.lengthMeters = Math.max(metrics.length, config.targetLengthMeters)
    this.widthMeters = metrics.width
    this.config = config
    this.anchor.add(this.model)
    this.animator.attach(this.model, gltf.animations, config)
    if (this.lights) updateContactShadow(this.lights, this.widthMeters, true)
    this.anchor.visible = false
    this.anchor.position.y = 0
  }

  revealAt(x: number, z: number, groundY = 0): void {
    this.anchor.position.set(x, groundY, z)
    this.anchor.visible = true
  }

  hideForPlacement(): void {
    this.anchor.visible = false
    this.anchor.position.y = 0
  }

  update(delta: number): string {
    if (!this.model) return ''
    return this.animator.update(delta, this.model)
  }

  applyExposure(exposure?: number): void {
    if (this.lights) applyEstimatedLighting(this.lights, exposure)
  }

  showSelection(selected: boolean): void {
    if (this.lights) updateContactShadow(this.lights, selected ? this.widthMeters * 1.15 : this.widthMeters, true)
  }

  disposeModel(): void {
    if (!this.model) return
    this.animator.dispose()
    this.model.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose()
        disposeMaterial(child.material)
      }
    })
    this.model.removeFromParent()
    this.model = null
    this.config = null
  }

  dispose(): void {
    this.disposeModel()
    if (this.scene && this.lights) disposeLights(this.scene, this.lights)
    this.anchor.removeFromParent()
    this.scene = null
    this.lights = null
  }
}

function disposeMaterial(material: Material | Material[]): void {
  const list = Array.isArray(material) ? material : [material]
  for (const item of list) {
    const record = item as Material & { map?: { dispose: () => void } }
    record.map?.dispose()
    item.dispose()
  }
}

