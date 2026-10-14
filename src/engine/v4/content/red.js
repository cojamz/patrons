// Red: quantity over quality. Most members at round end takes the ring's followers; red members break ties.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;

export default {
  id: 'red',
  name: 'Red',
  resource: 'red',
  scoring: {
    label: 'Most members (red members break ties)',
    // red members only break ties, so they weigh less than one whole member
    score: (ctx, p) => ctx.memberCount(p) * 1000 + ctx.countMembersOfColor(p, 'red'),
  },

  actions: [
    {
      key: 'scout', ring: 1, name: 'Scout', text: '+2 red, and put a face-up member at the bottom of the pile.',
      estimate: () => 2.2,
      resolve(ctx, p) {
        ctx.gain(p, 'red', 2, { fromAction: true });
        const shop = ctx.shopCards();
        if (!shop.length) return;
        ctx.choose(p, 'Scout: send which face-up member to the bottom of the pile?', shop.map(c => ({
          id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: cost(c),
        })), 'red.bury');
      },
    },
    {
      key: 'turnout', ring: 1, name: 'Turnout', text: '+1 red per member recruited this round, by anyone.',
      estimate: ctx => ctx.state.recruits,
      resolve(ctx, p) { ctx.gain(p, 'red', ctx.state.recruits, { fromAction: true }); },
    },
    {
      key: 'hire', ring: 1, name: 'Hire', text: 'Recruit the cheapest face-up member, free.',
      estimate: ctx => cheapValue(ctx),
      resolve(ctx, p) { hireCheapest(ctx, p); },
    },
    {
      key: 'hireup', ring: 2, name: 'Hire Up', text: '+2 red, and recruit the cheapest face-up member, free.',
      estimate: ctx => 2 + cheapValue(ctx),
      resolve(ctx, p) { ctx.gain(p, 'red', 2, { fromAction: true }); hireCheapest(ctx, p); },
    },
    {
      key: 'trade', ring: 2, name: 'Trade', text: 'Swap one of your members for another player’s costing no more than yours +2.',
      estimate: (ctx, p) => (tradePairs(ctx, p).length ? 2 : 0),
      resolve(ctx, p) {
        const pairs = tradePairs(ctx, p);
        if (!pairs.length) { ctx.log(`${p.name} had nothing to trade.`); return; }
        ctx.choose(p, 'Trade: give one of yours, get one of theirs', pairs.map(([a, o, b]) => ({
          id: `trade:${a.uid}:${b.uid}`, label: `${a.def.name} → ${o.name}'s ${b.def.name}`, kind: 'trade',
          value: [a.uid, b.uid], hint: (b.def.f + cost(b)) - (a.def.f + cost(a)),
        })), 'red.trade');
      },
    },
    {
      key: 'take', ring: 3, name: 'Take', text: 'Take any face-up member, free.',
      estimate: ctx => Math.max(0, ...ctx.shopCards().map(c => c.def.f + cost(c) * 0.6)),
      resolve(ctx, p) {
        const shop = ctx.shopCards();
        if (!shop.length) return;
        ctx.choose(p, 'Take: which member?', shop.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name} (${cost(c)})`, kind: 'card', value: c.uid, hint: c.def.f * 1.5 + cost(c),
        })), 'red.takeFree');
      },
    },
  ],

  handlers: {
    bury(ctx, p, uid) {
      ctx.buryFromShop(uid);
      ctx.log(`${p.name} sent ${ctx.card(uid).def.name} to the bottom of the pile.`);
    },
    takeFree(ctx, p, uid) { ctx.recruit(p, uid, { free: true }); },
    trade(ctx, p, [mine, theirs]) {
      const other = ctx.ownerOf(theirs);
      ctx.moveMember(mine, p, other);
      ctx.moveMember(theirs, other, p);
      ctx.log(`${p.name} traded ${ctx.card(mine).def.name} for ${other.name}'s ${ctx.card(theirs).def.name}.`);
    },
    doppelCopy(ctx, p, uid, data) {
      const target = ctx.card(uid);
      const self = ctx.card(data.uid);
      self.copy = target.def.id;
      // a copied Hustler works the same color
      if (target.color !== undefined) self.color = target.color;
      ctx.log(`${p.name}'s Doppelganger copies ${target.def.name}.`);
    },
  },

  members: [
    m('twins', 'Twins', 2, 2, 'Worth 2 followers.', { f: 2 }),
    m('bigfamily', 'Big Family', 4, 4, 'Worth 3 followers.', { f: 3 }),
    m('volunteer', 'Volunteer', 0, 0, 'Free. No effect.'),
    m('intern', 'Intern', 2, 0, 'No effect.'),
    m('mentor', 'Mentor & Protégé', 6, 4, 'When recruited: also take the cheapest face-up member free.', {
      onRecruited(ctx, owner) { hireCheapest(ctx, owner); },
    }),
    m('proselytizer', 'Proselytizer', 6, 6, 'Whenever you recruit, +1 follower.', {
      onAnyRecruit(ctx, owner, card, by, recruited) { if (by === owner && recruited.uid !== card.uid) owner.bonus += 1; },
    }),
    m('mob', 'Mob', 4, 4, 'Game end: +1 follower per red member.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'red'),
    }),
    m('recruiter', 'Recruiter', 4, 4, 'Whenever you recruit, +1 red.', {
      onAnyRecruit(ctx, owner, card, by, recruited) { if (by === owner && recruited.uid !== card.uid) ctx.gain(owner, 'red', 1); },
    }),
    m('drive', 'Recruiting Drive', 2, 2, 'Recruit 2+ members in one turn: +2 red.', {
      // pays the moment your second recruit of the turn lands, so the red can still be spent this turn
      onAnyRecruit(ctx, owner, card, by) {
        if (by === owner && owner.turnRecruits === 2) { ctx.gain(owner, 'red', 2); ctx.log(`${owner.name}'s Recruiting Drive: +2 red.`); }
      },
    }),
    m('host', 'Host', 4, 2, 'At round start, +1 red per 2 members.', {
      onRoundStart(ctx, owner) { ctx.gain(owner, 'red', Math.floor(ctx.memberCount(owner) / 2)); },
    }),
    m('sponsor', 'Sponsor', 6, 4, 'Your members cost 2 less.', { costReduction: 2 }),
    m('crowd', 'Crowd-Pleaser', 2, 0, 'Whenever you buy followers, +1 red.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer === owner) ctx.gain(owner, 'red', 1); },
    }),
    m('doppel', 'Doppelganger', 4, 2, 'When recruited: copies the effect of one of your members.', {
      onRecruited(ctx, owner, card) {
        const own = ctx.membersOf(owner).filter(c => c.uid !== card.uid && c.def.key !== 'doppel');
        if (!own.length) return;
        ctx.choose(owner, 'Doppelganger: copy which of your members?', own.map(c => ({
          id: `card:${c.uid}`, label: c.def.name, kind: 'member', value: c.uid,
          hint: ['banker', 'prospector', 'recruiter', 'proselytizer', 'host'].includes(c.def.key) ? 2 : (c.def.vanilla ? 0 : 1),
        })), 'red.doppelCopy', { uid: card.uid });
      },
    }),
    m('patriarch', 'Patriarch', 6, 4, 'Game end: +1 follower per 2 members.', {
      onGameEnd: (ctx, owner) => Math.floor(ctx.memberCount(owner) / 2),
    }),
    m('reserve', 'Reserve', 2, 0, 'No effect.'), // placeholder until Cory designs Reserve
  ],
};

function cheapValue(ctx) {
  const c = cheapest(ctx);
  return c ? c.def.f + cost(c) * 0.8 : 0;
}
function cheapest(ctx) {
  const shop = ctx.shopCards();
  if (!shop.length) return null;
  return shop.reduce((a, b) => (cost(b) < cost(a) ? b : a));
}
function hireCheapest(ctx, p) {
  const shop = ctx.shopCards();
  if (!shop.length) return;
  const min = Math.min(...shop.map(cost));
  const tied = shop.filter(c => cost(c) === min);
  if (tied.length === 1) { ctx.recruit(p, tied[0].uid, { free: true }); return; }
  ctx.choose(p, 'Hire: which of the cheapest members?', tied.map(c => ({
    id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: c.def.f,
  })), 'red.takeFree');
}
function tradePairs(ctx, p) {
  const out = [];
  for (const a of ctx.membersOf(p))
    for (const o of ctx.rivals(p))
      for (const b of ctx.membersOf(o))
        if (cost(b) <= cost(a) + 2) out.push([a, o, b]);
  return out;
}
