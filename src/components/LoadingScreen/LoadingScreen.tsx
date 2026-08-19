interface Props {
  message: string
}

export function LoadingScreen({ message }: Props) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="scan-mark" aria-hidden="true" />
      <p className="loading-copy">{message}</p>
    </div>
  )
}
