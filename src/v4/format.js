// Display helpers. No rules here: everything is read off engine state.
import { quadrant, cardDef, defById, roman, TIERS, RING_VALUE } from '../engine/v4/index.js';

export const PLAYER_COLORS = ['#f4efe2', '#ff8fb1', '#b9a2ff', '#ffa94d'];
export const playerColor = id => PLAYER_COLORS[id % PLAYER_COLORS.length];
export const resColor = r => `var(--${r})`;
export { roman };

export const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Scoring banner text for a quadrant on a ring, e.g. "MOST GOLD +2". */
export const bannerText = (qid, ring) => `${quadrant(qid).scoring.label.toUpperCase()}  +${RING_VALUE[ring - 1]}`;

/** Group a player's members into chips. Identical cards in identical states share one chip. */
export function memberChips(state, p) {
  const out = new Map();
  for (const uid of p.members) {
    const c = state.cards[uid];
    const d = cardDef(state, uid);
    const extra = c.copy ? ` → ${defById(c.copy).name}` : c.color ? ` · ${quadrant(c.color).name}` : '';
    const key = [d.id, c.used ? 'u' : '', c.on === false ? 'off' : '', c.copy || '', c.color || ''].join('|');
    if (!out.has(key)) out.set(key, { key, uids: [], def: d, card: c, label: d.name + extra, count: 0 });
    const g = out.get(key);
    g.uids.push(uid);
    g.count += 1;
  }
  return [...out.values()];
}

export function costParts(def) {
  const parts = [];
  if (def.s) parts.push({ color: def.quadrant, n: def.s });
  if (def.w) parts.push({ color: 'any', n: def.w });
  return parts;
}

export const tierCostText = t => (t.colors === 1 ? `${t.cost} of anything` : `${t.cost}, ${t.colors}+ colors`);
export { TIERS };

/**
 * Header line, phrased for people. `me` is true when the seat to act is controlled here.
 * Returns { who, text } where who is the acting player (or null).
 */
export function promptFor(state, mine) {
  if (state.over) return { who: null, text: 'Game over' };
  const pend = state.pending;
  if (!pend) return { who: null, text: '' };
  const p = state.players[pend.player];
  const name = p.name;
  switch (pend.kind) {
    case 'setup': {
      const k = (pend.prompt.match(/\((\d) of 2\)/) || [])[1] || '';
      return mine
        ? { who: p, text: `Pick a starting resource${k ? ` (${k} of 2)` : ''}` }
        : { who: p, text: `${name} is picking a starting resource` };
    }
    case 'place':
      return mine
        ? { who: p, text: `Place a worker on a glowing space` }
        : { who: p, text: `${name} is placing a worker` };
    case 'buy':
      return mine
        ? { who: p, text: 'Recruit a member, buy followers, or pass' }
        : { who: p, text: `${name} is shopping` };
    case 'pay':
      return mine ? { who: p, text: 'Choose how to pay' } : { who: p, text: `${name} is paying` };
    case 'choose':
      return mine ? { who: p, text: pend.prompt } : { who: p, text: `${name} is deciding: ${pend.prompt}` };
    default:
      return { who: p, text: pend.prompt };
  }
}

/** Follower breakdown for the results table. */
export function breakdown(state, p) {
  const members = p.members.reduce((s, u) => s + cardDef(state, u).f, 0);
  const endGame = p.final ? p.final.total : 0;
  const bought = p.bonus - p.contest - endGame;
  return { self: 1, members, contests: p.contest, bought, endGame, parts: p.final ? p.final.parts : [] };
}
