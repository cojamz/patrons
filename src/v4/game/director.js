// The director: each move plays as a short chain of animations in cause-and-effect order (Cory, 2026-10-15:
// "whenever somebody does something it should be obvious, and it triggers a chain of animations ... All timed well,
// paced well, and obvious"; "all the cascading effects of an action should be obvious (in addition to the selection
// of that action itself)"). The motion language it follows: design/prototypes/motion/grammar.md.
//
//  1. The selection: your minion stands on the space at once and a trail flies from your column (S1); a rival's minion
//     lifts out of their column and flies to the space, then a read hold (S2). A member used as the move hops.
//  2. The cascade, from the engine's effect stream (engine/v4/effects.js), one cause (one beat) at a time: the source
//     pulses (a space) or hops (a member), then its pieces fly. Payments drop, gains and gifts arc, takes go straight
//     (the victim's stack tugs first), a recruit lifts, takes its coins, flies to the crowd and sends its worth to the
//     count, a follower buy takes its coins, presses and pops, and sends followers. 1–3 of a thing fly as single pieces,
//     4 or more as one bundle with its count. The next beat starts when this one's last piece is two-thirds along
//     (Steady). Every stack and count changes as its pieces leave and land, never before.
//
// planChain is the plan in time (the table's pacing reads its length); playChain puts it on screen with Web Animations
// and timers (no React state). A click or Space skips the rest of a chain to its end (skipChain). Every duration comes
// from src/v4/motion.js at the viewer's speed. A state without an effect stream (an online guest, a catch-up) falls
// back to gains.js, which reads the change of state.
import { MO, flightMs, nextBeatAt } from '../motion.js';
import { playerColor } from '../format.js';
import { gainsBetween } from './gains.js';
import { motionOK, flyPath, pulse, tug, settle, flyMinionsHome, slideShop, holdStack, bump, track, landAll, expectArrival, clearArrivals, clearFlights } from './flight.js';

// ---------- the plan ----------

const causeKey = c => (c ? `${c.kind}:${c.pid ?? ''}:${c.uid ?? ''}:${c.key ?? ''}:${c.qid ?? ''}:${c.tier ?? ''}` : '');
const TYPICAL = 450; // px between a source and its destination, when the plan is made off screen

/** gains.js moves in the effect stream's words (the fallback when a state carries no stream). */
function fromGains(before, state) {
  const conv = w => {
    switch (w && w.kind) {
      case 'slot': return { kind: 'space', key: w.key };
      case 'total': return { kind: 'count', pid: w.pid };
      case 'card': return { kind: 'shop', uid: w.uid };
      case 'rate': return { kind: 'rate', n: w.n };
      default: return w;
    }
  };
  return gainsBetween(before, state).map((m, i) => {
    const from = conv(m.from), to = conv(m.to);
    const cause = from.kind === 'member' ? { kind: 'member', pid: from.pid, def: from.def } : from.kind === 'space' ? { kind: 'space', key: from.key } : { kind: 'guess', n: i };
    return { n: i, type: m.what === 'fol' ? 'followers' : m.pay ? 'pay' : from.kind === 'stack' ? 'transfer' : 'gain', cause, from, to, what: m.what === 'fol' ? { n: m.n } : { r: m.r, n: m.n } };
  });
}

/** One cause's effects as moves: payments, takes (paired steals, color turns included), gives, gains, cards, followers. */
function movesOf(cause, effects, owner) {
  const pays = [], takes = [], gives = [], gains = [], cards = [], fols = [];
  const used = new Set();
  // a steal that changes color (magenta): a rival's pay and the owner's gain of the same total, under one cause
  for (const p of effects) {
    if (p.type !== 'pay' || p.from.pid === owner || used.has(p)) continue;
    const g = effects.find(e => e.type === 'gain' && !used.has(e) && e.to.pid === owner && e.what.n === p.what.n);
    if (g) { used.add(p); used.add(g); takes.push({ from: p.from, to: g.to, n: p.what.n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null }); }
  }
  for (const e of effects) {
    if (used.has(e)) continue;
    if (e.type === 'pay') pays.push(e);
    else if (e.type === 'transfer') (owner != null && e.to.pid === owner ? takes : gives).push({ from: e.from, to: e.to, n: e.what.n, r: e.what.r });
    else if (e.type === 'gain') gains.push(e);
    else if (e.type === 'recruit' || e.type === 'member-move' || e.type === 'release') cards.push(e);
    else if (e.type === 'followers' && e.what.n) fols.push(e);
  }
  // the owner's own gains first, then the spill to rivals (a fan in the same beat)
  gains.sort((a, b) => (a.to.pid === owner ? 0 : 1) - (b.to.pid === owner ? 0 : 1));
  return { pays, takes, gives, gains, cards, fols };
}

/**
 * What a change of state plays: { atoms: [{ at, op, ... }], total } in ms at the viewer's speed. Pure when `measure`
 * is left out (the table's pacing calls it before anything is on screen); playChain passes the screen's distances.
 */
export function planChain(before, state, { mine = [], measure = null } = {}) {
  const atoms = [];
  if (!before || !state || before === state || before.seed !== state.seed || !(state.moves > before.moves)) return { atoms, total: 0 };
  const dist = (a, b) => (measure ? measure(a, b) : TYPICAL);
  const fly = (a, b) => flightMs(dist(a, b));
  let t = 0, end = 0;
  const at = (time, op) => { atoms.push({ at: Math.round(time), ...op }); return time; };
  const ends = x => { end = Math.max(end, x); return x; };
  const sameRound = state.round === before.round;
  let pulsed = null; // the space already lit by the selection

  // 1. the selection
  const placed = sameRound ? Object.keys(state.slots).filter(k => before.slots[k] === undefined) : [];
  for (const key of placed) {
    const pid = state.slots[key];
    if (mine.includes(pid)) {
      at(0, { op: 'minion', pid, key, own: true, dur: MO.trail });
      at(0, { op: 'pulse', place: { kind: 'space', key }, dur: MO.ownStamp });
      t = ends(MO.trail * 0.6);
    } else {
      at(0, { op: 'minion', pid, key, own: false, dur: MO.minionFly });
      const landed = ends(MO.minionFly);
      at(landed + MO.readHold, { op: 'pulse', place: { kind: 'space', key }, dur: MO.pulse });
      t = ends(landed + MO.readHold + MO.lead);
    }
    pulsed = key;
  }
  if (!sameRound && before.round >= 1) { at(0, { op: 'home' }); t = ends(MO.minionsHome); }

  // 2. the cascade
  const fx = Array.isArray(state.effects) && state.moves === before.moves + 1 ? state.effects : fromGains(before, state);
  const beats = [];
  for (const e of fx) {
    if (!e || !e.cause || e.cause.kind === 'contest') continue; // the Reckoning flies the prizes
    if (['refill', 'shop-out', 'discount'].includes(e.type)) continue; // bookkeeping: the deck deals, the price shows it
    const k = causeKey(e.cause);
    if (!beats.length || beats[beats.length - 1].key !== k) beats.push({ key: k, cause: e.cause, effects: [] });
    beats[beats.length - 1].effects.push(e);
  }
  const pieces = (time, from, to, n, opt = {}) => {
    // 1–3 single pieces, 60ms apart (Steady); 4 or more one bundle carrying its count
    const d = fly(from, to);
    if (n >= 4) { at(time, { op: 'piece', from, to, n, bundle: true, dur: d, ...opt }); at(time + d, { op: 'land', to, by: n, bundle: true, ...opt }); return { last: time, d }; }
    for (let k = 0; k < n; k++) { at(time + k * MO.pieceStagger, { op: 'piece', from, to, n: 1, dur: d, ...opt }); at(time + k * MO.pieceStagger + d, { op: 'land', to, by: 1, ...opt }); }
    return { last: time + (n - 1) * MO.pieceStagger, d };
  };
  const after = r => r.last + nextBeatAt(r.d); // when the next beat may start
  const owner0 = c => (c.kind === 'recruit' || c.kind === 'buy' || c.kind === 'space' || c.kind === 'move' || c.kind === 'release' || c.kind === 'member' ? c.pid : null);
  for (const beat of beats) {
    const c = beat.cause, owner = owner0(c);
    const m = movesOf(c, beat.effects, owner);
    let s = t;
    // the source acts first: a member hops, a space pulses (unless the selection just lit it)
    if (c.kind === 'member' && c.uid != null) { at(s, { op: 'hop', place: { kind: 'member', pid: c.pid, uid: c.uid, def: c.def } }); s += MO.lead; }
    else if (c.kind === 'space' && c.key !== pulsed) { at(s, { op: 'pulse', place: { kind: 'space', key: c.key }, dur: MO.pulse }); s += MO.lead; pulsed = c.key; }
    let next = s;
    const isRecruit = c.kind === 'recruit' && m.cards.some(e => e.type === 'recruit');
    // a recruit: the card lifts (a rival's holds a beat: which card), the coins drop into it, then it flies to the crowd
    if (isRecruit) {
      const card = m.cards.find(e => e.type === 'recruit');
      const hold = mine.includes(card.to.pid) ? 0 : MO.rivalBuyHold;
      let paid = s + MO.cardLift + hold;
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + MO.cardLift + hold + i * MO.fan, p.from, { kind: 'shop', index: c.index, uid: c.uid }, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d); }
      const d = fly(card.from, card.to);
      at(s, { op: 'card', uid: card.what.uid, to: card.to.pid, from: card.from, lift: MO.cardLift, wait: paid - s - MO.cardLift, dur: d });
      const landed = ends(paid + d);
      if (card.what.worth > 0) {
        // its worth: follower marks hop from the new chip to the count, which ticks as they land
        const r = pieces(landed, { kind: 'crowd', pid: card.to.pid, uid: card.what.uid }, { kind: 'count', pid: card.to.pid }, card.what.worth, { fol: true, dur: MO.worthHop });
        next = ends(after(r));
        ends(r.last + r.d);
      } else next = landed;
      m.pays.length = 0;
      m.cards.splice(m.cards.indexOf(card), 1);
    }
    // a follower buy: the coins drop into the rate, it presses and pops, the followers fly out
    if (c.kind === 'buy') {
      let paid = s;
      const rate = { kind: 'rate', tier: c.tier, n: c.get };
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + i * MO.fan, p.from, rate, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d); }
      at(paid, { op: 'pulse', place: rate, dur: MO.accept, press: true });
      let o = paid + MO.accept;
      for (const f of m.fols) { const r = pieces(o, rate, f.to, f.what.n, { fol: true }); next = Math.max(next, after(r)); ends(r.last + r.d); o += MO.fan; }
      m.pays.length = 0; m.fols.length = 0;
      next = ends(Math.max(next, o));
    }
    // everything else in the beat, in order: what was paid, what was taken, given, gained, the cards, the followers
    let cur = Math.max(s, next === s ? s : next);
    const phase = list => {
      if (!list.length) return;
      let lastR = null, o = cur;
      for (const g of list) {
        if (g.tug) at(o, { op: 'tug', place: g.from, toward: g.to, dur: MO.tug });
        const r = pieces(o + (g.tug ? MO.tug : 0), g.from, g.to, g.n, g.opt);
        ends(r.last + r.d);
        if (!lastR || r.last + r.d > lastR.last + lastR.d) lastR = r;
        o += MO.fan;
      }
      cur = after(lastR);
    };
    phase(m.pays.map(p => ({ from: p.from, to: p.to.kind === 'bank' && pulsed ? { kind: 'space', key: pulsed } : p.to, n: p.what.n, opt: { pay: true, r: p.what.r, owner: p.from.pid } })));
    phase(m.takes.map(x => ({ from: x.from, to: x.to, n: x.n, tug: true, opt: { take: true, r: x.r, turn: x.turn, owner: x.to.pid } })));
    phase(m.gives.map(x => ({ from: x.from, to: x.to, n: x.n, opt: { r: x.r, owner: x.to.pid } })));
    // the owner's gains, then the spill fan, which starts when the owner's are two-thirds along (the same beat)
    const own = m.gains.filter(g => g.to.pid === owner || owner == null), spill = m.gains.filter(g => !(g.to.pid === owner || owner == null));
    const before0 = cur;
    phase(own.map(g => ({ from: g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid } })));
    if (spill.length) { cur = own.length ? cur : before0; phase(spill.map(g => ({ from: g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid, light: true } }))); }
    for (const card of m.cards) {
      const d = card.type === 'member-move' ? MO.swap : fly(card.from, card.to);
      at(cur, { op: 'chip', from: card.from, to: card.to, uid: card.what.uid, path: card.type === 'release' ? 'drop' : card.type === 'member-move' ? 'line' : 'arc', dur: d });
      ends(cur + d);
      cur += nextBeatAt(d);
    }
    phase(m.fols.map(f => (f.what.n > 0 ? { from: f.from.kind === 'bank' && pulsed ? { kind: 'space', key: pulsed } : f.from, to: f.to, n: f.what.n, opt: { fol: true } } : { from: f.from, to: f.to, n: -f.what.n, opt: { fol: true, pay: true } })));
    t = Math.max(t, cur);
  }
  const turnPasses = !!(state.pending && before.pending && state.pending.player !== before.pending.player);
  return { atoms: atoms.sort((a, b) => a.at - b.at), total: end ? end + (turnPasses ? MO.breath : 0) : 0 };
}

// ---------- the screen ----------

const chain = { timers: new Map(), holds: new Map(), counts: new Set(), root: null, until: 0, seq: 0 };
const skipSubs = new Set();
/** Something that should jump to its end state when a chain is skipped (Tick, the table's pacing). */
export const onChainSkip = fn => { skipSubs.add(fn); return () => skipSubs.delete(fn); };
export const chainRunning = () => chain.timers.size > 0;

const later = (ms, fn) => {
  if (!(ms > 0)) { fn(false); return; }
  const id = setTimeout(() => { chain.timers.delete(id); fn(false); }, ms);
  chain.timers.set(id, { fn, due: performance.now() + ms });
};
function endChain() {
  for (const { h } of chain.holds.values()) if (h) h.done();
  chain.holds.clear();
  clearArrivals(chain.counts);
  chain.counts.clear();
  if (chain.root) delete chain.root.dataset.chain;
  chain.until = 0;
}
/** Skip the rest of the chain on screen: every step jumps to its end state at once (a click, Space). */
export function skipChain() {
  if (!chain.timers.size) return false;
  const pending = [...chain.timers.entries()].sort((a, b) => a[1].due - b[1].due);
  chain.timers.clear();
  for (const [id, { fn }] of pending) { clearTimeout(id); fn(true); }
  landAll();
  clearFlights(0);
  endChain();
  for (const fn of skipSubs) fn();
  try { dispatchEvent(new Event('patrons:chain-skip')); } catch { /* no window */ }
  return true;
}

const shown = el => (el && el.getBoundingClientRect().width > 0 ? el : null);
/** Where an effect's source or target is on screen. */
function placeEl(root, w, ctx) {
  if (!root || !w) return null;
  const seat = pid => root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  switch (w.kind) {
    case 'space': return shown(root.querySelector(`[data-slot="${w.key}"] .base`)) || shown(root.querySelector(`[data-slot="${w.key}"]`));
    case 'quadrant': { const q = ctx.state.quadrants.indexOf(w.qid); return shown(root.querySelector(`[data-slot^="${q}-"] .base`)) || shown(root.querySelector('.stage .hub-label')); }
    case 'stack': { const s = seat(w.pid); return s && shown(s.querySelector(`.cs-stack[data-res="${w.r}"]`)); }
    case 'count': case 'player': { const s = seat(w.pid); return s && (shown(s.querySelector('.cs-total')) || shown(s)); }
    case 'crowd': {
      const s = seat(w.pid);
      if (!s) return null;
      if (w.uid != null) { const m = shown(s.querySelector(`.cs-member[data-uids~="${w.uid}"]`)); if (m) return m; }
      return shown(s.querySelector('.cs-crowd .cs-member:last-of-type')) || shown(s.querySelector('.cs-crowd')) || shown(s);
    }
    case 'member': {
      const s = seat(w.pid);
      if (!s) return null;
      if (w.uid != null) { const m = shown(s.querySelector(`.cs-member[data-uids~="${w.uid}"]`)); if (m) return m; }
      if (w.def) { const m = shown(s.querySelector(`.cs-member[data-member="${w.def}"]`)); if (m) return m; }
      return shown(s.querySelector('.cs-crowd')) || shown(s);
    }
    case 'shop': {
      const sn = ctx.snap && w.uid != null ? ctx.snap.get(w.uid) : null;
      if (sn && sn.rect) return ctx.lifted.get(w.uid) || { getBoundingClientRect: () => sn.rect, rectOnly: true };
      return shown(root.querySelector(`.lt-shop .card[data-uid="${w.uid}"]`)) || shown(root.querySelector('.lt-shop'));
    }
    case 'rate': return (w.tier && shown(root.querySelector(`.lt-rate[data-rate="${w.tier}"]`))) || (w.n && shown(root.querySelector(`.lt-rate[aria-label*="+${w.n} follower"]`))) || shown(root.querySelector('.lt-rates'));
    case 'pile': return shown(root.querySelector('.lt-deck')) || shown(root.querySelector('.lt-shop'));
    default: return shown(root.querySelector('.stage .hub-label'));
  }
}
const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const dotHtml = (root, r, pid) => {
  const seat = root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const g = seat && seat.querySelector(`.cs-stack[data-res="${r}"] svg`);
  return g ? g.outerHTML : `<i class="piece-dot" style="background:var(--${r || 'lamp-ink'})"></i>`;
};
const folHtml = (root, pid) => { const g = root.querySelector(`.lt-cult-seat[data-seat="${pid}"] .cs-total svg`) || root.querySelector('.cs-total svg'); return g ? g.outerHTML : '<i class="piece-dot" style="background:var(--cream,#f3e6c8)"></i>'; };
const hopEl = (el, ms) => { if (el && el.animate && !el.rectOnly) track(el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: ms, easing: 'cubic-bezier(.3,1.4,.5,1)' })); };

/** The minions still to place, slot by slot, as they stand now (the next chain flies a placed one from its slot). */
function minionColumn(root) {
  const out = new Map();
  if (!root) return out;
  root.querySelectorAll('.cs-minions [data-minion][data-k]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width) out.set(`${el.dataset.minion}:${el.dataset.k}`, { left: r.left, top: r.top, width: r.width, height: r.height });
  });
  return out;
}
let column = new Map();
/** Note the table as it stands (call after every commit that plays no chain, so the next one flies from the right slot). */
export const noteTable = root => { column = minionColumn(root); };

/**
 * Play the chain for a change of state on the table under `root`. `snap` is the shop as it was (snapshotShop),
 * `minionsBefore` the wheel's minions as they were (snapshotMinions), `mine` the viewer's seats. Returns the plan.
 */
export function playChain(root, before, state, { snap = null, minionsBefore = null, mine = [] } = {}) {
  const col = column;
  column = minionColumn(root);
  if (!root || before === state) return { atoms: [], total: 0 };
  if (chain.timers.size) skipChain(); // a new move lands whatever was still playing
  const ctx = { state, before, snap, lifted: new Map() };
  const measure = (a, b) => { const A = placeEl(root, a, ctx), B = placeEl(root, b, ctx); if (!A || !B) return TYPICAL; const [x1, y1] = center(A), [x2, y2] = center(B); return Math.hypot(x2 - x1, y2 - y1); };
  const plan = planChain(before, state, { mine, measure });
  if (!plan.atoms.length || !motionOK()) return plan;
  const t0 = performance.now();
  chain.root = root;
  chain.until = t0 + plan.total;
  root.dataset.chain = '1';
  const seq = ++chain.seq;
  // every stack the chain touches shows what it held before, and counts each piece out and in
  const pending = new Map();
  const holdOf = (el, pid, r) => {
    if (!el || el.rectOnly) return null;
    if (!chain.holds.has(el)) { const p = before.players[pid]; chain.holds.set(el, { h: p ? holdStack(el, p.res[r] || 0) : null }); }
    return chain.holds.get(el).h;
  };
  // counts: the Tick waits for the first follower to land, and counts while the rest do
  const firstLand = new Map();
  for (const a of plan.atoms) if (a.op === 'land' && a.fol && a.to.kind === 'count' && !a.pay) {
    const el = placeEl(root, a.to, ctx);
    if (!el) continue;
    const f = firstLand.get(el) || { at: a.at, last: a.at };
    f.at = Math.min(f.at, a.at); f.last = Math.max(f.last, a.at);
    firstLand.set(el, f);
  }
  for (const [el, f] of firstLand) { expectArrival(el, t0 + f.at, Math.max(0, f.last - f.at)); chain.counts.add(el); }
  // pieces in flight per stack: every stack the chain touches holds what it showed before from the start, and lets
  // go of its held number when its last piece has left or landed
  for (const a of plan.atoms) {
    if (a.op !== 'piece' || a.fol) continue;
    for (const w of [a.from, a.to]) if (w.kind === 'stack') { const el = placeEl(root, w, ctx); if (el) { holdOf(el, w.pid, w.r); pending.set(el, (pending.get(el) || 0) + 1); } }
  }
  const release = el => { const n = (pending.get(el) || 1) - 1; pending.set(el, n); if (n <= 0) { const x = chain.holds.get(el); if (x && x.h) x.h.done(); chain.holds.delete(el); } };
  for (const a of plan.atoms) {
    later(a.at, skip => {
      switch (a.op) {
        case 'minion': {
          const slot = root.querySelector(`[data-slot="${a.key}"]`);
          if (skip || !slot) return;
          slot.classList.add('chosen');
          later(a.dur + MO.pulse, () => slot.classList.remove('chosen'));
          const landed = slot.querySelector(`.worker[data-seat="${a.pid}"]`) || slot.querySelector('.worker');
          const k = Math.max(0, (before.players[a.pid] ? before.players[a.pid].left : 1) - 1);
          const fr = col.get(`${a.pid}:${k}`);
          const from = fr ? { getBoundingClientRect: () => fr } : (root.querySelector(`.lt-seat[data-pid="${a.pid}"] .cs-minions`) || root.querySelector(`[data-leader="${a.pid}"]`));
          const to = landed || slot.querySelector('.base');
          if (!from || !to) return;
          const F = from.getBoundingClientRect(), T = to.getBoundingClientRect(), size = Math.max(16, landed ? T.width : 18);
          const ra = { left: F.left + F.width / 2 - size / 2, top: F.top + F.height / 2 - size / 2, width: size, height: size };
          const rb = { left: T.left + T.width / 2 - size / 2, top: T.top + T.height / 2 - size / 2, width: size, height: size };
          const html = landed ? landed.innerHTML : `<i style="background:${playerColor(a.pid)}"></i>`;
          if (a.own) {
            // yours stands in the door at once (the stamp); the trail from your column fades onto it
            if (landed && landed.animate) track(landed.animate([{ transform: 'scale(1.25)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: MO.ownStamp, easing: 'cubic-bezier(.3,1.5,.5,1)' }));
            flyPath(html, 'worker-flight minion-flight trail', ra, rb, { path: 'arc', duration: a.dur });
          } else {
            flyPath(html, 'worker-flight minion-flight', ra, rb, { path: 'arc', duration: a.dur });
            if (landed && landed.animate) track(landed.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: a.dur + 30 }));
          }
          return;
        }
        case 'home': if (!skip && minionsBefore) flyMinionsHome(root, minionsBefore); return;
        case 'pulse': if (!skip) pulse(placeEl(root, a.place, ctx), a.dur, { press: !!a.press }); return;
        case 'hop': if (!skip) hopEl(placeEl(root, a.place, ctx), MO.hop); return;
        case 'tug': if (!skip) tug(placeEl(root, a.place, ctx), placeEl(root, a.toward, ctx), a.dur); return;
        case 'card': {
          // the recruited card: a picture of it lifts in its old slot, takes its coins, then flies to its new chip
          const s = snap && snap.get(a.uid);
          if (skip || !s || !s.rect) return;
          const g = document.createElement('div');
          g.className = 'flight card-flight ghost-layer';
          g.dataset.born = String(Date.now());
          g.innerHTML = s.html;
          Object.assign(g.style, { left: `${s.rect.left}px`, top: `${s.rect.top}px`, width: `${s.rect.width}px`, height: `${s.rect.height}px` });
          document.body.appendChild(g);
          if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
          ctx.lifted.set(a.uid, g);
          const chip = root.querySelector(`.lt-seat[data-pid="${a.to}"] [data-uids~="${a.uid}"]`) || placeEl(root, { kind: 'crowd', pid: a.to }, ctx);
          const B = chip ? chip.getBoundingClientRect() : s.rect;
          const dx = B.left + B.width / 2 - (s.rect.left + s.rect.width / 2), dy = B.top + B.height / 2 - (s.rect.top + s.rect.height / 2);
          const total = a.lift + a.wait + a.dur;
          const k1 = a.lift / total, k2 = (a.lift + a.wait) / total;
          const sc = B.width ? Math.max(0.2, Math.min(0.5, B.width / s.rect.width)) : 0.3;
          const anim = track(g.animate([
            { transform: 'translate(0,0) scale(1)', offset: 0 },
            { transform: 'translate(0,-10px) scale(1.06)', offset: k1 },
            { transform: 'translate(0,-10px) scale(1.06)', offset: k2, easing: 'cubic-bezier(.3,.7,.2,1)' },
            { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 40}px) scale(${(1.06 + sc) / 2})`, offset: k2 + (1 - k2) * 0.5 },
            { transform: `translate(${dx}px,${dy}px) scale(${sc})`, opacity: 0.2, offset: 1 },
          ], { duration: total, fill: 'forwards' }));
          const done = () => g.remove();
          anim.addEventListener('finish', done); anim.addEventListener('cancel', done);
          slideShop(root, snap);
          if (chip && chip.animate) {
            track(chip.animate([{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }], { duration: total }));
            later(total, sk => { if (!sk) track(chip.animate([{ boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }, { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.1)', offset: 0.35 }, { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }], { duration: MO.ring, easing: 'ease-out' })); });
          }
          return;
        }
        case 'chip': {
          if (skip) return;
          const A = placeEl(root, a.from, ctx), B = placeEl(root, a.to, ctx);
          if (!A || !B) return;
          const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect(), size = 26;
          flyPath(`<i class="piece-dot member"></i>`, 'piece-flight piece-member', { left: ra.left + ra.width / 2 - size / 2, top: ra.top + ra.height / 2 - size / 2, width: size, height: size },
            { left: rb.left + rb.width / 2 - size / 2, top: rb.top + rb.height / 2 - size / 2, width: size, height: size }, { path: a.path, duration: a.dur });
          later(a.dur, sk => { if (!sk) settle(B, MO.settle); });
          return;
        }
        case 'piece': {
          const A = placeEl(root, a.from, ctx), B = placeEl(root, a.to, ctx);
          // a piece leaving a stack: its number drops as it goes
          if (a.from.kind === 'stack' && A) { const h = holdOf(A, a.from.pid, a.from.r); if (h) h.step(-(a.bundle ? a.n : 1)); if (!skip) bump(A, true); }
          if (a.to.kind === 'stack' && B) holdOf(B, a.to.pid, a.to.r);
          if (a.from.kind === 'stack' && A) release(A);
          if (skip || !A || !B) return;
          const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect(), size = a.fol ? 18 : 16;
          const pid = a.to.kind === 'stack' || a.to.kind === 'count' ? a.to.pid : a.from.pid;
          const html = a.fol ? folHtml(root, pid) : dotHtml(root, a.r, a.owner ?? pid);
          const path = a.pay ? 'drop' : a.take ? 'line' : 'arc';
          flyPath(html, `piece-flight piece-${a.fol ? 'fol' : 'res'}${a.pay ? ' pay' : ''}`,
            { left: ra.left + ra.width / 2 - size / 2, top: ra.top + ra.height / 2 - size / 2, width: size, height: size },
            { left: rb.left + rb.width / 2 - size / 2, top: rb.top + rb.height / 2 - size / 2, width: size, height: size },
            { path, duration: a.dur, label: a.bundle ? `+${a.n}` : '', trail: a.bundle ? 2 : 0, trailGap: MO.bundleTrail, turnTo: a.turn ? dotHtml(root, a.turn, pid) : null });
          return;
        }
        case 'land': {
          const B = placeEl(root, a.to, ctx);
          if (!B) return;
          if (a.to.kind === 'stack' && !a.pay) {
            const h = holdOf(B, a.to.pid, a.to.r);
            if (h) { if (a.bundle && !skip) h.roll(a.by, MO.roll); else h.step(a.by); }
            if (a.bundle && !skip) later(MO.roll, () => release(B)); else release(B);
          }
          if (!skip) settle(B, MO.settle, a.bundle ? 1.24 : a.light ? 1.1 : a.pay ? 1.06 : 1.18);
          return;
        }
        default:
      }
    });
  }
  later(plan.total, () => { if (chain.seq === seq) endChain(); });
  if (typeof window !== 'undefined') { window.__patronsChains = (window.__patronsChains || 0) + 1; window.__patronsChainMs = plan.total; }
  return plan;
}

/** Install the skip: a press anywhere, or Space (when it isn't pressing a button), lands the chain on screen. */
export function installChainSkip() {
  if (typeof addEventListener !== 'function') return () => {};
  const down = () => { if (chain.timers.size) skipChain(); };
  const key = e => {
    if (e.key !== ' ' || !chain.timers.size) return;
    const t = e.target;
    skipChain();
    if (!(t && t.closest && t.closest('input,textarea,select,button,[role="button"],[contenteditable]'))) e.preventDefault();
  };
  addEventListener('pointerdown', down, true);
  addEventListener('keydown', key, true);
  return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
}
