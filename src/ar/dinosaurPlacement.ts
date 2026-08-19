import { Box3, Group, Vector3, type Camera, type Object3D } from 'three'
import type { DinosaurConfig } from '../config/dinosaurs'

const box = new Box3()
const size = new Vector3()

export function normalizeDinosaur(model: Object3D, config: DinosaurConfig): { length: number; width: number; height: number } {
  model.scale.setScalar(1)
  model.position.set(0, 0, 0)
  model.rotation.set(0, config.modelYawOffset ?? 0, 0)
  model.updateMatrixWorld(true)

  box.setFromObject(model)
  box.getSize(size)
  const length = Math.max(size.x, size.z, 0.001)
  const scale = config.targetLengthMeters / length
  model.scale.setScalar(scale)
  model.updateMatrixWorld(true)

  box.setFromObject(model)
  model.position.y -= box.min.y
  model.position.y += config.groundOffset ?? 0
  model.updateMatrixWorld(true)

  box.setFromObject(model)
  box.getSize(size)
  return { length: size.z, width: size.x, height: size.y }
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
