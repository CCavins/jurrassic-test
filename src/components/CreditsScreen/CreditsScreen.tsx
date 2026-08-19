import { publicUrl } from '../../utils/paths'

interface Props {
  onBack: () => void
}

export function CreditsScreen({ onBack }: Props) {
  return (
    <section
      className="screen legal"
      style={{ ['--texture-image' as string]: `url(${publicUrl('images/texture.jpg')})` }}
    >
      <button className="icon-btn" onClick={onBack} aria-label="Back">
        ←
      </button>
      <p className="kicker" style={{ marginTop: 28 }}>
        Notices
      </p>
      <h1>Credits / Legal</h1>
      <p className="muted">
        This product includes the XR Engine software developed by Niantic Spatial, Inc. Copyright © 2026
        Niantic Spatial, Inc. All rights reserved.{' '}
        <a href="https://github.com/8thwall/engine/blob/main/LICENSE" target="_blank" rel="noreferrer">
          XR Engine license
        </a>
        .
      </p>
      <p className="muted">
        Dinosaur models by Quaternius, released as CC0 / public domain via Poly Pizza and quaternius.com.
        Attribution is recorded in <code>public/models/ATTRIBUTION.md</code>.
      </p>
      <p className="muted">
        Campaign stills were generated with Higgsfield Nano Banana 2. Jurassic Adventure is an original
        experiential prototype and is not affiliated with any film franchise.
      </p>
    </section>
  )
}
