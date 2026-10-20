import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deal, draw, move, canMove, hint, isWon, canAutoFinish, autoFoundationMove, fitsTableau, fitsFoundation,
  foundationFor, findMoves, push, MAX_HISTORY,
} from './game.js';

const c = (s, r, up = true) => ({ s, r, up });
const empty = () => ({ stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []], score: 0, moves: 0 });
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

test('delen: 28 kaarten op de tableau, 24 in de stapel, bovenste open, alle 52 uniek', () => {
  const g = deal(seeded());
  assert.deepEqual(g.tableau.map((p) => p.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(g.stock.length, 24);
  for (const p of g.tableau) p.forEach((card, i) => assert.equal(card.up, i === p.length - 1));
  const all = [...g.stock, ...g.tableau.flat()];
  assert.equal(new Set(all.map((x) => `${x.s}-${x.r}`)).size, 52);
});

test('tableau: afwisselende kleur, aflopend; enkel een heer op een lege kolom', () => {
  assert.ok(fitsTableau(c(0, 6), [c(1, 7)])); // zwarte 6 op rode 7
  assert.ok(!fitsTableau(c(3, 6), [c(0, 7)])); // zwart op zwart
  assert.ok(!fitsTableau(c(0, 5), [c(1, 7)])); // niet opeenvolgend
  assert.ok(!fitsTableau(c(0, 6), [c(1, 7, false)])); // gesloten kaart
  assert.ok(fitsTableau(c(2, 13), []));
  assert.ok(!fitsTableau(c(2, 12), []));
});

test('fundering: aas eerst, daarna dezelfde soort oplopend', () => {
  assert.ok(fitsFoundation(c(0, 1), []));
  assert.ok(!fitsFoundation(c(0, 2), []));
  assert.ok(fitsFoundation(c(0, 2), [c(0, 1)]));
  assert.ok(!fitsFoundation(c(1, 2), [c(0, 1)]));
  const g = empty();
  g.foundations[2] = [c(1, 1)];
  assert.equal(foundationFor(g, c(1, 2)), 2);
  assert.equal(foundationFor(g, c(0, 1)), 0);
  assert.equal(foundationFor(g, c(0, 5)), -1);
});

test('trekken: kaart gaat open naar de aflegstapel; lege stapel wordt teruggelegd in dezelfde volgorde', () => {
  let g = { ...empty(), stock: [c(0, 3, false), c(1, 5, false)] }; // de 5 ligt bovenaan
  g = draw(g);
  assert.equal(g.waste[0].r, 5);
  assert.ok(g.waste[0].up);
  g = draw(g);
  assert.equal(g.stock.length, 0);
  g = draw(g); // terugleggen
  assert.equal(g.waste.length, 0);
  assert.equal(g.stock.length, 2);
  assert.ok(g.stock.every((x) => !x.up));
  assert.equal(draw(g).waste[0].r, 5, 'zelfde volgorde als de eerste keer');
});

test('verplaatsen van een stapel meerdere kaarten draait de kaart eronder om (+5)', () => {
  const g = empty();
  g.tableau[0] = [c(0, 9, false), c(1, 7), c(0, 6)];
  g.tableau[1] = [c(0, 8)];
  const from = { type: 'tableau', col: 0, index: 1 };
  assert.ok(canMove(g, from, { type: 'tableau', col: 1 }));
  const n = move(g, from, { type: 'tableau', col: 1 });
  assert.equal(n.tableau[1].length, 3);
  assert.equal(n.tableau[0].length, 1);
  assert.ok(n.tableau[0][0].up);
  assert.equal(n.score, 5);
  assert.equal(g.tableau[0].length, 3, 'de oude toestand blijft ongewijzigd');
});

test('een ongeldige zet verandert niets', () => {
  const g = empty();
  g.tableau[0] = [c(0, 9)];
  g.tableau[1] = [c(0, 8)];
  const from = { type: 'tableau', col: 0, index: 0 };
  assert.equal(move(g, from, { type: 'tableau', col: 1 }), g);
  assert.equal(move(g, { type: 'tableau', col: 0, index: 5 }, { type: 'tableau', col: 1 }), g);
});

test('naar de fundering: +10; meerdere kaarten tegelijk mag niet', () => {
  const g = empty();
  g.tableau[0] = [c(0, 2), c(1, 1)];
  const n = move(g, { type: 'tableau', col: 0, index: 1 }, { type: 'foundation', i: 0 });
  assert.equal(n.foundations[0].length, 1);
  assert.equal(n.score, 10);
  assert.ok(!canMove(g, { type: 'tableau', col: 0, index: 0 }, { type: 'foundation', i: 0 }));
});

test('uit de fundering terugnemen kost 10 punten maar nooit onder nul', () => {
  const g = empty();
  g.foundations[0] = [c(0, 1)];
  g.tableau[0] = [c(1, 2)];
  g.score = 4;
  const n = move(g, { type: 'foundation', i: 0 }, { type: 'tableau', col: 0 });
  assert.equal(n.score, 0);
});

test('winnen en automatisch afmaken', () => {
  const g = empty();
  for (let i = 0; i < 4; i++) g.foundations[i] = Array.from({ length: 13 }, (_, k) => c(i, k + 1));
  assert.ok(isWon(g));
  assert.equal(hint(g).kind, 'won');
  const h = empty();
  h.foundations[0] = [c(0, 1)];
  h.tableau[0] = [c(0, 2), c(1, 1)];
  assert.ok(canAutoFinish(h));
  let s = h;
  for (let guard = 0; guard < 10; guard++) {
    const m = autoFoundationMove(s);
    if (!m) break;
    s = move(s, m.from, m.to);
  }
  assert.equal(s.foundations.flat().length, 3);
  assert.ok(!canAutoFinish({ ...h, stock: [c(2, 5, false)] }));
});

test('tip: fundering gaat voor, dan omdraaien, dan trekken, anders vast', () => {
  let g = empty();
  g.tableau[0] = [c(0, 9, false), c(1, 7)];
  g.tableau[1] = [c(0, 8), c(2, 1)];
  const t = hint(g);
  assert.equal(t.kind, 'move');
  assert.equal(t.to.type, 'foundation'); // aas eerst

  g = empty();
  g.tableau[0] = [c(0, 9, false), c(1, 7)];
  g.tableau[1] = [c(0, 8)];
  const t2 = hint(g);
  assert.equal(t2.kind, 'move');
  assert.deepEqual(t2.to, { type: 'tableau', col: 1 });

  g = empty();
  g.tableau[0] = [c(0, 9)];
  g.stock = [c(1, 8, false)];
  assert.equal(hint(g).kind, 'draw');

  g = empty();
  g.tableau[0] = [c(0, 9)];
  g.stock = [c(1, 3, false)];
  assert.equal(hint(g).kind, 'stuck', 'trekken helpt niet meer');
});

test('tip stelt geen heer voor die van de ene lege kolom naar de andere gaat', () => {
  const g = empty();
  g.tableau[0] = [c(0, 13)];
  assert.equal(findMoves(g).length, 0);
});

test('ongedaan maken: de geschiedenis is begrensd', () => {
  let h = [];
  for (let i = 0; i < MAX_HISTORY + 20; i++) h = push(h, { n: i });
  assert.equal(h.length, MAX_HISTORY);
  assert.equal(h[h.length - 1].n, MAX_HISTORY + 19);
});

test('een heel spel met alleen tips en trekken eindigt altijd (geen oneindige lus)', () => {
  for (let seed = 1; seed <= 25; seed++) {
    let g = deal(seeded(seed));
    let steps = 0;
    let idleDraws = 0;
    while (steps++ < 3000) {
      if (isWon(g)) break;
      const t = hint(g);
      if (t.kind === 'move') { g = move(g, t.from, t.to); idleDraws = 0; }
      else if (t.kind === 'draw') { g = draw(g); if (++idleDraws > 60) assert.fail(`lus bij seed ${seed}`); }
      else break;
    }
    assert.ok(steps < 3000, `seed ${seed} liep niet af`);
  }
});
