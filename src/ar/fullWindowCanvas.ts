import type { XR8PipelineModule } from '../types/xr8'

function viewportCssSize(): { width: number; height: number } {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  }
}

function readOrientation(): number {
  const typed = window as Window & { orientation?: number }
  if (typeof typed.orientation === 'number') return typed.orientation
  const angle = screen.orientation?.angle
  return typeof angle === 'number' ? angle : 0
}

export function createFullWindowCanvasModule(): XR8PipelineModule {
  let canvas: HTMLCanvasElement | null = null
  let videoWidth = 0
  let videoHeight = 0
  let orientation = readOrientation()

  const fill = () => {
    if (!canvas) return

    const css = viewportCssSize()
    const pixelWidth = Math.max(1, Math.round(css.width * devicePixelRatio))
    const pixelHeight = Math.max(1, Math.round(css.height * devicePixelRatio))
    const portrait = Math.abs(orientation) !== 90
    if ((portrait && pixelWidth > pixelHeight) || (!portrait && pixelHeight > pixelWidth)) {
      window.requestAnimationFrame(fill)
      return
    }

    const screenLong = Math.max(pixelWidth, pixelHeight)
    const screenShort = Math.min(pixelWidth, pixelHeight)
    const portraitAspect = screenLong / screenShort
    const videoLong = Math.max(videoWidth || screenLong, videoHeight || screenShort)
    const videoShort = Math.min(videoWidth || screenLong, videoHeight || screenShort)

    let cropHeight = videoLong
    let cropWidth = Math.round(videoLong / portraitAspect)
    if (cropWidth > videoShort) {
      cropWidth = videoShort
      cropHeight = Math.round(videoShort * portraitAspect)
    }
    if (cropWidth > screenShort || cropHeight > screenLong) {
      cropWidth = screenShort
      cropHeight = screenLong
    }
    if (pixelWidth > pixelHeight) {
      const swapped = cropWidth
      cropWidth = cropHeight
      cropHeight = swapped
    }

    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.margin = '0'
    canvas.style.padding = '0'
    canvas.style.border = '0'
    canvas.style.display = 'block'
    canvas.style.objectFit = 'cover'
    canvas.width = cropWidth
    canvas.height = cropHeight
  }

  const setVideoSize = (nextWidth: number, nextHeight: number) => {
    if (!nextWidth || !nextHeight) return
    videoWidth = nextWidth
    videoHeight = nextHeight
    fill()
  }

  return {
    name: 'jurassic-fullwindow-canvas',
    onAttach: ({ canvas: next, orientation: nextOrientation, videoWidth: width, videoHeight: height }) => {
      canvas = next
      orientation = nextOrientation ?? readOrientation()
      document.documentElement.classList.add('is-ar')
      setVideoSize(width ?? 0, height ?? 0)
      fill()
      window.visualViewport?.addEventListener('resize', fill)
      window.addEventListener('resize', fill)
    },
    onDetach: () => {
      document.documentElement.classList.remove('is-ar')
      window.visualViewport?.removeEventListener('resize', fill)
      window.removeEventListener('resize', fill)
      canvas = null
      videoWidth = 0
      videoHeight = 0
    },
    onCameraStatusChange: ({ status, video }) => {
      if (status === 'hasVideo' && video) setVideoSize(video.videoWidth, video.videoHeight)
    },
    onVideoSizeChange: ({ videoWidth: width, videoHeight: height }) => setVideoSize(width, height),
    onDeviceOrientationChange: ({ orientation: next }) => {
      orientation = next
      fill()
    },
    onCanvasSizeChange: fill,
    onUpdate: () => {
      if (!canvas) return
      if (canvas.style.width !== '100%' || canvas.style.height !== '100%') fill()
    },
  }
}
