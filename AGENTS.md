# AGENTS.md

DEDSEC_TTT — vanilla HTML/CSS/JS tic-tac-toe (no build, no deps). Notes for future sessions.

## Run

No install. Serve over HTTP, not `file://` (Web Audio + Google Fonts need it):

```powershell
cd D:\vibe_app\test_01
python -m http.server 8000
# open http://localhost:8000
```

## Cache-bust gotcha

`index.html` loads `css/style.css?v=4` and `js/game.js?v=4`. **Bump the `?v=N` on both tags every time you edit the file** — otherwise the browser keeps serving the old version and your changes look like they didn't apply. (The user reported "анимации нет" once because of exactly this.)

## Validation

No test suite, no linter, no build. The only useful check is JS syntax:

```powershell
node --check js/game.js
```

For visual regression use a headless browser (Edge is at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`):
```powershell
& "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot=out.png --window-size=W,H "http://localhost:8000/index.html?v=N"
```

## Architecture

- `index.html` — markup + IDs the JS hooks into. Three hidden scenes: `#scene-hacker` (hacker headbanging), `#scene-corp` (boss sipping whiskey), `#scene-draw` (scrolling Jupyter/pandas output, clones itself via `initDrawScroll` for seamless loop). All `<pre class="pixel-art">` blocks.
- `css/style.css` — all styling. Color tokens in `:root` (see below). Has its own `prefers-reduced-motion: reduce` rule that nukes every animation to 0.01ms — if a user reports "анимации нет" on Windows, check `Settings → Accessibility → Visual effects → Animation effects` is off.
- `js/game.js` — one IIFE. State object at the top (~line 13). `i18n` literal next to it. DOM refs gathered near the top of the IIFE.

## Things easy to break

1. **Pixel-art scenes are clipped by `overflow: hidden` on `.victory-scene` + `.scene`.** The headbang/corp-sway keyframes use `transform: translate + rotate`. Keep the rotation amplitude modest (≤2°) and use `transform-origin: 50% 80%` (hacker) / `50% 90%` (corp) or the top of the art rotates out of frame. Debug: temporarily remove `overflow: hidden` to confirm.
2. **HTML `id` ↔ JS `getElementById` is a 1:1 contract.** Every new ID used in JS must exist in HTML. Quick check:
   ```powershell
   node -e "const h=require('fs').readFileSync('index.html','utf8'),j=require('fs').readFileSync('js/game.js','utf8');[...new Set([...j.matchAll(/getElementById\('([^']+)'\)/g)].map(m=>m[1]))].forEach(id=>console.log(h.includes('id=\"'+id+'\"')?'OK   '+id:'MISS '+id))"
   ```
3. **i18n keys must exist in BOTH `en` and `ru` blocks of `i18n` in `js/game.js`.** Every `data-i18n="X"` in HTML needs a matching `X: '...'` in each language object, or the key renders literally.
4. **Color tokens are amber/red, not green.** `--amber` (primary, #ffb000), `--red` (corp, #ff0033), `--amber-bright` (yellow accent, #ffd24a), `--white` (#f5f5f5). Old names (`--neon`, `--cyan`, `--magenta`, `--yellow`) are gone — do not reintroduce.
5. **Score persistence** uses `localStorage` key `dedsec_ttt_scores` (`loadScores`/`saveScores` in `js/game.js`). Don't change the key without a migration.

## Hotkeys (UX contract)

- `R` — reset game
- `Y` — play again (when overlay active)
- Konami `↑↑↓↓←→←→BA` — toggles `body.rainbow` class
- First user interaction (click/keydown) unlocks the `AudioContext` — handlers in `init()`.

## Don't try to

- Run `npm` / `pnpm` / `yarn` — no `package.json`.
- Run any linter or test — none configured.
- Add a build step — keep it vanilla (user explicitly wants zero deps).
- Commit — repo is not under git unless you `git init` first; ask before doing so.
