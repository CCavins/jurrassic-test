import { dinosaurs } from '../../config/dinosaurs'
import { publicUrl } from '../../utils/paths'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onEnter: () => void
  onBack: () => void
}

export function DinosaurSelector({ selectedId, onSelect, onEnter, onBack }: Props) {
  return (
    <section
      className="screen select"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(13, 15, 13, 0.72), rgba(13, 15, 13, 0.88)), url("${publicUrl('images/texture.jpg')}")`,
      }}
    >
      <header className="select-head">
        <div>
          <p className="kicker">Specimen list</p>
          <h1 className="display" style={{ fontSize: '2.4rem' }}>
            Choose your dinosaur
          </h1>
        </div>
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          ←
        </button>
      </header>
      <div className="dino-list">
        {dinosaurs.map((dinosaur) => {
          const selected = dinosaur.id === selectedId
          return (
            <button
              key={dinosaur.id}
              className={`dino-card${selected ? ' is-selected' : ''}`}
              onClick={() => onSelect(dinosaur.id)}
              aria-pressed={selected}
            >
              <img src={dinosaur.thumbnailUrl} alt="" />
              <div>
                <h2>{dinosaur.name}</h2>
                {dinosaur.scientificName ? <p className="sci">{dinosaur.scientificName}</p> : null}
                <p>{dinosaur.descriptor}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="dock">
        <button className="btn btn-primary" disabled={!selectedId} onClick={onEnter}>
          {selectedId ? 'Enter AR' : 'Select a dinosaur'}
        </button>
      </div>
    </section>
  )
}
