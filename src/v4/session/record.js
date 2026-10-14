// Version stamps, game records and replay: what keeps saves, rooms and bug reports honest across deploys.
//
// - CONTENT_HASH fingerprints the rules content this build runs: every sphere's id, resource, actions (ids, rings and
//   order), handler names, members (ids, order, costs, follower values, copies, flags, hook names), guest members, the
//   follower-buy tiers and the default rule flags. Wording is left out, so a reworded card doesn't strand a save.
// - Every game a session starts is stamped `state.build = { schema, content, id }` and keeps `state.history`, the full
//   move list as [player, optionId]. Seed + seats + table + rules + moves replays the game exactly (the engine is pure).
// - A game record is that, as JSON: `gameRecord(state)`. `replayRecord(record)` replays one and reports the first
//   illegal move or exception with the state at that point (scripts/v4-replay.mjs, src/test/v4/records/).
// - `stateProblem(state)` says why a saved state can't be resumed by this build (older content, or ids that no longer
//   resolve), so a stale save is never auto-resumed into a crash.
import { createGame, applyMove, isLegal, followers, TIERS, DEFAULT_RULES, RING_VALUE, WORKERS, SHOP_SIZE } from '../../engine/v4/core.js';
import { allQuadrantIds, quadrant, guestMembers, defById, handlerById } from '../../engine/v4/content/index.js';
import { setBotLevels } from '../../engine/v4/bots.js';
import { createEmitter } from './emitter.js';
import { VERSION } from '../version.js';

export const RECORD_KIND = 'patrons.v4.record';
export const SCHEMA = 1;

// ---------- content hash ----------

// The structure of a def: numbers and booleans by value, functions and text by presence only.
function shape(v, depth = 0) {
  if (typeof v === 'function') return 'f';
  if (v == null || typeof v === 'number' || typeof v === 'boolean') return v ?? null;
  if (typeof v === 'string') return 's';
  if (depth > 4) return typeof v;
  if (Array.isArray(v)) return v.map(x => shape(x, depth + 1));
  return Object.fromEntries(Object.keys(v).sort().map(k => [k, shape(v[k], depth + 1)]));
}
const without = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

/** The canonical content description the hash is taken over (exported for debugging a mismatch). */
export function contentManifest() {
  return {
    quadrants: allQuadrantIds().sort().map(id => {
      const q = quadrant(id);
      return {
        // scoring's display keys (show, counts, tiebreak) describe a rule, they don't change it: left out of the hash
        id, resource: q.resource, rest: shape({ ...without(q, ['actions', 'members', 'id', 'resource']), ...(q.scoring ? { scoring: without(q.scoring, ['show', 'counts', 'tiebreak']) } : {}) }),
        actions: q.actions.map(a => ({ id: a.id, ...shape(without(a, ['id'])) })),
        members: q.members.map(d => ({ id: d.id, ...shape(without(d, ['id'])) })),
      };
    }),
    guests: guestMembers().map(d => ({ id: d.id, lean: d.lean, ...shape(without(d, ['id', 'lean'])) })),
    tiers: TIERS.map(t => ({ ...shape(t), stock: [2, 3, 4].map(n => (t.stock ? t.stock(n) : null)) })),
    rules: shape(DEFAULT_RULES), ring: RING_VALUE, workers: WORKERS, shop: SHOP_SIZE,
  };
}

// cyrb53: a small, well-mixed 53-bit string hash.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
export const hashContent = manifest => cyrb53(JSON.stringify(manifest)).toString(36);

/** Taken once, when this module loads (after every sphere has registered). */
export const SHAPE_HASH = hashContent(contentManifest());
// The shape hash sees a hook only as "a function", so a changed effect slips past it. The build adds a hash of the rules
// source (scripts/v4-src-hash.mjs, defined as __V4_SRC__ by vite.config.js and vitest.config.js): any rules edit is a
// new content stamp. Without the define (some other bundler) it falls back to the shape alone.
// eslint-disable-next-line no-undef
export const SRC_HASH = typeof __V4_SRC__ !== 'undefined' ? String(__V4_SRC__) : '';
export const CONTENT_HASH = SRC_HASH ? `${SHAPE_HASH}.${SRC_HASH}` : SHAPE_HASH;
// eslint-disable-next-line no-undef
export const BUILD_ID = typeof __V4_BUILD__ !== 'undefined' ? String(__V4_BUILD__) : 'dev';
// version: the player-facing version (version.js), for people reading a record; compatibility is `content` alone
export const BUILD = Object.freeze({ schema: SCHEMA, content: CONTENT_HASH, id: BUILD_ID, version: VERSION });

// ---------- stamped games ----------

/** createGame plus this build's stamp and an empty move list. Sessions start every game through here. */
export function newGame(opts) {
  const state = createGame(opts);
  state.build = { ...BUILD };
  state.history = [];
  return state;
}

/** applyMove that also records the move (when the state keeps a history). Throws like applyMove. */
export function step(state, move) {
  const next = applyMove(state, move);
  if (Array.isArray(next.history)) next.history.push([move.player, move.option]);
  return next;
}

/** True when this state was made by a build with the same rules content as this one. */
export const sameContent = state => !!(state && state.build && state.build.content === CONTENT_HASH);

/**
 * Why this build can't safely resume `state`, or null if it can.
 * { kind: 'version' } — stamped by a build with other rules content, or not stamped at all (older than stamps);
 * { kind: 'broken', message } — the content matches but the engine can't read it (an id doesn't resolve, or it throws).
 */
export function stateProblem(state) {
  if (!state || !Array.isArray(state.players)) return { kind: 'broken', message: 'No game in this save.' };
  if (!sameContent(state)) return { kind: 'version', message: 'This game was saved on an older version of Cults.' };
  try {
    for (const q of state.quadrants) quadrant(q);
    for (const c of Object.values(state.cards || {})) { defById(c.def); if (c.copy) defById(c.copy); }
    for (const t of state.queue || []) if (t && t.h) handlerById(t.h);
    for (const p of state.players) followers(state, p);
    // the next decision must be playable: try its first option on a copy (applyMove never mutates its input)
    if (!state.over && state.pending && state.pending.options?.length) applyMove(state, { player: state.pending.player, option: state.pending.options[0].id });
  } catch (err) {
    return { kind: 'broken', message: `This saved game can't be opened by this version (${err?.message || err}).` };
  }
  return null;
}

// ---------- game records ----------

/**
 * The game as JSON-ready data: enough to replay it move by move. `extra` is merged in (e.g. { error, note }).
 * States from before history was kept have `moves: null`; pass { state } in `extra` to carry the snapshot.
 */
export function gameRecord(state, extra = {}) {
  if (!state || !Array.isArray(state.players)) return { kind: RECORD_KIND, schema: SCHEMA, made: BUILD, empty: true, ...extra };
  return {
    kind: RECORD_KIND, schema: SCHEMA,
    build: state.build || null, // the build that played it
    made: BUILD, // the build that wrote this record
    seed: state.seed, quadrants: [...state.quadrants], rules: { ...state.rules },
    seats: state.players.map(p => ({ name: p.name, kind: p.kind, ...(p.bot ? { bot: p.bot } : {}), ...(p.emoji ? { emoji: p.emoji } : {}) })),
    moves: Array.isArray(state.history) ? state.history.map(m => [...m]) : null,
    at: { round: state.round, moves: state.moves, over: !!state.over },
    ...extra,
  };
}

/** A record as text for the clipboard. */
export const recordText = rec => JSON.stringify(rec, null, 1);

/** Accepts a record object or its JSON text. Throws a plain message on anything else. */
export function parseRecord(input) {
  const rec = typeof input === 'string' ? JSON.parse(input) : input;
  if (!rec || rec.kind !== RECORD_KIND) throw new Error('Not a Cults game record.');
  if (!Array.isArray(rec.seats) || !Array.isArray(rec.quadrants)) throw new Error('The record has no seats or table.');
  if (!Array.isArray(rec.moves)) throw new Error('The record has no move list (saved before moves were recorded).');
  return rec;
}

/**
 * Replays a record from its seed. Stops at the first illegal move or exception.
 * @param {object|string} input  a record (or its JSON)
 * @param {{ upTo?: number, onMove?: (state: object, move: {player:number, option:string}, i: number) => void }} [opts]
 * @returns {{ ok: boolean, state: object, played: number, total: number, sameContent: boolean,
 *   failure: null | { index: number, move: {player:number, option:string}, reason: 'illegal'|'exception', message: string, stack?: string, state: object } }}
 *   On a failure, `state` (and failure.state) is the state the failing move was offered to.
 */
export function replayRecord(input, { upTo = Infinity, onMove } = {}) {
  const rec = parseRecord(input);
  const total = rec.moves.length;
  const same = !!(rec.build && rec.build.content === CONTENT_HASH);
  let state;
  try {
    state = newGame({ seats: rec.seats.map(s => ({ name: s.name, kind: s.kind, ...(s.emoji ? { emoji: s.emoji } : {}) })), seed: rec.seed, quadrants: rec.quadrants, rules: rec.rules || {} });
    setBotLevels(state, rec.seats.map(s => s.bot));
  } catch (err) {
    return { ok: false, state: null, played: 0, total, sameContent: same, failure: { index: -1, move: null, reason: 'exception', message: `Couldn't set up the game: ${err?.message || err}`, stack: err?.stack, state: null } };
  }
  const n = Math.min(total, upTo);
  for (let i = 0; i < n; i++) {
    const [player, option] = rec.moves[i];
    const move = { player, option };
    if (!isLegal(state, move)) {
      const pend = state.pending;
      const why = state.over ? 'the game is already over'
        : !pend ? 'no decision is pending'
          : pend.player !== player ? `it is P${pend.player + 1}'s decision (${pend.kind}), not P${player + 1}'s`
            : `not among the ${pend.options.length} options of this ${pend.kind} decision`;
      return { ok: false, state, played: i, total, sameContent: same, failure: { index: i, move, reason: 'illegal', message: `Move ${i + 1} (P${player + 1} ${option}) is illegal: ${why}.`, state } };
    }
    try {
      const next = step(state, move);
      onMove?.(next, move, i);
      state = next;
    } catch (err) {
      return { ok: false, state, played: i, total, sameContent: same, failure: { index: i, move, reason: 'exception', message: `Move ${i + 1} (P${player + 1} ${option}) threw: ${err?.message || err}`, stack: err?.stack, state } };
    }
  }
  return { ok: true, state, played: n, total, sameContent: same, failure: null };
}

// ---------- the game on screen, and problems worth telling the player about ----------

// The latest state any session showed, so the error screen can offer its record even after React has unmounted.
let current = null;
/** Sessions call this with every state they publish. */
export const trackState = state => { if (state && Array.isArray(state.players)) current = state; };
export const trackedState = () => current;
/** A record of the game on screen (or null): what "Copy game record" copies. */
export const currentRecord = (extra = {}) => (current ? gameRecord(current, extra) : null);

const problems = createEmitter();
let lastProblem = null;
/**
 * Something went wrong that the player should see but that doesn't stop play (a bot move threw and a fallback was
 * played), or that does (the game can't continue). `{ kind: 'bot'|'stuck'|'host', seat?, message, detail? }`.
 */
export function reportProblem(p) {
  lastProblem = { ...p, at: Date.now() };
  problems.emit(lastProblem);
  return lastProblem;
}
export const onProblem = fn => problems.on(fn);
export const latestProblem = () => lastProblem;

/**
 * The bot's move, or a fallback: if choosing or applying it throws, the first option that applies cleanly.
 * Returns { state, move, fallback, error } — `state` is null when no option at all could be played.
 * Pure apart from console.error and `report` (reportProblem unless the caller routes it, e.g. to the online room).
 */
export function botStep(state, choose, { tag = 'v4', seat = state?.pending?.player, report = reportProblem } = {}) {
  let error = null;
  try {
    const move = choose(state);
    if (!isLegal(state, move)) throw new Error(`The bot chose an illegal move: ${JSON.stringify(move)}`);
    return { state: step(state, move), move, fallback: false, error: null };
  } catch (err) { error = err; }
  console.error(`[${tag}] bot move failed for seat ${seat + 1}:`, error);
  const pend = state && state.pending;
  for (const o of (pend && pend.options) || []) {
    const move = { player: pend.player, option: o.id };
    try {
      const next = step(state, move);
      report({ kind: 'bot', seat, message: `${state.players[seat]?.name || 'A bot'} hit a bug, so it made a plain move instead.`, detail: String(error?.message || error) });
      return { state: next, move, fallback: true, error };
    } catch (err) { console.error(`[${tag}] fallback ${o.id} failed too:`, err); }
  }
  report({ kind: 'stuck', seat, message: `${state?.players?.[seat]?.name || 'A bot'} hit a bug and the game can't continue.`, detail: String(error?.message || error) });
  return { state: null, move: null, fallback: true, error };
}
