// "You'd get": what taking a space would do for a player right now, by running it on a copy of the state.
// Display only. The engine's own action runs (with every member hook that reacts), so the preview can't drift
// from the rules. Choices the action asks for (yours or a rival's) are explored as branches and summarized as
// ranges. Nothing hidden leaks: it reports the player's own changes and rivals' totals, never the refilled shop.
import { applyMove, resume, followers } from './core.js';

const NODE_BUDGET = 36; // states explored per preview (a counted pick branches a lot; past the budget only the extremes are kept)

/**
 * previewSpace(state, pid, q, i) → null when it can't be run, else
 * { exact, partial, leaves, you: { res:{color:[min,max]}, followers:[min,max], members:[min,max], turns:[min,max], discount:[min,max] },
 *   others: { res:{color:[min,max]}, followers:[min,max], members:[min,max] }, asks:[prompt], theirAsks:[prompt],
 *   swept: [uid] (face-up members it surely sends under the pile), reasons: [line] (why a member changed it, or didn't), sample }.
 * exact: every branch gives the same to you. others: the rivals' summed change.
 */
export function previewSpace(state, pid, q, i) {
  const key = `${q}-${i}`;
  let base;
  try {
    // notes: the engine's preview-only reasons (a member that changed the result, or one that stayed off and why)
    base = structuredClone({ ...state, log: [], pending: null, notes: [] });
    if (base.slots[key] !== undefined && base.slots[key] !== pid) (base.squats[key] = base.squats[key] || []).push(pid);
    else base.slots[key] = pid;
    base.players[pid].left -= 1;
    base.current = pid;
    base.queue = [{ t: 'act', p: pid, q, i }];
    resume(base);
  } catch { return null; }
  const leaves = [];
  const asks = new Set(), theirAsks = new Set();
  // the spaces this copy space could take, as board keys: only the space's own first choice, and only this round's
  // spaces. A member it might recruit (Hand-pick → Sleepwalker, copying last round) is a branch, not the space's copy.
  let copies = null;
  let nodes = 0, partial = false;
  const walk = s => {
    nodes++;
    if (!s.pending || s.pending.kind !== 'choose') { leaves.push(s); return; }
    (s.pending.player === pid ? asks : theirAsks).add(s.pending.prompt.replace(/\s*\(\d+ left\)/, ''));
    if (s === base && s.pending.player === pid && s.pending.options.some(o => o.kind === 'space')) {
      copies = [...new Set(s.pending.options.filter(o => o.kind === 'space' && typeof o.value === 'string' && !String(o.id).startsWith('space:last:')).map(o => o.value.split('+')[0]))];
    }
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
  const you = { res: {}, followers: range(), members: range(), turns: range(), discount: range() };
  const others = { res: {}, followers: range(), members: range() };
  const me0 = state.players[pid];
  for (const s of leaves) {
    const me = s.players[pid];
    for (const r of state.resources) put(you.res[r] = you.res[r] || range(), (me.res[r] || 0) - (me0.res[r] || 0));
    put(you.followers, followers(s, me) - followers(state, me0));
    put(you.members, me.members.length - me0.members.length);
    put(you.discount, (me.discount || 0) - (me0.discount || 0)); // "your next member costs N less"
    // an extra turn shows up as a worker given back (left grows past the one just placed)
    put(you.turns, Math.max(0, me.left - (me0.left - 1)));
    const rivals = s.players.filter(o => o.id !== pid);
    for (const r of state.resources) put(others.res[r] = others.res[r] || range(), rivals.reduce((t, o) => t + (o.res[r] || 0) - (state.players[o.id].res[r] || 0), 0));
    put(others.followers, rivals.reduce((t, o) => t + followers(s, o) - followers(state, state.players[o.id]), 0));
    put(others.members, rivals.reduce((t, o) => t + o.members.length - state.players[o.id].members.length, 0));
  }
  // face-up members this space sends back under the pile (Restock's sweep; a bury), whatever you choose: so nobody
  // sweeps away the card they meant to recruit by surprise. Not counting cards someone recruits.
  const sweptIn = s => state.shop.filter(u => !s.shop.includes(u) && !s.players.some(o => o.members.includes(u)));
  const swept = leaves.map(sweptIn).reduce((a, b) => a.filter(u => b.includes(u)));
  const same = r => r[0] === r[1];
  const exact = Object.values(you.res).every(same) && same(you.followers) && same(you.members) && same(you.turns) && same(you.discount);
  // reasons: one short line per member effect on your numbers ("Hustler: +3 gold", "Underdog: gold gain 3 → 6"), or
  // a member that stayed off and why ("Underdog: no ×2 (Hustler’s +3 lands first)"), from every branch, for the hover
  const reasons = [];
  for (const s of leaves) for (const n of s.notes || []) {
    const line = `${n.member}: ${n.text}`;
    if (n.p === pid && !reasons.includes(line)) reasons.push(line);
  }
  // sample: the table after the first branch (for the screen to recount a contest on); exact when `exact`
  return { exact, partial, leaves: leaves.length, you, others, asks: [...asks], theirAsks: [...theirAsks], copies, swept, reasons: reasons.slice(0, 6), sample: leaves[0] };
}

/**
 * roundStartIncome(state, r?) → { [pid]: { res: { color: n }, followers: n } } or null: what each player's members
 * would hand them at the start of round r (default: the next round; in round III, round III again), by running the
 * engine's own round start on a copy, every round-start hook included. Display only (a seat's "each round" line).
 */
export function roundStartIncome(state, r = Math.min(3, Math.max(1, (state.round || 0) + 1))) {
  let s;
  try {
    s = structuredClone({ ...state, log: [], pending: null, notes: [], over: false });
    s.queue = [{ t: 'round', r }];
    resume(s);
  } catch { return null; }
  const out = {};
  for (const p of state.players) {
    const q = s.players[p.id];
    const res = {};
    for (const c of state.resources) { const d = (q.res[c] || 0) - (p.res[c] || 0); if (d) res[c] = d; }
    out[p.id] = { res, followers: followers(s, q) - followers(state, p) };
  }
  return out;
}
