// Purple: extra turns. Purple is the currency of time: spend it to act again.
// Most workers on the board at round end takes the ring's followers; purple breaks ties.
//
// Engine notes (content-only, no core change):
// - An extra turn is an ordinary { t: 'turn' } task put right after the current turn ends (p.left += 1).
// - Extra turns only happen when the board has a space to spare (more open spaces than turns still to come),
//   so they never squeeze anyone out of the last space (round I fills every space).
// - Linger moves a worker: it queues the engine's own 'act' task for the new space.
// - onExtraTurn / onRivalExtraTurn are purple-only member hooks, fired by the helpers below.
import { defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const P = 'purple';
const TURN_VALUE = [3, 5, 7]; // a placement plus its buy, by round

/** Workers p has on the board right now (a worker sharing a rival's space counts too). */
export const onBoard = (ctx, p) => Object.values(ctx.state.slots).filter(o => o === p.id).length
  + Object.values(ctx.state.squats || {}).reduce((s, list) => s + list.filter(o => o === p.id).length, 0);
/** Open spaces right now, as [quadrant index, action index]. */
function openSpaces(ctx) {
  const out = [];
  ctx.state.quadrants.forEach((qid, q) => ctx.quadrant(qid).actions.forEach((a, i) => {
    if (a.ring <= ctx.state.round && ctx.state.slots[`${q}-${i}`] === undefined) out.push([q, i]);
  }));
  return out;
}
const scheduled = ctx => ctx.state.queue.filter(t => t.t === 'turn').length;
/** True when one more turn can't squeeze anyone out of a space. */
export const spareSpace = ctx => openSpaces(ctx).length > scheduled(ctx);
const OT = 6; // Overtime's price (measured: 4 → 47% taker win rate, 5 → 43%, 6 → 37%)
const RALLY = 5; // Rally's price (measured taker win rate: 3 → 45%, 4 → 42%, 5 → 36%; Strike 34%)
/** What an extra turn that costs `base` purple costs p (Double Time halves it, rounded up). */
const priceFor = (ctx, p, base) => (ctx.membersOf(p).some(c => c.def.halfTurns || (c.copy && c.copy.endsWith('.doubletime'))) ? Math.ceil(base / 2) : base);
const canBuyTurn = (ctx, p, base) => (p.res[P] || 0) >= priceFor(ctx, p, base) && spareSpace(ctx);
/** Pay for an extra turn; without the purple (or a spare space), take the fallback gain instead. */
/** "(Double Time: 6 → 3)" when Double Time made it cheaper, so the price traces to the card. */
const halfNote = (base, c) => (c < base ? ` (Double Time: ${base} → ${c})` : '');
function buyTurn(ctx, p, base, what, fallback, member = false) {
  if (canBuyTurn(ctx, p, base)) {
    const c = priceFor(ctx, p, base);
    p.res[P] -= c;
    ctx.log(member ? `${p.name}'s ${what}: pays ${c} purple for an extra turn${halfNote(base, c)}.` : `${p.name} pays ${c} purple for ${what}${halfNote(base, c)}.`);
    extraTurns(ctx, p, 1);
    return true;
  }
  if (fallback) ctx.gain(p, P, fallback, { fromAction: true });
  return false;
}
const buyEstimate = (ctx, p, base, fallback) => (canBuyTurn(ctx, p, base) ? turnValue(ctx) - priceFor(ctx, p, base) * 0.8 + 1 : fallback);
/** Rivals with more workers on the board than p (+extra for the worker p is about to place). */
const behind = (ctx, p, extra = 0) => ctx.rivals(p).filter(o => onBoard(ctx, o) > onBoard(ctx, p) + extra).length;
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;

function fire(ctx, p, hook, ...args) {
  for (const c of ctx.membersOf(p)) {
    const defs = [c.def];
    // the copied member's def by id: it may be a guest member with no quadrant of its own
    if (c.copy) defs.push(defById(c.copy));
    // run as the member, so what it changes is logged under its name (Foreman, Courier, Apprentice, Overseer)
    for (const d of defs) if (d && d[hook]) ctx.asMember(p, d.name, () => d[hook](ctx, p, c, ...args));
  }
}
function extraHooks(ctx, p) {
  fire(ctx, p, 'onExtraTurn');
  for (const o of ctx.rivals(p)) fire(ctx, o, 'onRivalExtraTurn', p);
}

/** Give p up to n extra turns right after the current one. Returns how many it got. */
export function extraTurns(ctx, p, n = 1, why = null) {
  let k = 0;
  for (; k < n && spareSpace(ctx); k++) {
    const q = ctx.state.queue;
    const end = q.findIndex(t => t.t === 'endTurn');
    q.splice(end < 0 ? 0 : end + 1 + k, 0, { t: 'turn', p: p.id });
    p.left += 1;
  }
  if (k) {
    // why: the member that gave it (Errand Runner, Second Wind), so the turn traces to the card
    ctx.log(`${why ? `${p.name}'s ${why}: ${p.name}` : p.name} takes ${k === 1 ? 'an extra turn' : `${k} extra turns`}.`);
    for (let i = 0; i < k; i++) extraHooks(ctx, p);
  } else ctx.log(`No space to spare: ${p.name} gets no extra turn${why ? ` from ${why}` : ''}.`);
  return k;
}

// ---------- Linger: move a worker to a different space, do it, buy again ----------
const purpleIndex = ctx => ctx.state.quadrants.indexOf('purple');
function movable(ctx, p) {
  const out = [];
  for (const [key, owner] of Object.entries(ctx.state.slots)) {
    if (owner !== p.id) continue;
    const [q, i] = key.split('-').map(Number);
    if (q === purpleIndex(ctx)) continue;
    const a = ctx.quadrant(ctx.state.quadrants[q]).actions[i];
    if (a.ring === 3) continue;
    out.push({ key, a, q });
  }
  return out;
}
function targets(ctx, p) {
  return openSpaces(ctx).map(([q, i]) => ({ key: `${q}-${i}`, q, i, a: ctx.quadrant(ctx.state.quadrants[q]).actions[i] }));
}
function bestTarget(ctx, p) {
  return Math.max(0, ...targets(ctx, p).filter(t => t.q !== purpleIndex(ctx)).map(t => t.a.estimate(ctx, p)));
}

export default {
  id: 'purple',
  name: 'Purple',
  resource: P,
  scoring: {
    label: 'Most workers on the board (purple breaks ties)',
    score: (ctx, p) => onBoard(ctx, p) * 1000 + (p.res[P] || 0),
  },

  actions: [
    {
      key: 'hourly', ring: 1, name: 'Hourly', text: '+4 / +5 / +6 purple, by round.',
      estimate: ctx => [3, 4, 5][ctx.state.round - 1] + 1,
      resolve(ctx, p) { ctx.gain(p, P, [3, 4, 5][ctx.state.round - 1] + 1, { fromAction: true }); },
    },
    {
      // fill-in (critic): replaces Lend a Hand
      key: 'catchup', ring: 1, name: 'Catch Up', text: '+1 purple, and +2 per rival with more workers on the board than you.',
      estimate: (ctx, p) => 1 + 2 * behind(ctx, p, 1),
      resolve(ctx, p) { ctx.gain(p, P, 1 + 2 * behind(ctx, p), { fromAction: true }); },
    },
    {
      key: 'windup', ring: 1, name: 'Wind-up', text: '+1 purple per worker you have on the board, this one included.',
      estimate: (ctx, p) => onBoard(ctx, p) + 1,
      resolve(ctx, p) { ctx.gain(p, P, onBoard(ctx, p), { fromAction: true }); },
    },
    {
      key: 'linger', ring: 2, name: 'Linger', text: 'Move one of your workers from an outer or middle space of another color to a different open space, and do that action.',
      estimate: (ctx, p) => (movable(ctx, p).length ? bestTarget(ctx, p) : 0),
      resolve(ctx, p) {
        const from = movable(ctx, p);
        if (!from.length) { ctx.log(`${p.name} has no worker to move.`); return; }
        ctx.choose(p, 'Linger: move which worker?', from.map(({ key, a, q }) => ({
          id: `from:${key}`, label: `${a.name} (${ctx.quadrant(ctx.state.quadrants[q]).name})`, kind: 'slot', value: key, hint: -a.ring,
        })), 'purple.lingerFrom');
      },
    },
    {
      key: 'overtime', ring: 2, name: 'Overtime', text: `Pay ${OT} purple: take an extra turn right after this one. If you can’t, +2 purple.`,
      estimate: (ctx, p) => buyEstimate(ctx, p, OT, 2),
      resolve(ctx, p) { buyTurn(ctx, p, OT, 'Overtime', 2); },
    },
    {
      key: 'rally', ring: 3, name: 'Rally', text: `Pay ${RALLY} purple: take an extra turn right after this one. If you can’t, +3 purple.`,
      estimate: (ctx, p) => buyEstimate(ctx, p, RALLY, 3),
      resolve(ctx, p) { buyTurn(ctx, p, RALLY, 'Rally', 3); },
    },
  ],

  handlers: {
    lingerFrom(ctx, p, from) {
      const opts = targets(ctx, p).map(({ key, q, a }) => ({
        id: `to:${key}`, label: `${a.name} (${ctx.quadrant(ctx.state.quadrants[q]).name})`, kind: 'slot', value: key,
        hint: q === purpleIndex(ctx) ? -5 : a.estimate(ctx, p),
      }));
      if (!opts.length) { ctx.log(`No open space for ${p.name} to move to.`); return; }
      ctx.choose(p, 'Linger: move it to…', opts, 'purple.lingerTo', { from });
    },
    lingerTo(ctx, p, to, data) {
      const [q, i] = to.split('-').map(Number);
      delete ctx.state.slots[data.from];
      ctx.state.slots[to] = p.id;
      const a = ctx.quadrant(ctx.state.quadrants[q]).actions[i];
      ctx.log(`${p.name} moves a worker to ${a.name}.`);
      // run the new space like a placement: the engine's own act task, before this turn's buy
      ctx.state.queue.unshift({ t: 'act', p: p.id, q, i });
      extraHooks(ctx, p);
    },
  },

  members: [
    m('secondwind', 'Second Wind', 8, 4, 'Once per game: take an extra turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 1, 'Second Wind')) card.used = false; },
      botActivate: ctx => ctx.state.round === 3 && spareSpace(ctx),
    }),
    m('errand', 'Errand Runner', 4, 4, 'When recruited: take an extra turn right after this one.', {
      onRecruited(ctx, owner) { extraTurns(ctx, owner, 1, 'Errand Runner'); },
    }),
    m('taskmaster', 'Taskmaster', 6, 2, 'Once per round: pay 5 purple to take an extra turn right after this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if (!buyTurn(ctx, owner, 5, 'Taskmaster', 0, true)) { card.used = false; ctx.log(`${owner.name} can't pay for Taskmaster now.`); }
      },
      botActivate: (ctx, owner) => canBuyTurn(ctx, owner, 5) && ctx.state.round >= 2,
    }),
    m('lateriser', 'Late Riser', 6, 2, 'At round start, if you have the fewest followers (ties count), take an extra turn before anyone else.', {
      // the round's turns are queued after round-start hooks, so this one goes first
      onRoundStart(ctx, owner) {
        const me = ctx.followers(owner);
        if (ctx.state.round > 1 && ctx.rivals(owner).every(o => ctx.followers(o) >= me)) {
          ctx.state.queue.unshift({ t: 'turn', p: owner.id });
          owner.left += 1;
          ctx.log(`${owner.name}'s Late Riser: an extra turn first.`);
          extraHooks(ctx, owner);
        }
      },
    }),
    m('foreman', 'Foreman', 4, 2, 'Whenever you take an extra turn, +1 purple per worker you have on the board.', {
      onExtraTurn(ctx, owner) { ctx.gain(owner, P, onBoard(ctx, owner)); },
    }),
    m('courier', 'Courier', 4, 2, 'Whenever you take an extra turn, +1 of each other color.', {
      onExtraTurn(ctx, owner) { for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1); },
    }),
    m('apprentice', 'Apprentice', 2, 2, 'Whenever you take an extra turn, your next member costs 4 less.', {
      onExtraTurn(ctx, owner) { owner.discount += 4; },
    }),
    m('overseer', 'Overseer', 4, 2, 'Whenever a rival takes an extra turn, gain half your purple (up to 4).', {
      onRivalExtraTurn(ctx, owner) { ctx.gain(owner, P, Math.min(4, Math.floor((owner.res[P] || 0) / 2))); },
    }),
    // fill-in (critic): replaces Timekeeper
    m('doubletime', 'Double Time', 6, 2, 'Extra turns you pay purple for cost you half (rounded up).', { halfTurns: true }),
    m('bookkeeper', 'Bookkeeper', 4, 2, 'At round end, +1 purple per 2 workers you have on the board.', {
      onRoundEnd(ctx, owner) { ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2)); },
    }),
    m('clockmaker', 'Clockmaker', 2, 2, 'At round start, +1 purple per 2 purple you have.', {
      // round start, not end (Claude, 2026-10-14, after Cory: purple left at the end of round III is worth nothing)
      onRoundStart(ctx, owner) { ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2)); },
    }),
    m('lamplighter', 'Lamplighter', 6, 2, 'At round start, +1 purple per worker you get this round (3 / 4 / 5).', {
      onRoundStart(ctx, owner) { ctx.gain(owner, P, [3, 4, 5][ctx.state.round - 1] || 3); },
    }),
    // Relay was cut by Cory (2026-10-14); Purple has 14 members until a replacement is priced.
    m('patience', 'Patience', 6, 2, 'Game end: +1 follower per 3 purple.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res[P] || 0) / 3),
    }),
    m('crew', 'Shift Crew', 1, 1, 'Worth 2 followers. No effect.', { f: 2, vanilla: true }),
  ],
};
