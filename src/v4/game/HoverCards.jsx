// Hover cards for the Lamplit table: a pointer resting on a space, a rim plaque, a seat or a shop card shows what it
// is and what it would do; a tap (touch) pins the same card as a sheet. Every number comes from the engine:
// YOU GET from the dry run (previewSpace), standings from contestTable, pay from paymentPlan.
// UI-A's wheel calls onSpaceHover(key, el|null, { pinned }), plaques onPlaqueHover(qid, el|null); seats and shop
// cards are mine. GameScreen mounts <HoverCardLayer> once.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { quadrant, roman, contestTable, cardDef, followers as followersOf } from '../../engine/v4/index.js';
import { playerColor, standings, costParts } from '../format.js';
import { Popover } from './parts.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { CardText, ContestStandings, MemberCard, CardName, YoudGet, usePreview, requestPreviews } from './Info.jsx';
import { CostPips } from './Rich.jsx';
import { ResourceGlyph, FollowerMark, SeatFigure } from './Glyphs.jsx';
import { payBreakdown, contestEffect, unlockedBy, surely } from './cards.js';
import { lastMoves } from './seats.js';
import { memberCopyTargets } from './cards.js';
import './lamp-b.css';

const RINGS = ['outer ring', 'middle ring', 'inner ring'];
const sphereOf = qid => quadrant(qid).resource;

/**
 * The hover/pin state: one card at a time. Opens the moment the pointer arrives (Cory: instant); moving to a neighbour swaps the card in place at once; leaving closes it 150ms later
 * (unless the pointer arrives somewhere else first). A tap pins it (a sheet on phones). Cory: instant and seamless.
 */
export const OPEN_MS = 0, CLOSE_MS = 150;
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
      closeT = setTimeout(() => { if (card && !card.pinned) set(null); }, CLOSE_MS);
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
    onSpaceHover: (key, el, o = {}) => show({ kind: 'space', key, el, pinned: !!o.pinned }),
    onPlaqueHover: (qid, el, o = {}) => show({ kind: 'plaque', qid, el, pinned: !!o.pinned }),
    onSeatHover: (pid, el, o = {}) => show({ kind: 'seat', pid, el, pinned: !!o.pinned }),
    onCardHover: (uid, el, o = {}) => show({ kind: 'card', uid, el, pinned: !!o.pinned }),
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
 * The one hover card on screen. Hovering: a single persistent layer beside what it explains (never over it,
 * pointer-transparent, so moving through it changes nothing); its side is chosen once per target, so content
 * filling in never makes it jump. Pinned (a tap): a sheet on phones, a card beside the target elsewhere.
 */
export function HoverCardLayer({ hover, state, me, optionFor = () => null, onPick }) {
  const c = useHoverCard(hover);
  useCopyTargets(c, state, me);
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => { if (c && !c.pinned) hover.close(); }, [state.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!c || c.pinned || !c.el || !c.el.isConnected || !box.current) { setPos(null); return; }
    const a = c.el.getBoundingClientRect();
    const w = Math.min(280, innerWidth - 16);
    const h = box.current.offsetHeight || 160;
    const gap = 10;
    // beside (left or right) when there's room, else below or above; never over the target
    const right = a.right + gap + w <= innerWidth - 8, left = a.left - gap - w >= 8;
    let p;
    if (right || left) {
      const x = right ? a.right + gap : a.left - gap - w;
      const top = Math.max(8, Math.min(innerHeight - 8 - h, a.top + a.height / 2 - 60));
      p = { left: x, top, width: w };
    } else {
      const below = a.bottom + gap + h <= innerHeight - 8 || a.top < innerHeight / 2;
      const x = Math.max(8, Math.min(innerWidth - w - 8, a.left + a.width / 2 - w / 2));
      p = below ? { left: x, top: a.bottom + gap, width: w } : { left: x, bottom: innerHeight - a.top + gap, width: w };
    }
    setPos(p);
  }, [c && c.el, c && c.pinned]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!c || c.pinned) return undefined;
    const off = () => hover.close();
    const key = e => { if (e.key === 'Escape') hover.close(); };
    addEventListener('scroll', off, true);
    addEventListener('keydown', key);
    return () => { removeEventListener('scroll', off, true); removeEventListener('keydown', key); };
  }, [c, hover]);
  const body = c && c.el && c.el.isConnected ? cardBody(c, state, me, optionFor, id => { hover.close(); onPick(id); }) : null;
  if (c && c.pinned && body) {
    return <Popover anchor={c.el} onClose={hover.close}><div className="lt-note pinned" data-hover-card={c.kind}>{body}</div></Popover>;
  }
  // always mounted: content swaps in place; hidden (not unmounted) between cards
  return (
    <div ref={box} className={`lt-hover popover${body ? ' on' : ''}`} data-hover-layer="" data-open={body ? '1' : '0'} aria-hidden={!body}
      style={body && pos ? pos : { left: -9999, top: 0, width: 280 }}>
      {body && <div className="lt-note" data-hover-card={c.kind} role="tooltip">{body}</div>}
    </div>
  );
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
  if (c.kind === 'seat') return <SeatCard state={state} pid={c.pid} meId={me} />;
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
      <div className="t"><Sprite id={[a.id, spriteId(a.name)]} kind="action" sphere={sphereOf(qid)} size={48} /><h4>{a.name}<small>{Q.name} · {RINGS[a.ring - 1]}</small></h4></div>
      <p><CardText text={a.text} /></p>
      <div className="lt-yd">
        {pv && pv.copies ? <Row k="Can copy">{pv.copies.length ? pv.copies.map(k => spaceName(state, k)).join(', ') : 'nothing yet'}</Row> : null}
        {open && viewer != null && !state.over ? <Row k="You get"><YoudGet state={state} pid={viewer} q={q} i={i} /></Row> : null}
        {race && <Row k={race.rule}>{race.text}</Row>}
        {unlocks.length ? <Row k="Unlocks">{unlocks.map((u, k) => <span key={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>)}</Row> : null}
        {owner !== undefined && <Row k="Taken">{state.players[owner].name}{opt ? ' — you can join it' : ''}</Row>}
        {a.ring > round && <Row k="Opens">round {roman(a.ring)}</Row>}
      </div>
      {opt && pinned && onPick && <button type="button" className="lt-btn pri" data-place={opt.id} onClick={() => onPick(opt.id)}>{opt.squat ? 'Join here' : 'Place here'}</button>}
    </div>
  );
}
/** "You 5 · Ossian 2 · you'd lead, +2": the space's own contest after taking it (the dry run's first branch). */
function raceAfter(state, race, qid, pid) {
  const c = race.find(x => x.qid === qid);
  if (!c) return null;
  const nm = id => (id === pid ? 'You' : state.players[id].name);
  const top = c.rows.slice(0, 3).map(r => `${nm(r.player)} ${r.count}`).join(' · ');
  const lead = c.winners.includes(pid) ? ` · you’d lead, +${c.prize}` : '';
  return { rule: c.rule.replace(/^Most /, '').replace(/^\w/, ch => ch.toUpperCase()), text: `${top}${lead}` };
}

/** "Rush (Bo)" for a board key. */
const spaceName = (state, key) => { const [q, i] = key.split('-').map(Number); const a = quadrant(state.quadrants[q]).actions[i]; const o = state.slots[key]; return `${a.name}${o !== undefined ? ` (${state.players[o].name})` : ''}`; };

/** A rim plaque: the contest's standings, straight from the engine. */
export function StandingsCard({ state, qid, meId = null }) {
  const st = standings(state).find(x => x.qid === qid);
  return st ? <ContestStandings state={state} st={st} meId={meId} /> : null;
}

/** A seat: that player's resources, followers, workers, members, and last three moves. */
export function SeatCard({ state, pid, meId = null }) {
  const p = state.players[pid];
  const moves = lastMoves(state, pid, 3);
  return (
    <div className="lt-card-body seat-card" data-seat-card={pid} style={{ '--pc': playerColor(pid) }}>
      <div className="t"><SeatFigure id={pid} state={state} size={32} /><h4>{p.name}{pid === meId ? ' (you)' : ''}<small>{p.kind === 'bot' ? 'bot' : 'player'} · {p.left} minion{p.left === 1 ? '' : 's'} left</small></h4></div>
      <div className="lt-yd">
        <Row k="Followers"><FollowerMark n={followersOf(state, p)} /></Row>
        <Row k="Has">{state.resources.map(r => <span key={r} className="lt-res"><ResourceGlyph r={r} n={p.res[r] || 0} size={14} /><b className="num">{p.res[r] || 0}</b></span>)}</Row>
        <Row k="Members">{p.members.length ? p.members.map((u, k) => <span key={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>) : 'none yet'}</Row>
        {moves.length ? <Row k="Last moves">{moves.join(' · ')}</Row> : null}
      </div>
    </div>
  );
}

/** A shop card under the pointer: the card, what you'd pay and keep, how it moves the contests, Recruit. */
export function ShopCardHover({ state, me, uid, optionFor = () => null, onPick, pinned = false }) {
  const d = cardDef(state, uid);
  const viewer = me != null ? state.players[me] : null;
  const pay = viewer ? payBreakdown(state, viewer, uid) : null;
  // how the buy moves the contests clones the table: worked out just after the card is up, never before it
  const [effect, setEffect] = useState([]);
  useEffect(() => {
    setEffect([]);
    if (!viewer || !pay || !pay.spend) return undefined;
    const t = setTimeout(() => setEffect(contestEffect(state, viewer, uid, pay.spend)), 0);
    return () => clearTimeout(t);
  }, [state, uid, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const opt = optionFor(`card:${uid}`);
  const list = costParts(d, state.resources);
  return (
    <div className="lt-card-body" data-card-hover={uid}>
      <MemberCard state={state} uid={uid} />
      {viewer && (
        <div className="lt-yd">
          {pay.spend ? <>
            <Row k="You pay"><span className="lt-pay">{state.resources.filter(r => pay.spend[r]).map(r => <span key={r} className="lt-res"><b className="num">{pay.spend[r]}</b><ResourceGlyph r={r} n={pay.spend[r]} size={14} /></span>)}{!Object.values(pay.spend).some(Boolean) && 'nothing'}</span></Row>
            {list.some(c => c.color === 'any') && <small className="lt-why">“any” is taken from what you hold most of{viewer && viewer.discount ? `; −${viewer.discount} discount` : ''}. You choose when you recruit.</small>}
            <Row k="Leaves">{state.resources.filter(r => pay.leaves[r]).map(r => <span key={r} className="lt-res"><b className="num">{pay.leaves[r]}</b><ResourceGlyph r={r} n={pay.leaves[r]} size={14} /></span>)}{!Object.values(pay.leaves).some(Boolean) && 'nothing'}</Row>
            {effect.map(e => <Row key={e.qid} k={e.rule.replace(/^Most /, '')}><span className={e.lost ? 'lt-warn' : 'lt-good'}>{e.text}</span></Row>)}
          </> : <Row k="Need"><span className="lt-warn">{pay.short.total} more{pay.short.colorN ? ` (${pay.short.colorN} ${pay.short.color})` : ''}</span></Row>}
        </div>
      )}
      {opt && onPick && pinned && <button type="button" className="lt-btn pri" data-recruit={uid} onClick={() => onPick(opt.id)}>Recruit</button>}
      {opt && !pinned && <small className="lt-why">Click the card to recruit it.</small>}
    </div>
  );
}
