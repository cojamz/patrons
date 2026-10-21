// Tables: which spheres sit on the wheel, as many as there are players (Cory, 2026-10-15: "there are only X number of
// spheres for X number of players"). Classic (Gold, Red, Blue and Green, all real spheres; fewer players take its first
// N), random, or a custom pick. Classic was Gold, Red and the plain stand-in Blue/Green until Cory moved the friends
// build to the real ones (2026-10-14).
import { allQuadrantIds, quadrant, CLASSIC, classicFor } from '../engine/v4/index.js';
import { seededRandom } from '../engine/v4/rng.js';

export { CLASSIC, classicFor };
/** How many spheres a table of `players` plays: one each, 2 to 4. */
export const sphereCount = players => Math.max(2, Math.min(4, Number(players) || 4));
const ALIAS = { magenta: 'thieves', white: 'trading', blue: 'market', green: 'echo' };

/** Current playable arcs. Legacy Basic definitions remain only for replay compatibility. */
export const spheres = () => {
  const ids = allQuadrantIds();
  return ids.filter(id => !quadrant(id).standIn);
};
/** What the picker calls a sphere: its color name, "(basic)" for a stand-in (w2b #32: "(plain)" read as developer phrasing). */
export const sphereName = id => `${quadrant(id).name}${quadrant(id).standIn ? ' (basic)' : ''}`;
export const tableLine = ids => ids.map(sphereName).join(' · ');
/**
 * What a sphere does, in one plain line (w3b #1: the picker named quadrants and their rim rule, but not which one
 * steals). From each sphere's own design note (src/engine/v4/content/*.js).
 */
const LINES = {
  gold: 'Piles up gold, and saves on your next member.',
  red: 'Recruits: free members, and swaps with rivals.',
  purple: 'Extra turns: place again right away.',
  silver: 'Big gains for you, a little for everyone else.',
  yellow: 'Gathers every color, and scores full sets.',
  market: 'Bends the shop: extra recruits, pay half, refresh the row.',
  thieves: 'Steals resources and members from rivals.',
  trading: 'Sells followers for white, and buys them back cheap.',
  echo: 'Copies spaces: a rival’s, or your own again.',
  blue: 'Plain gains: blue, with a little of another color.',
  green: 'Plain gains: green, with a little of another color.',
};
export const sphereLine = id => LINES[id] || '';

// Colors a stand-in hands out besides its own (read off its printed actions).
const usesColors = id => {
  const q = quadrant(id);
  if (!q.standIn) return [];
  return [...new Set(q.actions.flatMap(a => [...a.text.matchAll(/\+\d+ ([a-z]+)/g)].map(m => m[1])))];
};

/** Why a table can't be played, or '' when it can. `n`: the spheres it needs (the player count); without it, 2 to 4. */
export function tableProblem(ids, n = null) {
  if (n != null && (!Array.isArray(ids) || ids.length !== n)) return `Pick ${n} spheres.`;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) return 'Pick 2 to 4 spheres.';
  const known = new Set(allQuadrantIds());
  if (ids.some(id => !known.has(id))) return 'Unknown sphere.';
  if (ids.some(id => quadrant(id).standIn)) return 'Basic arcs are retired. Choose Blue or Green.';
  if (new Set(ids).size !== ids.length) return 'Each sphere once.';
  const res = ids.map(id => quadrant(id).resource);
  for (let i = 0; i < ids.length; i++) for (let k = 0; k < i; k++)
    if (res[i] === res[k]) return `${sphereName(ids[k])} and ${sphereName(ids[i])} both use ${res[i]}.`;
  for (const id of ids) {
    const miss = usesColors(id).filter(c => !res.includes(c));
    if (miss.length) return `${sphereName(id)} hands out ${miss.join(' and ')}, which isn't on this table.`;
  }
  return '';
}

/** Parse "gold,red,thieves,echo" (ids, or magenta/white). Returns the 2 to 4 ids, or null if it isn't a playable table. */
export function parseTable(str) {
  if (!str) return null;
  const ids = String(str).toLowerCase().split(/[\s,]+/).filter(Boolean).map(s => ALIAS[s] || s);
  return tableProblem(ids) ? null : ids;
}
export const urlTable = () => { try { return parseTable(new URLSearchParams(location.search).get('table')); } catch { return null; } };

/** n real spheres at random (4 by default), no two sharing a color. */
export function randomTable(rand = Math.random, n = 4) {
  const pool = spheres().filter(id => !quadrant(id).standIn);
  for (let tries = 0; tries < 200; tries++) {
    const ids = [...pool];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids.length = n;
    if (!tableProblem(ids)) return ids;
  }
  return classicFor(n);
}

/**
 * A table ({ mode, quadrants }) fitted to `players`: one sphere each. Classic takes its first N. Random keeps its first N,
 * and with more seats than spheres adds real ones that fit, the same ones every time for the same table (seeded by it), so
 * the picker doesn't flicker as seats come and go. Custom keeps its first N and never adds: the person picks the rest.
 * Seats going 4 → 2 → 4 bring the same table back (the full pick stays in the stored table; this only reads it).
 */
export function fitTable(table, players) {
  const n = sphereCount(players);
  const mode = table && table.mode ? table.mode : 'classic';
  const ids = table && Array.isArray(table.quadrants) ? table.quadrants.map(id => ALIAS[id] || id) : [];
  if (mode === 'classic') return { mode, quadrants: classicFor(n) };
  if (ids.length >= n) return { mode, quadrants: ids.slice(0, n) };
  if (mode !== 'random') return { mode, quadrants: [...ids] };
  const seed = [...ids.join(',')].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
  const rand = seededRandom(seed || 1);
  const pool = spheres().filter(id => !quadrant(id).standIn && !ids.includes(id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = [...ids];
  const used = new Set(out.map(id => quadrant(id).resource));
  for (const id of pool) if (out.length < n && !used.has(quadrant(id).resource)) { out.push(id); used.add(quadrant(id).resource); }
  return { mode, quadrants: out.length === n ? out : randomTable(rand, n) };
}
