import { useEffect, useRef, useState } from 'react'
import { getDinosaur } from '../config/dinosaurs'
import { ARHud } from '../components/ARHud/ARHud'
import { CapturePreview } from '../components/CapturePreview/CapturePreview'
import { CreditsScreen } from '../components/CreditsScreen/CreditsScreen'
import { DebugOverlay } from '../components/DebugOverlay/DebugOverlay'
import { DinosaurSelector } from '../components/DinosaurSelector/DinosaurSelector'
import { HomeScreen } from '../components/HomeScreen/HomeScreen'
import { LoadingScreen } from '../components/LoadingScreen/LoadingScreen'
import { PermissionScreen } from '../components/PermissionScreen/PermissionScreen'
import { useARSession } from '../hooks/useARSession'
import { canAttemptWorldTracking, hasWebGl, isSecureContextRequired } from '../utils/device'
import { publicUrl } from '../utils/paths'
import type { AppScreen } from './appState'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const session = useARSession()
  const dinosaur = selectedId ? getDinosaur(selectedId) : undefined

  useEffect(() => {
    document.documentElement.style.setProperty('--hero-image', `url(${publicUrl('images/hero.jpg')})`)
    document.documentElement.style.setProperty('--texture-image', `url(${publicUrl('images/texture.jpg')})`)
  }, [])

  const enterAr = async () => {
    if (!dinosaur || !hostRef.current) return
    if (!hasWebGl()) {
      session.clearError()
      setScreen('ar')
      return
    }
    setScreen('ar')
    try {
      await session.start(hostRef.current, dinosaur)
    } catch {
      // errors arrive through the facade
    }
  }

  const goHome = () => {
    session.stop()
    session.clearCapture()
    session.clearError()
    setScreen('home')
  }

  if (screen === 'home') {
    return (
      <div className="app">
        <HomeScreen onStart={() => setScreen('select')} onCredits={() => setScreen('credits')} />
      </div>
    )
  }

  if (screen === 'credits') {
    return (
      <div className="app">
        <CreditsScreen onBack={() => setScreen('home')} />
      </div>
    )
  }

  if (screen === 'select') {
    return (
      <div className="app">
        <DinosaurSelector
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEnter={() => void enterAr()}
          onBack={goHome}
        />
      </div>
    )
  }

  const unsupported = isSecureContextRequired()
    ? {
        title: 'Secure connection required',
        message: 'Camera and motion access need HTTPS. Open the GitHub Pages URL or a local HTTPS tunnel.',
      }
    : !hasWebGl()
      ? {
          title: 'WebGL is unavailable',
          message: 'This device cannot render the 3D scene. Try another browser.',
        }
      : session.error

  return (
    <div className="app screen screen--locked">
      <div ref={hostRef} className="xr-root" />
      {screen === 'ar' && dinosaur && !unsupported ? (
        <ARHud
          name={dinosaur.name}
          helper={session.coaching}
          desktop={session.mode === 'desktop' || !canAttemptWorldTracking()}
          recording={session.recording.active}
          elapsedMs={session.recording.elapsedMs}
          maxMs={session.recording.maxMs}
          emphasizeRecenter={session.tracking === 'LIMITED'}
          onBack={() => setScreen('select')}
          onRecenter={() => session.recenter()}
          onPhoto={() => void session.takePhoto()}
          onHoldStart={() => void session.startRecording()}
          onHoldEnd={() => void session.stopRecording()}
        />
      ) : null}
      {session.loading ? <LoadingScreen message={session.loading} /> : null}
      {unsupported ? (
        <PermissionScreen
          title={unsupported.title}
          message={unsupported.message}
          actionLabel={session.error?.code === 'camera' ? 'Enable camera' : 'Back'}
          onAction={session.error?.code === 'camera' ? () => void enterAr() : () => setScreen('select')}
          onBack={() => setScreen('select')}
        />
      ) : null}
      {session.capture ? (
        <CapturePreview
          media={session.capture}
          onTryAgain={() => {
            session.clearCapture()
            setScreen('ar')
          }}
        />
      ) : null}
      <DebugOverlay />
    </div>
  )
}
