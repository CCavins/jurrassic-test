import { useEffect, useRef } from 'react'
import type { CaptureMedia } from '../../ar/events'
import { shareOrDownload } from '../../utils/share'

interface Props {
  media: CaptureMedia
  onTryAgain: () => void
}

export function CapturePreview({ media, onTryAgain }: Props) {
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (media.kind !== 'video' || !video.current) return
    const player = video.current
    player.muted = true
    player.playsInline = true
    player.currentTime = 0
    const play = () => void player.play().catch(() => undefined)
    play()
    player.addEventListener('loadeddata', play)
    return () => player.removeEventListener('loadeddata', play)
  }, [media.kind, media.url])

  return (
    <section className="preview" role="dialog" aria-label="Capture preview">
      <div className="preview-shell">
        <header className="preview-head">
          <p className="kicker">Field capture</p>
          <h1 className="preview-title">{media.kind === 'photo' ? 'Photo ready' : 'Clip ready'}</h1>
        </header>

        <div className="preview-card">
          <div className="preview-stage">
            {media.kind === 'photo' ? (
              <img src={media.url} alt="Captured Jurassic Adventure photo" />
            ) : (
              <video
                ref={video}
                className="preview-video"
                src={media.url}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
              />
            )}
          </div>
        </div>

        <div className="preview-actions">
          <button className="btn btn-primary" onClick={() => void shareOrDownload(media.blob, media.kind)}>
            Save / Share
          </button>
          <button className="btn btn-ghost" onClick={onTryAgain}>
            Try again
          </button>
        </div>
      </div>
    </section>
  )
}
