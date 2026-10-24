// Pixel templates for the figures that aren't cards: a player's cult leader (32×32, a robe with room for the
// player's emoji on the chest) and a minion (16×16, a small hooded worker). Palette keys as in index.js: digits are
// the seat's accent color (shade/base/highlight), letters the shared neutrals.
function centered(w, body, size) {
  if (w <= 0) return '.'.repeat(size);
  const s = body(w);
  const left = Math.floor((size - s.length) / 2);
  return '.'.repeat(left) + s + '.'.repeat(size - left - s.length);
}
const robe = (w, mid = n => '2'.repeat(n)) => (w <= 2 ? '2'.repeat(w) : `3${mid(w - 2)}1`);

/** 32×32 leader: hood with a shadowed face and two glints, broad robe, a 12×12 panel on the chest (rows 17–28). */
export const LEADER = (() => {
  const W = [0, 0, 6, 10, 12, 14, 16, 16, 16, 16, 16, 18, 20, 22, 22, 24, 24, 24, 26, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 30, 30, 0];
  return W.map((w, y) => centered(w, n => {
    if (y >= 5 && y <= 10) { // face in the hood
      const face = n - 6;
      const f = Array(face).fill('d');
      if (y === 7) { f[2] = 'l'; f[face - 3] = 'l'; }
      return `322${f.join('')}221`;
    }
    if (y >= 17 && y <= 28) return robe(n, k => { const side = (k - 12) / 2; return '2'.repeat(Math.floor(side)) + 'l'.repeat(12) + '2'.repeat(Math.ceil(side)); });
    return robe(n);
  }, 32));
})();
/** Where the emoji (or the fallback sigil) sits on the leader: a 12×12 box. */
export const LEADER_PANEL = { x: 10, y: 17, size: 12 };

/** 16×16 minion: a small hooded worker. */
export const MINION = (() => {
  const W = [0, 0, 4, 6, 8, 8, 8, 8, 10, 10, 12, 12, 12, 12, 12, 0];
  return W.map((w, y) => centered(w, n => {
    if (y === 5 || y === 6) { const f = Array(n - 4).fill('d'); if (y === 5) { f[0] = 'l'; f[n - 5] = 'l'; } return `32${f.join('')}21`; }
    return robe(n);
  }, 16));
})();
