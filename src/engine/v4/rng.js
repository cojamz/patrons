// Seeded RNG (mulberry32). The generator state lives in game state, so games replay exactly.
export function nextRandom(state) {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function shuffleInPlace(state, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Stateless helper for bots: a small RNG from a numeric seed. Its position is readable and settable as `.state`
// (seededRandom(r.state) continues exactly where r is), so a bot can think in a worker and hand the draws back.
export function seededRandom(seed) {
  let s = seed >>> 0;
  const next = () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Object.defineProperty(next, 'state', { get: () => s, set: v => { s = v >>> 0; } });
  return next;
}
