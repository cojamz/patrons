// Black: the thieves. You grow by taking from the table: resources and members.
// Everything you steal turns black in your hands. Scoring is switchable while Cory decides (setScoring).
//
// Prototype notes (engine changes this module would like, see design/spheres/thieves.md):
// - core.js pays a member's colored part from p.res[def.quadrant]. That assumes the quadrant id equals its
//   resource. Here id 'thieves' ≠ resource 'black', so install() relabels the member defs' quadrant as 'black'.
//   The real fix is one line in paymentPlan and memberPayOk: use quadrant(def.quadrant).resource.
// - Steals only count (loot, Lookout, Safehouse…) when they come from Black. A shared ctx.steal() with an
//   onSteal hook would let Gold's Steal and the bribe count too.
import { registerQuadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;
const total = p => Object.values(p.res).reduce((a, b) => a + b, 0);

// ---------- scoring modes (prototype switch) ----------
export const SCORING = {
  // what you steal sits in a loot pile in front of you (as black); it can be stolen back; it joins your supply next round
  loot: { label: 'Most loot', text: 'Most loot (your pile of stolen goods).', score: (ctx, p) => p.loot || 0 },
  others: { label: 'Most members of other colors', text: 'Most members that aren’t black.', score: (ctx, p) => ctx.memberCount(p) - ctx.countMembersOfColor(p, 'black') },
  black: { label: 'Most black', text: 'Most black.', score: (ctx, p) => p.res.black || 0 },
  fewest: { label: 'Fewest resources', text: 'Fewest resources (everyone qualifies).', score: (ctx, p) => 1000 - total(p) },
};
let MODE = 'loot';
export function setScoring(mode) {
  if (!SCORING[mode]) throw new Error(`unknown scoring ${mode}`);
  MODE = mode;
  thieves.scoring = { label: SCORING[mode].label, score: SCORING[mode].score };
}
export const scoringMode = () => MODE;

const trophies = (ctx, p) => ctx.membersOf(p).filter(c => c.takenBy === p.id).length;

// ---------- helpers ----------
const effDefs = c => (c.copy ? [c.def, defById(c.copy)] : [c.def]);
function hooks(ctx, p, name) {
  const out = [];
  for (const c of ctx.membersOf(p)) for (const d of effDefs(c)) if (d[name]) out.push([c, d]);
  return out;
}
const hidden = (ctx, p) => p.hideout === ctx.state.round;
const fewestFollowers = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) >= ctx.followers(p));
const isLeader = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) <= ctx.followers(p));
const rankOf = (ctx, p) => ctx.state.players.filter(o => ctx.followers(o) > ctx.followers(p)).length;

// Where stolen goods land: the loot pile in 'loot' scoring, otherwise straight into your supply as black.
function stash(ctx, p, n, fromAction = true) {
  if (!n) return;
  if (MODE === 'loot') p.loot = (p.loot || 0) + n;
  else ctx.gain(p, 'black', n, { fromAction });
}
/** Loot mode: at round start every loot pile joins its owner's supply as black. Needs a quadrant-level
 * round-start hook in core.js; scripts and tests call it by hand for now. */
export function releaseLoot(state) {
  for (const p of state.players) if (p.loot) { p.res.black = (p.res.black || 0) + p.loot; p.loot = 0; }
}
const stealable = o => total(o) + (o.loot || 0);
// Measurement only: who robbed whom, and where the victim stood.
function record(ctx, thief, victim, kind, n) {
  const s = ctx.state;
  s.thefts = s.thefts || [];
  s.thefts.push({
    r: s.round, m: s.moves, by: thief.id, from: victim.id, kind, n,
    rank: rankOf(ctx, victim), last: fewestFollowers(ctx, victim) && !isLeader(ctx, victim), lead: isLeader(ctx, victim),
  });
}
// After a steal from `victims`: victims' Safehouse, everyone's Lookout, the thief's Robin Hood.
function afterSteal(ctx, thief, victims) {
  for (const v of new Set(victims.map(x => (typeof x === 'number' ? ctx.player(x) : x)))) {
    for (const [c, d] of hooks(ctx, v, 'onRobbed')) d.onRobbed(ctx, v, c, thief);
    for (const [c, d] of hooks(ctx, thief, 'onStealFrom')) d.onStealFrom(ctx, thief, c, v);
  }
  for (const o of ctx.rivals(thief)) for (const [c, d] of hooks(ctx, o, 'onRivalSteals')) d.onRivalSteals(ctx, o, c, thief);
}
// How many resources a steal of base n takes for this thief (Sticky Fingers, Desperado).
function stealSize(ctx, p, base) {
  let n = base;
  for (const [, d] of hooks(ctx, p, 'stealMore')) n += d.stealMore;
  if (hooks(ctx, p, 'stealDouble').length && fewestFollowers(ctx, p)) n *= 2;
  return n;
}
const targets = (ctx, p) => ctx.rivals(p).filter(o => !hidden(ctx, o) && stealable(o) > 0);
const biggest = o => Object.keys(o.res).filter(c => o.res[c] > 0).sort((a, b) => o.res[b] - o.res[a])[0];

// Take 1 of victim's `color`, quietly (the caller gains the black and logs).
function lift(ctx, thief, victim, color) {
  if (color === 'loot') victim.loot -= 1; else victim.res[color] -= 1;
  record(ctx, thief, victim, 'res', 1);
}
// Automatic small steal used by members: 1 of the victim's biggest pile.
function autoSteal(ctx, thief, victim, why) {
  if (!victim || hidden(ctx, victim) || !stealable(victim)) return 0;
  const c = (victim.loot || 0) > (victim.res[biggest(victim)] || 0) ? 'loot' : biggest(victim);
  lift(ctx, thief, victim, c);
  stash(ctx, thief, 1, false);
  ctx.log(`${why}: ${thief.name} took 1 ${c} from ${victim.name}.`);
  afterSteal(ctx, thief, [victim]);
  return 1;
}

// Interactive multi-take (Pickpocket, Rob): one choice per resource, split however you like.
function stealStep(ctx, p, data) {
  const list = targets(ctx, p);
  if (data.left > 0 && list.length) {
    const opts = [];
    for (const o of list) {
      for (const c of Object.keys(o.res)) if (o.res[c] > 0)
        opts.push({ id: `take:${o.id}:${c}`, label: `${o.name}'s ${c} (${o.res[c]})`, kind: 'take', value: [o.id, c], hint: o.res[c] + 0.05 * ctx.followers(o) });
      if (o.loot > 0) opts.push({ id: `take:${o.id}:loot`, label: `${o.name}'s loot (${o.loot})`, kind: 'take', value: [o.id, 'loot'], hint: o.loot + 0.5 + 0.05 * ctx.followers(o) });
    }
    ctx.choose(p, `${data.name}: take 1 resource from… (${data.left} left)`, opts, 'thieves.take', data);
    return;
  }
  stash(ctx, p, data.got);
  const from = Object.entries(data.from || {}).map(([n, k]) => `${k} from ${n}`).join(', ');
  ctx.log(data.got ? `${p.name} stole ${data.got} (${from}); it turns black${MODE === 'loot' ? ' on the loot pile' : ''}.` : `${p.name} found nothing to steal.`);
  if (data.got) afterSteal(ctx, p, data.victims);
}

// Members a thief may take: rivals not in hiding, member not guarded by Watchdog.
function takeable(ctx, p, maxCost = Infinity) {
  const out = [];
  for (const o of ctx.rivals(p)) {
    if (hidden(ctx, o) || hooks(ctx, o, 'guardMembers').length) continue;
    for (const c of ctx.membersOf(o)) if (cost(c) <= maxCost) out.push([o, c]);
  }
  return out;
}
const memberHint = c => c.def.f * 1.5 + cost(c) + (c.def.vanilla ? 0 : 1);
function moveTaken(ctx, thief, victim, uid) {
  ctx.moveMember(uid, victim, thief);
  ctx.card(uid).takenBy = thief.id;
  record(ctx, thief, victim, 'member', 1);
  for (const [c, d] of hooks(ctx, victim, 'onLoseMember')) d.onLoseMember(ctx, victim, c);
}
function cheapestFree(ctx, p, why) {
  const shop = ctx.shopCards();
  if (!shop.length) return;
  const min = Math.min(...shop.map(cost));
  const tied = shop.filter(c => cost(c) === min);
  if (tied.length === 1) { ctx.recruit(p, tied[0].uid, { free: true }); return; }
  ctx.choose(p, `${why}: recruit which of the cheapest members, free?`, tied.map(c => ({
    id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: c.def.f,
  })), 'thieves.recruitFree', { why });
}
function bestTakeValue(ctx, p, maxCost) {
  const list = takeable(ctx, p, maxCost);
  return list.length ? Math.max(...list.map(([, c]) => c.def.f + cost(c) * 0.8 + (c.def.vanilla ? 0 : 0.8))) : 0;
}
// Pay a cost from the victim's biggest piles; returns { spend, n } or null if they can't.
function autoPay(p, n) {
  if (total(p) < n) return null;
  const spend = {};
  for (let k = 0; k < n; k++) { const c = biggest(p); p.res[c] -= 1; spend[c] = (spend[c] || 0) + 1; }
  return spend;
}

// ---------- the quadrant ----------
const thieves = {
  id: 'thieves',
  name: 'Black',
  resource: 'black',
  scoring: { label: SCORING.loot.label, score: SCORING.loot.score },

  actions: [
    {
      key: 'pickpocket', ring: 1, name: 'Pickpocket', text: 'Take 2 resources from players, split however you like. They turn black.',
      estimate: (ctx, p) => Math.min(stealSize(ctx, p, 2), targets(ctx, p).reduce((s, o) => s + stealable(o), 0)) * 1.3,
      resolve(ctx, p) { stealStep(ctx, p, { name: 'Pickpocket', left: stealSize(ctx, p, 2), got: 0, victims: [] }); },
    },
    {
      key: 'hideout', ring: 1, name: 'Hideout', text: '+3 black. Rivals can’t steal from you this round.',
      estimate: () => 3.1,
      resolve(ctx, p) {
        ctx.gain(p, 'black', 3, { fromAction: true });
        p.hideout = ctx.state.round;
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
      },
    },
    {
      key: 'lure', ring: 1, name: 'Lure', text: 'Take a rival’s member costing 2 or less. They gain 2 black.',
      estimate: (ctx, p) => bestTakeValue(ctx, p, 2) + 0.3,
      resolve(ctx, p) {
        const list = takeable(ctx, p, 2);
        if (!list.length) { ctx.log(`${p.name} found no one to lure.`); return; }
        ctx.choose(p, 'Lure: take which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
        })), 'thieves.lure');
      },
    },
    {
      key: 'rob', ring: 2, name: 'Rob', text: 'Take 3 resources from players, split however you like. They turn black.',
      estimate: (ctx, p) => Math.min(stealSize(ctx, p, 3), targets(ctx, p).reduce((s, o) => s + stealable(o), 0)) * 1.3,
      resolve(ctx, p) { stealStep(ctx, p, { name: 'Rob', left: stealSize(ctx, p, 3), got: 0, victims: [] }); },
    },
    {
      key: 'ransom', ring: 2, name: 'Ransom', text: 'Pick a rival’s member costing 4 or less. They pay you its cost to keep it, or it’s yours.',
      estimate: (ctx, p) => bestTakeValue(ctx, p, 4),
      resolve(ctx, p) {
        const list = takeable(ctx, p, 4).filter(([, c]) => cost(c) > 0);
        if (!list.length) { ctx.log(`${p.name} found no one to hold to ransom.`); return; }
        ctx.choose(p, 'Ransom: which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid,
          // a good ransom is one they can't pay, or one worth a lot
          hint: memberHint(c) + (total(o) < cost(c) ? 2 : 0),
        })), 'thieves.ransomPick');
      },
    },
    {
      key: 'heist', ring: 3, name: 'Heist', text: 'Take any rival’s member. They recruit the cheapest face-up member, free.',
      estimate: (ctx, p) => { const l = takeable(ctx, p); return l.length ? Math.max(...l.map(([, c]) => memberHint(c))) : 0; },
      resolve(ctx, p) {
        const list = takeable(ctx, p);
        if (!list.length) { ctx.log(`${p.name} found nothing worth a heist.`); return; }
        ctx.choose(p, 'Heist: take which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
        })), 'thieves.heist');
      },
    },
  ],

  handlers: {
    take(ctx, p, [vid, color], data) {
      const v = ctx.player(vid);
      lift(ctx, p, v, color);
      stealStep(ctx, p, {
        ...data, left: data.left - 1, got: data.got + 1, victims: [...data.victims, vid].map(Number),
        from: { ...(data.from || {}), [v.name]: ((data.from || {})[v.name] || 0) + 1 },
      });
    },
    lure(ctx, p, uid) {
      const v = ctx.ownerOf(uid);
      moveTaken(ctx, p, v, uid);
      ctx.gain(v, 'black', 2);
      ctx.log(`${p.name} lured ${v.name}'s ${ctx.card(uid).def.name} away; ${v.name} gains 2 black.`);
      afterSteal(ctx, p, [v]);
    },
    ransomPick(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost(c);
      const opts = [{ id: 'let', label: `Let ${c.def.name} go`, kind: 'ransom', value: 'let', hint: 0 }];
      if (total(v) >= n) opts.unshift({
        id: 'pay', label: `Pay ${p.name} ${n} to keep ${c.def.name}`, kind: 'ransom', value: 'pay',
        // bots keep members whose worth beats the price
        hint: c.def.f * 2 + (c.def.vanilla ? 0 : 2) - n + 0.5,
      });
      ctx.choose(v, `${p.name} holds your ${c.def.name} to ransom: pay ${n} to keep it?`, opts, 'thieves.ransomAnswer', { uid, thief: p.id });
    },
    ransomAnswer(ctx, v, answer, data) {
      const p = ctx.player(data.thief), c = ctx.card(data.uid), n = cost(c);
      if (answer === 'pay') {
        const spend = autoPay(v, n);
        record(ctx, p, v, 'ransom', n);
        stash(ctx, p, n);
        ctx.log(`${v.name} paid ${n} (${Object.entries(spend).map(([k, x]) => `${x} ${k}`).join(', ')}) to keep ${c.def.name}; it turns black for ${p.name}.`);
      } else {
        moveTaken(ctx, p, v, data.uid);
        ctx.log(`${v.name} let ${c.def.name} go to ${p.name}.`);
      }
      afterSteal(ctx, p, [v]);
    },
    heist(ctx, p, uid) {
      const v = ctx.ownerOf(uid);
      moveTaken(ctx, p, v, uid);
      ctx.log(`${p.name} pulled a heist: ${v.name}'s ${ctx.card(uid).def.name}. ${v.name} recruits the cheapest face-up member, free.`);
      afterSteal(ctx, p, [v]);
      cheapestFree(ctx, v, 'Heist');
    },
    recruitFree(ctx, p, uid, data) {
      // two free recruits queued at once (Heist + Understudy) may offer the same card: ask again
      if (!ctx.state.shop.includes(uid)) { cheapestFree(ctx, p, data?.why || 'Free recruit'); return; }
      ctx.recruit(p, uid, { free: true });
    },
    doubleAgent(ctx, p, uid, data) {
      const v = ctx.ownerOf(uid), mine = data.uid;
      ctx.moveMember(mine, p, v);
      moveTaken(ctx, p, v, uid);
      ctx.log(`${p.name}'s Double Agent swaps sides: ${p.name} gets ${v.name}'s ${ctx.card(uid).def.name}.`);
      afterSteal(ctx, p, [v]);
    },
    burglar(ctx, p, uid) {
      const v = ctx.ownerOf(uid);
      moveTaken(ctx, p, v, uid);
      ctx.log(`${p.name}'s Burglar takes ${v.name}'s ${ctx.card(uid).def.name}. ${v.name} recruits the cheapest face-up member, free.`);
      afterSteal(ctx, p, [v]);
      cheapestFree(ctx, v, 'Burglar');
    },
  },

  members: [
    m('cutpurse', 'Cutpurse', 1, 1, 'At round start, take 1 resource from the rival holding the most.', {
      onRoundStart(ctx, owner) {
        const list = ctx.rivals(owner).filter(o => !hidden(ctx, o) && stealable(o) > 0);
        if (!list.length) return;
        const v = list.reduce((a, b) => (stealable(b) > stealable(a) ? b : a));
        autoSteal(ctx, owner, v, 'Cutpurse');
      },
    }),
    m('sticky', 'Sticky Fingers', 2, 1, 'Your steals take 1 more resource.', { stealMore: 1 }),
    m('safehouse', 'Safehouse', 1, 0, 'Whenever a rival steals from you, +2 black.', {
      onRobbed(ctx, owner) { ctx.gain(owner, 'black', 2); ctx.log(`${owner.name}'s Safehouse: +2 black.`); },
    }),
    m('watchdog', 'Watchdog', 1, 0, 'Rivals can’t take your members.', { guardMembers: true }),
    m('robinhood', 'Robin Hood', 1, 1, 'Whenever you steal from the player with the most followers, +1 follower.', {
      onStealFrom(ctx, owner, card, victim) {
        if (isLeader(ctx, victim)) { owner.bonus += 1; ctx.log(`${owner.name}'s Robin Hood: +1 follower.`); }
      },
    }),
    m('desperado', 'Desperado', 1, 1, 'While no one has fewer followers than you, your steals take double.', { stealDouble: true }),
    m('lookout', 'Lookout', 1, 1, 'Whenever a rival steals, +1 black.', {
      onRivalSteals(ctx, owner) { ctx.gain(owner, 'black', 1); },
    }),
    m('accomplice', 'Accomplice', 2, 0, 'When recruited: take 1 resource from each rival.', {
      onRecruited(ctx, owner) { for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, 'Accomplice'); },
    }),
    m('understudy', 'Understudy', 0, 1, 'Whenever a member is taken from you, recruit the cheapest face-up member, free.', {
      onLoseMember(ctx, owner) { cheapestFree(ctx, owner, 'Understudy'); },
    }),
    m('tipster', 'Tipster', 1, 1, 'At round start, +1 black per rival holding more resources than you.', {
      onRoundStart(ctx, owner) {
        const k = ctx.rivals(owner).filter(o => total(o) > total(owner)).length;
        if (k) ctx.gain(owner, 'black', k);
      },
    }),
    m('extortionist', 'Extortionist', 1, 1, 'Whenever a rival buys followers, take 1 resource from them.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) autoSteal(ctx, owner, buyer, 'Extortionist'); },
    }),
    m('doubleagent', 'Double Agent', 3, 2, 'When recruited: swap it for any rival’s member.', {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (!list.length) return;
        ctx.choose(owner, 'Double Agent: swap for which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
        })), 'thieves.doubleAgent', { uid: card.uid });
      },
    }),
    m('burglar', 'Burglar', 2, 2, 'Once per game: take any rival’s member. They recruit the cheapest face-up member, free.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const list = takeable(ctx, owner);
        if (!list.length) { ctx.log(`${owner.name}'s Burglar found nothing to take.`); return; }
        ctx.choose(owner, 'Burglar: take which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
        })), 'thieves.burglar');
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && takeable(ctx, owner).some(([, c]) => cost(c) >= 4),
    }),
    m('kingpin', 'Kingpin', 3, 2, 'Game end: +1 follower per 2 black.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.black || 0) / 2),
    }),
    m('mastermind', 'Mastermind', 3, 2, 'Game end: +2 followers per member you took from a rival.', {
      onGameEnd: (ctx, owner) => 2 * trophies(ctx, owner),
    }),
  ],
};

export default thieves;

let installed = false;
/** Register Black with the engine (tests and scripts call this; index.js is untouched). */
export function install() {
  if (installed) return thieves;
  registerQuadrant(thieves);
  // engine workaround: member colored parts are paid from p.res[def.quadrant]
  for (const d of thieves.members) d.quadrant = 'black';
  installed = true;
  return thieves;
}
