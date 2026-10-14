// Magenta (module id 'thieves'): the thieves. Magenta makes nothing of its own: it takes from the table, resources and members.
// Magenta is stolen goods: whatever you steal turns magenta in your supply right away, spendable on your next buy.
// The ring goes to most Magenta members at round end.
// Every steal (Magenta's, Gold's Steal, anyone's) goes through the engine's shared ctx.steal(), so Hideout,
// Watchdog, Lookout and Robin Hood apply to all of them.
import { registerQuadrant } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;
const total = p => Object.values(p.res).reduce((a, b) => a + b, 0);
const holding = p => total(p);

// ---------- scoring: most Magenta members (what you hold right now) ----------
// Most Magenta members: a member stolen from a rival counts if it's magenta, so Heist and Ransom move the ring too.
export const SCORING = { members: { label: 'Most Magenta members', score: (ctx, p) => ctx.countMembersOfColor(p, 'thieves') } };

// ---------- helpers ----------
const fewestFollowers = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) >= ctx.followers(p));
const isLeader = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) <= ctx.followers(p));
const rankOf = (ctx, p) => ctx.state.players.filter(o => ctx.followers(o) > ctx.followers(p)).length;

// What a thief could lift from `o` right now, minus what this action already picked: [[pile, n]].
function piles(ctx, thief, o, picked = {}) {
  if (!ctx.canSteal(thief, o)) return [];
  const out = [];
  for (const c of Object.keys(o.res)) { const n = o.res[c] - (picked[c] || 0); if (n > 0) out.push([c, n]); }
  return out;
}
const stealable = (ctx, thief, o, picked) => piles(ctx, thief, o, picked).reduce((s, [, n]) => s + n, 0);

// Stolen goods turn magenta in the thief's supply.
const stash = (ctx, p, n) => { if (n) ctx.gain(p, 'magenta', n, { fromAction: true }); };
// Take `pick` ({ pile: n }) from one victim through the shared steal, and stash it. Returns units taken.
function commit(ctx, thief, victim, pick, reaction = false) {
  if (!ctx.canSteal(thief, victim)) return 0;
  return ctx.steal(thief, victim, { take: pick, reaction, give: n => stash(ctx, thief, n) });
}
// Automatic small steal used by members: from the victim's biggest pile, one at a time.
function autoSteal(ctx, thief, victim, why, n = 1, reaction = false) {
  if (!victim || victim === thief) return 0;
  const pick = {};
  for (let k = 0; k < n; k++) {
    const top = piles(ctx, thief, victim, pick).sort((a, b) => b[1] - a[1])[0];
    if (!top) break;
    pick[top[0]] = (pick[top[0]] || 0) + 1;
  }
  const got = commit(ctx, thief, victim, pick, reaction);
  if (got) ctx.log(`${why}: ${thief.name} took ${got} from ${victim.name}.`);
  return got;
}

// Interactive steals, one pick per resource. data.each: rival ids still owed 1 each; data.left: picks left in all.
function stealStep(ctx, p, data) {
  const picked = id => data.picked[id] || {};
  const can = o => stealable(ctx, p, o, picked(o.id)) > 0;
  const owed = data.each.map(id => ctx.player(id)).filter(can);
  const free = data.left - owed.length > 0 ? ctx.rivals(p).filter(o => can(o) && (!data.only || data.only.includes(o.id))) : [];
  const pool = data.left > 0 ? (owed.length && data.left <= owed.length ? owed : [...new Set([...owed, ...free])]) : [];
  if (pool.length) {
    const opts = [];
    for (const o of pool) for (const [c, n] of piles(ctx, p, o, picked(o.id))) opts.push({
      id: `take:${o.id}:${c}`, label: `${o.name}'s ${c} (${n})`, kind: 'take', value: [o.id, c],
      hint: n + 0.05 * ctx.followers(o) + (owed.includes(o) ? 5 : 0),
    });
    const owing = owed.length ? `, at least 1 from ${owed.map(o => o.name).join(', ')}` : '';
    ctx.choose(p, `${data.name}: take 1 resource (${data.left} left${owing})`, opts, 'thieves.take', data);
    return;
  }
  let got = 0;
  const from = [];
  for (const [id, pick] of Object.entries(data.picked)) {
    const v = ctx.player(Number(id)), x = commit(ctx, p, v, pick);
    if (x) { got += x; from.push(`${x} from ${v.name}`); }
  }
  ctx.log(got ? `${p.name} stole ${got} (${from.join(', ')}).` : `${p.name} found nothing to steal.`);
}
const startSteal = (ctx, p, name, n, extra = {}) => stealStep(ctx, p, { name, left: n, each: [], picked: {}, ...extra });
const estimateSteal = (ctx, p, n, who = ctx.rivals(p)) => Math.min(n, who.reduce((s, o) => s + stealable(ctx, p, o), 0)) * 1.33;

// Members a thief may take.
function takeable(ctx, p, maxCost = Infinity) {
  const out = [];
  for (const o of ctx.rivals(p)) {
    if (!ctx.canSteal(p, o, 'member')) continue;
    for (const c of ctx.membersOf(o)) if (cost(c) <= maxCost) out.push([o, c]);
  }
  return out;
}
const memberHint = c => c.def.f * 1.5 + cost(c) + (c.def.vanilla || c.used ? 0 : 1);
function pickMember(ctx, p, list, prompt, handler, data = null) {
  ctx.choose(p, prompt, list.map(([o, c]) => ({
    id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
  })), handler, data);
}
const richer = (ctx, p) => ctx.rivals(p).filter(o => holding(o) > holding(p));
function richest(ctx, p) {
  const list = ctx.rivals(p).filter(o => stealable(ctx, p, o) > 0);
  if (!list.length) return null;
  return list.reduce((a, b) => (holding(b) > holding(a) ? b : a));
}

// ---------- the quadrant ----------
const thieves = {
  id: 'thieves',
  name: 'Magenta',
  resource: 'magenta',
  rule: 'Whatever you steal turns magenta in your supply, ready to spend. Most Magenta members at round end wins.',
  scoring: SCORING.members,

  // quadrant-level hooks (engine): Hideout refuses steals; thefts are recorded
  guardSteal: (ctx, thief, victim) => victim.hideout === ctx.state.round,
  onSteal(ctx, info) {
    // measurement only: who robbed whom, and where the victim stood
    const s = ctx.state;
    s.thefts = s.thefts || [];
    s.thefts.push({
      r: s.round, m: s.moves, by: info.thief.id, from: info.victim.id, kind: info.uid !== undefined ? 'member' : 'res', n: info.n,
      rank: rankOf(ctx, info.victim), last: fewestFollowers(ctx, info.victim) && !isLeader(ctx, info.victim), lead: isLeader(ctx, info.victim),
    });
  },

  actions: [
    {
      key: 'pickpocket', ring: 1, name: 'Pickpocket', text: 'Take 2 / 3 / 4 resources (by round) from rivals, split as you like.',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, ctx.state.round + 1)),
      resolve(ctx, p) { startSteal(ctx, p, 'Pickpocket', ctx.stealCount(p, ctx.state.round + 1)); },
    },
    {
      key: 'tipoff', ring: 1, name: 'Tip-off', text: 'Take 1 resource from each player holding more than you.',
      estimate: (ctx, p) => estimateSteal(ctx, p, richer(ctx, p).length, richer(ctx, p)),
      resolve(ctx, p) {
        const ids = richer(ctx, p).map(o => o.id);
        const n = ctx.stealCount(p, ids.length);
        startSteal(ctx, p, 'Tip-off', n, { each: ids, only: ids });
      },
    },
    {
      key: 'hideout', ring: 1, name: 'Hideout', text: 'Take 1 resource from a rival. Then no one can steal from you, resources or members, this round.',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 1)) + 0.8 + 0.6 * ctx.state.round,
      resolve(ctx, p) {
        p.hideout = ctx.state.round;
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
        startSteal(ctx, p, 'Hideout', ctx.stealCount(p, 1));
      },
    },
    {
      key: 'rob', ring: 2, name: 'Rob', text: 'Take 3 resources from rivals, at least 1 from each.',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 3)),
      resolve(ctx, p) { startSteal(ctx, p, 'Rob', ctx.stealCount(p, 3), { each: ctx.rivals(p).map(o => o.id) }); },
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
      key: 'heist', ring: 3, name: 'Heist', text: 'Take any rival’s member. They recruit any face-up member costing up to the same, free.',
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
      const mine = { ...(data.picked[vid] || {}) };
      mine[pile] = (mine[pile] || 0) + 1;
      stealStep(ctx, p, { ...data, left: data.left - 1, each: data.each.filter(id => id !== vid), picked: { ...data.picked, [vid]: mine } });
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
        // paid from their biggest piles; it counts as a steal
        const take = {}, left = { ...v.res };
        for (let k = 0; k < n; k++) {
          const col = Object.keys(left).filter(x => left[x] > 0).sort((a, b) => left[b] - left[a])[0];
          left[col] -= 1; take[col] = (take[col] || 0) + 1;
        }
        const got = ctx.steal(p, v, { take, give: x => stash(ctx, p, x) });
        ctx.log(`${v.name} paid ${got} (${Object.entries(take).map(([k, x]) => `${x} ${k}`).join(', ')}) to keep ${c.def.name}.`);
      } else {
        ctx.steal(p, v, { uid: data.uid });
        ctx.log(`${v.name} let ${c.def.name} go to ${p.name}.`);
      }
    },
    heist(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost(c);
      ctx.steal(p, v, { uid });
      ctx.log(`${p.name} pulled a heist: ${v.name}'s ${c.def.name}.`);
      const shop = ctx.shopCards().filter(x => cost(x) <= n);
      if (!shop.length) { ctx.log(`${v.name} finds no face-up member costing ${n} or less.`); return; }
      ctx.choose(v, `Heist: recruit any face-up member costing up to ${n}, free`, shop.map(x => ({
        id: `card:${x.uid}`, label: `${x.def.name} (${cost(x)})`, kind: 'card', value: x.uid, hint: x.def.f * 1.5 + cost(x) + (x.def.vanilla ? 0 : 1),
      })), 'thieves.recruitFree');
    },
    recruitFree(ctx, p, uid) { if (ctx.state.shop.includes(uid)) ctx.recruit(p, uid, { free: true }); },
    doubleAgent(ctx, p, uid, data) {
      const v = ctx.ownerOf(uid);
      if (!ctx.steal(p, v, { uid })) return;
      ctx.moveMember(data.uid, p, v);
      ctx.log(`${p.name}'s Double Agent swaps sides: ${p.name} gets ${v.name}'s ${ctx.card(uid).def.name}.`);
    },
  },

  members: [
    m('cutpurse', 'Cutpurse', 1, 1, 'At round start, take 1 resource from the rival holding the most.', {
      onRoundStart(ctx, owner) { const t = richest(ctx, owner); if (t) autoSteal(ctx, owner, t, 'Cutpurse'); },
    }),
    m('mole', 'Mole', 1, 1, 'At round start, take 1 resource from each player with more followers than you.', {
      onRoundStart(ctx, owner) {
        for (const o of ctx.rivals(owner)) if (ctx.followers(o) > ctx.followers(owner)) autoSteal(ctx, owner, o, 'Mole');
      },
    }),
    m('accomplice', 'Accomplice', 2, 2, 'When recruited: take 1 resource from each rival.', {
      onRecruited(ctx, owner) { for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, 'Accomplice'); },
    }),
    m('grifter', 'Grifter', 2, 1, 'When recruited: take 1 resource per 2 members you have, from the rivals holding the most.', {
      onRecruited(ctx, owner) {
        const n = Math.floor(ctx.memberCount(owner) / 2);
        for (let k = 0; k < n; k++) { const t = richest(ctx, owner); if (!t || !autoSteal(ctx, owner, t, 'Grifter')) break; }
      },
    }),
    m('sticky', 'Sticky Fingers', 2, 2, 'Your steals take 1 more resource.', { stealMore: 1 }),
    m('desperado', 'Desperado', 1, 1, 'While no one has fewer followers than you, your steals take double.', {
      stealDouble: (ctx, owner) => fewestFollowers(ctx, owner),
    }),
    m('robinhood', 'Robin Hood', 1, 1, 'Whenever you steal from the player with the most followers, +1 follower.', {
      onSteal(ctx, owner, card, info) {
        if (info.thief === owner && isLeader(ctx, info.victim)) { owner.bonus += 1; ctx.log(`${owner.name}'s Robin Hood: +1 follower.`); }
      },
    }),
    m('lookout', 'Lookout', 2, 1, 'Once per round, when a rival steals from someone else, take 1 resource from the thief.', {
      onSteal(ctx, owner, card, info) {
        if (info.reaction || info.thief === owner || info.victim === owner || card.round === ctx.state.round) return;
        if (autoSteal(ctx, owner, info.thief, 'Lookout', 1, true)) card.round = ctx.state.round;
      },
    }),
    m('lightfingers', 'Light Fingers', 2, 2, 'Whenever a rival recruits a member costing 4 or more, take 1 resource from them.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner && cost(recruited) >= 4) autoSteal(ctx, owner, by, 'Light Fingers');
      },
    }),
    m('extortionist', 'Extortionist', 2, 1, 'Whenever a rival buys 6 followers, take 2 resources from them.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer !== owner && tier && tier.get === 6) autoSteal(ctx, owner, buyer, 'Extortionist', 2);
      },
    }),
    m('watchdog', 'Watchdog', 2, 1, 'Rivals can’t take your members.', {
      guardSteal: (ctx, owner, card, thief, kind) => kind === 'member',
    }),
    m('crew', 'Crew', 1, 1, 'Worth 2 followers.', { f: 2 }),
    m('doubleagent', 'Double Agent', 2, 1, 'When recruited: swap it for any rival’s member.', {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (list.length) pickMember(ctx, owner, list, 'Double Agent: swap for which member?', 'thieves.doubleAgent', { uid: card.uid });
      },
    }),
    m('bigscore', 'Big Score', 1, 1, 'Once per game: take half (rounded down) of the magenta held by the rival with the most magenta.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const list = ctx.rivals(owner).filter(o => ctx.canSteal(owner, o) && (o.res.magenta || 0) >= 2);
        if (!list.length) { ctx.log(`${owner.name}'s Big Score found no magenta worth taking.`); return; }
        const o = list.reduce((a, b) => (b.res.magenta > a.res.magenta ? b : a));
        const got = commit(ctx, owner, o, { magenta: Math.floor(o.res.magenta / 2) });
        ctx.log(`${owner.name}'s Big Score: ${got} magenta from ${o.name}.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some(o => ctx.canSteal(owner, o) && (o.res.magenta || 0) >= 4),
    }),
    m('kingpin', 'Kingpin', 1, 0, 'Game end: +1 follower per 2 magenta.', {
      onGameEnd: (ctx, owner) => Math.floor((owner.res.magenta || 0) / 2),
    }),
  ],
};

export default thieves;

let installed = false;
/** Register Magenta with the engine (tests and scripts call this; index.js is untouched). */
export function install() {
  if (!installed) { registerQuadrant(thieves); installed = true; }
  return thieves;
}
