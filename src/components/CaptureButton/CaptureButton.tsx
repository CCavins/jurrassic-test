import { useRef, type PointerEvent } from 'react'

const HOLD_MS = 250

interface Props {
  recording: boolean
  progress: number
  onPhoto: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
}

export function CaptureButton({ recording, progress, onPhoto, onHoldStart, onHoldEnd }: Props) {
  const timer = useRef<number>(0)
  const held = useRef(false)
  const ring = 2 * Math.PI * 40
  const offset = ring * (1 - progress)

  const onDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    held.current = false
    timer.current = window.setTimeout(() => {
      held.current = true
      onHoldStart()
    }, HOLD_MS)
  }

  const onUp = () => {
    window.clearTimeout(timer.current)
    if (held.current || recording) onHoldEnd()
    else onPhoto()
    held.current = false
  }

  return (
    <button
      className={`capture${recording ? ' is-recording' : ''}`}
      aria-label={recording ? 'Stop recording' : 'Take photo or hold to record'}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className="capture-ring" viewBox="0 0 92 92" aria-hidden="true">
        <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
        {recording ? (
          <circle
            cx="46"
            cy="46"
            r="40"
            fill="none"
            stroke="#d4543c"
            strokeWidth="4"
            strokeDasharray={ring}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      <span className="capture-core" />
    </button>
  )
}
