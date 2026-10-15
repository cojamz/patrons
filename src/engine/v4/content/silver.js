// Silver: the host. Big gains for you, a little for everyone else. Most silver at round end takes the ring's followers.
// Every Silver space spills onto the table, and the spill is a choice: when you host, which color you hand
// out (it lifts everyone's count in that color's contest), and which rival gets your alms.
// Silver members pay the host; only Guest rewards sitting at someone else's table.
//
// "Give" is Silver's verb: anything a Silver space or member hands to another player. Gifts fire two
// module-level hooks on members: onGive (the giver's members) and onGiven (the receiver's members).
// Gold's Kickback also gives (Cory): gold.js fires the receiver's onGiven hooks itself.
import { defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const S = 'silver';
const others = (ctx, p) => ctx.rivals(p);
const otherColors = ctx => ctx.state.resources.filter(c => c !== S);

// a Doppelganger runs the hooks of the member it copies too
const effDefs = c => (c.copy ? [c.def, defById(c.copy)] : [c.def]);
function hooks(ctx, p, name) {
  const out = [];
  for (const c of ctx.membersOf(p)) for (const d of effDefs(c)) if (d[name]) out.push([c, d]);
  return out;
}

/** Give n of a color to one player. Fires the receiver's onGiven hooks. */
function giveTo(ctx, giver, to, color, n) {
  if (!(n > 0)) return;
  ctx.gain(to, color, n);
  // run as the member, so what it gives traces to it (Guest)
  for (const [c, d] of hooks(ctx, to, 'onGiven')) ctx.asMember(to, d.name, () => d.onGiven(ctx, to, c, giver, color, n));
}
/** Give n of a color to every other player. One gift for the giver's onGive hooks. */
function giveAll(ctx, giver, color, n) {
  if (!(n > 0)) return;
  for (const o of others(ctx, giver)) giveTo(ctx, giver, o, color, n);
  afterGive(ctx, giver);
}
/** One gift from giver to one player, as any sphere gives (Gold's Kickback): receiver's and giver's gift hooks fire. */
export function give(ctx, giver, to, color, n) {
  if (!(n > 0)) return;
  giveTo(ctx, giver, to, color, n);
  afterGive(ctx, giver);
}
function afterGive(ctx, giver) {
  for (const [c, d] of hooks(ctx, giver, 'onGive')) ctx.asMember(giver, d.name, () => d.onGive(ctx, giver, c));
}
/** Silver a Silver space pays its taker: Grand Host doubles it (each copy doubles again). */
function hostGain(ctx, p, n) {
  const k = hooks(ctx, p, 'hostDouble').length;
  if (k) ctx.log(`${p.name}'s Grand Host: the space's ${n} silver comes as ${n * 2 ** k}.`);
  // printed: the space's own gain, which is what a copy (Green) gets
  ctx.gain(p, S, n * 2 ** k, { fromAction: true, printed: n });
  return n * 2 ** k;
}

// Bots: how much I lead (or trail) a color's count by. Handing everyone +1 of a color I lead by 1 or less hurts.
function leadIn(ctx, p, color) {
  const best = Math.max(0, ...others(ctx, p).map(o => o.res[color] || 0));
  return (p.res[color] || 0) - best;
}
const colorHint = (ctx, p, color) => {
  const lead = leadIn(ctx, p, color);
  const risky = (p.res[color] || 0) > 0 && lead >= 0 && lead <= 1 ? -1 : 0; // the gift could tie or pass me
  return risky - 0.3 * (p.res[color] || 0); // otherwise take the color I'm short of
};
/** Half the richest rival's silver, rounded up (plus the +1 they're about to get, for bot estimates). */
const tideAmount = (ctx, p, extra) => Math.ceil((Math.max(0, ...ctx.rivals(p).map(o => o.res[S])) + extra) / 2);
const spillCost = (ctx, n) => 0.25 * n * (ctx.state.players.length - 1);

export const silverActions = [
  {
    key: 'toast', ring: 1, name: 'Toast', text: '+3 silver in round I, +6 in round II, +9 in round III, and everyone else +1 silver.',
    estimate: ctx => 3 * ctx.state.round - spillCost(ctx, 1),
    resolve(ctx, p) {
      const n = 3 * ctx.state.round;
      const got = hostGain(ctx, p, n);
      giveAll(ctx, p, S, 1);
      // what the taker got (Grand Host's doubling included), so the line matches the count
      ctx.log(`${p.name} raised a toast: +${got} silver, +1 silver to everyone else.`);
    },
  },
  {
    key: 'gift', ring: 1, name: 'Goody Bags', text: '+2 silver and +2 of another color you choose; everyone else gets 1 of that color.',
    estimate: ctx => 4 - spillCost(ctx, 1),
    resolve(ctx, p) {
      hostGain(ctx, p, 2);
      ctx.choose(p, 'Goody Bags: which color? You get 2, everyone else gets 1.', otherColors(ctx).map(c => ({
        id: `color:${c}`, label: c, kind: 'color', value: c, hint: colorHint(ctx, p, c),
      })), 'silver.gift', { mine: 2 });
    },
  },
  {
    key: 'alms', ring: 1, name: 'Good Deed', text: '+4 silver, and a rival you choose gets 2 of a color you choose.',
    estimate: () => 4 - 0.5,
    resolve(ctx, p) {
      hostGain(ctx, p, 4);
      const leader = Math.max(...ctx.state.players.map(o => ctx.followers(o)));
      const opts = [];
      for (const o of others(ctx, p)) for (const c of ctx.state.resources) {
        // bots feed whoever trails, in the color that rival is closest to winning; never the leader
        const lead = leadIn(ctx, o, c);
        opts.push({
          id: `give:${o.id}:${c}`, label: `${o.name}: 2 ${c}`, kind: 'give', value: [o.id, c],
          hint: -0.3 * ctx.followers(o) + (lead >= -2 && lead <= 0 ? 1 : 0) - (ctx.followers(o) === leader ? 2 : 0) + (c === S ? -0.5 : 0),
        });
      }
      ctx.choose(p, 'Good Deed: give 2 of which color, to whom?', opts, 'silver.alms');
    },
  },
  {
    key: 'tongue', ring: 2, name: 'Sweet Talk', text: '+4 silver, then swap any of your silver for one other color, one for one. Everyone else +1 silver.',
    estimate: ctx => 5 - spillCost(ctx, 1),
    resolve(ctx, p) {
      hostGain(ctx, p, 4);
      const have = p.res[S];
      const opts = [{ id: 'keep', label: 'Keep it all', kind: 'swap', value: null, hint: 0 }];
      for (const c of otherColors(ctx)) for (const x of [...new Set([Math.floor(have / 2), have])].filter(v => v > 0)) {
        opts.push({ id: `swap:${c}:${x}`, label: `${x} silver → ${x} ${c}`, kind: 'swap', value: [c, x],
          // bots: turn half into the color they're shortest of
          hint: x === Math.floor(have / 2) ? 1 - 0.2 * (p.res[c] || 0) : -1 });
      }
      ctx.choose(p, `Sweet Talk: swap silver for another color? (you have ${have})`, opts, 'silver.tongue');
    },
  },
  {
    key: 'tide', ring: 2, name: 'Rising Tide', text: 'Everyone else +1 silver. Then gain half the silver of the rival with the most (rounded up).',
    estimate: (ctx, p) => tideAmount(ctx, p, 1) - spillCost(ctx, 1),
    resolve(ctx, p) {
      giveAll(ctx, p, S, 1);
      const k = tideAmount(ctx, p, 0);
      const got = hostGain(ctx, p, k);
      ctx.log(`${p.name}'s Rising Tide: +1 silver to everyone else, then +${got} silver.`);
    },
  },
  {
    key: 'jubilee', ring: 3, name: 'Hold Court', text: 'Gain 1 follower per 2 silver you hold (keep the silver). Everyone else +2 silver.',
    estimate: (ctx, p) => 2 * Math.floor(p.res[S] / 2) - spillCost(ctx, 2),
    resolve(ctx, p) {
      const f = Math.floor(p.res[S] / 2);
      p.bonus += f;
      giveAll(ctx, p, S, 2);
      ctx.log(`${p.name}'s Hold Court: +${f} followers, +2 silver to everyone else.`);
    },
  },
];

const silver = {
  id: 'silver',
  name: 'Silver',
  resource: S,
  scoring: { label: 'Most silver', counts: 'the silver you hold when the round ends', score: (ctx, p) => p.res[S] },
  actions: silverActions,

  handlers: {
    gift(ctx, p, color, data) {
      ctx.gain(p, color, data.mine, { fromAction: true });
      giveAll(ctx, p, color, 1);
      ctx.log(`${p.name} took ${data.mine} ${color} and gave everyone else 1 ${color}.`);
    },
    alms(ctx, p, [id, color]) {
      const t = ctx.player(id);
      giveTo(ctx, p, t, color, 2);
      afterGive(ctx, p);
      ctx.log(`${p.name} gave ${t.name} 2 ${color}.`);
    },
    tongue(ctx, p, value) {
      if (value) {
        const [c, x] = value;
        p.res[S] -= x; p.res[c] += x;
        ctx.log(`${p.name} turned ${x} silver into ${x} ${c}.`);
      }
      giveAll(ctx, p, S, 1);
    },
    benefactor(ctx, p, id) {
      const t = ctx.player(id);
      giveTo(ctx, p, t, S, 1);
      afterGive(ctx, p);
      ctx.log(`${p.name}'s Benefactor gives ${t.name} 1 silver.`);
    },
  },

  members: [
    m('guest', 'Guest', 4, 4, 'Whenever another player gives you something, +1 more of it.', {
      onGiven(ctx, owner, card, giver, color) { if (giver !== owner) ctx.gain(owner, color, 1); },
    }),
    m('benefactor', 'Benefactor', 4, 2, 'Now and at round start, +3 silver, and a rival you pick gets 1 silver.', { now: true,
      onRoundStart(ctx, owner) {
        ctx.gain(owner, S, 3);
        const low = Math.min(...others(ctx, owner).map(o => ctx.followers(o)));
        ctx.choose(owner, 'Benefactor: give 1 silver to…', others(ctx, owner).map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: ctx.followers(o) === low ? 1 : 0,
        })), 'silver.benefactor');
      },
    }),
    m('caterer', 'Caterer', 2, 2, 'Whenever you give something to other players, +1 silver.', {
      onGive(ctx, owner) { ctx.gain(owner, S, 1); },
    }),
    m('majordomo', 'Majordomo', 4, 2, 'Whenever you take a Silver space, +2 silver.', {
      afterAction(ctx, owner, card, qid) { if (qid === S) ctx.gain(owner, S, 2); },
    }),
    // rewards not hosting (Claude under Cory's go-with-your-gut, from the dead-window audit): "+1 more per action silver"
    // was Majordomo at half the yield, since almost all action silver comes from Silver spaces
    m('silversmith', 'Silversmith', 4, 2, 'Whenever a rival takes a Silver space, +1 silver.', {
      afterRivalAction(ctx, owner, card, qid) { if (qid === S) ctx.gain(owner, S, 1); },
    }),
    m('steward', 'Steward', 2, 2, 'Now and at round start, +1 silver per 3 silver you hold.', { now: true,
      // counts after every other round-start income (Benefactor, Banker…), as a player reads it (Cory hit this, 2026-10-14)
      onRoundStartLate(ctx, owner) { ctx.gain(owner, S, Math.floor(owner.res[S] / 3)); },
    }),
    m('retinue', 'Retinue', 1, 1, 'Worth 2 followers. When recruited, everyone else +1 silver.', {
      f: 2,
      onRecruited(ctx, owner) { giveAll(ctx, owner, S, 1); },
    }),
    // Cory (2026-10-14): replaces Feast Hall. Members are people or groups, and a hall is lots of people: it counts as
    // 3 members (n: 3) everywhere members are counted. Same cost for now; the fair-price screen checks it.
    m('revelers', 'Revelers', 4, 2, 'Counts as 3 members.', { n: 3 }),
    // pays when recruited too (Claude under Cory's go-with-your-gut, from the dead-window audit): blank if recruited in round III
    m('heir', 'Heir', 6, 2, 'Now and at the start of round III: +1 silver per member you have.', {
      onRecruited(ctx, owner) { ctx.gain(owner, S, ctx.memberCount(owner)); },
      onRoundStart(ctx, owner) { if (ctx.state.round === 3) ctx.gain(owner, S, ctx.memberCount(owner)); },
    }),
    // Cory, 2026-10-15 (balance pass 1, #2): half of it, Rising Tide's rule (both bots read the old card at 12+ for 6)
    m('spoon', 'Upstart', 4, 2, 'When recruited, gain half the silver of the richest rival (rounded up).', {
      onRecruited(ctx, owner) { ctx.gain(owner, S, Math.ceil(Math.max(0, ...others(ctx, owner).map(o => o.res[S] || 0)) / 2)); },
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 8 → 4
    m('toastmaster', 'Toastmaster', 2, 2, 'Whenever you take a Silver space, +1 follower.', {
      afterAction(ctx, owner, card, qid) { if (qid === S) owner.bonus += 1; },
    }),
    m('gala', 'Debutante', 4, 4, 'Once per game: double your silver, and everyone else +2 silver.', {
      activate: 'game',
      onActivate(ctx, owner) {
        ctx.gain(owner, S, owner.res[S]);
        giveAll(ctx, owner, S, 2);
        ctx.log(`${owner.name}'s Debutante: silver doubled to ${owner.res[S]}, +2 silver to everyone else.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res[S] >= 6,
    }),
    m('dowager', 'Dowager', 2, 2, 'Worth 3 followers.', { f: 3 }),
    m('grandhost', 'Grand Host', 8, 4, 'Silver spaces give you twice the silver.', { hostDouble: true }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 12 → 6 (the most one pass moves);
    // pass 2's pooled midpoint (5.2) rounds back to 6, so it stays (design/eval/balance-pass-2.md)
    m('saint', 'Patron Saint', 4, 2, 'Game end: +1 follower per 2 silver members in play, anyone’s.', {
      onGameEnd: ctx => Math.floor(ctx.state.players.reduce((s, o) => s + ctx.countMembersOfColor(o, S), 0) / 2),
    }),
  ],
};

export default silver;
