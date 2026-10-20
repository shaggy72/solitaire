// Rooktest: de echte server start, meldt zich gezond en geeft onbekende API-paden netjes een 404.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let srv;
test.before(async () => { srv = await startServer(); });
test.after(async () => { await srv?.stop(); });

test('de server start en meldt zich gezond', async () => {
  const r = await fetch(`${srv.base}/api/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test('een onbekend API-pad geeft 404 in JSON, geen app', async () => {
  const r = await fetch(`${srv.base}/api/bestaat-niet`);
  assert.equal(r.status, 404);
  assert.ok((await r.json()).error);
});
