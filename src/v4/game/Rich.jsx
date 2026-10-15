// Resources as colored symbols inside any rules text or cost (Cory, 2026-10-14): "+3 gold" reads as "+3 ●" in gold,
// "2 any" as "2 ◍" (the wild token). Each symbol says what it is on hover (every element explains itself).
import { Follower } from '../art/Follower.jsx';
import { ResourceGlyph, Mark, Op } from './Glyphs.jsx';

const COLORS = ['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white'];
// "follower(s)" after a number is the follower mark too (Cory: followers aren't a star); other uses stay words.
// The plate's marks (visual language, 2026-10-15): @m member, @r rival, @f follower, @n minion, @t extra turn;
// → becomes, ⇄ swap, ↻ extra turn; × times and a "/" joined to what follows (per) are typed, quieter.
// A spaced " / " ("2 / 4 / 6", by round) stays text: "/" only ever means per.
const WORD = new RegExp(`\\b(${COLORS.join('|')}|any|followers?)\\b|(@[mrfnt])|([→⇄↻×])|(?<=\\S)(\\/)(?=[^\\s\\d])`, 'g');
const TOKEN_MARK = { '@m': 'member', '@r': 'rival', '@n': 'minion', '@t': 'turn', '→': 'arrow', '⇄': 'swap', '↻': 'turn' };
/** The follower mark in running text: Cory's pixel person at the plate's .8em (rounded to whole pixels by CSS). */
export const TextFollower = ({ title = 'followers' }) => <Follower size={10} title={title} markClass="rich-f" flat />;

/** One resource symbol. color: a resource name or 'any'. */
export function Pip({ color, n }) {
  const label = color === 'any' ? 'any resources' : color;
  const say = n != null ? `${n} ${label}` : label;
  // "any" is the split dot: the table's four colors, each where its quadrant sits
  if (color === 'any') return <span className="pip wild" title={say} aria-label={say} role="img"><ResourceGlyph r="any" decorative /></span>;
  // a resource is a flat dot in its color with its quiet inner mark (Glyphs.jsx), so color is never the only cue
  return (
    <span className="pip glyph" data-pip={color} style={{ '--c': `var(--${color})` }} title={say} aria-label={say} role="img">
      <ResourceGlyph r={color} decorative />
    </span>
  );
}

/**
 * Rules text with resource words as symbols. Lowercase words only: "Gold" (the quadrant) stays a word,
 * "gold" (the resource) becomes a symbol. "any" becomes the wild symbol only where it means resources
 * ("2 any", "in any colors", "of anything" stays), so "any face-up member" keeps its word.
 */
export function Rich({ text }) {
  if (!text) return null;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const at = m.index;
    const sym = m[2] || m[3] || m[4];
    if (sym) {
      if (at > last) out.push(text.slice(last, at));
      if (sym === '@f') out.push(<TextFollower key={at} title="follower" />);
      else if (TOKEN_MARK[sym]) out.push(<Mark key={at} k={TOKEN_MARK[sym]} />);
      else out.push(<Op key={at} t={sym} />);
      last = at + sym.length;
      continue;
    }
    const w = m[1];
    if (w.startsWith('follower')) {
      if (!/\d\s$/.test(text.slice(Math.max(0, at - 4), at))) continue;
      if (at > last) out.push(text.slice(last, at));
      out.push(<TextFollower key={at} title={w} />);
      last = at + w.length;
      continue;
    }
    if (w === 'any') {
      const before = text.slice(Math.max(0, at - 6), at), after = text.slice(at + 3, at + 12);
      const meansResources = /\d\s$/.test(before) || /^\s+(colou?rs?|resources?)\b/.test(after) || /^\s*[).,;]|^$/.test(after) && /\d\s$/.test(before);
      if (!meansResources) continue;
    }
    if (at > last) out.push(text.slice(last, at));
    out.push(<Pip key={at} color={w} />);
    last = at + w.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** A cost as symbols: [{ color, n }] → "4 ● + 2 ◍", or "free". */
export function CostPips({ parts }) {
  if (!parts || !parts.length) return <>free</>;
  return <>{parts.map((c, k) => <span key={k} className="cp">{k ? ' + ' : ''}<span className="num">{c.n}</span><Pip color={c.color} n={c.n} /></span>)}</>;
}
