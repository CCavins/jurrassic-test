export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function jpegBase64ToBlob(base64: string): Blob {
  const normalized = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
  return dataUrlToBlob(normalized)
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not encode the image.'))
      },
      'image/jpeg',
      quality,
    )
  })
}

export function extensionForMime(mime: string): string {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('quicktime')) return 'mov'
  if (mime.includes('png')) return 'png'
  return 'jpg'
}

export function captureFileName(kind: 'photo' | 'video', mime: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `jurassic-adventure-${kind}-${stamp}.${extensionForMime(mime)}`
}

export function revokeIfObjectUrl(url: string | null | undefined): void {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}
