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
  let lastCssWidth = 0
  let lastCssHeight = 0
  let resizeTimer = 0

  const applyStyles = (target: HTMLCanvasElement) => {
    target.style.position = 'absolute'
    target.style.inset = '0'
    target.style.width = '100%'
    target.style.height = '100%'
    target.style.margin = '0'
    target.style.padding = '0'
    target.style.border = '0'
    target.style.display = 'block'
    target.style.objectFit = 'cover'
  }

  const fill = (force = false) => {
    if (!canvas) return

    const css = viewportCssSize()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pixelWidth = Math.max(1, Math.round(css.width * dpr))
    const pixelHeight = Math.max(1, Math.round(css.height * dpr))
    const portrait = Math.abs(orientation) !== 90
    if ((portrait && pixelWidth > pixelHeight) || (!portrait && pixelHeight > pixelWidth)) {
      window.requestAnimationFrame(() => fill(force))
      return
    }

    if (
      !force &&
      lastCssWidth > 0 &&
      Math.abs(css.width - lastCssWidth) < 32 &&
      Math.abs(css.height - lastCssHeight) < 64
    ) {
      applyStyles(canvas)
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

    applyStyles(canvas)
    if (canvas.width !== cropWidth || canvas.height !== cropHeight) {
      canvas.width = cropWidth
      canvas.height = cropHeight
    }
    lastCssWidth = css.width
    lastCssHeight = css.height
  }

  const scheduleFill = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => fill(false), 180)
  }

  const setVideoSize = (nextWidth: number, nextHeight: number) => {
    if (!nextWidth || !nextHeight) return
    const changed = nextWidth !== videoWidth || nextHeight !== videoHeight
    videoWidth = nextWidth
    videoHeight = nextHeight
    if (changed) fill(true)
  }

  return {
    name: 'jurassic-fullwindow-canvas',
    onAttach: ({ canvas: next, orientation: nextOrientation, videoWidth: width, videoHeight: height }) => {
      canvas = next
      orientation = nextOrientation ?? readOrientation()
      document.documentElement.classList.add('is-ar')
      setVideoSize(width ?? 0, height ?? 0)
      fill(true)
      window.visualViewport?.addEventListener('resize', scheduleFill)
      window.addEventListener('resize', scheduleFill)
    },
    onDetach: () => {
      document.documentElement.classList.remove('is-ar')
      window.visualViewport?.removeEventListener('resize', scheduleFill)
      window.removeEventListener('resize', scheduleFill)
      window.clearTimeout(resizeTimer)
      canvas = null
      videoWidth = 0
      videoHeight = 0
      lastCssWidth = 0
      lastCssHeight = 0
    },
    onCameraStatusChange: ({ status, video }) => {
      if (status === 'hasVideo' && video) setVideoSize(video.videoWidth, video.videoHeight)
    },
    onVideoSizeChange: ({ videoWidth: width, videoHeight: height }) => setVideoSize(width, height),
    onDeviceOrientationChange: ({ orientation: next }) => {
      orientation = next
      lastCssWidth = 0
      lastCssHeight = 0
      fill(true)
    },
  }
}
