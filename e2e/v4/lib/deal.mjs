// A member for a test save, whether or not the cull (src/engine/v4/content/cull.js) deals it: a copy nobody holds if
// the deck has one, else a fresh copy minted the way createGame deals (cut cards stay defined), so a save never
// depends on which members the cull keeps. Mutates s (the caller clones first when it must).
export function freeCard(s, def) {
  const held = new Set(s.players.flatMap(p => p.members));
  const have = Object.keys(s.cards).map(Number).find(u => s.cards[u].def === def && !held.has(u));
  if (have != null) return have;
  const uid = Math.max(-1, ...Object.keys(s.cards).map(Number)) + 1;
  s.cards[uid] = { uid, def };
  return uid;
}
