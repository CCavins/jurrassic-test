import { useEffect, useState } from 'react'
import type { ArDebugState } from '../../ar/events'
import { isDebugAr } from '../../utils/paths'

export function DebugOverlay() {
  const [state, setState] = useState<ArDebugState | null>(null)

  useEffect(() => {
    if (!isDebugAr()) return
    let unsubscribe: (() => void) | undefined
    void import('../../ar/xrFacade').then(({ xrFacade }) => {
      unsubscribe = xrFacade.events.on('debug', setState)
    })
    return () => unsubscribe?.()
  }, [])

  if (!isDebugAr() || !state) return null

  return (
    <pre className="debug">
      {`mode ${state.mode}  fps ${state.fps.toFixed(0)}
track ${state.tracking}  scale ${state.absoluteScale ? 'abs' : 'n/a'}
anim ${state.animation || '—'}
cam ${fmt(state.cameraPosition)}
dino ${fmt(state.dinosaurPosition)}
groundY ${state.groundY}  rec ${state.recording ? 'on' : 'off'}
${state.initState}`}
    </pre>
  )
}

function fmt(values: [number, number, number]): string {
  return values.map((value) => value.toFixed(2)).join(', ')
}
