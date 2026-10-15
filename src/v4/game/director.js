// The director: each move plays as a short chain of animations in cause-and-effect order (Cory, 2026-10-15:
// "whenever somebody does something it should be obvious, and it triggers a chain of animations ... All timed well,
// paced well, and obvious"; "all the cascading effects of an action should be obvious (in addition to the selection
// of that action itself)").
//
//  1. the selection: the chosen space lights and the minion leaves its slot in the seat's column for it (or the member
//     used acknowledges with a hop);
//  2. the cascade, read from the engine's effect stream (engine/v4/effects.js), one cause at a time: what the space
//     gives flies from it to the piles, a steal from the rival's pile to the taker's, a member's trigger from that member
//     (it hops first), a payment from the piles to the shop or the follower rate, a recruit from its shop slot into the
//     crowd, followers to the count. Steps overlap a little (MO.overlap), never all at once, and every count ticks as
//     its pieces land.
//
// The plan is pure (planChain: the table's pacing reads its length); playChain puts it on screen with Web Animations
// and timers, never React state. A click or Space skips the rest of a chain to its end state (skipChain). Every duration
// scales with the viewer's animation speed (src/v4/motion.js). States without an effect stream (an online guest, a
// catch-up) fall back to gains.js, which reads the change of state.
import { MO } from '../motion.js';
import { playerColor } from '../format.js';
import { gainsBetween } from './gains.js';
import { motionOK, ghostFly, flyWorker, flyCards, slideShop, flyMinionsHome, holdStack, bump, track, landAll, expectArrival, clearArrivals, clearFlights } from './flight.js';

// ---------- the plan ----------

const PIECE_TYPES = new Set(['gain', 'pay', 'transfer', 'followers']);
const CARD_TYPES = new Set(['recruit', 'member-move', 'release']);
const causeKey = c => (c ? `${c.kind}:${c.pid ?? ''}:${c.uid ?? ''}:${c.key ?? ''}:${c.qid ?? ''}:${c.tier ?? ''}` : '');
const kindOfType = t => (PIECE_TYPES.has(t) ? `pieces:${t === 'followers' ? 'f' : 'r'}` : CARD_TYPES.has(t) ? 'cards' : null);

/** gains.js moves in the effect stream's words (the fallback when a state carries no stream). */
function fromGains(before, state) {
  const conv = w => {
    if (!w) return null;
    switch (w.kind) {
      case 'slot': return { kind: 'space', key: w.key };
      case 'total': return { kind: 'count', pid: w.pid };
      case 'card': return { kind: 'shop', uid: w.uid };
      case 'rate': return { kind: 'rate', n: w.n };
      case 'member': return { kind: 'member', pid: w.pid, def: w.def };
      default: return w;
    }
  };
  return gainsBetween(before, state).map((m, i) => ({
    n: i, type: m.what === 'fol' ? 'followers' : m.pay ? 'pay' : m.from.kind === 'stack' ? 'transfer' : 'gain',
    cause: { kind: m.from.kind === 'member' ? 'member' : 'guess', pid: m.from.pid, def: m.from.def },
    from: conv(m.from), to: conv(m.to), what: m.what === 'fol' ? { n: m.n } : { r: m.r, n: m.n },
  }));
}

const pieceDur = n => MO.pieceFly + Math.max(0, Math.min(n, MO.pieceMax) - 1) * MO.pieceStagger;

/**
 * What a change of state plays, in order: { steps: [{ kind, start, dur, ... }], total } (ms at the viewer's speed).
 * Pure: the table's pacing calls it before anything is on screen.
 */
export function planChain(before, state) {
  const steps = [];
  if (!before || !state || before === state || before.seed !== state.seed || !(state.moves > before.moves)) return { steps, total: 0 };
  let t = 0;
  const next = (dur, step) => { steps.push({ ...step, start: t, dur }); t += Math.round(dur * MO.overlap); };
  const sameRound = state.round === before.round;
  // the selection: a new minion on the wheel (the space lights, the minion leaves its slot for it)
  const placed = sameRound ? Object.keys(state.slots).filter(k => before.slots[k] === undefined) : [];
  for (const key of placed) next(MO.select + MO.minionFly, { kind: 'select', key, pid: state.slots[key] });
  // a new round: the wheel's minions go home first
  if (!sameRound && before.round >= 1) next(MO.minionsHome, { kind: 'home' });
  // the cascade: the engine's own stream when this state is the very next one, else what the change of state shows
  const fx = Array.isArray(state.effects) && state.moves === before.moves + 1 ? state.effects : fromGains(before, state);
  // a member used as the move itself: it acknowledges first
  const root = fx.length && fx[0].cause && fx[0].cause.kind === 'member' && !placed.length ? fx[0].cause : null;
  if (root && root.uid != null) next(MO.hop, { kind: 'hop', pid: root.pid, uid: root.uid });
  // group: consecutive effects with the same cause and the same kind of motion play together
  let group = null;
  const flush = () => {
    if (!group) return;
    const g = group;
    group = null;
    const lead = g.cause && g.cause.kind === 'member' && g.cause.uid != null ? MO.hop : 0;
    if (g.kind === 'cards') next(lead + MO.cardFly + (g.effects.length - 1) * MO.pieceStagger, { kind: 'cards', effects: g.effects, lead, cause: g.cause });
    else {
      // several effects in one step (+2 blue and +1 red): each starts a few pieces after the one before
      let off = 0, end = 0;
      const parts = g.effects.map(e => { const n = Math.abs(e.what.n || 0); const p = { e, off }; end = Math.max(end, off + pieceDur(n)); off += Math.min(n, 3) * MO.pieceStagger; return p; });
      next(lead + end, { kind: 'pieces', parts, lead, cause: g.cause });
    }
  };
  for (const e of fx) {
    const k = kindOfType(e.type);
    if (!k) continue;
    if (k.startsWith('pieces') && !(Math.abs(e.what && e.what.n) > 0)) continue;
    const ck = `${causeKey(e.cause)}|${k}`;
    if (!group || group.key !== ck) { flush(); group = { key: ck, kind: k.startsWith('pieces') ? 'pieces' : 'cards', cause: e.cause, effects: [] }; }
    group.effects.push(e);
  }
  flush();
  const end = steps.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
  return { steps, total: end ? end + MO.chainHold : 0 };
}

// ---------- the screen ----------

const chain = { timers: new Map(), holds: new Map(), counts: new Set(), root: null, until: 0, seq: 0 };
const skipSubs = new Set();
/** Something that should jump to its end state when a chain is skipped (Tick, the table's pacing). */
export const onChainSkip = fn => { skipSubs.add(fn); return () => skipSubs.delete(fn); };
export const chainRunning = () => chain.until > performance.now();

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
  if (!chain.timers.size && !chainRunning()) return false;
  const pending = [...chain.timers.entries()].sort((a, b) => a[1].due - b[1].due);
  chain.timers.clear();
  for (const [id, { fn }] of pending) { clearTimeout(id); fn(true); }
  landAll();
  clearFlights(0);
  endChain();
  for (const fn of skipSubs) fn();
  return true;
}

/** Where an effect's source or target is on screen. */
function placeEl(root, w, ctx) {
  if (!root || !w) return null;
  const seat = pid => root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const ok = el => (el && el.getBoundingClientRect().width > 0 ? el : null);
  switch (w.kind) {
    case 'space': return ok(root.querySelector(`[data-slot="${w.key}"] .base`)) || ok(root.querySelector(`[data-slot="${w.key}"]`));
    case 'quadrant': { const q = ctx.state.quadrants.indexOf(w.qid); return ok(root.querySelector(`[data-slot^="${q}-"] .base`)) || ok(root.querySelector('.stage .hub-label')); }
    case 'stack': { const s = seat(w.pid); return s && ok(s.querySelector(`.cs-stack[data-res="${w.r}"]`)); }
    case 'count': case 'player': { const s = seat(w.pid); return s && (ok(s.querySelector('.cs-total')) || ok(s)); }
    case 'crowd': { const s = seat(w.pid); return s && (ok(s.querySelector('.cs-crowd .cs-member:last-child')) || ok(s.querySelector('.cs-crowd')) || ok(s)); }
    case 'member': {
      const s = seat(w.pid);
      if (!s) return null;
      if (w.uid != null) { const m = ok(s.querySelector(`.cs-member[data-uids~="${w.uid}"]`)); if (m) return m; }
      if (w.def) { const m = ok(s.querySelector(`.cs-member[data-member="${w.def}"]`)); if (m) return m; }
      return ok(s.querySelector('.cs-crowd')) || ok(s);
    }
    case 'shop': {
      const snap = ctx.snap && w.uid != null ? ctx.snap.get(w.uid) : null;
      if (snap && snap.rect) return { getBoundingClientRect: () => snap.rect, rectOnly: true };
      return ok(root.querySelector(`.lt-shop .card[data-uid="${w.uid}"]`)) || ok(root.querySelector('.lt-shop'));
    }
    case 'rate': return (w.tier && ok(root.querySelector(`.lt-rate[data-rate="${w.tier}"]`))) || (w.n && ok(root.querySelector(`.lt-rate[aria-label*="+${w.n} follower"]`))) || ok(root.querySelector('.lt-rates'));
    case 'rim': { const q = ctx.state.quadrants.indexOf(w.qid); return ok(root.querySelector(`[data-rim-q="${q}"]`)) || ok(root.querySelector('.stage .hub-label')); }
    case 'pile': return ok(root.querySelector('.lt-deck')) || ok(root.querySelector('.lt-shop'));
    default: return ok(root.querySelector('.stage .hub-label'));
  }
}
const glyphFor = (root, e) => {
  const pid = e.to.kind === 'stack' || e.to.kind === 'count' ? e.to.pid : e.from.pid;
  const seat = root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const g = e.type === 'followers' ? seat && seat.querySelector('.cs-total svg') : seat && seat.querySelector(`.cs-stack[data-res="${e.what.r}"] svg`);
  return g ? g.outerHTML : `<i class="piece-dot" style="background:var(--${(e.what && e.what.r) || 'lamp-ink'})"></i>`;
};
const hopEl = el => { if (el && el.animate && !el.rectOnly) track(el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: MO.hop, easing: 'cubic-bezier(.3,1.4,.5,1)' })); };

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

/**
 * Play the chain for a change of state on the table under `root`. `snap` is the shop as it was (snapshotShop),
 * `minionsBefore` the wheel's minions as they were (snapshotMinions). Returns the plan.
 */
export function playChain(root, before, state, { snap = null, minionsBefore = null } = {}) {
  const col = column;
  column = minionColumn(root);
  if (!root || before === state) return { steps: [], total: 0 };
  // a new chain lands whatever was still playing from the last one
  if (chain.timers.size) skipChain();
  const plan = planChain(before, state);
  if (!plan.steps.length || !motionOK()) return plan;
  const ctx = { state, before, snap };
  const t0 = performance.now();
  chain.root = root;
  chain.until = t0 + plan.total;
  root.dataset.chain = '1';
  const seq = ++chain.seq;
  later(plan.total, () => { if (chain.seq === seq) endChain(); });
  // every stack the chain touches shows what it held before, and counts each piece out and in
  const held = (el, pid, r) => {
    if (!el || el.rectOnly) return null;
    if (!chain.holds.has(el)) { const p = before.players[pid]; chain.holds.set(el, { h: p ? holdStack(el, p.res[r] || 0) : null, left: 0 }); }
    return chain.holds.get(el);
  };
  for (const step of plan.steps) {
    if (step.kind === 'select') {
      const pid = step.pid, slot = root.querySelector(`[data-slot="${step.key}"]`);
      // the chosen space lights at once, and the minion leaves its slot in the column for it
      if (slot) { slot.classList.add('chosen'); later(step.start + step.dur, () => slot.classList.remove('chosen')); }
      const k = Math.max(0, (before.players[pid] ? before.players[pid].left : 1) - 1);
      const fromRect = col.get(`${pid}:${k}`) || null;
      later(step.start, skip => { if (!skip) flyWorker(root, pid, step.key, playerColor(pid), { fromRect, duration: MO.minionFly }); });
    } else if (step.kind === 'home') {
      later(step.start, skip => { if (!skip && minionsBefore) flyMinionsHome(root, minionsBefore); });
    } else if (step.kind === 'hop') {
      later(step.start, skip => { if (!skip) hopEl(placeEl(root, { kind: 'member', pid: step.pid, uid: step.uid }, ctx)); });
    } else if (step.kind === 'cards') {
      if (step.lead) later(step.start, skip => { if (!skip) hopEl(placeEl(root, { kind: 'member', pid: step.cause.pid, uid: step.cause.uid }, ctx)); });
      step.effects.forEach((e, i) => {
        later(step.start + step.lead + i * MO.pieceStagger, skip => {
          if (skip) return;
          if (e.type === 'recruit' && e.from.kind === 'shop' && snap) { flyCards(root, snap, [{ uid: e.what.uid, to: e.to.pid }]); slideShop(root, snap); return; }
          const a = placeEl(root, e.from, ctx), b = placeEl(root, e.to, ctx);
          if (!a || !b) return;
          const A = a.getBoundingClientRect(), B = b.getBoundingClientRect(), size = 26;
          ghostFly(`<i class="piece-dot member" style="background:var(--lamp-ink)"></i>`, 'piece-flight piece-member', { left: A.left + A.width / 2 - size / 2, top: A.top + A.height / 2 - size / 2, width: size, height: size },
            { left: B.left + B.width / 2 - size / 2, top: B.top + B.height / 2 - size / 2, width: size, height: size }, { duration: MO.cardFly, scaleTo: 0.8, fadeTo: 0.6, arc: 40 });
        });
      });
    } else if (step.kind === 'pieces') {
      if (step.lead) later(step.start, skip => { if (!skip) hopEl(placeEl(root, step.cause.kind === 'member' ? { kind: 'member', pid: step.cause.pid, uid: step.cause.uid, def: step.cause.def } : null, ctx)); });
      for (const { e, off } of step.parts) {
        const a = placeEl(root, e.from, ctx), b = placeEl(root, e.to, ctx);
        if (!a || !b) continue;
        const total = Math.abs(e.what.n), n = Math.min(total, MO.pieceMax), per = total / n;
        const out = e.from.kind === 'stack' ? held(a, e.from.pid, e.from.r) : null;
        const into = e.to.kind === 'stack' ? held(b, e.to.pid, e.to.r) : null;
        if (out) out.left += n;
        if (into) into.left += n;
        const at0 = step.start + step.lead + off;
        if (e.to.kind === 'count' && !b.rectOnly) { expectArrival(b, t0 + at0 + MO.pieceFly, (n - 1) * MO.pieceStagger); chain.counts.add(b); }
        const html = glyphFor(root, e), size = e.type === 'followers' ? 20 : 18, pay = e.type === 'pay';
        for (let k = 0; k < n; k++) {
          const share = Math.round(per * (k + 1)) - Math.round(per * k);
          const at = at0 + k * MO.pieceStagger;
          later(at, skip => {
            if (out && out.h) { out.h.step(-share); if (!--out.left) out.h.done(); }
            if (skip) return;
            bump(a, true);
            const A = a.getBoundingClientRect(), B = b.getBoundingClientRect(), j = (k % 3 - 1) * 4;
            ghostFly(html, `piece-flight piece-${e.type === 'followers' ? 'fol' : 'res'}${pay ? ' pay' : ''}`,
              { left: A.left + A.width / 2 - size / 2 + j, top: A.top + A.height / 2 - size / 2, width: size, height: size },
              { left: B.left + B.width / 2 - size / 2, top: B.top + B.height / 2 - size / 2, width: size, height: size },
              { duration: MO.pieceFly, scaleTo: pay ? 0.7 : 1, fadeTo: pay ? 0.15 : 1, arc: 26 + (k % 2) * 10 });
          });
          later(at + MO.pieceFly, skip => {
            if (into && into.h) { into.h.step(share); if (!--into.left) into.h.done(); }
            if (!skip) bump(b);
          });
        }
      }
    }
  }
  if (typeof window !== 'undefined') window.__patronsChains = (window.__patronsChains || 0) + 1;
  return plan;
}

/** Install the skip: a press anywhere, or Space (when it isn't pressing a button), lands the chain on screen. */
export function installChainSkip() {
  if (typeof addEventListener !== 'function') return () => {};
  const down = () => { if (chain.timers.size) skipChain(); };
  const key = e => {
    if (e.key !== ' ' || !chain.timers.size) return;
    const t = e.target;
    if (t && t.closest && t.closest('input,textarea,select,button,[role="button"],[contenteditable]')) { skipChain(); return; }
    e.preventDefault();
    skipChain();
  };
  addEventListener('pointerdown', down, true);
  addEventListener('keydown', key, true);
  return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
}
