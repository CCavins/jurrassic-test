import { publicUrl } from '../../utils/paths'

interface Props {
  onStart: () => void
  onCredits: () => void
}

export function HomeScreen({ onStart, onCredits }: Props) {
  return (
    <section
      className="screen hero"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(8, 10, 8, 0.18) 0%, rgba(8, 10, 8, 0.55) 48%, rgba(8, 10, 8, 0.88) 100%), url("${publicUrl('images/hero.jpg')}")`,
      }}
    >
      <p className="kicker">Field expedition</p>
      <h1 className="display">
        Start your
        <br />
        Jurassic
        <br />
        Adventure
      </h1>
      <p className="lede">Bring prehistoric giants into your world.</p>
      <div className="hero-actions">
        <button className="btn btn-primary" onClick={onStart}>
          Start Adventure
        </button>
        <button className="linkish" onClick={onCredits}>
          Credits / Legal
        </button>
      </div>
    </section>
  )
}
