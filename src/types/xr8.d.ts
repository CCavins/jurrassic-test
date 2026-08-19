export interface XR8Vector3 {
  x: number
  y: number
  z: number
}

export interface XR8Quaternion {
  w: number
  x: number
  y: number
  z: number
}

export interface XR8Reality {
  rotation?: XR8Quaternion
  position?: XR8Vector3
  intrinsics?: number[]
  trackingStatus?: 'LIMITED' | 'NORMAL'
  trackingReason?: 'UNSPECIFIED' | 'INITIALIZING' | 'UNDEFINED'
  lighting?: { exposure?: number; temperature?: number }
}

export interface XR8PipelineModule {
  name: string
  onStart?: (args: { canvas: HTMLCanvasElement; canvasWidth: number; canvasHeight: number }) => void
  onUpdate?: (args: {
    processCpuResult?: { reality?: XR8Reality }
  }) => void
  onRender?: () => void
  onCameraStatusChange?: (args: { status: string; reason?: string }) => void
  listeners?: Array<{ event: string; process: (event: { name: string; detail: unknown }) => void }>
}

export interface XR8ThreeScene {
  scene: import('three').Scene
  camera: import('three').Camera
  renderer: import('three').WebGLRenderer
  cameraTexture?: import('three').Texture
}

export interface XR8Api {
  loadChunk: (name: string) => Promise<void>
  run: (options: {
    canvas: HTMLCanvasElement
    webgl2?: boolean
    cameraConfig?: { direction: string }
    allowedDevices?: string
    glContextConfig?: WebGLContextAttributes
  }) => void
  stop: () => void
  pause?: () => void
  resume?: () => void
  addCameraPipelineModules: (modules: XR8PipelineModule[]) => void
  addCameraPipelineModule: (module: XR8PipelineModule) => void
  clearCameraPipelineModules?: () => void
  requiredPermissions?: () => Set<string>
  GlTextureRenderer: { pipelineModule: () => XR8PipelineModule }
  Threejs: {
    pipelineModule: () => XR8PipelineModule
    xrScene: () => XR8ThreeScene
    configure?: (options: { renderCameraTexture?: boolean }) => void
  }
  XrController: {
    configure: (options: {
      disableWorldTracking?: boolean
      enableLighting?: boolean
      enableWorldPoints?: boolean
      scale?: 'responsive' | 'absolute'
    }) => void
    pipelineModule: () => XR8PipelineModule
    updateCameraProjectionMatrix: (options: {
      origin: { x: number; y: number; z: number }
      facing: { w: number; x: number; y: number; z: number }
    }) => void
    recenter: () => void
  }
  XrConfig: {
    camera: () => { BACK: string; FRONT: string }
    device: () => { ANY: string; MOBILE: string; MOBILE_AND_HEADSETS: string }
  }
  XrPermissions?: { permissions: () => Record<string, string> }
  CanvasScreenshot?: {
    pipelineModule: () => XR8PipelineModule
    takeScreenshot: (options?: { onProcessFrame?: (args: { ctx: CanvasRenderingContext2D }) => void }) => Promise<string>
  }
  canvasScreenshot?: () => {
    cameraPipelineModule: () => XR8PipelineModule
    takeScreenshot: () => Promise<string>
  }
  MediaRecorder?: {
    pipelineModule: () => XR8PipelineModule
    configure: (options: {
      maxDurationMs?: number
      maxDimension?: number
      enableEndCard?: boolean
      requestMic?: string
      fileNamePrefix?: string
    }) => void
    recordVideo: (callbacks: {
      onStart?: () => void
      onStop?: () => void
      onError?: (error: unknown) => void
      onVideoReady?: (result: { videoBlob?: Blob; videoUrl?: string; blob?: Blob; url?: string }) => void
      onPreviewReady?: (result: { videoBlob?: Blob; videoUrl?: string; blob?: Blob; url?: string }) => void
      onProcessFrame?: (args: { elapsedTimeMs: number; maxRecordingMs: number }) => void
    }) => void
    stopRecording: () => void
    requestMicrophone: () => Promise<void>
    RequestMicOptions: { AUTO: string; MANUAL: string }
  }
}

declare global {
  interface Window {
    XR8?: XR8Api
    THREE?: typeof import('three')
  }
}

export {}
