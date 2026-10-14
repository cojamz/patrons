// Content registry. Every quadrant is a self-contained module; the engine looks them up by id.
import gold from './gold.js';
import red from './red.js';
import { blue, green } from './standins.js';

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
