// Testhulp: start de ECHTE server (index.js) als apart proces met een eigen tijdelijke datamap,
// een vrije poort en zonder geheimen van deze machine (geen echte mails, betalingen of API's).
// Elk testbestand start zijn eigen server, zodat tests elkaars gegevens nooit zien.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SERVER_DIR = join(import.meta.dirname, '..');
export const PASSWORD = 'test-wachtwoord-123';

const freePort = () => new Promise((ok, no) => {
  const s = createServer();
  s.on('error', no);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
});

// Enkel wat Node zelf nodig heeft; geen RESEND_API_KEY e.d. uit de omgeving van de ontwikkelaar.
const baseEnv = () => Object.fromEntries(
  ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE'].filter((k) => process.env[k]).map((k) => [k, process.env[k]]),
);

/**
 * seed({ dataDir }): optioneel, vult de datamap vóór de server start (zie seed.js).
 * env: extra omgevingsvariabelen voor de server.
 * Geeft { base, dataDir, stop, logs }.
 */
export async function startServer({ seed, env = {} } = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'app-test-'));
  if (seed) await seed({ dataDir });
  const port = await freePort();
  // Voor de browser en de app: 'localhost', want passkeys (WebAuthn) werken niet op een IP-adres.
  const base = `http://localhost:${port}`;
  const probe = `http://127.0.0.1:${port}`; // de server luistert enkel op 127.0.0.1
  let log = '';
  const child = spawn(process.execPath, ['index.js'], {
    cwd: SERVER_DIR,
    env: { ...baseEnv(), NODE_ENV: 'test', PORT: String(port), DATA_DIR: dataDir, APP_URL: base, SESSION_SECRET: 'test-secret-test-secret-test-secret', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  let exited = false;
  child.on('exit', () => { exited = true; });

  const stop = async () => {
    if (!exited) { child.kill(); await new Promise((r) => { child.on('exit', r); setTimeout(r, 3000); }); }
    rmSync(dataDir, { recursive: true, force: true });
  };

  for (let i = 0; i < 100; i++) {
    if (exited) throw new Error(`Server stopte meteen:\n${log}`);
    try { if ((await fetch(`${probe}/api/health`)).ok) return { base, dataDir, stop, logs: () => log }; } catch { /* nog niet klaar */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  await stop();
  throw new Error(`Server werd niet gezond binnen 15 s:\n${log}`);
}

// Kleine fetch-helper met cookies (sessie). Gebruik: const api = client(srv.base); await api('/api/auth/me').
export function client(base) {
  let cookie = '';
  return async (path, body, method = body === undefined ? 'GET' : 'POST') => {
    const r = await fetch(base + path, {
      method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = r.headers.getSetCookie?.()[0];
    if (set) cookie = set.split(';')[0];
    return { status: r.status, json: await r.json().catch(() => null) };
  };
}
