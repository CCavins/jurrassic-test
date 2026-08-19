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
import { classifyArError, requestArPermissions } from '../utils/permissions'
import { publicUrl } from '../utils/paths'
import type { AppScreen } from './appState'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const session = useARSession()
  const dinosaur = selectedId ? getDinosaur(selectedId) : undefined

  useEffect(() => {
    const hero = publicUrl('images/hero.jpg')
    const texture = publicUrl('images/texture.jpg')
    document.documentElement.style.setProperty('--hero-image', `url("${hero}")`)
    document.documentElement.style.setProperty('--texture-image', `url("${texture}")`)
  }, [])

  const enterAr = () => {
    if (!dinosaur) return
    const host = hostRef.current
    if (!host || !hasWebGl()) return
    session.clearError()
    const cameraPrompt = canAttemptWorldTracking() ? requestArPermissions() : Promise.resolve()
    void cameraPrompt
      .then(() => {
        setScreen('ar')
        return session.start(host, dinosaur)
      })
      .catch((error: unknown) => {
        setScreen('ar')
        session.reportError(classifyArError(error))
      })
  }

  const leaveAr = () => {
    session.clearError()
    setScreen('select')
    void session.stop()
  }

  const goHome = () => {
    void session.stop()
    session.clearCapture()
    session.clearError()
    setScreen('home')
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

  const showArChrome = screen === 'ar' || Boolean(session.capture)

  return (
    <div className="app">
      <div ref={hostRef} className="xr-root" hidden={!showArChrome} />

      {screen === 'home' ? (
        <HomeScreen onStart={() => setScreen('select')} onCredits={() => setScreen('credits')} />
      ) : null}

      {screen === 'credits' ? <CreditsScreen onBack={() => setScreen('home')} /> : null}

      {screen === 'select' ? (
        <DinosaurSelector
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEnter={enterAr}
          onBack={goHome}
        />
      ) : null}

      {screen === 'ar' && dinosaur && !unsupported && !session.capture ? (
        <div className="screen screen--locked">
          <ARHud
            name={dinosaur.name}
            helper={session.coaching}
            desktop={session.mode === 'desktop' || !canAttemptWorldTracking()}
            recording={session.recording.active}
            elapsedMs={session.recording.elapsedMs}
            maxMs={session.recording.maxMs}
            emphasizeRecenter={session.tracking === 'LIMITED'}
            awaitingPlacement={!session.placed && !session.loading}
            onBack={leaveAr}
            onRecenter={() => void session.recenter()}
            onPlace={(clientX, clientY) => void session.placeAt(clientX, clientY)}
            onPhoto={() => void session.takePhoto()}
            onHoldStart={() => void session.startRecording()}
            onHoldEnd={() => void session.stopRecording()}
          />
        </div>
      ) : null}

      {screen === 'ar' && session.loading && !session.capture ? <LoadingScreen message={session.loading} /> : null}

      {screen === 'ar' && unsupported ? (
        <PermissionScreen
          title={unsupported.title}
          message={unsupported.message}
          actionLabel={session.error?.code === 'camera' ? 'Enable camera' : 'Try again'}
          onAction={session.error?.code === 'camera' || session.error?.code === 'engine' ? enterAr : leaveAr}
          onBack={leaveAr}
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
