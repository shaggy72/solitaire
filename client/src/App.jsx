import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  deal, draw, move, canMove, grab, hint, isWon, canAutoFinish, autoFoundationMove, foundationFor, push, isRed,
} from './lib/game.js';
import { measure, place, cardKey, dropTarget } from './lib/layout.js';
import { loadSaved, save, loadTheme, saveTheme } from './lib/storage.js';
import { THEMES, themeById } from './lib/themes.js';
import CardFace from './CardArt.jsx';
import Confetti from './Confetti.jsx';

const SUIT_NAMES = ['schoppen', 'harten', 'ruiten', 'klaveren'];
const RANK_NAMES = ['', 'aas', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'boer', 'dame', 'heer'];
const name = (c) => `${SUIT_NAMES[c.s]} ${RANK_NAMES[c.r]}`;
const START_MSG = 'Tik op een kaart en daarna op de plek waar hij naartoe moet, of sleep de kaart.';
const DOUBLE_TAP_MS = 380;
const DRAG_START_PX = 8;

const sameLoc = (a, b) => a && b && a.type === b.type && a.col === b.col && a.i === b.i && a.index === b.index;
const destOf = (loc) => (loc.type === 'tableau' ? { type: 'tableau', col: loc.col } : loc.type === 'foundation' ? { type: 'foundation', i: loc.i } : null);

function describeTip(game, tip) {
  if (tip.kind === 'draw') return 'Trek een kaart van de stapel linksboven.';
  if (tip.kind === 'stuck') return 'Er zijn geen zetten meer. Maak een zet ongedaan of begin een nieuw spel.';
  if (tip.kind === 'won') return 'Het spel is al uitgespeeld!';
  const card = tip.cards[0];
  const what = tip.cards.length > 1 ? `de ${name(card)} (met de kaarten erop)` : `de ${name(card)}`;
  if (tip.to.type === 'foundation') return `Leg ${what} bovenaan op de stapel rechtsboven.`;
  const pile = game.tableau[tip.to.col];
  const top = pile[pile.length - 1];
  return top ? `Leg ${what} op de ${name(top)}.` : `Leg ${what} op de lege plek.`;
}

export default function App() {
  const [initial] = useState(() => loadSaved());
  const [game, setGame] = useState(() => initial?.game ?? deal());
  const [history, setHistory] = useState(() => initial?.history ?? []);
  const [sel, setSel] = useState(null);
  const [tip, setTip] = useState(null);
  const [msg, setMsg] = useState('');
  const [confirmNew, setConfirmNew] = useState(false);
  const [auto, setAuto] = useState(false);
  const [themeId, setThemeId] = useState(() => themeById(loadTheme()).id);
  const [pickTheme, setPickTheme] = useState(false);
  const theme = themeById(themeId);
  const [size, setSize] = useState({ W: 0, H: 0 });
  const boardRef = useRef(null);
  const lastTap = useRef({ loc: null, t: 0 });
  const [drag, setDrag] = useState(null); // { loc, dx, dy } terwijl een kaart gesleept wordt
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const won = isWon(game);

  useEffect(() => { save(game, history); }, [game, history]);
  const chooseTheme = (id) => { setThemeId(id); saveTheme(id); setPickTheme(false); };

  useLayoutEffect(() => {
    const el = boardRef.current;
    const update = () => setSize({ W: el.clientWidth, H: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measured = size.W > 0 && size.H > 0; // pas tekenen na de eerste meting, anders vliegen de kaarten bij het openen naar hun plek
  const L = useMemo(() => measure(size.W || 800, size.H || 600), [size]);
  const placed = useMemo(() => place(game, L), [game, L]);

  const commit = useCallback((next, message = '') => {
    if (next === game) return;
    setHistory((h) => push(h, game));
    setGame(next);
    setSel(null);
    setTip(null);
    setMsg(message);
  }, [game]);

  // Maakt de rest vanzelf af, kaart voor kaart, als alles al open ligt.
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => {
      const m = autoFoundationMove(game);
      if (!m) { setAuto(false); return; }
      setGame(move(game, m.from, m.to));
    }, 150);
    return () => clearTimeout(t);
  }, [auto, game]);

  const startAuto = () => { setHistory((h) => push(h, game)); setSel(null); setTip(null); setMsg(''); setAuto(true); };

  const onUndo = () => {
    if (!history.length || auto) return;
    setGame(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSel(null); setTip(null); setMsg('Je laatste zet is ongedaan gemaakt.');
  };

  const onTip = () => {
    if (auto || won) return;
    const t = hint(game);
    setSel(null);
    setTip(t);
    setMsg(describeTip(game, t));
  };

  const newGame = () => {
    setGame(deal()); setHistory([]); setSel(null); setTip(null); setMsg(''); setConfirmNew(false); setAuto(false);
  };
  const askNew = () => { if (won || game.moves === 0) newGame(); else setConfirmNew(true); };

  const onTap = (loc) => {
    if (auto || won) return;
    if (loc.type === 'stock') { commit(draw(game)); return; }
    const now = Date.now();
    const dbl = sameLoc(lastTap.current.loc, loc) && now - lastTap.current.t < DOUBLE_TAP_MS;
    lastTap.current = { loc, t: now };

    // Dubbeltik: de bovenste kaart meteen naar boven (de funderingen).
    if (dbl && loc.type !== 'foundation') {
      const cards = grab(game, loc);
      if (cards && cards.length === 1) {
        const i = foundationFor(game, cards[0]);
        if (i >= 0) { commit(move(game, loc, { type: 'foundation', i })); return; }
      }
    }
    const dest = destOf(loc);
    if (sel && dest && !sameLoc(sel, loc)) {
      if (canMove(game, sel, dest)) { commit(move(game, sel, dest)); return; }
    }
    if (sameLoc(sel, loc)) { setSel(null); setMsg(''); return; }
    const cards = grab(game, loc);
    if (cards) {
      setSel(loc); setTip(null);
      setMsg(`Gekozen: ${name(cards[0])}. Tik nu op de plek waar hij naartoe moet.`);
    } else if (sel && dest) {
      setSel(null);
      setMsg('Daar past die kaart niet. Kies een andere plek.');
    } else {
      setSel(null);
    }
  };

  // Slepen: een kaart (of stapel) oppakken en loslaten op een kolom of een fundering. Een korte tik blijft een tik.
  const onPointerDown = (e, loc) => {
    if (auto || won || loc.type === 'stock' || e.button > 0 || !grab(game, loc)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { loc, id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_START_PX) return;
      d.active = true;
      setSel(null); setTip(null); setMsg('');
    }
    setDrag({ loc: d.loc, dx, dy });
  };
  const onPointerEnd = (e, cancelled) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    dragRef.current = null;
    if (!d.active) return;
    suppressClick.current = true;
    setTimeout(() => { suppressClick.current = false; }, 60);
    setDrag(null);
    if (cancelled) return;
    const first = placed.find((p) => sameLoc(p.loc, d.loc));
    if (!first) return;
    const to = dropTarget(game, L, d.loc, first.x + (e.clientX - d.x0) + L.cw / 2, first.y + (e.clientY - d.y0) + L.ch / 2);
    if (to) commit(move(game, d.loc, to));
    else if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > L.cw * 0.5) setMsg('Daar past die kaart niet. Hij gaat terug naar zijn plek.');
  };

  const selKeys = new Set(sel ? (grab(game, sel) ?? []).map(cardKey) : []);
  const dragKeys = new Set(drag ? (grab(game, drag.loc) ?? []).map(cardKey) : []);
  const tipKeys = new Set(tip?.kind === 'move' ? tip.cards.map(cardKey) : []);
  let tipRing = null;
  if (tip?.kind === 'move') {
    if (tip.to.type === 'foundation') tipRing = L.foundXY(tip.to.i);
    else {
      const last = placed.filter((p) => p.loc.type === 'tableau' && p.loc.col === tip.to.col).pop();
      tipRing = last ? { x: last.x, y: last.y } : { x: L.colX(tip.to.col), y: L.tableauY };
    }
  } else if (tip?.kind === 'draw') tipRing = L.stockXY;

  const cardStyle = { width: L.cw, height: L.ch };
  const slot = (x, y, cls, loc, label, text) => (
    <div key={cls + x + y} className={`slot ${cls}`} style={{ transform: `translate(${x}px, ${y}px)`, ...cardStyle }}
      onClick={() => onTap(loc)} role="button" aria-label={label}>{text}</div>
  );

  return (
    <div className="app" style={theme.vars} data-theme={theme.id}>
      <header className="bar">
        <div className="stats" aria-live="polite">
          <span><small>Score</small><b>{game.score}</b></span>
          <span><small>Zetten</small><b>{game.moves}</b></span>
        </div>
        <div className="buttons">
          <button className="btn" onClick={onUndo} disabled={!history.length || auto}>↩ Ongedaan maken</button>
          <button className="btn" onClick={onTip} disabled={auto || won}>💡 Tip</button>
          <button className="btn" onClick={() => setPickTheme(true)}>🎴 Kaarten</button>
          <button className="btn quiet" onClick={askNew}>Nieuw spel</button>
        </div>
      </header>

      <div className="message" role="status">
        <span>{msg || START_MSG}</span>
        {canAutoFinish(game) && !auto && !won && (
          <button className="btn go" onClick={startAuto}>Maak het af</button>
        )}
      </div>

      <main className="board" ref={boardRef} style={{ '--cw': `${L.cw}px` }}>
        {measured && <>
        {slot(L.stockXY.x, L.stockXY.y, 'stock', { type: 'stock' }, 'Stapel', game.stock.length === 0 && game.waste.length > 0 ? '↻' : '')}
        {[0, 1, 2, 3].map((i) => slot(L.foundXY(i).x, L.foundXY(i).y, 'found', { type: 'foundation', i }, 'Plek voor een aas', 'A'))}
        {[0, 1, 2, 3, 4, 5, 6].map((col) => slot(L.colX(col), L.tableauY, 'empty', { type: 'tableau', col }, 'Lege plek', 'H'))}

        {placed.map(({ card, loc, x, y, z }) => {
          const base = loc.type === 'foundation' || loc.type === 'waste' ? 100 : loc.type === 'tableau' ? 10 : 0;
          const k = cardKey(card);
          const dragging = dragKeys.has(cardKey(card));
          const cls = ['card', card.up ? 'up' : 'down', isRed(card) ? 'red' : 'black',
            selKeys.has(k) && 'sel', tipKeys.has(k) && 'tipfrom', dragKeys.has(k) && 'drag'].filter(Boolean).join(' ');
          return (
            <div key={k} data-pile={loc.type} className={cls} style={{ ...cardStyle, transform: `translate(${x + (dragging ? drag.dx : 0)}px, ${y + (dragging ? drag.dy : 0)}px)`, zIndex: dragging ? 500 + z : base + z }}
              onPointerDown={(e) => onPointerDown(e, loc)} onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerEnd(e, false)} onPointerCancel={(e) => onPointerEnd(e, true)}
              onClick={() => { if (!suppressClick.current) onTap(loc); }} role="button" aria-label={card.up ? name(card) : 'Gesloten kaart'}>
              {card.up && <CardFace card={card} theme={theme} />}
            </div>
          );
        })}

        {tipRing && <div className="ring" style={{ ...cardStyle, transform: `translate(${tipRing.x}px, ${tipRing.y}px)` }} />}
        </>}
      </main>

      {pickTheme && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Kies je kaarten">
          <div className="dialog wide">
            <h2>Kies je kaarten</h2>
            <div className="themes">
              {THEMES.map((t) => (
                <button key={t.id} className={'themeopt' + (t.id === themeId ? ' current' : '')} style={t.vars} onClick={() => chooseTheme(t.id)} aria-pressed={t.id === themeId}>
                  <span className="preview" style={{ '--cw': '46px' }}>
                    <span className="card up black"><CardFace card={{ s: 0, r: 1, up: true }} theme={t} /></span>
                    <span className="card up red"><CardFace card={{ s: 1, r: 13, up: true }} theme={t} /></span>
                    <span className="card up black"><CardFace card={{ s: 3, r: 12, up: true }} theme={t} /></span>
                    <span className="card down" />
                  </span>
                  <b>{t.name}</b>
                </button>
              ))}
            </div>
            <div className="buttons"><button className="btn" onClick={() => setPickTheme(false)}>Sluiten</button></div>
          </div>
        </div>
      )}

      {confirmNew && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2>Nieuw spel beginnen?</h2>
            <p>Het spel dat je nu speelt gaat dan verloren.</p>
            <div className="buttons">
              <button className="btn" onClick={() => setConfirmNew(false)}>Nee, doorspelen</button>
              <button className="btn go" onClick={newGame}>Ja, nieuw spel</button>
            </div>
          </div>
        </div>
      )}

      {won && (
        <div className="overlay" role="dialog" aria-modal="true">
          <Confetti />
          <div className="dialog">
            <h2>Gewonnen! 🎉</h2>
            <p>Mooi gedaan! Je score is <b>{game.score}</b>.</p>
            <div className="buttons">
              <button className="btn go" onClick={newGame}>Nog een spelletje</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
