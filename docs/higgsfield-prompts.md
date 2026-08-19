# Higgsfield prompts

Higgsfield CLI was available during development (`higgsfield account status` authenticated). Campaign stills use **Nano Banana 2** (`nano_banana_flash`) after Nano Banana Pro stalled.

## Home hero

```bash
higgsfield generate create nano_banana_flash \
  --prompt "Premium cinematic prehistoric landscape at dawn, dense ancient forest opening into a misty valley, enormous distant sauropod dinosaur silhouette partially obscured by atmospheric fog, dramatic shafts of warm sunlight, realistic natural-history documentary aesthetic, sophisticated and immersive, dark foreground foliage providing negative space, subtle film grain, vertical 9:16 composition. Absolutely no text, no letters, no words, no titles, no watermarks, no logos, no typography of any kind." \
  --aspect_ratio 9:16 \
  --resolution 2k \
  --wait
```

Save the result to `public/images/hero.jpg`.

## Supporting texture

```bash
higgsfield generate create nano_banana_flash \
  --prompt "Subtle dark prehistoric environmental texture, near-black charcoal ancient forest floor, faint moss, damp bark, fossil dust and distant ferns barely visible, no sky, no horizon, no dinosaur, no people, no text, no logos, no typography, cinematic natural-history photography, soft low contrast, usable as a website menu background, 9:16 vertical composition." \
  --aspect_ratio 9:16 \
  --resolution 2k \
  --wait
```

Save the result to `public/images/texture.jpg`.

## If Higgsfield is not authenticated

1. Install: `curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh`
2. Login: `higgsfield auth login`
3. Re-run the commands above.
4. The app still runs with whatever images are currently in `public/images/`.
