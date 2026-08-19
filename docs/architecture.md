# Architecture

React owns application screens. The XR / Three.js layer never imports React.

```
HOME → DINOSAUR_SELECT → AR_EXPERIENCE → CAPTURE_PREVIEW
```

## Isolation

- `src/app` and `src/components` render UI and call `src/hooks/useARSession.ts`
- `src/ar/xrFacade.ts` is the only bridge
- `src/ar/*` talks to Three.js and `window.XR8`

## 8th Wall

The current self-hosted binary is loaded only when the user enters AR:

1. Inject `public/external/xr/xr.js` (copied from `@8thwall/engine-binary`)
2. `XR8.loadChunk('slam')`
3. `XR8.XrController.configure({ scale: 'absolute', enableLighting: true })`
4. Pipeline: GlTextureRenderer → Threejs → XrController → CanvasScreenshot → MediaRecorder → `jurassic-scene`
5. `XR8.run({ cameraConfig: BACK, allowedDevices: MOBILE })`

World tracking is mobile-only. Desktop opens a labeled Three.js preview and is never presented as SLAM.

## Placement and interaction

- Ground is `Y = 0`
- Models are scaled to `targetLengthMeters` from their bounding box
- After tracking is `NORMAL`, the dinosaur is placed in front of the camera
- Pointer-down must hit the dinosaur before X/Z dragging starts
- Animation root translation is zeroed every frame so clips cannot walk off the anchor

## Capture

- Photos: `XR8.CanvasScreenshot` (XR) or `canvas.toBlob` (desktop)
- Video: `XR8.MediaRecorder` with `requestMic: MANUAL` and a 15s cap, or canvas `MediaRecorder` on desktop
- HUD is DOM, so it is not composited into the WebGL capture
- Share uses `navigator.canShare({ files })` then `navigator.share`, with a real download fallback
