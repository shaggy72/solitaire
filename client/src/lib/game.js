// Klondike-solitaire, één kaart trekken. Zuivere functies: elke zet geeft een nieuwe toestand terug.
// Kaart: { s: 0..3 (♠ ♥ ♦ ♣), r: 1..13, up: boolean }. Zwart = s 0 of 3, rood = s 1 of 2.
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'H'];
export const isRed = (c) => c.s === 1 || c.s === 2;
export const cardName = (c) => `${SUITS[c.s]}${RANKS[c.r]}`;

export function newDeck() {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ s, r, up: false });
  return d;
}

export function shuffle(deck, rng = Math.random) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function deal(rng = Math.random) {
  const deck = shuffle(newDeck(), rng);
  const tableau = [];
  let k = 0;
  for (let col = 0; col < 7; col++) {
    const pile = [];
    for (let i = 0; i <= col; i++) pile.push({ ...deck[k++], up: i === col });
    tableau.push(pile);
  }
  return { stock: deck.slice(k), waste: [], foundations: [[], [], [], []], tableau, score: 0, moves: 0 };
}

// Mag `card` op een stapel in de tableau (top = laatste kaart van `pile`)?
export function fitsTableau(card, pile) {
  const top = pile[pile.length - 1];
  if (!top) return card.r === 13;
  return top.up && isRed(top) !== isRed(card) && top.r === card.r + 1;
}

// Mag `card` op deze fundering? (Een lege fundering neemt enkel een aas.)
export function fitsFoundation(card, pile) {
  const top = pile[pile.length - 1];
  if (!top) return card.r === 1;
  return top.s === card.s && top.r + 1 === card.r;
}

// Welke fundering past voor deze kaart (-1 = geen)?
export function foundationFor(state, card) {
  const same = state.foundations.findIndex((f) => f.length && f[f.length - 1].s === card.s);
  if (same >= 0) return fitsFoundation(card, state.foundations[same]) ? same : -1;
  if (card.r !== 1) return -1;
  return state.foundations.findIndex((f) => f.length === 0);
}

// De kaarten die meeverhuizen als je `from` aantikt, of null als dat niet kan.
// from: { type: 'waste' } | { type: 'tableau', col, index } | { type: 'foundation', i }
export function grab(state, from) {
  if (from.type === 'waste') {
    const c = state.waste[state.waste.length - 1];
    return c ? [c] : null;
  }
  if (from.type === 'foundation') {
    const f = state.foundations[from.i];
    return f.length ? [f[f.length - 1]] : null;
  }
  const pile = state.tableau[from.col];
  const cards = pile.slice(from.index);
  if (!cards.length || !cards[0].up) return null;
  return cards;
}

// to: { type: 'tableau', col } | { type: 'foundation', i }
export function canMove(state, from, to) {
  const cards = grab(state, from);
  if (!cards) return false;
  if (to.type === 'foundation') {
    if (cards.length !== 1) return false;
    if (from.type === 'foundation' && from.i === to.i) return false;
    return fitsFoundation(cards[0], state.foundations[to.i]);
  }
  if (from.type === 'tableau' && from.col === to.col) return false;
  return fitsTableau(cards[0], state.tableau[to.col]);
}

export function move(state, from, to) {
  if (!canMove(state, from, to)) return state;
  const next = {
    ...state,
    waste: state.waste.slice(),
    foundations: state.foundations.map((f) => f.slice()),
    tableau: state.tableau.map((p) => p.slice()),
    moves: state.moves + 1,
  };
  let cards;
  let score = state.score;
  if (from.type === 'waste') cards = [next.waste.pop()];
  else if (from.type === 'foundation') cards = [next.foundations[from.i].pop()];
  else {
    cards = next.tableau[from.col].splice(from.index);
    const rest = next.tableau[from.col];
    const top = rest[rest.length - 1];
    if (top && !top.up) { rest[rest.length - 1] = { ...top, up: true }; score += 5; }
  }
  if (to.type === 'foundation') { next.foundations[to.i].push(...cards); score += 10; }
  else { next.tableau[to.col].push(...cards); if (from.type === 'waste') score += 5; }
  if (from.type === 'foundation') score -= 10;
  next.score = Math.max(0, score);
  return next;
}

// Trek kaarten uit de stapel (1, of 3 bij de driekaartvariant); is die leeg, leg dan de aflegstapel
// terug (zonder strafpunten). Bij 3 kaarten is enkel de bovenste speelbaar; de andere komen vrij
// zodra je die weglegt.
export function draw(state, count = 1) {
  if (state.stock.length) {
    const n = Math.max(1, Math.min(count, state.stock.length));
    const stock = state.stock.slice();
    const taken = stock.splice(stock.length - n, n).reverse(); // de bovenste kaart eerst op de aflegstapel
    return { ...state, stock, waste: [...state.waste, ...taken.map((c) => ({ ...c, up: true }))], moves: state.moves + 1 };
  }
  if (!state.waste.length) return state;
  const stock = state.waste.slice().reverse().map((c) => ({ ...c, up: false }));
  return { ...state, stock, waste: [], moves: state.moves + 1 };
}

export const isWon = (state) => state.foundations.every((f) => f.length === 13);

// Alles ligt open en er is niets meer te trekken: de rest gaat vanzelf naar de funderingen.
export const canAutoFinish = (state) =>
  !isWon(state) && !state.stock.length && !state.waste.length && state.tableau.every((p) => p.every((c) => c.up));

// De eerstvolgende zet van een bovenste kaart naar een fundering (voor dubbeltik en "afmaken").
export function autoFoundationMove(state) {
  const sources = [{ type: 'waste' }, ...state.tableau.map((p, col) => ({ type: 'tableau', col, index: p.length - 1 }))];
  for (const from of sources) {
    const cards = grab(state, from);
    if (!cards || cards.length !== 1) continue;
    const i = foundationFor(state, cards[0]);
    if (i >= 0) return { from, to: { type: 'foundation', i } };
  }
  return null;
}

// Alle zinvolle zetten, beste eerst. Een zet is zinvol als hij naar een fundering gaat, een gesloten
// kaart omdraait, een kolom leegmaakt of de bovenste aflegkaart op de tableau legt.
// Koningen heen en weer schuiven tellen niet (anders zou een tip eindeloos kunnen blijven wisselen).
export function findMoves(state) {
  const list = [];
  const sources = [{ type: 'waste' }];
  state.tableau.forEach((p, col) => p.forEach((c, index) => { if (c.up) sources.push({ type: 'tableau', col, index }); }));
  for (const from of sources) {
    const cards = grab(state, from);
    if (!cards) continue;
    for (let i = 0; i < 4; i++) {
      const to = { type: 'foundation', i };
      if (canMove(state, from, to)) list.push({ from, to, rank: 0 });
    }
    for (let col = 0; col < 7; col++) {
      const to = { type: 'tableau', col };
      if (!canMove(state, from, to)) continue;
      if (from.type === 'waste') { list.push({ from, to, rank: 3 }); continue; }
      if (from.index === 0) {
        if (cards[0].r !== 13) list.push({ from, to, rank: 2 }); // kolom leegmaken
      } else if (!state.tableau[from.col][from.index - 1].up) list.push({ from, to, rank: 1 }); // gesloten kaart omdraaien
    }
  }
  list.sort((a, b) => a.rank - b.rank);
  return list;
}

// Kan trekken (en de aflegstapel terugleggen) nog een kaart opleveren die ergens op past?
export function drawHelps(state) {
  return [...state.stock, ...state.waste].some((card) =>
    foundationFor(state, card) >= 0 || state.tableau.some((p) => fitsTableau(card, p)));
}

// Een tip: { kind: 'move', from, to, cards } | { kind: 'draw' } | { kind: 'stuck' } | { kind: 'won' }
export function hint(state) {
  if (isWon(state)) return { kind: 'won' };
  const m = findMoves(state)[0];
  if (m) return { kind: 'move', from: m.from, to: m.to, cards: grab(state, m.from) };
  if (drawHelps(state)) return { kind: 'draw' };
  return { kind: 'stuck' };
}

// Ongedaan maken: `history` is een lijst van eerdere toestanden.
export const MAX_HISTORY = 300;
export function push(history, state) {
  const h = [...history, state];
  return h.length > MAX_HISTORY ? h.slice(h.length - MAX_HISTORY) : h;
}
