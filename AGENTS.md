<!-- luyens-skills:start -->
## Catalogus luyens-skills (automatisch beheerd door kit.mjs, niet met de hand wijzigen)
Deze app gebruikt gedeelde onderdelen uit de catalogus `luyens-skills` (GitHub: shaggy72/luyens-skills; op Michas pc: `C:\Users\micha\ai-projecten\luyens-skills`, geïnstalleerd in `~/.claude/skills`).
- **Lees voor je aan een nieuwe functie begint `~/.claude/skills/app-nieuw/LESSONS.md`** (kort overzicht van fouten die al eens gemaakt en opgelost zijn: iOS, swipen, enz.). Open een les alleen als ze op je taak slaat.
- Onderdelen staan in `.luyens/components.json`; `node ~/.claude/skills/app-nieuw/scripts/kit.mjs status .` toont of de app achterloopt. Schrijf geen eigen login, dock, swipe of back-up als de catalogus die heeft.
- Vond je een betere oplossing, of corrigeerde Micha je? Werk de les en het onderdeel bij in de bron-repo (zie het begin van LESSONS.md), niet enkel in deze app.
<!-- luyens-skills:end -->

## Repo layout
- `client/` Vite + React + PWA (serves from `client/dist/`). Game logic in `client/src/lib/game.js` (pure), layout/drop targets in `layout.js`, themes/pips in `themes.js`/`pips.js`, card art in `CardArt.jsx`, storage in `storage.js`. SW registration in `lib/register-sw.js`, service worker in `src/sw.js`. Tests in `src/lib/*.test.js` (Node test).
- `server/` Express 5 (`server/index.js`), serves `client/dist` and `GET /api/health`. No DB/login; state in localStorage. No backup needed (deploy has backup files but README says none needed). Listens on 127.0.0.1:3008 by default.
- `e2e/` Playwright tests, config in `e2e/playwright.config.js`. Icons generator `e2e/make-icons.mjs`.
- `deploy/` nginx + `deploy/deploy.sh`. `.luyens/components.json` pins shared skills (`app-pwa`, `app-tests`, `app-deploy`).

## Commands
- **Client dev**: `cd client && npm run dev` (proxies `/api` to 3008).
- **Client build+test**: `cd client && npm ci && npm run build && npm test`.
- **Server**: `cd server && npm ci && npm start` (http://127.0.0.1:3008). Requires built client in `../client/dist` or returns 503.
- **Server tests**: `cd server && npm ci && npm test` (Node test in `test/*.test.js`).
- **E2E**: `cd e2e && npm ci && npx playwright install chromium && npx playwright test`. CI also builds client and installs deps.
- **Icon regen**: `cd e2e && node make-icons.mjs`.

## Notes / gotchas
- **PWA/cache**: Server sets `Cache-Control: no-cache` for `sw.js`, `index.html`, `site.webmanifest` so new versions are picked up immediately.
- **Port/host**: Server defaults `PORT` 3008, binds `127.0.0.1` (behind nginx). Env in `server/.env.example` (`PORT`, `APP_URL`, `NODE_ENV`).
- **Node**: Server requires Node >=22.5; CI uses Node 22.
- **Deploy**: pm2 name `solitaire`, path `/home/micha/solitaire`, domain `https://solitaire.luyens.be/`. Update via `bash deploy/deploy.sh solitaire /home/micha/solitaire https://solitaire.luyens.be/ "cd server && npm ci --omit=dev && cd ../client && npm ci && npm run build"`. Uses nginx + deploy.sh (app-deploy v1.3.1).
- **Tests/CI**: GitHub Actions runs server tests, e2e (builds client), and nightly production health check of `/api/health` and `/`. Concurrency cancels older runs on same branch.
- **State**: No server-side game state; everything persisted in localStorage. No auth/backup needed.
- **Shared components**: Do not reimplement login/dock/swipe/backup - use luyens-skills per `.luyens/components.json`. Keep in sync via `node ~/.claude/skills/app-nieuw/scripts/kit.mjs status .`.
