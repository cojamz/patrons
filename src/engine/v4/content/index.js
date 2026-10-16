// Content registry. Every quadrant is a self-contained module; the engine looks them up by id.
import gold from './gold.js';
import red from './red.js';
import { blue, green } from './standins.js';
import purple from './purple.js';
import silver from './silver.js';
import yellow from './yellow.js';
import { install as installMarket } from './market.js';
import { install as installThieves } from './thieves.js';
import { install as installTrading } from './trading.js';
import { install as installEcho } from './echo.js';
import { install as installBenders } from './benders.js';

const QUADRANTS = { gold, red, blue, green };

// Member defs get a global id "<quadrant>.<key>" and know their quadrant.
const DEFS = {};
const HANDLERS = {};
/** Add a quadrant module to the registry (used by index below, and by new spheres while they're being designed). */
export function registerQuadrant(q) {
  QUADRANTS[q.id] = q;
  index(q);
  return q;
}
function index(q) {
  for (const def of q.members) {
    def.id = `${q.id}.${def.key}`;
    def.quadrant = q.id;
    def.copies = def.copies || 1;
    DEFS[def.id] = def;
  }
  for (const a of q.actions) a.id = `${q.id}.${a.key}`;
  for (const [k, fn] of Object.entries(q.handlers || {})) HANDLERS[`${q.id}.${k}`] = fn;
}
for (const q of Object.values(QUADRANTS)) index(q);

export const DEFAULT_QUADRANTS = ['gold', 'red', 'blue', 'green'];
// A game has as many spheres as players (Cory, 2026-10-15: "there are only X number of spheres for X number of
// players"), so every round-I space still fills (3 per sphere, 3 minions each). Classic, by table size: four seats
// play Gold, Red, Blue (market) and Green (echo); three drop Green (echo); two play Gold and Red (Claude, under
// Cory's go-with-your-gut: the two longest-tested real spheres, and the economy/recruit pair the game is about).
export const CLASSIC = ['gold', 'red', 'market', 'echo'];
export const classicFor = n => CLASSIC.slice(0, Math.max(2, Math.min(4, n)));
/** The engine's default table for n seats: the plain 4-sphere test table, or Classic's first n when fewer play (the
 *  plain Blue and Green hand out each other's colors, so they don't split). */
export const defaultQuadrants = n => (n >= 4 ? [...DEFAULT_QUADRANTS] : classicFor(n));
export const quadrant = id => {
  const q = QUADRANTS[id];
  if (!q) throw new Error(`Unknown quadrant: ${id}`);
  return q;
};
export const defById = id => {
  const d = DEFS[id];
  if (!d) throw new Error(`Unknown member: ${id}`);
  return d;
};
export const handlerById = id => {
  const h = HANDLERS[id];
  if (!h) throw new Error(`Unknown handler: ${id}`);
  return h;
};
export const allQuadrantIds = () => Object.keys(QUADRANTS);

// Guest members: cards that join the shared deck without a quadrant of their own (the rule-benders, while they
// wait for a sphere). Each def names the sphere it leans to (def.lean): that is its color, and it counts as one of
// that sphere's members. Ids are "<group>.<key>". A table with the rule flag rules.guests off leaves them out.
const GUESTS = [];
export function registerGuests(group, defs, handlers = {}) {
  for (const [k, fn] of Object.entries(handlers)) HANDLERS[`${group}.${k}`] = fn;
  for (const def of defs) {
    def.id = `${group}.${def.key}`;
    def.quadrant = def.lean;
    def.copies = def.copies || 1;
    def.guest = group;
    DEFS[def.id] = def;
    if (!GUESTS.includes(def)) GUESTS.push(def);
  }
}
export const guestMembers = () => [...GUESTS];

// Every sphere, so a table can pick any four. A sphere only acts when it's on the table: its scoring, hooks
// and guards are looked up through state.quadrants, and its members only enter decks that include it.
for (const q of [purple, silver, yellow]) registerQuadrant(q);
installMarket();
installThieves();
installTrading();
installBenders();
// Echo goes last: it wraps every action registered so far to record what spaces gave. Gate the wrapper so a
// table without Echo runs each action's own resolve and its state never grows an echo ledger.
installEcho();
for (const q of Object.values(QUADRANTS)) for (const a of q.actions) {
  const w = a.resolve;
  if (!w.__echo || w.__gated) continue;
  const gated = function (ctx, p) { return (ctx.state.quadrants.includes('echo') ? w : w.__orig).call(this, ctx, p); };
  Object.assign(gated, { __echo: true, __gated: true, __orig: w.__orig });
  a.resolve = gated;
}
