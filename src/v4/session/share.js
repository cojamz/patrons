// Structural sharing between two game states (perf, tune pass 2026-10-28). The engine clones the whole state on every
// move (applyMove's structuredClone) and an online snapshot is a fresh JSON.parse, so every player, card and list was a
// new object each step even when nothing in it changed, and no memo `===` check on the table could ever hold.
// share(prev, next) walks next beside prev and puts prev's object in place of every part of next that is deep-equal
// to it: same kind (plain object or array), same keys in the same order, same values (Object.is for the rest).
// Nothing a reader can see changes: next keeps its own root (and its non-enumerable `effects`), and every swapped part
// is equal key for key, in order, so JSON.stringify(next) and every read of next come out exactly as before.
// States are never edited in place after a move (applyMove clones its input; the session's history push happens before
// this runs, and the engine's scratch writes, like a payment's dry run on p.res, are put back before it returns), which
// is what makes sharing parts between them safe.
// One state can hold the same object twice (a choice's options sit on both its queued task and state.pending), and the
// engine may rely on that: a part is swapped only when it and prev's part are each referenced once in their own state,
// so sharing never splits a pair or makes a new one.

const plain = v => {
  if (v === null || typeof v !== 'object') return false;
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
};

// incoming references to every object in a state (an object met again is counted, not walked again)
function refCounts(root) {
  const n = new Map();
  const walk = v => {
    const c = n.get(v);
    n.set(v, (c || 0) + 1);
    if (c) return;
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const x = v[i]; if (x !== null && typeof x === 'object') walk(x); } return; }
    for (const k in v) { const x = v[k]; if (x !== null && typeof x === 'object') walk(x); }
  };
  walk(root);
  return n;
}
const counted = new WeakMap(); // state → its refCounts (prev's were counted when it was the next one)
const countsOf = s => { let c = counted.get(s); if (!c) { c = refCounts(s); counted.set(s, c); } return c; };

let rp = null, rn = null; // the two states' counts, during one share()
const single = (prev, next) => rp.get(prev) === 1 && rn.get(next) === 1;

// returns prev when next is deep-equal to it (and both stand alone), else next with its equal parts swapped for prev's
function same(prev, next) {
  if (Object.is(prev, next)) return prev;
  if (prev === null || next === null || typeof prev !== 'object' || typeof next !== 'object') return next;
  if (Array.isArray(prev)) {
    if (!Array.isArray(next)) return next;
    const n = next.length;
    let all = prev.length === n;
    const m = Math.min(prev.length, n);
    for (let i = 0; i < m; i++) {
      const a = prev[i], b = next[i];
      if (a === b) continue;
      const s = same(a, b);
      if (s !== b) next[i] = s;
      if (s !== a) all = false;
    }
    if (all) {
      // holes or extra non-index keys would not survive the swap unseen: keep next then
      for (let i = 0; i < n; i++) if (!(i in next) || !(i in prev)) return next;
      return Object.keys(next).length === n && Object.keys(prev).length === n && single(prev, next) ? prev : next;
    }
    return next;
  }
  if (Array.isArray(next) || !plain(prev) || !plain(next) || Object.getPrototypeOf(prev) !== Object.getPrototypeOf(next)) return next;
  const kp = Object.keys(prev), kn = Object.keys(next);
  let all = kp.length === kn.length;
  for (let i = 0; i < kn.length; i++) {
    const k = kn[i];
    if (all && kp[i] !== k) all = false;
    if (!Object.prototype.hasOwnProperty.call(prev, k)) { all = false; continue; }
    const a = prev[k], b = next[k];
    if (a === b) continue;
    const s = same(a, b);
    if (s !== b) next[k] = s;
    if (s !== a) all = false;
  }
  // a non-enumerable own property (the root's effects) is not compared: never hand back prev for one that has any
  if (all && Object.getOwnPropertyNames(next).length !== kn.length) return next;
  if (all && Object.getOwnPropertyNames(prev).length !== kp.length) return next;
  return all && single(prev, next) ? prev : next;
}

/** next, with every part deep-equal to prev's replaced by prev's own object. The root is always next's. */
export function share(prev, next) {
  if (!prev || !next || prev === next || !plain(prev) || !plain(next)) return next;
  rp = countsOf(prev); rn = refCounts(next);
  try {
    for (const k of Object.keys(next)) {
      if (!Object.prototype.hasOwnProperty.call(prev, k)) continue;
      const a = prev[k], b = next[k];
      if (a === b) continue;
      const s = same(a, b);
      if (s !== b) next[k] = s;
    }
  } finally { rp = rn = null; }
  // next's counts after the swaps, for the step after this one
  counted.set(next, refCounts(next));
  return next;
}
