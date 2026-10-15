// Saved hot-seat games stopped on the dialogs pod's moments, for P1 (the only person) on the Classic table:
//  paySave: P1's pay step for a member or a follower buy, with the resources, members and discount the test sets.
//  swapSave: P1's swap choice (Even Swap, ring I; Swap Sides, ring II), with members on every seat so a swap has
//  several pairs to pick from.
// Used by the pay and swap gates (e2e/v4/pay.mjs) and the before/after shots in design/eval/dialogs/.
import { createGame, applyMove, chooseBotMove, quadrant, cardDef, defById, TIERS } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';
import { freeCard } from './deal.mjs';

export const DIALOG_TABLE = ['gold', 'red', 'market', 'echo'];
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const wrap = s => { s.build = buildStamp(); return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }; };

// hand a member (by def id) to a player, from wherever it waits (the pile or the shop); a member the cull leaves out
// of the deck (Talent Scout, Hustler, Coin Purse…) is minted (lib/deal.mjs)
function give(s, pid, defId) {
  const c = s.cards[freeCard(s, defId)];
  s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
  s.players[pid].members.push(c.uid); c.recruitedRound = 0; c.recruitedBy = pid;
  return c.uid;
}
// put a member (by def id) face up in the shop's first place
function faceUp(s, defId) {
  if (s.shop.some(u => s.cards[u].def === defId)) return s.shop.find(u => s.cards[u].def === defId);
  const c = s.cards[freeCard(s, defId)]; // (from the pile, or minted if the cull leaves it out)
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
export function paySave({ def = 'gold.prospector', tier = null, res = { gold: 3, red: 2, blue: 2, green: 3 }, members = [], discount = 0, seed = 3, rivals = null } = {}) {
  const s = playTo(seed, st => st.round >= 1 && st.pending && st.pending.player === 0 && st.pending.kind === 'buy');
  if (!s) throw new Error('dialog-save: never reached P1’s buy step');
  s.players[0].res = { ...res };
  // rivals: resources every rival holds (a lead P1 has or hasn't)
  if (rivals) for (const q of s.players.slice(1)) q.res = { ...q.res, ...rivals };
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
  const MINE = ['gold.prospector', 'red.volunteer'], THEIRS = [['gold.taxman', 'red.host'], ['red.twins', 'red.bigfamily'], ['gold.merchant']]; // (the cull took red.drive and gold.coinpurse out of the deck)
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

/** P1 on Swap Sides in round III with a crowd: every seat holds `extra` more members (blind panel: the rivals' row ran
 *  off the card over the shop). */
export function swapCrowdSave(extra = 7) {
  const q = DIALOG_TABLE.indexOf('red'), i = quadrant('red').actions.findIndex(a => a.key === 'trade');
  for (let seed = 1; seed < 300; seed++) {
    const s = playTo(seed, st => st.round === 3 && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === `slot:${q}-${i}`));
    if (!s) continue;
    const free = Object.values(s.cards).filter(c => s.pile.includes(c.uid));
    for (let p = 0; p < s.players.length; p++) for (const c of free.splice(0, extra)) give(s, p, c.def);
    const t = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
    if (!(t.pending && t.pending.player === 0 && t.pending.kind === 'choose' && t.pending.options.every(o => o.kind === 'trade') && t.pending.options.length >= 20)) continue;
    return wrap(t);
  }
  throw new Error('dialog-save: never reached P1 on a crowded round-III Swap Sides');
}

// Choices whose answers are combinations, picked in two steps on the board: Good Deed (a color × a rival), Trade
// Seeds (a color you give × a color you get), Sweet Talk (a color × how many).
export const COMBO_TABLE = ['silver', 'red', 'yellow', 'echo'];
const COMBOS = { gooddeed: ['silver', 'alms'], seeds: ['yellow', 'transmute'], sweettalk: ['silver', 'tongue'] };
export function comboSave(space = 'gooddeed') {
  const [qid, key] = COMBOS[space];
  const q = COMBO_TABLE.indexOf(qid), i = quadrant(qid).actions.findIndex(a => a.key === key), ring = quadrant(qid).actions[i].ring;
  for (let seed = 1; seed < 300; seed++) {
    let s = createGame({ seats: SEATS, seed, quadrants: COMBO_TABLE });
    const rand = seededRandom(seed);
    const ready = st => st.round === ring && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === `slot:${q}-${i}`);
    for (let n = 0; n < 2000 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s)) continue;
    s.players[0].res = { silver: 3, red: 2, yellow: 1, green: 2 };
    const t = applyMove(s, { player: 0, option: `slot:${q}-${i}` });
    if (!(t.pending && t.pending.player === 0 && t.pending.kind === 'choose' && t.pending.options.length >= 4)) continue;
    return wrap(t);
  }
  throw new Error(`dialog-save: never reached P1 on ${space}`);
}

// A color of yours asked by a space (Goody Bags, Cheap Seats): answered on the card at the space (Cory, 2026-10-15:
// choices come to where you act). P1 holds some of every color, so Cheap Seats offers all four.
export const COLOR_TABLE = ['silver', 'gold', 'trading', 'red'];
const COLOR_SPACES = { goody: ['silver', 'gift'], cheap: ['trading', 'buylow'] };
export function colorSave(space = 'goody') {
  const [qid, key] = COLOR_SPACES[space];
  const slot = slotOf(COLOR_TABLE, qid, key);
  for (let seed = 1; seed < 300; seed++) {
    const s = playToOn(COLOR_TABLE, seed, st => st.round >= 1 && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && st.pending.options.some(o => o.id === slot));
    if (!s) continue;
    s.players[0].res = { silver: 2, gold: 3, white: 1, red: 2 };
    const t = applyMove(s, { player: 0, option: slot });
    if (t.pending && t.pending.player === 0 && t.pending.kind === 'choose' && t.pending.options.filter(o => o.target).length >= 3) return wrap(t);
  }
  throw new Error(`dialog-save: never reached P1 on ${space}`);
}

// Wave-2 tester B's moments (#8–#12): Snap Up's payment, Talent Scout's top 5, Your Call, Release, Double Agent.
export const BOARD_TABLE = ['echo', 'red', 'market', 'thieves'];
export const CALL_TABLE = ['gold', 'red', 'trading', 'echo'];
/** Bots play until P1 is asked `kind` (in round `round` or later), then P1's resources and members are set. */
function at(table, kind, { round = 1, res = null, members = [], seed = 3, need = () => true, fresh = true } = {}) {
  for (let sd = seed; sd < seed + 200; sd++) {
    const s = playToOn(table, sd, st => st.round >= round && st.pending && st.pending.player === 0 && st.pending.kind === kind && need(st));
    if (!s) continue;
    if (res) s.players[0].res = { ...res };
    s.pile.push(...s.players[0].members); s.players[0].members = [];
    for (const d of members) give(s, 0, d);
    s.players[0].discount = 0;
    if (fresh) resume(s); // (an empty buy step would be skipped: a caller adding members resumes itself)
    return s;
  }
  throw new Error(`dialog-save: never reached P1's ${kind}`);
}
function playToOn(table, seed, ready) {
  let s = createGame({ seats: SEATS, seed, quadrants: table });
  const rand = seededRandom(seed);
  for (let n = 0; n < 2000 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  return ready(s) ? s : null;
}
const slotOf = (table, qid, key) => `slot:${table.indexOf(qid)}-${quadrant(qid).actions.findIndex(a => a.key === key)}`;
export function momentSave(name) {
  if (name === 'snappay') {
    // Snap Up, then a member with several ways to pay (any colors)
    const slot = slotOf(BOARD_TABLE, 'market', 'bargain');
    const s0 = at(BOARD_TABLE, 'place', { res: { green: 2, red: 2, blue: 1, magenta: 2 }, need: st => st.pending.options.some(o => o.id === slot) });
    const s = applyMove(s0, { player: 0, option: slot });
    const o = s.pending && s.pending.options.find(x => x.kind === 'card' && applyMove(s, { player: 0, option: x.id }).pending?.options?.filter(y => y.kind === 'pay').length > 1);
    if (!o) throw new Error('dialog-save: no Snap Up member with two ways to pay');
    return wrap(applyMove(s, { player: 0, option: o.id }));
  }
  if (name === 'scout') {
    // Talent Scout used in the buy step: the top 5 of the pile, some you can pay for
    const s = at(BOARD_TABLE, 'buy', { res: { green: 3, red: 3, blue: 3, magenta: 3 }, members: ['market.blackmarket'] });
    const use = s.pending.options.find(o => o.id.startsWith('use:'));
    if (!use) throw new Error('dialog-save: Talent Scout not usable');
    return wrap(applyMove(s, { player: 0, option: use.id }));
  }
  if (name === 'yourcall' || name === 'yourcall3') {
    // round III's Your Call has four answers (w4b #4: they opened as a wide strip mid-wheel)
    const round = name === 'yourcall3' ? 3 : 2;
    const slot = slotOf(CALL_TABLE, 'trading', 'pawn');
    const s = at(CALL_TABLE, 'place', { round, res: { gold: 1, red: 1, white: 1, green: 1 }, need: st => st.round === round && st.pending.options.some(o => o.id === slot) });
    return wrap(applyMove(s, { player: 0, option: slot }));
  }
  if (name === 'release') {
    // the buy step, holding members recruited in an earlier round (releasable)
    const s = at(BOARD_TABLE, 'buy', { round: 2, res: { green: 0, red: 0, blue: 0, magenta: 0 }, fresh: false });
    // three members with a colored part, from the pile, recruited in round I
    for (const u of s.pile.filter(x => defById(s.cards[x].def).s > 0 && BOARD_TABLE.includes(defById(s.cards[x].def).quadrant)).slice(0, 3)) give(s, 0, s.cards[u].def);
    s.players[0].releasedRound = 0;
    resume(s);
    if (!s.pending.options.some(o => o.kind === 'release')) throw new Error('dialog-save: nothing to release');
    return wrap(s);
  }
  if (name === 'doubleagent') {
    // recruiting Double Agent in the buy step: its forced swap asks on the board
    const s = at(BOARD_TABLE, 'buy', { round: 2, res: { green: 0, red: 0, blue: 0, magenta: 4 }, fresh: false });
    for (const pid of [1, 2, 3]) if (!s.players[pid].members.length) give(s, pid, ['red.host', 'red.bigfamily', 'thieves.crew'][pid - 1]);
    const uid = faceUp(s, 'thieves.doubleagent');
    s.players[0].res = { green: 0, red: 0, blue: 0, magenta: 6 };
    resume(s);
    let t = applyMove(s, { player: 0, option: `card:${uid}` });
    if (t.pending && t.pending.kind === 'pay') t = applyMove(t, { player: 0, option: t.pending.options.find(o => o.kind === 'pay').id });
    return wrap(t);
  }
  throw new Error(`dialog-save: unknown moment ${name}`);
}

/** The member a pay save is for, by name (for messages). */
export const payName = save => (save.state.pending.uid != null ? cardDef(save.state, save.state.pending.uid).name : `${TIERS.find(t => t.key === save.state.pending.tier).get} followers`);
