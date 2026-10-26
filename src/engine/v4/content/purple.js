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
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;
/** A free space: n extra turns right after this one, as many as the board has room for. */
const freeTurnsEstimate = (ctx, n) => Math.max(0, Math.min(n, room(ctx) - 1)) * turnValue(ctx);
function freeTurns(ctx, p, n, what) {
  if (!spareSpace(ctx)) { ctx.log(`${p.name}'s ${what}: no free space this round, so no extra turn.`); return 0; }
  // a seat placing on taken spaces (Crowd In) could take the same extra-turn space forever: none that round
  if (p.squatAll === ctx.state.round) { ctx.log(`${p.name}'s ${what}: no extra turn while placing on taken spaces.`); return 0; }
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
  // no extra minions in round I (Cory, 2026-10-15): every space there is already spoken for
  if (ctx.state.round === 1) { ctx.log(`No extra minions in round I: ${p.name} gets no extra turn${why ? ` from ${why}` : ''}.`); return 0; }
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

/** p is passed over on their next turn this round; that minion places once the snake carries on past everyone else. */
function skipNext(ctx, p, why, by = p, quiet = false) {
  // Early Bird (Cory, 2026-10-22): "your turns cannot be skipped", your own Sleep In and Last Call too
  const guard = ctx.membersOf(p).find(c => c.def.noSkip || (c.copy && c.copy.endsWith('.earlybird')));
  if (guard) { if (!quiet) ctx.log(`${p.name}'s Early Bird: ${p.name}'s turn can't be skipped.`); return false; }
  const q = ctx.state.queue, end = q.findIndex(t => t.t === 'endTurn');
  const close = q.findIndex(t => t.t === 'allPlaced'), stop = close < 0 ? q.length : close;
  let i = end + 1;
  while (i < stop && !(q[i].t === 'turn' && q[i].p === p.id)) i++;
  if (i >= stop) { ctx.log(`${by.name}'s ${why}: ${p === by ? 'no turn' : `${p.name} has no turn`} left to skip this round.`); return false; }
  // where that turn sat in the round's order, matched as the seats match it (as turnsNow does)
  const s = ctx.state, { order } = ctx.roundOrder();
  const seq = [...(s.turns || []).map(pid => ({ pid })), ...q.filter(t => t.t === 'turn').map(task => ({ pid: task.p, task }))];
  let j = 0;
  for (const t of seq) if (j < order.length && order[j] === t.pid) t.at = j++;
  const [task] = q.splice(i, 1);
  // where the turn sat, a marker: the turn is really skipped when play reaches it (Gossip pays then)
  q.splice(i, 0, { t: 'content', p: p.id, h: 'purple.skipped', data: { why } });
  q.splice(stop, 0, task);
  const at = (seq.find(t => t.task === task) || {}).at;
  // its new place: after every other turn of the round's order still to come
  if (at !== undefined && at !== order.length - 1) {
    if (!s.early || s.early.round !== s.round) s.early = { round: s.round, moves: [] };
    s.early.moves.push({ p: p.id, from: at, to: order.length - 1, why, late: true });
  }
  if (!quiet) ctx.log(`${by.name}'s ${why}: ${p.name} skips their next turn.`);
  return true;
}
/** The skip marker reached: p's turn is passed over now. Gossip (Cory, 2026-10-22: "+1 follower every time a players
 *  turn is skipped", anyone's, yours too; Oct 23: "should pay when turn is actually skipped"). */
function skipped(ctx, p, value, data) {
  ctx.log(`${p.name}'s turn is skipped${data?.why ? ` (${data.why})` : ''}.`);
  for (const o of ctx.state.players) for (const c of ctx.abilitiesOf(o)) if (c.def.onSkip) ctx.asMember(o, c.def.name, () => c.def.onSkip(ctx, o, c, p));
}
/** How many turns p still has to come this round, after the one now running. */
const turnsLeft = (ctx, p) => {
  const q = ctx.state.queue, end = q.findIndex(t => t.t === 'endTurn'), close = q.findIndex(t => t.t === 'allPlaced');
  return q.slice(end + 1, close < 0 ? q.length : close).filter(t => t.t === 'turn' && t.p === p.id).length;
};
/** Turns in a row p took just before the one now running (this round's turn record; the last entry is this turn). */
const inARow = (ctx, p) => {
  const turns = ctx.state.turns || [];
  let k = 0;
  for (let i = turns.length - 2; i >= 0 && turns[i] === p.id; i--) k++;
  return ctx.state.current === p.id ? k : 0;
};
/** Whose turn comes next this round, after the one now running (yours too, at a snake end); null when none. */
const nextTurnOf = ctx => {
  const q = ctx.state.queue, end = q.findIndex(t => t.t === 'endTurn'), close = q.findIndex(t => t.t === 'allPlaced');
  const t = q.slice(end + 1, close < 0 ? q.length : close).find(x => x.t === 'turn');
  return t ? t.p : null;
};

/**
 * p takes up to n of their own turns still to come this round right after this one (Crunch Time; Cory, 2026-10-15:
 * "it's not extra turns, it's taking two immediate turns with existing minions"). No new minion, so placements this
 * round don't change, no spare space is needed, and the extra-turn members (Foreman, Overseer…) don't fire.
 * The round's order (roundOrder) moves the same turns up, so the seats' "your turn in N" stay true. Returns how many.
 */
export function turnsNow(ctx, p, n, why) {
  const s = ctx.state, q = s.queue;
  // a preview has no endTurn: its hold stands in, so the moved-up turns wait behind the rest of this act (Greatest Hits)
  const end = q.findIndex(t => t.t === 'endTurn' || t.t === 'previewHold');
  const close = q.findIndex(t => t.t === 'allPlaced');
  const stop = close < 0 ? q.length : close;
  // your LAST n turns of the round move up, so the turns in between stay where they are and you finish early
  // (Cory, 2026-10-21: it shouldn't skip your next turns)
  const picks = [];
  for (let i = stop - 1; i > end && picks.length < n; i--) if (q[i].t === 'turn' && q[i].p === p.id) picks.unshift(i);
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
  const stop = close < 0 ? q.length : close;
  const mine = [];
  for (let i = stop - 1; i > end && mine.length < n; i--) if (q[i].t === 'turn' && q[i].p === p.id) mine.push(i);
  // each pulled turn jumps every rival turn before it
  return mine.reduce((v, i) => v + Math.min(1, q.slice(end + 1, i).filter(t => t.t === 'turn' && t.p !== p.id).length / 3) * turnValue(ctx) * 0.25, 0);
};

/** Overtime, off the board since 2026-10-15 (Rush Hour took its space). Kept for the extra-turn member tests only:
 *  test/engine/v4/retired-overtime.js puts it back on Purple's quadrant for one test file. */
/** Roll Call left the board on 2026-10-22 (Right Away took its space); tests that need a plain purple space keep it
 *  in that space (test/engine/v4/retired-overtime.js useRetiredRollCall). */
export const RETIRED_ROLLCALL = {
  key: 'windup', ring: 1, name: 'Roll Call', text: '+1 purple per minion you have on the board, this one included.',
  estimate: (ctx, p) => onBoard(ctx, p) + 1,
  resolve(ctx, p) { ctx.gain(p, P, onBoard(ctx, p), { fromAction: true }); },
};
export const RETIRED_OVERTIME = {
  key: 'overtime', ring: 2, name: 'Overtime', text: 'Take 1 extra turn right after this one.',
  copyDoesIt: true,
  estimate: ctx => freeTurnsEstimate(ctx, 1),
  resolve(ctx, p) { freeTurns(ctx, p, 1, 'Overtime'); },
};

export default {
  id: 'purple',
  name: 'Purple',
  resource: P,
  handlers: { skipped },
  // Most purple: honest about what the old "most workers on the board" measured (everyone places every worker, so
  // purple's tiebreak decided it). Holding purple for the ring is the price of spending it on turns.
  // held purple, like every reworked color (Cory, 2026-10-22: "contests are always resources now")
  scoring: { label: 'Most purple', counts: 'the purple you hold when the round ends', score: (ctx, p) => p.res.purple || 0 },

  actions: [
    {
      // Cory, 2026-10-22: "+4 purple, skip your next turn" (always +4: +3 and the space's +1), from the old game's
      // "Gain 4 purple, skip next turn". You're passed over once; the snake carries on and you still place every minion.
      // Cory, 2026-10-25: +3 instead of +4 ("skip a turn is basically automatically giving 2 followers")
      key: 'skip', copyDoesIt: true, ring: 1, name: 'Sleep In', text: '+3 purple. Skip your next turn.',
      estimate: () => 3,
      resolve(ctx, p) { ctx.gain(p, P, 3, { fromAction: true }); skipNext(ctx, p, 'Sleep In'); },
    },
    {
      // Cory, 2026-10-22: replaces Catch Up ("the skip should replace catch up"); "1 purple per round" so it isn't weak
      // late. Wording and name are Claude's fill-in.
      key: 'holdup', copyDoesIt: true, ring: 1, name: 'Hold Up', text: '+2 purple (+3 in round II, +4 in round III). The next turn is skipped.',
      byRound: { lines: ['+2 purple', '+3 purple', '+4 purple'], rest: 'The next turn is skipped.' },
      // Cory, 2026-10-22: "it has to be the next TURN not even the next player. so a player could skip their own in
      // snake draft". Whoever's turn comes next is passed over once and still places every minion.
      // Cory, 2026-10-25: +1 each round (Hard bot read).
      estimate: ctx => ctx.state.round + 2,
      resolve(ctx, p) {
        ctx.gain(p, P, ctx.state.round + 1, { fromAction: true });
        const who = nextTurnOf(ctx);
        if (who == null) { ctx.log(`${p.name}'s Hold Up: no turn left to skip this round.`); return; }
        skipNext(ctx, ctx.player(who), 'Hold Up', p);
      },
    },
    {
      // Cory, 2026-10-22: "+1 purple, take another turn right after this one", in Roll Call's spot. One of your own
      // turns, moved up (his yes: you still place the same minions that round), like Crunch Time's two. Name: fill-in.
      // Cory, 2026-10-23: "Right Away should scale. +1 +2 +3" (Hold Up's wording).
      key: 'again', copyDoesIt: true, ring: 1, name: 'Right Away', text: '+1 purple (+2 in round II, +3 in round III). Take another turn right after this one.',
      byRound: { lines: ['+1 purple', '+2 purple', '+3 purple'], rest: 'Take another turn right after this one.' },
      estimate: (ctx, p) => ctx.state.round + turnsNowEstimate(ctx, p, 1),
      resolve(ctx, p) { ctx.gain(p, P, ctx.state.round, { fromAction: true }); turnsNow(ctx, p, 1, 'Right Away'); },
    },
    {
      // Cory, 2026-10-22: "+1 purple, you can play on occupied spaces this round" (+2 with the inherent +1; he may
      // raise it to +3 after play). Any taken space, yours or a rival's, for the rest of this round. Name is Claude's fill-in.
      key: 'crowdin', copyDoesIt: true, ring: 3, name: 'Crowd In', text: '+2 purple. This round you can place on taken spaces.',
      estimate: ctx => 2 + (ctx.state.round < 3 ? 1 : 0),
      resolve(ctx, p) { ctx.gain(p, P, 2, { fromAction: true }); p.squatAll = ctx.state.round; ctx.log(`${p.name} can place on taken spaces for the rest of this round.`); },
    },
    {
      // Cory, 2026-10-22: a follower bonus for taking the rest of your turns last ("YES now you're cooking"), in his
      // words ("take the remainder of your turns when others are out of minions"), "let's just try it at 2 followers
      // per minion left". Replaces Rush Hour. Name is Claude's fill-in.
      key: 'lastcall', copyDoesIt: true, ring: 2, name: 'Last Call', text: '+1 purple. +2 followers per minion you have left. Skip your turns until everyone else is out of minions.',
      estimate: (ctx, p) => 1 + 2 * Math.max(0, p.left - 1),
      resolve(ctx, p) {
        ctx.gain(p, P, 1, { fromAction: true });
        const k = turnsLeft(ctx, p), f = 2 * p.left;
        if (f) { p.bonus += f; ctx.log(`${p.name}'s Last Call: +${f} followers.`); }
        let moved = 0;
        for (let i = 0; i < k; i++) if (skipNext(ctx, p, 'Last Call', p, true)) moved++;
        // the rest of the round too: a rival's turn that lands later still goes first (core lastCallLast)
        if (moved) { p.lastCall = ctx.state.round; ctx.log(`${p.name}'s Last Call: ${p.name} skips their turns until everyone else is out of minions.`); }
        else if (k) ctx.log(`${p.name}'s Early Bird: ${p.name}'s turns can't be skipped.`);
      },
    },
    {
      // the burst, free (Cory, 2026-10-15): was "pay all your purple (4 or more) for 2 extra turns, else +4 purple"
      // your own turns, now (Cory, 2026-10-15: "it's not extra turns, it's taking two immediate turns with existing
      // minions"): no new minion, no spare space needed, and the extra-turn members don't fire
      key: 'rally', copyDoesIt: true, ring: 2, name: 'Crunch Time', text: '+2 purple. Take two turns after this one.',
      // Cory, 2026-10-22: "all should give at least 1"; 2026-10-25: +2 (Hard bot read).
      estimate: (ctx, p) => 2 + turnsNowEstimate(ctx, p, 2),
      resolve(ctx, p) { ctx.gain(p, P, 2, { fromAction: true }); turnsNow(ctx, p, 2, 'Crunch Time'); },
    },
  ],

  members: [
    m('secondwind', 'Go-Getter', 4, 2, 'Once per game: take an extra turn after this one.', { from: 2,
      activate: 'game',
      onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 1, 'Go-Getter')) card.used = false; },
      botActivate: ctx => ctx.state.round === 3 && spareSpace(ctx),
    }),
    m('errand', 'Errand Runner', 4, 4, 'When recruited: take an extra turn after this one.', {
      onRecruited(ctx, owner) { extraTurns(ctx, owner, 1, 'Errand Runner'); },
    }),
    m('taskmaster', 'Taskmaster', 4, 2, 'Once per round: pay 5 purple to take an extra turn after this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if (!buyTurn(ctx, owner, 5, 'Taskmaster', 0, true)) { card.used = false; ctx.log(`${owner.name} can't pay for Taskmaster now.`); }
      },
      botActivate: (ctx, owner) => canBuyTurn(ctx, owner, 5) && ctx.state.round >= 2,
    }),
    m('lateriser', 'Late Riser', 4, 2, 'Round start: if you have the fewest followers (ties count), take an extra turn before anyone places.', { from: 2,
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
    m('courier', 'Courier', 2, 2, 'Whenever you take an extra turn, +1 of each other color.', {
      onExtraTurn(ctx, owner) { for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1); },
    }),
    m('apprentice', 'Apprentice', 2, 2, 'Whenever you take an extra turn, your next member costs 4 less.', {
      onExtraTurn(ctx, owner) { ctx.discount(owner, 4, 'Apprentice'); },
    }),
    m('overseer', 'Overseer', 2, 2, 'Whenever a rival takes an extra turn, gain half your purple, rounded down (at most 4).', {
      onRivalExtraTurn(ctx, owner) { ctx.gain(owner, P, Math.min(4, Math.floor((owner.res[P] || 0) / 2))); },
    }),
    // fill-in (critic): took the slot of an earlier card called Timekeeper (the name now belongs to the game-end purple card)
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 4 (the most one pass moves);
    // balance pass 2 (pooled bench, midpoint 2.1; design/eval/balance-pass-2.md): 4 → 2
    m('doubletime', 'Corner-Cutter', 2, 0,'Purple you pay for extra turns costs half, rounded up.', { halfTurns: true }),
    // pays on your last placement of the round, before that turn's buy (at round end, round III's purple came too late).
    // +1 per worker measured 8.4 followers (57% win, easy bots): late purple decides the ring. Half that is the card.
    // Cory, 2026-10-15: pays when your last turn of the round ends, after an Overtime or Night Owl minion has landed
    m('bookkeeper', 'Bookkeeper', 4, 2, 'After your last turn each round: +1 purple per 2 of your minions on the board.', {
      onTurnEnd(ctx, owner, card, who) {
        if (who !== owner || owner.left !== 0 || card.paidRound === ctx.state.round) return;
        card.paidRound = ctx.state.round;
        ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2));
      },
    }),
    m('clockmaker', 'Clockmaker', 1, 2, 'Now and at round start: +1 purple per 2 purple you have.', { now: true,
      // round start, not end (Claude, 2026-10-14, after Cory: purple left at the end of round III is worth nothing)
      // counts after other round-start income (Lamplighter…), like Steward
      onRoundStartLate(ctx, owner) { ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2)); },
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 8 → 12
    m('lamplighter', 'Lamplighter', 6, 2,'Now and at round start: +1 purple per minion you get this round (3 / 4 / 5).', { now: true,
      // Cory, 2026-10-15: every minion you get counts (Extra Hand's too)
      onRoundStart(ctx, owner) { ctx.gain(owner, P, owner.workers || [3, 4, 5][ctx.state.round - 1] || 3); },
    }),
    // Relay's slot (Cory cut Relay, 2026-10-14). Member-value sim, handed over at round II: 6.9 followers, 53% win
    // (Normal bots, n=320), so 8+2 (design/eval/purple-members.md). At 4 players round I has no space to spare, so it
    // pays from round II. Fires once per round (owlRound), whether or not the board had room.
    m('nightowl', 'Night Owl', 6, 2, 'Once per round: after you place your last minion, take an extra turn.', { f: 2, from: 2,
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
    // Cory's Purple members (2026-10-22); names are Claude's fill-ins; prices are the pricing thread's educated guesses
    m('earlybird', 'Early Bird', 2, 2, 'Your turns can’t be skipped.', { noSkip: true }),
    m('bouncer', 'Bouncer', 1, 2, 'When recruited: the next two rivals’ turns are skipped.', {
      // the next two turns that belong to rivals; your own turn between them still happens (Cory's yes)
      onRecruited(ctx, owner) {
        const q = ctx.state.queue, end = q.findIndex(t => t.t === 'endTurn'), close = q.findIndex(t => t.t === 'allPlaced');
        const who = q.slice(end + 1, close < 0 ? q.length : close).filter(x => x.t === 'turn' && x.p !== owner.id).slice(0, 2).map(x => x.p);
        if (!who.length) { ctx.log(`${owner.name}'s Bouncer: no rival has a turn left to skip this round.`); return; }
        // the second is the next rival turn after the first one moves to the end: skip in order
        let n = 0;
        while (n < 2) {
          const q2 = ctx.state.queue, e2 = q2.findIndex(t => t.t === 'endTurn'), c2 = q2.findIndex(t => t.t === 'allPlaced');
          const rest = q2.slice(e2 + 1, c2 < 0 ? q2.length : c2).filter(x => x.t === 'turn');
          const next = rest.slice(0, rest.length - n).find(x => x.p !== owner.id);
          if (!next) break;
          skipNext(ctx, ctx.player(next.p), 'Bouncer', owner);
          n++;
        }
      },
    }),
    // Purple's artifact only, never dealt (Claude's pick, 2026-10-24, after Cory found Courier "a little too good").
    // Name is Claude's fill-in.
    m('pocketwatch', 'Pocket Watch', 0, 0, 'Whenever a player’s turn is skipped, +1 purple.', { artifact: true,
      onSkip(ctx, owner) { const got = ctx.gain(owner, 'purple', 1); if (got) ctx.log(`${owner.name}'s Pocket Watch: +${got.n} ${got.color}.`); },
    }),
    m('gossip', 'Gossip', 3, 2, 'Whenever a player’s turn is skipped, +1 follower.', {
      onSkip(ctx, owner) { owner.bonus += 1; ctx.log(`${owner.name}'s Gossip: +1 follower.`); },
    }),
    m('extrashift', 'Extra Shift', 5, 3, 'When recruited: +1 minion this round.', { from: 2,
      // the snake carries on until every minion is placed, so the new one goes after everyone else's
      onRecruited(ctx, owner) {
        if (ctx.state.round === 1) { ctx.log(`No extra minions in round I: ${owner.name} gets no extra minion from Extra Shift.`); return; }
        if (!spareSpace(ctx)) { ctx.log(`${owner.name}'s Extra Shift: no free space this round, so no extra minion.`); return; }
        const q = ctx.state.queue, close = q.findIndex(t => t.t === 'allPlaced');
        q.splice(close < 0 ? q.length : close, 0, { t: 'turn', p: owner.id });
        owner.left += 1;
        ctx.log(`${owner.name}'s Extra Shift: ${owner.name} gets 1 more minion this round.`);
        extraHooks(ctx, owner);
      },
    }),
    // Cory, 2026-10-23: "its when you place THE last minion of the round. so it benefits folks going last"
    // Cory, 2026-10-24: "go deep card for every color" ("sure for now"); name and price Claude's fill-in, priced like Chronicler
    m('timekeepers', 'Timekeepers', 1, 3, 'Game end: +1 follower per purple member you have.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'purple'),
    }),
    m('closer', 'Closer', 2, 2, 'When you place the last minion of the round: +4 purple.', {
      afterAction(ctx, owner, card) {
        if (card.paidRound === ctx.state.round || ctx.state.players.some(o => o.left > 0)) return;
        card.paidRound = ctx.state.round;
        ctx.gain(owner, P, 4);
      },
    }),
    m('streak', 'Hot Streak', 2, 2, 'Once per round: +2 followers per turn in a row you’ve taken just before this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        const k = inARow(ctx, owner);
        if (!k) { card.used = false; ctx.log(`${owner.name}'s Hot Streak: no turns in a row just before this one yet.`); return; }
        owner.bonus += 2 * k;
        ctx.log(`${owner.name}'s Hot Streak: +${2 * k} followers.`);
      },
      botActivate: (ctx, owner) => inARow(ctx, owner) >= 2 || (inARow(ctx, owner) >= 1 && ctx.state.round === 3),
    }),
    m('crew', 'Shift Crew', 1, 1, 'Worth 2 followers.', { f: 2, vanilla: true }),
  ],
};
