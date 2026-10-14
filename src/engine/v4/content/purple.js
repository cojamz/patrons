// Purple: extra turns. Purple is the currency of time: spend it to act again.
// Most workers on the board at round end takes the ring's followers; purple breaks ties.
//
// Engine notes (content-only, no core change):
// - An extra turn is an ordinary { t: 'turn' } task put right after the current turn ends (p.left += 1).
// - Extra turns only happen when the board has a space to spare (more open spaces than turns still to come),
//   so they never squeeze anyone out of the last space (round I fills every space).
// - Linger moves a worker: it queues the engine's own 'act' task for the new space.
// - onExtraTurn / onRivalExtraTurn are purple-only member hooks, fired by the helpers below.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const P = 'purple';
const TURN_VALUE = [3, 5, 7]; // a placement plus its buy, by round

/** Workers p has on the board right now. */
export const onBoard = (ctx, p) => Object.values(ctx.state.slots).filter(o => o === p.id).length;
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
const turnValue = ctx => TURN_VALUE[ctx.state.round - 1] || 3;

function fire(ctx, p, hook, ...args) {
  for (const c of ctx.membersOf(p)) {
    const defs = [c.def];
    if (c.copy) defs.push(ctx.quadrant(c.copy.split('.')[0]).members.find(x => x.id === c.copy));
    for (const d of defs) if (d && d[hook]) d[hook](ctx, p, c, ...args);
  }
}
function extraHooks(ctx, p) {
  fire(ctx, p, 'onExtraTurn');
  for (const o of ctx.rivals(p)) fire(ctx, o, 'onRivalExtraTurn', p);
}

/** Give p up to n extra turns right after the current one. Returns how many it got. */
export function extraTurns(ctx, p, n = 1) {
  let k = 0;
  for (; k < n && spareSpace(ctx); k++) {
    const q = ctx.state.queue;
    const end = q.findIndex(t => t.t === 'endTurn');
    q.splice(end < 0 ? 0 : end + 1 + k, 0, { t: 'turn', p: p.id });
    p.left += 1;
  }
  if (k) {
    ctx.log(`${p.name} takes ${k === 1 ? 'an extra turn' : `${k} extra turns`}.`);
    for (let i = 0; i < k; i++) extraHooks(ctx, p);
  } else ctx.log(`No space to spare: ${p.name} gets no extra turn.`);
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
      key: 'hourly', ring: 1, name: 'Hourly', text: '+1 purple per worker you get this round, +1 (4 / 5 / 6).',
      estimate: ctx => [3, 4, 5][ctx.state.round - 1] + 1,
      resolve(ctx, p) { ctx.gain(p, P, [3, 4, 5][ctx.state.round - 1] + 1, { fromAction: true }); },
    },
    {
      key: 'lend', ring: 1, name: 'Lend a Hand', text: '+3 purple, and +1 purple to a player you choose.',
      estimate: () => 3.3,
      resolve(ctx, p) {
        ctx.gain(p, P, 3, { fromAction: true });
        ctx.choose(p, 'Lend a Hand: give 1 purple to…', ctx.rivals(p).map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: -ctx.followers(o),
        })), 'purple.lend');
      },
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
      estimate: (ctx, p) => ((p.res[P] || 0) >= OT && spareSpace(ctx) ? turnValue(ctx) - OT * 0.8 + 1 : 2),
      resolve(ctx, p) {
        if ((p.res[P] || 0) >= OT && spareSpace(ctx)) {
          p.res[P] -= OT;
          ctx.log(`${p.name} pays ${OT} purple for Overtime.`);
          extraTurns(ctx, p, 1);
        } else ctx.gain(p, P, 2, { fromAction: true });
      },
    },
    {
      key: 'rally', ring: 3, name: 'Rally', text: 'Take an extra turn right after this one.',
      estimate: ctx => (spareSpace(ctx) ? turnValue(ctx) : 0),
      resolve(ctx, p) { extraTurns(ctx, p, 1); },
    },
  ],

  handlers: {
    lend(ctx, p, id) {
      const t = ctx.player(id);
      ctx.gain(t, P, 1);
      ctx.log(`${p.name} lent 1 purple to ${t.name}.`);
    },
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
    m('secondwind', 'Second Wind', 4, 2, 'Once per game: take an extra turn right after this one.', {
      activate: 'game',
      onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 1)) card.used = false; },
      botActivate: ctx => ctx.state.round === 3 && spareSpace(ctx),
    }),
    m('errand', 'Errand Runner', 2, 2, 'When recruited: take an extra turn right after this one.', {
      onRecruited(ctx, owner) { extraTurns(ctx, owner, 1); },
    }),
    m('taskmaster', 'Taskmaster', 3, 1, 'Once per round: pay 5 purple to take an extra turn right after this one.', {
      activate: 'round',
      onRoundStart(ctx, owner, card) { card.used = false; },
      onActivate(ctx, owner, card) {
        if ((owner.res[P] || 0) < 5 || !spareSpace(ctx)) { card.used = false; ctx.log(`${owner.name} can't pay for Taskmaster now.`); return; }
        owner.res[P] -= 5;
        extraTurns(ctx, owner, 1);
      },
      botActivate: (ctx, owner) => (owner.res[P] || 0) >= 5 && spareSpace(ctx) && ctx.state.round >= 2,
    }),
    m('straggler', 'Straggler', 3, 1, 'At round start, if you have the fewest followers (ties count), take an extra turn before anyone else.', {
      // the round's turns are queued after round-start hooks, so this one goes first
      onRoundStart(ctx, owner) {
        const me = ctx.followers(owner);
        if (ctx.state.round > 1 && ctx.rivals(owner).every(o => ctx.followers(o) >= me)) {
          ctx.state.queue.unshift({ t: 'turn', p: owner.id });
          owner.left += 1;
          ctx.log(`${owner.name}'s Straggler: an extra turn first.`);
          extraHooks(ctx, owner);
        }
      },
    }),
    m('foreman', 'Foreman', 2, 1, 'Whenever you take an extra turn, +2 purple.', {
      onExtraTurn(ctx, owner) { ctx.gain(owner, P, 2); },
    }),
    m('courier', 'Courier', 2, 1, 'Whenever you take an extra turn, +1 of each other color.', {
      onExtraTurn(ctx, owner) { for (const c of ctx.state.resources) if (c !== P) ctx.gain(owner, c, 1); },
    }),
    m('apprentice', 'Apprentice', 1, 1, 'Whenever you take an extra turn, your next member costs 1 less.', {
      onExtraTurn(ctx, owner) { owner.discount += 1; },
    }),
    m('overseer', 'Overseer', 3, 1, 'Whenever a rival takes an extra turn, +1 purple.', {
      onRivalExtraTurn(ctx, owner) { ctx.gain(owner, P, 1); },
    }),
    m('timekeeper', 'Timekeeper', 1, 1, 'Whenever a rival buys 6 followers, +1 purple.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        const six = tier ? tier.get === 6 : ctx.state.log[ctx.state.log.length - 1]?.startsWith(`${buyer.name} bought 6 followers`);
        if (buyer !== owner && six) ctx.gain(owner, P, 1);
      },
    }),
    m('bookkeeper', 'Bookkeeper', 2, 1, 'At round end, +1 purple per 2 workers you have on the board.', {
      onRoundEnd(ctx, owner) { ctx.gain(owner, P, Math.floor(onBoard(ctx, owner) / 2)); },
    }),
    m('clockmaker', 'Clockmaker', 2, 1, 'At round end, +1 purple per 2 purple you have.', {
      onRoundEnd(ctx, owner) { ctx.gain(owner, P, Math.floor((owner.res[P] || 0) / 2)); },
    }),
    m('lamplighter', 'Lamplighter', 1, 1, 'At round start, +2 purple.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, P, 2); },
    }),
    m('marathoner', 'Marathoner', 4, 2, 'Game end: +1 follower per worker you have on the board.', {
      onGameEnd: (ctx, owner) => onBoard(ctx, owner),
    }),
    m('patience', 'Patience', 3, 1, 'Game end: +1 follower per 3 purple.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res[P] || 0) / 3),
    }),
    m('crew', 'Shift Crew', 1, 1, 'Worth 2 followers. No effect.', { f: 2, vanilla: true }),
  ],
};
