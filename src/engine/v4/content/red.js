// Red builds and moves members; held red resources decide its round-end contest.
const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;

export default {
  id: 'red',
  name: 'Red',
  resource: 'red',
  scoring: { label: 'Most red', counts: 'the red you hold when the round ends', score: (ctx, p) => p.res.red },

  actions: [
    {
      key: 'evenswap', ring: 1, name: 'Even Swap', text: 'Swap any 2 members of equal cost. +1 red.', copyDoesIt: true,
      estimate: (ctx, p) => 1 + (swapPairs(ctx, p, 'even').length ? 1 : 0),
      resolve(ctx, p) {
        ctx.gain(p, 'red', 1, { fromAction: true });
        swap(ctx, p, 'even', 'Even Swap: choose two equal-cost members');
      },
    },
    {
      key: 'turnout', ring: 1, name: 'Gather', text: '+2 red in round I, +3 in round II, +4 in round III.',
      byRound: { lines: ['+2 red', '+3 red', '+4 red'] },
      estimate: ctx => ctx.state.round + 1,
      resolve(ctx, p) {
        ctx.gain(p, 'red', ctx.state.round + 1, { fromAction: true });
      },
    },
    {
      key: 'hire', ring: 1, name: 'Open Door', text: 'Recruit the cheapest member in the shop. +1 red.',
      estimate: ctx => 1 + cheapValue(ctx),
      resolve(ctx, p) { ctx.gain(p, 'red', 1, { fromAction: true }); hireCheapest(ctx, p, 'Open Door'); },
    },
    {
      key: 'hireup', ring: 2, name: 'Promote', text: 'Swap a member with a shop member costing up to 2 more. +1 red.', copyDoesIt: true,
      estimate: (ctx, p) => 1 + (swapPairs(ctx, p, 'promote').length ? 2 : 0),
      resolve(ctx, p) {
        ctx.gain(p, 'red', 1, { fromAction: true });
        swap(ctx, p, 'promote', 'Promote: choose a member and its shop replacement');
      },
    },
    {
      key: 'trade', ring: 2, name: 'Demote', text: 'Swap a member with a shop member costing at least 2 less. +1 red.', copyDoesIt: true,
      estimate: (ctx, p) => 1 + (swapPairs(ctx, p, 'demote').length ? 2 : 0),
      resolve(ctx, p) { ctx.gain(p, 'red', 1, { fromAction: true }); swap(ctx, p, 'demote', 'Demote: choose a member and its shop replacement'); },
    },
    {
      key: 'take', ring: 3, name: 'Recruit a Member', text: 'Recruit a member in the shop. +1 red.',
      estimate: ctx => 1 + Math.max(0, ...ctx.shopCards().map(c => c.def.f + cost(c) * 0.6)),
      resolve(ctx, p) {
        const shop = ctx.shopCards();
        ctx.gain(p, 'red', 1, { fromAction: true });
        if (!shop.length) return;
        ctx.choose(p, 'Recruit a Member: which member?', shop.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name} (${cost(c)})`, kind: 'card', value: c.uid, hint: c.def.f * 1.5 + cost(c),
        })), 'red.takeFree');
      },
    },
  ],

  handlers: {
    takeFree(ctx, p, uid) { ctx.recruit(p, uid, { free: true }); },
    panelMode(ctx, p, mode, data) {
      if (mode === 'promote' || mode === 'demote') swap(ctx, p, mode, `Panel: ${mode} another member`, data?.excludeUid);
    },
    trade(ctx, p, [a, b], data) {
      // Pinned choices reject a moved card; recheck prices/protection too before applying a queued choice.
      if (!swapPairs(ctx, p, data.mode, data.excludeUid).some(([x, y]) => x.uid === a && y.uid === b)) return;
      const names = [a, b].map(uid => `${ctx.ownerOf(uid)?.name || 'Shop'}'s ${ctx.card(uid).def.name}`);
      if (ctx.swapMembers(p, a, b)) ctx.log(`${p.name} swapped ${names[0]} and ${names[1]}.`);
    },
  },

  members: [
    m('twins', 'Twins', 1, 1, 'Worth 2 followers.', { f: 2, n: 2 }),
    m('bigfamily', 'Big Family', 2, 2, 'Worth 3 followers.', { f: 3 }),
    m('volunteer', 'Volunteer', 0, 0, 'Worth 1 follower.'),
    m('intern', 'Intern', 1, 0, 'Worth 1 follower.'),
    m('mentor', 'Mentor & Protégé', 5, 3, 'When recruited: recruit the cheapest member in the shop.', {
      // card: this Mentor, or a Doppelganger copying it (its free pick says so)
      onRecruited(ctx, owner, card) {
        const who = card && card.def && card.def.key === 'doppel' ? 'Doppelganger (as Mentor & Protégé)' : 'Mentor & Protégé';
        if (ctx.shopCards().length) ctx.log(`${owner.name}'s ${who}: the cheapest face-up member comes along free.`);
        hireCheapest(ctx, owner, who);
      },
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 12 → 6
    m('proselytizer', 'Proselytizer', 3, 3,'Whenever you recruit, +1 follower.', {
      // a recruit is a member or a follower purchase (Cory, 2026-10-21); not its own arrival
      onRecruit(ctx, owner, card, by, what) { if (by === owner && what.member?.uid !== card.uid) owner.bonus += 1; },
    }),
    m('mob', 'Mob', 6, 4, 'Game end: +1 follower per red member.', { f: 5, n: 5,
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'red'),
    }),
    m('recruiter', 'Recruiter', 4, 1, 'Whenever you recruit, +1 red.', {
      onRecruit(ctx, owner, card, by, what) { if (by === owner && what.member?.uid !== card.uid) ctx.gain(owner, 'red', 1); },
    }),
    m('drive', 'Pied Piper', 2, 2, 'Whenever you recruit 2 or more members in one turn, +2 red.', {
      // pays the moment your second recruit of the turn lands, so the red can still be spent this turn
      onAnyRecruit(ctx, owner, card, by, recruited) {
        // your own turn only: a recruit on someone else's turn (Poach's free recruit) doesn't count toward it
        if (by === owner && ctx.state.current === owner.id && owner.turnRecruits >= 2 && owner.turnRecruits - ctx.memberWeight(recruited) < 2) { ctx.gain(owner, 'red', 2); ctx.log(`${owner.name}'s Pied Piper: +2 red.`); }
      },
    }),
    m('host', 'Host', 2, 2, 'Now and at round start: +1 red per 2 members.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, 'red', Math.floor(ctx.memberCount(owner) / 2)); },
    }),
    m('sponsor', 'Sponsor', 6, 4, 'Your members cost 2 less.', { costReduction: 2 }),
    m('crowd', 'Crowd-Pleaser', 2, 0, 'Whenever you buy followers, +1 red.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer === owner) ctx.gain(owner, 'red', 1); },
    }),
    m('patriarch', 'Patriarch', 3, 2, 'Game end: +1 follower per 2 members.', {
      onGameEnd: (ctx, owner) => Math.floor(ctx.memberCount(owner) / 2),
    }),
    m('recruitbonus', 'Recruit Bonus', 1, 1, 'Whenever one of your members’ "When recruited" happens, +1 of its color.', { f: 2,
      onRecruitAbility(ctx, owner, card, recruited) { ctx.gain(owner, ctx.quadrant(recruited.def.quadrant).resource, 1); },
    }),
    m('movementpenalty', 'Movement Penalty', 1, 2, 'When you move a rival’s member out of their cult, they lose 1 follower.', {
      onMoveMember(ctx, owner, card, info) { if (info.from !== owner && ctx.followers(info.from) > 0) info.from.bonus -= 1; },
    }),
    m('panel', 'Panel', 4, 2, 'When recruited: Promote or Demote another member.', { f: 3, n: 3,
      onRecruited(ctx, owner, card) {
        const options = ['promote', 'demote'].filter(mode => swapPairs(ctx, owner, mode, card.uid).length).map(mode => ({
          id: mode, label: mode === 'promote' ? 'Promote' : 'Demote', kind: 'choice', value: mode,
        }));
        ctx.choose(owner, 'Panel: Promote or Demote?', options, 'red.panelMode', { excludeUid: card.uid });
      },
    }),
    m('loyalists', 'Loyalists', 1, 2, 'Your members can’t be swapped.', { f: 2, n: 2, blockMemberSwaps: true }),
    m('reserve', 'Benchwarmer', 1, 0, 'Worth 1 follower.'), // placeholder until Cory designs its hold (then it becomes Seat Saver)
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
// who: the card or space asking, so its choice is titled with its own name (Mentor & Protégé shares this with Open Door)
function hireCheapest(ctx, p, who) {
  const shop = ctx.shopCards();
  if (!shop.length) return;
  const min = Math.min(...shop.map(cost));
  const tied = shop.filter(c => cost(c) === min);
  if (tied.length === 1) { ctx.recruit(p, tied[0].uid, { free: true }); return; }
  ctx.choose(p, `${who}: which of the cheapest members?`, tied.map(c => ({
    id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: c.def.f,
  })), 'red.takeFree');
}
// A swap can rearrange any cult, but taking from a protected rival remains blocked.
function swapPairs(ctx, p, mode, excludeUid = null) {
  const cult = ctx.state.players.flatMap(owner => ctx.canSwapMembers(owner) && (owner === p || ctx.canSteal(p, owner, 'member')) ? ctx.membersOf(owner) : []);
  const shop = ctx.shopCards();
  const out = [];
  const first = mode === 'even' ? [...cult, ...shop] : cult;
  const second = mode === 'even' ? first : shop;
  for (const a of first) for (const b of second) if (a.uid !== b.uid && a.uid !== excludeUid && b.uid !== excludeUid && (mode === 'even' ? cost(a) === cost(b)
    : mode === 'promote' ? cost(b) <= cost(a) + 2 : cost(b) <= cost(a) - 2)) out.push([a, b]);
  return out;
}
function swap(ctx, p, mode, prompt, excludeUid = null) {
  const pairs = swapPairs(ctx, p, mode, excludeUid);
  if (!pairs.length) { ctx.log(`${p.name}: no eligible members to swap.`); return; }
  const source = card => ctx.ownerOf(card.uid)?.name || 'Shop';
  ctx.choose(p, prompt, pairs.map(([a, b]) => ({
    id: `trade:${a.uid}:${b.uid}`, label: `${source(a)}: ${a.def.name} ↔ ${source(b)}: ${b.def.name}`, kind: 'trade',
    value: [a.uid, b.uid], hint: ctx.ownerOf(a.uid) === p ? (b.def.f + cost(b)) - (a.def.f + cost(a))
      : ctx.ownerOf(b.uid) === p ? (a.def.f + cost(a)) - (b.def.f + cost(b)) : 0,
  })), 'red.trade', { mode, excludeUid });
}
