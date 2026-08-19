import { Plane, Raycaster, Vector2, Vector3, type Camera, type Object3D } from 'three'

const raycaster = new Raycaster()
const pointer = new Vector2()
const ground = new Plane(new Vector3(0, 1, 0), 0)
const hit = new Vector3()
const target = new Vector3()

export class DinosaurInteraction {
  dragging = false
  selected = false
  private moved = false

  pointerDown(clientX: number, clientY: number, canvas: HTMLCanvasElement, camera: Camera, model: Object3D | null): boolean {
    if (!model) return false
    this.project(clientX, clientY, canvas)
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(model, true)
    if (intersects.length === 0) {
      this.selected = false
      this.dragging = false
      return false
    }
    this.selected = true
    this.dragging = true
    this.moved = false
    return true
  }

  pointerMove(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: Camera,
    anchor: Object3D,
  ): boolean {
    if (!this.dragging) return false
    this.project(clientX, clientY, canvas)
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(ground, hit)) return false
    target.set(hit.x, 0, hit.z)
    anchor.position.lerp(target, 0.45)
    anchor.position.y = 0
    this.moved = true
    return true
  }

  pointerUp(): { dragged: boolean; selected: boolean } {
    const dragged = this.dragging && this.moved
    this.dragging = false
    this.moved = false
    return { dragged, selected: this.selected }
  }

  private project(clientX: number, clientY: number, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }
}
