// The information layer: everything here appears on hover (mouse) or tap / long-press (touch), never always on.
// - Tip: any element that explains itself in a small card (hover after a beat; a tap pins it; Esc / tap away closes).
// - Term / CardText: game keywords underlined in rules text; each opens its glossary definition (src/v4/glossary.js).
// - CardName / MemberCard / BadgeMark: a member named anywhere opens the full card (badge, color, cost, owner).
// - ContestStandings / ContestTip: a quadrant's contest straight from the engine's contestTable (who'd score now).
// - TouchTips: on touch screens a long-press on anything with a title shows that title (hover's touch twin).
import { useEffect, useRef, useState } from 'react';
import { cardDef, defById, quadrant, previewSpace } from '../../engine/v4/index.js';
import { badgedDef } from '../../engine/v4/content/market.js';
import { term, splitTerms } from '../glossary.js';
import { costParts, playerColor, seatSigil, standings, toStanding, tiebreakNote } from '../format.js';
import { realHover } from '../hover.js';
import { Popover } from './parts.jsx';
import { Rich, CostPips } from './Rich.jsx';
import { Follower } from '../art/Follower.jsx';

/**
 * An element that explains itself. content: a node or a function returning one (built only when shown).
 * Hover (a real mouse) shows it after a beat; a click or tap pins it; the click never reaches a parent button.
 */
export function Tip({ content, children, as: As = 'span', className = '', label, ...rest }) {
  const [open, setOpen] = useState(null); // { el, pinned }
  const ref = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const pin = e => { e.stopPropagation(); e.preventDefault(); clearTimeout(timer.current); setOpen(o => (o && o.pinned ? null : { el: ref.current, pinned: true })); };
  return (
    <>
      <As
        ref={ref} className={`tip${className ? ` ${className}` : ''}`} data-tip="" role="button" tabIndex={0}
        aria-haspopup="dialog" aria-expanded={!!open} aria-label={label}
        onPointerEnter={e => { if (!realHover(e)) return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(o => o || { el: ref.current, pinned: false }), 260); }}
        onPointerLeave={e => { clearTimeout(timer.current); if (e.pointerType === 'mouse') setOpen(o => (o && !o.pinned ? null : o)); }}
        onClick={pin}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') pin(e); }}
        {...rest}
      >{children}<span className="hitbox" aria-hidden="true" /></As>
      {open && (
        <Popover anchor={open.el} onClose={() => setOpen(null)} float={!open.pinned}>
          <div className="tip-body" data-tip-body>{typeof content === 'function' ? content() : content}</div>
        </Popover>
      )}
    </>
  );
}

// ---------- keywords ----------
/** A keyword that opens its glossary definition. k: a glossary key ('badged', 'full set'…). */
export function Term({ k, children, className = '' }) {
  const t = term(k);
  if (!t) return <>{children}</>;
  return (
    <Tip className={`term${className ? ` ${className}` : ''}`} data-term={k} label={`${t.word}: what it means`}
      content={() => <Definition k={k} />}>{children}</Tip>
  );
}
export function Definition({ k }) {
  const t = term(k);
  return <div className="pop-card gloss"><b>{t.word}</b><span>{t.def}</span><small>Glossary · How to play lists every term</small></div>;
}
/** Rules text: resource words as symbols (Rich), game keywords underlined (each opens its definition). */
export function CardText({ text }) {
  if (!text) return null;
  return <>{splitTerms(text).map((part, k) => (part.key
    ? <Term key={k} k={part.key}><Rich text={part.text} /></Term>
    : <Rich key={k} text={part.text} />))}</>;
}

// ---------- members ----------
/** Is a member's quadrant on this table? A member of an absent quadrant is colorless (neutral frame). */
export const onTable = (state, def) => state.quadrants.includes(def.quadrant);
/** The frame color of a member on this table: its quadrant's, or the neutral "colorless" one. */
export const cardColor = (state, def) => (onTable(state, def) ? `var(--${def.quadrant})` : 'var(--colorless)');
/** Badged (printed cost at the cutoff or more) matters only where Blue (the market) scores it. */
export const showsBadge = (state, def) => state.quadrants.includes('market') && badgedDef(def);

/** The ◆ on a badged member; it opens the glossary's "badged". Nothing on tables without Blue. */
export function BadgeMark({ state, def }) {
  if (!showsBadge(state, def)) return null;
  return <Term k="badged" className="badge-mark"><span aria-label="badged">◆</span></Term>;
}
/** "colorless": a member whose quadrant isn't on this table. */
export function Colorless({ state, def }) {
  if (onTable(state, def)) return null;
  return <Term k="colorless" className="colorless-tag">colorless</Term>;
}

/** The full card: color frame, name, worth, badge, ability (keywords linked), cost, and its owner when it has one. */
export function MemberCard({ state, uid, def: d0 = null }) {
  const d = d0 || cardDef(state, uid);
  const owner = uid != null ? state.players.find(p => p.members.includes(uid)) : null;
  const card = uid != null ? state.cards[uid] : null;
  const where = uid == null ? null : owner ? null : state.shop.includes(uid) ? 'In the shop' : 'In the pile';
  return (
    <div className="card-face" style={{ '--c': cardColor(state, d) }} data-card={d.id}>
      <div className="row"><span className="glyph" aria-hidden="true" /><b>{d.name}</b><BadgeMark state={state} def={d} /><Follower n={d.f} className="star" title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}`} /></div>
      <p><CardText text={d.text} /></p>
      {card && card.copy && <small>Copying <CardName state={state} def={defById(card.copy)} /></small>}
      <small>Costs <CostPips parts={costParts(d, state.resources)} />{d.n > 1 ? ` · counts as ${d.n} members` : ''}{onTable(state, d) ? '' : ' · '}<Colorless state={state} def={d} /></small>
      {owner && <small className="owner" style={{ '--pc': playerColor(owner.id) }}><i />{owner.name}’s{card && card.used ? ' · used' : ''}</small>}
      {where && <small>{where}</small>}
    </div>
  );
}

/** A member's name anywhere (log, pickers, bonuses, rival chips): hover or tap opens the full card. */
export function CardName({ state, uid = null, def = null, children, className = '' }) {
  const d = def || (uid != null && state.cards[uid] ? cardDef(state, uid) : null);
  if (!d) return <>{children}</>;
  return (
    <Tip className={`card-name${className ? ` ${className}` : ''}`} data-card-name={d.id} label={`${d.name}: show the card`}
      style={{ '--c': cardColor(state, d) }} content={() => <MemberCard state={state} uid={uid} def={uid == null ? d : null} />}>
      {children || d.name}{showsBadge(state, d) ? <span className="badge-mark inline" aria-label="badged">◆</span> : null}
    </Tip>
  );
}

/**
 * Text that names members (a log line, a bonus line): each name of a member in this game opens that card.
 * Longest names first, so "Mentor & Protégé" isn't read as two cards.
 */
export function NamedText({ state, text }) {
  const names = memberNames(state);
  if (!names.re) return <>{text}</>;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(names.re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const d = names.byName.get(m[0]);
    out.push(<CardName key={m.index} state={state} def={d}>{m[0]}</CardName>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
// keyed by the game's deck (seed + table + card count): a game's member names never change, so one index per game
const namesCache = new Map();
function memberNames(state) {
  const cards = state.cards;
  const key = `${state.seed}|${state.quadrants.join(',')}|${Object.keys(cards).length}`;
  if (namesCache.has(key)) return namesCache.get(key);
  if (namesCache.size > 8) namesCache.clear();
  const byName = new Map();
  for (const c of Object.values(cards)) { const d = cardDef(state, c.uid); if (!byName.has(d.name)) byName.set(d.name, d); }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const list = [...byName.keys()].sort((a, b) => b.length - a.length);
  const out = { byName, re: list.length ? new RegExp(`(?<![\\w’'])(?:${list.map(esc).join('|')})(?![\\w])`, 'g') : null };
  namesCache.set(key, out);
  return out;
}

// ---------- contests ----------
/**
 * One quadrant's contest, from the engine (st: a standing from format.standings / scoredStandings).
 * Says what it counts, its tiebreak, the prize, and every player's count, leaders marked.
 */
export function ContestStandings({ state, st, meId = null, scored = false }) {
  const nm = id => (id === meId ? 'You' : state.players[id].name);
  return (
    <div className="pop-card contest-card" style={{ '--c': `var(--${st.qid})` }} data-contest={st.qid}>
      <div className="row"><b>{st.rule}</b><span className="num">+{st.prize}{scored ? '' : ' at round end'}</span></div>
      <small>Counts {st.counts || st.rule.toLowerCase()}.{st.tiebreak ? ` ${cap1(st.tiebreak.text)}.` : ' Tied leaders all score.'}</small>
      <ol className="contest-rows">
        {st.rows.map(r => {
          const tb = tiebreakNote(st, r);
          const lead = st.leaders.includes(r.id);
          return (
            <li key={r.id} className={lead ? 'leads' : ''} style={{ '--pc': playerColor(r.id) }} data-pid={r.id} data-count={r.shown} data-lead={lead ? '1' : '0'}>
              <i /><span className="who">{nm(r.id)}</span><b className="num">{r.shown}</b>
              {tb && <small> ({tb})</small>}
              {lead && <em>{scored ? `+${st.prize}` : st.leaders.length > 1 ? 'tied lead' : 'leads'}</em>}
            </li>
          );
        })}
      </ol>
      {!st.leaders.length && <small>{scored ? 'No one scored: nobody had any.' : 'No one would score yet: nobody has any.'}</small>}
    </div>
  );
}
const cap1 = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** A quadrant's scoring rule that opens its live standings (the board's rule banner, the panel's score line). */
export function ContestTip({ state, qid, meId = null, children, className = '' }) {
  return (
    <Tip className={`contest-tip${className ? ` ${className}` : ''}`} data-contest-tip={qid} label={`${quadrant(qid).scoring.label}: who leads now`}
      content={() => {
        const st = standings(state).find(x => x.qid === qid);
        return st ? <ContestStandings state={state} st={st} meId={meId} /> : null;
      }}>{children}</Tip>
  );
}
export { toStanding };

// ---------- touch: long-press shows a title ----------
/** Mount once: on a touch screen, pressing and holding anything with a title shows it (and swallows the tap). */
export function TouchTips() {
  const [bubble, setBubble] = useState(null); // { text, x, y }
  useEffect(() => {
    let timer = null, start = null, fired = false;
    const down = e => {
      if (e.pointerType !== 'touch') return;
      const el = e.target.closest && e.target.closest('[title]');
      if (!el || !el.getAttribute('title')) return;
      start = { x: e.clientX, y: e.clientY };
      fired = false;
      clearTimeout(timer);
      timer = setTimeout(() => { fired = true; setBubble({ text: el.getAttribute('title'), x: start.x, y: start.y, n: Date.now() }); }, 450);
    };
    const move = e => { if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) { clearTimeout(timer); start = null; } };
    const up = () => { clearTimeout(timer); start = null; };
    const click = e => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } };
    const away = e => { if (e.pointerType === 'touch' && !fired) setBubble(null); };
    addEventListener('pointerdown', down, true);
    addEventListener('pointerdown', away, true);
    addEventListener('pointermove', move, true);
    addEventListener('pointerup', up, true);
    addEventListener('pointercancel', up, true);
    addEventListener('click', click, true);
    addEventListener('contextmenu', e => { if (fired) e.preventDefault(); }, true);
    return () => {
      clearTimeout(timer);
      removeEventListener('pointerdown', down, true); removeEventListener('pointerdown', away, true);
      removeEventListener('pointermove', move, true); removeEventListener('pointerup', up, true);
      removeEventListener('pointercancel', up, true); removeEventListener('click', click, true);
    };
  }, []);
  useEffect(() => { if (!bubble) return undefined; const t = setTimeout(() => setBubble(null), 4000); return () => clearTimeout(t); }, [bubble]);
  if (!bubble) return null;
  const left = Math.max(12, Math.min((typeof innerWidth === 'number' ? innerWidth : 400) - 252, bubble.x - 120));
  return <div key={bubble.n} className="touch-tip" role="tooltip" data-touch-tip style={{ left, top: Math.max(8, bubble.y - 64) }}>{bubble.text}</div>;
}

// ---------- seat sigils: identity by shape, so a seat never depends on its color ----------
/** SVG path for a seat's sigil centred on (x, y) with radius r: circle, triangle, square or star. */
export function sigilPath(kind, x, y, r) {
  const pt = (a, k = r) => `${(x + k * Math.sin(a)).toFixed(2)},${(y - k * Math.cos(a)).toFixed(2)}`;
  if (kind === 'triangle') return `M${pt(0)} L${pt((2 * Math.PI) / 3)} L${pt((4 * Math.PI) / 3)}Z`;
  if (kind === 'square') { const h = r * 0.8; return `M${x - h},${y - h} H${x + h} V${y + h} H${x - h}Z`; }
  if (kind === 'star') return `M${Array.from({ length: 8 }, (_, k) => pt((k * Math.PI) / 4, k % 2 ? r * 0.42 : r)).join(' L')}Z`;
  return `M${x - r * 0.75},${y} a${r * 0.75},${r * 0.75} 0 1,0 ${r * 1.5},0 a${r * 0.75},${r * 0.75} 0 1,0 ${-r * 1.5},0`;
}
/** A seat's sigil as a small inline mark in the seat's color (names, rails, standings). */
export function Sigil({ id, size = 10, title = null }) {
  const kind = seatSigil(id);
  return (
    <svg className="sigil" viewBox="0 0 10 10" width={size} height={size} role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'}>
      <path d={sigilPath(kind, 5, 5, 4.6)} fill={playerColor(id)} />
    </svg>
  );
}

// ---------- "You'd get": a space's outcome for you, from the engine's dry run (previewSpace) ----------
const previews = new WeakMap();
export function cachedPreview(state, pid, q, i) {
  let m = previews.get(state);
  if (!m) { m = new Map(); previews.set(state, m); }
  const k = `${pid}|${q}-${i}`;
  if (!m.has(k)) m.set(k, previewSpace(state, pid, q, i));
  return m.get(k);
}
const signed = n => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const span = (r, unit, plural = unit + 's') => {
  if (r[0] === 0 && r[1] === 0) return null;
  const u = Math.max(Math.abs(r[0]), Math.abs(r[1])) === 1 ? unit : plural;
  return r[0] === r[1] ? `${signed(r[0])} ${u}` : `${signed(r[0])} to ${signed(r[1])} ${u}`;
};
/** The preview as words: { you: "+3 gold, +1 member", others: "rivals +1 gold" | null, choose: bool, partial }. */
export function previewWords(pv, state) {
  const you = [
    ...state.resources.map(r => span(pv.you.res[r], r, r)),
    span(pv.you.followers, 'follower'), span(pv.you.members, 'member'), span(pv.you.turns, 'extra turn'),
  ].filter(Boolean);
  const others = [...state.resources.map(r => span(pv.others.res[r], r, r)), span(pv.others.followers, 'follower'), span(pv.others.members, 'member')].filter(Boolean);
  return { you: you.join(', ') || 'nothing right now', others: others.length ? `rivals ${others.join(', ')}` : null, choose: pv.asks.length > 0, theyChoose: pv.theirAsks.length > 0, partial: pv.partial };
}
/** "You'd get: +3 ●, +1 member · you choose" for player pid on space (q, i), computed just after it shows. */
/** A preview already computed for this state, or undefined (never computes: a hover must not wait). */
export function peekPreview(state, pid, q, i) {
  const m = previews.get(state);
  return m ? m.get(`${pid}|${q}-${i}`) : undefined;
}
/** The preview for a space: the cached one at once, else computed just after the card is on screen. */
export function usePreview(state, pid, q, i) {
  const hit = pid == null ? null : peekPreview(state, pid, q, i);
  const [pv, setPv] = useState(hit);
  useEffect(() => {
    if (pid == null) { setPv(null); return undefined; }
    const now = peekPreview(state, pid, q, i);
    if (now !== undefined) { setPv(now); return undefined; }
    let alive = true;
    setPv(undefined);
    const t = setTimeout(() => { let r = null; try { r = cachedPreview(state, pid, q, i); } catch { r = null; } if (alive) setPv(r); }, 0);
    return () => { alive = false; clearTimeout(t); };
  }, [state, pid, q, i]);
  return hit !== undefined ? hit : pv;
}
export function YoudGet({ state, pid, q, i }) {
  const pv = usePreview(state, pid, q, i);
  if (pid == null) return null;
  if (pv === undefined) return <span className="youd-get pending" data-youd-get="">You’d get: …</span>;
  if (!pv) return null;
  const w = previewWords(pv, state);
  return (
    <span className="youd-get" data-youd-get={w.you} title="Worked out by playing this space on a copy of the table, right now">
      <b>You’d get:</b> <Rich text={w.you} />{w.choose ? <em> · {pv.exact ? 'you choose how' : 'depends on your choice'}</em> : null}
      {w.theyChoose ? <em> · a rival decides part of it</em> : null}{w.partial ? <em> (roughly)</em> : null}
      {w.others ? <small className="youd-others"><Rich text={w.others} /></small> : null}
    </span>
  );
}
