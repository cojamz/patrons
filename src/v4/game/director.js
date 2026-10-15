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
import { MO, flightMs, nextBeatAt, speedScale } from '../motion.js';
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
  if (!before || !state || before === state || before.seed !== state.seed) return { atoms, total: 0, handoff: 0 };
  // a new round after the Reckoning (the table held the scored board, so no move separates the two): the minions walk
  // home to their seats' columns, the closing beat of the round
  if (!(state.moves > before.moves)) {
    if (state.round > before.round && before.round >= 1) { const d = MO.minionsHome; return { atoms: [{ at: 0, op: 'home' }], total: d, handoff: d }; }
    return { atoms, total: 0, handoff: 0 };
  }
  const dist = (a, b) => (measure ? measure(a, b) : TYPICAL);
  const fly = (a, b) => flightMs(dist(a, b));
  let t = 0, end = 0;
  const at = (time, op) => { atoms.push({ at: Math.round(time), ...op }); return time; };
  const ends = x => { end = Math.max(end, x); return x; };
  const sameRound = state.round === before.round;
  let pulsed = null; // the space already lit by the selection

  // 1. the selection
  const placed = sameRound ? Object.keys(state.slots).filter(k => before.slots[k] === undefined).map(k => [k, state.slots[k]]) : [];
  // a minion joining a taken space (a squat) is a placement too
  if (sameRound && state.squats) for (const k of Object.keys(state.squats)) {
    const was = (before.squats && before.squats[k]) || [];
    for (const pid of state.squats[k]) if (!was.includes(pid)) placed.push([k, pid]);
  }
  for (const [key, pid] of placed) {
    if (mine.includes(pid)) {
      at(0, { op: 'minion', pid, key, own: true, dur: MO.trail });
      at(0, { op: 'pulse', place: { kind: 'space', key }, dur: MO.ownStamp });
      t = ends(MO.trail * 0.6);
    } else {
      at(0, { op: 'minion', pid, key, own: false, dur: MO.minionFly });
      const landed = ends(MO.minionFly);
      at(landed + Math.max(0, MO.readHold - MO.pulse), { op: 'pulse', place: { kind: 'space', key }, dur: MO.pulse });
      t = ends(landed + MO.readHold);
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
  let hand = 0; // when the last piece is two-thirds along: the same player's next step may show then
  const pieces = (time, from, to, n, opt = {}) => {
    // 1–3 single pieces, 60ms apart (Steady); 4 or more one bundle carrying its count
    const d = opt.dur || fly(from, to);
    hand = Math.max(hand, (n >= 4 ? time : time + (n - 1) * MO.pieceStagger) + d * (2 / 3));
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
      // the coins fly in while the card is lifted; it leaves when the last one is two-thirds of the way there
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + MO.cardLift + hold + i * MO.fan, p.from, { kind: 'shop', index: c.index, uid: c.uid }, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d * (2 / 3)); }
      const d = fly(card.from, card.to);
      hand = Math.max(hand, paid + d * (2 / 3));
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
    // a release (M8): the member drops to the pile first; its refund leaves when the card is 40% along
    if (c.kind === 'release') {
      for (const card of m.cards.filter(e => e.type === 'release')) {
        const d = fly(card.from, card.to);
        at(cur, { op: 'chip', from: card.from, to: card.to, uid: card.what.uid, path: 'drop', dur: d });
        ends(cur + d);
        cur += d * 0.4;
      }
      m.cards = m.cards.filter(e => e.type !== 'release');
    }
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
  // a chain's cap (grammar §5: 3.0s at Steady; fitted from 2.8s so a run of six rival turns stays inside H2's 13s):
  // a longer plan plays faster to fit, never faster than Quick (half)
  const cap = Math.round(2800 * speedScale());
  if (end > cap) {
    const k = Math.max(0.5, cap / end);
    for (const a of atoms) { a.at = Math.round(a.at * k); if (a.dur) a.dur = Math.round(a.dur * k); if (a.lift) a.lift = Math.round(a.lift * k); if (a.wait) a.wait = Math.round(a.wait * k); }
    end *= k; hand *= k; t *= k;
  }
  return { atoms: atoms.sort((a, b) => a.at - b.at), total: end ? Math.round(end + (turnPasses ? MO.breath : 0)) : 0, handoff: end ? Math.round(Math.max(hand, t)) : 0, turnPasses };
}

/**
 * How long the table holds a step on screen before showing the next one (the table's pace, grammar §5): the same
 * player's next step shows at this chain's hand-off (at least `floor` after a rival's visible step); a turn that
 * passes waits for the whole chain and its breath; a rival's step with nothing to show costs nothing when the same
 * bot moves next, and a turn-ending pass holds MO.passHold. `base`: the hold for anything else (your own steps).
 * Pure: useTable paces with it, and src/test/v4/ui/pacing.test.js checks H2/H3 with it over recorded games.
 */
export function holdAfter(plan, { sameNext, rivalStep, floor = 400, base = 0, nextPlaces = false, placing = false }) {
  // a turn that passes to a placement: the next player's minion leaves its column during this chain's closing breath
  // (the departure is the next turn's first, quiet motion, at another seat), so the breath and the departure overlap
  const passes = plan.turnPasses && nextPlaces ? plan.total - MO.breath : plan.total;
  // the floor keeps a rival's visible step on screen before another player's step or the rival's next turn; never
  // between the same player's own sub-steps (a setup pick, the buy after a choice): those flow at their hand-off
  const floored = rivalStep && (!sameNext || nextPlaces) ? floor : 0;
  // a rival's placement hands on at its hand-off (its last piece two-thirds along), even when its turn ends there
  if (plan.total) return Math.max(sameNext || (placing && rivalStep) ? plan.handoff : passes, floored);
  return rivalStep ? (sameNext ? 0 : MO.passHold) : base;
}
/** The longest a step may hold on screen: the chain's cap plus its breath and the floor (re-timing never goes past it). */
export const holdCap = () => Math.round(2800 * speedScale()) + MO.breath + 400;

// ---------- the screen ----------
// One clock for every chain on the table, run by requestAnimationFrame. It advances by at most two frames' worth per
// frame, so a late frame (a loaded box) stretches the show instead of bunching its pieces; and a piece's landing (its
// count ticking, its stack settling) comes from that piece's own animation finishing, never from a separate timer.

const chain = { queue: [], clock: 0, wall: 0, last: null, raf: 0, flying: 0, holds: new Map(), pending: new Map(), counts: new Set(), root: null };
const skipSubs = new Set();
/** Something that should jump to its end state when a chain is skipped (the table's pacing). */
export const onChainSkip = fn => { skipSubs.add(fn); return () => skipSubs.delete(fn); };
const endSubs = new Set();
/** Called whenever the table's chains have all played out (or were skipped): the summary may show. */
export const onChainEnd = fn => { endSubs.add(fn); return () => endSubs.delete(fn); };
export const chainRunning = () => chain.queue.length > 0 || chain.flying > 0;

function tick(now) {
  chain.raf = 0;
  if (chain.last == null) chain.wall = now - chain.clock;
  const dt = chain.last == null ? 0 : Math.min(34, Math.max(0, now - chain.last));
  chain.last = now;
  chain.clock += dt;
  // a late frame stretches the show rather than bunching it, but never by more than 250ms behind the wall clock
  // (a box that is slow for seconds still plays the chain at about its pace)
  const behind = now - chain.wall - chain.clock;
  if (behind > 250) chain.clock += behind - 250;
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  if (chain.queue.length || chain.flying > 0) chain.raf = requestAnimationFrame(tick);
  else endChain();
}
const run = () => { if (!chain.raf && typeof requestAnimationFrame === 'function') chain.raf = requestAnimationFrame(tick); };
function schedule(at, fn) {
  const item = { at, fn };
  let k = chain.queue.length;
  while (k > 0 && chain.queue[k - 1].at > at) k--;
  chain.queue.splice(k, 0, item);
}
function endChain(now = false) {
  for (const { h } of chain.holds.values()) if (h) h.done(now);
  chain.holds.clear();
  chain.pending.clear();
  clearArrivals(chain.counts);
  chain.counts.clear();
  if (chain.root) delete chain.root.dataset.chain;
  chain.last = null;
  for (const fn of endSubs) fn();
}
/** Skip the rest of the chain on screen: every step jumps to its end state at once (a click, Space). */
export function skipChain() {
  if (!chainRunning()) return false;
  const q = chain.queue;
  chain.queue = [];
  for (const item of q) item.fn(true);
  landAll();
  clearFlights(0);
  chain.flying = 0;
  chain.epoch = (chain.epoch || 0) + 1; // landings still resolving from the skipped chain change nothing
  if (chain.raf) { cancelAnimationFrame(chain.raf); chain.raf = 0; }
  chain.handoffAt = 0;
  endChain(true);
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
    case 'quadrant': {
      // a starting pick: from the button pressed, while the picker is up; else that quadrant's own spaces
      const q = ctx.state.quadrants.indexOf(w.qid);
      return shown(root.querySelector(`[data-option="color:${w.qid}"]`)) || shown(root.querySelector(`[data-slot^="${q}-"] .base`)) || shown(root.querySelector('.stage .hub-label'));
    }
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
      if (sn && sn.rect) return { getBoundingClientRect: () => sn.rect, rectOnly: true };
      return shown(root.querySelector(`.lt-shop .card[data-uid="${w.uid}"]`)) || shown(root.querySelector('.lt-shop'));
    }
    case 'rate': return (w.tier && shown(root.querySelector(`.lt-rate[data-rate="${w.tier}"]`))) || (w.n && shown(root.querySelector(`.lt-rate[aria-label*="+${w.n} follower"]`))) || shown(root.querySelector('.lt-rates'));
    case 'pile': return shown(root.querySelector('.lt-deck')) || shown(root.querySelector('.lt-shop'));
    default: return shown(root.querySelector('.stage .hub-label'));
  }
}
const dotHtml = (root, r, pid) => {
  const seat = root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const g = seat && seat.querySelector(`.cs-stack[data-res="${r}"] svg`);
  return g ? g.outerHTML : `<i class="piece-dot" style="background:var(--${r || 'lamp-ink'})"></i>`;
};
const folHtml = (root, pid) => { const g = root.querySelector(`.lt-cult-seat[data-seat="${pid}"] .cs-total svg`) || root.querySelector('.cs-total svg'); return g ? g.outerHTML : '<i class="piece-dot" style="background:var(--cream,#f3e6c8)"></i>'; };
// a whole region (the shop strip, a chair: a fallback target) never hops or pops: its box is the furniture, which never
// moves (hotseat region gate); only the thing inside it does
const region = el => !!(el && el.matches && el.matches('[data-region]'));
const hopEl = (el, ms) => { if (el && el.animate && !el.rectOnly && !region(el)) track(el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: ms, easing: 'cubic-bezier(.3,1.4,.5,1)' })); };
const square = (r, size) => ({ left: r.left + r.width / 2 - size / 2, top: r.top + r.height / 2 - size / 2, width: size, height: size });
const onFinish = (anim, fn) => { if (anim && anim.finished) anim.finished.then(() => fn(), () => fn()); else fn(); };

/**
 * When the shop's new card may be dealt, in ms from this state's commit: after a recruited card has left its slot and
 * the row has slid (grammar B4), so two cards never share a slot. 0 when nothing was bought from the shop.
 */
export function dealAfter(state) {
  const fx = state && Array.isArray(state.effects) ? state.effects : null;
  const rec = fx && fx.find(e => e.type === 'recruit' && e.from && e.from.kind === 'shop');
  if (!rec) return 0;
  const paid = fx.filter(e => e.type === 'pay' && e.cause === rec.cause).reduce((t, e) => t + Math.min(3, e.what.n), 0);
  return Math.round(MO.cardLift + Math.max(0, paid - 1) * MO.pieceStagger + flightMs(TYPICAL) * (2 / 3) + MO.shopSlide);
}

/** (kept for callers: a placed minion's slot is read when its chain plays) */
export const noteTable = root => { void root; };

/**
 * Play the chain for a change of state on the table under `root`. `snap` is the shop as it was (snapshotShop),
 * `minionsBefore` the wheel's minions as they were (snapshotMinions), `mine` the viewer's seats. Returns the plan.
 * A chain may start while the last one's tail is still landing (the same player's next step shows at its handoff).
 */
export function playChain(root, before, state, { snap = null, minionsBefore = null, mine = [], chips = null } = {}) {
  if (!root || before === state) return { atoms: [], total: 0, handoff: 0 };
  const ctx = { state, before, snap, chips };
  // read everything first; every write waits for the clock's next frame (before it paints): a write here made the
  // next layout effect lay the whole page out again
  const found = new Map(), rects = new Map();
  const where = w => { if (!w) return null; const k = JSON.stringify(w); if (!found.has(k)) found.set(k, placeEl(root, w, ctx)); return found.get(k); };
  const rectOf = e => { if (!rects.has(e)) rects.set(e, e.getBoundingClientRect()); return rects.get(e); };
  const measure = (a, b) => { const A = where(a), B = where(b); if (!A || !B) return TYPICAL; const ra = rectOf(A), rb = rectOf(B); return Math.hypot(rb.left + rb.width / 2 - ra.left - ra.width / 2, rb.top + rb.height / 2 - ra.top - ra.height / 2); };
  const plan = planChain(before, state, { mine, measure });
  if (!plan.atoms.length || !motionOK()) return plan;
  // where each placed minion stood in its column: the slot past the last one still standing there
  for (const a of plan.atoms) {
    if (a.op !== 'minion') continue;
    const left = [...root.querySelectorAll(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions [data-minion]`)];
    const last = left[left.length - 1];
    if (last) { const r = rectOf(last), prev = left.length > 1 ? rectOf(left[left.length - 2]) : null; const dx = prev ? r.left - prev.left : 0, dy = prev ? r.top - prev.top : r.height + 2; a.fromRect = { left: r.left + dx, top: r.top + dy, width: r.width, height: r.height }; }
    else { const c = root.querySelector(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions`); if (c) a.fromRect = rectOf(c); }
    const slot = root.querySelector(`[data-slot="${a.key}"]`);
    a.landed = slot && (slot.querySelector(`.worker[data-seat="${a.pid}"]`) || slot.querySelector('.worker'));
    a.slotEl = slot;
    a.toRect = a.landed ? rectOf(a.landed) : slot ? rectOf(slot.querySelector('.base') || slot) : null;
  }
  const toHold = [];
  for (const a of plan.atoms) {
    if (a.op !== 'piece' || a.fol) continue;
    for (const w of [a.from, a.to]) if (w.kind === 'stack') { const el = where(w); if (el) { toHold.push([el, w]); chain.pending.set(el, (chain.pending.get(el) || 0) + (a.bundle ? 1 : 1)); } }
  }
  // the follower count waits for its first piece to land (Tick listens for it), and counts while the rest do
  // a chain that arrives while another plays (a choice answered mid-chain, a bot's next step) starts at that one's
  // hand-off: the beats already playing finish first (grammar S3, §5)
  const base = chainRunning() ? Math.max(chain.clock, chain.handoffAt || 0) : chain.clock;
  chain.handoffAt = base + (plan.handoff || plan.total);
  const firstLand = new Map();
  for (const a of plan.atoms) if (a.op === 'land' && a.fol && a.to.kind === 'count' && !a.pay) {
    const el = where(a.to);
    if (!el) continue;
    const f = firstLand.get(el) || { at: a.at, last: a.at };
    f.at = Math.min(f.at, a.at); f.last = Math.max(f.last, a.at);
    firstLand.set(el, f);
  }
  const now0 = performance.now();
  for (const [el, f] of firstLand) { expectArrival(el, now0 + f.at, Math.max(0, f.last - f.at)); chain.counts.add(el); }
  const holdOf = (el, pid, r) => {
    if (!el || el.rectOnly) return null;
    if (!chain.holds.has(el)) { const p = before.players[pid]; chain.holds.set(el, { h: p ? holdStack(el, p.res[r] || 0) : null }); }
    return chain.holds.get(el).h;
  };
  const release = el => { const n = (chain.pending.get(el) || 1) - 1; chain.pending.set(el, n); if (n <= 0) { const x = chain.holds.get(el); if (x && x.h) x.h.done(); chain.holds.delete(el); chain.pending.delete(el); } };
  chain.root = root;
  // now (before this commit paints, after every read above): the chain is on, and every stack it touches holds what
  // it showed before, so no number flashes its new value first
  root.dataset.chain = '1';
  for (const [el, w] of toHold) holdOf(el, w.pid, w.r);
  const epoch = chain.epoch || 0;
  const land = (a, B, skip) => {
    if ((chain.epoch || 0) !== epoch) return; // the chain was skipped: its numbers are already final
    if (a.to.kind === 'stack' && !a.pay && B) {
      const h = holdOf(B, a.to.pid, a.to.r);
      if (h) { if (a.bundle && !skip) h.roll(a.by ?? a.n, MO.roll); else h.step(a.by ?? a.n); }
      if (a.bundle && !skip) setTimeout(() => release(B), MO.roll); else release(B);
    }
    if (a.to.kind === 'count' && B && !B.rectOnly) { try { B.dispatchEvent(new CustomEvent('patrons:land')); } catch { /* old browser */ } }
    if (!skip && B) settle(B, MO.settle, a.bundle ? 1.24 : a.light ? 1.1 : a.pay ? 1.06 : 1.18);
  };
  for (const a of plan.atoms) {
    if (a.op === 'land') continue; // a piece lands when its own flight finishes
    schedule(base + a.at, skip => {
      switch (a.op) {
        case 'minion': {
          if (skip || !a.slotEl || !a.toRect) return;
          a.slotEl.classList.add('chosen');
          setTimeout(() => a.slotEl.classList.remove('chosen'), a.dur + MO.pulse);
          const F = a.fromRect || (root.querySelector(`[data-leader="${a.pid}"]`) || a.slotEl).getBoundingClientRect();
          const size = Math.max(16, a.landed ? a.toRect.width : 18);
          const html = a.landed ? a.landed.innerHTML : `<i style="background:${playerColor(a.pid)}"></i>`;
          if (a.own) {
            // yours stands in the door at once (the stamp); the trail from your column fades onto it
            if (a.landed && a.landed.animate) track(a.landed.animate([{ transform: 'scale(1.25)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: MO.ownStamp, easing: 'cubic-bezier(.3,1.5,.5,1)' }));
            flyPath(html, 'worker-flight minion-flight trail', square(F, size), square(a.toRect, size), { path: 'arc', duration: a.dur, fade: true });
          } else {
            chain.flying++;
            const anim = flyPath(html, 'worker-flight minion-flight', square(F, size), square(a.toRect, size), { path: 'arc', duration: a.dur });
            if (a.landed && a.landed.animate) track(a.landed.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: a.dur + 30 }));
            onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); if (a.landed) settle(a.landed, MO.settle); });
          }
          return;
        }
        case 'home': if (!skip && minionsBefore) flyMinionsHome(root, minionsBefore); return;
        case 'pulse': if (!skip) pulse(where(a.place), a.dur, { press: !!a.press }); return;
        case 'hop': if (!skip) hopEl(where(a.place), MO.hop); return;
        case 'tug': if (!skip) tug(where(a.place), where(a.toward), a.dur); return;
        case 'card': {
          // the recruited card: a picture of it lifts in its old slot, takes its coins, then flies to its new chip
          const sn = snap && snap.get(a.uid);
          if (skip || !sn || !sn.rect) return;
          const g = document.createElement('div');
          g.className = 'flight card-flight ghost-layer';
          g.dataset.born = String(Date.now());
          g.innerHTML = sn.html;
          Object.assign(g.style, { left: `${sn.rect.left}px`, top: `${sn.rect.top}px`, width: `${sn.rect.width}px`, height: `${sn.rect.height}px` });
          document.body.appendChild(g);
          if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
          const chip = root.querySelector(`.lt-seat[data-pid="${a.to}"] [data-uids~="${a.uid}"]`) || placeEl(root, { kind: 'crowd', pid: a.to }, ctx);
          const B = chip ? chip.getBoundingClientRect() : sn.rect;
          const dx = B.left + B.width / 2 - (sn.rect.left + sn.rect.width / 2), dy = B.top + B.height / 2 - (sn.rect.top + sn.rect.height / 2);
          const total = a.lift + a.wait + a.dur, k1 = a.lift / total, k2 = (a.lift + a.wait) / total;
          const sc = B.width ? Math.max(0.2, Math.min(0.5, B.width / sn.rect.width)) : 0.3;
          chain.flying++;
          const anim = track(g.animate([
            { transform: 'translate(0,0) scale(1)', offset: 0 },
            { transform: 'translate(0,-10px) scale(1.06)', offset: k1 },
            { transform: 'translate(0,-10px) scale(1.06)', offset: k2, easing: 'cubic-bezier(.3,.7,.2,1)' },
            { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 40}px) scale(${(1.06 + sc) / 2})`, offset: k2 + (1 - k2) * 0.5 },
            { transform: `translate(${dx}px,${dy}px) scale(${sc})`, opacity: 0.2, offset: 1 },
          ], { duration: total, fill: 'forwards' }));
          slideShop(root, snap);
          if (chip && chip.animate) track(chip.animate([{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }], { duration: total }));
          onFinish(anim, () => {
            g.remove();
            chain.flying = Math.max(0, chain.flying - 1);
            if (chip && chip.animate && chip.isConnected && !region(chip)) track(chip.animate([{ boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }, { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.1)', offset: 0.35 }, { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }], { duration: MO.ring, easing: 'ease-out' }));
          });
          return;
        }
        case 'chip': {
          if (skip) return;
          // a member that left its crowd flies from where its chip stood, as itself (its portrait)
          const was = chips && chips.get(a.uid);
          const A = was && a.from.kind === 'crowd' ? { getBoundingClientRect: () => was.rect } : where(a.from), B = where(a.to);
          if (!A || !B) return;
          chain.flying++;
          const pic = was && was.html ? `<span class="piece-member-pic">${was.html}</span>` : '<i class="piece-dot member"></i>';
          const anim = flyPath(pic, 'piece-flight piece-member', square(A.getBoundingClientRect(), 28), square(B.getBoundingClientRect(), 28), { path: a.path, duration: a.dur, fade: true });
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); settle(B, MO.settle); });
          return;
        }
        case 'piece': {
          const A = where(a.from), B = where(a.to);
          // a piece leaving a stack: its number drops as it goes
          if (a.from.kind === 'stack' && A) { const h = holdOf(A, a.from.pid, a.from.r); if (h) h.step(-(a.n || 1)); if (!skip) bump(A, true); release(A); }
          if (skip || !A || !B) { land(a, B, true); return; }
          const size = a.fol ? 18 : 16;
          const pid = a.to.kind === 'stack' || a.to.kind === 'count' ? a.to.pid : a.from.pid;
          const html = a.fol ? folHtml(root, pid) : dotHtml(root, a.r, a.owner ?? pid);
          chain.flying++;
          const anim = flyPath(html, `piece-flight piece-${a.fol ? 'fol' : 'res'}${a.pay ? ' pay' : ''}`, square(A.getBoundingClientRect(), size), square(B.getBoundingClientRect(), size),
            { path: a.pay ? 'drop' : a.take ? 'line' : 'arc', duration: a.dur, label: a.bundle ? `+${a.n}` : '', trail: a.bundle ? 2 : 0, trailGap: MO.bundleTrail, turnTo: a.turn ? dotHtml(root, a.turn, pid) : null, fade: true });
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); land({ ...a, by: a.n }, B, false); });
          return;
        }
        default:
      }
    });
  }
  // what starts at once plays now, before this commit's first paint (the lifted card, the hidden chip, your minion's
  // stamp): never a frame of the end state first
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  run();
  if (typeof window !== 'undefined') { window.__patronsChains = (window.__patronsChains || 0) + 1; window.__patronsChainMs = plan.total; }
  return plan;
}

/** Install the skip: a press anywhere, or Space (when it isn't pressing a button), lands the chain on screen. */
export function installChainSkip() {
  if (typeof addEventListener !== 'function') return () => {};
  // a click on a live choice's target (a seat or space to pick, an answer) is an answer, not a skip: the beats playing
  // finish and the answer's chain follows them (grammar S3). A click anywhere else, or Space, skips.
  const down = e => {
    if (!chainRunning()) return;
    const t = e && e.target;
    const app = t && t.closest && t.closest('.app.game');
    if (app && app.dataset.phase === 'choose' && t.closest('[data-option]')) return;
    skipChain();
  };
  const key = e => {
    if (e.key !== ' ' || !chainRunning()) return;
    const t = e.target;
    skipChain();
    if (!(t && t.closest && t.closest('input,textarea,select,button,[role="button"],[contenteditable]'))) e.preventDefault();
  };
  addEventListener('pointerdown', down, true);
  addEventListener('keydown', key, true);
  return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
}
