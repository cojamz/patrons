// A deep copy of plain game data. State is plain JSON (the online host plays moves on JSON-parsed states), and a
// hand copy is several times faster than structuredClone: 336 → 59 µs on a late-game state (smoothness panel, Oct 28).
export const plainCopy = v => {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(plainCopy);
  const o = {};
  for (const k in v) o[k] = plainCopy(v[k]);
  return o;
};
