// Shared runner for the fuzz tests: plays seeded games and checks every invariant after every move.
import { createGame, applyMove, legalMoves, followers, TIERS, SHOP_SIZE } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';

export const MOVE_CAP = { bot: 1500, random: 4000 };

/** True if v survives a JSON round trip unchanged: only null, booleans, finite numbers, strings, arrays, plain objects. */
function plainJSONPath(v, path = 'state') {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? null : path;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) { const bad = plainJSONPath(v[i], `${path}[${i}]`); if (bad) return bad; }
    return null;
  }
  if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    for (const k of Object.keys(v)) { const bad = plainJSONPath(v[k], `${path}.${k}`); if (bad) return bad; }
    return null;
  }
  return path;
}

function fail(msg, s, ctx) { throw new Error(`${ctx}: ${msg} (round ${s.round}, move ${s.moves})`); }

export function checkInvariants(s, ctx) {
  // pure JSON
  const bad = plainJSONPath(s);
  if (bad) fail(`not plain JSON at ${bad}`, s, ctx);
  // resources never negative, always whole
  for (const p of s.players) {
    for (const [r, v] of Object.entries(p.res)) if (!Number.isInteger(v) || v < 0) fail(`${p.name} has ${v} ${r}`, s, ctx);
    if (!Number.isInteger(p.bonus) || p.bonus < 0) fail(`${p.name} bonus ${p.bonus}`, s, ctx);
    if (p.discount < 0) fail(`${p.name} discount ${p.discount}`, s, ctx);
    if (followers(s, p) < 1) fail(`${p.name} has under 1 follower`, s, ctx);
  }
  for (const c of Object.values(s.cards)) if ((c.invested || 0) < 0) fail(`card ${c.uid} invested ${c.invested}`, s, ctx);
  for (const t of TIERS.filter(x => x.limited)) {
    const left = s.stock?.[t.key];
    if (!(left >= 0 && left <= t.stock(s.players.length))) fail(`stock ${t.key} ${left}`, s, ctx);
  }
  // every card in exactly one place
  const seen = new Map();
  const put = (u, where) => { if (seen.has(u)) fail(`card ${u} in ${seen.get(u)} and ${where}`, s, ctx); seen.set(u, where); };
  s.pile.forEach(u => put(u, 'pile'));
  s.shop.forEach(u => put(u, 'shop'));
  s.players.forEach(p => p.members.forEach(u => put(u, p.name)));
  const all = Object.keys(s.cards).map(Number);
  if (seen.size !== all.length || all.some(u => !seen.has(u))) fail(`cards lost: ${seen.size} of ${all.length}`, s, ctx);
  // the shop is full while the pile lasts
  if (s.shop.length !== Math.min(SHOP_SIZE, s.shop.length + s.pile.length)) fail(`shop ${s.shop.length} with pile ${s.pile.length}`, s, ctx);
  // pending exists exactly while the game runs
  if (!s.pending !== !!s.over) fail(`pending ${!!s.pending} but over ${s.over}`, s, ctx);
  if (s.pending) {
    const { options, player, kind } = s.pending;
    if (!s.players[player]) fail(`pending player ${player}`, s, ctx);
    if (!['setup', 'place', 'buy', 'choose', 'pay'].includes(kind)) fail(`pending kind ${kind}`, s, ctx);
    if (!options.length) fail('pending with no options', s, ctx);
    if (new Set(options.map(o => o.id)).size !== options.length) fail(`duplicate option ids ${options.map(o => o.id)}`, s, ctx);
    if (kind === 'buy' && !options.some(o => o.id === 'pass')) fail('buy without pass', s, ctx);
    // a choice never offers a card that moved since it was queued (core liveOptions; Open Door's "not in the shop")
    if (kind === 'choose') for (const o of options) for (const [u, w] of Object.entries(o.at || {})) {
      const now = seen.get(Number(u)), want = w === 'shop' || w === 'pile' ? w : s.players[Number(w.slice(1))]?.name;
      if (now !== want) fail(`choice option ${o.id} names card ${u} at ${w}, now in ${now}`, s, ctx);
    }
  }
  if (s.round < 0 || s.round > 3) fail(`round ${s.round}`, s, ctx);
  for (const owner of Object.values(s.slots)) if (!s.players[owner]) fail(`slot owner ${owner}`, s, ctx);
}

function checkIllegal(s, ctx) {
  const before = JSON.stringify(s);
  const { player } = s.pending;
  const tries = [
    { player: (player + 1) % s.players.length, option: s.pending.options[0].id },
    { player, option: 'bogus:999' },
    { player: -1, option: s.pending.options[0].id },
  ];
  for (const m of tries) {
    let threw = false;
    try { applyMove(s, m); } catch { threw = true; }
    if (!threw) fail(`illegal move accepted: ${JSON.stringify(m)}`, s, ctx);
  }
  if (JSON.stringify(s) !== before) fail('an illegal move mutated the state', s, ctx);
}

const botPicker = rand => s => chooseBotMove(s, rand);
const randomPicker = rand => s => { const ms = legalMoves(s); return ms[Math.floor(rand() * ms.length)]; };

/** Plays one game to the end, checking every step. Returns { state, moves }. */
export function runGame({ n, seed, kind, full = true, quadrants }) {
  const ctx = `${kind} n=${n} seed=${seed}`;
  const rand = seededRandom(seed * 7919 + n);
  const pick = (kind === 'bot' ? botPicker : randomPicker)(rand);
  let s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants });
  const moves = [];
  checkInvariants(s, ctx);
  while (s.pending) {
    if (moves.length >= MOVE_CAP[kind]) fail(`no end after ${moves.length} moves`, s, ctx);
    const m = pick(s);
    const before = JSON.stringify(s);
    if (full) checkIllegal(s, ctx);
    const next = applyMove(s, m);
    if (JSON.stringify(s) !== before) fail(`applyMove mutated its input on ${JSON.stringify(m)}`, s, ctx);
    if (next === s) fail('applyMove returned its input', s, ctx);
    checkInvariants(next, ctx);
    moves.push(m);
    s = next;
  }
  if (!s.over || s.round < 1 || !Array.isArray(s.ranking) || s.ranking.length !== n) fail('did not finish cleanly', s, ctx);
  return { state: s, moves };
}

