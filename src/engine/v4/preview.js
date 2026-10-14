// "You'd get": what taking a space would do for a player right now, by running it on a copy of the state.
// Display only. The engine's own action runs (with every member hook that reacts), so the preview can't drift
// from the rules. Choices the action asks for (yours or a rival's) are explored as branches and summarized as
// ranges. Nothing hidden leaks: it reports the player's own changes and rivals' totals, never the refilled shop.
import { applyMove, resume, followers } from './core.js';

const NODE_BUDGET = 90; // states explored per preview (a counted pick can branch a lot; extremes are kept)

/**
 * previewSpace(state, pid, q, i) → null when it can't be run, else
 * { exact, partial, leaves, you: { res:{color:[min,max]}, followers:[min,max], members:[min,max], turns:[min,max] },
 *   others: { res:{color:[min,max]}, followers:[min,max], members:[min,max] }, asks:[prompt], theirAsks:[prompt] }.
 * exact: every branch gives the same to you. others: the rivals' summed change.
 */
export function previewSpace(state, pid, q, i) {
  const key = `${q}-${i}`;
  let base;
  try {
    base = structuredClone({ ...state, log: [], pending: null });
    if (base.slots[key] !== undefined && base.slots[key] !== pid) (base.squats[key] = base.squats[key] || []).push(pid);
    else base.slots[key] = pid;
    base.players[pid].left -= 1;
    base.current = pid;
    base.queue = [{ t: 'act', p: pid, q, i }];
    resume(base);
  } catch { return null; }
  const leaves = [];
  const asks = new Set(), theirAsks = new Set();
  let nodes = 0, partial = false;
  const walk = s => {
    nodes++;
    if (!s.pending || s.pending.kind !== 'choose') { leaves.push(s); return; }
    (s.pending.player === pid ? asks : theirAsks).add(s.pending.prompt.replace(/\s*\(\d+ left\)/, ''));
    const opts = s.pending.options;
    // out of budget: follow only the first and last option (the extremes a list is usually ordered by)
    const list = nodes + opts.length > NODE_BUDGET ? (partial = true, [opts[0], opts[opts.length - 1]].filter((o, k, a) => a.indexOf(o) === k)) : opts;
    for (const o of list) {
      let next;
      try { next = applyMove(s, { player: s.pending.player, option: o.id }); } catch { partial = true; continue; }
      walk(next);
    }
  };
  try { walk(base); } catch { return null; }
  if (!leaves.length) return null;
  const range = () => [Infinity, -Infinity];
  const put = (r, v) => { r[0] = Math.min(r[0], v); r[1] = Math.max(r[1], v); };
  const you = { res: {}, followers: range(), members: range(), turns: range() };
  const others = { res: {}, followers: range(), members: range() };
  const me0 = state.players[pid];
  for (const s of leaves) {
    const me = s.players[pid];
    for (const r of state.resources) put(you.res[r] = you.res[r] || range(), (me.res[r] || 0) - (me0.res[r] || 0));
    put(you.followers, followers(s, me) - followers(state, me0));
    put(you.members, me.members.length - me0.members.length);
    // an extra turn shows up as a worker given back (left grows past the one just placed)
    put(you.turns, Math.max(0, me.left - (me0.left - 1)));
    const rivals = s.players.filter(o => o.id !== pid);
    for (const r of state.resources) put(others.res[r] = others.res[r] || range(), rivals.reduce((t, o) => t + (o.res[r] || 0) - (state.players[o.id].res[r] || 0), 0));
    put(others.followers, rivals.reduce((t, o) => t + followers(s, o) - followers(state, state.players[o.id]), 0));
    put(others.members, rivals.reduce((t, o) => t + o.members.length - state.players[o.id].members.length, 0));
  }
  const same = r => r[0] === r[1];
  const exact = Object.values(you.res).every(same) && same(you.followers) && same(you.members) && same(you.turns);
  return { exact, partial, leaves: leaves.length, you, others, asks: [...asks], theirAsks: [...theirAsks] };
}
