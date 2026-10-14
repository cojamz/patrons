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
    // display: what the score is made of (every screen shows these numbers, never its own count)
    show: (ctx, p) => ({ count: ctx.memberCount(p), tiebreak: ctx.countMembersOfColor(p, 'red') }),
    counts: 'the members you hold (a card that counts as 2 members counts 2)',
    tiebreak: { unit: 'red members', text: 'red members break ties' },
  },

  actions: [
    {
      // the weak twin of Swap Sides, the way Open Door pairs with Open House (Cory: "let's try it")
      key: 'evenswap', ring: 1, name: 'Even Swap', text: '+1 red, and swap one of your members for a rival’s of equal cost.',
      estimate: (ctx, p) => 1 + (swapPairs(ctx, p, sameCost).length ? 1 : 0),
      resolve(ctx, p) {
        ctx.gain(p, 'red', 1, { fromAction: true });
        swap(ctx, p, sameCost, 'Even Swap: give one of yours, get one of theirs of equal cost', `${p.name} had no equal-cost member to swap.`);
      },
    },
    {
      key: 'turnout', ring: 1, name: 'Bandwagon', text: '+1 red per member recruited this round, by anyone.',
      estimate: ctx => ctx.state.recruits,
      resolve(ctx, p) { ctx.gain(p, 'red', ctx.state.recruits, { fromAction: true }); },
    },
    {
      key: 'hire', ring: 1, name: 'Open Door', text: 'Recruit the cheapest face-up member, free.',
      estimate: ctx => cheapValue(ctx),
      resolve(ctx, p) { hireCheapest(ctx, p); },
    },
    {
      key: 'hireup', ring: 2, name: 'Open House', text: '+2 red, and recruit the cheapest face-up member, free.',
      estimate: ctx => 2 + cheapValue(ctx),
      resolve(ctx, p) { ctx.gain(p, 'red', 2, { fromAction: true }); hireCheapest(ctx, p); },
    },
    {
      key: 'trade', ring: 2, name: 'Swap Sides', text: 'Swap one of your members for another player’s costing no more than yours +2.',
      estimate: (ctx, p) => (swapPairs(ctx, p, upToTwoMore).length ? 2 : 0),
      resolve(ctx, p) { swap(ctx, p, upToTwoMore, 'Swap Sides: give one of yours, get one of theirs', `${p.name} had nothing to trade.`); },
    },
    {
      key: 'take', ring: 3, name: 'Hand-pick', text: 'Take any face-up member, free.',
      estimate: ctx => Math.max(0, ...ctx.shopCards().map(c => c.def.f + cost(c) * 0.6)),
      resolve(ctx, p) {
        const shop = ctx.shopCards();
        if (!shop.length) return;
        ctx.choose(p, 'Hand-pick: which member?', shop.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name} (${cost(c)})`, kind: 'card', value: c.uid, hint: c.def.f * 1.5 + cost(c),
        })), 'red.takeFree');
      },
    },
  ],

  handlers: {
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
      // a copied Hustler works the same color (until its own when-recruited pick below sets one)
      if (target.color !== undefined) self.color = target.color;
      ctx.log(`${p.name}'s Doppelganger copies ${target.def.name}.`);
      // Doppelganger becomes a copy of the member card (Cory): the copied "when recruited" effect fires once, for the
      // copy, and so does a "Now and at round start" member's now part. Named under the copied member, like its other hooks.
      const d = target.def;
      if (d.onRecruited) ctx.asMember(p, d.name, () => d.onRecruited(ctx, p, self));
      if (d.now) for (const hook of ['onRoundStart', 'onRoundStartLate']) if (d[hook]) ctx.asMember(p, d.name, () => d[hook](ctx, p, self));
    },
  },

  members: [
    m('twins', 'Twins', 1, 1, 'Worth 2 followers.', { f: 2 }),
    m('bigfamily', 'Big Family', 2, 2, 'Worth 3 followers.', { f: 3 }),
    m('volunteer', 'Volunteer', 0, 0, 'Free. No effect.'),
    m('intern', 'Intern', 1, 0, 'No effect.'),
    m('mentor', 'Mentor & Protégé', 6, 4, 'When recruited: also take the cheapest face-up member free.', {
      onRecruited(ctx, owner) { if (ctx.shopCards().length) ctx.log(`${owner.name}'s Mentor & Protégé: the cheapest face-up member comes along free.`); hireCheapest(ctx, owner); },
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
    m('drive', 'Pied Piper', 2, 2, 'Recruit 2+ members in one turn: +2 red.', {
      // pays the moment your second recruit of the turn lands, so the red can still be spent this turn
      onAnyRecruit(ctx, owner, card, by) {
        // your own turn only: a recruit on someone else's turn (Poach's free recruit) doesn't count toward it
        if (by === owner && ctx.state.current === owner.id && owner.turnRecruits === 2) { ctx.gain(owner, 'red', 2); ctx.log(`${owner.name}'s Pied Piper: +2 red.`); }
      },
    }),
    m('host', 'Host', 4, 2, 'Now and at round start, +1 red per 2 members.', { now: true,
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
    m('reserve', 'Benchwarmer', 1, 0, 'No effect.'), // placeholder until Cory designs its hold (then it becomes Seat Saver)
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
  ctx.choose(p, 'Open Door: which of the cheapest members?', tied.map(c => ({
    id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: c.def.f,
  })), 'red.takeFree');
}
// Swaps (Swap Sides, Even Swap): one of yours for a rival's that `fits` it. A rival whose members can't be taken
// (Bodyguard) is out of reach: a swap takes a member too (decisions.md: Watchdog, now Bodyguard, blocks Trade).
const upToTwoMore = (mine, theirs) => cost(theirs) <= cost(mine) + 2;
const sameCost = (mine, theirs) => cost(theirs) === cost(mine);
function swapPairs(ctx, p, fits) {
  const out = [];
  for (const a of ctx.membersOf(p))
    for (const o of ctx.rivals(p)) {
      if (!ctx.canSteal(p, o, 'member')) continue;
      for (const b of ctx.membersOf(o)) if (fits(a, b)) out.push([a, o, b]);
    }
  return out;
}
function swap(ctx, p, fits, prompt, none) {
  const pairs = swapPairs(ctx, p, fits);
  if (!pairs.length) { ctx.log(none); return; }
  ctx.choose(p, prompt, pairs.map(([a, o, b]) => ({
    id: `trade:${a.uid}:${b.uid}`, label: `${a.def.name} → ${o.name}'s ${b.def.name}`, kind: 'trade',
    value: [a.uid, b.uid], hint: (b.def.f + cost(b)) - (a.def.f + cost(a)),
  })), 'red.trade');
}
