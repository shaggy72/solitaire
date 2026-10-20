import test from 'node:test';
import assert from 'node:assert/strict';
import { registerServiceWorker } from './register-sw.js';

// Nepbrowser: net genoeg om de updatelogica te testen.
function fakeBrowser({ controller }) {
  const sw = new EventTarget();
  sw.controller = controller ? {} : null;
  const reg = { updates: 0, update() { this.updates++; } };
  sw.register = async () => reg;
  const doc = Object.assign(new EventTarget(), { readyState: 'complete', visibilityState: 'hidden' });
  Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: sw }, configurable: true });
  globalThis.document = doc;
  globalThis.window = globalThis;
  return { sw, reg, doc };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('herlaadt bij een nieuwe versie, maar maar één keer', async () => {
  const { sw } = fakeBrowser({ controller: true });
  let reloads = 0;
  registerServiceWorker({ reload: () => { reloads++; } });
  sw.dispatchEvent(new Event('controllerchange'));
  sw.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads, 1);
});

test('herlaadt niet bij de allereerste installatie', async () => {
  const { sw } = fakeBrowser({ controller: false });
  let reloads = 0;
  registerServiceWorker({ reload: () => { reloads++; } });
  sw.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads, 0);
});

test('controleert op een nieuwe versie zodra de app weer zichtbaar wordt', async () => {
  const { reg, doc } = fakeBrowser({ controller: true });
  registerServiceWorker({ reload: () => {} });
  await tick();
  doc.visibilityState = 'hidden'; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(reg.updates, 0);
  doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(reg.updates, 1);
});
