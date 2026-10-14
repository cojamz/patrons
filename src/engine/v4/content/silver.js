// Silver: the host. Big gains for you, a little for everyone else. Most silver at round end takes the ring's followers.
// Every Silver space spills onto the table, and the spill is a choice: when you throw the feast, which color
// you hand out (it lifts everyone's count in that color's contest), and which trailing player gets the alms.
// Silver members either make the host richer for giving, or reward whoever sits at the host's table.
//
// "Give" is Silver's verb: anything a Silver space or member hands to another player. Gifts fire two
// module-level hooks on members: onGive (the giver's members) and onGiven (the receiver's members).
// Engine note (see design/spheres/silver.md): Gold's Joint Venture also gives, but core.js has no gift
// signal, so Guest doesn't fire on it. A `from` option on ctx.gain would fix that.
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
  for (const [c, d] of hooks(ctx, to, 'onGiven')) d.onGiven(ctx, to, c, giver, color, n);
}
/** Give n of a color to every other player. One gift for the giver's onGive hooks. */
function giveAll(ctx, giver, color, n) {
  if (!(n > 0)) return;
  for (const o of others(ctx, giver)) giveTo(ctx, giver, o, color, n);
  afterGive(ctx, giver);
}
function afterGive(ctx, giver) {
  for (const [c, d] of hooks(ctx, giver, 'onGive')) d.onGive(ctx, giver, c);
}
/** Someone took a Silver space: rivals' members that watch for it react. */
function spaceTaken(ctx, p) {
  for (const o of others(ctx, p)) for (const [c, d] of hooks(ctx, o, 'onSilverSpace')) d.onSilverSpace(ctx, o, c, p);
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
    key: 'feast', ring: 1, name: 'Feast', text: '+4 silver, and everyone else +1 silver.',
    estimate: ctx => 4 - spillCost(ctx, 1),
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      ctx.gain(p, S, 4, { fromAction: true });
      giveAll(ctx, p, S, 1);
      ctx.log(`${p.name} threw a feast: +4 silver, +1 silver to everyone else.`);
    },
  },
  {
    key: 'gift', ring: 1, name: 'Gift', text: '+2 silver and +2 of another color; everyone else gets 1 of that color.',
    estimate: ctx => 4 - spillCost(ctx, 1),
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      ctx.gain(p, S, 2, { fromAction: true });
      ctx.choose(p, 'Gift: which color? You get 2, everyone else gets 1.', otherColors(ctx).map(c => ({
        id: `color:${c}`, label: c, kind: 'color', value: c, hint: colorHint(ctx, p, c),
      })), 'silver.gift', { mine: 2 });
    },
  },
  {
    key: 'alms', ring: 1, name: 'Alms', text: '+3 silver, and the rival with the fewest followers gets 2 of a color you choose.',
    estimate: () => 3,
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      ctx.gain(p, S, 3, { fromAction: true });
      const rs = others(ctx, p);
      const low = Math.min(...rs.map(o => ctx.followers(o)));
      const tied = rs.filter(o => ctx.followers(o) === low);
      const leader = Math.max(...ctx.state.players.map(o => ctx.followers(o)));
      const opts = [];
      for (const o of tied) for (const c of ctx.state.resources) {
        // bots feed the trailer the color that most hurts the leader: the one the trailer is closest to winning
        const lead = leadIn(ctx, o, c);
        opts.push({
          id: `give:${o.id}:${c}`, label: tied.length > 1 ? `${o.name}: 2 ${c}` : `2 ${c}`, kind: 'give', value: [o.id, c],
          hint: (lead >= -2 && lead <= 0 ? 1 : 0) - (ctx.followers(o) === leader ? 0.5 : 0) + (c === S ? -0.5 : 0),
        });
      }
      ctx.choose(p, `Alms: give 2 of which color${tied.length > 1 ? ', and to whom' : ` to ${tied[0].name}`}?`, opts, 'silver.alms');
    },
  },
  {
    key: 'banquet', ring: 2, name: 'Banquet', text: '+3 silver and +3 of another color; everyone else gets 1 of that color.',
    estimate: ctx => 6 - spillCost(ctx, 1),
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      ctx.gain(p, S, 3, { fromAction: true });
      ctx.choose(p, 'Banquet: which color? You get 3, everyone else gets 1.', otherColors(ctx).map(c => ({
        id: `color:${c}`, label: c, kind: 'color', value: c, hint: colorHint(ctx, p, c),
      })), 'silver.gift', { mine: 3 });
    },
  },
  {
    key: 'tide', ring: 2, name: 'Rising Tide', text: 'Everyone else +1 silver. Then gain half the silver of the richest rival (rounded up).',
    estimate: (ctx, p) => tideAmount(ctx, p, 1) - spillCost(ctx, 1),
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      giveAll(ctx, p, S, 1);
      const k = tideAmount(ctx, p, 0);
      ctx.gain(p, S, k, { fromAction: true });
      ctx.log(`${p.name}'s Rising Tide: +1 silver to everyone else, then +${k} silver.`);
    },
  },
  {
    key: 'jubilee', ring: 3, name: 'Jubilee', text: 'Gain 1 follower per 2 silver you hold (keep the silver). Everyone else +2 silver.',
    estimate: (ctx, p) => 2 * Math.floor(p.res[S] / 2) - spillCost(ctx, 2),
    resolve(ctx, p) {
      spaceTaken(ctx, p);
      const f = Math.floor(p.res[S] / 2);
      p.bonus += f;
      giveAll(ctx, p, S, 2);
      ctx.log(`${p.name}'s Jubilee: +${f} followers, +2 silver to everyone else.`);
    },
  },
];

const silver = {
  id: 'silver',
  name: 'Silver',
  resource: S,
  scoring: { label: 'Most silver', score: (ctx, p) => p.res[S] },
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
    benefactor(ctx, p, id) {
      const t = ctx.player(id);
      giveTo(ctx, p, t, S, 1);
      afterGive(ctx, p);
      ctx.log(`${p.name}'s Benefactor gives ${t.name} 1 silver.`);
    },
    confidant(ctx, p, id, data) {
      ctx.card(data.uid).target = id;
      ctx.log(`${p.name}'s Confidant watches ${ctx.player(id).name}.`);
    },
  },

  members: [
    m('guest', 'Guest', 1, 0, 'Whenever another player gives you something, +1 more of it.', {
      onGiven(ctx, owner, card, giver, color) { if (giver !== owner) ctx.gain(owner, color, 1); },
    }),
    m('benefactor', 'Benefactor', 1, 1, 'At round start, +3 silver, and a rival you pick gets 1 silver.', {
      onRoundStart(ctx, owner) {
        ctx.gain(owner, S, 3);
        const low = Math.min(...others(ctx, owner).map(o => ctx.followers(o)));
        ctx.choose(owner, 'Benefactor: give 1 silver to…', others(ctx, owner).map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: ctx.followers(o) === low ? 1 : 0,
        })), 'silver.benefactor');
      },
    }),
    m('caterer', 'Caterer', 1, 1, 'Whenever you give something to other players, +1 silver.', {
      onGive(ctx, owner) { ctx.gain(owner, S, 1); },
    }),
    m('almoner', 'Almoner', 1, 1, 'At round start, +2 silver per player with more followers than you.', {
      onRoundStart(ctx, owner) {
        const k = others(ctx, owner).filter(o => ctx.followers(o) > ctx.followers(owner)).length;
        ctx.gain(owner, S, 2 * k);
      },
    }),
    m('saint', 'Patron Saint', 3, 2, 'Game end: +1 follower per silver member in play, anyone’s.', {
      onGameEnd: ctx => ctx.state.players.reduce((s, o) => s + ctx.countMembersOfColor(o, S), 0),
    }),
    m('retinue', 'Retinue', 1, 1, 'Counts as 2 members. When recruited, everyone else +1 silver.', {
      f: 2, n: 2,
      onRecruited(ctx, owner) { giveAll(ctx, owner, S, 1); },
    }),
    m('gala', 'Gala', 2, 2, 'Once per game: double your silver, and everyone else +2 silver.', {
      activate: 'game',
      onActivate(ctx, owner) {
        ctx.gain(owner, S, owner.res[S]);
        giveAll(ctx, owner, S, 2);
        ctx.log(`${owner.name} threw a Gala: silver doubled to ${owner.res[S]}, +2 silver to everyone else.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res[S] >= 6,
    }),
    m('ambassador', 'Ambassador', 1, 1, 'Whenever a rival recruits a silver member, +1 silver.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner && ctx.defOf(recruited).quadrant === S) ctx.gain(owner, S, 1);
      },
    }),
    m('diplomat', 'Diplomat', 2, 2, 'Whenever you take a space outside Silver, +2 silver, and everyone else +1 silver.', {
      afterAction(ctx, owner, card, qid) {
        if (qid === S) return;
        ctx.gain(owner, S, 2);
        giveAll(ctx, owner, S, 1);
      },
    }),
    m('heir', 'Heir', 1, 1, 'At the start of round III, +2 silver per member you have.', {
      onRoundStart(ctx, owner) { if (ctx.state.round === 3) ctx.gain(owner, S, 2 * ctx.memberCount(owner)); },
    }),
    m('hangeron', 'Hanger-On', 1, 0, 'Whenever a rival takes a Silver space, +1 silver.', {
      onSilverSpace(ctx, owner) { ctx.gain(owner, S, 1); },
    }),
    m('toastmaster', 'Toastmaster', 3, 2, 'Whenever you take a Silver space, +1 follower.', {
      afterAction(ctx, owner, card, qid) { if (qid === S) owner.bonus += 1; },
    }),
    m('confidant', 'Confidant', 1, 1, 'When recruited, pick a rival. Whenever they recruit, +1 silver.', {
      onRecruited(ctx, owner, card) {
        ctx.choose(owner, 'Confidant: watch which rival?', others(ctx, owner).map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: ctx.memberCount(o),
        })), 'silver.confidant', { uid: card.uid });
      },
      onAnyRecruit(ctx, owner, card, by) { if (card.target !== undefined && by.id === card.target && by !== owner) ctx.gain(owner, S, 1); },
    }),
    m('socialite', 'Socialite', 1, 1, 'At round start, +1 silver per rival who has any silver.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, S, others(ctx, owner).filter(o => o.res[S] > 0).length); },
    }),
    m('spoon', 'Silver Spoon', 2, 0, 'When recruited, gain silver equal to the most silver any rival has.', {
      onRecruited(ctx, owner) { ctx.gain(owner, S, Math.max(0, ...others(ctx, owner).map(o => o.res[S]))); },
    }),
  ],
};

export default silver;
