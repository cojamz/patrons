// Gold: hoard it. Most gold at round end takes the ring's followers.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });

export default {
  id: 'gold',
  name: 'Gold',
  resource: 'gold',
  scoring: { label: 'Most gold', score: (ctx, p) => p.res.gold },

  actions: [
    {
      key: 'jv', ring: 1, name: 'Joint Venture', text: '+3 gold, and +1 gold to a player you choose.',
      estimate: () => 3.3,
      resolve(ctx, p) {
        ctx.gain(p, 'gold', 3, { fromAction: true });
        const rivals = ctx.rivals(p);
        ctx.choose(p, 'Joint Venture: give 1 gold to…', rivals.map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: -ctx.followers(o),
        })), 'gold.jvGift');
      },
    },
    {
      key: 'rush', ring: 1, name: 'Rush', text: '+2 gold per round number (2 / 4 / 6).',
      estimate: ctx => 2 * ctx.state.round,
      resolve(ctx, p) { ctx.gain(p, 'gold', 2 * ctx.state.round, { fromAction: true }); },
    },
    {
      key: 'discount', ring: 1, name: 'Discount', text: 'Your next member costs 2 less, off any part of its cost.',
      estimate: ctx => (ctx.shopCards().some(c => c.def.s + c.def.w >= 3) ? 2.4 : 1.2),
      resolve(ctx, p) { p.discount += 2; ctx.log(`${p.name}'s next member costs 2 less.`); },
    },
    {
      key: 'steal', ring: 2, name: 'Steal', text: 'Take 3 gold from players, split however you like.',
      estimate: (ctx, p) => Math.min(3, ctx.rivals(p).reduce((s, o) => s + o.res.gold, 0)) * 1.4,
      resolve(ctx, p) { stealStep(ctx, p, { left: 3, got: 0 }); },
    },
    {
      key: 'windfall', ring: 2, name: 'Windfall', text: '+1 gold per member you have.',
      estimate: (ctx, p) => ctx.memberCount(p),
      resolve(ctx, p) { ctx.gain(p, 'gold', ctx.memberCount(p), { fromAction: true }); },
    },
    {
      key: 'strike', ring: 3, name: 'Strike', text: 'Double your gold.',
      estimate: (ctx, p) => p.res.gold,
      resolve(ctx, p) { ctx.gain(p, 'gold', p.res.gold, { fromAction: true }); },
    },
  ],

  handlers: {
    jvGift(ctx, p, value) {
      const t = ctx.player(value);
      ctx.gain(t, 'gold', 1);
      ctx.log(`${p.name} gave 1 gold to ${t.name}.`);
    },
    steal(ctx, p, value, data) {
      const t = ctx.player(value);
      t.res.gold -= 1;
      stealStep(ctx, p, { left: data.left - 1, got: data.got + 1 });
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
    m('midas', 'Midas', 3, 2, 'Gains from actions come as gold instead. You can switch it off or on when you buy.', {
      toggle: true,
      onRecruited(ctx, owner, card) { card.on = true; },
      // a conversion: runs before every other gain modifier, so "gold gains" sees the converted gain
      convertGain(ctx, owner, card, g) {
        if (card.on !== false && g.fromAction && g.color !== 'gold') g.color = 'gold';
      },
    }),
    m('banker', 'Banker', 2, 1, 'At round start, +3 gold.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, 'gold', 3); },
    }),
    m('prospector', 'Prospector', 2, 1, 'Whenever an action gains you gold, +1 more.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color === 'gold' && g.n > 0) owner.res.gold += 1; },
    }),
    m('taxman', 'Tax Collector', 1, 1, 'Whenever a rival buys followers, +1 gold.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) ctx.gain(owner, 'gold', 1); },
    }),
    m('merchant', 'Merchant', 1, 1, 'Whenever anyone recruits a gold member, +1 gold.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (recruited.uid !== card.uid && ctx.defOf(recruited).quadrant === 'gold') ctx.gain(owner, 'gold', 1);
      },
    }),
    m('thrift', 'Thrift', 2, 0, 'Gold you spend on members counts double.', { goldPaysDouble: true }),
    m('coinpurse', 'Coin Purse', 1, 1, 'Whenever you recruit a non-gold member, +1 gold.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by === owner && recruited.uid !== card.uid && ctx.defOf(recruited).quadrant !== 'gold') ctx.gain(owner, 'gold', 1);
      },
    }),
    m('underdog', 'Underdog', 1, 1, 'While you have the least gold, your gold gains are doubled.', {
      modifyGain(ctx, owner, card, g) {
        if (g.color === 'gold' && !g.doubled && ctx.state.players.every(o => o === owner || owner.res.gold <= o.res.gold)) {
          g.n *= 2; g.doubled = true;
        }
      },
    }),
    m('tinker', 'Tinker', 1, 1, 'Whenever an action gains you 2+ of another resource, +1 gold.', {
      afterGain(ctx, owner, card, g) { if (g.fromAction && g.color !== 'gold' && g.n >= 2) owner.res.gold += 1; },
    }),
    m('investor', 'Investor', 2, 2, 'Round start: set aside any of your gold. Round end: it comes back doubled.', {
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
    }),
    m('jackpot', 'Jackpot', 3, 3, 'Once per game: gain gold equal to the richest rival’s gold.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const r = Math.max(0, ...ctx.rivals(owner).map(o => o.res.gold));
        ctx.gain(owner, 'gold', r); ctx.log(`${owner.name} used Jackpot: +${r} gold.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some(o => o.res.gold >= 4),
    }),
    m('speculator', 'Speculator', 3, 2, 'Once per game: double your gold.', {
      activate: 'game',
      onActivate(ctx, owner) { ctx.gain(owner, 'gold', owner.res.gold); ctx.log(`${owner.name} used Speculator: gold doubled to ${owner.res.gold}.`); },
      botActivate: (ctx, owner) => ctx.state.round === 3 && owner.res.gold >= 6,
    }),
    m('tycoon', 'Tycoon', 3, 1, 'Game end: +1 follower per 3 gold.', {
      onGameEnd: (ctx, owner) => Math.floor(owner.res.gold / 3),
    }),
    m('seed', 'Seed Money', 2, 0, 'When recruited: gain gold equal to your member count.', {
      onRecruited(ctx, owner) { ctx.gain(owner, 'gold', ctx.memberCount(owner)); },
    }),
    m('hustler', 'Hustler', 2, 1, 'When recruited, pick a color. Actions there give you +1 gold.', {
      onRecruited(ctx, owner, card) {
        ctx.choose(owner, 'Hustler: actions in which color give you +1 gold?', ctx.state.quadrants.map(q => ({
          id: `color:${q}`, label: ctx.quadrant(q).name, kind: 'color', value: q, hint: q === 'gold' ? 1 : 0,
        })), 'gold.hustlerColor', { uid: card.uid });
      },
      afterAction(ctx, owner, card, quadrant) { if (card.color === quadrant) owner.res.gold += 1; },
    }),
  ],
};

function stealStep(ctx, p, data) {
  const targets = ctx.rivals(p).filter(o => o.res.gold > 0);
  if (data.left > 0 && targets.length) {
    ctx.choose(p, `Steal: take 1 gold from… (${data.left} left)`, targets.map(o => ({
      id: `player:${o.id}`, label: `${o.name} (${o.res.gold})`, kind: 'player', value: o.id, hint: o.res.gold,
    })), 'gold.steal', data);
    return;
  }
  if (data.got) ctx.gain(p, 'gold', data.got, { fromAction: true });
  ctx.log(`${p.name} stole ${data.got} gold.`);
}
