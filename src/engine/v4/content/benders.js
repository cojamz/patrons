// Rule-benders: members that bend a rule instead of paying out (Cory, 2026-10-14). They're guest members: no
// quadrant of their own yet. They're colorless: no sphere counts them, and their whole cost is paid in any colors
// (index.js registerGuests folds the printed colored part into the any part; def.lean is only where it came from).
// They join the shared deck while rules.guests is on, so they can be played and measured.
//
// Most of them are flags the engine reads (core.js, "rule-bending allowances"):
//   squat: true            once per round, place a worker on a rival's taken space
//   extraBuy: true         once per round, a second buy in the same turn
//   anyColorPart: true     pay any member's colored part in any colors
//   pileReach: n           also recruit from the top n of the pile
//   extraWorkers: [I,II,III] extra workers by round (taken after the snake)
//   pickFirst: true        always first in a round's turn order
// Straggler uses the onAllPlaced hook (after the round's last placement, before its contests).
import { registerGuests } from './index.js';
import { extraMinion, spareSpace } from './purple.js';
import { startSteal } from './thieves.js';

// Prices: member-value sim (scripts/v4-member-value.mjs, 4 normal bots, Release off, handed over at round II),
// priced so value ≈ cost + 1.5 at 1.5 per follower, rounded to the even cost grid. See design/rule-benders.md.
const m = (key, name, lean, s, w, text, extra = {}) => ({ key, name, lean, s, w, text, f: 1, n: 1, bends: true, ...extra });

// ---------- Straggler: after the last placement, move one of your workers to an unused space and do it ----------
function openSpaces(ctx) {
  const out = [];
  ctx.state.quadrants.forEach((qid, q) => ctx.quadrant(qid).actions.forEach((a, i) => {
    if (!(a.ring > ctx.state.round || (a.lastRound && ctx.state.round > a.lastRound)) && ctx.state.slots[`${q}-${i}`] === undefined) out.push({ key: `${q}-${i}`, q, i, a });
  }));
  return out;
}
const actionOf = (ctx, key) => { const [q, i] = key.split('-').map(Number); return ctx.quadrant(ctx.state.quadrants[q]).actions[i]; };
const spaceLabel = (ctx, key) => { const q = Number(key.split('-')[0]); return `${actionOf(ctx, key).name} (${ctx.quadrant(ctx.state.quadrants[q]).name})`; };
/** p's workers on the board: { key, joined } (joined = it shares the space through Squatter). */
function myWorkers(ctx, p) {
  const out = [];
  for (const [key, o] of Object.entries(ctx.state.slots)) if (o === p.id) out.push({ key, joined: false });
  for (const [key, list] of Object.entries(ctx.state.squats || {})) if (list.includes(p.id)) out.push({ key, joined: true });
  return out;
}

// The minion that moves is always the owner's last one placed (Cory, 2026-10-15: "it's always last"), so the only
// question is where it goes. Two Straggler moves can be queued at once (two copies, a Doppelganger): each choice is
// re-checked against the board when it resolves, and offered again with fresh options if an earlier move took its space.
function lastWorker(ctx, p) {
  const all = myWorkers(ctx, p), l = p.lastSlot;
  return (l && all.find(w => w.key === l.key && w.joined === !!l.joined)) || all[all.length - 1] || null;
}
function offerFrom(ctx, owner, uid) {
  const from = lastWorker(ctx, owner), to = openSpaces(ctx);
  if (!from || !to.length) return;
  ctx.choose(owner, `Straggler: move your last minion (on ${actionOf(ctx, from.key).name}) to an unused space and do that action?`, [
    ...to.map(t => ({ id: `to:${t.key}`, label: spaceLabel(ctx, t.key), kind: 'slot', value: t.key, hint: t.a.estimate(ctx, owner) })),
    { id: 'no', label: 'Stay put', kind: 'no', value: null, hint: 0.5 },
  ], 'benders.stragglerTo', { uid, from });
}
const stillMine = (ctx, p, w) => (w.joined ? (ctx.state.squats?.[w.key] || []).includes(p.id) : ctx.state.slots[w.key] === p.id);

const cost = c => c.def.s + c.def.w;
// Anarchist's swaps: any two members, in any cult or the shop, costing within 2 of each other; a rival's member only
// where it may be taken (Bodyguard), and never a member that can't be swapped (Loyalists)
function anarchyPairs(ctx, p) {
  const all = [...ctx.state.players.flatMap(o => (o === p || ctx.canSteal(p, o, 'member')) ? ctx.membersOf(o).filter(c => ctx.canSwapMember(c.uid)) : []), ...ctx.shopCards()];
  const out = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], oa = ctx.ownerOf(a.uid), ob = ctx.ownerOf(b.uid);
    if (oa === ob) continue; // two in the same cult or both in the shop: nothing moves
    if (Math.abs(cost(a) - cost(b)) <= 2) out.push([a, b]);
  }
  return out;
}
const worth = c => c.def.f + cost(c);
function gainFor(ctx, p, a, b) {
  const oa = ctx.ownerOf(a.uid), ob = ctx.ownerOf(b.uid);
  return oa === p ? worth(b) - worth(a) : ob === p ? worth(a) - worth(b) : 0;
}
function scoutStep(ctx, p, data) {
  const left = ctx.shopCards().filter(c => data.start.includes(c.uid));
  if (!left.length) return scoutDone(ctx, p, data);
  ctx.choose(p, data.sent.length ? 'Scout: send another to the bottom of the pile, or done' : 'Scout: send which shop members to the bottom of the pile?', [
    ...left.map(c => ({ id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: cost(c) > Object.values(p.res).reduce((x, y) => x + y, 0) ? 1 : -1 })),
    { id: 'done', label: 'Done', kind: 'pass', value: null, hint: 0 },
  ], 'benders.scoutPick', data);
}
function scoutDone(ctx, p, data) {
  if (data.sent.length) ctx.log(`${p.name}'s Scout: sent ${data.sent.join(', ')} to the bottom of the pile.`);
  ctx.refillShop();
}

// Launderers' split: one color at a time, how many of what's left; the last color takes the rest
function launderStep(ctx, p, data) {
  const colors = ctx.state.resources, c = colors[data.i];
  if (data.i >= colors.length - 1 || !data.left) {
    const set = Object.fromEntries(colors.map(x => [x, data.set[x] || 0]));
    if (data.left) set[colors[colors.length - 1]] += data.left;
    for (const x of Object.keys(p.res)) p.res[x] = set[x] || 0;
    ctx.log(`${p.name}'s Launderers: rearranged into ${colors.filter(x => set[x]).map(x => `${set[x]} ${x}`).join(', ')}.`);
    return;
  }
  const rest = colors.slice(data.i + 1);
  const now = p.res[c] || 0;
  ctx.choose(p, `Launderers: how many ${c}? (${data.left} left to place${rest.length === 1 ? `; the rest become ${rest[0]}` : ''})`,
    Array.from({ length: data.left + 1 }, (_, x) => ({ id: `amount:${x}`, label: `${x} ${c}`, kind: 'amount', value: x, hint: -Math.abs(x - now) })),
    'benders.launderAmount', data);
}

const members = [
  // Party Crasher (was Squatter; id kept for old records): Cory, 2026-10-28, Once per game, cheaper; 4 with the +1 wild
  m('squatter', 'Party Crasher', 'thieves', 2, 1, 'Once per game: your next minion can be placed on a space a rival already took.', {
    activate: 'game',
    onActivate(ctx, owner, card) {
      if (owner.crashNext) { card.used = false; return; }
      owner.crashNext = true;
      ctx.log(`${owner.name}'s Party Crasher: the next minion may go on a space a rival took.`);
    },
    botActivate: (ctx, p) => ctx.state.round >= 2 && !p.crashNext,
  }),
  // Big Spender as it printed until Oct 28, never dealt: the fixture for the engine's once-per-round second buy
  m('bigspender1', 'Big Spender', 'gold', 1, 1, 'Once per round: recruit twice in one turn.', { extraBuy: true, retired: true }),
  // Cory, 2026-10-28: back in the deck (it stands in for Blue's recruits), One Time Use, 3
  m('bigspender', 'Big Spender', 'gold', 1, 1, 'Once per game: recruit twice this turn.', {
    activate: 'game',
    onActivate(ctx, owner, card) {
      if (owner.buyTwiceNow) { card.used = false; return; }
      owner.buyTwiceNow = true;
      ctx.log(`${owner.name}'s Big Spender: recruit twice this turn.`);
    },
    onTurnEnd(ctx, owner, card, p) { if (p === owner) delete owner.buyTwiceNow; },
    botActivate: (ctx, p) => !p.buyTwiceNow && ctx.state.round >= 2 && p.turnBuys === 0 && Object.values(p.res).reduce((a, b) => a + b, 0) >= 10,
  }),
  m('freelancer', 'Alchemist', 'yellow', 2, 2, /* Freelancer until Cory renamed it, Oct 28 */ 'You may pay any member’s colored part in any colors.', { anyColorPart: true }),
  m('insider', 'Insider', 'market', 3, 1, 'You may also recruit from the top 3 of the pile.', { pileReach: 3 }),
  // Extra Hand as it printed until Oct 28, never dealt (retired): the tests of extra minions a card grants by round
  // (Poach and swaps moving an unplaced grant, copies, a full board) keep it as their fixture
  m('extrahand3', 'Extra Hand', 'purple', 5, 4, '+1 minion in round III.', { extraWorkers: [0, 0, 1], retired: true }),
  // Cory, 2026-10-28: "probably needs to be a Use Once… it had to have some category, and On Recruit would be broken"
  m('extrahand', 'Extra Hand', 'purple', 5, 4, 'Once per game: +1 minion this round.', { from: 2,
    activate: 'game',
    onActivate(ctx, owner, card) { if (!extraMinion(ctx, owner, 'Extra Hand')) card.used = false; },
    botActivate: ctx => ctx.state.round === 3 && spareSpace(ctx),
  }),
  m('frontrunner', 'Front-runner', 'purple', 2, 0, 'You go first every round.', { pickFirst: true }), // Cory, Oct 21: 5; Oct 27: 4; Oct 28 "could probably be cheaper": 3 with the +1 wild (Claude's price, the floor)
  // Cory's ideas, Oct 21, on this sim branch only. Launderer is simplified for the bots: one color, not any split.
  // Cory, Oct 28: "Launderers, 2 Followers" and "it should let you completely redo all your money… converting a lot at
  // once and being flexible across colors": all into one color in one click, or split color by color
  m('launderer', 'Launderers', null, 0, 4, /* Cory, Oct 27: "closer to 5" with the +1 wild */ 'Worth 2 followers. On Recruit: rearrange your resources into any colors.', { f: 2,
    onRecruited(ctx, owner) {
      const total = Object.values(owner.res).reduce((a, b) => a + b, 0);
      if (!total) return;
      const opts = ctx.state.resources.map(c => {
        const best = Math.max(0, ...ctx.rivals(owner).map(o => o.res[c] || 0));
        return { id: `color:${c}`, label: `All ${total} ${c}`, kind: 'color', value: c, hint: (total > best ? 3 : 0) - best * 0.1 };
      });
      opts.push({ id: 'split', label: 'Split them yourself', kind: 'choice', value: 'split', hint: -1 });
      opts.push({ id: 'keep', label: 'Keep your colors', kind: 'pass', value: null, hint: 0 });
      ctx.choose(owner, `Launderers: pick a color for all ${total}, or split them`, opts, 'benders.launder');
    },
  }),
  // Cory, 2026-10-28: "a 5 cost Saboteur… gives -3 Followers each time it enters somebody's cult (swapped in OR recruited etc)"
  m('saboteur', 'Saboteur', null, 0, 4, 'Whenever this joins your cult, −3 followers.', {
    botValue: 0,
    onJoined(ctx, owner) {
      owner.bonus -= 3;
      ctx.log(`${owner.name}'s Saboteur: −3 followers.`);
    },
  }),
  // Cory, 2026-10-28: Dabblers (Turncoat, then Groupies), 3, "give 2 members, and count as every color"
  m('dabblers', 'Dabblers', null, 0, 2, 'Counts as 2 members of every color.', { n: 2, everyColor: true }),
  // Cory, 2026-10-28: Cheerleader (Champion), 4
  m('cheerleader', 'Cheerleader', null, 0, 3, 'Whenever you win a contest, +1 follower.', {
    onContestWin(ctx, owner) { owner.bonus += 1; ctx.log(`${owner.name}'s Cheerleader: +1 follower.`); },
  }),
  // Cory, 2026-10-28: Anarchist, 7, once per round (it stands in for Red's swaps)
  m('anarchist', 'Anarchist', null, 0, 6, 'Once per round: swap any two members within 2 cost.', {
    activate: 'round',
    onRoundStart(ctx, owner, card) { card.used = false; },
    onActivate(ctx, owner, card) {
      const pairs = anarchyPairs(ctx, owner);
      if (!pairs.length) { card.used = false; ctx.log(`${owner.name}'s Anarchist: no two members within 2 cost to swap.`); return; }
      ctx.log(`${owner.name} uses Anarchist.`);
      const where = c => ctx.ownerOf(c.uid)?.name || 'Shop';
      ctx.choose(owner, 'Anarchist: choose two members within 2 cost to swap', pairs.map(([a, b]) => ({
        id: `trade:${a.uid}:${b.uid}`, label: `${where(a)}: ${a.def.name} ↔ ${where(b)}: ${b.def.name}`, kind: 'trade', value: [a.uid, b.uid],
        hint: gainFor(ctx, owner, a, b),
      })).concat({ id: 'none', label: 'Don’t swap', kind: 'pass', value: null, hint: -99 }), 'benders.anarchy', { uid: card.uid });
    },
    botActivate: (ctx, p) => anarchyPairs(ctx, p).some(([a, b]) => gainFor(ctx, p, a, b) >= 2),
  }),
  // Cory, 2026-10-28: Scout, 4, once per round (it stands in for Blue's shop work)
  m('scout', 'Scout', null, 0, 3, 'Once per round: send any shop members to the bottom of the pile, then refill.', {
    activate: 'round',
    onRoundStart(ctx, owner, card) { card.used = false; },
    onActivate(ctx, owner, card) {
      if (!ctx.state.shop.length) { card.used = false; return; }
      scoutStep(ctx, owner, { start: [...ctx.state.shop], sent: [] });
    },
    botActivate: (ctx, p) => ctx.state.round >= 2 && ctx.shopCards().filter(c => cost(c) > Object.values(p.res).reduce((a, b) => a + b, 0)).length >= 3,
  }),
  // Cory, 2026-10-28: Con Men, 6, counts as 2 members; On Recruit (was One Time Use), split among rivals like Help Yourself
  m('conmen', 'Con Men', null, 0, 5, 'Counts as 2 members. On Recruit: steal 5 resources.', { n: 2,
    onRecruited(ctx, owner) { startSteal(ctx, owner, 'Con Men', 5, { fromAction: false }); },
  }),
  // Cory, 2026-10-28: HR (Archivist), 9, worth 3 (so it counts as 3 members)
  m('hr', 'HR', null, 0, 8, 'Worth 3 followers. Game End: +3 followers per color you have 3 members of.', { f: 3,
    onGameEnd: (ctx, owner) => 3 * ctx.state.quadrants.filter(q => ctx.countMembersOfColor(owner, q) >= 3).length,
  }),
  // Cory, 2026-10-28: the 8 ("use one of your One Time Use members again"), named Coach (Cory, Oct 29)
  m('secondwind', 'Coach', null, 0, 7, 'On Recruit: use one of your used Once per game members again.', {
    onRecruited(ctx, owner) {
      const spent = ctx.membersOf(owner).filter(c => c.used && [c.def, c.copy && ctx.defOf(c.copy)].some(d => d?.activate === 'game'));
      if (!spent.length) { ctx.log(`${owner.name}'s Coach: no used Once per game member.`); return; }
      ctx.choose(owner, 'Coach: which Once per game member can be used again?', spent.map(c => ({
        id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: cost(c),
      })), 'benders.rewind');
    },
  }),
  m('tiebreaker', 'Tiebreaker', null, 0, 3, /* Cory, Oct 28 night: "a little cheaper. 4?": 4 with the +1 wild */ 'Ties you’re in go to you alone.', { tiebreak: true }),
  m('straggler', 'Straggler', 'purple', 6, 1, /* Oct 27, Cory "too cheap": 8 with the +1 wild (Claude's price) */ 'Once per round, after the last minion is placed: you may move your last minion to an open space and take it.', {
    onAllPlaced(ctx, owner, card) {
      if (card.usedRound === ctx.state.round) return;
      offerFrom(ctx, owner, card.uid);
    },
  }),
];

export const handlers = {
  anarchy(ctx, p, value) {
    if (!Array.isArray(value)) { ctx.log(`${p.name} chose not to swap.`); return; }
    const [a, b] = value;
    if (!anarchyPairs(ctx, p).some(([x, y]) => (x.uid === a && y.uid === b) || (x.uid === b && y.uid === a))) return;
    const names = [a, b].map(uid => `${ctx.ownerOf(uid)?.name || 'Shop'}'s ${ctx.card(uid).def.name}`);
    if (ctx.swapMembers(p, a, b)) ctx.log(`${p.name}'s Anarchist swapped ${names[0]} and ${names[1]}.`);
  },
  scoutPick(ctx, p, uid, data) {
    if (uid === null || uid === undefined) return scoutDone(ctx, p, data);
    if (!ctx.state.shop.includes(uid)) return scoutStep(ctx, p, data);
    const i = ctx.state.shop.indexOf(uid);
    ctx.state.shop.splice(i, 1);
    ctx.state.pile.push(uid);
    scoutStep(ctx, p, { ...data, sent: [...data.sent, ctx.card(uid).def.name] });
  },
  rewind(ctx, p, uid) {
    const c = ctx.card(uid);
    if (!p.members.includes(uid) || !c.used) return;
    c.used = false;
    ctx.log(`${p.name}'s Coach: ${c.def.name} can be used again.`);
  },

  stragglerFrom(ctx, p, from, data) {
    if (!from) return;
    if (!stillMine(ctx, p, from)) { offerFrom(ctx, p, data.uid); return; }
    const to = openSpaces(ctx);
    if (!to.length) return;
    ctx.choose(p, 'Straggler: move it to which unused space?', to.map(t => ({
      id: `to:${t.key}`, label: spaceLabel(ctx, t.key), kind: 'slot', value: t.key, hint: t.a.estimate(ctx, p),
    })), 'benders.stragglerTo', { ...data, from });
  },
  stragglerTo(ctx, p, to, data) {
    if (!to) return; // stayed put
    if (!stillMine(ctx, p, data.from) || ctx.state.slots[to] !== undefined) { offerFrom(ctx, p, data.uid); return; }
    const card = ctx.card(data.uid);
    card.usedRound = ctx.state.round;
    const { key, joined } = data.from;
    // the old space's action already happened and stays; only the worker leaves
    if (joined) {
      const list = ctx.state.squats[key];
      list.splice(list.indexOf(p.id), 1);
      if (!list.length) delete ctx.state.squats[key];
    } else delete ctx.state.slots[key];
    ctx.state.slots[to] = p.id;
    p.lastSlot = { key: to, joined: false };
    const [q, i] = to.split('-').map(Number);
    ctx.log(`${p.name}'s Straggler moves a minion from ${actionOf(ctx, key).name} to ${actionOf(ctx, to).name}.`);
    // the engine's own act task: the new space resolves as usual (no buy)
    ctx.state.queue.unshift({ t: 'act', p: p.id, q, i });
  },
  launder(ctx, p, color) {
    if (!color) return;
    const total = Object.values(p.res).reduce((a, b) => a + b, 0);
    if (color === 'split') { launderStep(ctx, p, { total, left: total, i: 0, set: {} }); return; }
    for (const c of Object.keys(p.res)) p.res[c] = 0;
    p.res[color] = total;
    ctx.log(`${p.name}'s Launderers: everything becomes ${color} (${total}).`);
  },
  launderAmount(ctx, p, n, data) {
    const c = ctx.state.resources[data.i];
    launderStep(ctx, p, { ...data, set: { ...data.set, [c]: n }, left: data.left - n, i: data.i + 1 });
  },
};

const group = { id: 'benders', members, handlers };
let installed = false;
export function install() {
  if (installed) return group;
  registerGuests('benders', members, handlers);
  installed = true;
  return group;
}
export default group;
