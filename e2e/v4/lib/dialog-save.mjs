// Saved hot-seat games stopped on the dialogs pod's moments, for P1 (the only person) on the Classic table:
//  paySave: P1's pay step for a member or a follower buy, with the resources, members and discount the test sets.
//  swapSave: P1's swap choice (Even Swap, ring I; Swap Sides, ring II), with members on every seat so a swap has
//  several pairs to pick from.
// Used by the pay and swap gates (e2e/v4/pay.mjs) and the before/after shots in design/eval/dialogs/.
import { createGame, applyMove, chooseBotMove, quadrant, cardDef, TIERS } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';

export const DIALOG_TABLE = ['gold', 'red', 'market', 'echo'];
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const wrap = s => { s.build = buildStamp(); return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }; };

// hand a member (by def id) to a player, from wherever it waits (the pile or the shop)
function give(s, pid, defId) {
  const c = Object.values(s.cards).find(x => x.def === defId && !s.players.some(p => p.members.includes(x.uid)));
  if (!c) throw new Error(`dialog-save: no free ${defId}`);
  s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
  s.players[pid].members.push(c.uid); c.recruitedRound = 0; c.recruitedBy = pid;
  return c.uid;
}
// put a member (by def id) face up in the shop's first place
function faceUp(s, defId) {
  if (s.shop.some(u => s.cards[u].def === defId)) return s.shop.find(u => s.cards[u].def === defId);
  const c = Object.values(s.cards).find(x => x.def === defId && s.pile.includes(x.uid));
  if (!c) throw new Error(`dialog-save: ${defId} is not in the pile`);
  s.pile = s.pile.filter(u => u !== c.uid);
  s.pile.push(s.shop[0]);
  s.shop[0] = c.uid;
  return c.uid;
}

/** Bots play every seat (P1 too) until P1 is asked `kind` in round `round` or later. */
function playTo(seed, ready) {
  let s = createGame({ seats: SEATS, seed, quadrants: DIALOG_TABLE });
  const rand = seededRandom(seed);
  for (let n = 0; n < 2000 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  return ready(s) ? s : null;
}

/**
 * P1 in the pay step. what: { def } a member (made face up) or { tier } a follower buy ('small' | 'mid' | 'big' | 'top').
 * res: P1's resources; members: P1's member def ids; discount: P1's discount.
 */
export function paySave({ def = 'gold.prospector', tier = null, res = { gold: 3, red: 2, blue: 2, green: 3 }, members = [], discount = 0, seed = 3 } = {}) {
  const s = playTo(seed, st => st.round >= 1 && st.pending && st.pending.player === 0 && st.pending.kind === 'buy');
  if (!s) throw new Error('dialog-save: never reached P1’s buy step');
  s.players[0].res = { ...res };
  // exactly the members asked for (bot play may have recruited a rule-changer, like Freelancer)
  s.pile.push(...s.players[0].members); s.players[0].members = [];
  for (const d of members) give(s, 0, d);
  s.players[0].discount = discount;
  let option;
  if (tier) option = `tier:${tier}`;
  else option = `card:${faceUp(s, def)}`;
  resume(s);
  if (!s.pending.options.some(o => o.id === option)) throw new Error(`dialog-save: ${option} is not on offer (${s.pending.options.map(o => o.id).join(' ')})`);
  const t = applyMove(s, { player: 0, option });
  if (!t.pending || t.pending.kind !== 'pay') throw new Error(`dialog-save: ${option} opened no pay step`);
  return wrap(t);
}

/** P1 choosing a swap: space 'evenswap' (ring I) or 'trade' (Swap Sides, ring II). */
export function swapSave(space = 'evenswap') {
  const q = DIALOG_TABLE.indexOf('red'), i = quadrant('red').actions.findIndex(a => a.key === space), ring = quadrant('red').actions[i].ring;
  // members everywhere: two of yours with equal-cost twins on two rivals (Even Swap), plus a dearer one (Swap Sides)
  const MINE = ['gold.prospector', 'red.drive'], THEIRS = [['gold.taxman', 'red.host'], ['gold.coinpurse', 'red.bigfamily'], ['gold.merchant']];
  for (let seed = 1; seed < 300; seed++) {
    const s = playTo(seed, st => st.round === ring && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === `slot:${q}-${i}`));
    if (!s) continue;
    try {
      for (const d of MINE) give(s, 0, d);
      THEIRS.forEach((ds, k) => ds.forEach(d => give(s, k + 1, d)));
    } catch { continue; }
    const t = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
    if (!(t.pending && t.pending.player === 0 && t.pending.kind === 'choose' && t.pending.options.every(o => o.kind === 'trade') && t.pending.options.length >= 3)) continue;
    return wrap(t);
  }
  throw new Error(`dialog-save: never reached P1 on ${space}`);
}

/** The member a pay save is for, by name (for messages). */
export const payName = save => (save.state.pending.uid != null ? cardDef(save.state, save.state.pending.uid).name : `${TIERS.find(t => t.key === save.state.pending.tier).get} followers`);
