// A member for a test save, taken out of wherever the game keeps it unheld: the pile, the shop, or a round deck still
// waiting to be shuffled in (round decks, Oct 25). A card no one can take that way (cut by the cull, or a color's
// artifact, which is a card of its own) is minted fresh the way createGame deals, so a save never depends on which
// members the cull, the round decks or the artifacts hold back. Mutates s.
export function takeCard(s, def) {
  const arts = new Set(Object.values(s.artifacts || {}));
  const waiting = Object.values(s.waiting || {});
  const free = u => s.cards[u].def === def && !arts.has(u);
  let u = s.pile.find(free) ?? s.shop.find(free);
  for (const w of waiting) if (u == null) u = w.find(free);
  if (u != null) {
    // in place, never a new array: callers write `(to === 'shop' ? s.shop : …).push(takeCard(s, def))`
    for (const list of [s.pile, s.shop, ...waiting]) { const k = list.indexOf(u); if (k >= 0) list.splice(k, 1); }
    return u;
  }
  u = Math.max(-1, ...Object.keys(s.cards).map(Number)) + 1;
  s.cards[u] = { uid: u, def };
  return u;
}
