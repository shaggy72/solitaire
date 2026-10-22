import test from 'node:test';
import assert from 'node:assert/strict';
import { measure, place, dropTarget } from './layout.js';

const c = (s, r, up = true) => ({ s, r, up });
const empty = () => ({ stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []], score: 0, moves: 0 });
const SIZES = { staand: [820, 1000], liggend: [1180, 684], 'groot liggend': [1366, 900], smal: [700, 900] };
const centerCol = (L, col) => [L.colX(col) + L.cw / 2, L.tableauY + L.ch];
const centerFound = (L, i) => { const p = L.foundXY(i); return [p.x + L.cw / 2, p.y + L.ch / 2]; };

test('liggend krijgt grotere kaarten dan staand met dezelfde hoogte', () => {
  assert.equal(measure(1180, 684).mode, 'landscape');
  assert.equal(measure(820, 1000).mode, 'portrait');
  assert.ok(measure(1180, 684).cw >= 110, `kaartbreedte ${measure(1180, 684).cw}`);
});

for (const [naam, [W, H]] of Object.entries(SIZES)) {
  test(`${naam} (${W}x${H}): alle plekken blijven binnen het bord en overlappen niet`, () => {
    const L = measure(W, H);
    const spots = [L.stockXY, L.wasteXY, ...[0, 1, 2, 3].map(L.foundXY), ...[0, 1, 2, 3, 4, 5, 6].map((col) => ({ x: L.colX(col), y: L.tableauY }))];
    for (const p of spots) {
      assert.ok(p.x >= 0 && p.x + L.cw <= W + 1, `x=${p.x} valt buiten ${W}`);
      assert.ok(p.y >= 0 && p.y + L.ch <= H + 1, `y=${p.y} valt buiten ${H}`);
    }
    // Stapel, aflegstapel en tableaukolommen mogen elkaar niet raken (de funderingen mogen verticaal een beetje overlappen).
    const solid = [L.stockXY, L.wasteXY, ...[0, 1, 2, 3, 4, 5, 6].map((col) => ({ x: L.colX(col), y: L.tableauY }))];
    solid.forEach((a, i) => solid.slice(i + 1).forEach((b) => {
      const overlap = a.x < b.x + L.cw && b.x < a.x + L.cw && a.y < b.y + L.ch && b.y < a.y + L.ch;
      assert.ok(!overlap, `plekken overlappen: ${JSON.stringify([a, b])}`);
    }));
  });

  test(`${naam}: een heel lange kolom past in de hoogte`, () => {
    const L = measure(W, H);
    const g = empty();
    g.tableau[6] = [...Array.from({ length: 6 }, (_, i) => c(i % 4, 13, false)), ...Array.from({ length: 12 }, (_, i) => c(i % 4, 12 - i))];
    for (const p of place(g, L)) assert.ok(p.y + L.ch <= H + 1, `kaart op y=${p.y} valt buiten het bord`);
  });

  test(`${naam}: loslaten op een fundering of kolom geeft de juiste bestemming`, () => {
    const L = measure(W, H);
    const g = empty();
    g.tableau[0] = [c(0, 1)];
    g.tableau[1] = [c(1, 2)];
    const from = { type: 'tableau', col: 0, index: 0 };
    assert.deepEqual(dropTarget(g, L, from, ...centerFound(L, 2)), { type: 'foundation', i: 2 }, 'op een andere fundering dan de eerste');
    assert.deepEqual(dropTarget(g, L, from, ...centerCol(L, 1)), { type: 'tableau', col: 1 });
  });

  test(`${naam}: loslaten waar de kaart niet past geeft null`, () => {
    const L = measure(W, H);
    const g = empty();
    g.tableau[0] = [c(0, 5)];
    g.tableau[1] = [c(1, 9)];
    const from = { type: 'tableau', col: 0, index: 0 };
    assert.equal(dropTarget(g, L, from, ...centerCol(L, 1)), null);
    assert.equal(dropTarget(g, L, from, ...centerFound(L, 1)), null);
    assert.equal(dropTarget(g, L, from, W / 2, H * 5), null, 'ver buiten het bord');
  });
}

test('de funderingen hebben een eigen laag, ook als er een volle fundering naast een lege ligt', () => {
  const g = empty();
  g.foundations[0] = Array.from({ length: 13 }, (_, i) => c(0, i + 1));
  g.foundations[1] = [c(1, 1)];
  const zs = place(g, measure(1180, 684)).filter((p) => p.loc.type === 'foundation');
  const top0 = Math.max(...zs.filter((p) => p.loc.i === 0).map((p) => p.z));
  const bottom1 = Math.min(...zs.filter((p) => p.loc.i === 1).map((p) => p.z));
  assert.ok(bottom1 > top0);
});
