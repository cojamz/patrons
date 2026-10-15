// Resources as colored symbols inside any rules text or cost (Cory, 2026-10-14): "+3 gold" reads as "+3 ●" in gold,
// "2 any" as "2 ◍" (the wild token). Each symbol says what it is on hover (every element explains itself).
import { Follower } from '../art/Follower.jsx';
import { ResourceGlyph } from './Glyphs.jsx';

const COLORS = ['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white'];
// "follower(s)" after a number is the follower mark too (Cory: followers aren't a star); other uses stay words.
// Two symbols only (Cory, 2026-10-15: "just simplify visual language everywhere"): the dot and the follower. The old
// marks print as plain words: @m member, @r rival, @n minion, @t extra turn (@f is the follower mark), → becomes,
// ⇄ swap, ↻ extra turn, and a "/" joined to what follows is "per". A spaced " / " ("2 / 4 / 6", by round) stays as is.
const WORD = new RegExp(`\\b(${COLORS.join('|')}|any|followers?)\\b|(@[mrfnt])|([→⇄↻])|(?<=\\S)(\\/)(?=[^\\s\\d])`, 'g');
const NUM = /((?<![\p{L}\p{N}.,])[+−-]?\d+(?![\p{L}\p{N}]))/u;
const TOKEN_WORD = { '@m': 'member', '@r': 'rival', '@n': 'minion', '@t': 'extra turn', '→': 'becomes', '⇄': 'swap', '↻': 'extra turn', '/': ' per ' };
/** The follower mark in running text: Cory's pixel person at the plate's .8em (rounded to whole pixels by CSS). */
export const TextFollower = ({ title = 'followers' }) => <Follower size={10} title={title} markClass="rich-f" />;

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
 * "gold" (the resource) becomes a symbol. "any" becomes the wild symbol only where a number counts it ("2 any");
 * "in any colors", "any face-up member" and "of anything" keep their words.
 */
export function Rich({ text }) {
  if (!text) return null;
  const out = [];
  let last = 0;
  // the text up to a symbol; a number sits right against the dot or follower it counts ("+3●", "1👤")
  const lead = (at, glue) => { if (at > last) out.push(glue ? text.slice(last, at).replace(/(\d)\s$/, '$1') : text.slice(last, at)); };
  for (const m of text.matchAll(WORD)) {
    const at = m.index;
    const sym = m[2] || m[3] || m[4];
    if (sym) {
      lead(at, sym === '@f');
      out.push(sym === '@f' ? <TextFollower key={at} title="follower" /> : TOKEN_WORD[sym]);
      last = at + sym.length;
      continue;
    }
    const w = m[1];
    if (w.startsWith('follower')) {
      if (!/\d\s$/.test(text.slice(Math.max(0, at - 4), at))) continue;
      lead(at, true);
      out.push(<TextFollower key={at} title={w} />);
      last = at + w.length;
      continue;
    }
    if (w === 'any') {
      const before = text.slice(Math.max(0, at - 6), at), after = text.slice(at + 3, at + 12);
      // only a counted amount is the dot ("2 any" → "2◍"); "any" as a plain word stays a word ("+2 of any color you
      // choose", "pay in any colors"): a dot there read "+2 of ◍ color you choose" (design pod, 2026-10-15)
      const meansResources = /\d\s$/.test(before);
      if (!meansResources) continue;
    }
    // a color that describes a member is a word, like the rim's "MOST BLUE" (Cory: "a dot is no substitute for the
    // word"): "a blue member", "non-gold member", "per blue face-up member"; a resource amount is the dot ("+3 gold")
    if (w !== 'any' && (/non-$/.test(text.slice(Math.max(0, at - 4), at)) || /^\s+(face-up\s+|other\s+)?members?\b/.test(text.slice(at + w.length, at + w.length + 22)))) continue;
    lead(at, true);
    out.push(<Pip key={at} color={w} />);
    last = at + w.length;
  }
  if (last < text.length) out.push(text.slice(last));
  // numbers are always heavy (the grammar): every standalone number in the text, never one inside a word ("P2", "4th")
  return <>{out.flatMap((o, k) => (typeof o === 'string' ? o.split(NUM).map((t, i) => (i % 2 ? <span key={`n${k}.${i}`} className="rich-n">{t}</span> : t)) : [o]))}</>;
}

/** A cost as symbols: [{ color, n }] → "4 ● + 2 ◍", or "free". */
export function CostPips({ parts }) {
  if (!parts || !parts.length) return <>free</>;
  return <>{parts.map((c, k) => <span key={k} className="cp">{k ? ' + ' : ''}<span className="num">{c.n}</span><Pip color={c.color} n={c.n} /></span>)}</>;
}
