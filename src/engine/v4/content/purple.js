// Purple: extra turns. Purple is the currency of time: spend it to act again, or hold it for the ring.
// Most purple at round end takes the ring's followers.
// Rework (Claude, 2026-10-14, under Cory's go-with-your-gut, after his first play): every extra turn a Purple space
// gives is a net gain (one worker in, two or more out); Linger became Plan Ahead; the ring counts purple honestly.
// Reprice (Claude, 2026-10-14, go-with-your-gut, from the member-value sim in design/eval/purple-members.md): Double Time,
// Taskmaster, Late Riser 4+2; Overseer 2+2; Second Wind 6+2. Night Owl takes Relay's slot.
//
// Engine notes (content-only, no core change):
// - An extra turn is an ordinary { t: 'turn' } task put right after the current turn ends (p.left += 1).
// - Extra turns only happen when the board has a space to spare (more open spaces than turns still to come),
//   so they never squeeze anyone out of the last space (round I fills every space).
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
// Overtime: this many purple for 2 extra turns. Rally: 1 extra turn per RALLY_PER purple spent, plus 1, up to RALLY_CAP.
const OT = 8;
const RALLY_PER = 4, RALLY_CAP = 3;
/** What extra turns that cost `base` purple cost p (Double Time halves it, rounded up). */
const priceFor = (ctx, p, base) => (ctx.membersOf(p).some(c => c.def.halfTurns || (c.copy && c.copy.endsWith('.doubletime'))) ? Math.ceil(base / 2) : base);
/** How many more turns the board has room for (open spaces beyond the turns still to come). */
const room = ctx => openSpaces(ctx).length - scheduled(ctx);
const canBuyTurn = (ctx, p, base, n = 1) => (p.res[P] || 0) >= priceFor(ctx, p, base) && room(ctx) >= n;
/** "(Double Time: 8 → 4)" when Double Time made it cheaper, so the price traces to the card. */
const halfNote = (base, c) => (c < base ? ` (Double Time: ${base} → ${c})` : '');
/** Pay for n extra turns; without the purple (or the spare spaces), take the fallback gain instead. */
function buyTurn(ctx, p, base, what, fallback, member = false, n = 1) {
  if (canBuyTurn(ctx, p, base, n)) {
    const c = priceFor(ctx, p, base);
    p.res[P] -= c;
    const turns = n === 1 ? 'an extra turn' : `${n} extra turns`;
    ctx.log(member ? `${p.name}'s ${what}: pays ${c} purple for ${turns}${halfNote(base, c)}.` : `${p.name} pays ${c} purple for ${what}${halfNote(base, c)}.`);
    extraTurns(ctx, p, n);
    return true;
  }
  if (fallback) ctx.gain(p, P, fallback, { fromAction: true });
  return false;
}
const buyEstimate = (ctx, p, base, fallback, n = 1) => (canBuyTurn(ctx, p, base, n) ? n * turnValue(ctx) - priceFor(ctx, p, base) * 0.8 + 1 : fallback);
/** Rivals with more workers on the board than p (+extra for the worker p is about to place). */
const behind = (ctx, p, extra = 0) => ctx.rivals(p).filter(o => onBoard(ctx, o) > onBoard(ctx, p) + extra).length;
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;
/** Rally: the turns all of p's purple buys (1 per RALLY_PER, plus 1, up to RALLY_CAP), as far as the board has room.
 *  Double Time halves the rate (1 per 2), as it halves every extra turn paid in purple. */
const rallyPer = (ctx, p) => priceFor(ctx, p, RALLY_PER);
const rallyWant = (ctx, p) => {
  const v = p.res[P] || 0, per = rallyPer(ctx, p);
  return v < per ? 0 : Math.min(RALLY_CAP, Math.floor(v / per) + 1);
};
const rallyTurns = (ctx, p) => Math.min(rallyWant(ctx, p), room(ctx));

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

export default {
  id: 'purple',
  name: 'Purple',
  resource: P,
  // Most purple: honest about what the old "most workers on the board" measured (everyone places every worker, so
  // purple's tiebreak decided it). Holding purple for the ring is the price of spending it on turns.
  scoring: { label: 'Most purple', counts: 'the purple you hold when the round ends', score: (ctx, p) => p.res[P] || 0 },

  actions: [
    {
      key: 'hourly', ring: 1, name: 'Hourly', text: '+4 / +5 / +6 purple, by round.',
      estimate: ctx => [3, 4, 5][ctx.state.round - 1] + 1,
      resolve(ctx, p) { ctx.gain(p, P, [3, 4, 5][ctx.state.round - 1] + 1, { fromAction: true }); },
    },
    {
      // fill-in (critic): replaces Lend a Hand
      key: 'catchup', ring: 1, name: 'Catch Up', text: '+1 purple, and +2 per rival with more minions on the board than you.',
      estimate: (ctx, p) => 1 + 2 * behind(ctx, p, 1),
      resolve(ctx, p) { ctx.gain(p, P, 1 + 2 * behind(ctx, p), { fromAction: true }); },
    },
    {
      key: 'windup', ring: 1, name: 'Wind-up', text: '+1 purple per minion you have on the board, this one included.',
      estimate: (ctx, p) => onBoard(ctx, p) + 1,
      resolve(ctx, p) { ctx.gain(p, P, onBoard(ctx, p), { fromAction: true }); },
    },
    {
      // replaces Linger (Cory: "just bad"): the time you have left this round, banked as purple
      key: 'planahead', ring: 2, name: 'Plan Ahead', text: '+2 purple per minion you have left to place this round.',
      estimate: (ctx, p) => 2 * Math.max(0, p.left - 1),
      resolve(ctx, p) { ctx.gain(p, P, 2 * p.left, { fromAction: true }); },
    },
    {
      // one worker in, two out: the turns are a net gain, not a worker spent to get a worker back (Cory)
      key: 'overtime', ring: 2, name: 'Overtime', text: `Pay ${OT} purple: take 2 extra turns right after this one. If you can’t, +3 purple.`,
      estimate: (ctx, p) => buyEstimate(ctx, p, OT, 3, 2),
      resolve(ctx, p) { buyTurn(ctx, p, OT, 'Overtime', 3, false, 2); },
    },
    {
      // the burst: all the purple you've banked becomes turns (and leaves the ring's count)
      key: 'rally', ring: 3, name: 'Rally',
      text: `Spend all your purple: 1 extra turn right after this one per ${RALLY_PER} spent, plus 1 (up to ${RALLY_CAP}). With less than ${RALLY_PER}, +4 purple.`,
      estimate(ctx, p) { const k = rallyTurns(ctx, p); return k ? k * turnValue(ctx) - (p.res[P] || 0) * 0.8 + 1 : 4; },
      resolve(ctx, p) {
        const want = rallyWant(ctx, p), k = rallyTurns(ctx, p), per = rallyPer(ctx, p);
        if (!k) {
          if (want) ctx.log(`No space to spare: ${p.name} gets no extra turn from Rally.`);
          ctx.gain(p, P, 4, { fromAction: true });
          return;
        }
        // all of it; if the board has room for fewer turns than it buys, only what those turns cost
        const paid = k === want ? p.res[P] : (k - 1) * per;
        p.res[P] -= paid;
        if (paid) ctx.log(`${p.name} spends ${paid} purple on Rally${per < RALLY_PER ? ` (Double Time: 1 turn per ${per}, not ${RALLY_PER})` : ''}.`);
        extraTurns(ctx, p, k);
      },
    },
  ],

  members: [
    m('secondwind', 'Second Wind', 6, 2, 'Once per game: take an extra turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 1, 'Second Wind')) card.used = false; },
      botActivate: ctx => ctx.state.round === 3 && spareSpace(ctx),
    }),
    m('errand', 'Errand Runner', 4, 4, 'When recruited: take an extra turn right after this one.', {
      onRecruited(ctx, owner) { extraTurns(ctx, owner, 1, 'Errand Runner'); },
    }),
    m('taskmaster', 'Taskmaster', 4, 2, 'Once per round: pay 5 purple to take an extra turn right after this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if (!buyTurn(ctx, owner, 5, 'Taskmaster', 0, true)) { card.used = false; ctx.log(`${owner.name} can't pay for Taskmaster now.`); }
      },
      botActivate: (ctx, owner) => canBuyTurn(ctx, owner, 5) && ctx.state.round >= 2,
    }),
    m('lateriser', 'Late Riser', 4, 2, 'At round start, if you have the fewest followers (ties count), take an extra turn before anyone else.', {
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
    m('foreman', 'Foreman', 4, 2, 'Whenever you take an extra turn, +1 purple per minion you have on the board.', {
      onExtraTurn(ctx, owner) { ctx.gain(owner, P, onBoard(ctx, owner)); },
    }),
    m('courier', 'Courier', 4, 2, 'Whenever you take an extra turn, +1 of each other color.', {
      onExtraTurn(ctx, owner) { for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1); },
    }),
    m('apprentice', 'Apprentice', 2, 2, 'Whenever you take an extra turn, your next member costs 4 less.', {
      onExtraTurn(ctx, owner) { owner.discount += 4; },
    }),
    m('overseer', 'Overseer', 2, 2, 'Whenever a rival takes an extra turn, gain half your purple (up to 4).', {
      onRivalExtraTurn(ctx, owner) { ctx.gain(owner, P, Math.min(4, Math.floor((owner.res[P] || 0) / 2))); },
    }),
    // fill-in (critic): replaces Timekeeper
    m('doubletime', 'Double Time', 4, 2, 'Extra turns you pay purple for cost you half (rounded up).', { halfTurns: true }),
    // pays on your last placement of the round, before that turn's buy (at round end, round III's purple came too late).
    // +1 per worker measured 8.4 followers (57% win, easy bots): late purple decides the ring. Half that is the card.
    m('bookkeeper', 'Bookkeeper', 4, 2, 'When you place your last minion of a round, +1 purple per 2 minions you have on the board.', {
      afterAction(ctx, owner, card) {
        if (owner.left !== 0 || card.paidRound === ctx.state.round) return;
        card.paidRound = ctx.state.round;
        ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2));
      },
    }),
    m('clockmaker', 'Clockmaker', 2, 2, 'Now and at round start, +1 purple per 2 purple you have.', { now: true,
      // round start, not end (Claude, 2026-10-14, after Cory: purple left at the end of round III is worth nothing)
      // counts after other round-start income (Lamplighter…), like Steward
      onRoundStartLate(ctx, owner) { ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2)); },
    }),
    m('lamplighter', 'Lamplighter', 6, 2, 'Now and at round start, +1 purple per minion you get this round (3 / 4 / 5).', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, P, [3, 4, 5][ctx.state.round - 1] || 3); },
    }),
    // Relay's slot (Cory cut Relay, 2026-10-14). Member-value sim, handed over at round II: 6.9 followers, 53% win
    // (Normal bots, n=320), so 8+2 (design/eval/purple-members.md). At 4 players round I has no space to spare, so it
    // pays from round II. Fires once per round (owlRound), whether or not the board had room.
    m('nightowl', 'Night Owl', 8, 2, 'When you place your last minion of a round, take an extra turn right after this one.', {
      afterAction(ctx, owner, card) {
        if (owner.left !== 0 || card.owlRound === ctx.state.round) return;
        card.owlRound = ctx.state.round;
        extraTurns(ctx, owner, 1, 'Night Owl');
      },
    }),
    m('patience', 'Patience', 6, 2, 'Game end: +1 follower per 3 purple.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res[P] || 0) / 3),
    }),
    m('crew', 'Shift Crew', 1, 1, 'Worth 2 followers. No effect.', { f: 2, vanilla: true }),
  ],
};
