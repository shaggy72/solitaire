// Het lopende spel wordt in het toestel bewaard (geen account). Alles in try/catch: privé-modus of
// geblokkeerde opslag mag het spel nooit stukmaken.
const KEY = 'solitaire-v1';

const validCard = (c) => c && Number.isInteger(c.s) && c.s >= 0 && c.s < 4 && Number.isInteger(c.r) && c.r >= 1 && c.r <= 13 && typeof c.up === 'boolean';
const validState = (g) =>
  g && Array.isArray(g.stock) && Array.isArray(g.waste) && Array.isArray(g.foundations) && g.foundations.length === 4
  && Array.isArray(g.tableau) && g.tableau.length === 7
  && [...g.stock, ...g.waste, ...g.foundations.flat(), ...g.tableau.flat()].length === 52
  && [...g.stock, ...g.waste, ...g.foundations.flat(), ...g.tableau.flat()].every(validCard)
  && Number.isFinite(g.score) && Number.isFinite(g.moves);

export function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (!validState(data?.game)) return null;
    const history = Array.isArray(data.history) ? data.history.filter(validState) : [];
    return { game: data.game, history };
  } catch { return null; }
}

export function save(game, history) {
  try { localStorage.setItem(KEY, JSON.stringify({ game, history })); } catch { /* opslag niet beschikbaar */ }
}

const THEME_KEY = 'solitaire-theme';
export function loadTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}
export function saveTheme(id) {
  try { localStorage.setItem(THEME_KEY, id); } catch { /* opslag niet beschikbaar */ }
}

// Hoeveel kaarten er per keer van de stapel gaan: 1 of 3 (de driekaartvariant).
const DRAW_KEY = 'solitaire-draw';
export function loadDraw() {
  try { return Number(localStorage.getItem(DRAW_KEY)) === 3 ? 3 : 1; } catch { return 1; }
}
export function saveDraw(count) {
  try { localStorage.setItem(DRAW_KEY, String(count === 3 ? 3 : 1)); } catch { /* opslag niet beschikbaar */ }
}
