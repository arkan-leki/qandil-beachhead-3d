# Beach Head 2002 Remake — Qandil Edition

A single-page 3D turret-defense game (React + TypeScript + Three.js) inspired by
Beach Head 2000/2002, set on the Qandil mountain theme. All models, textures and
sounds are procedural (no external assets).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. The included `.github/workflows/deploy.yml` builds and deploys to GitHub Pages
   automatically on push to `main`/`master` (or run it manually from the Actions tab).
3. In the repo Settings → Pages, set the source to **GitHub Actions** (once).
4. Your game is then live at `https://<user>.github.io/<repo>/`.

The Vite `base: './'` setting already makes asset paths relative, and
`public/.nojekyll` prevents GitHub Pages from mangling the built files.

## Controls

| Action | Key / input |
|---|---|
| Aim | Mouse drag / pointer / touch-drag / gyro tilt |
| Fire | Hold left mouse / Space / tap (touch) |
| Switch weapon | 1–5 keys, or click HUD tabs |
| Reload | R (or button) |
| Zoom optics | Z / Shift / right-click / wheel / pinch |
| Airstrike | B (or button) |
| Flare (night) | F (or button) |
| Auto-fire toggle | HUD "AUTO" button |
| Settings | ⚙️ button / long-press (mobile) |

## Weapons

1. **M60 MG** — infinite ammo, overheats under sustained fire (watch the HEAT bar)
2. **ZU-23-2 Twin 23mm AA** — 400 rounds, anti-air
3. **105mm AP Cannon** — 25 rounds, heavy splash, anti-armor
4. **Stinger/TOW Missiles** — 5 homing missiles
5. **.45 Handgun** — infinite reserve, 7-round mag

## Enemies

Soldiers · Tanks · APCs (deploy troops) · Attack Helicopters · Paratroopers ·
Cargo Planes (drop paratroopers) · Fighter Jets (strafe runs)

## Features

- Day/night cycle (night from wave 10) with turret searchlight + flares
- Shell interception: shoot down incoming tank shells with the M60 (+50)
- Critical hits: headshot +25, rotor +50, treads +20
- Perfect-wave bonus (+200, ×2) for taking no damage in a wave
- Wave-band difficulty scaling
- Tactical airstrike (B-58 carpet bombing)
- Mobile + gyroscope controls, touch gestures, auto-fire, haptics
- Performance presets (low/medium/high) and accessibility options
- High score persisted to localStorage

## Architecture

- `src/game3d/gameEngine.ts` — Three.js scene, simulation, combat, lighting
- `src/game3d/modelFactory.ts` — procedural 3D models
- `src/game3d/mobileControls.ts` — gyroscope + touch gestures + auto-fire
- `src/game3d/gunViewModel.ts` — first-person weapon viewmodel
- `src/game3d/panoramaSkybox.ts` — procedural sky/ground textures
- `src/audio/soundManager.ts` — WebAudio synthesized sounds
- `src/components/*` — React HUD, overlays, settings
- `src/App.tsx` — React glue between engine and UI

## Controls reference (mobile)

- Tilt device = aim (gyro, with iOS permission prompt)
- Tap = fire · two-finger tap = airstrike
- Swipe left/right = switch weapon · swipe up = reload
- Pinch = zoom · long-press = settings
