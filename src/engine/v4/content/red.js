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
      // Cory, 2026-10-27: replaces Even Swap ("nobody has members initially"). Name and the +2 are Claude's fill-ins.
      key: 'evenswap', ring: 1, name: 'Tryout', text: 'Use the On Recruit effect of a shop member; it stays in the shop. +2 red.', copyDoesIt: true,
      estimate: ctx => 2 + (borrowable(ctx).length ? 2 : 0),
      resolve(ctx, p) {
        ctx.gain(p, 'red', 2, { fromAction: true });
        const list = borrowable(ctx);
        if (!list.length) { ctx.log(`${p.name}: no shop member has an On Recruit effect.`); return; }
        ctx.choose(p, 'Tryout: use which shop member’s On Recruit?', list.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name}: ${c.def.text}`, kind: 'card', value: c.uid, hint: 2 + (c.def.f || 0),
        })), 'red.borrow');
      },
    },
    {
      key: 'turnout', ring: 1, name: 'Gather', text: '+3 red in round I, +4 in round II, +5 in round III.',
      // Cory, 2026-10-25: +1 each round (Hard bot read: mostly a losers' space).
      byRound: { lines: ['+3 red', '+4 red', '+5 red'] },
      estimate: ctx => ctx.state.round + 2,
      resolve(ctx, p) {
        ctx.gain(p, 'red', ctx.state.round + 2, { fromAction: true });
      },
    },
    {
      // Cory, 2026-10-27: "recruit the top member of the deck. each rival gets 1 red". Name and the +2 are Claude's fill-ins.
      key: 'hire', ring: 1, name: 'Walk-In', text: 'Recruit the top member of the deck. Each rival +1 red. +2 red.', copyDoesIt: true,
      estimate: ctx => 2 + (ctx.state.pile.length ? 3 : 0),
      resolve(ctx, p) {
        ctx.gain(p, 'red', 2, { fromAction: true });
        const top = ctx.state.pile[0];
        if (top === undefined) ctx.log(`${p.name}: the deck is empty.`);
        else ctx.recruit(p, top, { free: true, top: true });
        for (const o of ctx.rivals(p)) ctx.gain(o, 'red', 1);
      },
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
      key: 'take', ring: 3, name: 'Recruit a Member', text: 'Recruit a member in the shop costing 8 or less. +1 red.', // the cap (Cory, 2026-10-24: "8 or less")
      estimate: ctx => 1 + Math.max(0, ...ctx.shopCards().filter(c => cost(c) <= 8).map(c => c.def.f + cost(c) * 0.6)),
      resolve(ctx, p) {
        const shop = ctx.shopCards().filter(c => cost(c) <= 8);
        ctx.gain(p, 'red', 1, { fromAction: true });
        if (!shop.length) { ctx.log(`${p.name}: no shop member costs 8 or less.`); return; }
        ctx.choose(p, 'Recruit a Member: which member?', shop.map(c => ({
          id: `card:${c.uid}`, label: `${c.def.name} (${cost(c)})`, kind: 'card', value: c.uid, hint: c.def.f * 1.5 + cost(c),
        })), 'red.takeFree');
      },
    },
  ],

  handlers: {
    borrow(ctx, p, uid) {
      if (!ctx.state.shop.includes(uid)) { ctx.log(`${p.name}: that member left the shop.`); return; }
      ctx.log(`${p.name} uses ${ctx.defOf(uid).name}’s On Recruit; it stays in the shop.`);
      ctx.borrowOnRecruit(p, uid);
    },
    takeFree(ctx, p, uid) { ctx.recruit(p, uid, { free: true }); },
    panelMode(ctx, p, mode, data) {
      if (mode === 'promote' || mode === 'demote') swap(ctx, p, mode, `Panel: ${mode} another member`, data?.excludeUid);
    },
    trade(ctx, p, value, data) {
      if (!Array.isArray(value)) { ctx.log(`${p.name} chose not to swap.`); return; }
      const [a, b] = value;
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
    m('mentor', 'Mentor & Protégé', 5, 3, 'On Recruit: recruit the cheapest member in the shop.', { f: 2, // +1 follower (Cory, 2026-10-25)
      // card: this Mentor, or a Doppelganger copying it (its free pick says so)
      onRecruited(ctx, owner, card) {
        const who = card && card.def && card.def.key === 'doppel' ? 'Doppelganger (as Mentor & Protégé)' : 'Mentor & Protégé';
        if (ctx.shopCards().length) ctx.log(`${owner.name}'s ${who}: the cheapest face-up member comes along free.`);
        hireCheapest(ctx, owner, who);
      },
    }),
    // balance pass 2 (pooled bench, both bots agree; design/eval/balance-pass-2.md): 12 → 6
    m('proselytizer', 'Proselytizer', 3, 3,'Whenever you recruit, +1 follower.', { f: 2, // +1 follower (Cory, 2026-10-25)
      // a recruit is a member or a follower purchase (Cory, 2026-10-21); not its own arrival
      onRecruit(ctx, owner, card, by, what) { if (by === owner && what.member?.uid !== card.uid) owner.bonus += 1; },
    }),
    m('mob', 'Mob', 8, 4, 'Game end: +1 follower per red member.', { f: 5, n: 5,
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
    m('host', 'Host', 2, 2, 'On Recruit: +1 red per 2 members. Round Start: +1 red per 2 members.', { now: true,
      onRoundStart(ctx, owner) { ctx.gain(owner, 'red', Math.floor(ctx.memberCount(owner) / 2)); },
    }),
    m('sponsor', 'Sponsor', 6, 4, 'Your members cost 2 less.', { costReduction: 2 }),
    m('crowd', 'Crowd-Pleaser', 2, 0, 'Whenever you buy followers, +1 red.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer === owner) ctx.gain(owner, 'red', 1); },
    }),
    m('patriarch', 'Patriarch', 3, 2, 'Game end: +1 follower per 2 members.', {
      onGameEnd: (ctx, owner) => Math.floor(ctx.memberCount(owner) / 2),
    }),
    m('recruitbonus', 'Recruit Bonus', 1, 1, 'Whenever one of your members’ "On Recruit" happens, +1 of its color.', { f: 2,
      onRecruitAbility(ctx, owner, card, recruited) { const r = ctx.quadrant(recruited.def.quadrant).resource; if (ctx.state.resources.includes(r)) ctx.gain(owner, r, 1); }, // a guest has no color: nothing
    }),
    m('movementpenalty', 'Movement Penalty', 1, 2, 'When you move a rival’s member out of their cult, they lose 1 follower.', {
      onMoveMember(ctx, owner, card, info) { if (info.from !== owner && ctx.followers(info.from) > 0) info.from.bonus -= 1; },
    }),
    m('panel', 'Panel', 4, 2, 'On Recruit: Promote or Demote another member.', { f: 3, n: 3,
      onRecruited(ctx, owner, card) {
        const options = ['promote', 'demote'].filter(mode => swapPairs(ctx, owner, mode, card.uid).length).map(mode => ({
          id: mode, label: mode === 'promote' ? 'Promote' : 'Demote', kind: 'choice', value: mode,
        }));
        ctx.choose(owner, 'Panel: Promote or Demote?', options, 'red.panelMode', { excludeUid: card.uid });
      },
    }),
    m('loyalists', 'Loyalists', 2, 3, /* Claude's fill-in price 5, was 3 (Cory, 2026-10-22: "too cheap") */ 'Your other members can’t be swapped.', { f: 2, n: 2, blockMemberSwaps: true }),
    // Cory, 2026-10-24: Red's once per game, "swap a rivals with the shop" (equal or greater cost); name and price Claude's fill-in
    m('headhunter', 'Headhunter', 3, 2, 'Once per game: swap a rival’s member with a shop member of equal or greater cost.', {
      activate: 'game',
      onActivate(ctx, owner, card) {
        if (!swapPairs(ctx, owner, 'rival').length) { card.used = false; ctx.log(`${owner.name}'s Headhunter: no rival member to swap.`); return; }
        swap(ctx, owner, 'rival', 'Headhunter: choose a rival’s member and its shop replacement');
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && swapPairs(ctx, owner, 'rival').some(([a]) => cost(a) >= 5),
    }),
    m('reserve', 'Benchwarmer', 1, 0, 'Worth 1 follower.'), // placeholder until Cory designs its hold (then it becomes Seat Saver)
  ],
};

// Tryout's shop members: an On Recruit or round-start effect that doesn't act on the card itself ("swap it",
// "it becomes"), which a member still in the shop can't do.
function borrowable(ctx) {
  return ctx.shopCards().filter(c => (c.def.onRecruited || (c.def.now && (c.def.onRoundStart || c.def.onRoundStartLate))) && !/\bit\b|\bcop(?:y|ies)\b/i.test(c.def.text.replace(/^[^:]*:/, '')));
}
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
  const cult = ctx.state.players.flatMap(owner => (owner === p ? mode !== 'rival' : ctx.canSteal(p, owner, 'member')) ? ctx.membersOf(owner).filter(c => ctx.canSwapMember(c.uid)) : []);
  const shop = ctx.shopCards();
  const out = [];
  const first = mode === 'even' ? [...cult, ...shop] : cult;
  const second = mode === 'even' ? first : shop;
  for (const a of first) for (const b of second) if (a.uid !== b.uid && a.uid !== excludeUid && b.uid !== excludeUid && (mode === 'even' ? cost(a) === cost(b)
    : mode === 'promote' ? cost(b) <= cost(a) + 2 : mode === 'rival' ? cost(b) >= cost(a) : cost(b) <= cost(a) - 2)) out.push([a, b]);
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
  // the swap is yours to skip (Cory, 2026-10-22 playtest: "You shouldnt HAVE to swap")
  })).concat({ id: 'none', label: 'Don’t swap', kind: 'pass', value: null, hint: -99 }), 'red.trade', { mode, excludeUid });
}
