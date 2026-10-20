// Solitaire: kleine Express-server die enkel de gebouwde client en /api/health aanbiedt.
// Geen database, geen login: het spel wordt in het toestel zelf bewaard.
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.PORT) || 3008;
const DIST = join(import.meta.dirname, '..', 'client', 'dist');

const app = express();
app.disable('x-powered-by');
app.get('/api/health', (_q, r) => r.json({ ok: true }));

// De service worker en index.html nooit lang bewaren, zodat een nieuwe versie meteen opgepikt wordt.
const noCache = (res) => res.setHeader('Cache-Control', 'no-cache');
app.use(express.static(DIST, {
  setHeaders: (res, path) => { if (/(sw\.js|index\.html|site\.webmanifest)$/.test(path)) noCache(res); },
}));
app.use('/api', (_q, r) => r.status(404).json({ error: 'Niet gevonden' }));
app.use((_q, res) => {
  noCache(res);
  if (existsSync(join(DIST, 'index.html'))) res.sendFile(join(DIST, 'index.html'));
  else res.status(503).send('De app is nog niet gebouwd.');
});

app.listen(PORT, '127.0.0.1', () => console.log(`Solitaire luistert op poort ${PORT}`));
