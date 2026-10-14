// Purple: time. Trade turns for power.
// Rest a worker (skip a turn) for a payoff, wake resting workers later to act back to back, or lift a worker
// off the board to go again. Resting workers are visible: they lie in front of you. Most resting workers at
// round end takes the ring's followers.
//
// Engine notes (content-only, no core change):
// - p.rest / p.restRound: resting workers this round (a stale round reads as 0, so nothing has to reset them).
// - p.left stays "turns still scheduled", so bots and the UI keep working: a rest removes a scheduled turn,
//   a wake adds one.
// - Extra turns are ordinary { t: 'turn' } tasks put right after the current turn ends.
// - onWake / onLift are purple-only member hooks, fired by the helpers below.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

const P = 'purple';
const TURN_VALUE = [3, 4.5, 6];
const RING_FOLLOWERS = [2, 4, 6];

/** Resting workers this round. */
export const restingOf = (ctx, p) => (p.restRound === ctx.state.round ? p.rest || 0 : 0);
function setRest(ctx, p, n) { p.rest = Math.max(0, n); p.restRound = ctx.state.round; }
const scheduled = (ctx, p) => ctx.state.queue.filter(t => t.t === 'turn' && t.p === p.id).length;
const hasNextTurn = (ctx, p) => scheduled(ctx, p) > 0;
function fire(ctx, p, hook, ...args) {
  for (const c of ctx.membersOf(p)) {
    for (const d of [c.def, c.copy ? ctx.quadrant(c.copy.split('.')[0]).members.find(x => x.id === c.copy) : null]) {
      if (d && d[hook]) d[hook](ctx, p, c, ...args);
    }
  }
}

/** Skip p's next scheduled turn this round; the worker rests. Returns true if a turn was skipped. */
export function restNext(ctx, p) {
  const q = ctx.state.queue;
  const k = q.findIndex(t => t.t === 'turn' && t.p === p.id);
  if (k < 0) return false;
  q.splice(k, 1);
  p.left -= 1;
  setRest(ctx, p, restingOf(ctx, p) + 1);
  ctx.log(`${p.name} rests a worker (skips a turn).`);
  return true;
}

/** Give p `n` extra turns, right after the current turn ends (or right away if no turn is running). */
export function extraTurns(ctx, p, n) {
  if (n <= 0) return;
  const q = ctx.state.queue;
  const end = q.findIndex(t => t.t === 'endTurn');
  const at = end < 0 ? 0 : end + 1;
  q.splice(at, 0, ...Array.from({ length: n }, () => ({ t: 'turn', p: p.id })));
  p.left += n;
}

/** Wake up to `n` resting workers: a turn each, right after this one. */
export function wake(ctx, p, n = Infinity) {
  const k = Math.min(n, restingOf(ctx, p));
  if (k <= 0) return 0;
  setRest(ctx, p, restingOf(ctx, p) - k);
  extraTurns(ctx, p, k);
  ctx.log(`${p.name} wakes ${k} worker${k > 1 ? 's' : ''}.`);
  for (let i = 0; i < k; i++) fire(ctx, p, 'onWake');
  return k;
}

const purpleIndex = ctx => ctx.state.quadrants.indexOf('purple');
/** Spaces holding one of p's workers that it may take back: other colors only; not the center unless allowed. */
function liftable(ctx, p, { center = true } = {}) {
  const out = [];
  for (const [key, owner] of Object.entries(ctx.state.slots)) {
    if (owner !== p.id) continue;
    const [q, i] = key.split('-').map(Number);
    if (q === purpleIndex(ctx)) continue;
    const a = ctx.quadrant(ctx.state.quadrants[q]).actions[i];
    if (!center && a.ring === 3) continue;
    out.push({ key, q, i, a });
  }
  return out;
}
function liftOptions(ctx, p, opts) {
  return liftable(ctx, p, opts).map(({ key, a, q }) => ({
    id: `slot:${key}`, label: `${a.name} (${ctx.quadrant(ctx.state.quadrants[q]).name})`, kind: 'slot', value: key,
    // bots lift the cheapest space to reopen
    hint: -a.ring,
  }));
}
/** Take p's worker off a space: the space opens again. */
function lift(ctx, p, key) {
  const q = Number(key.split('-')[0]);
  const qid = ctx.state.quadrants[q];
  const a = ctx.quadrant(qid).actions[Number(key.split('-')[1])];
  delete ctx.state.slots[key];
  ctx.log(`${p.name} takes a worker back from ${a.name}; it's open again.`);
  fire(ctx, p, 'onLift', qid);
}

// ---------- bot estimates ----------
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;
const maxRivalRest = (ctx, p) => Math.max(0, ...ctx.rivals(p).map(o => restingOf(ctx, o)));
/** Rough worth of holding `n` resting workers at round end, in units. */
function contestWorth(ctx, p, n) {
  if (n <= 0) return 0;
  const top = maxRivalRest(ctx, p);
  const v = (RING_FOLLOWERS[ctx.state.round - 1] || 2) * 1.5;
  return n > top ? v * 0.8 : n === top ? v * 0.5 : 0;
}
const restSwing = (ctx, p) => (hasNextTurn(ctx, p)
  ? contestWorth(ctx, p, restingOf(ctx, p) + 1) - contestWorth(ctx, p, restingOf(ctx, p)) - turnValue(ctx)
  : 0);

export default {
  id: 'purple',
  name: 'Purple',
  resource: P,
  scoring: { label: 'Most resting workers', score: (ctx, p) => restingOf(ctx, p) },

  actions: [
    {
      key: 'rest', ring: 1, name: 'Rest', text: '+4 purple. Skip your next turn this round; that worker rests.',
      estimate: (ctx, p) => 4 + restSwing(ctx, p),
      resolve(ctx, p) { ctx.gain(p, P, 4, { fromAction: true }); restNext(ctx, p); },
    },
    {
      key: 'doze', ring: 1, name: 'Doze', text: '+2 purple, and +2 more per resting worker you have.',
      estimate: (ctx, p) => 2 + 2 * restingOf(ctx, p),
      resolve(ctx, p) { ctx.gain(p, P, 2 + 2 * restingOf(ctx, p), { fromAction: true }); },
    },
    {
      key: 'wake', ring: 1, name: 'Wake', text: '+1 purple. Every resting worker of yours takes a turn now, one after another.',
      estimate: (ctx, p) => 1 + restingOf(ctx, p) * turnValue(ctx) - contestWorth(ctx, p, restingOf(ctx, p)),
      resolve(ctx, p) { ctx.gain(p, P, 1, { fromAction: true }); wake(ctx, p); },
    },
    {
      key: 'slumber', ring: 2, name: 'Slumber', text: 'Skip your next turn this round (that worker rests), then +3 purple per resting worker.',
      estimate: (ctx, p) => 3 * (restingOf(ctx, p) + (hasNextTurn(ctx, p) ? 1 : 0)) + restSwing(ctx, p),
      resolve(ctx, p) {
        restNext(ctx, p);
        ctx.gain(p, P, 3 * restingOf(ctx, p), { fromAction: true });
      },
    },
    {
      key: 'linger', ring: 2, name: 'Linger', text: 'Take back one of your workers from an outer or middle space of another color, and take a turn with it now.',
      estimate: (ctx, p) => (liftable(ctx, p, { center: false }).length ? turnValue(ctx) + memberBonus(ctx, p, 'onLift') : 0),
      resolve(ctx, p) {
        ctx.choose(p, 'Linger: take a worker back from…', liftOptions(ctx, p, { center: false }), 'purple.linger');
      },
    },
    {
      key: 'rally', ring: 3, name: 'Rally', text: 'Every resting worker of yours takes a turn now, then you take one more.',
      estimate: (ctx, p) => (restingOf(ctx, p) + 1) * turnValue(ctx) - contestWorth(ctx, p, restingOf(ctx, p)),
      resolve(ctx, p) {
        const k = wake(ctx, p);
        extraTurns(ctx, p, 1);
        ctx.log(`${p.name} rallies: ${k + 1} turn${k ? 's' : ''} in a row.`);
      },
    },
  ],

  handlers: {
    linger(ctx, p, key) {
      lift(ctx, p, key);
      extraTurns(ctx, p, 1);
    },
    lullaby(ctx, p, id) {
      const t = ctx.player(id);
      ctx.log(`${p.name}'s Lullaby puts ${t.name} to sleep.`);
      restNext(ctx, t);
    },
    hourglass(ctx, p, yes) {
      if (!yes) return;
      // the last scheduled turn this round
      const q = ctx.state.queue;
      let k = -1;
      for (let i = q.length - 1; i >= 0; i--) if (q[i].t === 'turn' && q[i].p === p.id) { k = i; break; }
      if (k < 0) return;
      q.splice(k, 1);
      p.left -= 1;
      setRest(ctx, p, restingOf(ctx, p) + 1);
      ctx.gain(p, P, 4);
      ctx.log(`${p.name}'s Hourglass: rests their last worker, +4 purple.`);
    },
  },

  members: [
    m('lamplighter', 'Lamplighter', 1, 1, 'At round start, +1 purple per worker you get this round (3 / 4 / 5).', {
      onRoundStart(ctx, owner) { ctx.gain(owner, P, [3, 4, 5][ctx.state.round - 1] || 3); },
    }),
    m('dreamer', 'Dreamer', 1, 1, 'At round end, +2 purple per resting worker you have.', {
      onRoundEnd(ctx, owner) { const n = restingOf(ctx, owner); if (n) ctx.gain(owner, P, 2 * n); },
    }),
    m('insomniac', 'Insomniac', 2, 1, 'Once per round: wake one resting worker; it takes a turn right after this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if (!wake(ctx, owner, 1)) { card.used = false; ctx.log(`${owner.name} has no resting worker to wake.`); }
      },
      botActivate: (ctx, owner) => restingOf(ctx, owner) > 0 && ctx.state.round === 3,
    }),
    m('hibernator', 'Hibernator', 2, 1, 'Your resting workers at round end stay resting into the next round.', {
      onRoundEnd(ctx, owner, card) { card.carry = restingOf(ctx, owner); },
      onRoundStart(ctx, owner, card) {
        const n = card.carry || 0;
        card.carry = 0;
        if (n) { setRest(ctx, owner, restingOf(ctx, owner) + n); ctx.log(`${owner.name}'s Hibernator: ${n} worker${n > 1 ? 's' : ''} still resting.`); }
      },
    }),
    m('straggler', 'Straggler', 2, 1, 'At round start, if you have the fewest followers (ties count), +1 resting worker.', {
      onRoundStart(ctx, owner) {
        const me = ctx.followers(owner);
        if (ctx.rivals(owner).every(o => ctx.followers(o) >= me)) setRest(ctx, owner, restingOf(ctx, owner) + 1);
      },
    }),
    m('hermit', 'Hermit', 3, 1, 'Game end: +3 followers per resting worker you have.', {
      onGameEnd: (ctx, owner) => 3 * restingOf(ctx, owner),
    }),
    m('secondwind', 'Second Wind', 4, 2, 'Once per game: take an extra turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner) { extraTurns(ctx, owner, 1); ctx.log(`${owner.name} used Second Wind: an extra turn.`); },
      botActivate: ctx => ctx.state.round === 3,
    }),
    m('moonlighter', 'Moonlighter', 2, 1, 'Whenever you take back a worker, +2 of that space’s color.', {
      onLift(ctx, owner, card, qid) { ctx.gain(owner, ctx.quadrant(qid).resource, 2); },
    }),
    m('timekeeper', 'Timekeeper', 2, 1, 'Whenever a rival buys 6 followers, +3 purple.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        // older engines don't pass the tier: fall back to the line just logged
        const six = tier ? tier.get === 6 : ctx.state.log[ctx.state.log.length - 1]?.startsWith(`${buyer.name} bought 6 followers`);
        if (buyer !== owner && six) ctx.gain(owner, P, 3);
      },
    }),
    m('nightcrew', 'Night Crew', 3, 1, 'Worth 3 followers. When recruited, skip your next turn this round (that worker rests).', {
      f: 3,
      onRecruited(ctx, owner) { restNext(ctx, owner); },
    }),
    m('hourglass', 'Hourglass', 1, 1, 'At round start, you may rest your last worker of the round for +4 purple.', {
      onRoundStartLate(ctx, owner, card) {
        ctx.choose(owner, 'Hourglass: rest your last worker this round for +4 purple?', [
          { id: 'yes', label: 'Rest it, +4 purple', kind: 'yes', value: true, hint: ctx.state.round < 3 ? 1 : 0 },
          { id: 'no', label: 'No', kind: 'no', value: false, hint: ctx.state.round < 3 ? 0 : 1 },
        ], 'purple.hourglass');
      },
    }),
    m('drifter', 'Drifter', 1, 1, 'When recruited, +1 resting worker this round.', {
      onRecruited(ctx, owner) { setRest(ctx, owner, restingOf(ctx, owner) + 1); },
    }),
    m('rooster', 'Rooster', 1, 1, 'Whenever one of your resting workers wakes, +1 of each other color.', {
      onWake(ctx, owner) { for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1); },
    }),
    m('reveille', 'Reveille', 2, 2, 'Once per game: wake every resting worker; each takes a turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        if (!wake(ctx, owner)) { card.used = false; ctx.log(`${owner.name} has no resting worker to wake.`); }
      },
      botActivate: (ctx, owner) => restingOf(ctx, owner) >= 1 && ctx.state.round === 3,
    }),
    m('lullaby', 'Lullaby', 2, 1, 'Once per game: the leader (most followers, if not you) skips their next turn; that worker rests.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        const hit = lullabyTargets(ctx, owner);
        if (!hit.length) { card.used = false; ctx.log('Lullaby: no leader with a turn left to put to sleep.'); return; }
        if (hit.length === 1) { ctx.log(`${owner.name}'s Lullaby puts ${hit[0].name} to sleep.`); restNext(ctx, hit[0]); return; }
        ctx.choose(owner, 'Lullaby: who sleeps?', hit.map(o => ({ id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: 0 })), 'purple.lullaby');
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && lullabyTargets(ctx, owner).some(o => ctx.followers(o) > ctx.followers(owner) + 4),
    }),
  ],
};

/** The leader(s), if ahead of p and still due a turn this round. */
function lullabyTargets(ctx, p) {
  const top = Math.max(...ctx.state.players.map(o => ctx.followers(o)));
  if (ctx.followers(p) === top) return [];
  return ctx.rivals(p).filter(o => ctx.followers(o) === top && hasNextTurn(ctx, o));
}

// what a member hook adds to an action, for bot estimates
function memberBonus(ctx, p, hook) {
  let v = 0;
  for (const c of ctx.membersOf(p)) {
    if (!c.def[hook]) continue;
    v += { onLift: 2, onWake: 3 }[hook] || 0;
  }
  return v;
}
