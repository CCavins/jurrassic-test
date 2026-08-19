import { CaptureButton } from '../CaptureButton/CaptureButton'

interface Props {
  name: string
  helper: string | null
  desktop: boolean
  recording: boolean
  elapsedMs: number
  maxMs: number
  emphasizeRecenter: boolean
  awaitingPlacement: boolean
  onBack: () => void
  onRecenter: () => void
  onPlace: (clientX: number, clientY: number) => void
  onDrag: (clientX: number, clientY: number) => void
  onRelease: () => void
  onPhoto: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
}

export function ARHud({
  name,
  helper,
  desktop,
  recording,
  elapsedMs,
  maxMs,
  emphasizeRecenter,
  awaitingPlacement,
  onBack,
  onRecenter,
  onPlace,
  onDrag,
  onRelease,
  onPhoto,
  onHoldStart,
  onHoldEnd,
}: Props) {
  return (
    <div className="hud">
      <button
        className="place-layer"
        type="button"
        aria-label={awaitingPlacement ? 'Tap the ground to place the dinosaur' : 'Tap or drag on the ground to move the dinosaur'}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          onPlace(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          onDrag(event.clientX, event.clientY)
        }}
        onPointerUp={onRelease}
        onPointerCancel={onRelease}
      />
      <div className="hud-top">
        <button className="icon-btn" onClick={onBack} aria-label="Back to dinosaur selection">
          ←
        </button>
        <p className="hud-name">{name}</p>
        <button
          className="icon-btn"
          onClick={onRecenter}
          aria-label="Recenter tracking"
          style={emphasizeRecenter ? { borderColor: 'var(--color-accent)' } : undefined}
        >
          ⌖
        </button>
      </div>
      {desktop ? (
        <p className="desktop-banner">Desktop preview — world tracking requires a phone.</p>
      ) : null}
      <div className="hud-bottom">
        {helper ? <p className="helper">{helper}</p> : null}
        {recording ? <p className="helper">{formatTime(elapsedMs)}</p> : null}
        <CaptureButton
          recording={recording}
          progress={maxMs ? Math.min(1, elapsedMs / maxMs) : 0}
          onPhoto={onPhoto}
          onHoldStart={onHoldStart}
          onHoldEnd={onHoldEnd}
        />
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `0:${String(total).padStart(2, '0')}`
}
