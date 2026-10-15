// Magenta (module id 'thieves'): the thieves. Magenta makes nothing of its own: it takes from the table, resources and members.
// Magenta is stolen goods: whatever you steal turns magenta in your supply right away, spendable on your next buy.
// The ring goes to most Magenta members at round end.
// Every steal (Magenta's, Gold's Collect Debts, anyone's) goes through the engine's shared ctx.steal(), so Lie Low,
// Bodyguard, Lookout and Robin Hood apply to all of them.
import { registerQuadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;
const total = p => Object.values(p.res).reduce((a, b) => a + b, 0);
const holding = p => total(p);

// ---------- scoring: most Magenta members (what you hold right now) ----------
// Most Magenta members: a member stolen from a rival counts if it's magenta, so Poach and Shake Down move the ring too.
export const SCORING = { members: { label: 'Most Magenta members', counts: 'the magenta members you hold right now (stolen ones count)', score: (ctx, p) => ctx.countMembersOfColor(p, 'thieves') } };

// ---------- helpers ----------
const fewestFollowers = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) >= ctx.followers(p));
const isLeader = (ctx, p) => ctx.state.players.every(o => ctx.followers(o) <= ctx.followers(p));
// Was the victim the leader when the steal began? A member steal has already moved the card (and its followers).
function ledBefore(ctx, { thief, victim, uid }) {
  if (uid === undefined) return isLeader(ctx, victim);
  const c = ctx.card(uid), f = c.copy ? Math.max(c.def.f, defById(c.copy).f) : c.def.f;
  const before = o => ctx.followers(o) + (o === victim ? f : o === thief ? -f : 0);
  return ctx.state.players.every(o => before(o) <= before(victim));
}
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
// Only an action's steal is a gain from an action (Midas, Prospector…); a member's steal isn't.
const stash = (ctx, p, n, fromAction = true) => { if (n) ctx.gain(p, 'magenta', n, { fromAction }); };
// Take `pick` ({ pile: n }) from one victim through the shared steal, and stash it. Returns units taken.
function commit(ctx, thief, victim, pick, reaction = false, fromAction = true) {
  if (!ctx.canSteal(thief, victim)) return 0;
  return ctx.steal(thief, victim, { take: pick, reaction, give: n => stash(ctx, thief, n, fromAction) });
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
  const got = commit(ctx, thief, victim, pick, reaction, false);
  if (got) ctx.log(`${thief.name}'s ${why}: took ${got} from ${victim.name}.`);
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

  // quadrant-level hooks (engine): Lie Low refuses resource steals (not members: Cory, 2026-10-14); thefts are recorded
  guardSteal: (ctx, thief, victim, kind = 'res') => kind === 'res' && victim.hideout === ctx.state.round,
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
      key: 'pickpocket', ring: 1, name: 'Help Yourself', text: 'Take 2 / 3 / 4 resources (by round) from rivals, split as you like (they arrive as magenta).',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, ctx.state.round + 1)),
      resolve(ctx, p) { startSteal(ctx, p, 'Help Yourself', ctx.stealCount(p, ctx.state.round + 1, { say: true })); },
    },
    {
      key: 'tipoff', ring: 1, name: 'Redistribute', text: 'Take 1 resource from each player holding more than you (they arrive as magenta).',
      estimate: (ctx, p) => estimateSteal(ctx, p, richer(ctx, p).length, richer(ctx, p)),
      resolve(ctx, p) {
        const ids = richer(ctx, p).map(o => o.id);
        const n = ctx.stealCount(p, ids.length, { say: true });
        startSteal(ctx, p, 'Redistribute', n, { each: ids, only: ids });
      },
    },
    {
      key: 'hideout', ring: 1, name: 'Lie Low', text: 'Take 1 resource from a rival (it arrives as magenta). Then no one can steal resources from you this round.',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 1)) + 0.8 + 0.6 * ctx.state.round,
      resolve(ctx, p) {
        p.hideout = ctx.state.round;
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
        startSteal(ctx, p, 'Lie Low', ctx.stealCount(p, 1, { say: true }));
      },
    },
    {
      key: 'rob', ring: 2, name: 'Crime Wave', text: 'Take 3 resources from rivals, at least 1 from each (they arrive as magenta).',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, 3)),
      resolve(ctx, p) { startSteal(ctx, p, 'Crime Wave', ctx.stealCount(p, 3, { say: true }), { each: ctx.rivals(p).map(o => o.id) }); },
    },
    {
      key: 'ransom', ring: 2, name: 'Shake Down', text: 'Pick a rival’s member costing 6 or less. They pay you its cost to keep it (the payment arrives as magenta), or it’s yours.',
      estimate: (ctx, p) => {
        const l = takeable(ctx, p, 6).filter(([, c]) => cost(c) > 0);
        return l.length ? Math.max(...l.map(([, c]) => cost(c) * 1.33 + 0.5)) : 0;
      },
      resolve(ctx, p) {
        const list = takeable(ctx, p, 6).filter(([, c]) => cost(c) > 0);
        if (!list.length) { ctx.log(`${p.name} found no one to hold to ransom.`); return; }
        ctx.choose(p, 'Shake Down: which member?', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid,
          hint: memberHint(c) + (total(o) < cost(c) ? 2 : 0),
        })), 'thieves.ransomPick');
      },
    },
    {
      key: 'heist', ring: 3, name: 'Poach', text: 'Take any rival’s member. They recruit any face-up member costing up to the same, free.',
      estimate: (ctx, p) => { const l = takeable(ctx, p); return l.length ? Math.max(...l.map(([, c]) => memberHint(c))) : 0; },
      resolve(ctx, p) {
        const list = takeable(ctx, p);
        if (!list.length) { ctx.log(`${p.name} found nothing worth a heist.`); return; }
        pickMember(ctx, p, list, 'Poach: take which member?', 'thieves.heist');
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
        // it counts as a steal; under Lie Low (which only stops thieves taking) the holder still pays by choice
        let got = ctx.steal(p, v, { take, give: x => stash(ctx, p, x) });
        if (!got && !ctx.canSteal(p, v)) {
          for (const [col, x] of Object.entries(take)) v.res[col] -= x;
          got = n; stash(ctx, p, n);
        }
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
      ctx.choose(v, `Poach: recruit any face-up member costing up to ${n}, free`, shop.map(x => ({
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
    m('cutpurse', 'Cutpurse', 2, 2, 'Now and at round start, take 1 resource from the rival holding the most (it arrives as magenta).', { now: true,
      onRoundStart(ctx, owner) { const t = richest(ctx, owner); if (t) autoSteal(ctx, owner, t, 'Cutpurse'); },
    }),
    m('mole', 'Mole', 2, 2, 'Now and at round start, take 1 resource from each player with more followers than you (they arrive as magenta).', { now: true,
      onRoundStart(ctx, owner) {
        for (const o of ctx.rivals(owner)) if (ctx.followers(o) > ctx.followers(owner)) autoSteal(ctx, owner, o, 'Mole');
      },
    }),
    m('accomplice', 'Accomplice', 4, 4, 'When recruited: take 1 resource from each rival (they arrive as magenta).', {
      onRecruited(ctx, owner) { for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, 'Accomplice'); },
    }),
    m('grifter', 'Grifter', 4, 2, 'When recruited: take 1 resource per 2 members you have, from the rivals holding the most (they arrive as magenta).', {
      onRecruited(ctx, owner) {
        const n = Math.floor(ctx.memberCount(owner) / 2);
        for (let k = 0; k < n; k++) { const t = richest(ctx, owner); if (!t || !autoSteal(ctx, owner, t, 'Grifter')) break; }
      },
    }),
    m('sticky', 'Sticky Fingers', 4, 4, 'Your steals take 1 more resource.', { stealMore: 1 }),
    m('desperado', 'Desperado', 2, 2, 'While no one has fewer followers than you, your steals take double.', {
      stealDouble: (ctx, owner) => fewestFollowers(ctx, owner),
    }),
    m('robinhood', 'Robin Hood', 2, 2, 'Whenever you steal from the player with the most followers, +1 follower.', {
      onSteal(ctx, owner, card, info) {
        if (info.thief === owner && ledBefore(ctx, info)) { owner.bonus += 1; ctx.log(`${owner.name}'s Robin Hood: +1 follower.`); }
      },
    }),
    m('lookout', 'Lookout', 4, 2, 'Once per round, when a rival steals from someone else, take 1 resource from the thief (it arrives as magenta).', {
      onSteal(ctx, owner, card, info) {
        if (info.reaction || info.thief === owner || info.victim === owner || card.round === ctx.state.round) return;
        if (autoSteal(ctx, owner, info.thief, 'Lookout', 1, true)) card.round = ctx.state.round;
      },
    }),
    m('lightfingers', 'Light Fingers', 4, 4, 'Whenever a rival recruits a member costing 8 or more, take 1 resource from them (it arrives as magenta).', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner && cost(recruited) >= 8) autoSteal(ctx, owner, by, 'Light Fingers');
      },
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 10
    m('extortionist', 'Extortionist', 8, 2, 'Whenever a rival buys 6 or more followers, take 2 resources from them (they arrive as magenta).', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer !== owner && tier && tier.get >= 6) autoSteal(ctx, owner, buyer, 'Extortionist', 2);
      },
    }),
    m('watchdog', 'Bodyguard', 4, 2, 'Rivals can’t take your members.', {
      guardSteal: (ctx, owner, card, thief, kind) => kind === 'member',
    }),
    m('crew', 'Crew', 1, 1, 'Worth 2 followers.', { f: 2 }),
    m('doubleagent', 'Double Agent', 4, 2, 'When recruited: swap it for any rival’s member.', {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (list.length) pickMember(ctx, owner, list, 'Double Agent: swap for which member?', 'thieves.doubleAgent', { uid: card.uid });
      },
    }),
    m('bigscore', 'Safecracker', 2, 2, 'Once per game: take half (rounded down) of the magenta held by the rival with the most magenta.', {
      activate: 'game',
      onActivate(ctx, owner) {
        const list = ctx.rivals(owner).filter(o => ctx.canSteal(owner, o) && (o.res.magenta || 0) >= 2);
        if (!list.length) { ctx.log(`${owner.name}'s Safecracker found no magenta worth taking.`); return; }
        const o = list.reduce((a, b) => (b.res.magenta > a.res.magenta ? b : a));
        const got = commit(ctx, owner, o, { magenta: Math.floor(o.res.magenta / 2) }, false, false);
        ctx.log(`${owner.name}'s Safecracker: ${got} magenta from ${o.name}.`);
      },
      botActivate: (ctx, owner) => ctx.state.round === 3 && ctx.rivals(owner).some(o => ctx.canSteal(owner, o) && (o.res.magenta || 0) >= 4),
    }),
    m('kingpin', 'Kingpin', 2, 0, 'Game end: +1 follower per 2 magenta.', {
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
