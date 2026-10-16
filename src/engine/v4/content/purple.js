// Purple: extra turns. Its spaces give them free (Cory, 2026-10-15: no board action requires spending); purple held
// counts for the ring, and members (Taskmaster) can still buy a turn with it.
// Most purple at round end takes the ring's followers.
// Rework (Claude, 2026-10-14, under Cory's go-with-your-gut, after his first play): every extra turn a Purple space
// gives is a net gain (one worker in, two or more out); Linger became Plan Ahead; the ring counts purple honestly.
// Reprice (Claude, 2026-10-14, go-with-your-gut, from the member-value sim in design/eval/purple-members.md): Corner-Cutter,
// Taskmaster, Late Riser 4+2; Overseer 2+2; Go-Getter 6+2. Night Owl takes Relay's slot.
//
// Engine notes (content-only, no core change, but for roundOrder):
// - Crunch Time is not an extra turn: turnsNow moves your own next turns up to right after this one (no new minion).
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
    if (!(a.ring > ctx.state.round || (a.lastRound && ctx.state.round > a.lastRound)) && ctx.state.slots[`${q}-${i}`] === undefined) out.push([q, i]);
  }));
  return out;
}
// a minion still to land this turn counts too (a queued place, or one held while a member is used beside the spaces):
// Go-Getter used before placing at a full round I took a rival's last space, and the rival's minion sat out
const scheduled = ctx => ctx.state.queue.filter(t => t.t === 'turn' || t.t === 'place').length + (ctx.state.unplaced || 0);
/** True when one more turn can't squeeze anyone out of a space. */
export const spareSpace = ctx => openSpaces(ctx).length > scheduled(ctx);
/** What extra turns that cost `base` purple cost p (Corner-Cutter halves it, rounded up). Only Taskmaster pays now:
 *  Overtime is free (Cory, 2026-10-15: "no board action should require spending"). */
const priceFor = (ctx, p, base) => (ctx.membersOf(p).some(c => c.def.halfTurns || (c.copy && c.copy.endsWith('.doubletime'))) ? Math.ceil(base / 2) : base);
/** How many more turns the board has room for (open spaces beyond the turns still to come). */
const room = ctx => openSpaces(ctx).length - scheduled(ctx);
const canBuyTurn = (ctx, p, base, n = 1) => (p.res[P] || 0) >= priceFor(ctx, p, base) && room(ctx) >= n;
/** "(Corner-Cutter: 8 → 4)" when Corner-Cutter made it cheaper, so the price traces to the card. */
const halfNote = (base, c) => (c < base ? ` (Corner-Cutter: ${base} → ${c})` : '');
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
/** Rivals who've placed more minions than p this round, counting p's before the one now landing (mine = 1 when it
 *  has landed, as in resolve; 0 before, as in estimate). Minions all come home between rounds, so the board is the count. */
const ahead = (ctx, p, mine) => ctx.rivals(p).filter(o => onBoard(ctx, o) > onBoard(ctx, p) - mine).length;
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;
/** A free space: n extra turns right after this one, as many as the board has room for. */
const freeTurnsEstimate = (ctx, n) => Math.max(0, Math.min(n, room(ctx) - 1)) * turnValue(ctx);
function freeTurns(ctx, p, n, what) {
  if (!spareSpace(ctx)) { ctx.log(`${p.name}'s ${what}: no free space this round, so no extra turn.`); return 0; }
  return extraTurns(ctx, p, n);
}

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
    // why: the member that gave it (Errand Runner, Go-Getter), so the turn traces to the card
    ctx.log(`${why ? `${p.name}'s ${why}: ${p.name}` : p.name} takes ${k === 1 ? 'an extra turn' : `${k} extra turns`}.`);
    for (let i = 0; i < k; i++) extraHooks(ctx, p);
  // said with the card or space first, so the turn card names it (Cory, 2026-10-15: "I bought Night Owl in round 1 and it
  // didn't seem to give me an extra"; with 4 players round I has no free space)
  } else ctx.log(why ? `${p.name}'s ${why}: no free space this round, so no extra turn.` : `No free space this round: ${p.name} gets no extra turn.`);
  return k;
}

/**
 * p takes up to n of their own turns still to come this round right after this one (Crunch Time; Cory, 2026-10-15:
 * "it's not extra turns, it's taking two immediate turns with existing minions"). No new minion, so placements this
 * round don't change, no spare space is needed, and the extra-turn members (Foreman, Overseer…) don't fire.
 * The round's order (roundOrder) moves the same turns up, so the seats' "your turn in N" stay true. Returns how many.
 */
export function turnsNow(ctx, p, n, why) {
  const s = ctx.state, q = s.queue;
  const end = q.findIndex(t => t.t === 'endTurn');
  const close = q.findIndex(t => t.t === 'allPlaced');
  const stop = close < 0 ? q.length : close;
  const picks = [];
  for (let i = end + 1; i < stop && picks.length < n; i++) if (q[i].t === 'turn' && q[i].p === p.id) picks.push(i);
  if (!picks.length) { ctx.log(`${p.name} has no minions left to place: ${why} does nothing.`); return 0; }
  // where each turn sits in the round's order, matched as the seats match it (extra turns sit outside it)
  const { order } = ctx.roundOrder();
  const seq = [...(s.turns || []).map(pid => ({ pid })), ...q.filter(t => t.t === 'turn').map(task => ({ pid: task.p, task }))];
  let j = 0;
  for (const t of seq) if (j < order.length && order[j] === t.pid) t.at = j++;
  const done = (s.turns || []).length;
  const cur = Math.max(-1, ...seq.slice(0, done).map(t => (t.at === undefined ? -1 : t.at)));
  const tasks = picks.map(i => q[i]);
  for (let k = picks.length - 1; k >= 0; k--) q.splice(picks[k], 1);
  q.splice(end + 1, 0, ...tasks);
  const moves = [];
  tasks.forEach((task, k) => {
    const at = (seq.find(t => t.task === task) || {}).at;
    if (at !== undefined && at !== cur + 1 + k) moves.push({ p: p.id, from: at, to: cur + 1 + k, why });
  });
  if (moves.length) {
    if (!s.early || s.early.round !== s.round) s.early = { round: s.round, moves: [] };
    s.early.moves.push(...moves);
  }
  const k = tasks.length;
  const few = k < n ? ` (${k === 1 ? 'their last minion' : `their last ${k} minions`})` : '';
  ctx.log(`${p.name}'s ${why}: ${p.name} takes ${k === 1 ? 'their next turn' : `their next ${k} turns`} now${few}.`);
  return k;
}
/** Playing your own turns sooner: each one that jumps rivals gets first pick of the spaces they'd have taken. */
const turnsNowEstimate = (ctx, p, n) => {
  const q = ctx.state.queue, end = q.findIndex(t => t.t === 'endTurn');
  const close = q.findIndex(t => t.t === 'allPlaced');
  let v = 0, k = 0, jumped = 0;
  for (let i = end + 1; i < (close < 0 ? q.length : close) && k < n; i++) {
    if (q[i].t !== 'turn') continue;
    if (q[i].p !== p.id) { jumped++; continue; }
    k++;
    v += Math.min(1, jumped / 3) * turnValue(ctx) * 0.25;
  }
  return v;
};

export default {
  id: 'purple',
  name: 'Purple',
  resource: P,
  // Most purple: honest about what the old "most workers on the board" measured (everyone places every worker, so
  // purple's tiebreak decided it). Holding purple for the ring is the price of spending it on turns.
  scoring: { label: 'Most purple', counts: 'the purple you hold when the round ends', score: (ctx, p) => p.res[P] || 0 },

  actions: [
    {
      key: 'hourly', ring: 1, name: 'Clock In', text: '+4 purple in round I, +5 in round II, +6 in round III.',
      estimate: ctx => [3, 4, 5][ctx.state.round - 1] + 1,
      resolve(ctx, p) { ctx.gain(p, P, [3, 4, 5][ctx.state.round - 1] + 1, { fromAction: true }); },
    },
    {
      // fill-in (critic): replaces Lend a Hand. Counted before your minion lands (Cory, 2026-10-15: it never paid; the old
      // count took in the minion just placed, so a rival one ahead, the only lead turn order gives, read as a tie)
      key: 'catchup', ring: 1, name: 'Catch Up', text: '+1 purple, and +1 per rival who’s placed more minions than you this round.',
      estimate: (ctx, p) => 1 + ahead(ctx, p, 0),
      resolve(ctx, p) { ctx.gain(p, P, 1 + ahead(ctx, p, 1), { fromAction: true }); },
    },
    {
      key: 'windup', ring: 1, name: 'Roll Call', text: '+1 purple per minion you have on the board, this one included.',
      estimate: (ctx, p) => onBoard(ctx, p) + 1,
      resolve(ctx, p) { ctx.gain(p, P, onBoard(ctx, p), { fromAction: true }); },
    },
    {
      // replaces Linger (Cory: "just bad"): the time you have left this round, banked as purple.
      // +1 per minion, was +2 (Cory, 2026-10-15, balance pass 1 #4: both bots read +2 at about 20u in round III)
      key: 'planahead', ring: 2, name: 'Plan Ahead', text: '+1 purple per minion you have left to place this round.',
      estimate: (ctx, p) => Math.max(0, p.left - 1),
      resolve(ctx, p) { ctx.gain(p, P, p.left, { fromAction: true }); },
    },
    {
      // free (Cory, 2026-10-15: "no board action should require spending"): was "pay 8 purple for 2 extra turns, else +3"
      key: 'overtime', ring: 2, name: 'Overtime', text: 'Take 1 extra turn right after this one. Closed in round III.',
      lastRound: 2, // shut in round III (Cory, 2026-10-15: the bench read it ~20u there against a 5–9 band)
      copyDoesIt: true, // Echo: a copy takes the extra turn itself (there's no resource to copy)
      estimate: ctx => freeTurnsEstimate(ctx, 1),
      resolve(ctx, p) { freeTurns(ctx, p, 1, 'Overtime'); },
    },
    {
      // the burst, free (Cory, 2026-10-15): was "pay all your purple (4 or more) for 2 extra turns, else +4 purple"
      // your own turns, now (Cory, 2026-10-15: "it's not extra turns, it's taking two immediate turns with existing
      // minions"): no new minion, no spare space needed, and the extra-turn members don't fire
      key: 'rally', ring: 3, name: 'Crunch Time', text: 'Take your next 2 turns right away.',
      estimate: (ctx, p) => turnsNowEstimate(ctx, p, 2),
      resolve(ctx, p) { turnsNow(ctx, p, 2, 'Crunch Time'); },
    },
  ],

  members: [
    m('secondwind', 'Go-Getter', 6, 2, 'Once per game: take an extra turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 1, 'Go-Getter')) card.used = false; },
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
          // the round's minions aren't queued yet, so count them from what each player has left: with one sphere per
          // player and Extra Hand twice (a Doppelganger), round III at 2 players can be full before this turn
          const due = ctx.state.players.reduce((n, o) => n + o.left, 0);
          if (openSpaces(ctx).length <= due) { ctx.log(`No space to spare: ${owner.name} gets no extra turn from Late Riser.`); return; }
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
    m('overseer', 'Overseer', 2, 2, 'Whenever a rival takes an extra turn, gain half your purple, rounded down (at most 4).', {
      onRivalExtraTurn(ctx, owner) { ctx.gain(owner, P, Math.min(4, Math.floor((owner.res[P] || 0) / 2))); },
    }),
    // fill-in (critic): took the slot of an earlier card called Timekeeper (the name now belongs to the game-end purple card)
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 4 (the most one pass moves);
    // balance pass 2 (pooled bench, midpoint 2.1; design/eval/balance-pass-2.md): 4 → 2
    m('doubletime', 'Corner-Cutter', 2, 0,'When you pay purple for extra turns, pay half (rounded up).', { halfTurns: true }),
    // pays on your last placement of the round, before that turn's buy (at round end, round III's purple came too late).
    // +1 per worker measured 8.4 followers (57% win, easy bots): late purple decides the ring. Half that is the card.
    // Cory, 2026-10-15: pays when your last turn of the round ends, after an Overtime or Night Owl minion has landed
    m('bookkeeper', 'Bookkeeper', 4, 2, 'At the end of your last turn each round, +1 purple per 2 minions you have on the board.', {
      onTurnEnd(ctx, owner, card, who) {
        if (who !== owner || owner.left !== 0 || card.paidRound === ctx.state.round) return;
        card.paidRound = ctx.state.round;
        ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2));
      },
    }),
    m('clockmaker', 'Clockmaker', 2, 2, 'Now and at round start, +1 purple per 2 purple you have.', { now: true,
      // round start, not end (Claude, 2026-10-14, after Cory: purple left at the end of round III is worth nothing)
      // counts after other round-start income (Lamplighter…), like Steward
      onRoundStartLate(ctx, owner) { ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2)); },
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 12
    m('lamplighter', 'Lamplighter', 10, 2,'Now and at round start, +1 purple per minion you get this round (3 / 4 / 5).', { now: true,
      // Cory, 2026-10-15: every minion you get counts (Extra Hand's too)
      onRoundStart(ctx, owner) { ctx.gain(owner, P, owner.workers || [3, 4, 5][ctx.state.round - 1] || 3); },
    }),
    // Relay's slot (Cory cut Relay, 2026-10-14). Member-value sim, handed over at round II: 6.9 followers, 53% win
    // (Normal bots, n=320), so 8+2 (design/eval/purple-members.md). At 4 players round I has no space to spare, so it
    // pays from round II. Fires once per round (owlRound), whether or not the board had room.
    m('nightowl', 'Night Owl', 8, 2, 'Each round, after your last minion, take an extra turn: place one more and buy again.', {
      // recruited after your last minion of the round (its buy step): it waits for next round, and says so
      onRecruited(ctx, owner, card) {
        if (owner.left !== 0 || ctx.state.round < 1) return;
        card.owlRound = ctx.state.round;
        ctx.log(ctx.state.round < 3 ? `${owner.name}'s Night Owl: ${owner.name}'s last minion this round is already placed, so its extra turn starts next round.`
          : `${owner.name}'s Night Owl: ${owner.name}'s last minion is already placed, and this is the last round, so it gives no extra turn.`);
      },
      afterAction(ctx, owner, card) {
        if (owner.left !== 0 || card.owlRound === ctx.state.round) return;
        card.owlRound = ctx.state.round;
        extraTurns(ctx, owner, 1, 'Night Owl');
      },
    }),
    m('patience', 'Timekeeper', 4, 2, 'Game end: +1 follower per 3 purple.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res[P] || 0) / 3),
    }),
    m('crew', 'Shift Crew', 1, 1, 'Worth 2 followers. No effect.', { f: 2, vanilla: true }),
  ],
};
