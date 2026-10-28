// "You'd get": what taking a space would do for a player right now, by running it on a copy of the state.
// Display only. The engine's own action runs (with every member hook that reacts), so the preview can't drift
// from the rules. Choices the action asks for (yours or a rival's) are explored as branches and summarized as
// ranges. Nothing hidden leaks: it reports the player's own changes and rivals' totals, never the refilled shop.
import { applyMove, resume, followers, memberCount } from './core.js';

const NODE_BUDGET = 36; // states explored per preview (a counted pick branches a lot; past the budget only the extremes are kept)
// a hard stop: past the budget each choice still branched in two, so a long chain of choices (Greatest Hits copying a
// round III board) doubled per choice: 600+ states, 7-9 s at 1x, 30 s frozen at 4x when a hover worked it out on the
// page (freeze probe, 2026-10-28). Past this many states nothing more is explored; the preview says it's partial.
const NODE_CAP = 2 * NODE_BUDGET;

/**
 * previewSpace(state, pid, q, i) → null when it can't be run, else
 * { exact, partial, leaves, you: { res:{color:[min,max]}, followers:[min,max], members:[min,max], turns:[min,max], discount:[min,max] },
 *   others: { res:{color:[min,max]}, followers:[min,max], members:[min,max] }, asks:[prompt], theirAsks:[prompt],
 *   swept: [uid] (face-up members it surely sends under the pile), reasons: [line] (why a member changed it, or didn't), sample,
 *   best, likely: { res:{color:n}, followers, members, turns, discount } (one branch's change for you), tied, mix }.
 * exact: every branch gives the same to you. others: the rivals' summed change.
 * best: the branch worth most to you; likely: you pick what's worth most to you and each rival picks what's worth most
 * to them (a ransom paid rather than a member lost); tied: every branch is worth the same to you (only the mix differs:
 * which color, how many of each), and mix lists those outcomes. Worth is a rough ruler for ordering branches, never
 * shown: a resource 1, a follower 2 (Cory's anchor, design/eval/value-model.md), a member 4 besides its followers, an
 * extra turn 3, a discount 1 a point. Display only, like the rest: the "You'd get" line (Info.jsx youdWords).
 */
/** How many of p's turns this round were taken early (moved up by Crunch Time): the engine's roundOrder record. */
const earlyMoves = (s, pid) => {
  const e = s.early;
  if (!e || e.round !== s.round) return 0;
  return e.moves.filter(m => m.p === pid).length;
};
export function previewSpace(state, pid, q, i) {
  const key = `${q}-${i}`;
  let base;
  try {
    // notes: the engine's preview-only reasons (a member that changed the result, or one that stayed off and why)
    base = structuredClone({ ...state, log: [], pending: null, notes: [] });
    const joined = base.slots[key] !== undefined; // a taken space, a rival's or (Crowd In) your own
    if (joined) (base.squats[key] = base.squats[key] || []).push(pid);
    else base.slots[key] = pid;
    // as the engine's placement does: the act reads it (ctx.placement.joined: Redistribute counts the space it joins)
    base.players[pid].lastSlot = { key, joined };
    base.players[pid].left -= 1;
    base.current = pid;
    // the round's turns still to come wait behind a stop that never runs them: Crunch Time moves yours up, and an
    // extra turn counts them for its spare space
    base.queue = [{ t: 'act', p: pid, q, i }, { t: 'previewHold', p: pid }, ...state.queue.filter(t => t.t === 'turn').map(t => ({ ...t }))];
    resume(base);
  } catch { return null; }
  const leaves = [];
  const asks = new Set(), theirAsks = new Set();
  // the spaces this copy space could take, as board keys: only the space's own first choice, and only this round's
  // spaces. A member it might recruit (Hand-pick → Sleepwalker, copying last round) is a branch, not the space's copy.
  let copies = null;
  // your first pick's options (the engine's own list): which face-up or seat members the space acts on (targets below)
  let first = null;
  let nodes = 0, partial = false;
  // worth of a branch to a player (see above); the extra turns only for pid (a rival's minions don't move here)
  const worthOf = new Map();
  const worth = (s, who) => {
    const k = `${who}`, m = worthOf.get(s) || worthOf.set(s, {}).get(s);
    if (m[k] !== undefined) return m[k];
    const a = s.players[who], b = state.players[who];
    let v = 0;
    for (const r of state.resources) v += (a.res[r] || 0) - (b.res[r] || 0);
    v += 2 * (followers(s, a) - followers(state, b)) + 4 * (memberCount(s, a) - memberCount(state, b)) + ((a.discount || 0) - (b.discount || 0));
    if (who === pid) v += 3 * Math.max(0, a.left - (b.left - 1));
    return (m[k] = v);
  };
  // returns { best, likely } leaves under s (see above), or null when no branch could be followed
  const walk = s => {
    if (nodes >= NODE_CAP) { partial = true; return null; }
    nodes++;
    if (!s.pending || s.pending.kind !== 'choose') { leaves.push(s); return { best: s, likely: s, worst: s }; }
    (s.pending.player === pid ? asks : theirAsks).add(s.pending.prompt.replace(/\s*\(\d+ left\)/, ''));
    if (s === base && s.pending.player === pid && s.pending.options.some(o => o.kind === 'space')) {
      copies = [...new Set(s.pending.options.filter(o => o.kind === 'space' && typeof o.value === 'string' && !String(o.id).startsWith('space:last:')).map(o => o.value.split('+')[0]))];
    }
    if (s === base && s.pending.player === pid) first = s.pending.options;
    const opts = s.pending.options;
    // out of budget: follow only the first and last option (the extremes a list is usually ordered by)
    const list = nodes + opts.length > NODE_BUDGET ? (partial = true, [opts[0], opts[opts.length - 1]].filter((o, k, a) => a.indexOf(o) === k)) : opts;
    const chooser = s.pending.player;
    let best = null, likely = null, worst = null;
    for (const o of list) {
      let next;
      try { next = applyMove(s, { player: chooser, option: o.id }); } catch { partial = true; continue; }
      const got = walk(next);
      if (!got) continue;
      if (!best || worth(got.best, pid) > worth(best, pid)) best = got.best;
      if (!likely || worth(got.likely, chooser) > worth(likely, chooser)) likely = got.likely;
      if (!worst || worth(got.worst, pid) < worth(worst, pid)) worst = got.worst;
    }
    return best ? { best, likely, worst } : null;
  };
  let top;
  try { top = walk(base); } catch { return null; }
  if (!leaves.length || !top) return null;
  const range = () => [Infinity, -Infinity];
  const put = (r, v) => { r[0] = Math.min(r[0], v); r[1] = Math.max(r[1], v); };
  const you = { res: {}, followers: range(), members: range(), turns: range(), early: range(), discount: range() };
  const others = { res: {}, followers: range(), members: range() };
  const me0 = state.players[pid];
  for (const s of leaves) {
    const me = s.players[pid];
    for (const r of state.resources) put(you.res[r] = you.res[r] || range(), (me.res[r] || 0) - (me0.res[r] || 0));
    put(you.followers, followers(s, me) - followers(state, me0));
    put(you.members, memberCount(s, me) - memberCount(state, me0));
    put(you.discount, (me.discount || 0) - (me0.discount || 0)); // "your next member costs N less"
    // an extra turn shows up as a worker given back (left grows past the one just placed)
    put(you.turns, Math.max(0, me.left - (me0.left - 1)));
    // your own turns moved up (Crunch Time): not extra, but sooner
    put(you.early, earlyMoves(s, pid) - earlyMoves(state, pid));
    const rivals = s.players.filter(o => o.id !== pid);
    for (const r of state.resources) put(others.res[r] = others.res[r] || range(), rivals.reduce((t, o) => t + (o.res[r] || 0) - (state.players[o.id].res[r] || 0), 0));
    put(others.followers, rivals.reduce((t, o) => t + followers(s, o) - followers(state, state.players[o.id]), 0));
    put(others.members, rivals.reduce((t, o) => t + memberCount(s, o) - memberCount(state, state.players[o.id]), 0));
  }
  // face-up members this space sends back under the pile (Restock's sweep; a bury), whatever you choose: so nobody
  // sweeps away the card they meant to recruit by surprise. Not counting cards someone recruits.
  const sweptIn = s => state.shop.filter(u => !s.shop.includes(u) && !s.players.some(o => o.members.includes(u)));
  const swept = leaves.map(sweptIn).reduce((a, b) => a.filter(u => b.includes(u)));
  const same = r => r[0] === r[1];
  const exact = Object.values(you.res).every(same) && same(you.followers) && same(you.members) && same(you.turns) && same(you.early) && same(you.discount);
  // reasons: one short line per member effect on your numbers ("Hustler: +3 gold", "Underdog: gold gain 3 → 6"), or
  // a member that stayed off and why ("Underdog: no ×2 (Hustler’s +3 lands first)"), from every branch, for the hover
  // A member that fires more than once in one branch (Greatest Hits copying two gold spaces: Prospector +1 each) says
  // its sum ("Prospector: +2 gold"), never one firing's amount (blind tester B: the Why said +1 where each paid +2).
  const reasons = [];
  const resWords = res => Object.entries(res).filter(([, d]) => d).map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`).join(', ');
  for (const s of leaves) {
    const by = new Map();
    for (const n of s.notes || []) {
      if (n.p !== pid) continue;
      const g = by.get(n.member) || { res: {}, texts: [], all: true };
      if (n.res) for (const [r, d] of Object.entries(n.res)) g.res[r] = (g.res[r] || 0) + d;
      else g.all = false;
      g.texts.push(n.text);
      by.set(n.member, g);
    }
    for (const [member, g] of by) {
      const text = g.all && g.texts.length > 1 && resWords(g.res) ? resWords(g.res) : [...new Set(g.texts)].join('; ');
      const line = `${member}: ${text}`;
      if (!reasons.includes(line)) reasons.push(line);
    }
  }
  // one branch's change for you, as the screen words it ("likely +4 magenta · at best +1 member")
  const change = s => {
    const me = s.players[pid];
    return {
      res: Object.fromEntries(state.resources.map(r => [r, (me.res[r] || 0) - (me0.res[r] || 0)])),
      followers: followers(s, me) - followers(state, me0), members: memberCount(s, me) - memberCount(state, me0),
      turns: Math.max(0, me.left - (me0.left - 1)), early: earlyMoves(s, pid) - earlyMoves(state, pid), discount: (me.discount || 0) - (me0.discount || 0),
      // members that came in while the count didn't rise by as many: traded for (a swap)
      swapped: Math.max(0, me.members.filter(u => !me0.members.includes(u)).length - Math.max(0, me.members.length - me0.members.length)),
      // which members this branch brings you (display: "+1 member (Planner)", w4 skeptic #31)
      joined: me.members.filter(u => !me0.members.includes(u)),
    };
  };
  const worths = leaves.map(s => worth(s, pid));
  const tied = Math.max(...worths) - Math.min(...worths) < 1e-9;
  // every pick worth the same: the distinct outcomes, in the engine's option order (the screen says which color or mix)
  const mix = tied && !exact ? [...new Map(leaves.map(s => { const c = change(s); return [JSON.stringify(c), c]; })).values()].slice(0, 12) : null;
  // sample: the table after the first branch (for the screen to recount a contest on); exact when `exact`
  // samples: the tables after the first branches (up to 16), so a contest line can tell what depends on a pick
  // the best branch that spends nothing and recruits no one (Snap Up declined: "+2 blue"), so the screen can say a
  // recruit by its price after the space's own gain, never as a net "−4" (live panel r1)
  const spendsNothing = s => state.resources.every(r => (s.players[pid].res[r] || 0) >= (me0.res[r] || 0)) && s.players[pid].members.length === me0.members.length;
  const keepLeaf = leaves.filter(spendsNothing).reduce((a, s) => (!a || worth(s, pid) > worth(a, pid) ? s : a), null);
  // every member some branch brings you (Open Door's tied cheapest: all four, not the best one's name)
  const joins = [...new Set(leaves.flatMap(s => s.players[pid].members.filter(u => !me0.members.includes(u))))];
  return { exact, partial, leaves: leaves.length, keep: keepLeaf ? change(keepLeaf) : null, you, others, asks: [...asks], theirAsks: [...theirAsks], copies, swept, reasons: reasons.slice(0, 6), sample: leaves[0], samples: leaves.slice(0, 16),
    best: change(top.best), likely: change(top.likely), worst: change(top.worst), tied, mix,
    joins, targets: spaceTargets(state, pid, first, joins, leaves) };
}

/**
 * The members a space acts on, so the screen can light them while its hover is up (Cory, 2026-10-16: "hovering over
 * Free Recruit should highlight the cheapest recruit(s) in the shop"). Read off the engine, never re-derived from the
 * card's words: your first pick's own options when the space asks (Open Door's tied cheapest, Open House's and Snap
 * Up's row, Shake Down's and Poach's rival members, Even Swap's and Swap Sides' pairs), else the face-up members every
 * branch brought you (Open Door with one cheapest recruits it without asking). A card option counts only when a branch
 * really brings it to you (a pick that buries a face-up card isn't a recruit).
 * → { shop: [uid], seats: [uid], pairs: [[yours, theirs]], sure } or null. sure: the one face-up member comes to you
 * whatever happens ("Would recruit" rather than "Could").
 */
export function spaceTargets(state, pid, first, joins, leaves) {
  const inShop = u => state.shop.includes(u);
  const ownerOf = u => state.players.find(o => o.members.includes(u));
  const opts = first || [];
  const picked = opts.filter(o => o.kind === 'card' && inShop(o.value) && joins.includes(o.value)).map(o => o.value);
  const shop = [...new Set(picked.length ? picked : joins.filter(inShop))];
  const seats = [...new Set(opts.filter(o => o.kind === 'member' && ownerOf(o.value) && ownerOf(o.value).id !== pid).map(o => o.value))];
  const pairs = opts.filter(o => o.kind === 'trade' && Array.isArray(o.value) && o.value.length === 2).map(o => [...o.value]);
  if (!shop.length && !seats.length && !pairs.length) return null;
  const sure = shop.length === 1 && leaves.every(s => s.players[pid].members.includes(shop[0]));
  return { shop, seats, pairs, sure };
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
