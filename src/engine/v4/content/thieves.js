// Black: the thieves. Black makes nothing of its own: it takes from the table, resources and members.
// Black IS loot: it comes (almost) only from stealing. What you steal sits on a visible loot pile in front of
// you; the biggest pile at round end wins; piles can be robbed; at the next round start a pile joins your
// supply as black. Scoring is switchable while Cory decides (setScoring), for the sims.
//
// Prototype notes (engine changes this module would like, see design/spheres/thieves.md):
// - core.js pays a member's colored part from p.res[def.quadrant], assuming quadrant id === resource. Here
//   id 'thieves' ≠ resource 'black', so install() relabels the member defs' quadrant as 'black'.
// - releaseLoot() wants a quadrant-level round-start hook; scripts and tests call it by hand.
// - Only Black's own steals count as stealing; a shared ctx.steal() + onSteal hook would let Gold's Steal count.
import { registerQuadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;
const total = p => Object.values(p.res).reduce((a, b) => a + b, 0);

// ---------- scoring modes (prototype switch; every one measures what players hold) ----------
export const SCORING = {
  loot: { label: 'Most loot', score: (ctx, p) => p.loot || 0 },
  black: { label: 'Most black', score: (ctx, p) => p.res.black || 0 },
  fewest: { label: 'Fewest resources', score: (ctx, p) => 1000 - total(p) },
  others: { label: 'Most members of other colors', score: (ctx, p) => ctx.memberCount(p) - ctx.countMembersOfColor(p, 'black') },
};
let MODE = 'loot';
export function setScoring(mode) {
  if (!SCORING[mode]) throw new Error(`unknown scoring ${mode}`);
  MODE = mode;
  thieves.scoring = { label: SCORING[mode].label, score: SCORING[mode].score };
}
export const scoringMode = () => MODE;

/** Loot mode: at round start every loot pile joins its owner's supply as black (stands in for an engine hook). */
export function releaseLoot(state) {
  for (const p of state.players) if (p.loot) { p.res.black = (p.res.black || 0) + p.loot; p.loot = 0; }
}

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
const locked = (ctx, p) => hooks(ctx, p, 'guardBlack').length > 0;

// What a thief can lift from `o`: each color in their supply, plus their loot pile. Lockbox guards black and loot.
function piles(ctx, o) {
  if (hidden(ctx, o)) return [];
  const lock = locked(ctx, o);
  const out = [];
  for (const c of Object.keys(o.res)) if (o.res[c] > 0 && !(lock && c === 'black')) out.push([c, o.res[c]]);
  if (o.loot > 0 && !lock) out.push(['loot', o.loot]);
  return out;
}
const stealable = (ctx, o) => piles(ctx, o).reduce((s, [, n]) => s + n, 0);
const biggestPile = (ctx, o) => piles(ctx, o).sort((a, b) => b[1] - a[1])[0]?.[0];

// Where stolen goods land: the loot pile (loot scoring), otherwise straight into the supply as black.
function stash(ctx, p, n) {
  if (!n) return;
  if (MODE === 'loot') p.loot = (p.loot || 0) + n;
  else ctx.gain(p, 'black', n, { fromAction: true });
}
// Measurement only: who robbed whom, and where the victim stood.
function record(ctx, thief, victim, kind, n) {
  const s = ctx.state;
  s.thefts = s.thefts || [];
  s.thefts.push({
    r: s.round, m: s.moves, by: thief.id, from: victim.id, kind, n,
    rank: rankOf(ctx, victim), last: fewestFollowers(ctx, victim) && !isLeader(ctx, victim), lead: isLeader(ctx, victim),
  });
}
function lift(ctx, thief, victim, pile) {
  if (pile === 'loot') victim.loot -= 1; else victim.res[pile] -= 1;
  record(ctx, thief, victim, 'res', 1);
}
// After a steal: the thief's Robin Hood; the victims' Safehouse; everyone else's Lookout.
// Reactions (Safehouse, Lookout, Snitch) are steals too, but they never set off further reactions.
function afterSteal(ctx, thief, victims, reaction = false) {
  const vs = [...new Set(victims.map(x => (typeof x === 'number' ? ctx.player(x) : x)))];
  for (const v of vs) for (const [c, d] of hooks(ctx, thief, 'onStealFrom')) d.onStealFrom(ctx, thief, c, v);
  if (reaction) return;
  for (const v of vs) for (const [c, d] of hooks(ctx, v, 'onRobbed')) d.onRobbed(ctx, v, c, thief);
  for (const o of ctx.rivals(thief)) if (!vs.includes(o)) for (const [c, d] of hooks(ctx, o, 'onRivalSteals')) d.onRivalSteals(ctx, o, c, thief);
}
// Extra takes for this thief on a steal (Sticky Fingers +1 each; Desperado doubles).
function stealSize(ctx, p, base) {
  let n = base;
  for (const [, d] of hooks(ctx, p, 'stealMore')) n += d.stealMore;
  if (hooks(ctx, p, 'stealDouble').length && fewestFollowers(ctx, p)) n *= 2;
  return n;
}
// Automatic steal used by members: from the victim's biggest pile.
function autoSteal(ctx, thief, victim, why, n = 1, reaction = false) {
  let got = 0;
  for (let k = 0; k < n; k++) {
    const pile = victim && biggestPile(ctx, victim);
    if (!pile) break;
    lift(ctx, thief, victim, pile); got++;
  }
  if (!got) return 0;
  stash(ctx, thief, got);
  ctx.log(`${why}: ${thief.name} took ${got} from ${victim.name}.`);
  afterSteal(ctx, thief, [victim], reaction);
  return got;
}

// Interactive takes, one choice per resource. data.each: ids still owed 1 each (Rob); then data.left free picks.
function stealStep(ctx, p, data) {
  const owed = (data.each || []).map(id => ctx.player(id)).filter(o => stealable(ctx, o) > 0);
  const pool = owed.length ? owed : data.left > 0 ? ctx.rivals(p).filter(o => stealable(ctx, o) > 0) : [];
  if (pool.length) {
    const opts = [];
    for (const o of pool) for (const [c, n] of piles(ctx, o)) opts.push({
      id: `take:${o.id}:${c}`, label: `${o.name}'s ${c === 'loot' ? 'loot pile' : c} (${n})`, kind: 'take', value: [o.id, c],
      hint: n + (c === 'loot' ? 0.5 : 0) + 0.05 * ctx.followers(o),
    });
    const left = owed.length ? `1 from ${owed.map(o => o.name).join(', ')}` : `${data.left} left`;
    ctx.choose(p, `${data.name}: take 1 resource from… (${left})`, opts, 'thieves.take', { ...data, each: owed.map(o => o.id) });
    return;
  }
  stash(ctx, p, data.got);
  const from = Object.entries(data.from || {}).map(([n, k]) => `${k} from ${n}`).join(', ');
  ctx.log(data.got ? `${p.name} stole ${data.got} (${from}).` : `${p.name} found nothing to steal.`);
  if (data.got) afterSteal(ctx, p, data.victims);
}
const stealEstimate = (ctx, p, n) => Math.min(n, ctx.rivals(p).reduce((s, o) => s + stealable(ctx, o), 0)) * 1.33;

// Members a thief may take: rivals not in hiding, member not guarded by Watchdog.
function takeable(ctx, p, maxCost = Infinity) {
  const out = [];
  for (const o of ctx.rivals(p)) {
    if (hidden(ctx, o) || hooks(ctx, o, 'guardMembers').length) continue;
    for (const c of ctx.membersOf(o)) if (cost(c) <= maxCost) out.push([o, c]);
  }
  return out;
}
const memberHint = c => c.def.f * 1.5 + cost(c) + (c.def.vanilla || c.used ? 0 : 1);
function moveTaken(ctx, thief, victim, uid) {
  ctx.moveMember(uid, victim, thief);
  record(ctx, thief, victim, 'member', 1);
  for (const [c, d] of hooks(ctx, victim, 'onLoseMember')) d.onLoseMember(ctx, victim, c, thief);
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
function pickMember(ctx, p, list, prompt, handler) {
  ctx.choose(p, prompt, list.map(([o, c]) => ({
    id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
  })), handler);
}
// The richest rival(s) by what can be taken from them.
function richest(ctx, p) {
  const list = ctx.rivals(p).filter(o => stealable(ctx, o) > 0);
  if (!list.length) return [];
  const top = Math.max(...list.map(o => stealable(ctx, o)));
  return list.filter(o => stealable(ctx, o) === top);
}

// ---------- the quadrant ----------
const thieves = {
  id: 'thieves',
  name: 'Black',
  resource: 'black',
  scoring: { label: SCORING.loot.label, score: SCORING.loot.score },

  actions: [
    {
      key: 'pickpocket', ring: 1, name: 'Pickpocket', text: 'Take 2 resources in total, from any players.',
      estimate: (ctx, p) => stealEstimate(ctx, p, stealSize(ctx, p, 2)),
      resolve(ctx, p) { stealStep(ctx, p, { name: 'Pickpocket', left: stealSize(ctx, p, 2), got: 0, victims: [] }); },
    },
    {
      key: 'shakedown', ring: 1, name: 'Shakedown', text: 'The rival holding the most gives you 2 resources of their choice.',
      estimate: (ctx, p) => (richest(ctx, p).length ? Math.min(stealSize(ctx, p, 2), stealable(ctx, richest(ctx, p)[0])) * 1.2 : 0),
      resolve(ctx, p) {
        const top = richest(ctx, p);
        if (!top.length) { ctx.log(`${p.name} found no one to shake down.`); return; }
        const n = stealSize(ctx, p, 2);
        if (top.length === 1) { giveStep(ctx, top[0], { thief: p.id, left: n, got: 0 }); return; }
        ctx.choose(p, 'Shakedown: who? (tied for holding the most)', top.map(o => ({
          id: `player:${o.id}`, label: o.name, kind: 'player', value: o.id, hint: ctx.followers(o),
        })), 'thieves.shakedownWho', { n });
      },
    },
    {
      key: 'hideout', ring: 1, name: 'Hideout', text: 'Take 1 resource from any player. Then rivals can’t steal from you this round.',
      estimate: (ctx, p) => stealEstimate(ctx, p, stealSize(ctx, p, 1)) + 1 + 0.5 * ctx.state.round,
      resolve(ctx, p) {
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
        stealStep(ctx, p, { name: 'Hideout', left: stealSize(ctx, p, 1), got: 0, victims: [], hide: true });
        p.hideout = ctx.state.round;
      },
    },
    {
      key: 'rob', ring: 2, name: 'Rob', text: 'Take 1 resource from each rival.',
      estimate: (ctx, p) => stealEstimate(ctx, p, stealSize(ctx, p, ctx.rivals(p).length)),
      resolve(ctx, p) {
        const rivals = ctx.rivals(p);
        stealStep(ctx, p, { name: 'Rob', each: rivals.map(o => o.id), left: stealSize(ctx, p, rivals.length) - rivals.length, got: 0, victims: [] });
      },
    },
    {
      key: 'ransom', ring: 2, name: 'Ransom', text: 'Pick a rival’s member costing 3 or less. They pay you its cost to keep it, or it’s yours.',
      estimate: (ctx, p) => {
        const l = takeable(ctx, p, 3).filter(([, c]) => cost(c) > 0);
        return l.length ? Math.max(...l.map(([, c]) => cost(c) * 1.33 + 0.5)) : 0;
      },
      resolve(ctx, p) {
        const list = takeable(ctx, p, 3).filter(([, c]) => cost(c) > 0);
        if (!list.length) { ctx.log(`${p.name} found no one to hold to ransom.`); return; }
        ctx.choose(p, 'Ransom: which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid,
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
        pickMember(ctx, p, list, 'Heist: take which member?', 'thieves.heist');
      },
    },
  ],

  handlers: {
    take(ctx, p, [vid, pile], data) {
      const v = ctx.player(vid);
      lift(ctx, p, v, pile);
      const owedHere = (data.each || []).includes(vid);
      stealStep(ctx, p, {
        ...data,
        each: (data.each || []).filter(id => id !== vid),
        left: owedHere ? data.left : data.left - 1,
        got: data.got + 1, victims: [...data.victims, vid],
        from: { ...(data.from || {}), [v.name]: ((data.from || {})[v.name] || 0) + 1 },
      });
    },
    shakedownWho(ctx, p, vid, data) { giveStep(ctx, ctx.player(vid), { thief: p.id, left: data.n, got: 0 }); },
    give(ctx, v, pile, data) {
      const p = ctx.player(data.thief);
      lift(ctx, p, v, pile);
      giveStep(ctx, v, { ...data, left: data.left - 1, got: data.got + 1 });
    },
    ransomPick(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost(c);
      const opts = [{ id: 'let', label: `Let ${c.def.name} go`, kind: 'ransom', value: 'let', hint: 0 }];
      if (total(v) >= n) opts.unshift({
        id: 'pay', label: `Pay ${p.name} ${n} to keep ${c.def.name}`, kind: 'ransom', value: 'pay',
        hint: c.def.f * 2 + (c.def.vanilla || c.used ? 0 : 2) - n + 0.5,
      });
      ctx.choose(v, `${p.name} holds your ${c.def.name} to ransom: pay ${n} to keep it?`, opts, 'thieves.ransomAnswer', { uid, thief: p.id });
    },
    ransomAnswer(ctx, v, answer, data) {
      const p = ctx.player(data.thief), c = ctx.card(data.uid), n = cost(c);
      if (answer === 'pay') {
        const spend = {};
        for (let k = 0; k < n; k++) {
          const col = Object.keys(v.res).filter(x => v.res[x] > 0).sort((a, b) => v.res[b] - v.res[a])[0];
          v.res[col] -= 1; spend[col] = (spend[col] || 0) + 1;
        }
        record(ctx, p, v, 'ransom', n);
        stash(ctx, p, n);
        ctx.log(`${v.name} paid ${n} (${Object.entries(spend).map(([k, x]) => `${x} ${k}`).join(', ')}) to keep ${c.def.name}.`);
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
      const v = ctx.ownerOf(uid);
      ctx.moveMember(data.uid, p, v);
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
      onRoundStart(ctx, owner) { const t = richest(ctx, owner)[0]; if (t) autoSteal(ctx, owner, t, 'Cutpurse'); },
    }),
    m('accomplice', 'Accomplice', 2, 1, 'When recruited: take 1 resource from each rival.', {
      onRecruited(ctx, owner) { for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, 'Accomplice'); },
    }),
    m('desperado', 'Desperado', 2, 1, 'While no one has fewer followers than you, your steals take double.', { stealDouble: true }),
    m('sticky', 'Sticky Fingers', 1, 1, 'Your steals take 1 more resource.', { stealMore: 1 }),
    m('robinhood', 'Robin Hood', 2, 1, 'Whenever you steal from the player with the most followers, +1 follower.', {
      onStealFrom(ctx, owner, card, victim) {
        if (isLeader(ctx, victim)) { owner.bonus += 1; ctx.log(`${owner.name}'s Robin Hood: +1 follower.`); }
      },
    }),
    m('safehouse', 'Safehouse', 2, 2, 'Whenever a rival steals from you, take 1 back from them.', {
      onRobbed(ctx, owner, card, thief) { autoSteal(ctx, owner, thief, 'Safehouse', 1, true); },
    }),
    m('lookout', 'Lookout', 2, 2, 'Whenever a rival steals from someone else, take 1 resource from the thief.', {
      onRivalSteals(ctx, owner, card, thief) { autoSteal(ctx, owner, thief, 'Lookout', 1, true); },
    }),
    m('snitch', 'Snitch', 1, 1, 'Whenever a member is taken from you, take 2 resources from the thief.', {
      onLoseMember(ctx, owner, card, thief) { autoSteal(ctx, owner, thief, 'Snitch', 2, true); },
    }),
    m('understudy', 'Understudy', 1, 1, 'Whenever a member is taken from you, recruit the cheapest face-up member, free.', {
      onLoseMember(ctx, owner) { cheapestFree(ctx, owner, 'Understudy'); },
    }),
    m('watchdog', 'Watchdog', 2, 2, 'Rivals can’t take your members.', { guardMembers: true }),
    m('lockbox', 'Lockbox', 1, 0, 'Rivals can’t take your black or your loot.', { guardBlack: true }),
    m('extortionist', 'Extortionist', 2, 1, 'Whenever a rival buys followers, take 1 resource from them.', {
      onBuyFollowers(ctx, owner, card, buyer) { if (buyer !== owner) autoSteal(ctx, owner, buyer, 'Extortionist'); },
    }),
    m('doubleagent', 'Double Agent', 2, 2, 'When recruited: swap it for any rival’s member.', {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (!list.length) return;
        ctx.choose(owner, 'Double Agent: swap for which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
        })), 'thieves.doubleAgent', { uid: card.uid });
      },
    }),
    m('kingpin', 'Kingpin', 2, 1, 'Game end: +1 follower per 2 black (loot counts).', {
      onGameEnd: (ctx, owner) => Math.floor(((owner.res.black || 0) + (owner.loot || 0)) / 2),
    }),
    m('burglar', 'Burglar', 3, 2, 'Once per game: take any rival’s member. They recruit the cheapest face-up member, free.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const list = takeable(ctx, owner);
        if (!list.length) { ctx.log(`${owner.name}'s Burglar found nothing to take.`); return; }
        pickMember(ctx, owner, list, 'Burglar: take which member?', 'thieves.burglar');
      },
      botActivate: (ctx, owner) => ctx.state.round >= 2 && takeable(ctx, owner).some(([, c]) => cost(c) >= 4),
    }),
  ],
};

// Shakedown: the victim hands over one resource at a time, their choice.
function giveStep(ctx, v, data) {
  const p = ctx.player(data.thief);
  const list = data.left > 0 ? piles(ctx, v) : [];
  if (list.length) {
    ctx.choose(v, `${p.name} shakes you down: give 1 resource (${data.left} left)`, list.map(([c, n]) => ({
      id: `give:${c}`, label: `${c === 'loot' ? 'loot pile' : c} (${n})`, kind: 'give', value: c, hint: n - (c === 'loot' ? 2 : 0),
    })), 'thieves.give', data);
    return;
  }
  stash(ctx, p, data.got);
  ctx.log(data.got ? `${v.name} handed ${p.name} ${data.got} (Shakedown).` : `${v.name} had nothing to hand over.`);
  if (data.got) afterSteal(ctx, p, [v]);
}

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
