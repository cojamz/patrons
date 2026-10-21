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

const members = [
  m('squatter', 'Squatter', 'thieves', 5, 2, 'Once per round: place a minion on a space a rival already took.', { squat: true }),
  m('bigspender', 'Big Spender', 'gold', 1, 1, 'Once per round: buy twice in one turn.', { extraBuy: true }),
  m('freelancer', 'Freelancer', 'yellow', 3, 3, 'You may pay any member’s colored part in any colors.', { anyColorPart: true }),
  m('insider', 'Insider', 'market', 3, 1, 'You may also recruit from the top 3 of the pile.', { pileReach: 3 }),
  m('extrahand', 'Extra Hand', 'purple', 6, 3, '+1 minion in round III.', { extraWorkers: [0, 0, 1] }),
  m('frontrunner', 'Front-runner', 'purple', 5, 0, 'You always pick first in a round.', { pickFirst: true }), // Cory, Oct 21: 5
  // Cory's ideas, Oct 21, on this sim branch only. Launderer is simplified for the bots: one color, not any split.
  m('launderer', 'Launderer', null, 0, 6, 'When recruited: turn all your resources into one color you choose.', {
    onRecruited(ctx, owner) {
      const total = Object.values(owner.res).reduce((a, b) => a + b, 0);
      if (!total) return;
      const opts = ctx.state.resources.map(c => {
        const best = Math.max(0, ...ctx.rivals(owner).map(o => o.res[c] || 0));
        return { id: `color:${c}`, label: `All ${c}`, kind: 'color', value: c, hint: (total > best ? 3 : 0) - best * 0.1 };
      });
      opts.push({ id: 'keep', label: 'Keep your colors', kind: 'pass', value: null, hint: 0 });
      ctx.choose(owner, 'Launderer: turn everything into which color?', opts, 'benders.launder');
    },
  }),
  m('tiebreaker', 'Tiebreaker', null, 0, 6, 'Ties you’re in go to you alone.', { tiebreak: true }),
  m('straggler', 'Straggler', 'purple', 4, 1, 'Once per round, after the last minion is placed: your last minion may move to an unused space and do that action.', {
    onAllPlaced(ctx, owner, card) {
      if (card.usedRound === ctx.state.round) return;
      offerFrom(ctx, owner, card.uid);
    },
  }),
];

export const handlers = {
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
    for (const c of Object.keys(p.res)) p.res[c] = 0;
    p.res[color] = total;
    ctx.log(`${p.name}'s Launderer: everything becomes ${color} (${total}).`);
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
