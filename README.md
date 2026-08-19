# Jurassic Adventure

Mobile-first WebAR prototype. Place a life-scale animated dinosaur in the real world using the current self-hosted **8th Wall XR Engine** (world tracking / SLAM + absolute scale), then capture a photo or a short video.

Live HTTPS URL after GitHub Pages is enabled:

**https://ccavins.github.io/jurrassic-test/**

## Install

```bash
npm install
```

`postinstall` copies the 8th Wall XR binary from `@8thwall/engine-binary` into `public/external/xr`. Do not edit those files. They include the required Niantic Spatial copyright notice.

## Run locally

```bash
npm run dev
```

Vite is served over HTTPS (self-signed) so a phone can request the camera. Trust the certificate when the browser warns.

Open the printed Network URL on the phone, or tunnel:

```bash
ngrok http 5173
```

## Test on iPhone

1. Prefer the GitHub Pages URL (trusted HTTPS).
2. Safari → allow Camera and Motion when prompted.
3. Find textured ground, wait for the dinosaur, then tap-and-drag.
4. Tap capture for a still. Hold for video (no microphone).

## Test on Android

1. Open the Pages URL in Chrome.
2. Allow the camera.
3. Same floor-scan and capture flow as iOS.

## 8th Wall binary

You do not need an 8th Wall account or cloud editor.

- Package: `@8thwall/engine-binary`
- SLAM chunk: `xr-slam.js` via `XR8.loadChunk('slam')`
- Official overview: https://8thwall.org/docs/engine/overview
- License: https://github.com/8thwall/engine/blob/main/LICENSE

World tracking only runs on a mobile device. Desktop shows a clearly labeled Three.js preview so UI, animation, drag, and capture can be exercised without pretending SLAM works.

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds `dist` and deploys with GitHub Actions.

One-time repo setting: **Settings → Pages → Source = GitHub Actions**.

Vite `base` is `./` so assets resolve under `/jurrassic-test/`.

## Debug

```bash
VITE_DEBUG_AR=true npm run dev
```

Shows FPS, poses, tracking, and recording state. Debug UI is omitted from production builds and from captures.

## Credits

Dinosaur models by Quaternius (CC0). See `public/models/ATTRIBUTION.md`.
