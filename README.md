# Solitaire

Eenvoudige Klondike-solitaire (één kaart trekken) voor een iPad, op **solitaire.luyens.be**. Geen inlog: wie de link heeft, kan spelen. Het lopende spel wordt in het toestel zelf bewaard (localStorage), er staat niets op de server.

## Spelen
- Tik op een kaart en daarna op de plek waar hij naartoe moet, of sleep de kaart er met je vinger naartoe (loslaten op een verkeerde plek: hij springt terug). Een stapel kaarten verhuist mee als je er een midden uit kiest.
- Dubbeltik op een kaart: hij gaat naar boven (de vier stapels rechtsboven), als hij daar past.
- Tik op de stapel linksboven om een kaart te trekken; is de stapel leeg, tik erop om opnieuw te beginnen.
- **Ongedaan maken** (onbeperkt), **Tip** (zegt in woorden wat kan en kleurt de kaart blauw), **Nieuw spel** (vraagt eerst bevestiging).
- Score: +10 naar boven, +5 omdraaien of aflegkaart op de tafel, −10 een kaart terugnemen van boven. Geen tijdsdruk, geen strafpunten voor opnieuw door de stapel gaan.
- Is alles open en de stapel leeg, dan verschijnt **Maak het af**. Bij winst: confetti.
- Kaartnamen zijn Belgisch: A (aas), B (boer), D (dame), H (heer).
- **Kaarten** (knop bovenaan): kies uit 6 ontwerpen: Standaard, Tuin, Modern, Goden, Antiek en Klassiek. De keuze wordt in het toestel bewaard. Het zijn eigen tekeningen (SVG, geen afbeeldingen) in de stijl van bekende kaartspellen, geen kopieën van bestaande kunstwerken.
- **Indeling:** staand staan stapel en funderingen bovenaan; liggend staan de stapel links en de funderingen rechts, zodat de kaarten groter zijn.

## Opbouw
- `client/` React + Vite (PWA: installeerbaar op het beginscherm, vernieuwt zichzelf bij een nieuwe versie).
  - `src/lib/game.js` spelregels als zuivere functies (getest in `game.test.js`), `layout.js` plaats van elke kaart (staand en liggend) en waar een losgelaten kaart landt (`dropTarget`), `themes.js` de kaartontwerpen en `pips.js` de plaats van de tekens, `CardArt.jsx` de tekeningen voor heer, dame en boer, `storage.js` bewaren.
- `server/` Express 5: serveert `client/dist` en `GET /api/health`. Geen database, dus geen back-up nodig.
- `e2e/` Playwright-browsertests; `e2e/make-icons.mjs` maakt de app-iconen opnieuw (`cd e2e && node make-icons.mjs`).
- Onderdelen uit de catalogus `luyens-skills`: `app-pwa`, `app-tests`, `app-deploy` (alleen nginx + `deploy.sh`; zonder de back-up). Zie `.luyens/components.json`.

## Lokaal draaien
```
cd client && npm ci && npm run build && npm test
cd ../server && npm ci && npm start        # http://127.0.0.1:3008
cd ../e2e && npm ci && npx playwright install chromium && npx playwright test
```
Voor ontwikkelen: `cd client && npm run dev` (proxyt `/api` naar poort 3008).

## Uitrollen (VPS)
Poort 3008, pm2-naam `solitaire`, map `/home/micha/solitaire`. Eerste keer: zie de skill `app-deploy`. Bijwerken:
```
bash deploy/deploy.sh solitaire /home/micha/solitaire https://solitaire.luyens.be/ "cd server && npm ci --omit=dev && cd ../client && npm ci && npm run build"
```
Omgevingsvariabelen: zie `server/.env.example` (`PORT`, `APP_URL`, `NODE_ENV`).
