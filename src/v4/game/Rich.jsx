// Resources as colored symbols inside any rules text or cost (Cory, 2026-10-14): "+3 gold" reads as "+3 ●" in gold,
// "2 any" as "2 ◍" (the wild token). Each symbol says what it is on hover (every element explains itself).
const COLORS = ['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white'];
const WORD = new RegExp(`\\b(${COLORS.join('|')}|any)\\b`, 'g');

/** One resource symbol. color: a resource name or 'any'. */
export function Pip({ color, n }) {
  const label = color === 'any' ? 'any resources' : color;
  return (
    <span className={`pip${color === 'any' ? ' wild' : ''}`} style={color === 'any' ? undefined : { '--c': `var(--${color})` }}
      title={n != null ? `${n} ${label}` : label} aria-label={n != null ? `${n} ${label}` : label} role="img" />
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
    const w = m[1], at = m.index;
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
