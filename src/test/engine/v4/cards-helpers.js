// Helpers for the card-by-card tests (cards-*.test.js) and the fire-audit gate: a scene on any table, buying by
// card name through real moves, and "does a log line name this card as acting" (Cory: every number on the table
// traces to a log line).
import { createGame, resume, actionAt } from '../../../engine/v4/core.js';
import { move } from './helpers.js';

/**
 * A hand-made position on any table. Like helpers.scene, plus quadrants, rules, slots and a starting log.
 * res / members / bonus are per player; members are def ids; shop is def ids put face up (the rest refills).
 */
export function sceneQ({
  quadrants = ['gold', 'red', 'blue', 'green'], n = 2, seed = 7, round = 1, res = [], members = [], shop = null,
  bonus = [], queue = null, slots = {}, rules = {}, left = 3, discount = [],
} = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants, rules });
  s.queue = []; s.pending = null; s.round = round; s.slots = { ...slots }; s.squats = {}; s.order = []; s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = discount[i] || 0; p.left = left;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no free card of ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: 0 }];
  return resume(s);
}

/** Space key "q-i" of the action named `name` on this table. */
export function spaceOf(s, name) {
  for (let q = 0; q < s.quadrants.length; q++) for (let i = 0; i < 6; i++) {
    try { if (actionAt(s, q, i)?.name === name) return `${q}-${i}`; } catch { /* no such action */ }
  }
  throw new Error(`no space ${name}`);
}

/** In a buy step, recruit the face-up card with this def (paying the default way). */
export function buy(s, def) {
  if (s.pending?.kind !== 'buy') throw new Error(`not buying: ${s.pending?.kind}`);
  const o = s.pending.options.find(x => x.kind === 'card' && s.cards[x.uid].def === def);
  if (!o) throw new Error(`${def} is not buyable; have ${s.pending.options.map(x => x.id).join(', ')}`);
  return move(s, o.id);
}
/** Pass every buy step until the next placement (or a choice / game over). */
export function passBuys(s) { while (s.pending?.kind === 'buy') s = move(s, 'pass'); return s; }
/** Pick the option whose id is `id` or whose value matches pred. */
export const pick = (s, id) => move(s, id);

const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * Does this log line name member `name` as acting (not just moving)? The forms the engine and content use:
 *   "P1's Name: …", "P2 +1 silver (P1's Name).", "P1 uses Name.", "P1 used Name: …", final parts "Name +3",
 *   payment notes "(2 gold; Name saves 2)" / "(…; Name: gold counts double)".
 * Lines that only move the card (traded, heisted, copied, recruited, released) don't count for it.
 */
export function namesCard(line, name) {
  const n = esc(name);
  // strip mentions where the card is the object being moved: "for P2's Name", "heist: P2's Name", "gets P2's Name"
  const l = line.replace(new RegExp(`(?:traded \\S+(?: [^ ]+)*? for|heist:|gets|copies|copied|took|recruited|released|sent|let) (?:\\S+'s )?${n}`, 'g'), '');
  if (/\btraded\b|pulled a heist/.test(l) && !new RegExp(`^\\S+'s ${n}\\b`).test(l)) return false;
  return new RegExp(`'s ${n}(?![\\w'-])|\\b(?:uses|used) ${n}(?![\\w'-])|^${n} \\+\\d|[;,(] ?${n}(?: saves|:| reaches)`).test(l);
}
/** All log lines that name `name` as acting. */
export const linesNaming = (log, name) => log.filter(l => namesCard(l, name));
