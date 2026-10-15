// Names in the strip, its turn cards and the log that open their card on the board's one hover layer (HoverCards.jsx,
// through its API): a space opens the space card, a member the member card, beside the name, exactly like the board
// (Cory: "hovering over named stuff in the log should show what it does"). The names come from the table itself, its
// spaces' keys and its cards' defs, so a word is a target only when it is one of this game's spaces or members.
import { quadrant, cardDef } from '../../engine/v4/index.js';
import { Rich } from './Rich.jsx';
import { realHover } from '../hover.js';
import './since.css';

const cache = new Map();
/** This game's names: { byName: Map(name → { kind: 'space', key } | { kind: 'member', uid }), re } (one per game). */
export function nameIndex(state) {
  const id = `${state.seed}|${state.quadrants.join(',')}|${Object.keys(state.cards).length}`;
  if (cache.has(id)) return cache.get(id);
  if (cache.size > 8) cache.clear();
  const byName = new Map();
  state.quadrants.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => { if (!byName.has(a.name)) byName.set(a.name, { kind: 'space', key: `${q}-${i}` }); }));
  for (const c of Object.values(state.cards)) {
    let d = null;
    try { d = cardDef(state, c.uid); } catch { /* gone */ }
    if (d && !byName.has(d.name)) byName.set(d.name, { kind: 'member', uid: c.uid });
  }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const list = [...byName.keys()].sort((a, b) => b.length - a.length);
  const out = { byName, re: list.length ? new RegExp(`(?<![\\p{L}\\p{N}’'])(?:${list.map(esc).join('|')})(?![\\p{L}\\p{N}])`, 'gu') : null };
  cache.set(id, out);
  return out;
}

/** One name that opens its card: target { kind: 'space', key } or { kind: 'member', uid }. */
export function HoverName({ hover, target, children }) {
  const open = (el, pinned = false) => (target.kind === 'space' ? hover.onSpaceHover(target.key, el, { pinned }) : hover.onCardHover(target.uid, el, { pinned }));
  const label = typeof children === 'string' ? children : undefined;
  return (
    <span className="hn" data-hover-name={target.kind} data-name-target={target.kind === 'space' ? target.key : target.uid}
      role="button" tabIndex={0} aria-label={label ? `${label}: show what it does` : undefined}
      onPointerEnter={e => { if (realHover(e)) open(e.currentTarget); }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') open(null); }}
      onClick={e => { e.stopPropagation(); open(e.currentTarget, true); }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(e.currentTarget, true); } }}
    >{children}</span>
  );
}

/**
 * Text with this game's space and member names as hover targets, the rest as rules text (resource symbols).
 * uids: name → uid for members the caller knows exactly (a recruit), over the index's first copy of that member.
 */
export function HoverNames({ state, hover, text, uids = null }) {
  if (!text) return null;
  const { re, byName } = hover ? nameIndex(state) : { re: null };
  if (!re) return <Rich text={text} />;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(<Rich key={`t${last}`} text={text.slice(last, m.index)} />);
    const t = byName.get(m[0]);
    const target = t.kind === 'member' && uids && uids[m[0]] != null ? { kind: 'member', uid: uids[m[0]] } : t;
    out.push(<HoverName key={`n${m.index}`} hover={hover} target={target}>{m[0]}</HoverName>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Rich key={`t${last}`} text={text.slice(last)} />);
  return <>{out}</>;
}
