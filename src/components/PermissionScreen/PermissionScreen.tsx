import { publicUrl } from '../../utils/paths'

interface Props {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onBack: () => void
}

export function PermissionScreen({ title, message, actionLabel = 'Try again', onAction, onBack }: Props) {
  return (
    <section
      className="screen overlay-screen"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(13, 15, 13, 0.72), rgba(13, 15, 13, 0.88)), url("${publicUrl('images/texture.jpg')}")`,
      }}
    >
      <p className="kicker">Access needed</p>
      <h1>{title}</h1>
      <p className="muted">{message}</p>
      <div className="hero-actions" style={{ position: 'relative', left: 'auto', right: 'auto', bottom: 'auto', marginTop: 32 }}>
        <button className="btn btn-primary" onClick={onAction ?? onBack}>
          {actionLabel}
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  )
}
