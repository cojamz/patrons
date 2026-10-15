// Tables: which 4 spheres sit on the wheel. Classic (Gold, Red, Blue and Green, all real spheres), random 4, or a custom pick.
// Classic was Gold, Red and the plain stand-in Blue/Green until Cory moved the friends build to the real ones (2026-10-14).
import { allQuadrantIds, quadrant } from '../engine/v4/index.js';

export const CLASSIC = ['gold', 'red', 'market', 'echo'];
const ALIAS = { magenta: 'thieves', white: 'trading' };

/** Every sphere a table can use, real ones first, the plain stand-ins last. */
export const spheres = () => {
  const ids = allQuadrantIds();
  return [...ids.filter(id => !quadrant(id).standIn), ...ids.filter(id => quadrant(id).standIn)];
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
  purple: 'Extra turns: spend purple to place again.',
  silver: 'Big gains for you, a little for everyone else.',
  yellow: 'Gathers every color, and scores full sets.',
  market: 'Bends the shop: recruit outside your buy, pay half, refresh the row.',
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

/** Why a table can't be played, or '' when it can. */
export function tableProblem(ids) {
  if (!Array.isArray(ids) || ids.length !== 4) return 'Pick 4 spheres.';
  const known = new Set(allQuadrantIds());
  if (ids.some(id => !known.has(id))) return 'Unknown sphere.';
  if (new Set(ids).size !== 4) return 'Each sphere once.';
  const res = ids.map(id => quadrant(id).resource);
  for (let i = 0; i < 4; i++) for (let k = 0; k < i; k++)
    if (res[i] === res[k]) return `${sphereName(ids[k])} and ${sphereName(ids[i])} both use ${res[i]}.`;
  for (const id of ids) {
    const miss = usesColors(id).filter(c => !res.includes(c));
    if (miss.length) return `${sphereName(id)} hands out ${miss.join(' and ')}, which isn't on this table.`;
  }
  return '';
}

/** Parse "gold,red,thieves,echo" (ids, or magenta/white). Returns the 4 ids, or null if it isn't a playable table. */
export function parseTable(str) {
  if (!str) return null;
  const ids = String(str).toLowerCase().split(/[\s,]+/).filter(Boolean).map(s => ALIAS[s] || s);
  return tableProblem(ids) ? null : ids;
}
export const urlTable = () => { try { return parseTable(new URLSearchParams(location.search).get('table')); } catch { return null; } };

/** 4 real spheres at random, no two sharing a color. */
export function randomTable(rand = Math.random) {
  const pool = spheres().filter(id => !quadrant(id).standIn);
  for (let tries = 0; tries < 200; tries++) {
    const ids = [...pool];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids.length = 4;
    if (!tableProblem(ids)) return ids;
  }
  return [...CLASSIC];
}
