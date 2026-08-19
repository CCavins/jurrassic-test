interface Props {
  message: string
}

export function LoadingScreen({ message }: Props) {
  return (
    <div className="hud" style={{ display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="scan-mark" aria-hidden="true" />
        <p className="helper" style={{ marginTop: 18 }}>
          {message}
        </p>
      </div>
    </div>
  )
}
