// Hard's game plan, and the notes it carries from game to game.
//
// A plan is picked at the first decision of a game (the artifact pick): two colors to build in and a style.
//   engine    – recruit hard in the plan's colors and let their members do the work
//   contest   – hold the lead in the plan's colors' contests, round after round
//   followers – recruit little, buy followers early and often
// The plan steers Hard by nudges, in followers, on top of normal's valuation: which options it looks ahead from,
// and which line wins when two play out close. It's looked at again at the start of rounds II and III and changed
// only when another plan reads clearly better (a rival crowding the same colors, a shop that dried up).
//
// Memory (optional) is what earlier games taught: how players finished, by style, color, artifact, member and
// space, every seat counted (so a bot learns from what worked for its rivals too). Older games fade. It's plain
// JSON: newMemory(), then learnFromGame() after each game.
import { cardDef, followers } from './core.js';
import { quadrant } from './content/index.js';

export const STYLES = ['engine', 'contest', 'followers'];
// normal's valuation, tilted by style (see scoreOptions' opts)
const PROFILE = {
  engine: { memberBias: 3, k: 2.5 },
  contest: { future: 0.8 },
  followers: { memberBias: 0.5, k: 1.5 },
};
// nudges, in followers
const FOCUS = [0.8, 0.5]; // a space or a member in the first / second plan color
const ENGINE_MEMBER = 0.5; // engine: one more for a member in a plan color
const FOLLOWER_BUY = 0.6; // followers style: a follower buy from round II on
const LEARN_SCALE = 0.25; // a learned edge of +4 followers over the table average reads as a +1 nudge
const LEARN_CAP = { member: 1.5, space: 1, color: 2, style: 2, artifact: 1.5 };
const SHRINK = 6; // games of evidence before a learned edge counts in full (half at 6)
const FADE = 0.97; // each new game, older evidence counts this much less
const SWITCH = 1.5; // how much better another style must read before a bot changes course mid-game
const STAY_COLOR = 1.5; // and each plan color, before it moves to another

export function newMemory() {
  return { games: 0, styles: {}, colors: {}, artifacts: {}, members: {}, spaces: {}, last: null };
}

const edge = (stat, cap) => {
  if (!stat || !stat.n) return 0;
  const v = (stat.sum / stat.n) * (stat.n / (stat.n + SHRINK)) * LEARN_SCALE;
  return Math.max(-cap, Math.min(cap, v));
};
/** What memory says about one thing, as a nudge in followers (0 with no memory). */
export const learned = (memory, kind, key) => (memory ? edge(memory[kind]?.[key], LEARN_CAP[kind.replace(/s$/, '')]) : 0);

const resOf = qid => quadrant(qid).resource;
const colorOf = (state, uid) => { try { return cardDef(state, uid).quadrant; } catch { return null; } };

/** How good each color on the table looks for player `me` right now. */
function colorReads(state, me, memory, lessons = null) {
  const p = state.players[me];
  const rivals = state.players.filter(o => o.id !== me);
  const artQ = p.artifact !== undefined ? colorOf(state, p.artifact) : null;
  return state.quadrants.map(qid => {
    const r = resOf(qid);
    const mine = (p.res[r] || 0) * 0.5 + p.members.filter(u => colorOf(state, u) === qid).length * 2;
    const shop = state.shop.filter(u => colorOf(state, u) === qid).length * 0.6;
    // rivals already in this color: a crowded contest and a fight for its members
    const crowd = rivals.reduce((a, o) => a + (o.res[r] || 0) * 0.3 + o.members.filter(u => colorOf(state, u) === qid).length, 0) / Math.max(1, rivals.length);
    // the artifact this color hands out (only while it's still there to pick)
    const art = state.round === 0 && artQ === null && state.artifacts?.[qid] !== undefined && !state.players.some(o => o.artifact === state.artifacts[qid])
      ? learned(memory, 'artifacts', qid) + (lessons?.artifacts?.[qid] || 0) : 0;
    const own = artQ === qid ? 1.5 : 0;
    return { qid, v: mine + shop - crowd * 0.8 + own + art + learned(memory, 'colors', qid) };
  });
}

/** A fresh plan from the table as it stands. `stay`: the current plan, read a little better (it's already under way). */
function readPlan(state, me, memory, rand, stay = null, lessons = null) {
  const reads = colorReads(state, me, memory, lessons).map(c => ({ ...c, v: c.v + (stay?.colors.includes(c.qid) ? STAY_COLOR : 0) + rand() * 0.6 }));
  reads.sort((a, b) => b.v - a.v);
  const colors = reads.slice(0, 2).map(c => c.qid);
  const p = state.players[me];
  const shopFocus = state.shop.filter(u => colors.includes(colorOf(state, u))).length;
  const owned = p.members.length;
  const games = memory?.games || 0;
  const styles = STYLES.map(style => {
    let v = learned(memory, 'styles', style);
    // try what's been tried least (fades as the notes fill up)
    const n = memory?.styles?.[style]?.n || 0;
    v += 2 * Math.sqrt(Math.log(games + 2) / (n + 1)) * (games < 60 ? 1 : 0.5);
    if (style === 'engine') v += shopFocus * 0.25 + (state.round <= 1 ? 0.5 : -0.5 * (state.round - 1));
    if (style === 'contest') v += reads[0].v > 3 ? 0.6 : 0;
    if (style === 'followers') v += state.round >= 2 && owned <= 1 ? 1 : 0;
    if (stay?.style === style) v += SWITCH;
    v += lessons?.styles?.[style] || 0;
    return { style, v: v + rand() * 0.5 };
  }).sort((a, b) => b.v - a.v);
  return { style: styles[0].style, colors, score: styles[0].v + reads[0].v + reads[1].v };
}

/** The plan `mind` holds for this round: picked on the first decision, looked at again when a round begins. */
export function planFor(state, me, mind, rand = Math.random) {
  if (!mind) return null;
  const round = state.round;
  if (mind.plan && mind.plan.round === round) return mind.plan;
  const memory = mind.memory || null;
  if (!mind.plan) {
    const fresh = readPlan(state, me, memory, rand, null, mind.lessons);
    mind.plan = { ...fresh, round, since: round };
    (mind.log ||= []).push({ round, style: fresh.style, colors: fresh.colors, change: 'start' });
    return mind.plan;
  }
  const next = readPlan(state, me, memory, rand, mind.plan, mind.lessons);
  const changed = next.style !== mind.plan.style || next.colors.join() !== mind.plan.colors.join();
  if (changed) (mind.log ||= []).push({ round, style: next.style, colors: next.colors, change: next.style !== mind.plan.style ? 'style' : 'colors' });
  mind.plan = { ...next, round, since: changed ? round : mind.plan.since };
  return mind.plan;
}

/** normal's valuation options for a plan (scoreOptions opts), scaled by lessons' knobs. */
export function planProfile(plan, lessons = null) {
  const base = { ...BASE, ...(plan ? PROFILE[plan.style] : {}) };
  if (!lessons?.knobs) return plan ? PROFILE[plan.style] : {};
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * (lessons.knobs[k] ?? 1)]));
}
// normal's own values for the knobs lessons scale (bots.js NORMAL)
const BASE = { memberBias: 2, k: 2, future: 0.4, spite: 0.4 };

/**
 * Lessons: what a Hard seat has been taught by testing (scripts/v4-hard-tune.mjs keeps a change only when the seats
 * playing it beat the seats without it). All in followers, added to an option's value:
 * { knobs: { memberBias, k, future, spite } multipliers, members: { defId }, spaces: { 'qid:key' },
 *   artifacts: { qid }, styles: { style }, tier: [round I, II, III] (a follower buy) }.
 */
export function lessonNudge(state, lessons, o) {
  if (!lessons) return 0;
  if (o.kind === 'slot') {
    const qid = state.quadrants[o.q], a = quadrant(qid).actions[o.i];
    return a ? lessons.spaces?.[`${qid}:${a.key}`] || 0 : 0;
  }
  if (o.kind === 'card') { try { return lessons.members?.[cardDef(state, o.uid).id] || 0; } catch { return 0; } }
  if (o.kind === 'tier') return lessons.tier?.[Math.max(1, state.round) - 1] || 0;
  return 0;
}

/** The nudge, in followers, a plan and memory give one place or buy option. */
export function planNudge(state, plan, memory, o) {
  if (!plan && !memory) return 0;
  let v = 0;
  const focus = qid => (plan ? plan.colors.indexOf(qid) : -1);
  if (o.kind === 'slot') {
    const qid = state.quadrants[o.q];
    const f = focus(qid);
    if (f >= 0) v += FOCUS[f];
    const a = quadrant(qid).actions[o.i];
    if (a) v += learned(memory, 'spaces', `${qid}:${a.key}`);
  } else if (o.kind === 'card') {
    const qid = colorOf(state, o.uid);
    const f = focus(qid);
    if (f >= 0) v += FOCUS[f] + (plan.style === 'engine' ? ENGINE_MEMBER : 0);
    try { v += learned(memory, 'members', cardDef(state, o.uid).id); } catch { /* not a member */ }
  } else if (o.kind === 'tier') {
    if (plan?.style === 'followers' && state.round >= 2) v += FOLLOWER_BUY;
  } else if (o.kind === 'color' && state.pending?.kind === 'setup') {
    const f = focus(o.value);
    if (f >= 0) v += FOCUS[f] * 2;
  }
  return v;
}

/** A Hard seat's starting pick (its artifact, or a starting color): the plan's first color when it's offered. */
export function planSetupPick(state, plan) {
  const pend = state.pending;
  if (!plan || pend?.kind !== 'setup') return null;
  for (const qid of plan.colors) {
    const o = pend.options.find(x => x.value === qid);
    if (o) return { player: pend.player, option: o.id };
  }
  return null;
}

/**
 * Adds one finished game to memory. seats[i]: { plan: the plan it opened with (or null for a seat that had none),
 * places: { 'qid:key': count } } for every player. Each player's result is followers minus the table's average.
 */
export function learnFromGame(memory, state, seats = []) {
  for (const kind of ['styles', 'colors', 'artifacts', 'members', 'spaces']) {
    for (const s of Object.values(memory[kind])) { s.n *= FADE; s.sum *= FADE; }
  }
  const add = (kind, key, perf, w = 1) => {
    const s = (memory[kind][key] ||= { n: 0, sum: 0 });
    s.n += w; s.sum += perf * w;
  };
  const fol = state.players.map(p => followers(state, p));
  const mean = fol.reduce((a, b) => a + b, 0) / fol.length;
  state.players.forEach((p, i) => {
    const perf = fol[i] - mean;
    const seat = seats[i] || {};
    if (seat.plan) {
      add('styles', seat.plan.style, perf);
      seat.plan.colors.forEach((q, k) => add('colors', q, perf, k ? 0.5 : 1));
    }
    if (seat.onlyFollowers) return; // the buy-followers-only seat teaches nothing about members or spaces
    if (p.artifact !== undefined) { const q = colorOf(state, p.artifact); if (q) add('artifacts', q, perf); }
    for (const u of p.members) { try { add('members', cardDef(state, u).id, perf); } catch { /* skip */ } }
    const places = seat.places || {};
    const total = Object.values(places).reduce((a, b) => a + b, 0) || 1;
    for (const [k, c] of Object.entries(places)) add('spaces', k, perf, (c / total) * 3);
  });
  const top = Math.max(...fol);
  const w = fol.indexOf(top);
  memory.games += 1;
  memory.last = {
    winner: w, followers: fol, plan: seats[w]?.plan ? { style: seats[w].plan.style, colors: seats[w].plan.colors } : null,
    members: state.players[w].members.map(u => { try { return cardDef(state, u).id; } catch { return null; } }).filter(Boolean),
  };
  return memory;
}

// ---------- a learned value for a round's end ----------
// Hard plays its options out to the end of the round, then has to say what that position is worth. normal's yardstick
// adds followers, game-end pay, what resources can still become and expected contests, and counts a member's ability
// for nothing once the round is over. A value model is learned from finished games instead: for every player at the end
// of round I and of round II, the parts of the position (bots.js boundaryParts) against the followers they finished
// with. Weights per round, pulled toward normal's yardstick when there is little evidence (ridge).
// PART_KEYS: followers, endPay, liquid, contests, ability, members, res, plus a constant.
export const PRIOR = [1, 1, 1, 1, 0, 0, 0, 0];
const RIDGE = 40; // samples' worth of pull toward the prior

/** Fits per-round weights from samples [{ round, x: parts, y: final followers }]. */
export function fitValueModel(samples, prior = PRIOR) {
  const model = { n: samples.length, rounds: {} };
  for (const r of [1, 2, 3]) {
    const rows = samples.filter(t => t.round === r);
    const d = prior.length;
    // the constant is barely pulled: only the parts lean on normal's yardstick
    const ridge = i => (i === d - 1 ? 1 : RIDGE);
    const A = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => (i === j ? ridge(i) : 0)));
    const b = prior.map((w, i) => w * ridge(i));
    // scale each part by its spread so the ridge pulls every weight alike
    const scale = Array.from({ length: d }, (_, j) => (j === d - 1 ? 1 : Math.max(1, Math.sqrt(rows.reduce((a, t) => a + t.x[j] ** 2, 0) / Math.max(1, rows.length)))));
    for (const t of rows) {
      const x = [...t.x, 1].map((v, j) => v / scale[j]);
      for (let i = 0; i < d; i++) { b[i] += x[i] * t.y; for (let j = 0; j < d; j++) A[i][j] += x[i] * x[j]; }
    }
    // the prior is in plain units: move it into scaled units
    for (let i = 0; i < d; i++) b[i] += prior[i] * ridge(i) * (scale[i] - 1);
    const w = solve(A, b).map((v, j) => v / scale[j]);
    model.rounds[r] = { w, n: rows.length };
  }
  return model;
}

function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Every player's expected final followers from a model and their parts (null when the model has no weights for it). */
export function modelValues(model, round, parts) {
  const w = model?.rounds?.[round]?.w;
  if (!w) return null;
  return parts.map(x => [...x, 1].reduce((a, v, j) => a + v * w[j], 0));
}
