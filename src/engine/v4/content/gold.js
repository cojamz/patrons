// Gold: hoard it. Most gold at round end takes the ring's followers.
import { give } from './silver.js';
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

export default {
  id: 'gold',
  name: 'Gold',
  resource: 'gold',
  // gold is money: each gold counts as any color when buying followers
  wildInFollowerBuys: true,
  scoring: { label: 'Most gold', counts: 'the gold you hold when the round ends', score: (ctx, p) => p.res.gold },

  actions: [
    {
      key: 'jv', ring: 1, name: 'Kickback', text: '+3 gold, and +1 gold to a player you choose.',
      estimate: () => 3.3,
      resolve(ctx, p) {
        ctx.gain(p, 'gold', 3, { fromAction: true });
        const rivals = ctx.rivals(p);
        ctx.choose(p, 'Kickback: give 1 gold to…', rivals.map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: -ctx.followers(o),
        })), 'gold.jvGift');
      },
    },
    {
      key: 'rush', ring: 1, name: 'Golden Years', text: '+2 gold per round number (2 / 4 / 6).',
      estimate: ctx => 2 * ctx.state.round,
      resolve(ctx, p) { ctx.gain(p, 'gold', 2 * ctx.state.round, { fromAction: true }); },
    },
    {
      key: 'discount', ring: 1, name: 'Intro Offer', text: 'Your next member costs 4 less, off any part of its cost.',
      estimate: ctx => (ctx.shopCards().some(c => c.def.s + c.def.w >= 6) ? 2.4 : 1.2),
      resolve(ctx, p) { p.discount += 4; ctx.log(p.discount > 4 ? `Intro Offer stacks: ${p.name}'s next member costs ${p.discount} less.` : `${p.name}'s next member costs 4 less.`); },
    },
    {
      key: 'steal', ring: 2, name: 'Collect Debts', text: 'Take up to 3 gold from rivals, split however you like.',
      estimate: (ctx, p) => Math.min(3, ctx.rivals(p).filter(o => ctx.canSteal(p, o)).reduce((s, o) => s + o.res.gold, 0)) * 1.4,
      resolve(ctx, p) { stealStep(ctx, p, { left: ctx.stealCount(p, 3, { say: true }), picked: {} }); },
    },
    {
      key: 'windfall', ring: 2, name: 'Tithe', text: '+1 gold per member you have.',
      estimate: (ctx, p) => ctx.memberCount(p),
      resolve(ctx, p) { ctx.gain(p, 'gold', ctx.memberCount(p), { fromAction: true }); },
    },
    {
      key: 'strike', ring: 3, name: 'Double Down', text: 'Double your gold.',
      estimate: (ctx, p) => p.res.gold,
      resolve(ctx, p) { ctx.gain(p, 'gold', p.res.gold, { fromAction: true }); },
    },
  ],

  handlers: {
    jvGift(ctx, p, value) {
      const t = ctx.player(value);
      ctx.log(`${p.name} gave 1 gold to ${t.name}.`);
      // the gold is a gift (Cory): Silver's gift hooks fire, the receiver's (Guest: +1 more) and the giver's (Caterer)
      give(ctx, p, t, 'gold', 1);
    },
    steal(ctx, p, value, data) {
      stealStep(ctx, p, { left: data.left - 1, picked: { ...data.picked, [value]: (data.picked[value] || 0) + 1 } });
    },
    invest(ctx, p, x, data) {
      if (!x) return;
      const card = ctx.card(data.uid);
      p.res.gold -= x; card.invested = (card.invested || 0) + x;
      ctx.log(`${p.name}'s Investor sets aside ${x} gold.`);
    },
    hustlerColor(ctx, p, value, data) {
      ctx.card(data.uid).color = value;
      ctx.log(`${p.name}'s Hustler works the ${ctx.quadrant(value).name} spaces.`);
    },
  },

  members: [
    m('midas', 'Midas', 4, 4, 'Gains from actions come as gold instead. You can switch it off or on when you buy.', {
      toggle: true,
      onRecruited(ctx, owner, card) { card.on = true; },
      // a conversion: runs before every other gain modifier, so "gold gains" sees the converted gain
      convertGain(ctx, owner, card, g) {
        if (card.on !== false && g.fromAction && g.color !== 'gold') g.color = 'gold';
      },
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 4 → 8
    m('banker', 'Banker', 4, 4, 'Now and at round start, +3 gold.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, 'gold', 3); },
    }),
    m('prospector', 'Prospector', 2, 2, 'Whenever an action gains you gold, +1 more.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color === 'gold' && g.n > 0) owner.res.gold += 1; },
    }),
    // Cory, 2026-10-15 (balance pass 1, #1): only the top rival pays it, about a third of what any rival paid
    // (both bots read the old card at 8.7 for 4). Ties for the most all count; it's measured before the buy lands.
    m('taxman', 'Tax Collector', 2, 2, 'Whenever the rival with the most followers buys followers, +1 gold.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer === owner) return;
        const before = o => ctx.followers(o) - (o === buyer ? (tier && tier.get) || 0 : 0);
        if (ctx.rivals(owner).every(o => before(o) <= before(buyer))) ctx.gain(owner, 'gold', 1);
      },
    }),
    m('merchant', 'Merchant', 4, 2, 'Whenever anyone recruits a gold member, +1 gold.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && ctx.defOf(recruited).quadrant === 'gold') ctx.gain(owner, 'gold', 1);
      },
    }),
    m('thrift', 'Penny Pincher', 4, 0, 'Gold you spend on members counts double.', { goldPaysDouble: true }),
    m('coinpurse', 'Middleman', 2, 2, 'Whenever you recruit a non-gold member, +1 gold.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'gold') ctx.gain(owner, 'gold', 1);
      },
    }),
    m('underdog', 'Underdog', 4, 2, 'While anyone has more gold than you, your gold gains are doubled.', {
      modifyGain(ctx, owner, card, g) {
        if (g.color === 'gold' && !g.doubled && ctx.state.players.some(o => o !== owner && o.res.gold > owner.res.gold)) {
          g.n *= 2; g.doubled = true;
        }
      },
    }),
    m('tinker', 'Tinker', 4, 2, 'Whenever an action gains you another resource, also gain half as much gold (rounded up).', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== 'gold' && g.n > 0) owner.res.gold += Math.ceil(g.n / 2); },
    }),
    m('investor', 'Investor', 4, 2, 'Round start: set aside any of your gold. Round end: it comes back doubled.', {
      onRoundStartLate(ctx, owner, card) {
        const g = owner.res.gold;
        if (!g) return;
        const amounts = [...new Set([0, Math.floor(g / 4), Math.floor(g / 2), Math.floor((3 * g) / 4), g])].filter(x => x >= 0);
        ctx.choose(owner, `Investor: set aside how much gold? (you have ${g})`, amounts.map(x => ({
          id: `amount:${x}`, label: x === 0 ? 'None' : x === g ? `All ${x}` : `${x}`, kind: 'amount', value: x, hint: x === Math.floor(g / 2) ? 1 : 0,
        })), 'gold.invest', { uid: card.uid });
      },
      onRoundEnd(ctx, owner, card) {
        const x = card.invested || 0;
        if (x) { owner.res.gold += 2 * x; card.invested = 0; ctx.log(`${owner.name}'s Investor returns ${2 * x} gold.`); }
      },
      // stolen, swapped, released or traded in: the gold set aside goes back to its owner, not doubled (Cory)
      onLeave(ctx, owner, card) {
        const x = card.invested || 0;
        if (x) { owner.res.gold += x; card.invested = 0; ctx.log(`${owner.name}'s Investor leaves: ${x} gold set aside comes back.`); }
      },
    }),
    m('jackpot', 'Lottery Winner', 6, 4, 'Once per game: gain gold equal to the richest rival’s gold.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const r = Math.max(0, ...ctx.rivals(owner).map(o => o.res.gold));
        ctx.gain(owner, 'gold', r); ctx.log(`${owner.name} used Lottery Winner: +${r} gold.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some(o => o.res.gold >= 4),
    }),
    m('speculator', 'Speculator', 4, 4, 'Once per game: double your gold.', {
      activate: 'game',
      onActivate(ctx, owner) { ctx.gain(owner, 'gold', owner.res.gold); ctx.log(`${owner.name} used Speculator: gold doubled to ${owner.res.gold}.`); },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res.gold >= 6,
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 12 → 6
    m('tycoon', 'Tycoon', 4, 2, 'Game end: +1 follower per 3 gold.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res.gold / 3),
    }),
    m('seed', 'Treasurer', 4, 0, 'When recruited: gain gold equal to your member count.', {
      onRecruited(ctx, owner) { ctx.gain(owner, 'gold', ctx.memberCount(owner)); },
    }),
    m('hustler', 'Hustler', 2, 0, 'When recruited, pick a color. Actions there give you +1 gold per round number.', {
      onRecruited(ctx, owner, card) {
        ctx.choose(owner, 'Hustler: actions in which color give you extra gold?', ctx.state.quadrants.map(q => ({
          id: `color:${q}`, label: ctx.quadrant(q).name, kind: 'color', value: q, hint: q === 'gold' ? 1 : 0,
        })), 'gold.hustlerColor', { uid: card.uid });
      },
      afterAction(ctx, owner, card, quadrant) { if (card.color === quadrant) owner.res.gold += ctx.state.round; },
    }),
  ],
};

// Collect Debts: pick one gold at a time (counting what's already picked), then take it all through the shared steal.
function stealStep(ctx, p, data) {
  const left = o => o.res.gold - (data.picked[o.id] || 0);
  const targets = ctx.rivals(p).filter(o => left(o) > 0 && ctx.canSteal(p, o));
  if (data.left > 0 && targets.length) {
    ctx.choose(p, `Collect Debts: take 1 gold from… (${data.left} left)`, targets.map(o => ({
      id: `player:${o.id}`, label: `${o.name} · ${left(o)} gold`, kind: 'player', value: o.id, hint: left(o),
    })), 'gold.steal', data);
    return;
  }
  let got = 0;
  const from = [];
  for (const [id, k] of Object.entries(data.picked)) {
    const v = ctx.player(Number(id));
    const x = ctx.steal(p, v, { take: { gold: k }, give: n => ctx.gain(p, 'gold', n, { fromAction: true }) });
    if (x) { got += x; from.push(`${x} from ${v.name}`); }
  }
  ctx.log(got ? `${p.name} stole ${got} gold (${from.join(', ')}).` : `${p.name} found no gold to steal.`);
}
