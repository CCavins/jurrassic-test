import { Box3, Group, Mesh, Plane, Raycaster, SkinnedMesh, Vector2, Vector3, type Camera, type Object3D } from 'three'
import type { DinosaurConfig } from '../config/dinosaurs'

const box = new Box3()
const meshBox = new Box3()
const size = new Vector3()
const ndc = new Vector2()
const raycaster = new Raycaster()
const groundHit = new Vector3()
const groundPlane = new Plane()
const vertex = new Vector3()

export function worldBounds(root: Object3D): Box3 {
  box.makeEmpty()
  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (!(child instanceof Mesh) || !child.visible || child.name === 'contact-shadow' || !child.geometry) return
    const position = child.geometry.getAttribute('position')
    if (!position) return
    if (child instanceof SkinnedMesh) {
      // SkinnedMesh.computeBoundingBox disagrees with the rendered pose for
      // these rigs (metres of error), so sample the actual skinned vertices.
      child.skeleton?.update()
      const step = Math.max(1, Math.floor(position.count / 600))
      for (let i = 0; i < position.count; i += step) {
        child.getVertexPosition(i, vertex).applyMatrix4(child.matrixWorld)
        box.expandByPoint(vertex)
      }
    } else {
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
      if (!child.geometry.boundingBox) return
      meshBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld)
      box.union(meshBox)
    }
  })
  if (box.isEmpty()) box.setFromObject(root)
  return box
}

export function snapFeetToGround(root: Object3D, offset = 0): void {
  const bounds = worldBounds(root)
  if (bounds.isEmpty()) return
  root.position.y -= bounds.min.y
  root.position.y += offset
}

export function centerOnOrigin(root: Object3D, offset = 0): void {
  snapFeetToGround(root, offset)
  const bounds = worldBounds(root)
  if (bounds.isEmpty()) return
  root.position.x -= (bounds.min.x + bounds.max.x) / 2
  root.position.z -= (bounds.min.z + bounds.max.z) / 2
  snapFeetToGround(root, offset)
}

export function normalizeDinosaur(model: Object3D, config: DinosaurConfig): { length: number; width: number; height: number } {
  // Quaternius rigs share one convention: long axis on Z, head toward +Z,
  // which is what Object3D.lookAt expects. Only apply the configured yaw.
  model.scale.setScalar(1)
  model.position.set(0, 0, 0)
  model.rotation.set(0, config.modelYawOffset ?? 0, 0)
  model.updateMatrixWorld(true)

  const unscaled = worldBounds(model)
  unscaled.getSize(size)
  const length = Math.max(size.x, size.z, 0.001)
  const height = Math.max(size.y, 0.001)
  let scale = config.targetLengthMeters / length
  // Models posed with a raised neck (Apatosaurus) would tower if scaled by
  // ground length alone, so cap the result at the target height.
  if (config.targetHeightMeters && height * scale > config.targetHeightMeters * 1.3) {
    scale = (config.targetHeightMeters * 1.3) / height
  }
  model.scale.setScalar(scale)
  centerOnOrigin(model, config.groundOffset ?? 0)
  model.updateMatrixWorld(true)

  worldBounds(model).getSize(size)
  return { length: Math.max(size.x, size.z), width: Math.min(size.x, size.z), height: size.y }
}

export function screenToGround(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  camera: Camera,
  groundY = 0,
): Vector3 | null {
  if (rect.width <= 0 || rect.height <= 0) return null
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(ndc, camera)
  groundPlane.setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0), new Vector3(0, groundY, 0))
  if (!raycaster.ray.intersectPlane(groundPlane, groundHit)) return null
  if (raycaster.ray.direction.dot(new Vector3().subVectors(groundHit, camera.position)) < 0) return null
  const sideways = Math.hypot(groundHit.x - camera.position.x, groundHit.z - camera.position.z)
  if (sideways < 0.6) return null
  if (sideways > 36) {
    const scale = 36 / sideways
    groundHit.x = camera.position.x + (groundHit.x - camera.position.x) * scale
    groundHit.z = camera.position.z + (groundHit.z - camera.position.z) * scale
  }
  groundHit.y = groundY
  return groundHit.clone()
}

export function placeInFrontOfCamera(
  anchor: Group,
  camera: Pick<Camera, 'position'> & { getWorldDirection?: Camera['getWorldDirection'] },
  lengthMeters: number,
): void {
  const distance = Math.min(16, Math.max(2.4, lengthMeters * 0.72))
  const dir = new Vector3(0, 0, -1)
  camera.getWorldDirection?.(dir)
  dir.y = 0
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1)
  dir.normalize()
  anchor.position.set(camera.position.x + dir.x * distance, 0, camera.position.z + dir.z * distance)
  anchor.lookAt(camera.position.x, 0, camera.position.z)
}
