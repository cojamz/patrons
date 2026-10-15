// The information layer: everything here appears on hover (mouse) or tap / long-press (touch), never always on.
// - Tip: any element that explains itself in a small card (hover after a beat; a tap pins it; Esc / tap away closes).
// - Term / CardText: game keywords underlined in rules text; each opens its glossary definition (src/v4/glossary.js).
// - CardName / MemberCard: a member named anywhere opens the full card (color, cost, owner).
// - ContestStandings / ContestTip: a quadrant's contest straight from the engine's contestTable (who'd score now).
// - TouchTips: on touch screens a long-press on anything with a title shows that title (hover's touch twin).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cardDef, defById, quadrant, previewSpace, memberPrice, paymentChoices } from '../../engine/v4/index.js';
import { term, splitTerms } from '../glossary.js';
import { costParts, playerColor, standings, toStanding, tiebreakNote } from '../format.js';
import { realHover } from '../hover.js';
import { Popover } from './parts.jsx';
import { aimAt, arrived, heading, over, holdCard, dropCard, busyWith, claim, unclaim } from './hoverIntent.js';
import { Who } from './Glyphs.jsx';
import { Rich, Pip } from './Rich.jsx';
import { Follower } from '../art/Follower.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { MO } from '../motion.js';
import { withRace } from './race.js';

/**
 * An element that explains itself. content: a node or a function returning one (built only when shown).
 * Hover (a real mouse) shows it after a beat; a click or tap pins it; the click never reaches a parent button.
 */
// Inside a control (an option button, a card): the control owns the click, the tip only explains on hover/long-press.
const CONTROL = 'button, a[href], [data-option], [role="button"]';
// a pointer resting on something opens its card at once (Cory, 2026-10-15: hovers must feel instant); the beat only
// keeps a pointer passing across a line of keywords from flashing each one
const TIP_MS = MO.tipOpen; // src/v4/motion.js
export function Tip({ content, children, as: As = 'span', className = '', label, hint = null, sticky = false, beside = null, ...rest }) {
  const [open, setOpen] = useState(null); // { el, pinned }
  const [nested, setNested] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => { const up = ref.current && ref.current.parentElement; setNested(!!(up && up.closest(CONTROL))); }, []);
  // sticky: a card with a button on it (a member you can use) stays while the pointer is on it or on its way to it
  // (hoverIntent.js: what the pointer crosses on the way doesn't open its own card over it)
  const body = useRef(null);
  const pending = useRef(false);
  const cardEl = () => (body.current ? body.current.closest('.popover') || body.current : null);
  const letGo = () => { const c = cardEl(); if (c) { arrived(c); dropCard(c); } setOpen(o => (o && !o.pinned ? null : o)); };
  // it stays while the pointer is on it (its surface is see-through to clicks, so that's measured, not an event) or on
  // its way to it; a route that wanders a little (w3b #47: leaving the figure downward) still has 300ms to get there
  const release = () => {
    clearTimeout(timer.current);
    const wait = () => { if (heading() || over(cardEl())) { timer.current = setTimeout(wait, 80); return; } letGo(); };
    timer.current = setTimeout(wait, 300);
  };
  // one card on screen at a time (w3a A30): opening this one closes whatever card was up, the hover layer's included
  const me = useRef(null);
  if (!me.current) me.current = Symbol('tip');
  const isOpen = !!open;
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = me.current;
    claim(id, () => { clearTimeout(timer.current); setOpen(null); });
    return () => unclaim(id);
  }, [isOpen]);
  // while a sticky card is up (not pinned), it's the card the pointer may be on: what's under it doesn't open
  const seeThrough = !!(sticky && open && !open.pinned);
  useEffect(() => {
    if (!seeThrough) return undefined;
    const find = () => cardEl();
    holdCard(find);
    return () => dropCard(find);
  }, [seeThrough]); // eslint-disable-line react-hooks/exhaustive-deps
  const opening = () => {
    clearTimeout(timer.current); pending.current = true;
    timer.current = setTimeout(() => { pending.current = false; setOpen(o => o || { el: ref.current, pinned: false }); }, TIP_MS);
  };
  // crossing toward another open card: this one stays shut (it opens on the next move once the crossing is over)
  const crossing = e => !!busyWith(e ? { x: e.clientX, y: e.clientY } : undefined, body.current);
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
        data-hint={nested ? hint || label || undefined : undefined}
        onPointerEnter={e => { if (!realHover(e)) return; if (crossing(e)) return; opening(); }}
        onPointerMove={e => { if (open || pending.current || !realHover(e) || crossing(e)) return; opening(); }}
        onPointerLeave={e => {
          clearTimeout(timer.current); pending.current = false;
          if (e.pointerType !== 'mouse') return;
          if (sticky && open && !open.pinned && body.current) { aimAt(body.current.closest('.popover') || body.current); release(); } else letGo();
        }}
        onClick={pin}
        onKeyDown={e => { if (!nested && (e.key === 'Enter' || e.key === ' ')) pin(e); }}
        {...rest}
      >{children}{nested ? null : <span className="hitbox" aria-hidden="true" />}</As>
      {open && (
        <Popover anchor={open.el} onClose={() => setOpen(null)} float={!open.pinned} beside={beside && open.el ? open.el.closest(beside) : null}>
          <div className={`tip-body${seeThrough ? ' see-through' : ''}`} data-tip-body ref={body}
            {...(sticky ? { onPointerEnter: () => { clearTimeout(timer.current); arrived(); }, onPointerLeave: e => { if (e.pointerType === 'mouse') release(); } } : {})}>{typeof content === 'function' ? content() : content}</div>
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
  const parts = splitTerms(text);
  // each piece knows what follows it, so a color before a keyword ("blue | face-up member") stays a word
  const after = k => parts.slice(k + 1).map(x => x.text).join('');
  return <>{parts.map((part, k) => (part.key
    ? <Term key={k} k={part.key}><Rich text={part.text} after={after(k)} /></Term>
    : <Rich key={k} text={part.text} after={after(k)} />))}</>;
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

/** A cost as the plate prints it: "2● 2◐" (the number before its dot, colored part first, then any; no color names). */
export function CostDots({ parts }) {
  if (!parts || !parts.length) return <span className="cost-dots free">free</span>;
  return <span className="cost-dots" aria-label={parts.map(c => `${c.n} ${c.color}`).join(' + ')}>{parts.map((c, k) => <span key={k} className="cd"><b className="n">{c.n}</b><Pip color={c.color} n={c.n} /></span>)}</span>;
}

/**
 * The full card (plate 1b): the picture, name and worth, "costs 2● 2◐", the sentence big with its marks inline, then
 * one quiet line tying it to the table (whose it is, or what you're short of to recruit it). Nothing about paying.
 */
/**
 * What a member costs p while a discount applies (Intro Offer's "next member costs 4 less", Sponsor's 2 off…), as cost
 * parts ([] = free), or null at its list price. The engine's own price rule (memberPrice); the shop face shows it.
 */
export function paidParts(state, p, uid, d = cardDef(state, uid)) {
  if (!p || state.over) return null;
  let pr;
  try { pr = memberPrice(state, p, uid); } catch { return null; }
  if (pr.total >= d.s + d.w) return null;
  const any = pr.total - pr.colored;
  return [...(pr.color && pr.colored ? [{ color: pr.color, n: pr.colored }] : []), ...(any > 0 ? [{ color: 'any', n: any }] : [])];
}
/** Why p pays less: "your next member costs 4 less", "Sponsor takes 2 off". */
const discountWhy = (state, p) => [
  ...(p.discount ? [`your next member costs ${p.discount} less`] : []),
  ...p.members.map(u => { try { return cardDef(state, u); } catch { return null; } }).filter(x => x && x.costReduction).map(x => `${x.name} takes ${x.costReduction} off`),
].join(', ');

export function MemberCard({ state, uid, def: d0 = null, me = null }) {
  const d = d0 || cardDef(state, uid);
  const owner = uid != null ? state.players.find(p => p.members.includes(uid)) : null;
  const card = uid != null ? state.cards[uid] : null;
  const where = uid == null ? null : owner ? null : state.shop.includes(uid) ? 'In the shop' : 'In the pile';
  // "Free. No effect." is no ability too (its cost line already says free)
  const ability = String(d.text || '').replace(/^Worth \d+ followers?\.\s*/i, '').replace(/^(Free\.\s*)?No effect\.?$/i, '').trim();
  const worth = d.f != null ? d.f : 1;
  const sphere = onTable(state, d) ? (() => { try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } })() : 'colorless';
  // the quiet live line: what you're short of, in dots (Cory: "need N" never shouts), from the engine's one price rule
  let short = null;
  // not during a choice: a recruit it offers pays its own way (Snap Up: in any colors), so the buy step's "short" misled
  // (w2b #28: lit cards said "You're short 2")
  if (where === 'In the shop' && me != null && state.players[me] && !state.over && !(state.pending && state.pending.kind === 'choose')) {
    try { const pr = memberPrice(state, state.players[me], uid); if (!pr.afford && pr.short) short = pr; } catch { /* no price: say nothing */ }
  }
  // in your buy step, what a click will do (wave-2 tester A: sometimes it bought at once, sometimes the pay sheet opened):
  // one way to pay buys at once and says what it pays; several open the pay sheet
  let pays = null;
  const pend = state.pending;
  if (where === 'In the shop' && !short && me != null && pend && pend.kind === 'buy' && pend.player === me && pend.options.some(o => o.id === `card:${uid}`)) {
    try {
      const ways = paymentChoices(state, state.players[me], uid);
      pays = ways.length === 1 ? Object.entries(ways[0]).filter(([, n]) => n > 0).map(([color, n]) => ({ color, n })) : ways.length > 1 ? 'choose' : null;
    } catch { /* say nothing */ }
  }
  // a discount on you: what you'd pay and why (the shop face shows the price, struck list beside it)
  const paid = where === 'In the shop' && me != null && state.players[me] ? paidParts(state, state.players[me], uid, d) : null;
  return (
    <div className="card-face mc" style={{ '--c': cardColor(state, d) }} data-card={d.id}>
      <div className="mc-head">
        <span className="mc-art" aria-hidden="true"><Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphere} size={48} /></span>
        <span className="mc-id">
          <span className="mc-row"><b className="mc-name">{d.name}</b><span className="mc-worth" title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}`}><b className="n">{d.f}</b><Follower size={14} title={`worth ${d.f} follower${d.f === 1 ? '' : 's'}`} /></span></span>
          <small className="mc-cost">costs <CostDots parts={costParts(d, state.resources)} />{d.n > 1 ? ` · counts as ${d.n} members` : ''}{onTable(state, d) ? '' : ' · '}<Colorless state={state} def={d} /></small>
        </span>
      </div>
      {/* the worth is already up top: the sentence is what it does, and a card that only counts has none */}
      {/* a member with no ability says so, never an empty card (w2a #36: Twins and Intern showed only a header) */}
      {ability ? <p className="mc-text"><CardText text={ability} /></p> : <p className="mc-text mc-none" data-no-ability="">No ability: worth {worth} follower{worth === 1 ? '' : 's'}.</p>}
      {card && card.copy && <small className="mc-live">Copying <CardName state={state} def={defById(card.copy)} /></small>}
      {owner && <small className="owner mc-live" style={{ '--pc': playerColor(owner.id) }}><Who state={state} id={owner.id} name={owner.id === me ? 'Yours' : `${owner.name}’s`} size={14} />{card && card.used ? ' · used' : ''}</small>}
      {/* one line about paying: "You pay 2● 1●" (w3b #27: "Pays 6●" read as income), with a discount's reason after it */}
      {paid && !pays && <small className="mc-live" data-discount>You pay {paid.length ? <CostDots parts={paid} /> : 'nothing'}: {discountWhy(state, state.players[me])}.</small>}
      {pays ? <small className="mc-live" data-pays={pays === 'choose' ? 'choose' : 'once'} data-discount={paid ? '' : undefined}>{pays === 'choose' ? 'Choose how to pay' : <>You pay <CostDots parts={pays} /></>}{paid ? `: ${discountWhy(state, state.players[me])}` : ''}{pays === 'choose' ? '' : '.'}</small>
        : short ? <small className="mc-live" data-short={short.short.total}>You’re short {shortDots(state, short)} to recruit it.</small>
        : where === 'In the pile' && <small className="mc-live">{where}</small>}
    </div>
  );
}
/** "4● 1◐": what's missing, colored part first, as dots. */
function shortDots(state, pr) {
  const parts = [];
  if (pr.color && pr.short[pr.color]) parts.push({ color: pr.color, n: pr.short[pr.color] });
  if (pr.short.any) parts.push({ color: 'any', n: pr.short.any });
  return <CostDots parts={parts} />;
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
export function ContestStandings({ state, st, meId = null, scored = false, brief = false }) {
  const nm = id => (id === meId ? 'You' : state.players[id].name);
  // brief (under the rim card's own prize line): no second heading, and "Counts …" only when it adds something the
  // prize line doesn't already say ("full sets: …", "a card that counts as 2 members counts 2")
  const plainCount = !st.counts || /^the \w+ you hold when the round ends$/.test(st.counts);
  const ties = st.tiebreak ? `${cap1(st.tiebreak.text)}.` : 'Tied leaders all score.';
  return (
    <div className="pop-card contest-card" style={{ '--c': `var(--${st.qid})` }} data-contest={st.qid}>
      {!brief && <div className="row"><b>{st.rule}</b><span className="num">+{st.prize}{scored ? '' : ' at round end'}</span></div>}
      <small>{brief && plainCount ? ties : `Counts ${st.counts || st.rule.toLowerCase()}. ${ties}`}</small>
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
      // a title, or data-hint: the long-press words of something that has its own hover card on a desktop (a native
      // tooltip there would sit on top of that card, saying it twice)
      const el = e.target.closest && e.target.closest('[title], [data-hint]');
      const say = el && (el.getAttribute('title') || el.getAttribute('data-hint'));
      if (!say) return;
      start = { x: e.clientX, y: e.clientY };
      fired = false;
      clearTimeout(timer);
      timer = setTimeout(() => { fired = true; setBubble({ text: say, x: start.x, y: start.y, n: Date.now() }); }, 450);
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
  return withRace(pv);
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
/** Ask for previews of these spaces ("q-i" keys) for pid on this state; results arrive in the cache. `front`: a space
 *  under the pointer, worked out ahead of the warmup batch. */
export function requestPreviews(state, pid, keys, { front = false } = {}) {
  const m = mapFor(state);
  const todo = keys.filter(k => !m.has(`${pid}|${k}`));
  if (!todo.length) return;
  const w = getWorker();
  if (w) {
    if (workerState !== state) { workerState = state; workerGen++; pending.clear(); pending.set(workerGen, state); inflight.clear(); }
    try {
      w.postMessage({ gen: workerGen, state: stripped(state), pid, keys: todo, front });
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
    if (peekPreview(state, pid, q, i) === undefined) requestPreviews(state, pid, [key], { front: true });
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
  // the rivals' line is their summed change: "in all" says so ("rivals +3 silver" read as +3 each, when it was +1 each);
  // only its sure parts: a part that varies (a steal's "−1 to 0, −2 to 0…" per color) read as algebra, whether your
  // pick decides it or the space does (w3b: Lie Low and Crime Wave still printed four ranges); the rule says the rest
  const theirs = (r, unit, plural) => (r[0] !== r[1] ? null : span(r, unit, plural));
  const others = [...state.resources.map(r => theirs(pv.others.res[r], r, r)), theirs(pv.others.followers, 'follower', 'followers'), theirs(pv.others.members, 'member', 'members')].filter(Boolean);
  const many = state.players.length > 2;
  return { you: you.join(', ') || 'nothing right now', others: others.length ? `rivals ${others.join(', ')}${many ? ' in all' : ''}` : null, choose: pv.asks.length > 0, theyChoose: pv.theirAsks.length > 0, partial: pv.partial };
}
/** Only what you'd surely get (the parts no pick changes), or '' when every part hangs on the pick. */
function sureWords(pv, state) {
  const fixed = (r, unit, plural = unit + 's') => (r[0] === r[1] ? span(r, unit, plural) : null);
  return [...state.resources.map(r => fixed(pv.you.res[r], r, r)), fixed(pv.you.followers, 'follower'), fixed(pv.you.members, 'member'), fixed(pv.you.turns, 'extra turn'),
    pv.you.discount && pv.you.discount[0] && pv.you.discount[0] === pv.you.discount[1] ? `next member −${pv.you.discount[0]}` : null]
    .filter(Boolean).join(', ');
}
/** One branch's change for you in words: "+6 white, −2 followers"; what leaves you in several colors is one "−5 resources". */
export function changeWords(d, state) {
  if (!d) return '';
  const out = [];
  for (const r of state.resources) if (d.res[r] > 0) out.push(`+${d.res[r]} ${r}`);
  const lost = state.resources.filter(r => d.res[r] < 0);
  if (lost.length === 1) out.push(`−${-d.res[lost[0]]} ${lost[0]}`);
  else if (lost.length > 1) out.push(`−${lost.reduce((t, r) => t - d.res[r], 0)} resources`);
  const n = (v, unit) => `${signed(v)} ${unit}${Math.abs(v) === 1 ? '' : 's'}`;
  if (d.members) out.push(n(d.members, 'member'));
  if (d.followers) out.push(n(d.followers, 'follower'));
  if (d.turns) out.push(n(d.turns, 'extra turn'));
  if (d.discount > 0) out.push(`next member −${d.discount}`);
  return out.join(', ') || 'nothing';
}
/**
 * What the "You'd get" line says: { text, note, likely?, best? } (strings for Rich). A pick that changes what you get
 * gives numbers, never only "it depends" (w3b #20: "it depends on your pick / a rival decides part of it" was honest but
 * empty): when a rival's answer decides it, the likely case and the best case ("+4 magenta likely · +1 member, +1
 * follower at best"); when it's your pick, your best pick's numbers; when every pick is worth the same and only the mix
 * changes (which color, whom), the sure part and "the rest is your pick". Ranges stay out (RC1 sweep 17/62/89: "0 to
 * +2 ■, −2 to 0 ◆…" read as algebra).
 */
export function youdWords(pv, state) {
  const w = previewWords(pv, state);
  if (pv.exact) return { text: w.you, note: null };
  const best = changeWords(pv.best, state), likely = changeWords(pv.likely, state);
  if (pv.best && pv.likely && likely !== best) return { text: null, likely, best };
  if (pv.best && !pv.tied) return { text: best, note: 'your best pick' };
  const sure = sureWords(pv, state);
  return { text: sure || null, note: sure ? 'the rest is your pick' : 'it depends on your pick' };
}
/** "You'd get: +3 ●, +1 member" for player pid on space (q, i), computed just after it shows. */
export function YoudGet({ state, pid, q, i }) {
  const pv = usePreview(state, pid, q, i);
  if (pid == null) return null;
  if (pv === undefined) return <span className="youd-get pending" data-youd-get="">You’d get: …</span>;
  if (!pv) return null;
  const w = previewWords(pv, state);
  const y = youdWords(pv, state);
  return (
    <span className="youd-get" data-youd-get={w.you} title="Worked out by playing this space on a copy of the table, right now">
      <b>You’d get:</b> {w.partial ? 'about ' : ''}
      {y.likely
        ? <span data-youd-cases><Rich text={y.likely} /> <em className="yd-note">likely</em> · <Rich text={y.best} /> <em className="yd-note">at best</em></span>
        : <>{y.text ? <Rich text={y.text} /> : null}{y.note ? <em className="yd-note">{y.note}</em> : null}</>}
      {w.others ? <small className="youd-others"><Rich text={w.others} /></small> : null}
    </span>
  );
}
