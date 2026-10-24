// Magenta (module id thieves): steal resources and members. Stolen resources keep their colors.
// Every Magenta action grants +1 magenta, including copied actions.
// The ring goes to most magenta resources held at round end.
// Every steal (Magenta's, Gold's Collect Debts, anyone's) goes through the engine's shared ctx.steal(), so Lie Low,
// Bodyguard, Lookout and Robin Hood apply to all of them.
import { registerQuadrant, defById } from './index.js';

const m = (key, name, s, w, text, extra = {}) => ({ key, name, s, w, text, f: 1, n: 1, ...extra });
const cost = c => c.def.s + c.def.w;
const total = p => Object.values(p.res).reduce((a, b) => a + b, 0);
const holding = p => total(p);

// Resource contest; the historical member variant remains available to old analysis scripts only.
export const SCORING = {
  resources: { label: 'Most magenta', counts: 'the magenta you hold when the round ends', score: (ctx, p) => p.res.magenta || 0 },
  members: { label: 'Most Magenta members', counts: 'the magenta members you hold (each card counts its printed member quantity; stolen ones count)', score: (ctx, p) => ctx.countMembersOfColor(p, 'thieves') },
};

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

// Preserve the actual colors removed by the shared steal, before reactions run.
// Only an action's steal is a gain from an action (Midas, Prospector…); a member's steal isn't.
const stash = (ctx, p, took, fromAction = true) => {
  for (const [color, n] of Object.entries(took)) if (n) ctx.gain(p, color, n, { fromAction });
};
// Take `pick` ({ pile: n }) from one victim through the shared steal, and stash it. Returns units taken.
function commit(ctx, thief, victim, pick, reaction = false, fromAction = true, led = undefined) {
  if (!ctx.canSteal(thief, victim)) return 0;
  return ctx.steal(thief, victim, { take: pick, reaction, give: (n, took) => stash(ctx, thief, took, fromAction), ...(led !== undefined ? { led } : {}) });
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

// Interactive steals, one pick per resource. data.each: rival ids still owed 1 each; data.left: picks left in all;
// data.only: the rivals it may take from at all (Redistribute: the richer ones, data.rich). The prompt and the task's count say
// the limit, and blocked names, for each rival you can't take from right now, the true reason (the board dims them).
function stealStep(ctx, p, data) {
  const picked = id => data.picked[id] || {};
  const remaining = o => holding(o) - Object.values(picked(o.id)).reduce((a, n) => a + n, 0);
  const top = data.richest ? Math.max(0, ...ctx.rivals(p).filter(o => stealable(ctx, p, o, picked(o.id)) > 0).map(remaining)) : 0;
  const can = o => stealable(ctx, p, o, picked(o.id)) > 0 && (!data.richest || remaining(o) === top);
  const owed = data.each.map(id => ctx.player(id)).filter(can);
  const free = data.left - owed.length > 0 ? ctx.rivals(p).filter(o => can(o) && (!data.only || data.only.includes(o.id))) : [];
  const pool = data.left > 0 ? (owed.length && data.left <= owed.length ? owed : [...new Set([...owed, ...free])]) : [];
  if (pool.length) {
    const opts = [];
    for (const o of pool) for (const [c, n] of piles(ctx, p, o, picked(o.id))) opts.push({
      id: `take:${o.id}:${c}`, label: `${o.name}'s ${c} (${n})`, kind: 'take', value: [o.id, c],
      hint: n + 0.05 * ctx.followers(o) + (owed.includes(o) ? 5 : 0),
      take: Math.min(data.unit || 1, data.left, n),
    });
    const names = list => list.map(o => o.name).join(', ');
    // the limit, said: "1 each from P3, P4" when the picks left are all owed, else "at least 1 from each of …"
    const owing = !owed.length ? '' : data.left <= owed.length ? `, 1 each from ${names(owed)}` : `, at least 1 from each of ${names(owed)}`;
    const blocked = {};
    for (const o of ctx.rivals(p)) {
      if (pool.includes(o)) continue;
      const why = !ctx.canSteal(p, o) ? `${o.name} can’t be stolen from now.`
        : data.richest && stealable(ctx, p, o, picked(o.id)) > 0 && remaining(o) < top ? `${data.name}: choose a rival holding ${top} resources.`
        : !can(o) ? `${o.name} has nothing left to take.`
        : data.only && !data.only.includes(o.id) ? (data.rich && holding(o) <= holding(p) ? `${o.name} holds no more resources than you (${holding(o)} vs your ${holding(p)}).` : `${data.name} can’t take from ${o.name}.`)
        : data.only && data.picked[o.id] ? `${data.name} takes 1 from each rival, and ${o.name} already gave theirs.`
        : `${data.name}: the ${data.left} left must come 1 each from ${names(owed)}.`;
      blocked[o.id] = why;
    }
    // the count rides on the task, so a reload mid-steal keeps "1 of 3 taken"
    const taken = Object.values(data.picked).reduce((t, pk) => t + Object.values(pk).reduce((a, b) => a + b, 0), 0);
    ctx.choose(p, `${data.name}: choose ${Math.min(data.unit || 1, data.left) === 1 ? 'a resource' : `${Math.min(data.unit || 1, data.left)} resources`} to steal. (${data.left} left${owing})`, opts, 'thieves.take', data, { count: { of: data.left + taken, left: data.left }, blocked });
    return;
  }
  let got = 0;
  const from = [], hit = [];
  // who led when the steal began: a follower one victim's theft wins (Robin Hood) doesn't un-lead the next victim
  const led = new Set(ctx.state.players.filter(o => isLeader(ctx, o)).map(o => o.id));
  for (const [id, pick] of Object.entries(data.picked)) {
    const v = ctx.player(Number(id)), x = commit(ctx, p, v, pick, false, data.fromAction !== false, led.has(v.id));
    // Each pile stays in its original color, including its recap.
    const what = Object.entries(pick).filter(([, k]) => k > 0).map(([c, k]) => `${k} ${c}`).join(' and ');
    if (x) { got += x; hit.push([v, x]); from.push(x === Object.values(pick).reduce((a, b) => a + b, 0) ? `${what} from ${v.name}` : `${x} from ${v.name}`); }
  }
  ctx.log(got ? `${p.name}${data.fromAction === false ? "'s " + data.name : ""} stole ${got} (${from.join(', ')}).` : `${p.name} found nothing to steal.`);
  if (data.followers) {
    p.bonus += data.followers;
    ctx.log(`${p.name}'s ${data.name}: +${data.followers} follower${data.followers === 1 ? '' : 's'}.`);
  }
  // Help Yourself: the followers come from whoever you took from, one at a time, most-robbed first (Cory, Oct 22)
  if (data.stealFollowers) {
    const owe = new Map(), order = hit.sort((a, b) => b[1] - a[1]).map(([v]) => v);
    const room = o => ctx.followers(o) - (owe.get(o) || 0);
    // round robin, so a split steal splits the followers too; nobody goes below 0
    for (let k = data.stealFollowers; k > 0 && order.some(o => room(o) > 0);) {
      for (const o of order) if (k > 0 && room(o) > 0) { owe.set(o, (owe.get(o) || 0) + 1); k--; }
    }
    for (const [v, k] of owe) {
      v.bonus -= k; p.bonus += k;
      ctx.log(`${p.name}'s ${data.name}: took ${k} follower${k === 1 ? '' : 's'} from ${v.name}.`);
    }
  }
}
const startSteal = (ctx, p, name, n, extra = {}) => stealStep(ctx, p, { name, left: n, each: [], picked: {}, unit: 1, ...extra });
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
function halfPiles(ctx, p) {
  return ctx.rivals(p).flatMap(owner => piles(ctx, p, owner).flatMap(([color, held]) => {
    const base = Math.floor(held / 2);
    return base > 0 ? [{ owner, color, n: Math.min(held, ctx.stealCount(p, base)) }] : [];
  }));
}
// The current placement is not an already occupied action. Copies and squatters
// still count the minion that was there before this use; each action counts once.
export function magentaOccupied(ctx, p) {
  // counts the minion you just placed too (Cory, Oct 22)
  const q = ctx.state.quadrants.indexOf('thieves');
  return Object.keys(ctx.state.slots).filter(k => k.startsWith(`${q}-`)).length;
}
// Sticky Fingers on a member's steal (spaces get it through ctx.stealCount, with Desperado's double)
const stickyMore = (ctx, p) => ctx.membersOf(p).reduce((n, c) => n + (typeof c.def.stealMore === 'number' ? c.def.stealMore : 0), 0);
const memberHint = c => c.def.f * 1.5 + cost(c) + (c.def.vanilla || c.used ? 0 : 1);
// What a ransom costs its holder: n from their biggest piles, one at a time ({ color: count }). The prompt names it
// before they answer (card audit #23: the payment was taken without saying which colors, and could cost a lead).
function ransomTake(res, n) {
  const take = {}, left = { ...res };
  for (let k = 0; k < n; k++) {
    const col = Object.keys(left).filter(x => left[x] > 0).sort((a, b) => left[b] - left[a])[0];
    if (!col) break;
    left[col] -= 1; take[col] = (take[col] || 0) + 1;
  }
  return take;
}
const takeWords = take => Object.entries(take).map(([k, x]) => `${x} ${k}`).join(', ');
function pickMember(ctx, p, list, prompt, handler, data = null) {
  ctx.choose(p, prompt, list.map(([o, c]) => ({
    id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid, hint: memberHint(c),
  })), handler, data);
}
// ---------- the quadrant ----------
const thieves = {
  id: 'thieves',
  name: 'Magenta',
  resource: 'magenta',
  rule: 'Stolen resources keep their colors. Every Magenta action gives +1 magenta. Most magenta at round end wins.',
  scoring: SCORING.resources,

  // Lie Low protects both members and resources until round end (Cory, 2026-10-17).
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
      key: 'pickpocket', ring: 1, name: 'Help Yourself', text: 'Steal 1 resource and 1 follower in round I, 2 and 2 in round II, 3 and 3 in round III. +1 magenta.',
      byRound: { lines: ['Steal 1 resource and 1 follower.', 'Steal 2 resources and 2 followers.', 'Steal 3 resources and 3 followers.'], rest: '+1 magenta.' },
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, ctx.state.round)) + ctx.state.round * 1.5,
      resolve(ctx, p) {
        startSteal(ctx, p, 'Help Yourself', ctx.stealCount(p, ctx.state.round, { say: true }), { stealFollowers: ctx.state.round });
      },
    },
    {
      key: 'tipoff', ring: 1, name: 'Redistribute', text: 'Steal 1 resource per Magenta action that has a minion. +1 magenta.',
      estimate: (ctx, p) => estimateSteal(ctx, p, ctx.stealCount(p, magentaOccupied(ctx, p))),
      resolve(ctx, p) { startSteal(ctx, p, 'Redistribute', ctx.stealCount(p, magentaOccupied(ctx, p), { say: true })); },
    },
    {
      key: 'hideout', ring: 1, name: 'Lie Low', text: 'Rivals can’t steal from you this round. +1 magenta.', // no steal: the protection is the strength (Cory, 2026-10-22 playtest: "Lie Low probably shouldnt even steal")
      estimate: (ctx, p) => 1.8 + 0.6 * ctx.state.round,
      resolve(ctx, p) {
        p.hideout = ctx.state.round;
        ctx.log(`${p.name} lies low: safe from thieves until round end.`);
      },
    },
    {
      key: 'rob', ring: 2, name: 'Crime Wave', text: 'Steal half of one rival’s pile of one color, rounded down. +1 magenta.',
      estimate: (ctx, p) => Math.max(0, ...halfPiles(ctx, p).map(({ n }) => n * 1.33)),
      resolve(ctx, p) {
        const list = halfPiles(ctx, p);
        if (!list.length) { ctx.log(`${p.name} found no resource pile worth halving.`); return; }
        ctx.choose(p, 'Crime Wave: choose a pile to halve.', list.map(({ owner, color, n }) => ({
          id: `take:${owner.id}:${color}`, kind: 'take', value: [owner.id, color], target: { pid: owner.id, res: color },
          label: `${owner.name}: steal ${n} ${color}`, take: n, hint: n * 1.33,
        })), 'thieves.halfPile');
      },
    },
    {
      key: 'ransom', ring: 2, name: 'Shake Down', text: 'You choose a rival’s member costing 5 or less. That rival pays you its cost, or you steal it. +1 magenta.',
      estimate: (ctx, p) => {
        const l = takeable(ctx, p, 5).filter(([, c]) => cost(c) > 0);
        return l.length ? Math.max(...l.map(([, c]) => cost(c) * 1.33 + 0.5)) : 0;
      },
      resolve(ctx, p) {
        const list = takeable(ctx, p, 5).filter(([, c]) => cost(c) > 0);
        if (!list.length) { ctx.log(`${p.name} found no one to hold to ransom.`); return; }
        ctx.choose(p, 'Shake Down: choose a member.', list.map(([o, c]) => ({
          id: `card:${c.uid}`, label: `${o.name}'s ${c.def.name} (${cost(c)})`, kind: 'member', value: c.uid,
          hint: memberHint(c) + (total(o) < cost(c) ? 2 : 0),
        })), 'thieves.ransomPick');
      },
    },
    {
      key: 'heist', ring: 3, name: 'Poach', text: 'Steal a rival’s member you choose. +1 magenta.',
      estimate: (ctx, p) => { const l = takeable(ctx, p); return l.length ? Math.max(...l.map(([, c]) => memberHint(c))) : 0; },
      resolve(ctx, p) {
        const list = takeable(ctx, p);
        if (!list.length) { ctx.log(`${p.name} found nothing worth a heist.`); return; }
        pickMember(ctx, p, list, 'Poach: take which member?', 'thieves.heist');
      },
    },
  ],

  handlers: {
    halfPile(ctx, p, [vid, color]) {
      const victim = ctx.player(vid);
      if (!victim || !ctx.canSteal(p, victim)) return;
      const base = Math.floor((victim.res[color] || 0) / 2);
      if (base < 1) return;
      const n = ctx.stealCount(p, base, { say: true });
      const got = commit(ctx, p, victim, { [color]: n });
      ctx.log(`${p.name} stole ${got} ${color} from ${victim.name}.`);
    },
    take(ctx, p, [vid, pile], data) {
      const mine = { ...(data.picked[vid] || {}) };
      const n = Math.min(data.unit || 1, data.left, ctx.player(vid).res[pile] - (mine[pile] || 0));
      mine[pile] = (mine[pile] || 0) + n;
      stealStep(ctx, p, { ...data, left: data.left - n, each: data.each.filter(id => id !== vid), picked: { ...data.picked, [vid]: mine } });
    },
    ransomPick(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid), n = cost(c);
      const can = total(v) >= n, colors = can ? ` (${takeWords(ransomTake(v.res, n))})` : '';
      // can't pay: no question with one answer (skeptic r2: "keep it for 4?" offered only "Let it go"); it just goes
      if (!can) { thieves.handlers.ransomAnswer(ctx, v, 'let', { uid, thief: p.id }); return; }
      const opts = [{ id: 'let', label: `Let ${c.def.name} go`, kind: 'ransom', value: 'let', hint: 0 }];
      if (can) opts.unshift({
        id: 'pay', label: `Pay ${p.name} ${n}${colors} to keep ${c.def.name}`, kind: 'ransom', value: 'pay',
        hint: c.def.f * 2 + (c.def.vanilla || c.used ? 0 : 2) - n + 0.5,
      });
      ctx.choose(v, `Shake Down: pay ${p.name} ${n}${colors} to keep ${c.def.name}?`, opts, 'thieves.ransomAnswer', { uid, thief: p.id });
    },
    ransomAnswer(ctx, v, answer, data) {
      const p = ctx.player(data.thief), c = ctx.card(data.uid), n = cost(c);
      if (answer === 'pay') {
        // paid from their biggest piles, the colors their prompt named; it counts as a steal
        const take = ransomTake(v.res, n);
        // it counts as a steal; under Lie Low (which only stops thieves taking) the holder still pays by choice
        let got = ctx.steal(p, v, { take, give: (x, took) => stash(ctx, p, took) });
        if (!got && !ctx.canSteal(p, v)) {
          for (const [col, x] of Object.entries(take)) v.res[col] -= x;
          got = n; stash(ctx, p, take);
        }
        // whose call it was, what they gave and why that much (blind tester: "+4 or a member" paid +2, unexplained)
        ctx.log(`${v.name} chose to pay ${p.name} ${got} (${takeWords(take)}) to keep ${c.def.name}: its cost is ${n}.`);
      } else {
        const short = total(v) < n;
        ctx.steal(p, v, { uid: data.uid });
        ctx.log(short ? `${v.name} couldn't pay ${n} (held ${total(v)}), so lost ${c.def.name} to ${p.name}.` : `${v.name} chose to let ${c.def.name} go to ${p.name} rather than pay ${n}.`);
      }
    },
    heist(ctx, p, uid) {
      const v = ctx.ownerOf(uid), c = ctx.card(uid);
      if (!ctx.steal(p, v, { uid })) return;
      ctx.log(`${p.name} pulled a heist: ${v.name}'s ${c.def.name}.`);
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
    m('cutpurse', 'Cutpurse', 1, 1, 'Now and at round start: steal 1 resource from the rival with the most resources.', { now: true,
      onRoundStart(ctx, owner) { startSteal(ctx, owner, 'Cutpurse', 1 + stickyMore(ctx, owner), { fromAction: false, richest: true }); },
    }),
    m('mole', 'Mole', 2, 2, 'Now and at round start: steal 1 resource from each rival with more followers than you.', { now: true,
      onRoundStart(ctx, owner) {
        for (const o of ctx.rivals(owner)) if (ctx.followers(o) > ctx.followers(owner)) autoSteal(ctx, owner, o, 'Mole');
      },
    }),
    m('accomplice', 'Accomplice', 4, 4, 'When recruited: steal 1 resource from each rival.', {
      onRecruited(ctx, owner) { for (const o of ctx.rivals(owner)) autoSteal(ctx, owner, o, 'Accomplice'); },
    }),
    m('grifter', 'Grifter', 2, 1, 'When recruited: steal 1 resource per 2 members you have.', {
      // first sentence only (Cory, 2026-10-18): the picks split freely among rivals, like any steal
      onRecruited(ctx, owner) {
        const n = Math.floor(ctx.memberCount(owner) / 2);
        startSteal(ctx, owner, 'Grifter', n + (n > 0 ? stickyMore(ctx, owner) : 0), { fromAction: false });
      },
    }),
    // every steal, a member's too (Cory, 2026-10-22 playtest: "it should proc on member recruits (like grifter)")
    m('sticky', 'Sticky Fingers', 2, 1, 'Your steals take 1 more resource.', { stealMore: 1 }),
    m('desperado', 'Desperado', 2, 2, 'While you have the fewest followers (ties count), double what you steal from spaces, before other bonuses.', {
      stealDouble: (ctx, owner) => fewestFollowers(ctx, owner),
    }),
    m('robinhood', 'Robin Hood', 2, 1, 'Whenever you steal from the player with the most followers, +1 follower.', {
      onSteal(ctx, owner, card, info) {
        if (info.thief === owner && (info.led ?? ledBefore(ctx, info))) { owner.bonus += 1; ctx.log(`${owner.name}'s Robin Hood: +1 follower.`); }
      },
    }),
    m('lookout', 'Lookout', 4, 2, 'Once per round: whenever a rival steals from someone else, steal 1 resource from that rival.', {
      onSteal(ctx, owner, card, info) {
        if (info.reaction || info.thief === owner || info.victim === owner || card.round === ctx.state.round) return;
        if (autoSteal(ctx, owner, info.thief, 'Lookout', 1, true)) card.round = ctx.state.round;
      },
    }),
    m('lightfingers', 'Light Fingers', 4, 4, 'Whenever a rival recruits a member costing 8 or more, steal 1 resource from that rival.', {
      onAnyRecruit(ctx, owner, card, by, recruited) {
        if (by !== owner && cost(recruited) >= 8) autoSteal(ctx, owner, by, 'Light Fingers');
      },
    }),
    // balance pass 1 (bench, both bots agree; design/eval/balance-pass-1.md): 6 → 10
    m('extortionist', 'Extortionist', 3, 1, 'Whenever a rival buys 5 or more followers, steal 2 resources from that rival.', {
      onBuyFollowers(ctx, owner, card, buyer, tier) {
        if (buyer !== owner && tier && tier.get >= 5) autoSteal(ctx, owner, buyer, 'Extortionist', 2);
      },
    }),
    m('watchdog', 'Bodyguard', 5, 3, 'Rivals can’t steal from you.', {
      guardSteal: () => true,
    }),
    m('crew', 'Crew', 1, 1, 'Worth 2 followers.', { f: 2 }),
    m('doubleagent', 'Double Agent', 2, 1, 'When recruited: swap it for a rival’s member you choose.', {
      onRecruited(ctx, owner, card) {
        const list = takeable(ctx, owner).filter(([, c]) => c.uid !== card.uid);
        if (list.length) pickMember(ctx, owner, list, 'Double Agent: swap for which member?', 'thieves.doubleAgent', { uid: card.uid });
      },
    }),
    m('bigscore', 'Safecracker', 2, 2, 'Once per game: steal half the magenta of the rival with the most, rounded down.', {
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
    // Cory's #69 "King of Thieves… based more on members… shouldn't compete with ring competition" (Cory's yes, Oct 21)
    m('kingpin', 'Kingpin', 1, 2, 'Game end: +1 follower per magenta member you have.', {
      onGameEnd: (ctx, owner) => ctx.countMembersOfColor(owner, 'thieves'),
    }),
    // Cory's yes, Oct 21: a counter in Bait's shape, and a weak card for "magenta doesn't gain enough"
    m('snitch', 'Snitch', 2, 1, 'Whenever a rival steals from you, they lose 1 follower.', {
      onSteal(ctx, owner, card, info) {
        if (info.victim !== owner || info.thief === owner || ctx.followers(info.thief) <= 0) return;
        info.thief.bonus -= 1; ctx.log(`${owner.name}'s Snitch: ${info.thief.name} loses 1 follower.`);
      },
    }),
    // Cory's #26 "Steal when you buy a member - should be essential to magenta" (Cory's yes, Oct 21)
    m('shoplifter', 'Shoplifter', 3, 2, 'Whenever you recruit, steal 1 resource.', {
      onRecruit(ctx, owner, card, by, what) {
        if (by === owner && what.member?.uid !== card.uid) startSteal(ctx, owner, 'Shoplifter', 1 + stickyMore(ctx, owner), { fromAction: false });
      },
    }),
    m('fence', 'Fence', 2, 2, 'Whenever you steal, +1 magenta.', {
      onSteal(ctx, owner, card, info) { if (info.thief === owner) ctx.gain(owner, 'magenta', 1); },
    }),
  ],
};

// A copied Magenta action performs its effect afresh, even when the original
// found no victim. Grant the inherent resource once for every traversal.
for (const action of thieves.actions) {
  const resolve = action.resolve, estimate = action.estimate;
  action.copyDoesIt = true;
  action.resolve = (ctx, p) => { ctx.gain(p, 'magenta', 1, { fromAction: true }); return resolve(ctx, p); };
  action.estimate = (ctx, p) => 1 + estimate(ctx, p);
}
export default thieves;

let installed = false;
/** Register Magenta with the engine (tests and scripts call this; index.js is untouched). */
export function install() {
  if (!installed) { registerQuadrant(thieves); installed = true; }
  return thieves;
}
