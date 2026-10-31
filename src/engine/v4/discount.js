// Keep the origin of unspent discounts with the player, across saves and online snapshots.
// Legacy saves can have an amount with no source; never guess its origin.
export function discountSources(p) {
  let left = Math.max(0, p.discount || 0);
  const out = [];
  for (const source of p.discountSources || []) {
    const n = Math.min(left, Math.max(0, source.n || 0));
    if (n) out.push({ name: source.name, n });
    left -= n;
  }
  if (left) out.push({ name: 'Earlier discount', n: left });
  return out;
}
export function grantDiscount(p, n, name) {
  if (!(n > 0)) return;
  const sources = discountSources(p);
  const source = sources.find(x => x.name === name);
  if (source) source.n += n;
  else sources.push({ name, n });
  p.discount = (p.discount || 0) + n;
  p.discountSources = sources;
}
