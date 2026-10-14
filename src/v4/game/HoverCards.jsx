// Hover cards for the Lamplit table: a pointer resting on a space, a rim plaque, a seat or a shop card shows what it
// is and what it would do; a tap (touch) pins the same card as a sheet. Every number comes from the engine:
// YOU GET from the dry run (previewSpace), standings from contestTable, pay from paymentPlan.
// UI-A's wheel calls onSpaceHover(key, el|null, { pinned }), plaques onPlaqueHover(qid, el|null); seats and shop
// cards are mine. GameScreen mounts <HoverCardLayer> once.
import { useCallback, useEffect, useRef, useState } from 'react';
import { quadrant, roman, contestTable, cardDef, followers as followersOf } from '../../engine/v4/index.js';
import { playerColor, standings, costParts } from '../format.js';
import { Popover } from './parts.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { CardText, ContestStandings, MemberCard, CardName, YoudGet, cachedPreview } from './Info.jsx';
import { CostPips } from './Rich.jsx';
import { ResourceGlyph, FollowerMark, SeatFigure } from './Glyphs.jsx';
import { payBreakdown, contestEffect, unlockedBy, surely } from './cards.js';
import { lastMoves } from './seats.js';
import './lamp-b.css';

const RINGS = ['outer ring', 'middle ring', 'inner ring'];
const sphereOf = qid => quadrant(qid).resource;

/** The hover/pin state: one card at a time. */
export function useHoverCards() {
  const [card, setCard] = useState(null); // { kind, key|qid|pid|uid, el, pinned }
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback((next, delay) => {
    clearTimeout(timer.current);
    if (!next.el) { setCard(c => (c && !c.pinned && c.kind === next.kind ? null : c)); return; }
    if (next.pinned) { setCard(next); return; }
    timer.current = setTimeout(() => setCard(c => (c && c.pinned ? c : next)), delay);
  }, []);
  return {
    card,
    close: useCallback(() => { clearTimeout(timer.current); setCard(null); }, []),
    onSpaceHover: useCallback((key, el, o = {}) => show({ kind: 'space', key, el, pinned: !!o.pinned }, 140), [show]),
    onPlaqueHover: useCallback((qid, el, o = {}) => show({ kind: 'plaque', qid, el, pinned: !!o.pinned }, 140), [show]),
    onSeatHover: useCallback((pid, el, o = {}) => show({ kind: 'seat', pid, el, pinned: !!o.pinned }, 160), [show]),
    onCardHover: useCallback((uid, el, o = {}) => show({ kind: 'card', uid, el, pinned: !!o.pinned }, 160), [show]),
    /** the space under the pointer (the shop ticks "✓ after X" for it) */
    space: card && card.kind === 'space' ? card.key : null,
  };
}

/** The one hover card on screen, anchored to what it explains (a sheet when pinned on a phone). */
export function HoverCardLayer({ hover, state, me, optionFor = () => null, onPick }) {
  const c = hover.card;
  useEffect(() => { if (c && !c.pinned) hover.close(); }, [state.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c || !c.el || !c.el.isConnected) return null;
  let body = null;
  if (c.kind === 'space') body = <SpaceCard state={state} me={me} spaceKey={c.key} optionFor={optionFor} onPick={id => { hover.close(); onPick(id); }} pinned={c.pinned} />;
  if (c.kind === 'plaque') body = <StandingsCard state={state} qid={c.qid} meId={me} />;
  if (c.kind === 'seat') body = <SeatCard state={state} pid={c.pid} meId={me} />;
  if (c.kind === 'card') body = <ShopCardHover state={state} me={me} uid={c.uid} optionFor={optionFor} onPick={id => { hover.close(); onPick(id); }} pinned={c.pinned} />;
  if (!body) return null;
  return <Popover anchor={c.el} onClose={hover.close} float={!c.pinned}><div className={`lt-note${c.pinned ? ' pinned' : ''}`} data-hover-card={c.kind}>{body}</div></Popover>;
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
  const pv = open && viewer != null && !state.over ? safePreview(state, viewer, q, i) : null;
  const race = pv && pv.sample ? raceAfter(state, pv.sample, qid, viewer) : null;
  const unlocks = pv && viewer != null ? unlockedBy(state, state.players[viewer], surely(pv)) : [];
  return (
    <div className="lt-card-body" data-space-card={spaceKey} style={{ '--q': `var(--q-${sphereOf(qid)}, var(--${qid}))` }}>
      <div className="t"><Sprite id={spriteId(a.name)} kind="action" sphere={sphereOf(qid)} size={48} /><h4>{a.name}<small>{Q.name} · {RINGS[a.ring - 1]}</small></h4></div>
      <p><CardText text={a.text} /></p>
      <div className="lt-yd">
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
function safePreview(state, pid, q, i) { try { return cachedPreview(state, pid, q, i); } catch { return null; } }
/** "You 5 · Ossian 2 · leader +2": the space's own contest after taking it (the dry run's first branch). */
function raceAfter(state, sample, qid, pid) {
  let c;
  try { c = contestTable(sample).find(x => x.qid === qid); } catch { return null; }
  if (!c) return null;
  const nm = id => (id === pid ? 'You' : state.players[id].name);
  const top = c.rows.slice(0, 3).map(r => `${nm(r.player)} ${r.count}`).join(' · ');
  const lead = c.winners.includes(pid) ? ` · you’d lead, +${c.prize}` : '';
  return { rule: c.rule.replace(/^Most /, '').replace(/^\w/, ch => ch.toUpperCase()), text: `${top}${lead}` };
}

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
      <div className="t"><SeatFigure id={pid} size={48} /><h4>{p.name}{pid === meId ? ' (you)' : ''}<small>{p.kind === 'bot' ? 'bot' : 'player'} · {p.left} worker{p.left === 1 ? '' : 's'} left</small></h4></div>
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
  const effect = viewer && pay && pay.spend ? contestEffect(state, viewer, uid, pay.spend) : [];
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
