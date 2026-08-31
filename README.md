# Lights Out // Neon Grid

A self-contained, responsive web version of the classic 5×5 Lights Out puzzle, styled around the original handheld's dark casing, warm amber controls, and glowing yellow/green light grid. It uses Web Audio API for the short electronic toggle/reset/win tones, so there are no audio files or external runtime dependencies.

## Run locally

```bash
cd /root/lights-out
npm install
npm run dev
```

Open http://127.0.0.1:8788

## Cloudflare Workers

This is a static-assets Worker deployment and is ready for Wrangler:

```bash
npm run deploy
```

You will need to authenticate Wrangler first with `npx wrangler login`.

## Controls

- Tap/click or keyboard-focus any tile to toggle it and its orthogonal neighbours.
- **New Puzzle** generates a guaranteed-solvable puzzle.
- **Reset Board** returns to the initial puzzle state.
- Best score is stored locally in the browser.
- The speaker control toggles Web Audio effects.
- PWA foundation included: installable manifest, portrait standalone mode, safe-area support, app icon, and offline service-worker caching.
