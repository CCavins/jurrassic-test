import { useRef } from 'react'
import type { CaptureMedia } from '../../ar/events'
import { downloadBlob, shareOrDownload } from '../../utils/share'
import { captureFileName } from '../../utils/media'

interface Props {
  media: CaptureMedia
  onTryAgain: () => void
}

export function CapturePreview({ media, onTryAgain }: Props) {
  const video = useRef<HTMLVideoElement>(null)

  const replay = () => {
    if (!video.current) return
    video.current.currentTime = 0
    void video.current.play()
  }

  const share = async () => {
    await shareOrDownload(media.blob, media.kind)
  }

  const download = () => {
    const file = new File([media.blob], captureFileName(media.kind, media.blob.type), {
      type: media.blob.type,
    })
    downloadBlob(file)
  }

  return (
    <section className="preview" role="dialog" aria-label="Capture preview">
      <div className="preview-media">
        {media.kind === 'photo' ? (
          <img src={media.url} alt="Captured Jurassic Adventure photo" />
        ) : (
          <video ref={video} src={media.url} playsInline muted controls onClick={replay} />
        )}
      </div>
      <div className="preview-actions">
        <button className="btn btn-primary" onClick={share}>
          Save / Share
        </button>
        <button className="btn btn-secondary" onClick={download}>
          Download
        </button>
        <button className="btn btn-ghost" onClick={onTryAgain}>
          Try again
        </button>
      </div>
    </section>
  )
}
