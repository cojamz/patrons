// Hover cards for the Lamplit table: a pointer resting on a space, a rim plaque, a seat or a shop card shows what it
// is and what it would do; a tap (touch) pins the same card as a sheet. Every number comes from the engine:
// YOU GET from the dry run (previewSpace), standings from contestTable, pay from paymentPlan.
// UI-A's wheel calls onSpaceHover(key, el|null, { pinned }), plaques onPlaqueHover(qid, el|null); seats and shop
// cards are mine. GameScreen mounts <HoverCardLayer> once.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, roman, contestTable, cardDef, botLevel, BOT_LEVEL_INFO } from '../../engine/v4/index.js';
import { playerColor, standings } from '../format.js';
import { Popover } from './parts.jsx';
import { CardText, ContestStandings, MemberCard, CardName, YoudGet, usePreview, requestPreviews } from './Info.jsx';
import { SeatFigure } from './Glyphs.jsx';
import { Rich } from './Rich.jsx';
import { unlockedBy, surely } from './cards.js';
import { memberCopyTargets } from './cards.js';
import { DeckCard } from './MemberDeck.jsx';
import { SeatMembers } from './MemberUse.jsx';
import './lamp-b.css';
import { MO } from '../motion.js';

const RINGS = ['outer ring', 'middle ring', 'inner ring'];
const sphereOf = qid => quadrant(qid).resource;

/**
 * The hover/pin state: one card at a time. Opens the moment the pointer arrives (Cory: instant); moving to a neighbour swaps the card in place at once; leaving closes it 150ms later
 * (unless the pointer arrives somewhere else first). A tap pins it (a sheet on phones). Cory: instant and seamless.
 */
export const OPEN_MS = MO.hoverOpen, CLOSE_MS = MO.hoverClose; // src/v4/motion.js
/** Between two spaces: a pointer crossing the wheel's gutters keeps the card this long before it closes. */
export const GRACE_MS = 450;
const onWheel = from => {
  // the wheel the space being left belongs to (never some other box that happens to be called a stage)
  const st = lastPt && from && from.el && from.el.closest ? from.el.closest('.stage') : null;
  if (!st) return false;
  const b = st.getBoundingClientRect();
  return lastPt.x >= b.left && lastPt.x <= b.right && lastPt.y >= b.top && lastPt.y <= b.bottom;
};
/**
 * The hover state lives outside React's render path: the object is stable, `card` and `space` are getters, and only
 * the layer (useHoverCard) and the shop's tick (useHoverSpace) subscribe, so a hover never re-renders the table.
 */
export function useHoverCards() {
  const api = useRef(null);
  if (!api.current) api.current = createHover();
  useEffect(() => () => api.current.dispose(), []);
  return api.current;
}
export function createHover() {
  let card = null, openT = null, closeT = null;
  const subs = new Set();
  const set = next => { if (next === card) return; card = next; for (const fn of subs) fn(); };
  const show = next => {
    clearTimeout(closeT);
    if (!next.el) {
      clearTimeout(openT);
      // leaving a space for the wheel's gutter keeps the card a moment longer, so sweeping across the spaces hands it
      // from one to the next without a close/open flicker; leaving the wheel closes it at the usual pace
      const wait = next.kind === 'space' && card && card.kind === 'space' && onWheel(card) ? GRACE_MS : CLOSE_MS;
      closeT = setTimeout(() => { if (card && !card.pinned) set(null); }, wait);
      return;
    }
    clearTimeout(openT);
    if (next.pinned) { set(next); return; }
    if (card && card.pinned) return; // a pinned card stays until it's closed
    if (card) { set(next); return; } // a card is up: swap its content in place, no delay, no flicker
    if (!OPEN_MS) { set(next); return; } // at once: the layer only swaps, so crossing something can't flicker
    openT = setTimeout(() => { if (!(card && card.pinned)) set(next); }, OPEN_MS);
  };
  return {
    get card() { return card; },
    /** the space under the pointer (the shop ticks "✓ after X" for it) */
    get space() { return card && card.kind === 'space' ? card.key : null; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    close() { clearTimeout(openT); clearTimeout(closeT); set(null); },
    /** the pointer is on a card you can use (a seat's members: its Use button, its list scrolled): it stays */
    hold() { clearTimeout(closeT); },
    /** the pointer left that card: it closes as if it had left the target */
    letGo() { clearTimeout(closeT); closeT = setTimeout(() => { if (card && !card.pinned) set(null); }, CLOSE_MS); },
    onSpaceHover: (key, el, o = {}) => show({ kind: 'space', key, el, pinned: !!o.pinned }),
    onPlaqueHover: (qid, el, o = {}) => show({ kind: 'plaque', qid, el, pinned: !!o.pinned }),
    onSeatHover: (pid, el, o = {}) => show({ kind: 'seat', pid, el, pinned: !!o.pinned }),
    onCardHover: (uid, el, o = {}) => show({ kind: 'card', uid, el, pinned: !!o.pinned }),
    onDeckHover: (el, o = {}) => show({ kind: 'deck', el, pinned: !!o.pinned }),
    dispose() { clearTimeout(openT); clearTimeout(closeT); subs.clear(); },
  };
}
const NONE = () => () => {};
/** The card on screen (re-renders only the subscriber). */
export const useHoverCard = hover => useSyncExternalStore(hover ? hover.subscribe : NONE, () => (hover ? hover.card : null));
/** The space under the pointer, or null (re-renders only when it changes). */
export const useHoverSpace = hover => useSyncExternalStore(hover ? hover.subscribe : NONE, () => (hover ? hover.space : null));

/**
 * Warms the dry runs while nothing else is happening: after each new state, every space the viewer could take
 * gets its preview computed in idle time, so a hover never waits on one.
 */
export function usePreviewWarmup(state, pid) {
  useEffect(() => {
    if (pid == null || !state.pending || state.pending.player !== pid || state.pending.kind !== 'place') return;
    // every space you could take, worked out in the background (a worker in the browser) as soon as it's your move
    requestPreviews(state, pid, state.pending.options.filter(o => o.q != null && o.i != null).map(o => `${o.q}-${o.i}`));
  }, [state, pid]);
}

/**
 * The one hover card on screen. Hovering: a single persistent layer right next to what it explains (Cory, 2026-10-15:
 * never a docked spot elsewhere), pointer-transparent, so moving through it changes nothing. It sits beside its target,
 * or above it for the strips along the bottom (the shop, your chair), flipping to the other side and sliding along to
 * stay whole on screen, drawn at the page's top level above every strip. Its side is chosen once per target, so content
 * filling in never makes it jump sideways. Pinned (a tap): a sheet on phones, a card beside the target elsewhere.
 */
export function HoverCardLayer({ hover, state, me, optionFor = () => null, onPick }) {
  const c = useHoverCard(hover);
  useCopyTargets(c, state, me);
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  const side = useRef(null); // { el, side } the side chosen for the current target
  useEffect(() => { if (c && !c.pinned) hover.close(); }, [state.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  // the element the card explains; a target re-drawn under the pointer (a refilled shop card, a chair) is found again
  // a seat's card is one you can use (Cory, 2026-10-15: its Use buttons, a long list scrolls): the pointer may move onto it
  const live = !!(c && !c.pinned && c.kind === 'seat');
  const inside = useRef(false);
  const el = c ? anchorFor(c, live && inside.current) : null;
  const place = () => {
    if (!c || c.pinned || !el || !box.current) { setPos(null); return; }
    const a = c.kind === 'space' ? spaceRect(el, c.key) : el.getBoundingClientRect();
    const w = Math.min(c.kind === 'seat' ? 360 : 280, innerWidth - 16);
    const h = box.current.offsetHeight || 160;
    const p = placeBeside(a, w, h, side.current && side.current.el === el ? side.current.side : null);
    // the nub points at the middle of what the card explains, kept clear of the card's corners
    const across = p.side === 'right' || p.side === 'left';
    p.nub = Math.round(Math.max(16, Math.min((across ? h : w) - 16, across ? a.top + a.height / 2 - p.top : a.left + a.width / 2 - p.left)));
    side.current = { el, side: p.side };
    setPos(old => (old && old.left === p.left && old.top === p.top && old.width === p.width && old.nub === p.nub ? old : p));
  };
  useLayoutEffect(place, [c, el]); // eslint-disable-line react-hooks/exhaustive-deps
  // content that fills in a moment later (the dry run's "You'd get") re-fits the card on screen
  const placeNow = useRef(place);
  placeNow.current = place;
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => placeNow.current());
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!c || c.pinned) return undefined;
    const off = e => { if (box.current && e.target instanceof Node && box.current.contains(e.target)) return; hover.close(); };
    const key = e => { if (e.key === 'Escape') hover.close(); };
    addEventListener('scroll', off, true);
    addEventListener('keydown', key);
    return () => { removeEventListener('scroll', off, true); removeEventListener('keydown', key); };
  }, [c, hover]);
  const body = el ? cardBody(c, state, me, optionFor, id => { hover.close(); onPick(id); }) : null;
  if (c && c.pinned && body) {
    return <Popover anchor={el} onClose={hover.close}><div className="lt-note pinned" data-hover-card={c.kind}>{body}</div></Popover>;
  }
  // always mounted: content swaps in place; hidden (not unmounted) between cards
  const layer = (
    <div ref={box} className={`lt-hover popover${body ? ' on' : ''}`} data-hover-layer="" data-open={body ? '1' : '0'} data-side={body && pos ? pos.side : undefined} aria-hidden={!body}
      data-live={body && live ? '1' : undefined}
      onPointerEnter={() => { if (!live) return; inside.current = true; hover.hold(); }}
      onPointerLeave={e => { inside.current = false; if (live && e.pointerType === 'mouse') hover.letGo(); }}
      style={body && pos ? { left: pos.left, top: pos.top, width: pos.width } : { left: -9999, top: 0, width: 280 }}>
      {body && pos ? <span className={`lt-nub ${pos.side}`} aria-hidden="true" style={pos.side === 'right' || pos.side === 'left' ? { top: pos.nub } : { left: pos.nub }} /> : null}
      {body && <div className="lt-note" data-hover-card={c.kind} role="tooltip">{body}</div>}
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(layer, document.body) : layer;
}

// where the pointer last was: a hover card whose target was re-drawn re-links only while the pointer is still on it
let lastPt = null;
if (typeof addEventListener === 'function') addEventListener('pointermove', e => { lastPt = { x: e.clientX, y: e.clientY }; }, { passive: true, capture: true });
/**
 * The element a hover card explains: the one it was opened on, or, when that node was re-drawn under the pointer
 * (a shop refill, a chair re-rendering: RC1 "Kingpin had no hover"), the same thing found again. A card whose pointer
 * has moved on never comes back.
 */
function anchorFor(c, held = false) {
  if (c.el && c.el.isConnected) return c.el;
  if (typeof document === 'undefined' || !c.el) return null;
  const sel = c.kind === 'space' ? `[data-slot="${c.key}"]` : c.kind === 'plaque' ? `[data-plaque="${c.qid}"]`
    : c.kind === 'seat' ? `[data-cult="${c.pid}"] .cs-head` : c.kind === 'card' ? `[data-region="shop"] [data-uid="${c.uid}"]` : c.kind === 'deck' ? '[data-deck]' : null;
  const el = sel && document.querySelector(sel);
  if (!el) return null;
  if (c.pinned || held) return el;
  const b = el.getBoundingClientRect();
  return lastPt && lastPt.x >= b.left - 4 && lastPt.x <= b.right + 4 && lastPt.y >= b.top - 4 && lastPt.y <= b.bottom + 4 ? el : null;
}

/**
 * A space's own edges: a wedge's box has empty corners, so the card is placed against the panel's filled edge on the
 * row and the column through its label (where the eye reads "the space"), not against its bounding box.
 */
function spaceRect(el, key) {
  const r = el.getBoundingClientRect();
  try {
    if (typeof SVGGeometryElement === 'undefined' || !(el instanceof SVGGeometryElement) || !el.getScreenCTM()) return r;
    const lab = document.querySelector(`[data-slot="${key}"]`);
    const l = lab ? lab.getBoundingClientRect() : r;
    const cx = Math.max(r.left, Math.min(r.right, l.left + l.width / 2)), cy = Math.max(r.top, Math.min(r.bottom, l.top + l.height / 2));
    const inv = el.getScreenCTM().inverse();
    const svg = el.ownerSVGElement;
    const inside = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return el.isPointInFill(pt.matrixTransform(inv)); };
    const scan = (from, to, at) => { const step = from < to ? 2 : -2; for (let v = from; step > 0 ? v <= to : v >= to; v += step) if (at(v)) return v; return null; };
    const right = scan(r.right, cx, x => inside(x, cy)), left = scan(r.left, cx, x => inside(x, cy));
    const bottom = scan(r.bottom, cy, y => inside(cx, y)), top = scan(r.top, cy, y => inside(cx, y));
    if ([right, left, bottom, top].some(v => v == null)) return r;
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  } catch { return r; }
}

/**
 * Where a w×h card goes next to the target rect a: beside it (right, else left) for things up on the table; above it
 * (else below) for the strips along the bottom; then slid along that edge to stay whole on screen. `keep` reuses a
 * side chosen earlier for this target when it still fits. Returns { left, top, width, side }.
 */
export function placeBeside(a, w, h, keep = null) {
  const gap = 8, m = 8, W = innerWidth, H = innerHeight;
  const fits = { right: a.right + gap + w <= W - m, left: a.left - gap - w >= m, above: a.top - gap - h >= m, below: a.bottom + gap + h <= H - m };
  const low = a.top + a.height / 2 > H * 0.7;
  const order = low ? ['above', 'right', 'left', 'below'] : ['right', 'left', 'below', 'above'];
  const side = keep && fits[keep] ? keep : order.find(k => fits[k]) || (low ? 'above' : 'right');
  const clampX = x => Math.max(m, Math.min(W - m - w, x)), clampY = y => Math.max(m, Math.min(H - m - h, y));
  if (side === 'right' || side === 'left') return { side, width: w, left: side === 'right' ? a.right + gap : a.left - gap - w, top: clampY(a.top + a.height / 2 - h / 2) };
  return { side, width: w, left: clampX(a.left + a.width / 2 - w / 2), top: clampY(side === 'above' ? a.top - gap - h : a.bottom + gap) };
}

/**
 * While a copy space (Echo, Encore, Refrain…) or a copying member (Understudy) is under the pointer, the spaces it
 * could copy light up on the wheel ("since your turn" targets), straight from the engine. Classes are toggled on the
 * board's [data-slot] elements, so the wheel never re-renders for it.
 */
function useCopyTargets(c, state, me) {
  const viewer = me != null ? me : state.pending ? state.pending.player : null;
  const space = c && c.kind === 'space' ? c.key.split('-').map(Number) : null;
  const pv = usePreview(state, space && viewer != null && !state.over ? viewer : null, space ? space[0] : 0, space ? space[1] : 0);
  let keys = pv && pv.copies ? pv.copies : null;
  if (!keys && c && c.kind === 'card' && viewer != null && state.cards[c.uid]) keys = memberCopyTargets(state, viewer, cardDef(state, c.uid));
  const sig = keys ? keys.join(',') : '';
  useEffect(() => {
    if (!sig) return undefined;
    const els = sig.split(',').flatMap(k => [...document.querySelectorAll(`[data-slot="${k}"]`)]);
    for (const el of els) el.classList.add('copy-target');
    return () => { for (const el of els) el.classList.remove('copy-target'); };
  }, [sig]);
}
function cardBody(c, state, me, optionFor, pick) {
  if (c.kind === 'space') return <SpaceCard state={state} me={me} spaceKey={c.key} optionFor={optionFor} onPick={pick} pinned={c.pinned} />;
  if (c.kind === 'plaque') return <StandingsCard state={state} qid={c.qid} meId={me} />;
  if (c.kind === 'seat') return <SeatCard state={state} pid={c.pid} meId={me} optionFor={optionFor} onPick={pick} />;
  if (c.kind === 'deck') return <DeckCard state={state} />;
  if (c.kind === 'card') return state.cards[c.uid] ? <ShopCardHover state={state} me={me} uid={c.uid} optionFor={optionFor} onPick={pick} pinned={c.pinned} /> : null;
  return null;
}

// ---------- the cards ----------
function Row({ k, children }) { return <div className="lt-yd-row"><span className="k">{k}</span><span className="v">{children}</span></div>; }

/** A board space: full text, YOU GET (engine dry run), how it moves its contest, the cards it unlocks, Place here. */
export function SpaceCard({ state, me, spaceKey, optionFor = () => null, onPick, pinned = false }) {
  const [q, i] = spaceKey.split('-').map(Number);
  const qid = state.quadrants[q];
  const Q = quadrant(qid), a = Q.actions[i];
  const owner = state.slots[spaceKey];
  const opt = optionFor(`slot:${spaceKey}`) || optionFor(`squat:${spaceKey}`);
  const round = Math.max(1, state.round);
  const open = a.ring <= round && (owner === undefined || opt);
  const viewer = me != null ? me : state.pending && state.pending.player;
  // the dry run is read from the cache (warmed in idle time); if it isn't there yet it fills in a moment later
  const pv = usePreview(state, open && viewer != null && !state.over ? viewer : null, q, i) || null;
  const race = pv && pv.race ? raceAfter(state, pv.race, qid, viewer) : null;
  const unlocks = pv && viewer != null ? unlockedBy(state, state.players[viewer], surely(pv)) : [];
  return (
    <div className="lt-card-body" data-space-card={spaceKey} style={{ '--q': `var(--q-${sphereOf(qid)}, var(--${qid}))` }}>
      {/* plate 1b: the name, its one-sentence rule, then "You'd get" (the picture lives on the space itself) */}
      <h4 className="sc-name" title={`${Q.name} · ${RINGS[a.ring - 1]}`}>{a.name}</h4>
      <p className="sc-rule"><CardText text={a.text} /></p>
      <div className="lt-yd">
        {pv && pv.copies ? <Row k="Can copy">{pv.copies.length ? pv.copies.map(k => spaceName(state, k)).join(', ') : 'nothing yet'}</Row> : null}
        {open && viewer != null && !state.over ? <div className="lt-yd-row youd"><span className="k">You’d get</span><span className="v"><YoudGet state={state} pid={viewer} q={q} i={i} /></span></div> : null}
        {/* why a member changed the number, or stayed off ("Underdog: no ×2 (Hustler’s +3 lands first)"), from the dry run */}
        {open && pv && pv.reasons && pv.reasons.length ? <Row k="Why"><span data-reasons><Rich text={pv.reasons.join(' · ')} /></span></Row> : null}
        {race && <Row k={race.rule}><Rich text={race.text} /></Row>}
        {/* a few by name; the whole row is said as one (it listed all ten names, the row you can already see) */}
        {pv && pv.swept && pv.swept.length ? <Row k="Sweeps away">{pv.swept.length > 3
          ? <span data-swept={pv.swept.join(' ')}>{pv.swept.length === state.shop.length ? `the whole row (${pv.swept.length})` : `${pv.swept.length} face-up members`}</span>
          : pv.swept.map((u, k) => <span key={u} data-swept={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>)}<small className="lt-swept-note"> back under the deck</small></Row> : null}
        {/* on a desktop the shop's own cards say it ("after Kickback" on each): only a pinned sheet (touch) lists them */}
        {unlocks.length && pinned ? <Row k="Then affordable">{unlocks.map((u, k) => <span key={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>)}</Row> : null}
        {owner !== undefined && <Row k="Taken">{state.players[owner].name}{opt ? ' — you can join it' : ''}</Row>}
        {a.ring > round && <Row k="Opens">round {roman(a.ring)}</Row>}
      </div>
      {opt && pinned && onPick && <button type="button" className="lt-btn pri" data-place={opt.id} onClick={() => onPick(opt.id)}>{opt.squat ? 'Join here' : 'Place here'}</button>}
    </div>
  );
}
/** "You 5 · Ossian 2 · Bo 1 · Kay 0 · you'd lead it (+2 followers)": the space's own contest after taking it, every player (the dry run's first branch). */
function raceAfter(state, race, qid, pid) {
  const c = race.find(x => x.qid === qid);
  if (!c) return null;
  const nm = id => (id === pid ? 'You' : state.players[id].name);
  // every player, never just the top three (RC1 panel: the 4th silently dropped off "You 0 · P2 0 · P3 0")
  const top = c.rows.map(r => `${nm(r.player)} ${r.count}`).join(' · ');
  // plain words (design pod): "Most gold: You 4 · P2 2 … · you'd lead it (+2 followers)", never "Gold … you'd lead, +2"
  const lead = c.winners.includes(pid) ? ` · you’d lead it (+${c.prize} follower${c.prize === 1 ? '' : 's'})` : '';
  return { rule: c.rule.replace(/^\w/, ch => ch.toUpperCase()), text: `${top}${lead}` };
}

/** "Rush (Bo)" for a board key. */
const spaceName = (state, key) => { const [q, i] = key.split('-').map(Number); const a = quadrant(state.quadrants[q]).actions[i]; const o = state.slots[key]; return `${a.name}${o !== undefined ? ` (${state.players[o].name})` : ''}`; };

/** A rim plaque: the contest's standings, straight from the engine. */
export function StandingsCard({ state, qid, meId = null }) {
  const st = standings(state).find(x => x.qid === qid);
  if (!st) return null;
  // the sphere's own rule, when it has one ("Whatever you steal turns magenta…"), under its standings (UI-A, meta #3)
  // (its closing "Most green at round end wins." is the prize line again: said once, up top)
  const rule = (quadrant(qid).rule || '').replace(/\s*Most [^.]*\bat round end wins\.\s*$/i, '').trim();
  // what the rim's prize pays, in words (Cory, 2026-10-15): "Round end: whoever has the most white gets 2 followers"
  return (
    <>
      <p className="lt-prize-line" data-prize-line={qid}>Round end: whoever has the {st.rule.replace(/^Most /i, 'most ')} gets {st.prize} follower{st.prize === 1 ? '' : 's'}.</p>
      <ContestStandings state={state} st={st} meId={meId} brief />
      {rule ? <p className="lt-sphere-rule" data-sphere-rule={qid}>{rule}</p> : null}
    </>
  );
}

/**
 * A seat: that player's members, clearly (Cory, 2026-10-15: "Followers and Has here can be cut, because it's obvious
 * from the cards. Instead, this should cleanly show a list of member ability/passives, if they've been activated").
 * The name on top, then one row per member (MemberUse.jsx): picture, name, the whole sentence, its state; on your own
 * seat a member you can use now carries its Use button.
 */
export function SeatCard({ state, pid, meId = null, optionFor = () => null, onPick = null }) {
  const p = state.players[pid];
  const lvl = p.kind === 'bot' ? BOT_LEVEL_INFO.find(l => l.level === botLevel(state, pid)) : null; // Easy / Normal / Hard
  return (
    <div className="lt-card-body seat-card" data-seat-card={pid} style={{ '--pc': playerColor(pid) }}>
      <div className="t"><SeatFigure id={pid} state={state} size={32} /><h4>{pid === meId ? 'You' : p.name}{lvl ? <small><span data-bot-level={lvl.level} title={lvl.blurb}>{lvl.name} bot</span></small> : null}</h4></div>
      <SeatMembers state={state} pid={pid} me={meId} optionFor={pid === meId ? optionFor : undefined} onPick={pid === meId ? onPick : null} />
    </div>
  );
}

/** A shop card under the pointer: the card itself (its cost, clearly), and Recruit when it's pinned on touch.
 *  Cory (2026-10-15): nothing else about payment here: no "You pay", no "Leaves", no contest lines, no click hint. */
export function ShopCardHover({ state, me = null, uid, optionFor = () => null, onPick, pinned = false }) {
  const opt = optionFor(`card:${uid}`);
  return (
    <div className="lt-card-body" data-card-hover={uid}>
      <MemberCard state={state} uid={uid} me={me} />
      {opt && onPick && pinned && <button type="button" className="lt-btn pri" data-recruit={uid} onClick={() => onPick(opt.id)}>Recruit</button>}
    </div>
  );
}
