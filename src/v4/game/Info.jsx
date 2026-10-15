// The information layer: everything here appears on hover (mouse) or tap / long-press (touch), never always on.
// - Tip: any element that explains itself in a small card (hover after a beat; a tap pins it; Esc / tap away closes).
// - Term / CardText: game keywords underlined in rules text; each opens its glossary definition (src/v4/glossary.js).
// - CardName / MemberCard: a member named anywhere opens the full card (color, cost, owner).
// - ContestStandings / ContestTip: a quadrant's contest straight from the engine's contestTable (who'd score now).
// - TouchTips: on touch screens a long-press on anything with a title shows that title (hover's touch twin).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cardDef, defById, quadrant, previewSpace, contestTable } from '../../engine/v4/index.js';
import { term, splitTerms } from '../glossary.js';
import { costParts, playerColor, standings, toStanding, tiebreakNote } from '../format.js';
import { realHover } from '../hover.js';
import { Popover } from './parts.jsx';
import { Who } from './Glyphs.jsx';
import { Rich, CostPips } from './Rich.jsx';
import { Follower } from '../art/Follower.jsx';
import { releaseNote } from './priceNotes.js';

/**
 * An element that explains itself. content: a node or a function returning one (built only when shown).
 * Hover (a real mouse) shows it after a beat; a click or tap pins it; the click never reaches a parent button.
 */
// Inside a control (an option button, a card): the control owns the click, the tip only explains on hover/long-press.
const CONTROL = 'button, a[href], [data-option], [role="button"]';
export function Tip({ content, children, as: As = 'span', className = '', label, hint = null, ...rest }) {
  const [open, setOpen] = useState(null); // { el, pinned }
  const [nested, setNested] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => { const up = ref.current && ref.current.parentElement; setNested(!!(up && up.closest(CONTROL))); }, []);
  const inControl = () => { const up = ref.current && ref.current.parentElement; return !!(up && up.closest(CONTROL)); };
  const pin = e => {
    // a keyword in an option's text never eats the option's click (a tap there picks the option)
    if (inControl()) return;
    e.stopPropagation(); e.preventDefault(); clearTimeout(timer.current); setOpen(o => (o && o.pinned ? null : { el: ref.current, pinned: true }));
  };
  return (
    <>
      <As
        ref={ref} className={`tip${className ? ` ${className}` : ''}`} data-tip="" role={nested ? undefined : 'button'} tabIndex={nested ? undefined : 0}
        aria-haspopup={nested ? undefined : 'dialog'} aria-expanded={nested ? undefined : !!open} aria-label={label}
        title={nested ? hint || label || undefined : undefined}
        onPointerEnter={e => { if (!realHover(e)) return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(o => o || { el: ref.current, pinned: false }), 260); }}
        onPointerLeave={e => { clearTimeout(timer.current); if (e.pointerType === 'mouse') setOpen(o => (o && !o.pinned ? null : o)); }}
        onClick={pin}
        onKeyDown={e => { if (!nested && (e.key === 'Enter' || e.key === ' ')) pin(e); }}
        {...rest}
      >{children}{nested ? null : <span className="hitbox" aria-hidden="true" />}</As>
      {open && (
        <Popover anchor={open.el} onClose={() => setOpen(null)} float={!open.pinned}>
          <div className="tip-body" data-tip-body>{typeof content === 'function' ? content() : content}</div>
        </Popover>
      )}
    </>
  );
}

// ---------- keywords ----------
/** A keyword that opens its glossary definition. k: a glossary key ('full set', 'plant'…). */
export function Term({ k, children, className = '' }) {
  const t = term(k);
  if (!t) return <>{children}</>;
  return (
    <Tip className={`term${className ? ` ${className}` : ''}`} data-term={k} label={`${t.word}: what it means`} hint={`${t.word}: ${t.def}`}
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
/** "colorless": a member whose quadrant isn't on this table. */
export function Colorless({ state, def }) {
  if (onTable(state, def)) return null;
  return <Term k="colorless" className="colorless-tag">colorless</Term>;
}

/** The full card: color frame, name, worth, ability (keywords linked), cost, and its owner when it has one. */
export function MemberCard({ state, uid, def: d0 = null }) {
  const d = d0 || cardDef(state, uid);
  const owner = uid != null ? state.players.find(p => p.members.includes(uid)) : null;
  const card = uid != null ? state.cards[uid] : null;
  const where = uid == null ? null : owner ? null : state.shop.includes(uid) ? 'In the shop' : 'In the pile';
  // what a release gives back (or why it can't), from the engine: RC1 saw Front-runner's off-table purple part come
  // back "in any colors" and read it as a broken rule
  const rel = uid != null ? releaseNote(state, uid, owner) : null;
  return (
    <div className="card-face" style={{ '--c': cardColor(state, d) }} data-card={d.id}>
      <div className="row"><span className="glyph" aria-hidden="true" /><b>{d.name}</b><Follower n={d.f} className="star" title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}`} /></div>
      <p><CardText text={d.text} /></p>
      {card && card.copy && <small>Copying <CardName state={state} def={defById(card.copy)} /></small>}
      <small>Costs <CostPips parts={costParts(d, state.resources)} />{d.n > 1 ? ` · counts as ${d.n} members` : ''}{onTable(state, d) ? '' : ' · '}<Colorless state={state} def={d} /></small>
      {rel && <small className={`release-note${rel.ok ? '' : ' no'}`} data-release={rel.ok ? 'yes' : 'no'}>{rel.text}</small>}
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
      {children || d.name}
    </Tip>
  );
}

// ---------- you are "You" ----------
// The engine writes every line in the third person ("P1 took Rush (Gold).", "P1's Banker: +1 gold."). For the person
// reading, their own name becomes "You" / "Your" (sentence start) or "you" / "your", and the verb right after agrees
// ("You have", "you get"). Other players' names are untouched.
const AGREE = { has: 'have', is: 'are', was: 'were', gets: 'get', pays: 'pay', uses: 'use', takes: 'take', starts: 'start', spends: 'spend', recruits: 'recruit', lies: 'lie', holds: 'hold', goes: 'go', gains: 'gain', flourishes: 'flourish', loses: 'lose', picks: 'pick', leads: 'lead', wins: 'win', ties: 'tie', scores: 'score', keeps: 'keep', buys: 'buy', copies: 'copy', places: 'place', passes: 'pass', needs: 'need', owns: 'own', gives: 'give', moves: 'move', steals: 'steal', trades: 'trade', releases: 'release', swaps: 'swap', joins: 'join' };
const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function asYou(text, name) {
  if (!text || !name) return text;
  const n = escRe(name);
  const start = (str, i) => i === 0 || /[.!?:—–]\s*$/.test(str.slice(Math.max(0, i - 3), i));
  let out = String(text).replace(new RegExp(`(?<![\\p{L}\\p{N}])${n}(?:'s|’s)(?![\\p{L}\\p{N}])`, 'gu'), (m, i, str) => (start(str, i) ? 'Your' : 'your'));
  out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${n}(?![\\p{L}\\p{N}])( (\\w+))?`, 'gu'), (m, tail, verb, i, str) => {
    const you = start(str, i) ? 'You' : 'you';
    if (!tail) return you;
    return ` ${verb}` === tail && AGREE[verb] ? `${you} ${AGREE[verb]}` : `${you}${tail}`;
  });
  return out;
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
              <Who state={state} id={r.id} name={nm(r.id)} size={16} /><b className="num">{r.shown}</b>
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

// ---------- "You'd get": a space's outcome for you, from the engine's dry run (previewSpace) ----------
// Dry runs are cached per state object. In a browser they run in a worker (previewWorker.js) so the page never
// waits; elsewhere (tests) they run here, a moment after they're asked for. A preview carries `race`: every
// contest after the space's first branch (what the space card shows as the race).
const previews = new WeakMap();
const listeners = new Set();
const mapFor = state => { let m = previews.get(state); if (!m) { m = new Map(); previews.set(state, m); } return m; };
const stripped = state => ({ ...state, log: [] });
function computeHere(state, pid, q, i) {
  const pv = previewSpace(stripped(state), pid, q, i);
  if (pv) { pv.race = pv.sample ? contestTable(pv.sample).map(c => ({ qid: c.qid, rule: c.rule, prize: c.prize, winners: c.winners, rows: c.rows })) : null; delete pv.sample; }
  return pv;
}
/** The preview for a space, computed now on this thread if it isn't cached (tests, tools). */
export function cachedPreview(state, pid, q, i) {
  const m = mapFor(state), k = `${pid}|${q}-${i}`;
  if (!m.has(k)) m.set(k, computeHere(state, pid, q, i));
  return m.get(k);
}
let worker = null, workerGen = 0, workerState = null, lastAnswer = 0;
const pending = new Map(); // gen → state
const inflight = new Set(); // requests posted to the worker: { state, pid, keys, t }
const WATCHDOG_MS = 4000;
const notify = (state, pid, key) => { for (const fn of listeners) fn(state, pid, key); };
/** Work the keys out here, one at a time and a moment apart, so a hover never waits on a whole batch. */
function onMainThread(state, pid, keys) {
  const m = mapFor(state);
  let k = 0;
  const step = () => {
    if (k >= keys.length) return;
    const key = keys[k++];
    if (!m.has(`${pid}|${key}`)) { const [q, i] = key.split('-').map(Number); try { m.set(`${pid}|${key}`, computeHere(state, pid, q, i)); } catch { m.set(`${pid}|${key}`, null); } notify(state, pid, key); }
    setTimeout(step, 0);
  };
  setTimeout(step, 0);
}
const missing = r => r.keys.filter(k => !mapFor(r.state).has(`${r.pid}|${k}`));
/** The worker is gone (its file 404s after a deploy, it crashed, it went silent): nothing waits on it any more. */
function workerFailed() {
  if (worker) { try { worker.terminate(); } catch { /* gone */ } }
  worker = false;
  const left = [...inflight];
  inflight.clear();
  for (const r of left) { const keys = missing(r); if (keys.length) onMainThread(r.state, r.pid, keys); }
}
// A request the worker never answers (not one result since it was posted) means the worker is dead: fall back.
// A slow but working worker is left alone (no duplicate work on the main thread).
function watch(r) {
  setTimeout(() => {
    if (!inflight.has(r)) return;
    if (!missing(r).length) { inflight.delete(r); return; }
    if (lastAnswer < r.t) workerFailed();
    else { r.t = Date.now(); watch(r); }
  }, WATCHDOG_MS);
}
function getWorker() {
  if (worker !== null) return worker || null;
  try {
    if (typeof Worker === 'undefined' || typeof window === 'undefined' || /jsdom/i.test(navigator.userAgent || '')) { worker = false; return null; }
    worker = new Worker(new URL('./previewWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = e => {
      lastAnswer = Date.now();
      const { gen, pid, key, pv } = e.data;
      const st = pending.get(gen);
      if (!st) return;
      mapFor(st).set(`${pid}|${key}`, pv);
      notify(st, pid, key);
    };
    worker.onerror = workerFailed;
    worker.onmessageerror = workerFailed;
  } catch { worker = false; }
  return worker || null;
}
/** Ask for previews of these spaces ("q-i" keys) for pid on this state; results arrive in the cache. */
export function requestPreviews(state, pid, keys) {
  const m = mapFor(state);
  const todo = keys.filter(k => !m.has(`${pid}|${k}`));
  if (!todo.length) return;
  const w = getWorker();
  if (w) {
    if (workerState !== state) { workerState = state; workerGen++; pending.clear(); pending.set(workerGen, state); inflight.clear(); }
    try {
      w.postMessage({ gen: workerGen, state: stripped(state), pid, keys: todo });
      const r = { state, pid, keys: todo, t: Date.now() };
      inflight.add(r);
      watch(r);
      return;
    } catch { workerFailed(); }
  }
  onMainThread(state, pid, todo);
}
/** For tests: forget the worker (null: try again; false: there is none). */
export const _setPreviewWorker = w => { worker = w; lastAnswer = 0; inflight.clear(); if (w) { w.onerror = workerFailed; w.onmessageerror = workerFailed; } };
/** A preview already computed for this state, or undefined (never computes: a hover must not wait). */
export function peekPreview(state, pid, q, i) {
  const m = previews.get(state);
  return m ? m.get(`${pid}|${q}-${i}`) : undefined;
}
/** The preview for a space: the cached one at once, else asked for and filled in when it arrives. */
export function usePreview(state, pid, q, i) {
  const [, bump] = useState(0);
  useEffect(() => {
    if (pid == null) return undefined;
    const key = `${q}-${i}`;
    const fn = (st, p, k) => { if (st === state && p === pid && k === key) bump(n => n + 1); };
    listeners.add(fn);
    if (peekPreview(state, pid, q, i) === undefined) requestPreviews(state, pid, [key]);
    return () => { listeners.delete(fn); };
  }, [state, pid, q, i]);
  return pid == null ? null : peekPreview(state, pid, q, i);
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
    pv.you.discount && (pv.you.discount[0] || pv.you.discount[1]) ? `next member −${pv.you.discount[0] === pv.you.discount[1] ? pv.you.discount[0] : `${pv.you.discount[0]}–${pv.you.discount[1]}`}` : null,
  ].filter(Boolean);
  const others = [...state.resources.map(r => span(pv.others.res[r], r, r)), span(pv.others.followers, 'follower'), span(pv.others.members, 'member')].filter(Boolean);
  return { you: you.join(', ') || 'nothing right now', others: others.length ? `rivals ${others.join(', ')}` : null, choose: pv.asks.length > 0, theyChoose: pv.theirAsks.length > 0, partial: pv.partial };
}
/** "You'd get: +3 ●, +1 member · you choose" for player pid on space (q, i), computed just after it shows. */
export function YoudGet({ state, pid, q, i }) {
  const pv = usePreview(state, pid, q, i);
  if (pid == null) return null;
  if (pv === undefined) return <span className="youd-get pending" data-youd-get="">You’d get: …</span>;
  if (!pv) return null;
  const w = previewWords(pv, state);
  return (
    <span className="youd-get" data-youd-get={w.you} title="Worked out by playing this space on a copy of the table, right now">
      <b>You’d get:</b> {w.partial ? 'about ' : ''}<Rich text={w.you} />{w.choose ? <em> · {pv.exact ? 'you choose how' : 'depends on your choice'}</em> : null}
      {w.theyChoose ? <em> · a rival decides part of it</em> : null}
      {w.others ? <small className="youd-others"><Rich text={w.others} /></small> : null}
    </span>
  );
}
