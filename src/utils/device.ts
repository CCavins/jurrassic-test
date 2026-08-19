export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPod|Android.+Mobile/i.test(ua)) return true
  if (/iPad/i.test(ua)) return true
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true
  return false
}

export function hasWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function canAttemptWorldTracking(): boolean {
  return isLikelyMobileDevice() && hasWebGl() && Boolean(navigator.mediaDevices?.getUserMedia)
}

export function isSecureContextRequired(): boolean {
  return !window.isSecureContext
}
