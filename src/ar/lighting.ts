import {
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Texture,
  type Scene,
} from 'three'

export interface SceneLights {
  hemi: HemisphereLight
  key: DirectionalLight
  fill: DirectionalLight
  shadow: Mesh
}

export function createSceneLights(scene: Scene, parent: Group): SceneLights {
  const hemi = new HemisphereLight(0xd8e4ff, 0x2b2418, 0.95)
  scene.add(hemi)

  const key = new DirectionalLight(0xfff2d6, 1.35)
  key.position.set(4, 8, 2)
  scene.add(key)

  const fill = new DirectionalLight(0xb7c4d8, 0.45)
  fill.position.set(-5, 3, -3)
  scene.add(fill)

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 120)
    gradient.addColorStop(0, 'rgba(0,0,0,0.38)')
    gradient.addColorStop(0.45, 'rgba(0,0,0,0.16)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
  }
  const texture = new Texture(canvas)
  texture.needsUpdate = true
  const shadow = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  )
  shadow.name = 'contact-shadow'
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.01
  shadow.renderOrder = -1
  parent.add(shadow)

  return { hemi, key, fill, shadow }
}

export function applyEstimatedLighting(lights: SceneLights, exposure?: number): void {
  if (typeof exposure !== 'number' || Number.isNaN(exposure)) return
  const normalized = Math.min(1.6, Math.max(0.45, exposure))
  lights.hemi.intensity = 0.55 * normalized
  lights.key.intensity = 0.85 * normalized
  lights.fill.intensity = 0.22 * normalized
}

export function updateContactShadow(lights: SceneLights, width: number, visible: boolean): void {
  const size = Math.max(0.8, width * 0.45)
  lights.shadow.scale.set(size, size, 1)
  lights.shadow.visible = visible
}

export function disposeLights(scene: Scene, lights: SceneLights): void {
  scene.remove(lights.hemi, lights.key, lights.fill)
  lights.shadow.removeFromParent()
  lights.shadow.geometry.dispose()
  const material = lights.shadow.material
  if (material instanceof MeshBasicMaterial) {
    material.map?.dispose()
    material.dispose()
  }
}
