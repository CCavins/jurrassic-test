import { captureFileName } from './media'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

export async function shareOrDownload(blob: Blob, kind: 'photo' | 'video'): Promise<ShareResult> {
  const file = new File([blob], captureFileName(kind, blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg')), {
    type: blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
  })

  const payload = { files: [file], title: 'Jurassic Adventure', text: 'From Jurassic Adventure' }
  const canShareFiles =
    typeof navigator.canShare === 'function' ? navigator.canShare(payload) : Boolean(navigator.share)

  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }

  downloadBlob(file)
  return 'downloaded'
}

export function downloadBlob(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}
