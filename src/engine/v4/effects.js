// What moved in one applied move, and why (Cory, 2026-10-15: "all the cascading effects of an action should be
// obvious"). The table plays these back as a chain of pieces flying from their source to where they land.
//
// How: core.js opens a frame for each cause (the space taken, a member's trigger, a recruit, a follower buy, a round's
// start, a contest, a release, the end of the game). Whenever a frame opens or closes, the frame on top writes down
// what changed since it last looked, as effects carrying its cause. So the effects add up exactly to the move's
// change of state, by construction, whatever the content code did (src/test/engine/v4/effects.test.js checks it over
// whole games), and no content file has to report anything itself.
//
// Recording is opt-in per move (applyMove(prev, move, { effects: true }): the play session asks, bots' rollouts
// don't). The list rides on the new state as a non-enumerable `effects` property: never saved, never sent, never
// cloned into the next state.
//
// An effect: { n (order), type, cause, from, to, what }
//   type: 'gain' | 'pay' | 'transfer' | 'followers' | 'recruit' | 'release' | 'member-move' | 'refill' | 'shop-out' | 'discount'
//        | 'minion' (an extra minion this round: from the spare minions, { kind: 'pool' }, to { kind: 'minions', pid })
//   cause: { kind: 'space', key, qid, pid } | { kind: 'member', pid, uid, def } | { kind: 'recruit', pid, uid, index }
//        | { kind: 'buy', pid, tier, get } | { kind: 'contest', qid, round } | { kind: 'round', round }
//        | { kind: 'release', pid, uid } | { kind: 'final' } | { kind: 'setup', pid, qid } | { kind: 'move', pid, option, slot }
//   from / to: { kind: 'space', key, qid } | { kind: 'quadrant', qid } | { kind: 'member', pid, uid } | { kind: 'stack', pid, r }
//        | { kind: 'count', pid } | { kind: 'crowd', pid } | { kind: 'shop', index, uid } | { kind: 'rate', tier }
//        | { kind: 'rim', qid } | { kind: 'pile' } | { kind: 'bank' } | { kind: 'player', pid }
//   what: { r, n } resources · { n } followers, a discount or minions · { uid, worth } a member

let rec = null;

/** Start recording a move. `followers(state, p)` and `worth(card)` come from core (no import cycle). */
export function startEffects(state, cause, { followers, worth, minions }) {
  rec = { state, list: [], stack: [], n: 0, followers, worth, minions };
  push(cause);
}
/** Stop and return the move's effects (closing any frame left open). */
export function stopEffects() {
  if (!rec) return [];
  while (rec.stack.length) pop();
  const out = rec.list;
  rec = null;
  return out;
}
/** Drop a recording (the move threw). */
export function abandonEffects() { rec = null; }
export const recordingEffects = () => rec !== null;

const top = () => rec.stack[rec.stack.length - 1];
function push(cause) {
  if (rec.stack.length) flush(top());
  rec.stack.push({ cause, snap: snap() });
}
function pop() {
  const f = rec.stack.pop();
  flush(f);
  if (rec.stack.length) top().snap = snap();
}
/** Run fn under a cause: what it changes is that cause's doing (nested causes inside it keep their own). */
export function underCause(cause, fn) {
  if (!rec) return fn();
  push(typeof cause === 'function' ? cause() : cause);
  try { return fn(); } finally { if (rec) pop(); }
}

function snap() {
  const s = rec.state;
  return {
    players: s.players.map(p => ({
      res: { ...p.res }, bonus: p.bonus, discount: p.discount || 0, fol: rec.followers(s, p),
      members: p.members.map(u => [u, rec.worth(s.cards[u])]),
    })),
    shop: [...s.shop],
    round: s.round,
    minions: rec.minions ? s.players.map(p => rec.minions(s, p)) : null,
  };
}

/** Where a cause sends what it gives, and receives what is paid to it. */
function placeOf(cause) {
  switch (cause.kind) {
    case 'space': return { kind: 'space', key: cause.key, qid: cause.qid };
    case 'member': return { kind: 'member', pid: cause.pid, uid: cause.uid };
    case 'recruit': return { kind: 'shop', index: cause.index, uid: cause.uid };
    case 'buy': return { kind: 'rate', tier: cause.tier };
    case 'contest': return { kind: 'rim', qid: cause.qid };
    case 'setup': return { kind: 'quadrant', qid: cause.qid };
    case 'release': return { kind: 'member', pid: cause.pid, uid: cause.uid };
    case 'move': {
      // a follow-up choice of the space you took (Collect Debts' picks): from that space
      const last = rec.state.players[cause.pid] && rec.state.players[cause.pid].lastSlot;
      return last && last.key ? { kind: 'space', key: last.key } : { kind: 'bank' };
    }
    default: return { kind: 'bank' };
  }
}

function flush(f) {
  const s = rec.state, was = f.snap, cause = f.cause, place = placeOf(cause);
  const out = [];
  const add = e => out.push({ cause, ...e });
  // members: who has which card now, against before
  const before = new Map(), after = new Map();
  was.players.forEach((p, pid) => p.members.forEach(([u, w]) => before.set(u, { pid, w })));
  s.players.forEach((p, pid) => p.members.forEach(u => after.set(u, { pid, w: rec.worth(s.cards[u]) })));
  const inMoved = new Map(s.players.map(p => [p.id, 0])), outMoved = new Map(s.players.map(p => [p.id, 0]));
  for (const [u, a] of after) {
    const b = before.get(u);
    if (b && b.pid === a.pid) continue;
    inMoved.set(a.pid, inMoved.get(a.pid) + a.w);
    if (b) {
      outMoved.set(b.pid, outMoved.get(b.pid) + b.w);
      add({ type: 'member-move', from: { kind: 'crowd', pid: b.pid }, to: { kind: 'crowd', pid: a.pid }, what: { uid: u, worth: a.w } });
    } else {
      const i = was.shop.indexOf(u);
      add({ type: 'recruit', from: i >= 0 ? { kind: 'shop', index: i, uid: u } : { kind: 'pile' }, to: { kind: 'crowd', pid: a.pid }, what: { uid: u, worth: a.w } });
    }
  }
  for (const [u, b] of before) {
    if (after.has(u)) continue;
    outMoved.set(b.pid, outMoved.get(b.pid) + b.w);
    const i = s.shop.indexOf(u);
    add({ type: 'release', from: { kind: 'crowd', pid: b.pid }, to: i >= 0 ? { kind: 'shop', index: i, uid: u } : { kind: 'pile' }, what: { uid: u, worth: b.w } });
  }
  // the shop: cards dealt from the pile, cards set aside out of it (not to a player)
  for (const u of s.shop) if (!was.shop.includes(u) && !before.has(u)) add({ type: 'refill', from: { kind: 'pile' }, to: { kind: 'shop', index: s.shop.indexOf(u), uid: u }, what: { uid: u } });
  for (const u of was.shop) if (!s.shop.includes(u) && !after.has(u)) add({ type: 'shop-out', from: { kind: 'shop', index: was.shop.indexOf(u), uid: u }, to: { kind: 'pile' }, what: { uid: u } });
  // resources: one player's loss and another's gain of the same color are a transfer (a steal, a gift, a trade)
  const d = s.players.map((p, i) => Object.fromEntries(Object.keys({ ...was.players[i].res, ...p.res }).map(r => [r, (p.res[r] || 0) - (was.players[i].res[r] || 0)])));
  for (const r of s.resources) {
    for (const g of s.players) {
      for (const q of s.players) {
        if (g.id === q.id || !(d[g.id][r] > 0) || !(d[q.id][r] < 0)) continue;
        const k = Math.min(d[g.id][r], -d[q.id][r]);
        d[g.id][r] -= k; d[q.id][r] += k;
        add({ type: 'transfer', from: { kind: 'stack', pid: q.id, r }, to: { kind: 'stack', pid: g.id, r }, what: { r, n: k } });
      }
    }
  }
  s.players.forEach(p => {
    for (const r of Object.keys(d[p.id])) {
      const k = d[p.id][r];
      if (k > 0) add({ type: 'gain', from: place, to: { kind: 'stack', pid: p.id, r }, what: { r, n: k } });
      if (k < 0) add({ type: 'pay', from: { kind: 'stack', pid: p.id, r }, to: place, what: { r, n: -k } });
    }
    // followers beyond the members that came and went (bonus, a contest, a member worth more or less in place)
    const f = rec.followers(s, p) - was.players[p.id].fol - (inMoved.get(p.id) - outMoved.get(p.id));
    if (f > 0) add({ type: 'followers', from: place, to: { kind: 'count', pid: p.id }, what: { n: f } });
    if (f < 0) add({ type: 'followers', from: { kind: 'count', pid: p.id }, to: place, what: { n: f } });
    const disc = (p.discount || 0) - was.players[p.id].discount;
    if (disc) add({ type: 'discount', from: place, to: { kind: 'player', pid: p.id }, what: { n: disc } });
  });
  // extra minions this round (a minion's own count, placed or not, against before; a new round against its usual
  // count): one a rival lost to them comes from that rival, the rest from the spare minions
  if (was.minions) {
    const base = s.round !== was.round ? s.players.map(() => null) : was.minions;
    const m = s.players.map((p, i) => rec.minions(s, p) - (base[i] ?? rec.minions.usual(s, p)));
    for (const g of s.players) for (const q of s.players) {
      if (g.id === q.id || !(m[g.id] > 0) || !(m[q.id] < 0)) continue;
      const k = Math.min(m[g.id], -m[q.id]);
      m[g.id] -= k; m[q.id] += k;
      add({ type: 'minion', from: { kind: 'minions', pid: q.id }, to: { kind: 'minions', pid: g.id }, what: { n: k } });
    }
    s.players.forEach(p => { if (m[p.id] > 0) add({ type: 'minion', from: { kind: 'pool' }, to: { kind: 'minions', pid: p.id }, what: { n: m[p.id] } }); });
  }
  // what was paid goes before what it bought; a member arrives before the followers it's worth
  const rank = { pay: 0, transfer: 1, 'shop-out': 2, recruit: 3, 'member-move': 3, release: 3, refill: 4, gain: 5, minion: 5, discount: 6, followers: 7 };
  out.sort((a, b) => rank[a.type] - rank[b.type]);
  for (const e of out) rec.list.push({ n: rec.n++, ...e });
}
