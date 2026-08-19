export class CameraPermissionError extends Error {
  readonly code = 'camera'

  constructor(message: string) {
    super(message)
    this.name = 'CameraPermissionError'
  }
}

function requestMotionPermission(): Promise<void> {
  const Orientation = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<PermissionState | string>
  }
  const Motion = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<PermissionState | string>
  }
  const request = Orientation.requestPermission ?? Motion.requestPermission
  if (typeof request !== 'function') return Promise.resolve()
  return request.call(Orientation.requestPermission ? Orientation : Motion).then(() => undefined, () => undefined)
}

async function requestCameraPermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraPermissionError('Camera access is not available in this browser.')
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  })
  stream.getTracks().forEach((track) => track.stop())
}

export function requestArPermissions(): Promise<void> {
  const camera = requestCameraPermission()
  const motion = requestMotionPermission()
  return Promise.all([camera, motion]).then(() => undefined)
}

export function cameraErrorFrom(error: unknown): { code: string; title: string; message: string } {
  const denied =
    error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
  const missing = error instanceof DOMException && error.name === 'NotFoundError'
  if (denied) {
    return {
      code: 'camera',
      title: 'Camera access required',
      message: 'Jurassic Adventure needs access to your camera to place dinosaurs in your world.',
    }
  }
  if (missing) {
    return {
      code: 'camera',
      title: 'No camera found',
      message: 'This device does not appear to have a camera the browser can use.',
    }
  }
  return {
    code: 'camera',
    title: 'Camera access required',
    message: error instanceof Error ? error.message : 'Jurassic Adventure needs access to your camera.',
  }
}
